import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Truck, RefreshCw, ShieldCheck, Zap, Ruler } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SizeChartModal from '../components/SizeChartModal';
import SizeChip from '../components/SizeChip';
import ProductGallery from '../components/ProductGallery';
import { sizeInfo } from '../data/sizes';
import ColorSwatches from '../components/ColorSwatches';
import { photosFor, imageFor } from '../data/colors';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, setIsCartOpen } = useCart();
    const [selectedSize, setSelectedSize] = useState('');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);
    const [selectedColor, setSelectedColor] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);
                setSelectedSize(data.sizes?.[0] || '');
                setSelectedColor(data.colorOptions?.[0]?.name || '');
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
        <div className="container section" style={{ marginTop: '9rem' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
                {/* Photos */}
                <div style={{ minWidth: 0 }}>
                    <ProductGallery key={selectedColor} images={photosFor(product, selectedColor)} name={product.name} />
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

                    {product.colorOptions?.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                COLOUR <strong style={{ color: 'var(--color-text)' }}>{selectedColor}</strong>
                            </span>
                            <ColorSwatches options={product.colorOptions} selected={selectedColor} onSelect={setSelectedColor} size={34} />
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <span>SIZE {selectedSize && <strong style={{ color: 'var(--color-text)' }}>{(() => { const i = sizeInfo(selectedSize, product.category, product.subcategory); return i.name ? `${i.code} – ${i.name}` : i.code; })()}</strong>}</span>
                            <button type="button" onClick={() => setShowChart(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-accent)', textDecoration: 'underline' }}><Ruler size={16} /> Size Chart</button>
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {(product.sizes?.length ? product.sizes : ['S', 'M', 'L', 'XL']).map(size => (
                                <SizeChip
                                    key={size}
                                    size={size}
                                    category={product.category}
                                    subcategory={product.subcategory}
                                    selected={size === selectedSize}
                                    onClick={() => setSelectedSize(size)}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => addToCart({ ...product, id: product._id, image: imageFor(product, selectedColor) }, selectedSize, selectedColor)}
                        className="btn-primary"
                        disabled={product.stock === 0}
                        style={{ width: '100%', padding: '1.2rem', opacity: product.stock === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                    >
                        <ShoppingBag size={20} /> {product.stock === 0 ? 'Sold out' : 'Add to Cart'}
                    </button>
                    {product.stock > 0 && (
                        <button
                            onClick={() => { addToCart({ ...product, id: product._id, image: imageFor(product, selectedColor) }, selectedSize, selectedColor); setIsCartOpen(false); navigate('/checkout'); }}
                            className="btn-accent"
                            style={{ width: '100%', padding: '1.2rem', marginTop: '0.8rem' }}
                        >
                            Buy it now
                        </button>
                    )}

                    <ul style={{ marginTop: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'disc', paddingLeft: '1rem' }}>
                        <li>Get an extra 5% off on prepaid orders</li>
                        <li>Free shipping on orders of ₹1,499 or more</li>
                        <li>Partial COD available: pay ₹99 now, the rest on delivery</li>
                    </ul>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginTop: '2rem' }}>
                        {[[Truck, 'Free shipping ₹1,499+'], [RefreshCw, 'Easy exchanges'], [ShieldCheck, '100% secure payments'], [Zap, 'Fast dispatch']].map(([Icon, label]) => (
                            <div key={label} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <Icon size={20} color="var(--color-accent)" /> {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showChart && <SizeChartModal category={product.category} subcategory={product.subcategory} onClose={() => setShowChart(false)} />}
        </div>
    );
}
