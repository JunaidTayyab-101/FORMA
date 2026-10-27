import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/States.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { getProducts } from "../services/store.js";

const PAGE_SIZE = 12;

export default function Shop() {
  const { categories } = useSettings();
  const [sp, setSp] = useSearchParams();
  const [state, setState] = useState({ status: "loading", products: [], total: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const f = { category: sp.get("category") || "", q: sp.get("q") || "", min: sp.get("min") || "", max: sp.get("max") || "", sort: sp.get("sort") || "featured", inStock: sp.get("stock") === "1", page: Number(sp.get("page")) || 1 };
  const [price, setPrice] = useState({ min: f.min, max: f.max });
  useEffect(() => setPrice({ min: f.min, max: f.max }), [f.min, f.max]);

  const update = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries({ page: "", ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSp(next);
  };

  const key = sp.toString();
  const load = useCallback(() => {
    setState((s) => ({ ...s, status: "loading" }));
    getProducts({ ...f, pageSize: PAGE_SIZE })
      .then(({ products, total }) => setState({ status: "ready", products, total }))
      .catch((e) => setState({ status: "error", products: [], total: 0, error: e.message }));
  }, [key]); // eslint-disable-line
  useEffect(load, [load]);

  const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  const active = f.category || f.q || f.min || f.max || f.inStock;
  const title = categories.find((c) => c.slug === f.category)?.name || "All furniture";

  const Filters = (
    <div className="space-y-7">
      <fieldset><legend className="mb-3 font-display text-xl">Category</legend>
        <div className="flex flex-col gap-1">
          {[{ slug: "", name: "All" }, ...categories].map((c) => (
            <button key={c.slug} onClick={() => update({ category: c.slug })} aria-pressed={f.category === c.slug}
              className={`min-h-[40px] text-left text-sm ${f.category === c.slug ? "text-bronze" : "text-muted hover:text-ivory"}`}>{c.name}</button>
          ))}
        </div>
      </fieldset>
      <fieldset><legend className="mb-3 font-display text-xl">Price</legend>
        <div className="flex gap-2">
          <input type="number" min="0" inputMode="numeric" aria-label="Minimum price" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} className="field" />
          <input type="number" min="0" inputMode="numeric" aria-label="Maximum price" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} className="field" />
        </div>
        <button onClick={() => update({ min: price.min, max: price.max })} className="btn-ghost mt-2 w-full">Apply price</button>
      </fieldset>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={f.inStock} onChange={(e) => update({ stock: e.target.checked ? "1" : "" })} className="h-4 w-4 accent-[#B08D57]" /> In stock only
      </label>
      {active && <button onClick={() => setSp(new URLSearchParams())} className="text-sm text-bronze underline underline-offset-4">Clear all filters</button>}
    </div>
  );

  return (
    <div className="wrap py-10 sm:py-14">
      <h1 className="text-4xl sm:text-6xl">{f.q ? `Results for “${f.q}”` : title}</h1>
      <div className="mt-6 flex items-center justify-between gap-3 border-y border-ivory/10 py-3">
        <button onClick={() => setShowFilters(true)} className="btn-ghost lg:hidden"><SlidersHorizontal size={16} /> Filters</button>
        <p className="hidden text-sm text-muted sm:block">{state.status === "ready" ? `${state.total} product${state.total === 1 ? "" : "s"}` : "Loading"}</p>
        <label className="flex items-center gap-2 text-sm"><span className="text-muted">Sort</span>
          <select value={f.sort} onChange={(e) => update({ sort: e.target.value === "featured" ? "" : e.target.value })} className="field !w-auto">
            <option value="featured">Featured</option><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select></label>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>
        <div>
          {state.status === "loading" && <ProductGridSkeleton n={6} />}
          {state.status === "error" && <ErrorState message={state.error} onRetry={load} />}
          {state.status === "ready" && state.products.length === 0 && (
            <div><EmptyState title="No products match" text="Try a different search or remove some filters." />{active && <button onClick={() => setSp(new URLSearchParams())} className="btn-primary mx-auto mt-5">Clear filters</button>}</div>
          )}
          {state.status === "ready" && state.products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 xl:grid-cols-3">{state.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              {pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
                  <button disabled={f.page <= 1} onClick={() => update({ page: String(f.page - 1) })} className="btn-ghost">Previous</button>
                  <span className="text-sm text-muted">Page {f.page} of {pages}</span>
                  <button disabled={f.page >= pages} onClick={() => update({ page: String(f.page + 1) })} className="btn-ghost">Next</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
      {showFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-surface p-6">
            <div className="mb-6 flex items-center justify-between"><h2 className="text-3xl">Filters</h2><button onClick={() => setShowFilters(false)} className="flex h-11 w-11 items-center justify-center" aria-label="Close filters"><X size={22} /></button></div>
            {Filters}
            <button onClick={() => setShowFilters(false)} className="btn-primary mt-8 w-full">Show {state.total} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
