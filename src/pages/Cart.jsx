import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import Img from "../components/Img.jsx";
import { EmptyState, Skeleton } from "../components/States.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { calcShipping, mainImage } from "../utils/format.js";

export function Totals({ subtotal }) {
  const { settings, money } = useSettings();
  const ship = calcShipping(subtotal, settings);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{ship === 0 ? "Free" : money(ship)}</dd></div>
      <div className="flex justify-between border-t border-ivory/10 pt-3 text-lg"><dt>Total</dt><dd>{money(subtotal + ship)}</dd></div>
    </dl>
  );
}

export default function Cart() {
  const { items, lines, loading, subtotal, setQty, remove } = useCart();
  const { money } = useSettings();
  if (!items.length) return <div className="wrap py-16"><h1 className="mb-8 text-4xl sm:text-6xl">Your cart</h1><EmptyState title="Your cart is empty" text="Find a piece you love and add it here." to="/shop" cta="Continue shopping" /></div>;
  if (loading && !lines.length) return <div className="wrap space-y-4 py-16"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  const blocked = lines.some((l) => l.soldOut);
  return (
    <div className="wrap py-10 sm:py-14">
      <h1 className="mb-8 text-4xl sm:text-6xl">Your cart</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
          {lines.map(({ product: p, qty, cap, soldOut, unit }) => (
            <li key={p.id} className="flex gap-4 py-5">
              <Link to={`/product/${p.slug}`} className="h-24 w-24 shrink-0 overflow-hidden bg-card sm:h-32 sm:w-32"><Img src={mainImage(p)} alt={p.name} className="h-full w-full object-cover" /></Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0"><Link to={`/product/${p.slug}`} className="block truncate font-display text-xl sm:text-2xl">{p.name}</Link><p className="text-sm text-muted">{money(unit)} each</p>{soldOut && <p className="text-sm text-red-400">Sold out. Remove it to continue.</p>}</div>
                  <p className="shrink-0">{money(unit * qty)}</p>
                </div>
                <div className="flex items-center justify-between">
                  {!soldOut ? (
                    <div className="flex items-center border border-ivory/20">
                      <button onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 1} aria-label={`Decrease quantity of ${p.name}`} className="flex h-10 w-10 items-center justify-center disabled:opacity-40"><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} disabled={qty >= cap} aria-label={`Increase quantity of ${p.name}`} className="flex h-10 w-10 items-center justify-center disabled:opacity-40"><Plus size={14} /></button>
                    </div>
                  ) : <span />}
                  <button onClick={() => remove(p.id)} className="flex h-10 items-center gap-1 text-sm text-muted hover:text-bronze"><Trash2 size={15} /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit border border-ivory/10 bg-card p-6">
          <h2 className="mb-4 text-2xl">Order summary</h2>
          <Totals subtotal={subtotal} />
          {blocked ? <p className="mt-5 text-sm text-red-400">Remove sold-out items to check out.</p> : <Link to="/checkout" className="btn-primary mt-5 w-full">Proceed to checkout</Link>}
          <Link to="/shop" className="btn-ghost mt-3 w-full">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
