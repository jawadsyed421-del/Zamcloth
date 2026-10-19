import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const KEY = 'zamcloth_user_token';
const read = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
const write = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(read());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!read());

    const logout = useCallback(() => { write(''); setToken(''); setUser(null); }, []);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
            .then(d => { if (!cancelled) setUser(d.user); })
            .catch(status => { if (status === 401 && !cancelled) logout(); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, logout]);

    // mode is 'login' or 'register'
    const authenticate = async (mode, payload) => {
        const res = await fetch(`/api/auth/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Something went wrong');
        write(data.token);
        setLoading(false);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    // fetch wrapper that sends the token and signs the customer out if it has expired
    const authFetch = useCallback(async (url, options = {}) => {
        const res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
        if (res.status === 401) logout();
        return res;
    }, [token, logout]);

    return (
        <AuthContext.Provider value={{ user, token, loading, authenticate, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
};
