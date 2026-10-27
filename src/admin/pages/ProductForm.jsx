import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from "lucide-react";
import { ErrorBox, Field, Loading, PageHeader, slugify } from "../components/ui.jsx";
import Img from "../../components/Img.jsx";
import useLoad from "../hooks/useLoad.js";
import { getProduct, listCategories, saveProduct, uploadImage } from "../services/admin.js";
import { useToast } from "../../context/ToastContext.jsx";
import { sortImages } from "../../utils/format.js";

const EMPTY = { name: "", slug: "", sku: "", category_id: "", description: "", price: "", sale_price: "", stock: "0", width_cm: "", height_cm: "", depth_cm: "", material: "", finish: "", is_featured: false, is_new: false, is_best_seller: false, is_published: true };
const num = (v) => (v === "" || v == null ? null : Number(v));

export default function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const fileRef = useRef();
  const [f, setF] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [images, setImages] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const cats = useLoad(listCategories, []);
  const prod = useLoad(() => (id ? getProduct(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    const p = prod.data;
    if (!p) return;
    setF({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] == null ? EMPTY[k] : typeof EMPTY[k] === "boolean" ? p[k] : String(p[k])])) });
    setSlugTouched(true);
    setImages(sortImages(p.product_images).map((i) => i.url));
  }, [prod.data]);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((p) => ({ ...p, [k]: v, ...(k === "name" && !slugTouched ? { slug: slugify(v) } : {}) }));
  };

  const addFiles = async (files) => {
    setUploading(true); setFormError("");
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadImage(file, "products"));
      setImages((p) => [...p, ...urls]);
    } catch (e) { setFormError(e.message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const move = (i, d) => setImages((p) => { const a = [...p]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
  const makeMain = (i) => setImages((p) => [p[i], ...p.filter((_, x) => x !== i)]);
  const removeImg = (i) => { setRemoved((r) => [...r, images[i]]); setImages((p) => p.filter((_, x) => x !== i)); };

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter a product name.";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.slug = "Use lowercase letters, numbers and hyphens only.";
    if (f.price === "" || Number(f.price) < 0) e.price = "Enter a price of 0 or more.";
    if (f.sale_price !== "" && !(Number(f.sale_price) >= 0 && Number(f.sale_price) < Number(f.price))) e.sale_price = "Sale price must be lower than the price.";
    if (!/^\d+$/.test(f.stock)) e.stock = "Stock must be a whole number.";
    ["width_cm", "height_cm", "depth_cm"].forEach((k) => { if (f[k] !== "" && !(Number(f[k]) > 0)) e[k] = "Enter a positive number."; });
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(); setErrors(errs); setFormError("");
    if (Object.keys(errs).length) return setFormError("Please fix the highlighted fields.");
    setBusy(true);
    try {
      const fields = { name: f.name.trim(), slug: f.slug, sku: f.sku.trim() || null, category_id: f.category_id || null, description: f.description.trim() || null,
        price: Number(f.price), sale_price: num(f.sale_price), stock: Number(f.stock), width_cm: num(f.width_cm), height_cm: num(f.height_cm), depth_cm: num(f.depth_cm),
        material: f.material.trim() || null, finish: f.finish.trim() || null, is_featured: f.is_featured, is_new: f.is_new, is_best_seller: f.is_best_seller, is_published: f.is_published };
      await saveProduct(id || null, fields, images, removed);
      toast(id ? "Product saved." : "Product created.");
      nav("/admin/products");
    } catch (err) {
      setFormError(/duplicate key/.test(err.message) ? "That slug or SKU is already used by another product." : err.message);
    } finally { setBusy(false); }
  };

  if (id && prod.loading && !prod.data) return <Loading />;
  if (prod.error) return <ErrorBox message={prod.error} onRetry={prod.reload} />;
  if (id && !prod.data) return <ErrorBox message="Product not found." />;

  const E = (k) => errors[k];
  return (
    <form onSubmit={submit} noValidate>
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-bronze"><ArrowLeft size={14} />Products</Link>
      <PageHeader title={id ? "Edit product" : "New product"}>
        {id && f.is_published && <Link to={`/product/${f.slug}`} target="_blank" className="btn-ghost">View on store</Link>}
        <button disabled={busy || uploading} className="btn-primary">{busy ? "Saving…" : "Save product"}</button>
      </PageHeader>
      {formError && <div role="alert" className="mb-5 border border-red-400/40 bg-red-500/5 p-3 text-sm text-red-300">{formError}</div>}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-4 border border-ivory/10 bg-card p-5">
            <h2 className="text-2xl">Details</h2>
            <Field label="Name" error={E("name")}><input value={f.name} onChange={set("name")} className="field" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL slug" error={E("slug")} hint="Used in the product link"><input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug")(e); }} className="field" /></Field>
              <Field label="SKU"><input value={f.sku} onChange={set("sku")} className="field" /></Field>
            </div>
            <Field label="Category"><select value={f.category_id} onChange={set("category_id")} className="field"><option value="">No category</option>{(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Description"><textarea rows={5} value={f.description} onChange={set("description")} className="field py-3" /></Field>
          </section>
          <section className="space-y-4 border border-ivory/10 bg-card p-5">
            <h2 className="text-2xl">Price and stock</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price" error={E("price")}><input type="number" min="0" step="0.01" inputMode="decimal" value={f.price} onChange={set("price")} className="field" /></Field>
              <Field label="Sale price (optional)" error={E("sale_price")}><input type="number" min="0" step="0.01" inputMode="decimal" value={f.sale_price} onChange={set("sale_price")} className="field" /></Field>
              <Field label="Stock" error={E("stock")}><input type="number" min="0" step="1" inputMode="numeric" value={f.stock} onChange={set("stock")} className="field" /></Field>
            </div>
          </section>
          <section className="space-y-4 border border-ivory/10 bg-card p-5">
            <h2 className="text-2xl">Size and materials</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[["width_cm", "Width (cm)"], ["depth_cm", "Depth (cm)"], ["height_cm", "Height (cm)"]].map(([k, l]) => <Field key={k} label={l} error={E(k)}><input type="number" min="0" step="0.1" inputMode="decimal" value={f[k]} onChange={set(k)} className="field" /></Field>)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Material"><input value={f.material} onChange={set("material")} className="field" /></Field><Field label="Finish"><input value={f.finish} onChange={set("finish")} className="field" /></Field></div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="border border-ivory/10 bg-card p-5">
            <h2 className="mb-3 text-2xl">Visibility</h2>
            {[["is_published", "Published on the store"], ["is_featured", "Featured on the homepage"], ["is_best_seller", "Best seller"], ["is_new", "New arrival"]].map(([k, l]) => (
              <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={f[k]} onChange={set(k)} className="h-4 w-4 accent-[#B08D57]" />{l}</label>
            ))}
          </section>
          <section className="border border-ivory/10 bg-card p-5">
            <h2 className="mb-1 text-2xl">Images</h2>
            <p className="mb-3 text-xs text-muted">The first image is the main image. JPG, PNG or WebP, up to 5 MB each.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
              {images.map((u, i) => (
                <div key={u} className="border border-ivory/10 bg-surface p-1.5">
                  <div className="relative aspect-square overflow-hidden"><Img src={u} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />{i === 0 && <span className="absolute left-0 top-0 bg-bronze px-2 py-0.5 text-xs text-ink">Main</span>}</div>
                  <div className="mt-1.5 flex justify-between">
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="flex h-9 w-9 items-center justify-center disabled:opacity-30"><ArrowLeft size={15} /></button>
                    <button type="button" disabled={i === 0} onClick={() => makeMain(i)} aria-label="Make main image" className="flex h-9 w-9 items-center justify-center hover:text-bronze disabled:opacity-30"><Star size={15} /></button>
                    <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="flex h-9 w-9 items-center justify-center disabled:opacity-30"><ArrowRight size={15} /></button>
                    <button type="button" onClick={() => removeImg(i)} aria-label="Remove image" className="flex h-9 w-9 items-center justify-center hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files.length && addFiles([...e.target.files])} />
            <button type="button" disabled={uploading} onClick={() => fileRef.current.click()} className="btn-ghost mt-3 w-full"><Upload size={16} />{uploading ? "Uploading…" : "Upload images"}</button>
          </section>
        </div>
      </div>
    </form>
  );
}
