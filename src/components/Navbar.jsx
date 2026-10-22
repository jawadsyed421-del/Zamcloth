import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/zm-logo.png';

export default function Navbar() {
    const { toggleCart, cartCount } = useCart();
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => { setOpen(false); setSearching(false); }, [location.pathname, location.search]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => { if (searching) searchRef.current?.focus(); }, [searching]);

    const submitSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        if (q) navigate(`/shop?q=${encodeURIComponent(q)}`);
        setQuery('');
        setSearching(false);
    };

    return (
        <nav style={{
            position: 'fixed',
            top: '40px',
            left: 0,
            width: '100%',
            zIndex: 1000,
            padding: scrolled ? '0.35rem 0' : '0.9rem 0',
            background: scrolled ? 'rgba(10,10,10,0.94)' : 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
            transition: 'all 0.4s ease'
        }}>
            <div className="container nav-grid">
                {/* Left: menu */}
                <div className="nav-left">
                    <button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(o => !o)} style={{ color: 'var(--color-text)' }}>
                        {open ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className={`desktop-menu${open ? ' is-open' : ''}`}>
                        <Link to="/" style={navLinkStyle}>Home</Link>
                        <Link to="/shop?category=Kids" style={navLinkStyle}>Kids</Link>
                        <Link to="/shop?category=Women" style={navLinkStyle}>Women</Link>
                        <Link to="/shop?category=Men" style={navLinkStyle}>Men</Link>
                        <Link to="/shop?category=Accessories" style={navLinkStyle}>Accessories</Link>
                        <Link to="/shop?tag=new" style={navLinkStyle}>New Arrivals</Link>
                    </div>
                </div>

                {/* Middle: logo and name */}
                <Link to="/" className="nav-logo" aria-label="ZAM CLOTH home">
                    <img
                        src={logo}
                        alt=""
                        style={{ height: scrolled ? '40px' : '56px', objectFit: 'contain', transition: 'height 0.4s ease' }}
                    />
                    <span className="nav-brand">ZAM<span style={{ color: 'var(--color-accent)' }}> CLOTH</span></span>
                </Link>

                {/* Right: sign in, search, cart */}
                <div className="nav-right">
                    <Link to={user ? '/account' : '/login'} aria-label={user ? 'My account' : 'Sign in'} title={user ? user.name : 'Sign in'} style={{ ...navLinkStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={20} />
                        <span className="nav-signin-text">{user ? 'Account' : 'Sign in'}</span>
                    </Link>
                    <button aria-label="Search" onClick={() => setSearching(s => !s)} style={{ color: 'var(--color-text)', display: 'flex' }}>
                        <Search size={20} />
                    </button>
                    <button
                        onClick={toggleCart}
                        aria-label="Cart"
                        style={{ position: 'relative', color: 'var(--color-text)', display: 'flex' }}
                    >
                        <ShoppingBag size={20} />
                        {cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -6,
                                right: -8,
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

            {searching && (
                <form onSubmit={submitSearch} className="container" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 0' }}>
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products"
                        aria-label="Search products"
                        style={{ flex: 1, padding: '0.7rem 1rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
                    />
                    <button type="submit" className="btn-accent" style={{ padding: '0.7rem 1.5rem' }}>Search</button>
                </form>
            )}
        </nav>
    );
}

const navLinkStyle = {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text)',
    textDecoration: 'none',
    transition: 'opacity 0.3s'
};
