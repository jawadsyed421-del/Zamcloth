import SafeImage from './SafeImage';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
    const { isCartOpen, toggleCart, cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        toggleCart();
        navigate('/checkout');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleCart}
                        style={{
                            position: 'fixed', inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1001
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'fixed', right: 0, top: 0, bottom: 0,
                            width: '100%', maxWidth: '450px',
                            backgroundColor: 'var(--color-bg-secondary)',
                            zIndex: 1002,
                            borderLeft: '1px solid var(--color-border)',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Your Bag</h2>
                            <button onClick={toggleCart}><X size={24} color="var(--color-text)" /></button>
                        </div>

                        {/* Items */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            {cartItems.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-muted)' }}>
                                    <p>Your bag is empty.</p>
                                    <button onClick={toggleCart} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Continue Shopping</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {cartItems.map((item) => (
                                        <div key={`${item.id}-${item.size}`} style={{ display: 'flex', gap: '1rem' }}>
                                            <SafeImage src={item.image} alt={item.name} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 500 }}>{item.name}</h4>
                                                    <p>₹{item.price}</p>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                                    Size: {item.size}
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                                                        <button onClick={() => updateQuantity(item.id, item.size, -1)} style={{ padding: '0.5rem' }}><Minus size={14} color="var(--color-text)" /></button>
                                                        <span style={{ padding: '0 0.5rem', fontSize: '0.9rem' }}>{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.size, 1)} style={{ padding: '0.5rem' }}><Plus size={14} color="var(--color-text)" /></button>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id, item.size)} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}>Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div style={{ padding: '2rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    style={{
                                        width: '100%',
                                        padding: '1.2rem',
                                        backgroundColor: 'var(--color-accent)',
                                        color: 'var(--color-bg)',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        fontSize: '1rem'
                                    }}
                                >
                                    Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
