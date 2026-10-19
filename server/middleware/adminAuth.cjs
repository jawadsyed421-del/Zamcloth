const crypto = require('crypto');

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const secret = () => process.env.ADMIN_TOKEN_SECRET;

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('hex');

const safeEqual = (a, b) => {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
};

const issueToken = () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
    return `${payload}.${sign(payload)}`;
};

const requireAdmin = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const [payload, sig] = token.split('.');
    if (!secret() || !payload || !sig || !safeEqual(sig, sign(payload))) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    try {
        const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (!exp || exp < Date.now()) return res.status(401).json({ message: 'Session expired' });
    } catch {
        return res.status(401).json({ message: 'Not authorized' });
    }
    next();
};

module.exports = { issueToken, requireAdmin, safeEqual };
