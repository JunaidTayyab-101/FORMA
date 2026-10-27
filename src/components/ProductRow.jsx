import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard.jsx";
import { ErrorState, ProductGridSkeleton } from "./States.jsx";
import { getProducts } from "../services/store.js";

// A titled row of products loaded from Supabase (featured, best sellers, new arrivals, related).
export default function ProductRow({ title, params, link, hideIfEmpty = true, count = 4 }) {
  const [state, setState] = useState({ status: "loading", products: [] });
  const key = JSON.stringify(params);
  const load = useCallback(() => {
    setState((s) => ({ ...s, status: "loading" }));
    getProducts({ ...params, limit: count })
      .then(({ products }) => setState({ status: "ready", products }))
      .catch((e) => setState({ status: "error", products: [], error: e.message }));
  }, [key, count]); // eslint-disable-line
  useEffect(load, [load]);

  if (state.status === "ready" && !state.products.length && hideIfEmpty) return null;
  return (
    <section className="wrap py-14 sm:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="h-section">{title}</h2>
        {link && <Link to={link} className="shrink-0 text-sm text-bronze underline-offset-4 hover:underline">View all</Link>}
      </div>
      {state.status === "loading" && <ProductGridSkeleton n={count} />}
      {state.status === "error" && <ErrorState message={state.error} onRetry={load} />}
      {state.status === "ready" && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {state.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
