import SafeImage from '../components/SafeImage';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState('M');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="container section">Loading...</div>;
    if (!product) return <div className="container section">Product not found</div>;

    return (
        <div className="container section" style={{ marginTop: '13rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
                {/* Image */}
                <div style={{ height: '600px', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <SafeImage
                        src={product.image}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {product.category}
                    </span>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>{product.name}</h1>
                    <p style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '2rem' }}>₹{product.price.toFixed(2)}</p>

                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '2rem' }}>
                        {product.description}
                    </p>

                    <div style={{ marginBottom: '2rem' }}>
                        <span style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>SELECT SIZE</span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['S', 'M', 'L', 'XL'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        width: '45px', height: '45px',
                                        border: size === selectedSize ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                        backgroundColor: size === selectedSize ? 'var(--color-accent)' : 'transparent',
                                        color: size === selectedSize ? 'var(--color-bg)' : 'var(--color-text)',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => addToCart({ ...product, id: product._id }, selectedSize)}
                        className="btn-primary"
                        disabled={product.stock === 0}
                        style={{ width: '100%', padding: '1.2rem', opacity: product.stock === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                    >
                        <ShoppingBag size={20} /> {product.stock === 0 ? 'Sold out' : 'Add to Bag'}
                    </button>

                    <ul style={{ marginTop: '3rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'disc', paddingLeft: '1rem' }}>
                        <li>Premium material blend</li>
                        <li>Ethically manufactured in Italy</li>
                        <li>Free shipping on orders over ₹500</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
