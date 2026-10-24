import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop';
const INTERVAL = 5000;

// Banner background. One photo stays still. Two or more slide automatically from right to left
// (and can be swiped), looping forever.
export default function HeroSlider() {
    const [images, setImages] = useState(null);
    const [index, setIndex] = useState(0);
    const [animate, setAnimate] = useState(true);
    const paused = useRef(false);
    const touchX = useRef(null);

    useEffect(() => {
        fetch('/api/hero')
            .then(r => r.json())
            .then(d => setImages(Array.isArray(d.images) && d.images.length ? d.images : [DEFAULT_IMAGE]))
            .catch(() => setImages([DEFAULT_IMAGE]));
    }, []);

    const slides = images || [];
    const n = slides.length;
    const multi = n > 1;
    // A copy of the first photo sits at the end so the last slide moves on to the first in the same direction
    const track = multi ? [...slides, slides[0]] : slides;

    const next = useCallback(() => { setAnimate(true); setIndex(i => (i >= n ? 1 : i + 1)); }, [n]);
    const prev = useCallback(() => { setAnimate(true); setIndex(i => (i <= 0 ? n - 1 : i - 1)); }, [n]);

    useEffect(() => {
        if (!multi || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const timer = setInterval(() => { if (!paused.current && !document.hidden) next(); }, INTERVAL);
        return () => clearInterval(timer);
    }, [multi, next]);

    // After sliding onto the copy of the first photo, jump back to the real first photo without animation
    const onTransitionEnd = () => {
        if (multi && index === n) {
            setAnimate(false);
            setIndex(0);
            requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
        }
    };

    const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; paused.current = true; };
    const onTouchEnd = (e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        touchX.current = null;
        paused.current = false;
        if (multi && Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    };

    if (!images) return <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 0 }} />;

    const shown = multi ? index % n : 0;

    return (
        <div
            style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}
            onMouseEnter={() => { paused.current = true; }}
            onMouseLeave={() => { paused.current = false; }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div
                onTransitionEnd={onTransitionEnd}
                style={{
                    display: 'flex', height: '100%', width: `${track.length * 100}%`,
                    transform: `translateX(-${(index * 100) / track.length}%)`,
                    transition: animate ? 'transform 0.9s ease-in-out' : 'none',
                }}
            >
                {track.map((src, i) => (
                    <div
                        key={i}
                        aria-hidden={i !== shown}
                        style={{
                            flex: `0 0 ${100 / track.length}%`, height: '100%',
                            backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: 'center',
                            filter: 'brightness(0.5) contrast(1.1)',
                        }}
                    />
                ))}
            </div>

            {multi && (
                <div style={{ position: 'absolute', bottom: '4.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem', zIndex: 2 }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Show banner ${i + 1}`}
                            onClick={() => { setAnimate(true); setIndex(i); }}
                            style={{ width: 10, height: 10, borderRadius: '50%', padding: 0, background: i === shown ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)' }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
