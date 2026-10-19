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
            <section className="section container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '4rem' }}>
                    <div>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Trending Now</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>Curated favorites for the season.</p>
                    </div>
                    <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.2rem', fontSize: '1.1rem' }}>
                        View All <ArrowRight size={20} />
                    </Link>
                </div>

                {trendingProducts.length === 0 && (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '4rem 0' }}>New arrivals are on the way. Check back soon.</p>
                )}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '4rem'
                }}>
                    {trendingProducts.map(product => (
                        <div key={product._id}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories Section */}
            <section className="section" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <h2 style={{ fontSize: '3rem', marginBottom: '4rem', textAlign: 'center' }}>Shop by Category</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '2rem'
                    }}>
                        {categories.map(cat => (
                            <Link key={cat.id} to={`/shop?category=${cat.name}`} style={{ position: 'relative', height: '520px', overflow: 'hidden', display: 'block' }}>
                                <SafeImage
                                    src={cat.image}
                                    alt={cat.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s ease' }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    display: 'flex', alignItems: 'flex-end', padding: '3rem'
                                }}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '2rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>{cat.name}</h3>
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
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '4rem 0'
                }}>
                    <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1.5rem', fontWeight: 600 }}>Our Philosophy</span>
                    <h2 style={{ fontSize: '3.5rem', marginBottom: '2.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                        We believe style is a<br /> form of silence.
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: '1.9', marginBottom: '4rem' }}>
                        ZamCloth began with a simple idea: to create clothing that speaks for itself.
                        Meticulously crafted, intentionally designed, and ethically sourced.
                        Every piece tells a story of craftsmanship and timeless elegance.
                    </p>
                    <Link to="/shop" className="btn-accent" style={{ padding: '1.2rem 3rem' }}>Discover the Brand</Link>
                </div>
            </section>
        </div>
    );
}
