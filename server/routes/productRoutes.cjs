const express = require('express');
const multer = require('multer');
const Product = require('../models/Product.cjs');
const Image = require('../models/Image.cjs');
const { requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Photos are held in memory just long enough to save them to the database.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 },
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

// Admin: create product with photo
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Choose a photo to upload' });
    let image;
    try {
        image = await saveImage(req.file);
        const product = await Product.create({ ...fieldsFromBody(req.body), image });
        res.status(201).json(product);
    } catch (error) {
        await removeImage(image);
        res.status(400).json({ message: error.message });
    }
});

// Admin: update product (optionally replace photo)
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
    let newImage;
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const oldImage = product.image;
        product.set(fieldsFromBody(req.body));
        if (req.file) {
            newImage = await saveImage(req.file);
            product.image = newImage;
        }
        await product.save();
        if (req.file) await removeImage(oldImage);
        res.json(product);
    } catch (error) {
        await removeImage(newImage);
        res.status(400).json({ message: error.message });
    }
});

// Admin: delete product and its photo
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        await removeImage(product.image);
        res.json({ ok: true });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Upload / validation errors
router.use((err, req, res, next) => {
    res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be under 4 MB' : err.message });
});

module.exports = router;
