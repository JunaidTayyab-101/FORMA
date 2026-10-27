import { Link } from "react-router-dom";
import Img from "../components/Img.jsx";
import ProductRow from "../components/ProductRow.jsx";
import { useSettings } from "../context/SettingsContext.jsx";

const EDITORIAL = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80";
const STORY = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1400&q=80";

export default function Home() {
  const { settings: s, categories } = useSettings();
  return (
    <>
      <section className="relative flex min-h-[78vh] items-end overflow-hidden sm:min-h-[88vh]">
        <Img src={s.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20 sm:bg-gradient-to-r sm:from-ink sm:via-ink/60 sm:to-transparent" />
        <div className="wrap relative pb-14 pt-32 sm:pb-24">
          <h1 className="rise max-w-3xl text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">{s.hero_title}</h1>
          <p className="rise mt-5 max-w-md text-base text-ivory/85 sm:text-lg" style={{ animationDelay: ".15s" }}>{s.hero_text}</p>
          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: ".3s" }}>
            <Link to="/shop" className="btn-primary">Shop Collection</Link>
            <Link to="/interior-design" className="btn-ghost">Explore Interiors</Link>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="wrap py-14 sm:py-20">
          <h2 className="h-section mb-8">Shop by room</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-card">
                <Img src={c.image_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                <span className="absolute inset-x-4 bottom-4 font-display text-2xl sm:text-3xl">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRow title="Featured pieces" params={{ flag: "is_featured" }} link="/shop" />
      <ProductRow title="Best sellers" params={{ flag: "is_best_seller" }} link="/shop?sort=featured" />

      <section className="bg-walnut/30 py-14 sm:py-20">
        <div className="wrap flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div><h2 className="h-section max-w-xl">{s.promo_title || "Furniture made to be lived with."}</h2>
            <p className="mt-3 max-w-lg text-muted">{s.promo_text || "Browse the full collection and find the piece that anchors your room."}</p></div>
          <Link to="/shop" className="btn-primary shrink-0">Browse all furniture</Link>
        </div>
      </section>

      <ProductRow title="New arrivals" params={{ flag: "is_new", sort: "newest" }} link="/shop?sort=newest" />

      <section className="wrap grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <Img src={EDITORIAL} alt="A calm living room with layered neutral textures" className="aspect-[4/3] w-full object-cover" />
        <div>
          <h2 className="h-section">A room is composed, not filled.</h2>
          <p className="mt-5 max-w-lg text-muted">Start with one anchor piece, then let proportion, material and light do the rest. Our interior design service helps you plan the whole space around how you live.</p>
          <Link to="/interior-design" className="btn-ghost mt-7">Explore interiors</Link>
        </div>
      </section>

      <section className="bg-surface py-14 sm:py-20">
        <div className="wrap grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2"><Img src={STORY} alt="Warm timber furniture in a quiet interior" className="aspect-[4/3] w-full object-cover" /></div>
          <div>
            <h2 className="h-section">Our story</h2>
            <p className="mt-5 max-w-lg text-muted">{s.about_text || "Add your brand story from the admin panel. Tell customers who makes the furniture, what it is made from and why it lasts."}</p>
            <Link to="/about" className="btn-ghost mt-7">About us</Link>
          </div>
        </div>
      </section>

      <section className="wrap py-14 sm:py-20">
        <h2 className="h-section">What customers say</h2>
        <p className="mt-2 text-sm text-muted">Demo content. Replace with real customer reviews.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[["The sofa arrived well packed and looks better than the photos.", "Sample customer, Lahore"], ["Solid timber, clean finish. The dining table anchors our room.", "Sample customer, Karachi"], ["Helpful team and a smooth cash on delivery process.", "Sample customer, Islamabad"]].map(([t, n]) => (
            <figure key={n} className="border border-ivory/10 bg-card p-6"><blockquote className="font-display text-xl leading-snug">“{t}”</blockquote><figcaption className="mt-4 text-sm text-muted">{n}</figcaption></figure>
          ))}
        </div>
      </section>
    </>
  );
}
