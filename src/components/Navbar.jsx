import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const linkCls = ({ isActive }) => `py-2 text-sm transition-colors hover:text-bronze ${isActive ? "text-bronze" : "text-ivory"}`;

export function Brand({ className = "" }) {
  const { settings } = useSettings();
  return (
    <Link to="/" className={`flex items-center ${className}`} aria-label={`${settings.brand_name} home`}>
      {settings.logo_url
        ? <img src={settings.logo_url} alt={settings.brand_name} className="h-8 w-auto max-w-[180px] object-contain" />
        : <span className="font-display text-2xl tracking-[0.18em] sm:text-3xl">{(settings.brand_name || "FORMA").split(" ")[0].toUpperCase()}</span>}
    </Link>
  );
}

export default function Navbar() {
  const { settings, categories } = useSettings();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); setSearching(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const submit = (e) => { e.preventDefault(); nav(`/shop?q=${encodeURIComponent(q.trim())}`); setQ(""); };
  const links = [
    { to: "/", label: "Home", end: true }, { to: "/shop", label: "Shop", end: true },
    ...categories.map((c) => ({ to: `/shop?category=${c.slug}`, label: c.name, cat: true })),
    { to: "/interior-design", label: "Interior Design" }, { to: "/about", label: "About" }, { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ivory/10 bg-ink/95 backdrop-blur">
      {settings.announcement && <p className="bg-walnut px-4 py-2 text-center text-xs text-ivory">{settings.announcement}</p>}
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <button className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        <Brand />
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Main">
          {links.map((l) => l.cat
            ? <Link key={l.to} to={l.to} className="py-2 text-sm hover:text-bronze">{l.label}</Link>
            : <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="flex items-center">
          <button className="flex h-11 w-11 items-center justify-center hover:text-bronze" onClick={() => setSearching((s) => !s)} aria-label="Search products" aria-expanded={searching}><Search size={20} /></button>
          <Link to="/wishlist" className="relative flex h-11 w-11 items-center justify-center hover:text-bronze" aria-label={`Wishlist, ${ids.length} items`}>
            <Heart size={20} />{ids.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-bronze px-1 text-[10px] font-semibold text-ink">{ids.length}</span>}
          </Link>
          <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center hover:text-bronze" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={20} />{count > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-bronze px-1 text-[10px] font-semibold text-ink">{count}</span>}
          </Link>
        </div>
      </div>
      {searching && (
        <form onSubmit={submit} className="wrap pb-4" role="search">
          <label htmlFor="nav-search" className="sr-only">Search products</label>
          <div className="flex gap-2">
            <input id="nav-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sofas, beds, tables" className="field" />
            <button className="btn-primary">Search</button>
          </div>
        </form>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-surface p-6">
            <div className="mb-6 flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center" aria-label="Close menu"><X size={22} /></button></div>
            <nav className="flex flex-col overflow-y-auto" aria-label="Mobile">
              {links.map((l) => <Link key={l.to} to={l.to} className="border-b border-ivory/10 py-4 font-display text-2xl">{l.label}</Link>)}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
