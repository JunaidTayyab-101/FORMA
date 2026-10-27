import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getSettings, getCategories } from "../services/store.js";

const DEFAULTS = {
  brand_name: "FORMA Furniture & Interior", meta_title: "FORMA Furniture & Interior",
  meta_description: "Considered furniture. Timeless interiors.", currency: "PKR",
  shipping_flat: 0, free_shipping_threshold: 0,
  hero_title: "Spaces That Speak.", hero_text: "Considered furniture. Timeless interiors.",
  hero_image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=2000&q=80",
};

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [s, c] = await Promise.all([getSettings(), getCategories()]);
      setSettings({ ...DEFAULTS, ...Object.fromEntries(Object.entries(s || {}).filter(([, v]) => v !== null && v !== "")) });
      setCategories(c || []);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Dynamic tab title, favicon and meta description.
  useEffect(() => {
    document.title = settings.meta_title || settings.brand_name;
    const link = document.getElementById("site-favicon");
    if (link && settings.favicon_url) link.href = settings.favicon_url;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", settings.meta_description || "");
  }, [settings]);

  const value = useMemo(() => ({
    settings, categories, status, reload: load,
    money: (n) => `${settings.currency} ${Number(n || 0).toLocaleString("en-PK")}`,
  }), [settings, categories, status, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
