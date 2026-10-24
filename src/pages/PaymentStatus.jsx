import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Where Cashfree sends the customer back after paying (needed for UPI apps and redirects).
export default function PaymentStatus() {
    const [params] = useSearchParams();
    const orderId = params.get('order');
    const { user, loading: authLoading, authFetch } = useAuth();
    const { clearCart } = useCart();
    const [status, setStatus] = useState('checking'); // checking | paid | pending | failed | error
    const [receipt, setReceipt] = useState(null);
    const started = useRef(false);
    const authFetchRef = useRef(authFetch);
    const clearCartRef = useRef(clearCart);
    authFetchRef.current = authFetch;
    clearCartRef.current = clearCart;

    // Runs once: asks the server to confirm the payment with Cashfree, retrying while it is still pending
    useEffect(() => {
        if (authLoading || !user || !orderId || started.current) return;
        started.current = true;
        let cancelled = false;
        (async () => {
            try {
                for (let attempt = 0; attempt < 10 && !cancelled; attempt++) {
                    const res = await authFetchRef.current('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId })
                    });
                    const d = await res.json();
                    if (cancelled) return;
                    if (!res.ok) { setStatus('error'); return; }
                    if (d.status === 'paid') { clearCartRef.current(); setReceipt(d.payment); }
                    setStatus(d.status);
                    if (d.status !== 'pending') return;
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch {
                if (!cancelled) setStatus('error');
            }
        })();
        return () => { cancelled = true; started.current = false; };
    }, [authLoading, user, orderId]);

    if (authLoading) return <div className="container section" style={{ minHeight: '60vh' }} />;
    if (!orderId) return <Navigate to="/" replace />;
    if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/payment-status?order=${orderId}`)}`} replace />;

    const view = {
        checking: [Clock, 'Confirming your payment…', 'Please wait a moment.'],
        paid: [CheckCircle, 'Order Confirmed!', 'Thank you for choosing ZAM. Your payment was received and your order is being processed.'],
        pending: [Clock, 'Payment is being confirmed', 'This can take a minute. Check My Orders shortly. If money was deducted, it will be confirmed automatically.'],
        failed: [XCircle, 'Payment not completed', 'No money was taken, or it will be returned by your bank. You can try again from your bag.'],
        error: [XCircle, 'We could not check your payment', 'Please check My Orders or contact us with your order number.'],
    }[status];
    const Icon = view[0];

    return (
        <div className="container section" style={{ textAlign: 'center', marginTop: '9rem', maxWidth: '600px' }}>
            <Icon size={64} color="var(--color-accent)" style={{ margin: '0 auto 1.5rem' }} />
            <h1 style={{ marginBottom: '1rem' }}>{view[1]}</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>{view[2]}</p>
            {status === 'paid' && receipt && (
                <dl style={{ border: '1px solid var(--color-border)', borderRadius: '4px', textAlign: 'left', marginBottom: '2rem' }}>
                    {[
                        ['Order ID', `…${String(orderId).slice(-6).toUpperCase()}`],
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
            <Link to={status === 'failed' ? '/checkout' : '/'} style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
                {status === 'failed' ? 'Try again' : 'Return home'}
            </Link>
        </div>
    );
}
