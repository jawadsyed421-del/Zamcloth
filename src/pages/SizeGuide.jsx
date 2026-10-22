import React from 'react';

const TABLES = [
    {
        title: 'Kids Size Chart (Boys & Girls)',
        note: 'Suitable for boys and girls aged 2–12 years. All measurements are in centimetres (cm).',
        head: ['Size No.', 'Age', 'Height', 'Chest', 'Waist'],
        rows: [
            ['20', '2–3 years', '92–98', '52–54', '50–52'],
            ['22', '3–4 years', '98–104', '54–56', '52–54'],
            ['24', '4–5 years', '104–110', '56–58', '54–56'],
            ['26', '5–6 years', '110–116', '58–60', '55–57'],
            ['28', '6–7 years', '116–122', '60–62', '56–58'],
            ['30', '7–8 years', '122–128', '62–66', '57–60'],
            ['32', '8–9 years', '128–134', '66–69', '59–62'],
            ['34', '9–10 years', '134–140', '69–72', '61–64'],
            ['36', '10–11 years', '140–146', '72–76', '63–66'],
            ['38', '11–12 years', '146–152', '76–80', '65–68'],
        ],
    },
    {
        title: 'Women Tops, Shirts & Kurtis',
        note: 'Body measurements in inches.',
        head: ['Size No.', 'Letter Size', 'Bust', 'Waist'],
        rows: [
            ['30', 'XS', '30', '24'], ['32', 'S', '32', '26'], ['34', 'M', '34', '28'],
            ['36', 'L', '36', '30'], ['38', 'XL', '38', '32'], ['40', 'XXL', '40', '34'],
            ['42', '3XL', '42', '36'], ['44', '4XL', '44', '38'], ['46', '5XL', '46', '40'],
        ],
    },
    {
        title: 'Women’s Trousers & Jeans',
        note: 'Waist sizes refer to inches. Inseam is the inside-leg length.',
        head: ['Size No.', 'Letter Size', 'Waist', 'Hip/Seat'],
        rows: [
            ['26', 'XS', '26', '35–36'], ['28', 'S', '28', '37–38'], ['30', 'M', '30', '39–40'],
            ['32', 'L', '32', '41–42'], ['34', 'XL', '34', '43–44'], ['36', 'XXL', '36', '45–46'],
            ['38', '3XL', '38', '47–48'], ['40', '4XL', '40', '49–50'], ['42', '5XL', '42', '51–52'],
        ],
    },
    {
        title: 'Men Shirts & T-shirts',
        note: 'Body measurements in inches.',
        head: ['Size No.', 'Letter Size', 'Chest', 'Waist'],
        rows: [
            ['36', 'S', '36', '30'], ['38', 'M', '38', '32'], ['40', 'L', '40', '34'],
            ['42', 'XL', '42', '36'], ['44', 'XXL', '44', '38'], ['46', '3XL', '46', '40'],
            ['48', '4XL', '48', '42'], ['50', '5XL', '50', '44'],
        ],
    },
    {
        title: 'Men’s Trousers & Jeans',
        note: 'Waist sizes refer to inches. Inseam is the inside-leg length.',
        head: ['Size No.', 'Letter Size', 'Waist', 'Hip/Seat'],
        rows: [
            ['28', 'XS', '28', '35–36'], ['30', 'S', '30', '37–38'], ['32', 'M', '32', '39–40'],
            ['34', 'L', '34', '41–42'], ['36', 'XL', '36', '43–44'], ['38', 'XXL', '38', '45–46'],
            ['40', '3XL', '40', '47–48'], ['42', '4XL', '42', '49–50'], ['44', '5XL', '44', '51–52'],
        ],
    },
];

export default function SizeGuide() {
    return (
        <div className="container section" style={{ marginTop: '9rem' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Size Guideline</h1>

            {TABLES.map(t => (
                <div key={t.title} style={{ marginBottom: '4rem' }}>
                    <h2 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>{t.title}</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t.note}</p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                    {t.head.map(h => <th key={h} style={thStyle}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {t.rows.map(r => (
                                    <tr key={r[0]}>{r.map((c, i) => <td key={i} style={tdStyle}>{c}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
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
