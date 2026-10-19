import React from 'react';

export default function SizeGuide() {
    return (
        <div className="container section" style={{ marginTop: '13rem' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Size Guide</h1>

            {/* Kids Size Chart */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Kids Wear</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                <th style={thStyle}>Age Group</th>
                                <th style={thStyle}>Height (cm)</th>
                                <th style={thStyle}>Chest (in)</th>
                                <th style={thStyle}>Waist (in)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={tdStyle}>2-3 Years</td><td style={tdStyle}>92-98</td><td style={tdStyle}>21-22</td><td style={tdStyle}>20-21</td></tr>
                            <tr><td style={tdStyle}>4-5 Years</td><td style={tdStyle}>104-110</td><td style={tdStyle}>23-24</td><td style={tdStyle}>22</td></tr>
                            <tr><td style={tdStyle}>6-7 Years</td><td style={tdStyle}>116-122</td><td style={tdStyle}>25-26</td><td style={tdStyle}>23</td></tr>
                            <tr><td style={tdStyle}>8-9 Years</td><td style={tdStyle}>128-134</td><td style={tdStyle}>27-28</td><td style={tdStyle}>24</td></tr>
                            <tr><td style={tdStyle}>10-11 Years</td><td style={tdStyle}>140-146</td><td style={tdStyle}>29-30</td><td style={tdStyle}>25-26</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Women Size Chart */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Women Wear</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                <th style={thStyle}>Size</th>
                                <th style={thStyle}>Bust (in)</th>
                                <th style={thStyle}>Waist (in)</th>
                                <th style={thStyle}>Hips (in)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={tdStyle}>XS</td><td style={tdStyle}>32</td><td style={tdStyle}>26</td><td style={tdStyle}>35</td></tr>
                            <tr><td style={tdStyle}>S</td><td style={tdStyle}>34</td><td style={tdStyle}>28</td><td style={tdStyle}>37</td></tr>
                            <tr><td style={tdStyle}>M</td><td style={tdStyle}>36</td><td style={tdStyle}>30</td><td style={tdStyle}>39</td></tr>
                            <tr><td style={tdStyle}>L</td><td style={tdStyle}>38</td><td style={tdStyle}>32</td><td style={tdStyle}>41</td></tr>
                            <tr><td style={tdStyle}>XL</td><td style={tdStyle}>40</td><td style={tdStyle}>34</td><td style={tdStyle}>43</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Men Size Chart */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Men Wear</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                <th style={thStyle}>Size</th>
                                <th style={thStyle}>Chest (in)</th>
                                <th style={thStyle}>Waist (in)</th>
                                <th style={thStyle}>Neck (in)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style={tdStyle}>S</td><td style={tdStyle}>36-38</td><td style={tdStyle}>30-32</td><td style={tdStyle}>14.5</td></tr>
                            <tr><td style={tdStyle}>M</td><td style={tdStyle}>38-40</td><td style={tdStyle}>32-34</td><td style={tdStyle}>15.5</td></tr>
                            <tr><td style={tdStyle}>L</td><td style={tdStyle}>40-42</td><td style={tdStyle}>34-36</td><td style={tdStyle}>16.5</td></tr>
                            <tr><td style={tdStyle}>XL</td><td style={tdStyle}>42-44</td><td style={tdStyle}>36-38</td><td style={tdStyle}>17.5</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

const thStyle = {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-accent)',
    fontWeight: '600'
};

const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)'
};
