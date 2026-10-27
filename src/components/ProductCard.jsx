import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Img from "./Img.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { effPrice, onSale, mainImage } from "../utils/format.js";

export default function ProductCard({ product: p }) {
  const { money } = useSettings();
  const { has, toggle } = useWishlist();
  const liked = has(p.id);
  const badge = p.stock <= 0 ? "Sold out" : onSale(p) ? "Sale" : p.is_new ? "New" : p.is_best_seller ? "Best seller" : null;
  return (
    <article className="group relative">
      <Link to={`/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-card">
          <Img src={mainImage(p)} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {badge && <span className="absolute left-0 top-3 bg-ink/90 px-3 py-1 text-xs text-bronze">{badge}</span>}
        </div>
        <h3 className="mt-3 text-lg leading-tight sm:text-xl">{p.name}</h3>
        <p className="mt-1 text-sm">
          <span>{money(effPrice(p))}</span>
          {onSale(p) && <span className="ml-2 text-muted line-through">{money(p.price)}</span>}
        </p>
      </Link>
      <button onClick={() => toggle(p.id)} aria-pressed={liked} aria-label={liked ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center bg-ink/70 hover:bg-ink">
        <Heart size={18} className={liked ? "fill-bronze text-bronze" : "text-ivory"} />
      </button>
    </article>
  );
}
