import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Shield } from 'lucide-react';
import { COD_ADVANCE, PREPAID_DISCOUNT_PERCENT } from '../data/company';

export default function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, loading: authLoading, authFetch } = useAuth();
    const [error, setError] = useState('');
    const [step, setStep] = useState('shipping'); // shipping, payment, success
    const [loading, setLoading] = useState(false);
    const [payMode, setPayMode] = useState('online'); // online | cod
    const [shippingAddress, setShippingAddress] = useState({
        address: '', city: '', postalCode: '', firstName: '', lastName: '', email: user?.email || '', phone: user?.phone || ''
    });

    const prepaidDiscount = payMode === 'online' ? Math.round(cartTotal * PREPAID_DISCOUNT_PERCENT) / 100 : 0;
    const orderTotal = cartTotal - prepaidDiscount;
    const codAllowed = orderTotal > COD_ADVANCE;
    const payNow = payMode === 'cod' ? COD_ADVANCE : orderTotal;

    if (authLoading) return <div className="container section" style={{ minHeight: '60vh' }} />;
    if (!user) return <Navigate to="/login?next=/checkout" replace />;

    if (cartItems.length === 0 && step !== 'success') {
        return (
            <div className="container section" style={{ textAlign: 'center', marginTop: '9rem' }}>
                <h2>Your bag is currently empty.</h2>
                <Link to="/shop" className="btn-primary" style={{ marginTop: '1rem' }}>Continue Shopping</Link>
            </div>
        );
    }

    const handleInputChange = (e) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        let orderId = '';

        const post = (url, body) => authFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        try {
            // 1. Save the order. The server prices it from the database.
            const orderRes = await post('/api/orders', {
                paymentMethod: payMode === 'cod' ? 'Partial COD' : 'Razorpay',
                items: cartItems.map(item => ({ productId: item.id, size: item.size, quantity: item.quantity })),
                shippingAddress: {
                    fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
                    email: shippingAddress.email,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    postalCode: shippingAddress.postalCode
                }
            });
            const order = await orderRes.json();
            if (!orderRes.ok) throw new Error(order.message || 'Could not place your order');
            orderId = order._id;

            // 2. Start the payment for that order
            const paymentRes = await post('/api/payment/create', { orderId });
            const paymentOrder = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(paymentOrder.message || 'Could not start the payment');

            const key = await (await fetch('/api/payment/key')).text();

            // 3. Open Razorpay; the server verifies the result before the order counts as paid
            const rzp = new window.Razorpay({
                key,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: 'ZamCloth',
                description: `Order …${orderId.slice(-6).toUpperCase()}`,
                order_id: paymentOrder.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await post('/api/payment/verify', { orderId, ...response });
                        const verified = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verified.message);
                        clearCart();
                        setStep('success');
                    } catch (err) {
                        setError(`${err.message || 'Payment could not be confirmed'}. If money was deducted, contact us with order …${orderId.slice(-6).toUpperCase()}.`);
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        post('/api/payment/failed', { orderId, reason: 'Payment window closed' }).catch(() => { });
                        setError('Payment was not completed. You can try again.');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
                    email: shippingAddress.email,
                    contact: shippingAddress.phone
                },
                theme: { color: '#D4AF37' }
            });
            rzp.open();
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="container section" style={{ textAlign: 'center', marginTop: '9rem', maxWidth: '600px' }}>
                <CheckCircle size={64} color="var(--color-accent)" style={{ margin: '0 auto 1.5rem' }} />
                <h1 style={{ marginBottom: '1rem' }}>Order Confirmed!</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Thank you for choosing ZamCloth. Your order has been received and is being processed with care.
                </p>
                <Link to="/account" className="btn-primary" style={{ marginRight: '1rem' }}>View my orders</Link>
                <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Return home</Link>
            </div>
        );
    }

    return (
        <div className="container section" style={{ marginTop: '9rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' }}>Checkout</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
                {/* Left Column: Forms */}
                <div>
                    {/* Steps Indicator */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ color: step === 'shipping' ? 'var(--color-text)' : 'inherit', borderBottom: step === 'shipping' ? '1px solid var(--color-accent)' : 'none' }}>1. Shipping</span>
                        <span>&gt;</span>
                        <span style={{ color: step === 'payment' ? 'var(--color-text)' : 'inherit', borderBottom: step === 'payment' ? '1px solid var(--color-accent)' : 'none' }}>2. Payment</span>
                    </div>
                    <div style={{ background: '#111', color: '#fff', textAlign: 'center', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', borderRadius: '4px' }}>
                        Get an additional {PREPAID_DISCOUNT_PERCENT}% OFF on prepaid orders!
                    </div>

                    {step === 'shipping' ? (
                        <form onSubmit={(e) => { e.preventDefault(); setStep('payment'); }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Shipping Details</h2>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input name="firstName" onChange={handleInputChange} type="text" placeholder="First Name" required style={inputStyle} />
                                    <input name="lastName" onChange={handleInputChange} type="text" placeholder="Last Name" required style={inputStyle} />
                                </div>
                                <input name="email" onChange={handleInputChange} type="email" placeholder="Email Address" required style={inputStyle} />
                                <input name="address" onChange={handleInputChange} type="text" placeholder="Street Address" required style={inputStyle} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input name="city" onChange={handleInputChange} type="text" placeholder="City" required style={inputStyle} />
                                    <input name="postalCode" onChange={handleInputChange} type="text" placeholder="Postal Code" required style={inputStyle} />
                                </div>
                                <input name="phone" onChange={handleInputChange} type="tel" placeholder="Phone Number" required style={inputStyle} />
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '1.2rem' }}>Continue to Payment</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlePayment}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Payment Method</h2>
                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                <label style={optionStyle(payMode === 'online')}>
                                    <input type="radio" name="payMode" checked={payMode === 'online'} onChange={() => setPayMode('online')} />
                                    <span>
                                        <strong>Pay online ({PREPAID_DISCOUNT_PERCENT}% extra off)</strong>
                                        <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>UPI, cards and net banking via Razorpay. Pay ₹{(cartTotal - Math.round(cartTotal * PREPAID_DISCOUNT_PERCENT) / 100).toFixed(2)} now.</span>
                                    </span>
                                </label>
                                <label style={{ ...optionStyle(payMode === 'cod'), opacity: codAllowed ? 1 : 0.5 }}>
                                    <input type="radio" name="payMode" checked={payMode === 'cod'} disabled={!codAllowed} onChange={() => setPayMode('cod')} />
                                    <span>
                                        <strong>Partial Cash on Delivery</strong>
                                        <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            Pay ₹{COD_ADVANCE} online now and ₹{Math.max(0, cartTotal - COD_ADVANCE).toFixed(2)} at delivery. The advance is part of your total, not an extra fee. No prepaid discount.
                                        </span>
                                    </span>
                                </label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    <Shield size={18} color="var(--color-accent)" /> Secured by Razorpay
                                </div>
                            </div>
                            {error && <p role="alert" style={{ color: '#e07a7a', marginBottom: '1rem' }}>{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', padding: '1.2rem', opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Processing...' : `Pay ₹${payNow.toFixed(2)}${payMode === 'cod' ? ' now' : ''}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('shipping')}
                                style={{ width: '100%', padding: '1.2rem', marginTop: '0', color: 'var(--color-text-muted)', textDecoration: 'underline', border: 'none' }}
                            >
                                Back to Shipping
                            </button>
                        </form>
                    )}
                </div>

                {/* Right Column: Summary */}
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '2rem', height: 'fit-content' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Order Summary</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {cartItems.map(item => (
                            <div key={`${item.id}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{item.name} <span style={{ color: 'var(--color-text-muted)' }}>x{item.quantity}</span></span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
                        <div style={rowStyle}><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
                        {prepaidDiscount > 0 && <div style={{ ...rowStyle, color: 'var(--color-accent)' }}><span>Prepaid discount ({PREPAID_DISCOUNT_PERCENT}%)</span><span>-₹{prepaidDiscount.toFixed(2)}</span></div>}
                        <div style={rowStyle}><span>Shipping</span><span>Free</span></div>
                        <div style={{ ...rowStyle, borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '1.2rem', fontWeight: 600 }}><span>Total</span><span>₹{orderTotal.toFixed(2)}</span></div>
                        {payMode === 'cod' && step === 'payment' && (
                            <>
                                <div style={rowStyle}><span>Pay now</span><span>₹{COD_ADVANCE.toFixed(2)}</span></div>
                                <div style={rowStyle}><span>Pay on delivery</span><span>₹{(orderTotal - COD_ADVANCE).toFixed(2)}</span></div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: '0.9rem'
};

const rowStyle = { display: 'flex', justifyContent: 'space-between' };
const optionStyle = (active) => ({
    display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.2rem', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`, borderRadius: '4px'
});
