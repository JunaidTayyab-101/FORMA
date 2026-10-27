import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProductsByIds } from "../services/store.js";
import { effPrice } from "../utils/format.js";

const KEY = "forma_cart_v1";
const MAX_QTY = 20;
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } });
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  // Re-fetch live prices and stock for everything in the cart.
  const idKey = items.map((i) => i.id).sort().join(",");
  useEffect(() => {
    if (!idKey) { setProducts({}); return; }
    let off = false;
    setLoading(true);
    getProductsByIds(idKey.split(","))
      .then((list) => {
        if (off) return;
        const map = Object.fromEntries(list.map((p) => [p.id, p]));
        setProducts(map);
        setItems((prev) => prev.filter((i) => map[i.id])); // drop unpublished/deleted products
      })
      .catch((e) => console.error(e))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [idKey]);

  const add = useCallback((product, qty = 1) => {
    if (product.stock <= 0) return { ok: false, msg: "This item is out of stock." };
    let result = { ok: true, msg: "Added to cart." };
    setProducts((p) => ({ ...p, [product.id]: product }));
    setItems((prev) => {
      const cur = prev.find((i) => i.id === product.id);
      const wanted = (cur?.qty || 0) + qty;
      const cap = Math.min(product.stock, MAX_QTY);
      const next = Math.min(wanted, cap);
      if (wanted > cap) result = { ok: false, msg: `Only ${cap} available. Cart updated to ${cap}.` };
      return cur ? prev.map((i) => (i.id === product.id ? { ...i, qty: next } : i)) : [...prev, { id: product.id, qty: next }];
    });
    return result;
  }, []);

  const setQty = useCallback((id, qty) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))), []);
  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo(() => items.filter((i) => products[i.id]).map((i) => {
    const p = products[i.id];
    const cap = Math.min(p.stock, MAX_QTY);
    return { product: p, qty: Math.min(i.qty, Math.max(cap, 1)), cap, soldOut: p.stock <= 0, unit: effPrice(p) };
  }), [items, products]);

  const subtotal = lines.reduce((s, l) => s + (l.soldOut ? 0 : l.unit * l.qty), 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ items, lines, loading, subtotal, count, add, setQty, remove, clear }}>{children}</Ctx.Provider>;
}
