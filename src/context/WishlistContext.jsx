import { createContext, useContext, useEffect, useState, useCallback } from "react";

const KEY = "forma_wishlist_v1";
const Ctx = createContext(null);
export const useWishlist = () => useContext(Ctx);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(ids)); }, [ids]);
  const toggle = useCallback((id) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), []);
  const has = useCallback((id) => ids.includes(id), [ids]);
  return <Ctx.Provider value={{ ids, toggle, has }}>{children}</Ctx.Provider>;
}
