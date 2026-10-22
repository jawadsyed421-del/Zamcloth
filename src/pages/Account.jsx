import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SafeImage from '../components/SafeImage';

export const STATUS_LABEL = {
    pending_payment: 'Awaiting payment',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
};

export default function Account() {
    const { user, loading, logout, authFetch } = useAuth();
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        if (!user) return;
        authFetch('/api/orders/mine')
            .then(r => (r.ok ? r.json() : []))
            .then(setOrders)
            .catch(() => setOrders([]));
    }, [user, authFetch]);

    if (loading) return <main className="container" style={{ minHeight: '100vh' }} />;
    if (!user) return <Navigate to="/login?next=/account" replace />;

    return (
        <main className="container" style={{ minHeight: '100vh', padding: '11rem 0 5rem', maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem' }}>Hello, {user.name.split(' ')[0]}</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                </div>
                <button onClick={logout} style={{ border: '1px solid var(--color-border)', padding: '0.6rem 1.2rem', borderRadius: '4px', color: 'var(--color-text)' }}>Sign out</button>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your orders</h2>

            {orders === null && <p style={{ color: 'var(--color-text-muted)' }}>Loading your orders…</p>}
            {orders && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 0', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>You haven't placed any orders yet.</p>
                    <Link to="/shop" className="btn-primary">Start shopping</Link>
                </div>
            )}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orders && orders.map(o => (
                    <article key={o._id} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div>
                                <strong>Order …{o._id.slice(-6).toUpperCase()}</strong>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: o.status === 'cancelled' ? '#e07a7a' : 'var(--color-accent)' }}>{STATUS_LABEL[o.status]}</span>
                                <p style={{ fontWeight: 500 }}>₹{o.totalPrice.toFixed(2)}</p>
                                {o.paymentMethod === 'Partial COD' && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Pay ₹{(o.codBalance || 0).toFixed(2)} on delivery</p>}
                            </div>
                        </header>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {o.orderItems.map((it, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <SafeImage src={it.image} alt={it.name} style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 4, fontSize: '1.2rem' }} />
                                    <span style={{ flex: 1 }}>{it.name}{it.size ? ` · ${it.size}` : ''} × {it.quantity}</span>
                                    <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
}
