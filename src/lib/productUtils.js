export function makeSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Local bundled images used when a Supabase product has no uploaded images yet. */
export function resolveProductCardImage(product, fallbackBySlug = {}) {
  if (!product) return null;
  if (product.heroImage) return product.heroImage;
  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) return product.imageUrls[0];
  if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    return typeof first === "string" ? first : first.public_url;
  }
  if (product.slug && fallbackBySlug[product.slug]) return fallbackBySlug[product.slug];
  return null;
}
