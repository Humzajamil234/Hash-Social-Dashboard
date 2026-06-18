const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;
const API_BASE = 'https://hatch-social.cstmpanel.com';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store session cookies from the backend
let sessionCookies = '';
let csrfToken = '';

// Helper: parse Set-Cookie headers
function parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return '';
    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    return cookies.map(c => c.split(';')[0]).join('; ');
}

// Helper: extract XSRF token from cookies
function extractXsrfToken(cookieStr) {
    const match = cookieStr.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// Step 1: Get CSRF cookie from Laravel
async function refreshCsrf() {
    try {
        const r = await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        const setCookie = r.headers.raw()['set-cookie'];
        if (setCookie) {
            sessionCookies = parseCookies(setCookie);
            csrfToken = extractXsrfToken(sessionCookies);
        }
    } catch (e) {
        // Sanctum not available - try getting token from main page
        try {
            const r = await fetch(`${API_BASE}/`, {
                headers: { 'Accept': 'text/html' }
            });
            const setCookie = r.headers.raw()['set-cookie'];
            if (setCookie) {
                sessionCookies = parseCookies(setCookie);
                csrfToken = extractXsrfToken(sessionCookies);
            }
        } catch (e2) {}
    }
}

// Proxy all /api/* requests to backend using middleware
app.use('/api', async (req, res) => {
    const targetUrl = `${API_BASE}/api${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    try {
        // For POST/PUT/DELETE, refresh CSRF first
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && !csrfToken) {
            await refreshCsrf();
        }

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        // Forward Authorization header if present
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
            if (sessionCookies) headers['Cookie'] = sessionCookies;
        }

        const fetchOptions = {
            method: req.method,
            headers,
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);

        // If 419 (CSRF mismatch), refresh and retry once
        if (response.status === 419) {
            await refreshCsrf();
            if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
            if (sessionCookies) headers['Cookie'] = sessionCookies;
            const retry = await fetch(targetUrl, { ...fetchOptions, headers });
            const data = await retry.text();

            // Save any new session cookies from login response
            const setCookie = retry.headers.raw()['set-cookie'];
            if (setCookie) {
                const newCookies = parseCookies(setCookie);
                sessionCookies = sessionCookies ? sessionCookies + '; ' + newCookies : newCookies;
                csrfToken = extractXsrfToken(sessionCookies) || csrfToken;
            }

            res.status(retry.status).json(JSON.parse(data));
            return;
        }

        // Save session cookies from response (e.g. after login)
        const setCookie = response.headers.raw()['set-cookie'];
        if (setCookie) {
            const newCookies = parseCookies(setCookie);
            sessionCookies = sessionCookies ? sessionCookies + '; ' + newCookies : newCookies;
            csrfToken = extractXsrfToken(sessionCookies) || csrfToken;
        }

        const data = await response.text();
        res.status(response.status).set('Content-Type', 'application/json').send(data);

    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ success: false, message: 'Proxy error: ' + error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// Named HTML routes (preview strips .html from URLs)
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// Fallback for HTML pages
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize CSRF on startup
refreshCsrf().then(() => {
    console.log('CSRF initialized:', csrfToken ? 'token found' : 'no token (will retry on first POST)');
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
    console.log(`API proxying to: ${API_BASE}`);
});
