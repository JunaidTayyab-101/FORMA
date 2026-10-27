import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="wrap py-28 text-center">
      <p className="font-display text-7xl text-bronze">404</p>
      <h1 className="mt-4 text-4xl">This page does not exist</h1>
      <p className="mt-2 text-muted">The link may be broken or the page may have moved.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/" className="btn-primary">Go home</Link><Link to="/shop" className="btn-ghost">Browse shop</Link></div>
    </div>
  );
}
