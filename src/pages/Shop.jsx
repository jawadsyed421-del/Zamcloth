import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { normSize } from '../data/sizes';
import { Filter, X } from 'lucide-react';

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter States
    const categoryParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');
    const searchQuery = (searchParams.get('q') || '').trim().toLowerCase();

    const [filters, setFilters] = useState({
        category: categoryParam || "All",
        subcategory: "All",
        priceRange: "All",
        size: "All"
    });

    useEffect(() => {
        if (categoryParam) {
            setFilters(prev => ({ ...prev, category: categoryParam, subcategory: 'All', size: 'All' }));
        }
    }, [categoryParam]);

    useEffect(() => {
        if (tagParam === 'new') {
            setFilters(prev => ({
                ...prev,
                category: "All",
                subcategory: "All",
                priceRange: "All",
                size: "All"
            }));
        }
    }, [tagParam]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Derived Data for Filters
    const categories = ["All", "Kids", "Women", "Men", "Accessories"];

    const subcategories = {
        "Kids": ["All", "Boys", "Girls"],
        "Women": ["All", "Kurtis", "Dresses", "Co-ord Sets", "Ethnic Wear"],
        "Men": ["All", "Jeans", "T-Shirts"],
        "Accessories": ["All", "Perfumes", "Wallets"]
    };

    const kidsSizes = ["All", "2–3 years", "3–4 years", "4–5 years", "5–6 years", "6–7 years", "7–8 years", "8–9 years", "9–10 years", "10–11 years", "11–12 years"];
    const adultSizes = ["All", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
    const sizes = filters.category === 'Kids' ? kidsSizes : adultSizes;
    const priceRanges = ["All", "Under 500", "500 - 1000", "1000 - 2000", "Above 2000"];

    // Filtering Logic
    const filteredProducts = products.filter(product => {
        // Tag Filter (New Arrivals, Best Sellers)
        if (tagParam === 'new' && !product.isNew) return false;

        // Category Filter
        if (filters.category !== "All" && product.category !== filters.category) return false;

        // Subcategory Filter
        if (filters.subcategory !== "All" && product.subcategory !== filters.subcategory) return false;

        // Search
        if (searchQuery && !`${product.name} ${product.description} ${product.category} ${product.subcategory}`.toLowerCase().includes(searchQuery)) return false;

        // Size Filter (old "4-5Y" style sizes are treated the same as "4–5 years")
        if (filters.size !== "All" && product.sizes && !product.sizes.some(sz => normSize(sz) === normSize(filters.size))) return false;

        // Price Filter
        if (filters.priceRange !== "All") {
            const price = product.price;
            if (filters.priceRange === "Under 500" && price >= 500) return false;
            if (filters.priceRange === "500 - 1000" && (price < 500 || price > 1000)) return false;
            if (filters.priceRange === "1000 - 2000" && (price < 1000 || price > 2000)) return false;
            if (filters.priceRange === "Above 2000" && price <= 2000) return false;
        }

        return true;
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        // Reset sub filters if main category changes
        if (key === 'category') {
            setSearchParams({ category: value === 'All' ? '' : value });
            setFilters(prev => ({ ...prev, subcategory: 'All', size: 'All' }));
        }
    };

    // Coming Soon Logic
    if (filters.category === 'Accessories') {
        return (
            <div className="container section" style={{
                marginTop: '9rem',
                minHeight: '50vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>
                    Coming Soon
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                    We're curating an exclusive {filters.category} collection just for you. <br />
                    Stay tuned for something extraordinary.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => {
                            setFilters(prev => ({ ...prev, category: 'All' }));
                            setSearchParams({});
                        }}
                        className="btn-primary"
                    >
                        Browse All Collections
                    </button>
                    <button
                        onClick={() => {
                            setFilters(prev => ({ ...prev, category: 'Kids' }));
                            setSearchParams({ category: 'Kids' });
                        }}
                        style={{
                            padding: '0.8rem 2rem',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text)',
                            textTransform: 'uppercase',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        View Kids
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container section" style={{ marginTop: '9rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                {filters.category === 'All' ? 'Our Collection' : `${filters.category} Collection`}
            </h1>

            <div className="shop-layout" style={{ display: 'flex', gap: '3rem', position: 'relative' }}>

                {/* Mobile Filter Toggle */}
                <button
                    className="mobile-filter-btn"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        display: 'none', // Managed by CSS media queries ideally, but inline for now
                        marginBottom: '1rem',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)'
                    }}
                >
                    <Filter size={18} /> Filters
                </button>

                {/* Sidebar Filters */}
                <aside style={{
                    width: '250px',
                    flexShrink: 0,
                }} className={showFilters ? 'filters-visible' : 'filters-sidebar'}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>Filters</h3>
                        {/* Clear Filters */}
                        <button onClick={() => setFilters({ category: "All", subcategory: "All", priceRange: "All", size: "All" })} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Clear All</button>
                    </div>

                    {/* Category */}
                    <div className="filter-group">
                        <label>Category</label>
                        <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Subcategory */}
                    {filters.category !== 'All' && subcategories[filters.category] && (
                        <div className="filter-group">
                            <label>Subcategory</label>
                            <select value={filters.subcategory} onChange={(e) => handleFilterChange('subcategory', e.target.value)}>
                                {subcategories[filters.category].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Price Range */}
                    <div className="filter-group">
                        <label>Price</label>
                        <select value={filters.priceRange} onChange={(e) => handleFilterChange('priceRange', e.target.value)}>
                            {priceRanges.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Size */}
                    <div className="filter-group">
                        <label>Size</label>
                        <select value={filters.size} onChange={(e) => handleFilterChange('size', e.target.value)}>
                            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                </aside>

                {/* Product Grid */}
                <div style={{ flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center' }}>Loading...</div>
                    ) : filteredProducts.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '2.5rem 2rem',
                            alignItems: 'start'
                        }}>
                            {filteredProducts.map(product => (
                                <div key={product._id}>
                                    <ProductCard product={{ ...product, id: product._id }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No products match your filters.</p>
                            <button
                                onClick={() => setFilters({ category: "All", subcategory: "All", priceRange: "All", size: "All" })}
                                className="btn-accent"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                .filter-group {
                    margin-bottom: 1.5rem;
                }
                .filter-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .filter-group select {
                    width: 100%;
                    padding: 0.8rem;
                    background-color: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    color: var(--color-text);
                    font-family: var(--font-body);
                    border-radius: 4px;
                    outline: none;
                }
                .filter-group select:focus {
                    border-color: var(--color-accent);
                }
                @media (max-width: 768px) {
                    .shop-layout {
                        flex-direction: column;
                    }
                    .mobile-filter-btn {
                        display: flex !important;
                    }
                    .filters-sidebar {
                        display: none;
                    }
                    .filters-visible {
                        display: block;
                        width: 100% !important;
                        background: var(--color-bg-secondary);
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}
