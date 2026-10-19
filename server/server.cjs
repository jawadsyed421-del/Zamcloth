const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db.cjs');

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (process.env.ADMIN_TOKEN_SECRET || '').length < 32) {
    console.error('ADMIN_TOKEN_SECRET must be set to a random string of at least 32 characters');
    process.exit(1);
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Render's proxy, so req.ip is the real visitor address

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Connect Database
connectDB().then(() => require('./routes/adminRoutes.cjs').syncAdminFromEnv()).catch(e => console.error('Admin setup failed:', e.message));

// Routes
app.use('/api/auth', require('./routes/authRoutes.cjs'));
app.use('/api/admin', require('./routes/adminRoutes.cjs'));
app.use('/api/products', require('./routes/productRoutes.cjs'));
app.use('/api/orders', require('./routes/orderRoutes.cjs'));
app.use('/api/payment', require('./routes/paymentRoutes.cjs'));

// Product photos stored in the database
app.get('/api/images/:id', async (req, res) => {
    try {
        if (!/^[a-f0-9]{24}$/.test(req.params.id)) return res.status(404).end();
        const img = await require('./models/Image.cjs').findById(req.params.id);
        if (!img) return res.status(404).end();
        res.set('Content-Type', img.contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(img.data);
    } catch {
        res.status(404).end();
    }
});

// Serve the built website (npm run build) from the same server
const DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(path.join(DIST, 'index.html'))) {
    app.use(express.static(DIST, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(DIST, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.send('API is running...'));
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
