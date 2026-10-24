import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Upload, Package, Trash2, Save, ReceiptText, CreditCard, Image as ImageIcon } from 'lucide-react';
import SafeImage from '../components/SafeImage';
import PasswordInput from '../components/PasswordInput';

const TOKEN_KEY = 'zam_admin_token';
const SUBCATEGORIES = {
    Women: ['Kurtis', 'Dresses', 'Co-ord Sets', 'Ethnic Wear'],
    Kids: ['Boys', 'Girls'],
    Men: ['Jeans', 'T-Shirts']
};
const SIZE_DEFAULTS = {
    Women: 'XS, S, M, L, XL, XXL',
    Men: 'S, M, L, XL, XXL',
    Kids: '2–3 years, 3–4 years, 4–5 years, 5–6 years, 6–7 years, 7–8 years, 8–9 years, 9–10 years, 10–11 years, 11–12 years'
};

const getToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t) => { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } };

export default function Admin() {
    const [token, setTokenState] = useState(getToken());
    const [checking, setChecking] = useState(!!getToken());

    const logout = useCallback(() => { setToken(''); setTokenState(''); }, []);

    useEffect(() => {
        if (!token) { setChecking(false); return; }
        fetch('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (!r.ok) logout(); })
            .catch(() => { })
            .finally(() => setChecking(false));
    }, [token, logout]);

    if (checking) return <main className="admin-page" />;
    if (!token) return <Login onLogin={(t) => { setToken(t); setTokenState(t); }} />;
    return <Dashboard token={token} onLogout={logout} />;
}

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not sign in');
            onLogin(data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="admin-page admin-center">
            <AdminStyles />
            <form onSubmit={submit} className="admin-card admin-login">
                <h1>Admin sign in</h1>
                <p className="muted">Enter your username and password to manage products.</p>
                <label>Username
                    <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required autoFocus />
                </label>
                <label>Password
                    <PasswordInput value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
                </label>
                {error && <p className="admin-error" role="alert">{error}</p>}
                <button className="btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                <Link to="/" className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>Back to store</Link>
            </form>
        </main>
    );
}

function Dashboard({ token, onLogout }) {
    const [tab, setTab] = useState('inventory');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const auth = { Authorization: `Bearer ${token}` };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            setProducts(await res.json());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAuthFail = (res) => { if (res.status === 401) { onLogout(); return true; } return false; };

    return (
        <main className="admin-page">
            <AdminStyles />
            <div className="container">
                <header className="admin-head">
                    <h1>Store admin</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link to="/" className="muted">View store</Link>
                        <button className="admin-ghost" onClick={onLogout}><LogOut size={16} /> Sign out</button>
                    </div>
                </header>

                <div className="admin-tabs" role="tablist">
                    <button role="tab" aria-selected={tab === 'inventory'} onClick={() => setTab('inventory')}><Package size={16} /> Inventory ({products.length})</button>
                    <button role="tab" aria-selected={tab === 'orders'} onClick={() => setTab('orders')}><ReceiptText size={16} /> Orders</button>
                    <button role="tab" aria-selected={tab === 'transactions'} onClick={() => setTab('transactions')}><CreditCard size={16} /> Transactions</button>
                    <button role="tab" aria-selected={tab === 'hero'} onClick={() => setTab('hero')}><ImageIcon size={16} /> Hero banner</button>
                    <button role="tab" aria-selected={tab === 'upload'} onClick={() => setTab('upload')}><Upload size={16} /> Upload product</button>
                </div>

                {tab === 'orders'
                    ? <Orders auth={auth} onAuthFail={handleAuthFail} />
                    : tab === 'transactions'
                    ? <Transactions auth={auth} onAuthFail={handleAuthFail} />
                    : tab === 'hero'
                    ? <HeroManager auth={auth} onAuthFail={handleAuthFail} />
                    : tab === 'inventory'
                    ? <Inventory products={products} loading={loading} auth={auth} reload={load} onAuthFail={handleAuthFail} goUpload={() => setTab('upload')} />
                    : <UploadForm auth={auth} onAuthFail={handleAuthFail} onDone={() => { load(); setTab('inventory'); }} />}
            </div>
        </main>
    );
}

