import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password box with an eye button so people can check what they typed
export default function PasswordInput({ style, ...props }) {
    const [visible, setVisible] = useState(false);
    return (
        <span style={{ position: 'relative', display: 'block', width: '100%' }}>
            <input {...props} type={visible ? 'text' : 'password'} style={{ ...style, width: '100%', paddingRight: '3rem' }} />
            <button
                type="button"
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                title={visible ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.4rem', color: 'var(--color-text-muted)', display: 'flex' }}
            >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </span>
    );
}
