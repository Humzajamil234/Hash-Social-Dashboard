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
    const pathParts = req.query.path || [];
    const apiPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

    // Rebuild query string without the 'path' param
    const qs = Object.entries(req.query)
        .filter(([k]) => k !== 'path')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

    const targetUrl = `${API_BASE}/api/${apiPath}${qs ? '?' + qs : ''}`;

    let sessionCookies = '';
    let csrfToken = '';

    // For state-changing requests, fetch CSRF cookie first
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

        // 419 CSRF mismatch — retry once with fresh CSRF
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
