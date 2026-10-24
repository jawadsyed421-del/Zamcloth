const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User.cjs');
const { requireUser } = require('../middleware/auth.cjs');

const router = express.Router();
const MAX_ADDRESSES = 10;

const str = (v, max) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cleans and checks one address from the browser. Returns { value } or { error }.
const readAddress = (b = {}, fallbackEmail = '') => {
    const value = {
        fullName: str(b.fullName, 100),
        phone: String(b.phone ?? '').replace(/\D/g, '').slice(-10),
        email: str(b.email || fallbackEmail, 120),
        address: str(b.address, 200),
        city: str(b.city, 80),
        postalCode: String(b.postalCode ?? '').replace(/\D/g, '').slice(0, 6),
    };
    if (!value.fullName) return { error: 'Enter the full name' };
    if (value.phone.length !== 10) return { error: 'Enter a valid 10-digit phone number' };
    if (!EMAIL_RE.test(value.email)) return { error: 'Enter a valid email address' };
    if (!value.address) return { error: 'Enter the street address' };
    if (!value.city) return { error: 'Enter the city' };
    if (value.postalCode.length !== 6) return { error: 'Enter a 6-digit PIN code' };
    return { value };
};

const sorted = (user) => [...user.addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

const load = async (req, res) => {
    const user = await User.findById(req.auth.sub);
    if (!user) { res.status(401).json({ message: 'Please sign in again' }); return null; }
    return user;
};

// My saved addresses (default first)
router.get('/', requireUser, async (req, res) => {
    const user = await load(req, res);
    if (user) res.json(sorted(user));
});

// Add an address. The first one becomes the default.
router.post('/', requireUser, async (req, res) => {
    const user = await load(req, res);
    if (!user) return;
    if (user.addresses.length >= MAX_ADDRESSES) return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.` });
    const { value, error } = readAddress(req.body, user.email);
    if (error) return res.status(400).json({ message: error });

    const makeDefault = user.addresses.length === 0 || req.body.isDefault === true;
    if (makeDefault) user.addresses.forEach(a => { a.isDefault = false; });
    user.addresses.push({ ...value, isDefault: makeDefault });
    await user.save();
    res.status(201).json(sorted(user));
});

// Edit an address
router.put('/:id', requireUser, async (req, res) => {
    const user = await load(req, res);
    if (!user) return;
    const addr = mongoose.isValidObjectId(req.params.id) && user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    const { value, error } = readAddress(req.body, user.email);
    if (error) return res.status(400).json({ message: error });

    addr.set(value);
    if (req.body.isDefault === true) user.addresses.forEach(a => { a.isDefault = String(a._id) === String(addr._id); });
    await user.save();
    res.json(sorted(user));
});

// Make an address the default
router.put('/:id/default', requireUser, async (req, res) => {
    const user = await load(req, res);
    if (!user) return;
    const addr = mongoose.isValidObjectId(req.params.id) && user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    user.addresses.forEach(a => { a.isDefault = String(a._id) === String(addr._id); });
    await user.save();
    res.json(sorted(user));
});

// Delete an address (if it was the default, the next one takes over)
router.delete('/:id', requireUser, async (req, res) => {
    const user = await load(req, res);
    if (!user) return;
    const addr = mongoose.isValidObjectId(req.params.id) && user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
    await user.save();
    res.json(sorted(user));
});

module.exports = router;
