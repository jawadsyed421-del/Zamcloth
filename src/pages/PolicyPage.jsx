import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PAGES } from '../data/policies';

const h2 = { fontSize: '1.5rem', margin: '2.5rem 0 1rem', fontFamily: 'var(--font-heading)' };
const body = { color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '1rem' };

function Block({ b }) {
    if (b.h) return <h2 style={h2}>{b.h}</h2>;
    if (b.p) return (
        <p style={body}>
            {b.p}{b.link && <> <Link to={b.link[0]} style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>{b.link[1]}</Link></>}
        </p>
    );
    if (b.ul) return <ul style={{ ...body, listStyle: 'disc', paddingLeft: '1.4rem' }}>{b.ul.map((t, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{t}</li>)}</ul>;
    if (b.ol) return <ol style={{ ...body, listStyle: 'decimal', paddingLeft: '1.4rem' }}>{b.ol.map((t, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{t}</li>)}</ol>;
    if (b.kv) return (
        <dl style={{ border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '1.5rem' }}>
            {b.kv.map(([k, v], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 240px) 1fr', gap: '1rem', padding: '0.9rem 1.2rem', borderTop: i ? '1px solid var(--color-border)' : 'none' }}>
                    <dt style={{ fontWeight: 600 }}>{k}</dt>
                    <dd style={{ color: 'var(--color-text-muted)', overflowWrap: 'anywhere' }}>{v}</dd>
                </div>
            ))}
        </dl>
    );
    if (b.faq) return (
        <div>
            {b.faq.map(([q, a], i) => (
                <details key={i} style={{ borderBottom: '1px solid var(--color-border)', padding: '1.1rem 0' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '1.05rem' }}>{i + 1}. {q}</summary>
                    <p style={{ ...body, marginTop: '0.8rem', marginBottom: 0 }}>{a}</p>
                </details>
            ))}
        </div>
    );
    if (b.note) return <p style={{ ...body, fontSize: '0.9rem', fontStyle: 'italic', marginTop: '1.5rem' }}>{b.note}</p>;
    return null;
}

export default function PolicyPage() {
    const { slug } = useParams();
    const page = PAGES[slug];
    if (!page) return <Navigate to="/" replace />;

    return (
        <div className="container section" style={{ marginTop: '9rem', maxWidth: '900px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '0.5rem' }}>{page.heading}</h1>
            {page.subheading && <p style={{ color: 'var(--color-accent)', fontSize: '1.2rem', marginBottom: '1rem' }}>{page.subheading}</p>}
            {page.updated && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Last Updated: {page.updated}</p>}
            <div style={{ marginTop: '1.5rem' }}>
                {page.blocks.map((b, i) => <Block key={i} b={b} />)}
            </div>
        </div>
    );
}
