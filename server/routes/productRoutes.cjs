const express = require('express');
const multer = require('multer');
const Product = require('../models/Product.cjs');
const Image = require('../models/Image.cjs');
const { requireAdmin } = require('../middleware/auth.cjs');
const { createWorkbook, readSpreadsheetRows } = require('../utils/spreadsheets.cjs');

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
const spreadsheetUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
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
    if (b.productCode !== undefined) out.productCode = String(b.productCode).trim().toUpperCase();
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

router.get('/bulk-template', requireAdmin, async (req, res) => {
    const headers = ['productCode', 'name', 'description', 'price', 'category', 'subcategory', 'stock', 'image', 'sizes', 'colors', 'ageGroup', 'isNew', 'isTrending'];
    const buffer = await createWorkbook([{ name: 'Products', columns: headers }]);
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="zamcloth-product-template.xlsx"',
    }).send(buffer);
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
    if (!String(req.body.productCode || '').trim()) return res.status(400).json({ message: 'Enter a product code' });
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
        if (error.code === 11000) return res.status(409).json({ message: 'That product code already exists. Product codes must be unique.' });
        res.status(400).json({ message: error.message });
    }
});

// Admin: import products from the first sheet of an Excel or CSV file.
router.post('/bulk-upload', requireAdmin, spreadsheetUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Choose an Excel or CSV file to upload' });
        const rows = await readSpreadsheetRows(req.file);
        if (!rows.length || rows.length > 1000) return res.status(400).json({ message: 'The file must contain between 1 and 1,000 product rows' });

        const required = ['productCode', 'name', 'description', 'price', 'category', 'subcategory', 'stock', 'image'];
        const errors = [];
        const codes = new Set();
        const products = rows.map((row, index) => {
            const line = index + 2;
            const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value]));
            const value = (key) => String(normalized[key.toLowerCase()] ?? '').trim();
            const productCode = value('productCode').toUpperCase();
            const price = Number(value('price'));
            const stock = Number(value('stock'));
            if (!['Women', 'Kids', 'Men'].includes(value('category'))) errors.push(`Row ${line}: category must be Women, Kids, or Men`);
            if (required.some(key => !value(key))) errors.push(`Row ${line}: productCode, name, description, price, category, subcategory, stock, and image are required`);
            if (!productCode || productCode.length > 60) errors.push(`Row ${line}: productCode must be 1–60 characters`);
            if (codes.has(productCode)) errors.push(`Row ${line}: duplicate productCode "${productCode}" in this file`);
            codes.add(productCode);
            if (!Number.isFinite(price) || price <= 0) errors.push(`Row ${line}: price must be greater than zero`);
            if (!Number.isInteger(stock) || stock < 0) errors.push(`Row ${line}: stock must be a non-negative whole number`);
            let image = '';
            try {
                const url = new URL(value('image'));
                if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
                image = url.toString();
            } catch {
                errors.push(`Row ${line}: image must be an absolute HTTP or HTTPS URL`);
            }
            return {
                productCode, name: value('name').slice(0, 80), description: value('description').slice(0, 500),
                price, category: value('category'), subcategory: value('subcategory'),
                ageGroup: value('ageGroup') || undefined, stock, image, images: [image],
                sizes: list(value('sizes')), colors: list(value('colors')),
                isNew: flag(value('isNew')), isTrending: flag(value('isTrending')),
            };
        });
        if (errors.length) return res.status(400).json({ message: errors.slice(0, 30).join('\n'), errors });

        const existing = await Product.find({ productCode: { $in: [...codes] } }).select('productCode').lean();
        if (existing.length) return res.status(409).json({ message: `Product codes already exist: ${existing.map(p => p.productCode).join(', ')}` });
        const created = await Product.insertMany(products, { ordered: true });
        res.status(201).json({ imported: created.length });
    } catch (error) {
        if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Excel or CSV files must be under 10 MB' });
        if (error.code === 11000) return res.status(409).json({ message: 'A product code already exists. No duplicate product codes are allowed.' });
        if (error.message === 'Upload an .xlsx or .csv file') return res.status(400).json({ message: error.message });
        console.error('Product bulk import failed:', error.message);
        res.status(400).json({ message: 'Could not import products. Check that the file is a valid Excel or CSV sheet.' });
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
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: req.path === '/bulk-upload' ? 'Excel or CSV files must be under 10 MB' : 'Each photo must be under 4 MB' });
    }
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload up to ${MAX_PHOTOS} photos` : err.message });
});

module.exports = router;
