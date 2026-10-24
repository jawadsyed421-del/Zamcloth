import React from 'react';

// Colour buttons (dot + name); the shopper clicks the colour they want
export default function ColorSwatches({ options, selected, onSelect, size = 30 }) {
    const small = size < 30;
    return (
        <div role="radiogroup" aria-label="Colour" style={{ display: 'flex', gap: small ? '0.4rem' : '0.6rem', flexWrap: 'wrap' }}>
            {options.map(c => {
                const active = c.name === selected;
                return (
                    <button
                        key={c.name}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={c.name}
                        title={c.name}
                        onClick={(e) => { e.preventDefault(); onSelect(c.name); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                            padding: small ? '0.2rem 0.55rem' : '0.4rem 0.9rem', borderRadius: '999px',
                            border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                            background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                            color: 'var(--color-text)', fontSize: small ? '0.72rem' : '0.9rem'
                        }}
                    >
                        <span style={{ width: small ? 12 : 16, height: small ? 12 : 16, borderRadius: '50%', background: c.hex || '#9ca3af', border: '1px solid rgba(255,255,255,0.35)', flex: '0 0 auto' }} />
                        {c.name}
                    </button>
                );
            })}
        </div>
    );
}
