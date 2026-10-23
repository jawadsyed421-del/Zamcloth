import { chartsFor } from './sizeCharts';

// "4-5Y" and "4–5 years" mean the same kids size
export const normSize = (sz) => String(sz).trim().replace(/^(\d+)\s*[-–]\s*(\d+)\s*(?:y|yrs?|years?)$/i, '$1–$2 years');

const NAMES = {
    XS: 'Extra Small',
    S: 'Small',
    M: 'Medium',
    L: 'Large',
    XL: 'Extra Large',
    XXL: 'Double XL',
    '2XL': 'Double XL',
    '3XL': 'Triple XL',
    '4XL': '4 XL',
    '5XL': '5 XL',
};

// Display info for a size: a short code (M), its full name (Medium) and the size number from the chart (38)
export function sizeInfo(size, category, subcategory) {
    const raw = String(size).trim();
    const code = normSize(raw);
    const chart = chartsFor(category, subcategory)[0];
    const rows = chart?.rows || [];

    if (category === 'Kids') {
        const row = rows.find(r => r[1] === code);
        return { code, name: '', no: row ? row[0] : '' };
    }
    const upper = raw.toUpperCase();
    const row = rows.find(r => r[1] === upper);
    return { code: upper in NAMES ? upper : raw, name: NAMES[upper] || '', no: row ? row[0] : '' };
}

// Second line shown under the size code, e.g. "Medium · 38" or "Size 20"
export function sizeSubLabel({ name, no }) {
    if (name && no) return `${name} · ${no}`;
    if (name) return name;
    if (no) return `Size ${no}`;
    return '';
}
