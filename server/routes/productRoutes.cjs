const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const Product = require('../models/Product.cjs');
const { requireAdmin } = require('../middleware/adminAuth.cjs');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
    storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        cb(EXT[file.mimetype] ? null : new Error('Only JPG, PNG or WebP photos are allowed'), !!EXT[file.mimetype]),
});

const removeFile = (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
    fs.unlink(path.join(UPLOAD_DIR, path.basename(imageUrl)), () => { });
};

const list = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const flag = (v) => v === 'true' || v === true || v === 'on';

// Only fields present in the body are returned, so partial updates keep other values.
const fieldsFromBody = (b) => {
    const out = {};
    ['name', 'description', 'category', 'subcategory'].forEach(k => { if (b[k] !== undefined) out[k] = b[k]; });
    if (b.ageGroup !== undefined) out.ageGroup = b.ageGroup || undefined;
    if (b.price !== undefined) out.price = Number(b.price);
    if (b.stock !== undefined) out.stock = Math.max(0, parseInt(b.stock, 10) || 0);
    if (b.sizes !== undefined) out.sizes = list(b.sizes);
    if (b.colors !== undefined) out.colors = list(b.colors);
    if (b.isNew !== undefined) out.isNew = flag(b.isNew);
    if (b.isTrending !== undefined) out.isTrending = flag(b.isTrending);
    return out;
};

// Public: list products (newest first)
router.get('/', async (req, res) => {
    try {
        res.json(await Product.find({}).sort({ createdAt: -1 }));
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Public: single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) res.json(product);
        else res.status(404).json({ message: 'Product not found' });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin: create product with photo
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Choose a photo to upload' });
    try {
        const product = await Product.create({ ...fieldsFromBody(req.body), image: `/uploads/${req.file.filename}` });
        res.status(201).json(product);
    } catch (error) {
        removeFile(`/uploads/${req.file.filename}`);
        res.status(400).json({ message: error.message });
    }
});

// Admin: update product (optionally replace photo)
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            if (req.file) removeFile(`/uploads/${req.file.filename}`);
            return res.status(404).json({ message: 'Product not found' });
        }
        const oldImage = product.image;
        product.set(fieldsFromBody(req.body));
        if (req.file) product.image = `/uploads/${req.file.filename}`;
        await product.save();
        if (req.file) removeFile(oldImage);
        res.json(product);
    } catch (error) {
        if (req.file) removeFile(`/uploads/${req.file.filename}`);
        res.status(400).json({ message: error.message });
    }
});

// Admin: delete product and its photo
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        removeFile(product.image);
        res.json({ ok: true });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Upload / validation errors
router.use((err, req, res, next) => {
    res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be under 5 MB' : err.message });
});

module.exports = router;
