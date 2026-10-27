import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Store, Tags, Users, X } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { Loading } from "./ui.jsx";

const NAV = [
  ["/admin", "Dashboard", LayoutDashboard, true], ["/admin/products", "Products", Package], ["/admin/categories", "Categories", Tags],
  ["/admin/orders", "Orders", ShoppingCart], ["/admin/customers", "Customers", Users], ["/admin/settings", "Settings", Settings],
];

export function AdminGuard() {
  const { status, signOut, session } = useAdminAuth();
  if (status === "loading") return <div className="min-h-screen bg-ink"><Loading /></div>;
  if (status === "anon") return <Navigate to="/admin/login" replace />;
  if (status === "denied") return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6 text-center"><div className="max-w-sm">
      <h1 className="text-3xl">Access denied</h1>
      <p className="mt-2 text-sm text-muted">{session?.user?.email} is signed in but is not an administrator.</p>
      <div className="mt-6 flex justify-center gap-2"><button onClick={signOut} className="btn-primary">Sign out</button><Link to="/" className="btn-ghost">Back to store</Link></div></div></div>
  );
  return <AdminLayout />;
}

function AdminLayout() {
  const { signOut, session } = useAdminAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const link = ({ isActive }) => `flex min-h-[44px] items-center gap-3 px-4 text-sm transition-colors ${isActive ? "bg-bronze/15 text-bronze" : "text-muted hover:bg-ivory/5 hover:text-ivory"}`;
  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-ivory/10 px-4">
        <Link to="/admin" className="font-display text-2xl tracking-[0.15em]">{(settings.brand_name || "FORMA").split(" ")[0].toUpperCase()}<span className="ml-2 font-sans text-xs tracking-normal text-muted">Admin</span></Link>
        <button className="flex h-10 w-10 items-center justify-center lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Admin">{NAV.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={link}><Icon size={18} />{label}</NavLink>)}</nav>
      <div className="border-t border-ivory/10 p-3">
        <p className="truncate px-4 pb-2 text-xs text-muted">{session?.user?.email}</p>
        <Link to="/" target="_blank" className="flex min-h-[44px] items-center gap-3 px-4 text-sm text-muted hover:text-ivory"><Store size={18} />View store</Link>
        <button onClick={signOut} className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm text-muted hover:text-ivory"><LogOut size={18} />Sign out</button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-ivory/10 bg-surface lg:sticky lg:top-0 lg:block lg:h-screen">{sidebar}</aside>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-ivory/10 bg-surface px-3 lg:hidden">
        <button className="flex h-11 w-11 items-center justify-center" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button><span className="font-display text-xl">Admin</span></header>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} /><div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-surface">{sidebar}</div></div>}
      <main className="min-w-0 p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  );
}
