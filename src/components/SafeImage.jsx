import React, { useState } from 'react';

// Renders the image, or a quiet monogram tile when the source fails to load.
export default function SafeImage({ src, alt, style, ...rest }) {
    const [failed, setFailed] = useState(false);

    if (failed || !src) {
        return (
            <div
                role="img"
                aria-label={alt}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #1d1b16 0%, #0f0f0f 100%)',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '3rem',
                    opacity: 1,
                    transform: 'none',
                    filter: 'none'
                }}
            >
                {(alt || '?').trim().charAt(0).toUpperCase()}
            </div>
        );
    }

    return <img src={src} alt={alt} style={style} onError={() => setFailed(true)} {...rest} />;
}
