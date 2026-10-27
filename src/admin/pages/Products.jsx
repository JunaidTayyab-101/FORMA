import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Confirm, Empty, ErrorBox, Loading, PageHeader, Pager } from "../components/ui.jsx";
import Img from "../../components/Img.jsx";
import useLoad from "../hooks/useLoad.js";
import { deleteProduct, listCategories, listProducts, setPublished } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { mainImage } from "../../utils/format.js";

export default function Products() {
  const { money } = useSettings();
  const toast = useToast();
  const [f, setF] = useState({ q: "", category: "", stock: "", page: 1 });
  const [q, setQ] = useState("");
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const cats = useLoad(listCategories, []);
  const { data, loading, error, reload } = useLoad(() => listProducts(f), [f]);
  const set = (patch) => setF((p) => ({ ...p, page: 1, ...patch }));

  const toggle = async (p) => { try { await setPublished(p.id, !p.is_published); toast(p.is_published ? "Product hidden from the store." : "Product published."); reload(); } catch (e) { toast(e.message); } };
  const confirmDelete = async () => {
    setBusy(true);
    try { await deleteProduct(del.id); toast("Product deleted."); setDel(null); reload(); } catch (e) { toast(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Products" sub="Changes appear on the store as soon as they are saved."><Link to="/admin/products/new" className="btn-primary"><Plus size={16} />Add product</Link></PageHeader>
      <form onSubmit={(e) => { e.preventDefault(); set({ q }); }} className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU" className="field" />
        <select aria-label="Category" value={f.category} onChange={(e) => set({ category: e.target.value })} className="field"><option value="">All categories</option>{(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Stock" value={f.stock} onChange={(e) => set({ stock: e.target.value })} className="field"><option value="">Any stock</option><option value="in">In stock</option><option value="low">Low (1 to 5)</option><option value="out">Out of stock</option><option value="hidden">Hidden</option></select>
        <button className="btn-ghost">Search</button>
      </form>
      {loading && !data && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.products.length === 0 && <Empty>No products found. {!f.q && !f.category && !f.stock && <Link to="/admin/products/new" className="text-bronze underline">Add your first product</Link>}</Empty>}
      {data && data.products.length > 0 && (
        <div className="overflow-x-auto border border-ivory/10 bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ivory/10 text-muted"><tr><th className="p-3 font-normal">Product</th><th className="font-normal">Category</th><th className="font-normal">Price</th><th className="font-normal">Stock</th><th className="font-normal">Status</th><th className="p-3 text-right font-normal">Actions</th></tr></thead>
            <tbody className="divide-y divide-ivory/10">
              {data.products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden bg-surface"><Img src={mainImage(p)} alt="" className="h-full w-full object-cover" /></div>
                    <div className="min-w-0"><p className="truncate">{p.name}</p><p className="text-xs text-muted">{p.sku || "No SKU"}</p></div></div></td>
                  <td className="text-muted">{p.category?.name || "None"}</td>
                  <td>{p.sale_price != null ? <><span>{money(p.sale_price)}</span> <span className="text-xs text-muted line-through">{money(p.price)}</span></> : money(p.price)}</td>
                  <td className={p.stock === 0 ? "text-red-400" : p.stock <= 5 ? "text-amber-300" : ""}>{p.stock}</td>
                  <td><button onClick={() => toggle(p)} aria-label={p.is_published ? `Hide ${p.name}` : `Publish ${p.name}`}><Badge value={p.is_published ? "live" : "hidden"} label={p.is_published ? "Published" : "Hidden"} /></button></td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    <Link to={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="flex h-10 w-10 items-center justify-center hover:text-bronze"><Pencil size={17} /></Link>
                    <button onClick={() => setDel(p)} aria-label={`Delete ${p.name}`} className="flex h-10 w-10 items-center justify-center hover:text-red-400"><Trash2 size={17} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={f.page} total={data.total} onPage={(page) => setF((p) => ({ ...p, page }))} />}
      <Confirm open={!!del} title="Delete this product?" text={`"${del?.name}" will be removed from the store along with its images. Past orders keep their details. To keep it but hide it, use the Published badge instead.`} label="Delete product" busy={busy} onConfirm={confirmDelete} onCancel={() => setDel(null)} />
    </>
  );
}
