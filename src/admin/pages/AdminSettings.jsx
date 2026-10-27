import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Field, PageHeader } from "../components/ui.jsx";
import Img from "../../components/Img.jsx";
import { saveSettings, uploadImage } from "../services/admin.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const TEXT = [
  ["Brand", [["brand_name", "Brand name"], ["footer_brand_name", "Footer brand name"], ["meta_title", "Browser tab title"], ["meta_description", "Meta description", "area"]]],
  ["Store", [["currency", "Currency code"], ["shipping_flat", "Shipping charge", "number"], ["free_shipping_threshold", "Free shipping from (0 = never)", "number"], ["announcement", "Announcement bar text"]]],
  ["Contact and social", [["contact_email", "Contact email", "email"], ["contact_phone", "Contact phone"], ["address", "Business address", "area"], ["instagram_url", "Instagram URL", "url"], ["facebook_url", "Facebook URL", "url"], ["pinterest_url", "Pinterest URL", "url"]]],
  ["Homepage", [["hero_title", "Hero heading"], ["hero_text", "Hero text", "area"], ["promo_title", "Promo banner heading"], ["promo_text", "Promo banner text", "area"], ["about_text", "Brand story text", "area"]]],
];
const IMAGES = [["logo_url", "Header logo", "Shown in the site header"], ["favicon_url", "Favicon", "Small icon in the browser tab (PNG or ICO, square)"], ["hero_image_url", "Hero image", "Large homepage image"]];

export default function AdminSettings() {
  const { settings, reload } = useSettings();
  const toast = useToast();
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const refs = useRef({});
  useEffect(() => setF(Object.fromEntries([...TEXT.flatMap(([, a]) => a.map(([k]) => k)), ...IMAGES.map(([k]) => k)].map((k) => [k, settings[k] ?? ""]))), [settings]);

  const up = async (k, file) => { setErr(""); try { setBusy(true); const url = await uploadImage(file, "branding"); setF((p) => ({ ...p, [k]: url })); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!/^[A-Za-z]{2,6}$/.test(f.currency || "")) return setErr("Currency must be a short code such as PKR.");
    if (Number(f.shipping_flat) < 0 || Number(f.free_shipping_threshold) < 0) return setErr("Shipping amounts cannot be negative.");
    setBusy(true);
    try {
      const out = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]));
      out.currency = f.currency.toUpperCase(); out.shipping_flat = Number(f.shipping_flat) || 0; out.free_shipping_threshold = Number(f.free_shipping_threshold) || 0;
      await saveSettings(out); await reload(); toast("Settings saved.");
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader title="Settings" sub="Brand, logo, favicon and store rules. Saved changes update the store."><button disabled={busy} className="btn-primary">{busy ? "Working…" : "Save settings"}</button></PageHeader>
      {err && <div role="alert" className="mb-5 border border-red-400/40 bg-red-500/5 p-3 text-sm text-red-300">{err}</div>}
      <div className="space-y-6">
        <section className="border border-ivory/10 bg-card p-5"><h2 className="mb-4 text-2xl">Images</h2>
          <div className="grid gap-5 md:grid-cols-3">{IMAGES.map(([k, l, h]) => (
            <div key={k}><p className="text-sm">{l}</p><p className="mb-2 text-xs text-muted">{h}</p>
              <div className="flex h-24 items-center justify-center overflow-hidden bg-surface"><Img src={f[k]} alt="" className="h-full w-full object-contain" /></div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/x-icon" hidden ref={(el) => (refs.current[k] = el)} onChange={(e) => e.target.files[0] && up(k, e.target.files[0])} />
              <div className="mt-2 flex gap-2"><button type="button" onClick={() => refs.current[k].click()} disabled={busy} className="btn-ghost !min-h-[40px]"><Upload size={15} />Upload</button>
                {f[k] && <button type="button" onClick={() => setF({ ...f, [k]: "" })} className="text-sm text-muted hover:text-red-400">Remove</button>}</div></div>))}</div>
          <p className="mt-4 text-xs text-muted">Browsers cache favicons. After changing it, hard refresh (Ctrl+Shift+R) to see the new icon.</p></section>
        {TEXT.map(([title, fields]) => (
          <section key={title} className="border border-ivory/10 bg-card p-5"><h2 className="mb-4 text-2xl">{title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">{fields.map(([k, l, t]) => (
              <Field key={k} label={l} className={t === "area" ? "sm:col-span-2" : ""}>
                {t === "area" ? <textarea rows={3} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="field py-3" />
                  : <input type={t || "text"} step={t === "number" ? "0.01" : undefined} min={t === "number" ? "0" : undefined} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="field" />}</Field>))}</div></section>
        ))}
      </div>
    </form>
  );
}
