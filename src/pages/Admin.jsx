import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Upload, Package, Trash2, Save } from 'lucide-react';
import SafeImage from '../components/SafeImage';

const TOKEN_KEY = 'zam_admin_token';
const SUBCATEGORIES = {
    Women: ['Kurtis', 'Dresses', 'Co-ord Sets', 'Ethnic Wear', 'T-Shirts', 'Jeans'],
    Kids: ['Boys', 'Girls', 'Ethnic Wear', 'T-Shirts', 'Jeans']
};
const AGE_GROUPS = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'];

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
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
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
                    <button role="tab" aria-selected={tab === 'upload'} onClick={() => setTab('upload')}><Upload size={16} /> Upload product</button>
                </div>

                {tab === 'inventory'
                    ? <Inventory products={products} loading={loading} auth={auth} reload={load} onAuthFail={handleAuthFail} goUpload={() => setTab('upload')} />
                    : <UploadForm auth={auth} onAuthFail={handleAuthFail} onDone={() => { load(); setTab('inventory'); }} />}
            </div>
        </main>
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

function UploadForm({ auth, onAuthFail, onDone }) {
    const [category, setCategory] = useState('Women');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!file) { setPreview(''); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const submit = async (e) => {
        e.preventDefault();
        if (!file) { setError('Choose a photo to upload'); return; }
        setBusy(true); setError('');
        const body = new FormData(e.target);
        body.set('image', file);
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
                <label className="photo-drop">
                    {preview ? <img src={preview} alt="Selected product preview" /> : <span><Upload size={28} /><br />Choose photo<br /><small>JPG, PNG or WebP, up to 5 MB</small></span>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files[0] || null)} />
                </label>
            </div>

            <div className="fields">
                <label>Product name<input name="name" required maxLength={80} placeholder="e.g. Cotton Graphic T-Shirt" /></label>
                <div className="row">
                    <label>Section
                        <select name="category" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Women</option><option>Kids</option>
                        </select>
                    </label>
                    <label>Type
                        <select name="subcategory" key={category}>{SUBCATEGORIES[category].map(s => <option key={s}>{s}</option>)}</select>
                    </label>
                    {category === 'Kids' && (
                        <label>Age group
                            <select name="ageGroup">{AGE_GROUPS.map(a => <option key={a}>{a}</option>)}</select>
                        </label>
                    )}
                </div>
                <label>Description<textarea name="description" required rows={3} maxLength={500} /></label>
                <div className="row">
                    <label>Price<input name="price" type="number" min="1" required /></label>
                    <label>Stock<input name="stock" type="number" min="0" defaultValue="1" required /></label>
                </div>
                <div className="row">
                    <label>Sizes (comma separated)<input name="sizes" required defaultValue={category === 'Kids' ? '2-3Y, 4-5Y, 6-7Y' : 'S, M, L, XL'} key={`s${category}`} /></label>
                    <label>Colors (comma separated)<input name="colors" placeholder="e.g. White, Red" /></label>
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
            .photo-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
            .photo-drop:focus-within { outline: 2px solid var(--color-accent); outline-offset: 3px; }
            .fields { display: flex; flex-direction: column; gap: 1rem; }
            .row { display: flex; gap: 1rem; flex-wrap: wrap; }
            .row > label { flex: 1 1 140px; }
            .row.checks { gap: 2rem; }
            .admin-page label.check { flex-direction: row; align-items: center; gap: 0.5rem; flex: 0 0 auto; }
            @media (max-width: 760px) { .admin-form { grid-template-columns: 1fr; } .photo-pick { max-width: 280px; } }
        `}</style>
    );
}
