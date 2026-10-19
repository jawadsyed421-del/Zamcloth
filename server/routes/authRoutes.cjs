const express = require('express');
const User = require('../models/User.cjs');
const { issueToken, hashPassword, verifyPassword, limiter, requireUser } = require('../middleware/auth.cjs');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone });

router.post('/register', async (req, res) => {
    try {
        const { name = '', email = '', phone = '', password = '' } = req.body || {};
        if (!name.trim()) return res.status(400).json({ message: 'Enter your name' });
        if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
        if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

        const { salt, hash } = hashPassword(password);
        const user = await User.create({
            name: name.trim(), email, phone: phone.trim(), passwordHash: hash, passwordSalt: salt, lastLoginAt: new Date(),
        });
        res.status(201).json({ token: issueToken('user', user._id), user: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
        res.status(500).json({ message: 'Could not create the account' });
    }
});

router.post('/login', async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const key = `user:${req.ip}:${String(email).toLowerCase()}`;
    if (limiter.blocked(key)) return res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash +passwordSalt');
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        limiter.fail(key);
        return res.status(401).json({ message: 'Wrong email or password' });
    }
    limiter.clear(key);
    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: issueToken('user', user._id), user: publicUser(user) });
});

router.get('/me', requireUser, async (req, res) => {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(401).json({ message: 'Please sign in to continue' });
    res.json({ user: publicUser(user) });
});

module.exports = router;
