import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Minus, Plus, Truck } from "lucide-react";
import Img from "../components/Img.jsx";
import ProductRow from "../components/ProductRow.jsx";
import { ErrorState, Skeleton } from "../components/States.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getProductBySlug } from "../services/store.js";
import { effPrice, onSale, sortImages } from "../utils/format.js";

export default function ProductDetails() {
  const { slug } = useParams();
  const { money, settings } = useSettings();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const nav = useNavigate();
  const [state, setState] = useState({ status: "loading", p: null });
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);

  const load = useCallback(() => {
    setState({ status: "loading", p: null }); setImg(0); setQty(1);
    getProductBySlug(slug).then((p) => setState({ status: p ? "ready" : "missing", p })).catch((e) => setState({ status: "error", p: null, error: e.message }));
  }, [slug]);
  useEffect(load, [load]);

  if (state.status === "loading") return <div className="wrap grid gap-8 py-10 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32" /></div></div>;
  if (state.status === "error") return <div className="wrap py-16"><ErrorState message={state.error} onRetry={load} /></div>;
  if (state.status === "missing") return <div className="wrap py-24 text-center"><h1 className="text-4xl">Product not found</h1><p className="mt-2 text-muted">It may have been removed or unpublished.</p><Link to="/shop" className="btn-primary mt-6">Back to shop</Link></div>;

  const p = state.p;
  const images = sortImages(p.product_images);
  const max = Math.min(p.stock, 20);
  const soldOut = p.stock <= 0;
  const dims = [p.width_cm && `W ${p.width_cm}`, p.depth_cm && `D ${p.depth_cm}`, p.height_cm && `H ${p.height_cm}`].filter(Boolean).join("  ×  ");
  const specs = [["SKU", p.sku], ["Category", p.category?.name], ["Dimensions", dims && `${dims} cm`], ["Material", p.material], ["Finish", p.finish]].filter(([, v]) => v);

  const addToCart = () => { const r = add(p, qty); toast(r.msg); return r; };

  return (
    <>
      <div className="wrap py-8 sm:py-12">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb"><Link to="/shop" className="hover:text-bronze">Shop</Link>{p.category && <> / <Link to={`/shop?category=${p.category.slug}`} className="hover:text-bronze">{p.category.name}</Link></>}</nav>
        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          <div>
            <div className="aspect-square overflow-hidden bg-card sm:aspect-[4/5]"><Img src={images[img]?.url} alt={p.name} className="h-full w-full object-cover" loading="eager" /></div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((im, i) => <button key={i} onClick={() => setImg(i)} aria-label={`Show image ${i + 1}`} aria-current={i === img} className={`aspect-square overflow-hidden border ${i === img ? "border-bronze" : "border-transparent"}`}><Img src={im.url} alt="" className="h-full w-full object-cover" /></button>)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-4xl leading-tight sm:text-5xl">{p.name}</h1>
            <p className="mt-4 text-2xl">{money(effPrice(p))}{onSale(p) && <span className="ml-3 text-lg text-muted line-through">{money(p.price)}</span>}</p>
            <p className={`mt-2 text-sm ${soldOut ? "text-red-400" : p.stock <= 5 ? "text-bronze" : "text-muted"}`}>{soldOut ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : `In stock (${p.stock} available)`}</p>
            <p className="mt-6 max-w-prose leading-relaxed text-muted">{p.description}</p>
            {!soldOut && (
              <div className="mt-8 flex items-center gap-3">
                <span className="text-sm text-muted">Quantity</span>
                <div className="flex items-center border border-ivory/20">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center hover:text-bronze"><Minus size={16} /></button>
                  <span className="w-10 text-center" aria-live="polite">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center hover:text-bronze disabled:opacity-40"><Plus size={16} /></button>
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button onClick={addToCart} disabled={soldOut} className="btn-primary">Add to cart</button>
              <button onClick={() => { addToCart(); nav("/checkout"); }} disabled={soldOut} className="btn-ghost">Buy now</button>
              <button onClick={() => toggle(p.id)} aria-pressed={has(p.id)} aria-label="Toggle wishlist" className="btn-ghost sm:w-12 sm:px-0"><Heart size={18} className={has(p.id) ? "fill-bronze text-bronze" : ""} /><span className="sm:hidden">Wishlist</span></button>
            </div>
            <div className="mt-8 flex gap-3 border border-ivory/10 p-4 text-sm text-muted"><Truck size={20} className="mt-0.5 shrink-0 text-bronze" />
              <p>Cash on delivery. {settings.free_shipping_threshold > 0 ? `Free delivery over ${money(settings.free_shipping_threshold)}.` : "Delivery charges are shown at checkout."} <Link to="/shipping-policy" className="text-bronze underline">Shipping details</Link></p></div>
            {specs.length > 0 && <dl className="mt-8 divide-y divide-ivory/10 border-y border-ivory/10 text-sm">{specs.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl>}
          </div>
        </div>
      </div>
      <ProductRow title="You may also like" params={{ category: p.category?.slug, excludeId: p.id }} />
    </>
  );
}
