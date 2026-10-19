import React from 'react';

export default function Marquee() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '40px',
            backgroundColor: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden'
        }}>
            <div className="marquee-content" style={{ color: 'var(--color-accent)' }}>
                Welcome to ZamCloth — Redefining Digital Luxury — Free Shipping on Orders Over ₹500 — New Summer Collection Available Now —
            </div>
        </div>
    );
}
