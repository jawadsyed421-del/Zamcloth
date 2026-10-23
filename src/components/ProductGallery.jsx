import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';

// Swipeable photo gallery: slide left/right on touch, arrows and thumbnails on desktop
export default function ProductGallery({ images, name }) {
    const track = useRef(null);
    const [index, setIndex] = useState(0);
    const count = images.length;

    const goTo = (i) => {
        const el = track.current;
        if (!el) return;
        const next = Math.max(0, Math.min(count - 1, i));
        el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
        setIndex(next);
    };

    const onScroll = () => {
        const el = track.current;
        if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };

    const arrow = (side) => ({
        position: 'absolute', top: '50%', [side]: '0.75rem', transform: 'translateY(-50%)', zIndex: 2,
        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(10,10,10,0.7)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

    return (
        <div>
            <div style={{ position: 'relative', backgroundColor: 'var(--color-bg-secondary)' }}>
                <div
                    ref={track}
                    onScroll={onScroll}
                    style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', height: 'min(600px, 120vw)' }}
                >
                    {images.map((src, i) => (
                        <div key={src + i} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', height: '100%' }}>
                            <SafeImage src={src} alt={`${name} – photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
                {count > 1 && (
                    <>
                        {index > 0 && <button type="button" aria-label="Previous photo" onClick={() => goTo(index - 1)} style={arrow('left')}><ChevronLeft size={22} /></button>}
                        {index < count - 1 && <button type="button" aria-label="Next photo" onClick={() => goTo(index + 1)} style={arrow('right')}><ChevronRight size={22} /></button>}
                        <div style={{ position: 'absolute', bottom: '0.75rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                            {images.map((_, i) => (
                                <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === index ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)' }} />
                            ))}
                        </div>
                    </>
                )}
            </div>
            {count > 1 && (
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', overflowX: 'auto' }}>
                    {images.map((src, i) => (
                        <button
                            key={src + i}
                            type="button"
                            aria-label={`Show photo ${i + 1}`}
                            onClick={() => goTo(i)}
                            style={{ flex: '0 0 64px', height: '80px', padding: 0, border: i === index ? '2px solid var(--color-accent)' : '2px solid transparent', opacity: i === index ? 1 : 0.65 }}
                        >
                            <SafeImage src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
