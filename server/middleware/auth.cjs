const crypto = require('crypto');

const TTL = { admin: 2 * 60 * 60 * 1000, user: 7 * 24 * 60 * 60 * 1000 };

const secret = () => process.env.ADMIN_TOKEN_SECRET;

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('hex');

// Constant-time comparison that is safe for strings of different lengths.
const safeEqual = (a, b) => {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
};

// role is 'admin' or 'user'; sub is the document id
const issueToken = (role, sub) => {
    const payload = Buffer.from(JSON.stringify({ role, sub: String(sub), exp: Date.now() + TTL[role] })).toString('base64url');
    return `${payload}.${sign(payload)}`;
};

const readToken = (req) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const [payload, sig] = token.split('.');
    if (!secret() || !payload || !sig || !safeEqual(sig, sign(payload))) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        return data.exp > Date.now() ? data : null;
    } catch {
        return null;
    }
};

const requireRole = (...roles) => (req, res, next) => {
    const data = readToken(req);
    if (!data || !roles.includes(data.role)) return res.status(401).json({ message: 'Please sign in to continue' });
    req.auth = data;
    next();
};

// Password hashing with scrypt (built in, no extra dependency)
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    salt,
    hash: crypto.scryptSync(String(password), salt, 64).toString('hex'),
});
const verifyPassword = (password, salt, hash) =>
    !!salt && !!hash && safeEqual(crypto.scryptSync(String(password), salt, 64).toString('hex'), hash);

// Failed-login limiter: 5 failures per key per 15 minutes (in memory)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const limiter = {
    blocked(key) {
        const rec = attempts.get(key);
        return !!rec && Date.now() - rec.first < WINDOW_MS && rec.count >= MAX_FAILS;
    },
    fail(key) {
        const now = Date.now();
        const rec = attempts.get(key);
        const fresh = !rec || now - rec.first >= WINDOW_MS;
        attempts.set(key, { first: fresh ? now : rec.first, count: fresh ? 1 : rec.count + 1 });
    },
    clear(key) { attempts.delete(key); },
};

module.exports = {
    issueToken, readToken, safeEqual, hashPassword, verifyPassword, limiter,
    requireAdmin: requireRole('admin'),
    requireUser: requireRole('user'),
    requireAny: requireRole('admin', 'user'),
};
