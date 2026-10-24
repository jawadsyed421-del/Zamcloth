const express = require('express');
const multer = require('multer');
const Hero = require('../models/Hero.cjs');
const Image = require('../models/Image.cjs');
const { requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();

const MAX_SLIDES = 6;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: MAX_SLIDES },
    fileFilter: (req, file, cb) =>
        cb(TYPES.has(file.mimetype) ? null : new Error('Only JPG, PNG or WebP photos are allowed'), TYPES.has(file.mimetype)),
});

const getHero = async () => (await Hero.findOne({ key: 'home' })) || new Hero({ key: 'home', images: [] });

// Public: banner photos for the home page
router.get('/', async (req, res) => {
    try {
        res.json({ images: (await getHero()).images });
    } catch {
        res.json({ images: [] });
    }
});

// Admin: add photos (up to 6 in total). Two or more photos make the banner slide automatically.
router.post('/', requireAdmin, upload.array('images', MAX_SLIDES), async (req, res) => {
    const saved = [];
    try {
        const hero = await getHero();
        const files = req.files || [];
        if (files.length === 0) return res.status(400).json({ message: 'Choose at least one photo' });
        if (hero.images.length + files.length > MAX_SLIDES) {
            return res.status(400).json({ message: `The banner can hold up to ${MAX_SLIDES} photos. Remove one first.` });
        }
        for (const f of files) {
            const img = await Image.create({ data: f.buffer, contentType: f.mimetype });
            saved.push(`/api/images/${img._id}`);
        }
        hero.images.push(...saved);
        await hero.save();
        res.status(201).json({ images: hero.images });
    } catch (error) {
        await Promise.all(saved.map(u => Image.deleteOne({ _id: u.split('/').pop() }).catch(() => { })));
        res.status(400).json({ message: error.message });
    }
});

// Admin: remove one photo
router.delete('/', requireAdmin, async (req, res) => {
    try {
        const url = String(req.body?.url || '');
        const hero = await getHero();
        if (!hero.images.includes(url)) return res.status(404).json({ message: 'Photo not found' });
        hero.images = hero.images.filter(u => u !== url);
        await hero.save();
        const id = /^\/api\/images\/([a-f0-9]{24})$/.exec(url)?.[1];
        if (id) await Image.deleteOne({ _id: id }).catch(() => { });
        res.json({ images: hero.images });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin: move a photo one place earlier or later
router.put('/move', requireAdmin, async (req, res) => {
    try {
        const { url, direction } = req.body || {};
        const hero = await getHero();
        const i = hero.images.indexOf(url);
        const j = direction === 'left' ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= hero.images.length) return res.status(400).json({ message: 'Cannot move that photo' });
        const next = [...hero.images];
        [next[i], next[j]] = [next[j], next[i]];
        hero.images = next;
        await hero.save();
        res.json({ images: hero.images });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.use((err, req, res, next) => {
    res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 4 MB' : err.message });
});

module.exports = router;
