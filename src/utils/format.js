export const effPrice = (p) => (p.sale_price != null && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price) : Number(p.price));
export const onSale = (p) => p.sale_price != null && Number(p.sale_price) < Number(p.price);
export const sortImages = (imgs) => [...(imgs || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
export const mainImage = (p) => sortImages(p.product_images)[0]?.url || null;
// Must match the shipping rule inside the place_order SQL function.
export const calcShipping = (subtotal, s) => {
  if (!subtotal) return 0;
  const t = Number(s.free_shipping_threshold || 0);
  return t > 0 && subtotal >= t ? 0 : Number(s.shipping_flat || 0);
};
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));
