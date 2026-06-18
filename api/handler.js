const fetch = require('node-fetch');

const API_BASE = 'https://hatch-social.cstmpanel.com';

function parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return '';
    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    return cookies.map(c => c.split(';')[0]).join('; ');
}

function extractXsrfToken(cookieStr) {
    const match = cookieStr.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

module.exports = async function handler(req, res) {
    // Path comes from rewrite: /api/:path* → /api/handler?_p=:path*
    const apiPath = req.query._p || '';

    // Rebuild query string without internal _p param
    const qs = Object.entries(req.query)
        .filter(([k]) => k !== '_p')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

    const targetUrl = `${API_BASE}/api/${apiPath}${qs ? '?' + qs : ''}`;

    let sessionCookies = '';
    let csrfToken = '';

    // Fetch CSRF before state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        try {
            const csrfRes = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const setCookie = csrfRes.headers.raw()['set-cookie'];
            if (setCookie) {
                sessionCookies = parseCookies(setCookie);
                csrfToken = extractXsrfToken(sessionCookies);
            }
        } catch (e) {}
    }

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
        if (sessionCookies) headers['Cookie'] = sessionCookies;
    }

    const fetchOptions = { method: req.method, headers };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
    }

    try {
        let response = await fetch(targetUrl, fetchOptions);

        // Retry once on 419 CSRF mismatch
        if (response.status === 419) {
            try {
                const csrfRes = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                const setCookie = csrfRes.headers.raw()['set-cookie'];
                if (setCookie) {
                    sessionCookies = parseCookies(setCookie);
                    csrfToken = extractXsrfToken(sessionCookies);
                    headers['X-XSRF-TOKEN'] = csrfToken;
                    headers['Cookie'] = sessionCookies;
                }
            } catch (e) {}
            response = await fetch(targetUrl, { ...fetchOptions, headers });
        }

        const data = await response.text();
        res.status(response.status).setHeader('Content-Type', 'application/json').send(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Proxy error: ' + error.message });
    }
};
