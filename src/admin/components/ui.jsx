import { useEffect } from "react";
import { X } from "lucide-react";

export const PageHeader = ({ title, sub, children }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div><h1 className="text-3xl sm:text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const COLORS = { pending: "bg-amber-500/15 text-amber-300", confirmed: "bg-sky-500/15 text-sky-300", processing: "bg-indigo-500/15 text-indigo-300", shipped: "bg-violet-500/15 text-violet-300", delivered: "bg-emerald-500/15 text-emerald-300", cancelled: "bg-red-500/15 text-red-300", live: "bg-emerald-500/15 text-emerald-300", hidden: "bg-ivory/10 text-muted" };
export const Badge = ({ value, label }) => <span className={`inline-block px-2 py-0.5 text-xs capitalize ${COLORS[value] || "bg-ivory/10"}`}>{label || value}</span>;

export const Loading = () => <div className="py-16 text-center text-sm text-muted" role="status">Loading…</div>;
export const ErrorBox = ({ message, onRetry }) => (
  <div role="alert" className="border border-red-400/30 bg-red-500/5 p-5 text-sm"><p className="text-red-300">{message}</p>
    {onRetry && <button onClick={onRetry} className="btn-ghost mt-3 !min-h-[38px]">Try again</button>}</div>
);
export const Empty = ({ children }) => <div className="border border-dashed border-ivory/15 p-10 text-center text-sm text-muted">{children}</div>;
export const Card = ({ className = "", children }) => <div className={`border border-ivory/10 bg-card p-5 ${className}`}>{children}</div>;

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative max-h-[92vh] w-full overflow-y-auto border border-ivory/10 bg-surface p-5 sm:p-6 ${wide ? "sm:max-w-3xl" : "sm:max-w-md"}`}>
        <div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-2xl">{title}</h2>
          <button onClick={onClose} autoFocus aria-label="Close" className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center hover:text-bronze"><X size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Confirm = ({ open, title, text, label = "Confirm", busy, onConfirm, onCancel }) => (
  <Modal open={open} title={title} onClose={onCancel}>
    <p className="text-sm text-muted">{text}</p>
    <div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="btn-ghost">Keep it</button>
      <button onClick={onConfirm} disabled={busy} className="btn bg-red-500 text-white hover:bg-red-400">{busy ? "Working…" : label}</button></div>
  </Modal>
);

export const Field = ({ label, error, hint, children, className = "" }) => (
  <label className={`block ${className}`}><span className="mb-1 block text-sm">{label}</span>{children}
    {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}{error && <span role="alert" className="mt-1 block text-sm text-red-400">{error}</span>}</label>
);

export const Pager = ({ page, total, size = 15, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return <div className="mt-5 flex items-center justify-center gap-3 text-sm"><button className="btn-ghost !min-h-[40px]" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
    <span className="text-muted">Page {page} of {pages}</span><button className="btn-ghost !min-h-[40px]" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div>;
};

export const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const fmtDate = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
