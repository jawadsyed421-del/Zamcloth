// Photos to show for a product in a given colour: that colour's photos plus any shared (untagged) ones.
// Falls back to every photo when the colour has none of its own.
export function photosFor(product, color) {
    const all = product.images?.length ? product.images : [product.image];
    const tags = product.imageColors || [];
    if (!color || !(product.colorOptions || []).length || !tags.some(Boolean)) return all;
    const own = all.filter((_, i) => tags[i] === color);
    if (own.length === 0) return all;
    return [...own, ...all.filter((_, i) => !tags[i])];
}

// The main photo for a colour (used for the cart and order lines)
export const imageFor = (product, color) => photosFor(product, color)[0] || product.image;
