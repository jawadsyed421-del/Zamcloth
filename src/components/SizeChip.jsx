import React from 'react';
import { sizeInfo, sizeSubLabel } from '../data/sizes';

// One selectable size: the short code (M) with its full name and size number underneath (Medium · 38)
export default function SizeChip({ size, category, subcategory, selected, onClick, compact }) {
    const info = sizeInfo(size, category, subcategory);
    const sub = sizeSubLabel(info);
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            style={{
                minWidth: compact ? '64px' : '78px',
                padding: compact ? '0.4rem 0.5rem' : '0.6rem 0.9rem',
                border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                backgroundColor: selected ? 'var(--color-accent)' : 'transparent',
                color: selected ? 'var(--color-bg)' : 'var(--color-text)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.25,
                transition: 'all 0.2s'
            }}
        >
            <span style={{ fontSize: compact ? '0.85rem' : '0.95rem', fontWeight: 600 }}>{info.code}</span>
            {sub && <span style={{ fontSize: compact ? '0.62rem' : '0.7rem', opacity: 0.8, whiteSpace: 'nowrap' }}>{sub}</span>}
        </button>
    );
}
