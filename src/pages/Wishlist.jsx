import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Img from "../components/Img.jsx";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/States.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getProductsByIds } from "../services/store.js";
import { effPrice, mainImage } from "../utils/format.js";

export default function Wishlist() {
  const { ids, toggle } = useWishlist();
  const { add } = useCart();
  const { money } = useSettings();
  const toast = useToast();
  const [state, setState] = useState({ status: "loading", products: [] });
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) { setState({ status: "ready", products: [] }); return; }
    getProductsByIds(ids).then((products) => setState({ status: "ready", products })).catch((e) => setState({ status: "error", products: [], error: e.message }));
  }, [key]); // eslint-disable-line
  const shown = state.products.filter((p) => ids.includes(p.id));
  return (
    <div className="wrap py-10 sm:py-14">
      <h1 className="mb-8 text-4xl sm:text-6xl">Wishlist</h1>
      {state.status === "loading" && <ProductGridSkeleton n={4} />}
      {state.status === "error" && <ErrorState message={state.error} />}
      {state.status === "ready" && !shown.length && <EmptyState title="Your wishlist is empty" text="Tap the heart on any product to save it here." to="/shop" cta="Browse furniture" />}
      {shown.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {shown.map((p) => (
            <div key={p.id}>
              <Link to={`/product/${p.slug}`}><div className="aspect-[4/5] overflow-hidden bg-card"><Img src={mainImage(p)} alt={p.name} className="h-full w-full object-cover" /></div>
                <h3 className="mt-3 text-lg leading-tight sm:text-xl">{p.name}</h3></Link>
              <p className="text-sm">{money(effPrice(p))}</p>
              <div className="mt-3 flex flex-col gap-2">
                <button disabled={p.stock <= 0} onClick={() => { const r = add(p, 1); toast(r.msg); if (r.ok) toggle(p.id); }} className="btn-primary !min-h-[42px]">{p.stock <= 0 ? "Sold out" : "Move to cart"}</button>
                <button onClick={() => toggle(p.id)} className="text-sm text-muted hover:text-bronze">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
