import { useRef, useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Badge, Confirm, Empty, ErrorBox, Field, Loading, Modal, PageHeader, slugify } from "../components/ui.jsx";
import Img from "../../components/Img.jsx";
import useLoad from "../hooks/useLoad.js";
import { deleteCategory, listCategories, saveCategory, uploadImage } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const EMPTY = { name: "", slug: "", description: "", image_url: "", sort_order: "0", is_published: true };

export default function Categories() {
  const toast = useToast();
  const { reload: reloadStore } = useSettings();
  const { data, loading, error, reload } = useLoad(listCategories, []);
  const fileRef = useRef();
  const [edit, setEdit] = useState(null); // { id|null, f }
  const [del, setDel] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const open = (c) => { setErr(""); setEdit(c ? { id: c.id, f: { ...EMPTY, ...c, sort_order: String(c.sort_order), description: c.description || "", image_url: c.image_url || "" } } : { id: null, f: EMPTY }); };
  const setF = (k, v) => setEdit((e) => ({ ...e, f: { ...e.f, [k]: v, ...(k === "name" && !e.id && e.f.slug === slugify(e.f.name) ? { slug: slugify(v) } : {}) } }));
  const done = (m) => { toast(m); reload(); reloadStore(); };

  const upload = async (file) => { try { setBusy(true); setF("image_url", await uploadImage(file, "categories")); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const { f } = edit;
    if (f.name.trim().length < 2) return setErr("Enter a category name.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return setErr("Slug can only use lowercase letters, numbers and hyphens.");
    setBusy(true);
    try {
      await saveCategory(edit.id, { name: f.name.trim(), slug: f.slug, description: f.description.trim() || null, image_url: f.image_url || null, sort_order: Number(f.sort_order) || 0, is_published: f.is_published });
      setEdit(null); done("Category saved.");
    } catch (x) { setErr(/duplicate key/.test(x.message) ? "That slug is already used." : x.message); } finally { setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await deleteCategory(del.id); setDel(null); done("Category deleted."); } catch (x) { toast(x.message); } finally { setBusy(false); } };

  return (
    <>
      <PageHeader title="Categories" sub="Published categories appear in the store menu, filters and homepage."><button onClick={() => open(null)} className="btn-primary"><Plus size={16} />Add category</button></PageHeader>
      {loading && !data && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && !data.length && <Empty>No categories yet.</Empty>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-ivory/10 border border-ivory/10 bg-card">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden bg-surface"><Img src={c.image_url} alt="" className="h-full w-full object-cover" /></div>
              <div className="min-w-0 flex-1"><p className="truncate">{c.name}</p><p className="truncate text-xs text-muted">/{c.slug} · order {c.sort_order}</p></div>
              <span className="hidden sm:block"><Badge value={c.is_published ? "live" : "hidden"} label={c.is_published ? "Published" : "Hidden"} /></span>
              <button onClick={() => open(c)} aria-label={`Edit ${c.name}`} className="flex h-10 w-10 items-center justify-center hover:text-bronze"><Pencil size={17} /></button>
              <button onClick={() => setDel(c)} aria-label={`Delete ${c.name}`} className="flex h-10 w-10 items-center justify-center hover:text-red-400"><Trash2 size={17} /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} title={edit?.id ? "Edit category" : "New category"} onClose={() => setEdit(null)}>
        {edit && (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Name"><input value={edit.f.name} onChange={(e) => setF("name", e.target.value)} className="field" /></Field>
            <Field label="URL slug"><input value={edit.f.slug} onChange={(e) => setF("slug", e.target.value)} className="field" /></Field>
            <Field label="Description"><textarea rows={2} value={edit.f.description} onChange={(e) => setF("description", e.target.value)} className="field py-3" /></Field>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden bg-card"><Img src={edit.f.image_url} alt="" className="h-full w-full object-cover" /></div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current.click()} disabled={busy} className="btn-ghost"><Upload size={16} />Upload image</button>
            </div>
            <Field label="Display order" hint="Lower numbers appear first"><input type="number" value={edit.f.sort_order} onChange={(e) => setF("sort_order", e.target.value)} className="field" /></Field>
            <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" checked={edit.f.is_published} onChange={(e) => setF("is_published", e.target.checked)} className="h-4 w-4 accent-[#B08D57]" />Published</label>
            {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEdit(null)} className="btn-ghost">Cancel</button><button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save category"}</button></div>
          </form>
        )}
      </Modal>
      <Confirm open={!!del} title="Delete this category?" text={`"${del?.name}" will be removed. Its products stay in the store but will have no category.`} label="Delete category" busy={busy} onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}
