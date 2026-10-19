import SafeImage from './SafeImage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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

                {/* Overlay Tags */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
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
                    {isHovered && product.stock !== 0 && (
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={(e) => {
                                e.preventDefault();
                                addToCart(product);
                            }}
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
                            <ShoppingBag size={16} /> Quick Add
                        </motion.button>
                    )}
                </AnimatePresence>
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
