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

// Admin types only colour names; the swatch colour is worked out from the name (grey if unknown).
const COLOR_HEX = {
    red: '#d32f2f', maroon: '#800000', burgundy: '#800020', wine: '#722f37', pink: '#ec7fa9', rose: '#e8738f', magenta: '#c2185b',
    orange: '#f57c00', peach: '#ffb38a', coral: '#ff7f50', rust: '#b7410e', yellow: '#fbc02d', mustard: '#d4a017', gold: '#d4af37',
    green: '#2e7d32', olive: '#708238', lime: '#9acd32', mint: '#98e0b0', teal: '#00897b', turquoise: '#26c6da', sage: '#9caf88', khaki: '#c3b091',
    blue: '#1976d2', navy: '#1a237e', sky: '#6ec6ff', cyan: '#00bcd4', denim: '#3b5b92', indigo: '#3f51b5',
    purple: '#7b1fa2', violet: '#8e24aa', lavender: '#b39ddb', lilac: '#c8a2c8', mauve: '#b784a7',
    brown: '#6d4c41', tan: '#d2b48c', beige: '#d9c7a3', cream: '#f5efdc', ivory: '#f8f4e3', camel: '#c19a6b', coffee: '#5d4037', chocolate: '#4e342e',
    white: '#f5f5f5', offwhite: '#f2efe6', black: '#111111', grey: '#9e9e9e', gray: '#9e9e9e', charcoal: '#36454f', silver: '#c0c0c0',
};
const hexForName = (name) => {
    const words = name.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
    const joined = words.join('');
    if (COLOR_HEX[joined]) return COLOR_HEX[joined];
    const hit = [...words].reverse().find(w => COLOR_HEX[w]);
    return hit ? COLOR_HEX[hit] : '#9ca3af';
};

// Colour options arrive as JSON: [{ "name": "Red" }]. An explicit hex is kept (older products have one).
const parseColorOptions = (raw) => {
    try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        const seen = new Set();
        return arr.slice(0, 12).flatMap(c => {
            const name = String(c?.name || '').trim().slice(0, 30);
            if (!name || seen.has(name.toLowerCase())) return [];
            seen.add(name.toLowerCase());
            const hex = /^#[0-9a-f]{6}$/i.test(c?.hex) ? c.hex : hexForName(name);
            return [{ name, hex }];
        });
    } catch {
        return [];
    }
};

// One colour name per uploaded photo (JSON array, same order as the files); unknown names become blank
const parsePhotoColors = (raw, count, options) => {
    let arr = [];
    try { arr = JSON.parse(raw); } catch { /* none given */ }
    const names = new Set((options || []).map(o => o.name));
    return Array.from({ length: count }, (_, i) => (names.has(arr?.[i]) ? arr[i] : ''));
};

// Only fields present in the body are returned, so partial updates keep other values.
const fieldsFromBody = (b) => {
    const out = {};
    ['name', 'description', 'category', 'subcategory'].forEach(k => { if (b[k] !== undefined) out[k] = b[k]; });
    if (b.ageGroup !== undefined) out.ageGroup = b.ageGroup || undefined;
    if (b.price !== undefined) out.price = Number(b.price);
    if (b.stock !== undefined) out.stock = Math.max(0, parseInt(b.stock, 10) || 0);
    if (b.sizes !== undefined) out.sizes = list(b.sizes);
    if (b.colors !== undefined) out.colors = list(b.colors);
    if (b.colorOptions !== undefined) out.colorOptions = parseColorOptions(b.colorOptions);
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
        const fields = fieldsFromBody(req.body);
        const product = await Product.create({
            ...fields, image: saved[0], images: saved,
            imageColors: parsePhotoColors(req.body.imageColors, saved.length, fields.colorOptions),
        });
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
            product.imageColors = parsePhotoColors(req.body.imageColors, saved.length, product.colorOptions);
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