const TX_STATUS = { paid: ['Paid', 'var(--color-accent)'], failed: ['Failed', '#e07a7a'], created: ['Pending', '#d9a441'] };
function Transactions({ auth, onAuthFail }) {
    const [list, setList] = useState(null);

    const load = useCallback(async () => {
        const res = await fetch('/api/payment/transactions', { headers: auth });
        if (onAuthFail(res)) return;
        setList(res.ok ? await res.json() : []);
    }, [auth, onAuthFail]);

    useEffect(() => { load(); }, [load]);

    if (list === null) return <p className="muted">Loading transactions…</p>;
    if (!list.length) return <div className="admin-card" style={{ textAlign: 'center' }}>No payments yet. Every payment attempt, paid or not, will appear here.</div>;

    const paidTotal = list.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="admin-card" style={{ padding: 0 }}>
            <p className="muted small" style={{ padding: '1rem 1rem 0' }}>
                {list.length} payment attempts · ₹{paidTotal.toFixed(2)} received
                <button className="admin-ghost" onClick={load} style={{ marginLeft: '1rem' }}>Refresh</button>
            </p>
            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ minWidth: 900 }}>
                    <thead><tr><th>Date</th><th>Customer</th><th>Order</th><th>Payment ID</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                        {list.map(t => {
                            const [label, colour] = TX_STATUS[t.status] || [t.status, 'inherit'];
                            const name = t.customerName || t.order?.shippingAddress?.fullName || 'Unknown';
                            return (
                                <tr key={t._id}>
                                    <td>{new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    <td>{name}
                                        <span className="muted small">{t.customerEmail || t.order?.shippingAddress?.email}</span>
                                        <span className="muted small">{t.customerPhone || t.order?.shippingAddress?.phone}</span></td>
                                    <td>{t.order?._id ? `…${String(t.order._id).slice(-6).toUpperCase()}` : '—'}
                                        <span className="muted small">{t.order?.paymentMethod === 'Partial COD' ? 'Partial COD (advance)' : 'Online'}</span></td>
                                    <td>{t.gatewayPaymentId || '—'}<span className="muted small">{t.gateway} · {t.gatewayOrderId}</span></td>
                                    <td style={{ textTransform: 'capitalize' }}>{t.method || '—'}</td>
                                    <td>₹{t.amount.toFixed(2)}</td>
                                    <td><span style={{ color: colour }}>{label}</span>{t.failureReason && <span className="muted small">{t.failureReason}</span>}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const STATUS_OPTIONS = [
    ['pending_payment', 'Awaiting payment'], ['processing', 'Processing'], ['shipped', 'Shipped'],
    ['delivered', 'Delivered'], ['cancelled', 'Cancelled']
];

function Orders({ auth, onAuthFail }) {
    const [orders, setOrders] = useState(null);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        const res = await fetch('/api/orders', { headers: auth });
        if (onAuthFail(res)) return;
        setOrders(res.ok ? await res.json() : []);
    }, [auth, onAuthFail]);

    useEffect(() => { load(); }, [load]);

    const setStatus = async (o, status) => {
        const res = await fetch(`/api/orders/${o._id}/status`, {
            method: 'PUT',
            headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (onAuthFail(res)) return;
        setMessage(res.ok ? `Order …${o._id.slice(-6).toUpperCase()} is now ${status.replace('_', ' ')}` : (await res.json()).message);
        load();
    };

    if (orders === null) return <p className="muted">Loading orders…</p>;
    if (!orders.length) return <div className="admin-card" style={{ textAlign: 'center' }}>No orders yet. Paid orders will appear here.</div>;

    return (
        <div className="admin-card" style={{ padding: 0 }}>
            {message && <p className="admin-ok" role="status">{message}</p>}
            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ minWidth: 820 }}>
                    <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o._id}>
                                <td>…{o._id.slice(-6).toUpperCase()}<span className="muted small">{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></td>
                                <td>{o.user ? o.user.name : o.shippingAddress?.fullName || 'Unknown'}
                                    <span className="muted small">{o.user?.email || o.shippingAddress?.email}</span>
                                    <span className="muted small">{o.shippingAddress?.phone} · {o.shippingAddress?.city}</span></td>
                                <td>{(o.orderItems || []).map((it, i) => <span key={i} className="small" style={{ display: 'block' }}>{it.name}{it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join(', ')})` : ''} × {it.quantity}</span>)}</td>
                                <td>₹{o.totalPrice.toFixed(2)}</td>
                                <td>
                                    <span style={{ color: o.isPaid ? 'var(--color-accent)' : '#e07a7a' }}>{o.isPaid ? (o.paymentMethod === 'Partial COD' ? 'Advance paid' : 'Paid') : (o.transaction?.status === 'failed' ? 'Failed' : 'Unpaid')}</span>
                                    {o.paymentMethod === 'Partial COD' && <span className="muted small">COD balance ₹{(o.codBalance || 0).toFixed(2)}</span>}
                                    {o.transaction?.gatewayPaymentId && <span className="muted small">{o.transaction.gatewayPaymentId}</span>}
                                </td>
                                <td>
                                    <select value={o.status} onChange={e => setStatus(o, e.target.value)} aria-label="Order status" style={{ minWidth: 150 }}>
                                        {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Inventory({ products, loading, auth, reload, onAuthFail, goUpload }) {
    const [edits, setEdits] = useState({});
    const [message, setMessage] = useState('');

    const setEdit = (id, patch) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }));

    const save = async (p) => {
        const e = edits[p._id]; if (!e) return;
        const body = new FormData();
        if (e.price !== undefined) body.append('price', e.price);
        if (e.stock !== undefined) body.append('stock', e.stock);
        const res = await fetch(`/api/products/${p._id}`, { method: 'PUT', headers: auth, body });
        if (onAuthFail(res)) return;
        if (res.ok) { setEdits(x => { const { [p._id]: _, ...rest } = x; return rest; }); setMessage(`Saved ${p.name}`); reload(); }
        else setMessage((await res.json()).message);
    };

    const remove = async (p) => {
        if (!window.confirm(`Delete "${p.name}" and its photo? This cannot be undone.`)) return;
        const res = await fetch(`/api/products/${p._id}`, { method: 'DELETE', headers: auth });
        if (onAuthFail(res)) return;
        setMessage(res.ok ? `Deleted ${p.name}` : (await res.json()).message);
        reload();
    };

    if (loading) return <p className="muted">Loading inventory…</p>;
    if (!products.length) return (
        <div className="admin-card" style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>No products yet. Upload your first product photo to show it in the store.</p>
            <button className="btn-primary" onClick={goUpload}>Upload product</button>
        </div>
    );

    return (
        <div className="admin-card" style={{ padding: 0 }}>
            {message && <p className="admin-ok" role="status">{message}</p>}
            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead><tr><th>Photo</th><th>Product</th><th>Section</th><th>Price</th><th>Stock</th><th></th></tr></thead>
                    <tbody>
                        {products.map(p => {
                            const e = edits[p._id] || {};
                            return (
                                <tr key={p._id}>
                                    <td><SafeImage src={p.image} alt={p.name} style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: 4, fontSize: '1.4rem' }} /></td>
                                    <td>{p.name}<span className="muted small">{p.subcategory}{p.ageGroup ? ` · ${p.ageGroup}` : ''}</span></td>
                                    <td>{p.category}</td>
                                    <td><input type="number" min="0" className="num" value={e.price ?? p.price} onChange={ev => setEdit(p._id, { price: ev.target.value })} aria-label={`Price for ${p.name}`} /></td>
                                    <td>
                                        <input type="number" min="0" className="num" value={e.stock ?? p.stock ?? 0} onChange={ev => setEdit(p._id, { stock: ev.target.value })} aria-label={`Stock for ${p.name}`} />
                                        {(p.stock ?? 0) === 0 && <span className="muted small" style={{ color: '#e07a7a' }}>Sold out</span>}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <button className="admin-ghost" disabled={!edits[p._id]} onClick={() => save(p)}><Save size={15} /> Save</button>
                                        <button className="admin-ghost danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const MAX_PHOTOS = 6;

// Shrinks a photo in the browser (max 1600px, JPEG) so several fit in one upload
async function compressPhoto(file, maxSide = 1600) {
    const bitmap = await createImageBitmap(file);
    const draw = (maxSide, quality) => {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    };
    let blob = await draw(maxSide, 0.85);
    if (blob.size > 900 * 1024) blob = await draw(Math.round(maxSide * 0.8), 0.7);
    bitmap.close?.();
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

const MAX_HERO = 6;

function HeroManager({ auth, onAuthFail }) {
    const [images, setImages] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        const res = await fetch('/api/hero');
        setImages(res.ok ? (await res.json()).images : []);
    }, []);

    useEffect(() => { load(); }, [load]);

    const call = async (url, options) => {
        const res = await fetch(url, { ...options, headers: { ...auth, ...options.headers } });
        if (onAuthFail(res)) return null;
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Something went wrong');
        return data;
    };

    const add = async (e) => {
        const chosen = [...e.target.files];
        e.target.value = '';
        if (!chosen.length) return;
        if ((images?.length || 0) + chosen.length > MAX_HERO) { setError(`The banner can hold up to ${MAX_HERO} photos.`); return; }
        setBusy(true); setError(''); setMessage('');
        try {
            let latest = images;
            for (const file of chosen) { // one photo per request keeps each upload small
                const body = new FormData();
                body.append('images', await compressPhoto(file, 2000));
                const data = await call('/api/hero', { method: 'POST', body });
                if (!data) return;
                latest = data.images;
                setImages(latest);
            }
            setMessage(latest.length > 1 ? 'Saved. The banner now slides automatically.' : 'Saved. One photo shows as a still banner.');
        } catch (err) {
            setError(err.message);
        } finally { setBusy(false); }
    };

    const remove = async (url) => {
        if (!window.confirm('Remove this photo from the banner?')) return;
        setError(''); setMessage('');
        try {
            const data = await call('/api/hero', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
            if (data) setImages(data.images);
        } catch (err) { setError(err.message); }
    };

    const move = async (url, direction) => {
        setError(''); setMessage('');
        try {
            const data = await call('/api/hero/move', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, direction }) });
            if (data) setImages(data.images);
        } catch (err) { setError(err.message); }
    };

    if (images === null) return <p className="muted">Loading banner…</p>;

    return (
        <div className="admin-card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>Home page banner</h2>
            <p className="muted small" style={{ marginBottom: '1rem' }}>
                Upload 1 photo for a still banner, or 2 to {MAX_HERO} photos and the banner slides from right to left by itself.
                Use wide, bright photos (landscape works best). With no photos, the default banner is shown.
            </p>
            {message && <p className="admin-ok" role="status">{message}</p>}
            {error && <p className="admin-error" role="alert">{error}</p>}
            <div className="photo-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {images.map((src, i) => (
                    <div key={src} className="photo-thumb" style={{ aspectRatio: '16/10' }}>
                        <img src={src} alt={`Banner photo ${i + 1}`} />
                        <span className="photo-main">{i + 1}</span>
                        <div className="photo-actions">
                            <div style={{ display: 'flex' }}>
                                <button type="button" disabled={i === 0} onClick={() => move(src, 'left')} style={{ flex: 1 }} aria-label="Move earlier">← Earlier</button>
                                <button type="button" disabled={i === images.length - 1} onClick={() => move(src, 'right')} style={{ flex: 1 }} aria-label="Move later">Later →</button>
                            </div>
                            <button type="button" onClick={() => remove(src)}>Remove</button>
                        </div>
                    </div>
                ))}
                {images.length < MAX_HERO && (
                    <label className="photo-drop photo-add" style={{ aspectRatio: '16/10' }}>
                        <span><Upload size={22} /><br />{busy ? 'Uploading…' : images.length ? 'Add more photos' : 'Choose banner photos'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={add} />
                    </label>
                )}
            </div>
        </div>
    );
}

function UploadForm({ auth, onAuthFail, onDone }) {
    const [category, setCategory] = useState('Women');
    const [multi, setMulti] = useState(false);
    const [items, setItems] = useState([]); // [{ file, color }] one entry per photo
    const [previews, setPreviews] = useState([]);
    const [colorOptions, setColorOptions] = useState([]); // [{ name, hex }]
    const [colorName, setColorName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const urls = items.map(i => URL.createObjectURL(i.file));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [items]);

    const pick = async (e) => {
        const chosen = [...e.target.files];
        e.target.value = '';
        if (chosen.length === 0) return;
        setError('');
        try {
            const ready = (await Promise.all(chosen.map(compressPhoto))).map(file => ({ file, color: '' }));
            setItems(prev => multi ? [...prev, ...ready].slice(0, MAX_PHOTOS) : ready.slice(0, 1));
            if (multi && items.length + ready.length > MAX_PHOTOS) setError(`Only the first ${MAX_PHOTOS} photos were kept`);
        } catch {
            setError('That file could not be read as a photo');
        }
    };

    const removePhoto = (i) => setItems(prev => prev.filter((_, j) => j !== i));
    const makeMain = (i) => setItems(prev => [prev[i], ...prev.filter((_, j) => j !== i)]);
    const switchMode = (m) => { setMulti(m); if (!m) setItems(prev => prev.slice(0, 1)); };
    const setPhotoColor = (i, color) => setItems(prev => prev.map((it, j) => (j === i ? { ...it, color } : it)));

    const addColor = () => {
        const name = colorName.trim();
        if (!name) return;
        if (colorOptions.some(c => c.name.toLowerCase() === name.toLowerCase())) { setError(`"${name}" is already added`); return; }
        setError('');
        setColorOptions(prev => [...prev, { name }].slice(0, 12));
        setColorName('');
    };
    const removeColor = (name) => {
        setColorOptions(prev => prev.filter(c => c.name !== name));
        setItems(prev => prev.map(it => (it.color === name ? { ...it, color: '' } : it)));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (items.length === 0) { setError('Choose a photo to upload'); return; }
        setBusy(true); setError('');
        const body = new FormData(e.target);
        items.forEach(it => body.append('images', it.file));
        body.set('colorOptions', JSON.stringify(colorOptions));
        body.set('imageColors', JSON.stringify(items.map(it => it.color)));
        body.set('isNew', e.target.isNew.checked);
        body.set('isTrending', e.target.isTrending.checked);
        try {
            const res = await fetch('/api/products', { method: 'POST', headers: auth, body });
            if (onAuthFail(res)) return;
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            onDone();
        } catch (err) {
            setError(err.message);
        } finally { setBusy(false); }
    };

    return (
        <form onSubmit={submit} className="admin-card admin-form">
            <div className="photo-pick">
                <div className="mode-toggle" role="radiogroup" aria-label="Number of photos">
                    <label className="check"><input type="radio" name="photoMode" checked={!multi} onChange={() => switchMode(false)} /> Single photo</label>
                    <label className="check"><input type="radio" name="photoMode" checked={multi} onChange={() => switchMode(true)} /> Multiple photos</label>
                </div>
                {items.length === 0 ? (
                    <label className="photo-drop">
                        <span><Upload size={28} /><br />{multi ? `Choose up to ${MAX_PHOTOS} photos` : 'Choose photo'}<br /><small>JPG, PNG or WebP</small></span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multi} onChange={pick} />
                    </label>
                ) : (
                    <div className="photo-grid">
                        {previews.map((src, i) => (
                            <div key={src} className="photo-thumb">
                                <img src={src} alt={`Photo ${i + 1}`} />
                                {i === 0 && <span className="photo-main">Main</span>}
                                <div className="photo-actions">
                                    {colorOptions.length > 0 && (
                                        <select value={items[i].color} onChange={e => setPhotoColor(i, e.target.value)} aria-label={`Colour of photo ${i + 1}`}>
                                            <option value="">All colours</option>
                                            {colorOptions.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    )}
                                    {i > 0 && <button type="button" onClick={() => makeMain(i)}>Make main</button>}
                                    <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}>Remove</button>
                                </div>
                            </div>
                        ))}
                        {multi && items.length < MAX_PHOTOS && (
                            <label className="photo-drop photo-add">
                                <span><Upload size={22} /><br />Add more</span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} />
                            </label>
                        )}
                        {!multi && (
                            <label className="photo-drop photo-add">
                                <span>Change photo</span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />
                            </label>
                        )}
                    </div>
                )}
            </div>

            <div className="fields">
                <label>Product name<input name="name" required maxLength={80} placeholder="e.g. Cotton Graphic T-Shirt" /></label>
                <div className="row">
                    <label>Section
                        <select name="category" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Women</option><option>Kids</option><option>Men</option>
                        </select>
                    </label>
                    <label>Type
                        <select name="subcategory" key={category}>{SUBCATEGORIES[category].map(s => <option key={s}>{s}</option>)}</select>
                    </label>
                </div>
                <label>Description<textarea name="description" required rows={3} maxLength={500} /></label>
                <div className="row">
                    <label>Price<input name="price" type="number" min="1" required /></label>
                    <label>Stock<input name="stock" type="number" min="0" defaultValue="1" required /></label>
                </div>
                <div className="row">
                    <label>Sizes (comma separated)<input name="sizes" required defaultValue={SIZE_DEFAULTS[category]} key={`s${category}`} /></label>
                </div>
                <div className="color-editor">
                    <span className="muted small">Colours (optional): type a colour and press Enter, e.g. Red, Blue, Yellow. Then pick the colour of each photo.</span>
                    <div className="color-add">
                        <input value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Type a colour, press Enter" maxLength={30}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} />
                        <button type="button" className="btn-accent" onClick={addColor} style={{ padding: '0.5rem 1rem' }}>Add</button>
                    </div>
                    {colorOptions.length > 0 && (
                        <div className="color-chips">
                            {colorOptions.map(c => (
                                <span key={c.name} className="color-chip">
                                    {c.name}
                                    <button type="button" onClick={() => removeColor(c.name)} aria-label={`Remove ${c.name}`}>×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="row checks">
                    <label className="check"><input type="checkbox" name="isNew" /> Mark as new</label>
                    <label className="check"><input type="checkbox" name="isTrending" /> Show in Trending</label>
                </div>
                {error && <p className="admin-error" role="alert">{error}</p>}
                <button className="btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload product'}</button>
            </div>
        </form>
    );
}

function AdminStyles() {
    return (
        <style>{`
            .admin-page { min-height: 100vh; padding: 4rem 0 5rem; background: var(--color-bg); }
            .admin-center { display: flex; align-items: center; justify-content: center; padding: 2rem 5%; }
            .admin-page h1 { font-size: 2rem; }
            .admin-page .muted { color: var(--color-text-muted); }
            .admin-page .small { display: block; font-size: 0.8rem; }
            .admin-card { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 8px; padding: 2rem; }
            .admin-login { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 1.1rem; }
            .admin-page label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; color: var(--color-text-muted); }
            .admin-page input:not([type=checkbox]):not([type=file]), .admin-page select, .admin-page textarea {
                background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text);
                padding: 0.7rem 0.8rem; border-radius: 4px; font: inherit; font-size: 1rem; width: 100%;
            }
            .admin-page input:focus, .admin-page select:focus, .admin-page textarea:focus { outline: none; border-color: var(--color-accent); }
            .admin-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
            .admin-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
            .admin-tabs button { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.2rem; color: var(--color-text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
            .admin-tabs button[aria-selected=true] { color: var(--color-accent); border-color: var(--color-accent); }
            .admin-ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.8rem; border: 1px solid var(--color-border); color: var(--color-text); border-radius: 4px; font-size: 0.85rem; margin-left: 0.4rem; }
            .admin-ghost:disabled { opacity: 0.35; cursor: default; }
            .admin-ghost.danger:hover { border-color: #e07a7a; color: #e07a7a; }
            .admin-error { color: #e07a7a; font-size: 0.9rem; }
            .admin-ok { color: var(--color-accent); padding: 1rem 1.5rem 0; font-size: 0.9rem; }
            .admin-table { width: 100%; border-collapse: collapse; min-width: 640px; }
            .admin-table th { text-align: left; padding: 1rem; font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; border-bottom: 1px solid var(--color-border); }
            .admin-table td { padding: 0.8rem 1rem; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
            .admin-table input.num { width: 90px !important; padding: 0.4rem 0.6rem !important; }
            .admin-form { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }
            .photo-drop { aspect-ratio: 3/4; border: 1px dashed var(--color-accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; overflow: hidden; position: relative; color: var(--color-text-muted); }
            .photo-drop img { width: 100%; height: 100%; object-fit: cover; }
            .mode-toggle { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; font-size: 0.9rem; }
            .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.6rem; }
            .photo-thumb { position: relative; aspect-ratio: 3/4; border-radius: 6px; overflow: hidden; border: 1px solid var(--color-border); }
            .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
            .photo-main { position: absolute; top: 4px; left: 4px; background: var(--color-accent); color: #000; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; }
            .photo-actions { position: absolute; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column; background: rgba(0,0,0,0.7); }
            .photo-actions button { font-size: 0.7rem; color: #fff; padding: 4px; }
            .photo-add { font-size: 0.8rem; }
            .photo-actions select { font-size: 0.7rem; padding: 3px !important; background: #111; color: #fff; border: none; border-radius: 0; }
            .color-editor { display: grid; gap: 0.6rem; }
            .color-add { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
            .color-add input[type=color] { width: 44px; height: 40px; padding: 2px; background: none; border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer; }
            .color-add input:not([type=color]) { flex: 1; min-width: 160px; }
            .color-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
            .color-chip { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--color-border); border-radius: 999px; padding: 0.2rem 0.4rem 0.2rem 0.6rem; font-size: 0.85rem; }
            .color-chip i { width: 14px; height: 14px; border-radius: 50%; display: inline-block; border: 1px solid rgba(255,255,255,0.3); }
            .color-chip button { color: var(--color-text-muted); padding: 0 0.3rem; font-size: 1rem; }
            .photo-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
            .photo-drop:focus-within { outline: 2px solid var(--color-accent); outline-offset: 3px; }
            .fields { display: flex; flex-direction: column; gap: 1rem; }
            .row { display: flex; gap: 1rem; flex-wrap: wrap; }
            .row > label { flex: 1 1 140px; }
            .row.checks { gap: 2rem; }
            .admin-page label.check { flex-direction: row; align-items: center; gap: 0.5rem; flex: 0 0 auto; }
            @media (max-width: 760px) { .admin-form { grid-template-columns: 1fr; } .photo-pick { max-width: 100%; } }
        `}</style>
    );
}
