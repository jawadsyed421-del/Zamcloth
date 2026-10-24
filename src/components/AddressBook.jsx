import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Loads and changes the signed-in customer's saved addresses
export function useAddresses() {
    const { user, authFetch } = useAuth();
    const [list, setList] = useState(null); // null while loading
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        authFetch('/api/addresses')
            .then(r => (r.ok ? r.json() : []))
            .then(d => { if (!cancelled) setList(d); })
            .catch(() => { if (!cancelled) setList([]); });
        return () => { cancelled = true; };
    }, [user, authFetch]);

    // Sends one change and returns the updated list (or null with `error` set)
    const send = useCallback(async (url, method, body) => {
        setError('');
        try {
            const res = await authFetch(url, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not save the address');
            setList(data);
            return data;
        } catch (err) {
            setError(err.message);
            return null;
        }
    }, [authFetch]);

    return {
        list, error, setError,
        add: (a) => send('/api/addresses', 'POST', a),
        update: (id, a) => send(`/api/addresses/${id}`, 'PUT', a),
        remove: (id) => send(`/api/addresses/${id}`, 'DELETE'),
        makeDefault: (id) => send(`/api/addresses/${id}/default`, 'PUT'),
    };
}

const EMPTY = { fullName: '', phone: '', email: '', address: '', city: '', postalCode: '', isDefault: false };

const inputStyle = {
    width: '100%', padding: '0.9rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', outline: 'none', fontSize: '0.9rem',
};

export const formatAddress = (a) => `${a.address}, ${a.city} ${a.postalCode}`;

// List of saved addresses with add, edit, delete and (optionally) choose-one-for-delivery.
export default function AddressBook({ book, selectedId, onSelect, autoOpen = true }) {
    const { user } = useAuth();
    const { list, error } = book;
    const [editing, setEditing] = useState(null); // null | 'new' | address id
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);

    const openNew = () => { setForm({ ...EMPTY, fullName: user?.name || '', phone: user?.phone || '', email: user?.email || '' }); setEditing('new'); };
    const openEdit = (a) => { setForm({ fullName: a.fullName, phone: a.phone, email: a.email || '', address: a.address, city: a.city, postalCode: a.postalCode, isDefault: a.isDefault }); setEditing(a._id); };
    const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    // With no saved addresses, go straight to the form
    useEffect(() => {
        if (autoOpen && list && list.length === 0 && editing === null) {
            setForm({ ...EMPTY, fullName: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
            setEditing('new');
        }
    }, [autoOpen, list, editing, user]);

    if (list === null) return <p style={{ color: 'var(--color-text-muted)' }}>Loading your addresses…</p>;

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        const wasNew = editing === 'new';
        const updated = wasNew ? await book.add(form) : await book.update(editing, form);
        setBusy(false);
        if (!updated) return;
        setEditing(null);
        if (onSelect) {
            // choose the address that was just saved (newest for a new one, same id for an edit)
            const saved = wasNew ? updated.find(a => !list.some(o => o._id === a._id)) : updated.find(a => a._id === editing);
            if (saved) onSelect(saved);
        }
    };

    const remove = async (a) => {
        if (!window.confirm('Delete this address?')) return;
        const updated = await book.remove(a._id);
        if (updated && onSelect && selectedId === a._id) onSelect(updated[0] || null);
    };

    if (editing !== null) {
        return (
            <form onSubmit={save} style={{ display: 'grid', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>{editing === 'new' ? 'Add a delivery address' : 'Edit address'}</h3>
                <input name="fullName" value={form.fullName} onChange={change} placeholder="Full name" required maxLength={100} style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <input name="phone" value={form.phone} onChange={change} type="tel" placeholder="Phone (10 digits)" required style={inputStyle} />
                    <input name="email" value={form.email} onChange={change} type="email" placeholder="Email address" required style={inputStyle} />
                </div>
                <input name="address" value={form.address} onChange={change} placeholder="Street address, building, area" required maxLength={200} style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input name="city" value={form.city} onChange={change} placeholder="City" required maxLength={80} style={inputStyle} />
                    <input name="postalCode" value={form.postalCode} onChange={change} placeholder="PIN code" required inputMode="numeric" maxLength={6} style={inputStyle} />
                </div>
                <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                    Use as my default address
                </label>
                {error && <p role="alert" style={{ color: '#e07a7a' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="submit" className="btn-primary" disabled={busy} style={{ padding: '0.9rem 2rem' }}>{busy ? 'Saving…' : 'Save address'}</button>
                    {list.length > 0 && (
                        <button type="button" onClick={() => { setEditing(null); book.setError(''); }} style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Cancel</button>
                    )}
                </div>
            </form>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {list.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No saved addresses yet. Add one and it will be filled in automatically at checkout.</p>}
            {list.map(a => {
                const chosen = onSelect && selectedId === a._id;
                return (
                    <div
                        key={a._id}
                        style={{
                            border: `1px solid ${chosen ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: '6px', padding: '1rem 1.2rem',
                            display: 'flex', gap: '1rem', alignItems: 'flex-start',
                        }}
                    >
                        {onSelect && (
                            <input type="radio" name="deliveryAddress" checked={chosen} onChange={() => onSelect(a)} aria-label={`Deliver to ${a.fullName}`} style={{ marginTop: '0.35rem' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0, cursor: onSelect ? 'pointer' : 'default' }} onClick={() => onSelect && onSelect(a)}>
                            <p style={{ fontWeight: 600 }}>
                                {a.fullName}
                                {a.isDefault && <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: 'var(--color-bg)', background: 'var(--color-accent)', padding: '0.1rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default</span>}
                            </p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{formatAddress(a)}</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{a.phone} · {a.email}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(a); }} style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>Edit</button>
                                {!a.isDefault && <button type="button" onClick={(e) => { e.stopPropagation(); book.makeDefault(a._id); }} style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Make default</button>}
                                <button type="button" onClick={(e) => { e.stopPropagation(); remove(a); }} style={{ color: '#e07a7a', textDecoration: 'underline' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {error && <p role="alert" style={{ color: '#e07a7a' }}>{error}</p>}
            <button type="button" onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', justifySelf: 'start' }}>
                <Plus size={18} /> Add a new address
            </button>
        </div>
    );
}
