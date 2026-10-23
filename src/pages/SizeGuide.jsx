import React from 'react';
import { TABLES } from '../data/sizeCharts';

export default function SizeGuide() {
    return (
        <div className="container section" style={{ marginTop: '9rem' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Size Guideline</h1>

            {TABLES.map(t => (
                <div key={t.title} style={{ marginBottom: '4rem' }}>
                    <h2 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>{t.title}</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t.note}</p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                    {t.head.map(h => <th key={h} style={thStyle}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {t.rows.map(r => (
                                    <tr key={r[0]}>{r.map((c, i) => <td key={i} style={tdStyle}>{c}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

const thStyle = {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-accent)',
    fontWeight: '600'
};

const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)'
};
