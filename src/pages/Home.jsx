import SafeImage from '../components/SafeImage';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';

const SECTIONS = ['Women', 'Kids', 'Men', 'Accessories'];

export default function Home() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch('/api/products')
            .then(r => r.json())
            .then(data => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setProducts([]));
    }, []);

    const featured = products.filter(p => p.isTrending || p.isNew);
    const trendingProducts = (featured.length ? featured : products).slice(0, 3);
    const categories = SECTIONS.map(name => ({
        id: name,
        name,
        image: products.find(p => p.category === name)?.image,
        comingSoon: !products.some(p => p.category === name)
    }));

    return (
        <div>
            <Hero />

            {/* Trending Section */}
            <section className="section container home-trending">
                <div className="home-section-header">
                    <div>
                        <h2>Trending Now</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>Curated favorites for the season.</p>
                    </div>
                    <Link to="/shop" className="home-section-link">
                        View All <ArrowRight size={20} />
                    </Link>
                </div>

                {trendingProducts.length === 0 && (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '4rem 0' }}>New arrivals are on the way. Check back soon.</p>
                )}
                <div className="home-product-grid">
                    {trendingProducts.map(product => (
                        <div key={product._id}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories Section */}
            <section className="section home-categories" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="container">
                        <h2 className="home-section-title">Shop by Category</h2>
                        <div className="home-category-grid">
                        {categories.map(cat => (
                                <Link key={cat.id} to={`/shop?category=${cat.name}`} className="home-category-card">
                                <SafeImage
                                    src={cat.image}
                                    alt={cat.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'filter 0.8s ease' }}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    display: 'flex', alignItems: 'flex-end', padding: 'clamp(1rem, 4vw, 3rem)'
                                }}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 className="home-category-title">{cat.name}</h3>
                                            {cat.comingSoon && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Coming soon</p>}
                                        </div>
                                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '50%', display: 'flex' }}>
                                            <ArrowRight size={24} color="#000" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story / Banner */}
            <section className="section container">
                <div
                    className="home-story"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        maxWidth: '900px',
                        margin: '0 auto',
                        padding: '4rem 0'
                    }}
                >
                    <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1.5rem', fontWeight: 600 }}>Our Philosophy</span>
                    <h2 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', marginBottom: '2.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                        Style That Speaks<br /> Without Words
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: '1.9', marginBottom: '1.5rem' }}>
                        At ZAM, we believe great style begins with simplicity. We bring together contemporary fashion,
                        everyday comfort, and thoughtful design at prices that make sense.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: '1.9', marginBottom: '1.5rem' }}>
                        Our goal is simple: to make looking good feel effortless and affordable.
                    </p>
                    <p style={{ color: 'var(--color-accent)', fontSize: '1.3rem', fontWeight: 600, marginBottom: '3rem' }}>
                        ZAM — Affordable Fashion. Premium Feel.
                    </p>
                    <Link to="/about-us" className="btn-accent" style={{ padding: '1.2rem 3rem' }}>Discover the Brand</Link>
                </div>
            </section>
        </div>
    );
}
