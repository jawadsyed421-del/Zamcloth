const express = require('express');
const Admin = require('../models/Admin.cjs');
const { issueToken, requireAdmin, hashPassword, verifyPassword, limiter } = require('../middleware/auth.cjs');

const router = express.Router();

// Keeps the admin account in the database in sync with ADMIN_USERNAME / ADMIN_PASSWORD in .env.
// Change the values in .env and restart the server to rotate the admin login.
const syncAdminFromEnv = async () => {
    const { ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
    if (!username || !password) {
        console.warn('ADMIN_USERNAME / ADMIN_PASSWORD not set: admin login is disabled');
        return;
    }
    const existing = await Admin.findOne({ username }).select('+passwordHash +passwordSalt');
    if (existing && verifyPassword(password, existing.passwordSalt, existing.passwordHash)) return;

    const { salt, hash } = hashPassword(password);
    await Admin.deleteMany({ username: { $ne: username } }); // single-admin store: .env is the source of truth
    await Admin.findOneAndUpdate({ username }, { username, passwordHash: hash, passwordSalt: salt }, { upsert: true });
    console.log(`Admin account "${username}" saved to the database`);
};

router.post('/login', async (req, res) => {
    const key = `admin:${req.ip}`;
    if (limiter.blocked(key)) return res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' });

    const { username = '', password = '' } = req.body || {};
    const admin = await Admin.findOne({ username: String(username).trim() }).select('+passwordHash +passwordSalt');
    if (!admin || !verifyPassword(password, admin.passwordSalt, admin.passwordHash)) {
        limiter.fail(key);
        return res.status(401).json({ message: 'Wrong username or password' });
    }
    limiter.clear(key);
    admin.lastLoginAt = new Date();
    await admin.save();
    res.json({ token: issueToken('admin', admin._id) });
});

router.get('/verify', requireAdmin, (req, res) => res.json({ ok: true }));

router.syncAdminFromEnv = syncAdminFromEnv;
module.exports = router;
