import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Shield } from 'lucide-react';
import { COD_ADVANCE, PREPAID_DISCOUNT_PERCENT } from '../data/company';
import { loadCashfree } from '../data/cashfree';
import AddressBook, { useAddresses, formatAddress } from '../components/AddressBook';

export default function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, loading: authLoading, authFetch } = useAuth();
    const [error, setError] = useState('');
    const [step, setStep] = useState('shipping'); // shipping, payment, success
    const [loading, setLoading] = useState(false);
    const [payMode, setPayMode] = useState('online'); // online | cod
    const [gateway, setGateway] = useState({ mode: '' }); // Cashfree environment (sandbox | production)
    const [receipt, setReceipt] = useState(null); // payment reference shown after success
    const [notice, setNotice] = useState('');

    useEffect(() => {
        fetch('/api/payment/config').then(r => r.json()).then(setGateway).catch(() => { });
    }, []);

    // Saved addresses: the default one is picked automatically so a returning customer can go straight to payment
    const book = useAddresses();
    const [selected, setSelected] = useState(null);
    const [autoPicked, setAutoPicked] = useState(false);
    useEffect(() => {
        if (!book.list || autoPicked) return;
        setAutoPicked(true);
        if (book.list.length > 0) {
            setSelected(book.list[0]);
            setStep('payment');
        }
    }, [book.list, autoPicked]);

    const prepaidDiscount = payMode === 'online' ? Math.round(cartTotal * PREPAID_DISCOUNT_PERCENT) / 100 : 0;
    const orderTotal = cartTotal - prepaidDiscount;
    const codAllowed = orderTotal > COD_ADVANCE;
    const payNow = payMode === 'cod' ? COD_ADVANCE : orderTotal;

    if (authLoading) return <div className="container section" style={{ minHeight: '60vh' }} />;
    if (!user) return <Navigate to="/login" replace />;

    if (cartItems.length === 0 && step !== 'success') {
        return (
            <div className="container section" style={{ textAlign: 'center', marginTop: '9rem' }}>
                <h2>Your bag is currently empty.</h2>
                <Link to="/shop" className="btn-primary" style={{ marginTop: '1rem' }}>Continue Shopping</Link>
            </div>
        );
    }

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!selected) { setError('Choose a delivery address first.'); return; }
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
                paymentMethod: payMode === 'cod' ? 'Partial COD' : 'Online',
                items: cartItems.map(item => ({ productId: item.id, size: item.size, color: item.color || '', quantity: item.quantity })),
                shippingAddress: {
                    fullName: selected.fullName,
                    email: selected.email,
                    phone: selected.phone,
                    address: selected.address,
                    city: selected.city,
                    postalCode: selected.postalCode
                }
            });
            const order = await orderRes.json();
            if (!orderRes.ok) throw new Error(order.message || 'Could not place your order');
            orderId = order._id;

            // 2. Start the Cashfree payment for that order
            const paymentRes = await post('/api/payment/create', { orderId });
            const payment = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(payment.message || 'Could not start the payment');

            // 3. Open Cashfree checkout; the server checks the result with Cashfree before the order counts as paid
            const Cashfree = await loadCashfree();
            const cashfree = Cashfree({ mode: payment.mode });
            const result = await cashfree.checkout({ paymentSessionId: payment.paymentSessionId, redirectTarget: '_modal' });

            if (result?.error && !result?.paymentDetails) {
                post('/api/payment/failed', { orderId, reason: result.error.message || 'Payment window closed' }).catch(() => { });
                throw new Error('Payment was not completed. You can try again.');
            }

            // Confirm with Cashfree. Some methods (like UPI) take a few seconds, so check a few times.
            let verified = null;
            for (let attempt = 0; attempt < 10; attempt++) {
                setNotice(attempt === 0 ? 'Confirming your payment…' : 'Still confirming your payment, please wait…');
                const verifyRes = await post('/api/payment/verify', { orderId });
                verified = await verifyRes.json();
                if (!verifyRes.ok) throw new Error(verified.message || 'Payment could not be confirmed');
                if (verified.status !== 'pending') break;
                await new Promise(r => setTimeout(r, 3000));
            }
            if (verified.status !== 'paid') {
                throw new Error(verified.status === 'pending'
                    ? `Your payment is still being confirmed. Check "My orders" in a minute (order …${orderId.slice(-6).toUpperCase()}).`
                    : 'Payment was not completed. You can try again.');
            }
            setReceipt({ orderId, ...verified.payment });
            setNotice('');
            clearCart();
            setStep('success');
            setLoading(false);
        } catch (err) {
            setNotice('');
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
                {receipt && (
                    <dl style={{ border: '1px solid var(--color-border)', borderRadius: '4px', textAlign: 'left', marginBottom: '2rem' }}>
                        {[
                            ['Order ID', `…${String(receipt.orderId).slice(-6).toUpperCase()}`],
                            ['Payment ID', receipt.paymentId],
                            ['Reference ID', receipt.referenceId],
                            ['Method', receipt.method],
                            ['Amount paid', receipt.amount != null ? `₹${Number(receipt.amount).toFixed(2)}` : ''],
                        ].filter(([, v]) => v).map(([k, v], i) => (
                            <div key={k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', padding: '0.8rem 1rem', borderTop: i ? '1px solid var(--color-border)' : 'none' }}>
                                <dt style={{ fontWeight: 600 }}>{k}</dt>
                                <dd style={{ color: 'var(--color-text-muted)', overflowWrap: 'anywhere', textTransform: k === 'Method' ? 'capitalize' : 'none' }}>{v}</dd>
                            </div>
                        ))}
                    </dl>
                )}
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
                        <span style={{ color: step === 'shipping' ? 'var(--color-text)' : 'inherit', borderBottom: step === 'shipping' ? '1px solid var(--color-accent)' : 'none' }}>1. Address</span>
                        <span>&gt;</span>
                        <span style={{ color: step === 'payment' ? 'var(--color-text)' : 'inherit', borderBottom: step === 'payment' ? '1px solid var(--color-accent)' : 'none' }}>2. Payment</span>
                    </div>
                    <div style={{ background: '#111', color: '#fff', textAlign: 'center', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', borderRadius: '4px' }}>
                        Get an additional {PREPAID_DISCOUNT_PERCENT}% OFF on prepaid orders!
                    </div>

                    {step === 'shipping' ? (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Delivery address</h2>
                            <AddressBook book={book} selectedId={selected?._id} onSelect={setSelected} />
                            {selected && (
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => setStep('payment')}
                                    style={{ marginTop: '1.5rem', width: '100%', padding: '1.2rem' }}
                                >
                                    Deliver here and continue to payment
                                </button>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handlePayment}>
                            {selected && (
                                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '1rem 1.2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deliver to</p>
                                        <p style={{ fontWeight: 600 }}>{selected.fullName} · {selected.phone}</p>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{formatAddress(selected)}</p>
                                    </div>
                                    <button type="button" onClick={() => setStep('shipping')} style={{ color: 'var(--color-accent)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Change</button>
                                </div>
                            )}
                            <h2 style={{ marginBottom: '1.5rem' }}>Payment Method</h2>
                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                <label style={optionStyle(payMode === 'online')}>
                                    <input type="radio" name="payMode" checked={payMode === 'online'} onChange={() => setPayMode('online')} />
                                    <span>
                                        <strong>Pay online ({PREPAID_DISCOUNT_PERCENT}% extra off)</strong>
                                        <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>UPI, cards and net banking via Cashfree. Pay ₹{(cartTotal - Math.round(cartTotal * PREPAID_DISCOUNT_PERCENT) / 100).toFixed(2)} now.</span>
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
                                    <Shield size={18} color="var(--color-accent)" /> Secured by Cashfree Payments
                                </div>
                            </div>
                            {gateway.mode === 'sandbox' && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-accent)', borderRadius: '4px', padding: '0.8rem 1rem', marginBottom: '1rem', lineHeight: 1.7 }}>
                                    <strong style={{ color: 'var(--color-accent)' }}>Demo mode (Cashfree sandbox).</strong> No real money is charged.
                                    Test card <strong>4111 1111 1111 1111</strong>, any future expiry, CVV <strong>123</strong>, OTP <strong>111000</strong>.
                                    Test UPI: <strong>testsuccess@gocash</strong>.
                                </p>
                            )}
                            {notice && <p role="status" style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>{notice}</p>}
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
                                Change address
                            </button>
                        </form>
                    )}
                </div>

                {/* Right Column: Summary */}
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '2rem', height: 'fit-content' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Order Summary</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {cartItems.map(item => (
                            <div key={`${item.id}-${item.size}-${item.color || ''}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span>{item.name} <span style={{ color: 'var(--color-text-muted)' }}>({item.size}{item.color ? `, ${item.color}` : ''}) x{item.quantity}</span></span>
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
