import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { chartsFor } from '../data/sizeCharts';

const th = { padding: '0.7rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' };
const td = { padding: '0.7rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' };

// Pop-up size chart for one product's section (Kids, Women or Men), shown on the same page
export default function SizeChartModal({ category, subcategory, onClose }) {
    const charts = chartsFor(category, subcategory);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [onClose]);

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div role="dialog" aria-modal="true" aria-label="Size chart" onClick={(e) => e.stopPropagation()}
                style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Size Chart</h2>
                    <button onClick={onClose} aria-label="Close size chart" style={{ color: 'var(--color-text)', display: 'flex' }}><X size={24} /></button>
                </div>
                {charts.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No size chart is available for this product.</p>}
                {charts.map(t => (
                    <div key={t.title} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{t.title}</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{t.note}</p>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr>{t.head.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                                <tbody>{t.rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} style={td}>{c}</td>)}</tr>)}</tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
