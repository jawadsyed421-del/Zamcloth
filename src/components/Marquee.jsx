import React from 'react';

// Announcement bar shown above the navbar
export default function Marquee() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '40px',
            backgroundColor: '#111',
            borderBottom: '1px solid var(--color-border)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 1rem',
            textAlign: 'center',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: 'clamp(0.6rem, 2.4vw, 0.78rem)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        }}>
            Get an extra 5% off on prepaid orders! COD available.
        </div>
    );
}
