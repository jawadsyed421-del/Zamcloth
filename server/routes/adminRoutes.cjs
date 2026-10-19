const express = require('express');
const { issueToken, requireAdmin, safeEqual } = require('../middleware/adminAuth.cjs');

const router = express.Router();

// In-memory brute-force guard: 5 failures per IP per 15 minutes.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

router.post('/login', (req, res) => {
    const ip = req.ip;
    const now = Date.now();
    const rec = attempts.get(ip);
    if (rec && now - rec.first < WINDOW_MS && rec.count >= MAX_FAILS) {
        return res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' });
    }

    const { username = '', password = '' } = req.body || {};
    const ok = process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD &&
        safeEqual(username, process.env.ADMIN_USERNAME) &&
        safeEqual(password, process.env.ADMIN_PASSWORD);

    if (!ok) {
        const fresh = !rec || now - rec.first >= WINDOW_MS;
        attempts.set(ip, { first: fresh ? now : rec.first, count: fresh ? 1 : rec.count + 1 });
        return res.status(401).json({ message: 'Wrong username or password' });
    }

    attempts.delete(ip);
    res.json({ token: issueToken() });
});

router.get('/verify', requireAdmin, (req, res) => res.json({ ok: true }));

module.exports = router;
