import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
import { Brand } from "./Navbar.jsx";

export default function Footer() {
  const { settings: s, categories } = useSettings();
  const socials = [["Instagram", s.instagram_url], ["Facebook", s.facebook_url], ["Pinterest", s.pinterest_url]].filter(([, u]) => u);
  const col = "flex flex-col gap-2 text-sm text-muted [&_a:hover]:text-bronze";
  return (
    <footer className="mt-16 border-t border-ivory/10 bg-surface">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Brand />
          <p className="mt-4 max-w-xs text-sm text-muted">{s.hero_text}</p>
          {socials.length > 0 && <div className="mt-4 flex gap-4 text-sm">{socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className="text-bronze hover:underline">{n}</a>)}</div>}
        </div>
        <div><h4 className="mb-3 text-lg">Shop</h4><nav className={col}><Link to="/shop">All products</Link>{categories.map((c) => <Link key={c.id} to={`/shop?category=${c.slug}`}>{c.name}</Link>)}</nav></div>
        <div><h4 className="mb-3 text-lg">Help</h4><nav className={col}>
          <Link to="/faq">FAQ</Link><Link to="/shipping-policy">Shipping</Link><Link to="/returns-policy">Returns and refunds</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link></nav></div>
        <div><h4 className="mb-3 text-lg">Contact</h4><div className={col}>
          {s.contact_email ? <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : <span>Email to be added by the owner</span>}
          {s.contact_phone && <a href={`tel:${s.contact_phone}`}>{s.contact_phone}</a>}
          {s.address && <span>{s.address}</span>}
        </div></div>
      </div>
      <p className="border-t border-ivory/10 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} {s.footer_brand_name || s.brand_name}. All rights reserved.</p>
    </footer>
  );
}
