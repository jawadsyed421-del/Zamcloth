import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/zm-logo.png';

export default function Navbar() {
    const { toggleCart, cartCount } = useCart();
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav style={{
            position: 'fixed',
            top: '40px',
            left: 0,
            width: '100%',
            zIndex: 1000,
            padding: scrolled ? '0.5rem 0' : '1.25rem 0',
            background: scrolled ? 'rgba(10,10,10,0.92)' : 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
            transition: 'all 0.4s ease'
        }}>
            <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src={logo}
                        alt="ZAMCLOTH"
                        style={{
                            height: scrolled ? '56px' : '88px',
                            margin: scrolled ? '-4px 0' : '-12px 0',
                            
                            maxWidth: '300px',
                            objectFit: 'contain',
                            transition: 'height 0.4s ease'
                        }}
                    />
                </Link>

                {/* Desktop Menu */}
                <div className={`desktop-menu${open ? ' is-open' : ''}`}>
                    <Link to="/" style={navLinkStyle}>Home</Link>
                    <Link to="/shop?category=Kids" style={navLinkStyle}>Kids</Link>
                    <Link to="/shop?category=Women" style={navLinkStyle}>Women</Link>
                    <Link to="/shop?category=Men" style={navLinkStyle}>Men</Link>
                    <Link to="/shop?category=Accessories" style={navLinkStyle}>Accessories</Link>
                    <Link to="/shop?tag=new" style={navLinkStyle}>New Arrivals</Link>
                    <Link to="/size-guide" style={navLinkStyle}>Size Guide</Link>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)} style={{ color: 'var(--color-text)' }}>
                        {open ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to={user ? '/account' : '/login'} aria-label={user ? 'My account' : 'Sign in'} title={user ? user.name : 'Sign in'} style={{ color: 'var(--color-text)', display: 'flex' }}>
                        <User size={22} />
                    </Link>
                    <button aria-label="Search" style={{ color: 'var(--color-text)' }}>
                        <Search size={22} />
                    </button>
                    <button
                        onClick={toggleCart}
                        aria-label="Cart"
                        style={{ position: 'relative', color: 'var(--color-text)' }}
                    >
                        <ShoppingBag size={22} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                                backgroundColor: 'var(--color-accent)',
                                color: 'var(--color-bg)',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>{cartCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}

const navLinkStyle = {
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text)',
    textDecoration: 'none',
    transition: 'opacity 0.3s'
};
