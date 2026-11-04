import React from 'react';
import { COMPANY } from '../data/company';

const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
const orderNumber = (order) => order?.externalOrderNumber || `ZAM-${String(order?._id || '').slice(-6).toUpperCase()}`;
const date = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function OrderReceipt({ order, payment, gstin = '' }) {
    if (!order) return null;
    const shareText = [
        `ZAM order receipt ${orderNumber(order)}`,
        `Date: ${date(order.paidAt || order.createdAt)}`,
        ...order.orderItems.map(item => `${item.productCode || 'SKU pending'} · ${item.name} · Qty ${item.quantity} · ${money(item.price * item.quantity)}`),
        `Order total: ${money(order.totalPrice)}`,
        `Paid online: ${money(payment?.amount || 0)}`,
        `Payment reference: ${payment?.referenceId || '—'}`,
    ].join('\n');

    return (
        <section className="receipt-print-root" style={{ maxWidth: 720, margin: '1.5rem auto', padding: '1.5rem', background: '#fff', color: '#161616', border: '1px solid #dedede', borderRadius: 8, textAlign: 'left' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: '2px solid #d4af37', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div>
                    <strong style={{ fontSize: '1.5rem', letterSpacing: '0.12em' }}>ZAM CLOTH</strong>
                    <p style={{ color: '#555', fontSize: '0.85rem' }}>{COMPANY.legalName}</p>
                    <p style={{ color: '#555', fontSize: '0.8rem' }}>{COMPANY.address}</p>
                    {gstin && <p style={{ color: '#555', fontSize: '0.8rem' }}>GSTIN: {gstin}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ color: '#161616', fontSize: '1.35rem' }}>Payment receipt</h2>
                    <p><strong>{orderNumber(order)}</strong></p>
                    <p style={{ color: '#555', fontSize: '0.85rem' }}>{date(order.paidAt || order.createdAt)}</p>
                </div>
            </header>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                <strong>Deliver to</strong>
                <p>{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.address}, {order.shippingAddress?.city} {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}</p>
                <p>{order.shippingAddress?.phone} · {order.shippingAddress?.email}</p>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: '#161616' }}>
                    <thead>
                        <tr style={{ background: '#f4f1e8' }}>
                            {['Item', 'SKU', 'Qty', 'Price', 'Amount'].map(label => <th key={label} style={{ padding: '0.65rem', textAlign: label === 'Item' || label === 'SKU' ? 'left' : 'right' }}>{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {order.orderItems.map((item, index) => (
                            <tr key={`${item.productCode || item.name}-${index}`} style={{ borderBottom: '1px solid #e8e8e8' }}>
                                <td style={{ padding: '0.65rem' }}>{item.name}<small style={{ display: 'block', color: '#666' }}>{[item.color, item.size].filter(Boolean).join(' · ')}</small></td>
                                <td style={{ padding: '0.65rem' }}>{item.productCode || '—'}</td>
                                <td style={{ padding: '0.65rem', textAlign: 'right' }}>{item.quantity}</td>
                                <td style={{ padding: '0.65rem', textAlign: 'right' }}>{money(item.price)}</td>
                                <td style={{ padding: '0.65rem', textAlign: 'right' }}>{money(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <dl style={{ maxWidth: 360, margin: '1rem 0 1rem auto', fontSize: '0.9rem' }}>
                {[
                    ['Subtotal', money(order.itemsPrice)],
                    ...(order.discountPrice > 0 ? [['Discount', `-${money(order.discountPrice)}`]] : []),
                    ['Shipping', Number(order.shippingPrice) ? money(order.shippingPrice) : 'Free'],
                    ...(Number(order.taxPrice) ? [['Tax', money(order.taxPrice)]] : []),
                    ['Order total', money(order.totalPrice)],
                    ['Paid online', money(payment?.amount)],
                    ...(order.paymentMethod === 'Partial COD' ? [['COD balance', money(order.codBalance)]] : []),
                ].map(([label, amount], index) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem', borderTop: index === 4 ? '1px solid #bbb' : 0, fontWeight: index === 4 ? 700 : 400 }}>
                        <dt>{label}</dt><dd>{amount}</dd>
                    </div>
                ))}
            </dl>

            <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.75rem', fontSize: '0.82rem', color: '#555' }}>
                <p><strong>Payment:</strong> {payment?.method || order.paymentMethod} · <strong>Reference:</strong> {payment?.referenceId || '—'}</p>
                <p><strong>Payment ID:</strong> {payment?.paymentId || '—'}</p>
                <p style={{ marginTop: '0.5rem' }}>{COMPANY.tagline}</p>
            </div>
            <div className="receipt-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button type="button" className="btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
                <a className="btn-accent" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            </div>
        </section>
    );
}
