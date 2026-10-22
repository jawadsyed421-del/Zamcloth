import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import { COMPANY as C } from '../data/company';

const linkStyle = { color: 'var(--color-text-muted)' };
const headStyle = { fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', color: 'var(--color-text)' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '0.8rem' };

const SHOP = [
    ['New Arrivals', '/shop?tag=new'],
    ['Men', '/shop?category=Men'],
    ['Women', '/shop?category=Women'],
    ['Kids', '/shop?category=Kids'],
    ['Accessories', '/shop?category=Accessories'],
];
const SUPPORT = [
    ['Contact Us', '/contact-us'],
    ['FAQs', '/faqs'],
    ['Size Guide', '/size-guide'],
    ['Shipping Policy', '/shipping-policy'],
    ['Returns & Exchange', '/returns-exchanges'],
    ['Refund Policy', '/refund-policy'],
    ['Order Tracking', '/order-tracking'],
];
const LEGAL = [
    ['About Us', '/about-us'],
    ['Privacy Policy', '/privacy-policy'],
    ['Terms & Conditions', '/terms-and-conditions'],
    ['Cancellation Policy', '/cancellation-policy'],
    ['Grievance Redressal', '/grievance-redressal'],
    ['Legal Information', '/legal-information'],
    ['Company Information', '/company-information'],
];

function LinkList({ title, items }) {
    return (
        <div>
            <h4 style={headStyle}>{title}</h4>
            <ul style={listStyle}>
                {items.map(([label, to]) => <li key={label}><Link to={to} style={linkStyle}>{label}</Link></li>)}
            </ul>
        </div>
    );
}

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const subscribe = (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubscribed(true);
        setEmail('');
    };

    return (
        <footer style={{
            backgroundColor: 'var(--color-bg-secondary)',
            padding: '4rem 0 2rem',
            borderTop: '1px solid var(--color-border)',
            marginTop: '6rem'
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>ZAM</h3>
                        <p style={{ color: 'var(--color-accent)', fontWeight: 500, marginBottom: '1rem' }}>{C.tagline}</p>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                            ZAM is a contemporary clothing brand for men, women and kids, bringing together everyday style, quality and affordability for the whole family
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <a href={C.facebook} target="_blank" rel="noopener noreferrer" aria-label="ZAM on Facebook" style={{ color: 'var(--color-text)' }}><Facebook size={22} /></a>
                            <a href={C.instagram} target="_blank" rel="noopener noreferrer" aria-label="ZAM on Instagram" style={{ color: 'var(--color-text)' }}><Instagram size={22} /></a>
                        </div>
                    </div>

                    <LinkList title="Shop" items={SHOP} />
                    <LinkList title="Customer Support" items={SUPPORT} />
                    <LinkList title="Policies & Legal" items={LEGAL} />

                    <div>
                        <h4 style={headStyle}>Stay in Style</h4>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                            Be the first to discover new collections, exclusive offers and updates from ZAM.
                        </p>
                        {subscribed ? (
                            <p role="status" style={{ color: 'var(--color-accent)' }}>Thank you for subscribing!</p>
                        ) : (
                            <form onSubmit={subscribe} style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    aria-label="Email address"
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text)', width: '100%', outline: 'none' }}
                                />
                                <button type="submit" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Subscribe</button>
                            </form>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                    <p><strong>Registered Office:</strong> {C.address}</p>
                    <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', opacity: 0.8 }}>
                        © 2026 Zamcloth Private Limited. All rights reserved. <Link to="/admin" style={{ color: 'inherit', marginLeft: '0.75rem' }}>Admin</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
