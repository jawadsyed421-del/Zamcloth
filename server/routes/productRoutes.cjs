const express = require('express');
const multer = require('multer');
const Product = require('../models/Product.cjs');
const Image = require('../models/Image.cjs');
const { requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

const MAX_PHOTOS = 6;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Photos are held in memory just long enough to save them to the database.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: MAX_PHOTOS },
    fileFilter: (req, file, cb) =>
        cb(TYPES.has(file.mimetype) ? null : new Error('Only JPG, PNG or WebP photos are allowed'), TYPES.has(file.mimetype)),
});

const saveImage = async (file) => {
    const img = await Image.create({ data: file.buffer, contentType: file.mimetype });
    return `/api/images/${img._id}`;
};

const removeImage = async (imageUrl) => {
    const match = /^\/api\/images\/([a-f0-9]{24})$/.exec(imageUrl || '');
    if (match) await Image.deleteOne({ _id: match[1] }).catch(() => { });
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

// Admin: create product with one or several photos (the first is the main photo)
router.post('/', requireAdmin, upload.array('images', MAX_PHOTOS), async (req, res) => {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: 'Choose at least one photo to upload' });
    const saved = [];
    try {
        for (const f of files) saved.push(await saveImage(f));
        const product = await Product.create({ ...fieldsFromBody(req.body), image: saved[0], images: saved });
        res.status(201).json(product);
    } catch (error) {
        await Promise.all(saved.map(removeImage));
        res.status(400).json({ message: error.message });
    }
});

// Admin: update product (new photos, if sent, replace the old gallery)
router.put('/:id', requireAdmin, upload.array('images', MAX_PHOTOS), async (req, res) => {
    const saved = [];
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const oldPhotos = [product.image, ...(product.images || [])];
        product.set(fieldsFromBody(req.body));
        if (req.files?.length) {
            for (const f of req.files) saved.push(await saveImage(f));
            product.image = saved[0];
            product.images = saved;
        }
        await product.save();
        if (saved.length) await Promise.all([...new Set(oldPhotos)].map(removeImage));
        res.json(product);
    } catch (error) {
        await Promise.all(saved.map(removeImage));
        res.status(400).json({ message: error.message });
    }
});

// Admin: delete product and its photo
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await Promise.all([...new Set([product.image, ...(product.images || [])])].map(removeImage));
        res.json({ ok: true });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Upload / validation errors
router.use((err, req, res, next) => {
    res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 4 MB' : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload up to ${MAX_PHOTOS} photos` : err.message });
});

module.exports = router;
