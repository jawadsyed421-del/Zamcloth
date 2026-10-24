import PasswordInput from '../components/PasswordInput';
import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const field = {
    width: '100%', padding: '0.9rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit'
};
const label = { display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' };

// Only allow redirects back to pages inside this site
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export default function Auth({ mode }) {
    const isRegister = mode === 'register';
    const { user, authenticate } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = safeNext(params.get('next'));
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={next} replace />;

    const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try {
            await authenticate(mode, isRegister ? form : { email: form.email, password: form.password });
            navigate(next, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const other = `${isRegister ? '/login' : '/register'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`;

    return (
        <main className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10rem 0 5rem' }}>
            <form onSubmit={submit} style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.1rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '2.2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>{isRegister ? 'Create your account' : 'Sign in'}</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    {isRegister ? 'Save your details and track your orders.' : 'Sign in to place and track your orders.'}
                </p>
                {isRegister && (
                    <label style={label}>Full name
                        <input name="name" value={form.name} onChange={change} required maxLength={80} autoComplete="name" style={field} />
                    </label>
                )}
                <label style={label}>Email
                    <input name="email" type="email" value={form.email} onChange={change} required autoComplete="email" style={field} />
                </label>
                {isRegister && (
                    <label style={label}>Phone (optional)
                        <input name="phone" type="tel" value={form.phone} onChange={change} maxLength={20} autoComplete="tel" style={field} />
                    </label>
                )}
                <label style={label}>Password
                    <PasswordInput name="password" value={form.password} onChange={change} required minLength={isRegister ? 8 : undefined}
                        autoComplete={isRegister ? 'new-password' : 'current-password'} style={field} />
                    {isRegister && <span style={{ fontSize: '0.8rem' }}>At least 8 characters</span>}
                </label>
                {error && <p role="alert" style={{ color: '#e07a7a', fontSize: '0.9rem' }}>{error}</p>}
                <button className="btn-primary" disabled={busy} style={{ width: '100%', padding: '1rem' }}>
                    {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {isRegister ? 'Already have an account?' : 'New to ZamCloth?'}{' '}
                    <Link to={other} style={{ color: 'var(--color-accent)' }}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
                </p>
            </form>
        </main>
    );
}
