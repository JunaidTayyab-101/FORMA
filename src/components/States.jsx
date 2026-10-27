import { Link } from "react-router-dom";

export const Skeleton = ({ className = "" }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export const ProductGridSkeleton = ({ n = 8 }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i}><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>
    ))}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="border border-ivory/10 bg-card p-8 text-center">
    <p className="font-display text-2xl">We could not load this.</p>
    <p className="mt-2 text-sm text-muted">{message || "Check your connection and Supabase setup, then try again."}</p>
    {onRetry && <button onClick={onRetry} className="btn-primary mt-5">Try again</button>}
  </div>
);

export const EmptyState = ({ title, text, to, cta }) => (
  <div className="border border-ivory/10 bg-card p-10 text-center">
    <p className="font-display text-2xl sm:text-3xl">{title}</p>
    {text && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>}
    {to && <Link to={to} className="btn-primary mt-6">{cta}</Link>}
  </div>
);
