import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroSlider from './HeroSlider';

export default function Hero() {
    return (
        <section className="home-hero" style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Background photos (managed in Admin > Hero banner) */}
            <HeroSlider />

            {/* Content */}
            <div className="container home-hero-content">
                <motion.div
                    className="home-hero-copy"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="home-hero-title">
                        Style for Every <br className="home-hero-break" /> Generation.
                    </h1>
                    <p className="home-hero-description">
                        Discover everyday fashion for men, women and kids.
                    </p>
                    <p className="home-hero-tagline">
                        Affordable Fashion. Premium Feel.
                    </p>
                    <motion.div
                        className="home-hero-action"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link to="/shop" className="btn-primary home-hero-button">
                            Explore Collections <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="home-hero-scroll"
            >
                Scroll
            </motion.div>
        </section>
    );
}
