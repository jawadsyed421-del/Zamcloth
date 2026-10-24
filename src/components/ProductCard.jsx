import SafeImage from './SafeImage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SizeChip from './SizeChip';
import ColorSwatches from './ColorSwatches';
import { imageFor } from '../data/colors';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const [isHovered, setIsHovered] = useState(false);
    const [picking, setPicking] = useState(false);
    const colors = product.colorOptions || [];
    const [pickColor, setPickColor] = useState(colors[0]?.name || '');
    const sizes = product.sizes?.length ? product.sizes : [];
    const noHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;
    const showQuickAdd = (isHovered || picking || noHover) && product.stock !== 0;

    const quickAdd = (e) => {
        e.preventDefault();
        if (sizes.length > 1 || colors.length > 1) { setPicking(p => !p); return; }
        addToCart({ ...product, image: imageFor(product, pickColor) }, sizes[0] || 'One Size', pickColor);
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setPicking(false); }}
        >
            {/* Image Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3/4',
                overflow: 'hidden',
                marginBottom: '1rem',
                borderRadius: '2px',
                backgroundColor: 'var(--color-bg-secondary)'
            }}>
                <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`} style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
                    <SafeImage
                        src={product.image}
                        alt={product.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.6s ease',
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
                        }}
                    />
                    {product.images?.[1] && (
                        <SafeImage
                            src={product.images[1]}
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s ease' }}
                        />
                    )}
                </Link>

                {/* Overlay Tags */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', pointerEvents: 'none' }}>
                    {product.stock === 0 && (
                        <span style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)', padding: '0.2rem 0.8rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Sold out</span>
                    )}
                    {product.isNew && (
                        <span style={{
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            padding: '0.2rem 0.8rem',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600
                        }}>New</span>
                    )}
                    {product.isTrending && (
                        <span style={{
                            backgroundColor: 'var(--color-accent)',
                            color: 'var(--color-bg)',
                            padding: '0.2rem 0.8rem',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600
                        }}>Trending</span>
                    )}
                </div>

                {/* Quick Add Button */}
                <AnimatePresence>
                    {showQuickAdd && (
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={quickAdd}
                            style={{
                                position: 'absolute',
                                bottom: '1rem',
                                left: '1rem',
                                right: '1rem',
                                padding: '0.8rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: '#000',
                                border: 'none',
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            <ShoppingBag size={16} /> {picking ? 'Select options' : 'Quick Add'}
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Size picker: the shopper chooses the size before it goes in the cart */}
                {picking && (
                    <div style={{ position: 'absolute', left: '1rem', right: '1rem', bottom: '4.2rem', background: 'rgba(10,10,10,0.95)', border: '1px solid var(--color-border)', padding: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                        {colors.length > 1 && (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <ColorSwatches options={colors} selected={pickColor} onSelect={setPickColor} size={24} />
                            </div>
                        )}
                        {sizes.length === 0 && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); addToCart({ ...product, image: imageFor(product, pickColor) }, 'One Size', pickColor); setPicking(false); }}
                                style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.8rem', textTransform: 'uppercase' }}
                            >
                                Add to cart
                            </button>
                        )}
                        {sizes.map(size => (
                            <SizeChip
                                key={size}
                                compact
                                size={size}
                                category={product.category}
                                subcategory={product.subcategory}
                                onClick={(e) => { e.preventDefault(); addToCart({ ...product, image: imageFor(product, pickColor) }, size, pickColor); setPicking(false); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Details */}
            <Link to={`/product/${product.id}`}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>{product.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{product.category}</p>
                <p style={{ marginTop: '0.5rem', fontWeight: 500, color: 'var(--color-accent)' }}>₹{product.price.toFixed(2)}</p>
            </Link>
        </div>
    );
}
