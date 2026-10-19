import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{
            backgroundColor: 'var(--color-bg-secondary)',
            padding: '4rem 0 2rem',
            borderTop: '1px solid var(--color-border)',
            marginTop: '6rem'
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>ZAM<span style={{ color: 'var(--color-accent)' }}>CLOTH</span></h3>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                            Elevating everyday wear through precision tailoring and premium materials.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', color: 'var(--color-text)' }}>Shop</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li><Link to="/shop" style={{ color: 'var(--color-text-muted)' }}>New Arrivals</Link></li>
                            <li><Link to="/shop" style={{ color: 'var(--color-text-muted)' }}>Men</Link></li>
                            <li><Link to="/shop" style={{ color: 'var(--color-text-muted)' }}>Women</Link></li>
                            <li><Link to="/shop" style={{ color: 'var(--color-text-muted)' }}>Accessories</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', color: 'var(--color-text)' }}>Help</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <li><Link to="#" style={{ color: 'var(--color-text-muted)' }}>Shipping & Returns</Link></li>
                            <li><Link to="#" style={{ color: 'var(--color-text-muted)' }}>Size Guide</Link></li>
                            <li><Link to="#" style={{ color: 'var(--color-text-muted)' }}>FAQ</Link></li>
                            <li><Link to="#" style={{ color: 'var(--color-text-muted)' }}>Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', color: 'var(--color-text)' }}>Newsletter</h4>
                        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text)',
                                    width: '100%',
                                    outline: 'none'
                                }}
                            />
                            <button style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>Join</button>
                        </form>
                    </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <p><strong>Contact:</strong> 9372578357

                        <br />
                        <strong>e-mail:</strong> info@zamcloth.com</p>

                    <p style={{ marginTop: '0.5rem' }}><strong>Office Address:</strong> F47 1st Floor D Wing, Elco Arcade 46 Hill Road, Bandra West, Mumbai, Maharashtra, India, 400050</p>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>© 2026 ZamCloth. All rights reserved. <Link to="/admin" style={{ color: 'inherit', marginLeft: '0.75rem' }}>Admin</Link></p>
                </div>
            </div>
        </footer>
    );
}
