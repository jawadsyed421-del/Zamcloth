import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Shield } from 'lucide-react';

export default function Checkout() {
    const { cartItems, cartTotal } = useCart();
    const [step, setStep] = useState('shipping'); // shipping, payment, success
    const [loading, setLoading] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        address: '', city: '', postalCode: '', country: 'US', firstName: '', lastName: '', email: '', phone: ''
    });

    if (cartItems.length === 0 && step !== 'success') {
        return (
            <div className="container section" style={{ textAlign: 'center', marginTop: '10rem' }}>
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

        try {
            // 1. Create Order in Database
            const orderData = {
                orderItems: cartItems.map(item => ({
                    product: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size
                })),
                shippingAddress,
                paymentMethod: 'Razorpay',
                itemsPrice: cartTotal,
                taxPrice: 0,
                shippingPrice: 0,
                totalPrice: cartTotal
            };

            const orderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const order = await orderRes.json();
            if (!order._id) throw new Error('Order creation failed');

            // 2. Create Razorpay Order
            const paymentRes = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Math.round(cartTotal * 100) }) // Amount in smallest currency unit
            });
            const paymentOrder = await paymentRes.json();

            // 3. Fetch Key
            const keyRes = await fetch('/api/payment/key');
            const key = await keyRes.text();

            // 4. Initialize Razorpay Checkout
            const options = {
                key: key,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "ZamCloth",
                description: "Order #" + order._id,
                order_id: paymentOrder.id,
                handler: async function (response) {
                    // 5. Verify Payment (Update Order to Paid)
                    await fetch(`/api/orders/${order._id}/pay`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: response.razorpay_payment_id,
                            status: 'COMPLETED',
                            update_time: new Date().toISOString(),
                            email_address: shippingAddress.email
                        })
                    });
                    setStep('success');
                    setLoading(false);
                },
                prefill: {
                    name: shippingAddress.firstName + ' ' + shippingAddress.lastName,
                    email: shippingAddress.email,
                    contact: shippingAddress.phone
                },
                theme: {
                    color: "var(--color-accent)"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error(error);
            alert('Payment failed. Please try again.');
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="container section" style={{ textAlign: 'center', marginTop: '10rem', maxWidth: '600px' }}>
                <CheckCircle size={64} color="var(--color-accent)" style={{ margin: '0 auto 1.5rem' }} />
                <h1 style={{ marginBottom: '1rem' }}>Order Confirmed!</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Thank you for choosing ZamCloth. Your order has been received and is being processed with care.
                </p>
                <Link to="/" className="btn-primary">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="container section" style={{ marginTop: '13rem' }}>
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
                            <div style={{ display: 'grid', gap: '1.5rem', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                    <Shield size={20} color="var(--color-accent)" />
                                    <span style={{ fontSize: '0.9rem' }}>Secured by Razorpay</span>
                                </div>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    You will be redirected to the Razorpay secure gateway to complete your purchase.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', padding: '1.2rem', opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Processing...' : `Pay ₹${cartTotal.toFixed(2)}`}
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
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 600 }}>
                        <span>Total</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
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
