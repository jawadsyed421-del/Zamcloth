import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <section style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Background Image */}
            <div
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.5) contrast(1.1)',
                    zIndex: 0
                }}
            />

            {/* Content */}
            <div className="container" style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '120px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ maxWidth: '800px' }}
                >
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            color: 'var(--color-accent)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3em',
                            marginBottom: '1.5rem',
                            fontWeight: 500
                        }}
                    >
                        Spring / Summer 2026
                    </motion.p>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        lineHeight: 1.1,
                        marginBottom: '2rem',
                        color: '#ffffff',
                        textShadow: '0 4px 24px rgba(0,0,0,0.6)'
                    }}>
                        Redefining <br /> Digital Luxury.
                    </h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
                            Shop Collection <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase'
                }}
            >
                Scroll
            </motion.div>
        </section>
    );
}
