import { supabase } from "../../lib/supabase.js";

const BUCKET = "product-images";
const PRODUCT_SELECT = "*, category:categories(id,name,slug), product_images(id,url,is_primary,sort_order)";
const ok = ({ data, error, count }) => { if (error) throw new Error(error.message); return { data, count }; };
const clean = (s) => String(s || "").replace(/[,()%*]/g, " ").trim();

export const checkIsAdmin = async () => !!ok(await supabase.rpc("is_admin")).data;
export const getDashboard = async (days) => ok(await supabase.rpc("admin_dashboard", { p_days: days })).data;

// ---------- storage ----------
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];
export async function uploadImage(file, folder = "products") {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name}: only JPG, PNG, WebP or ICO files are allowed.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: file is larger than 5 MB.`);
  const safe = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
export async function removeImages(urls) {
  const paths = urls.map((u) => (u.includes(`/${BUCKET}/`) ? decodeURIComponent(u.split(`/${BUCKET}/`)[1].split("?")[0]) : null)).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths); // best effort
}

// ---------- products ----------
export async function listProducts({ q, category, stock, page = 1, pageSize = 15 }) {
  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }).order("created_at", { ascending: false });
  if (q && clean(q)) query = query.or(`name.ilike.%${clean(q)}%,sku.ilike.%${clean(q)}%`);
  if (category) query = query.eq("category_id", category);
  if (stock === "out") query = query.eq("stock", 0);
  if (stock === "low") query = query.gt("stock", 0).lte("stock", 5);
  if (stock === "in") query = query.gt("stock", 0);
  if (stock === "hidden") query = query.eq("is_published", false);
  const { data, count } = ok(await query.range((page - 1) * pageSize, page * pageSize - 1));
  return { products: data || [], total: count || 0 };
}
export const getProduct = async (id) => ok(await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle()).data;

export async function saveProduct(id, fields, images, removedUrls = []) {
  let pid = id;
  if (id) ok(await supabase.from("products").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id));
  else pid = ok(await supabase.from("products").insert(fields).select("id").single()).data.id;
  ok(await supabase.from("product_images").delete().eq("product_id", pid));
  if (images.length) ok(await supabase.from("product_images").insert(images.map((url, i) => ({ product_id: pid, url, is_primary: i === 0, sort_order: i }))));
  await removeImages(removedUrls);
  return pid;
}
export const setPublished = async (id, v) => ok(await supabase.from("products").update({ is_published: v }).eq("id", id));
export async function deleteProduct(id) {
  const urls = (ok(await supabase.from("product_images").select("url").eq("product_id", id)).data || []).map((i) => i.url);
  ok(await supabase.from("products").delete().eq("id", id)); // past orders keep their snapshot rows
  await removeImages(urls);
}

// ---------- categories ----------
export const listCategories = async () => ok(await supabase.from("categories").select("*").order("sort_order").order("name")).data;
export async function saveCategory(id, f) {
  return id ? ok(await supabase.from("categories").update(f).eq("id", id)) : ok(await supabase.from("categories").insert(f));
}
export const deleteCategory = async (id) => ok(await supabase.from("categories").delete().eq("id", id));

// ---------- orders & customers ----------
export async function listOrders({ q, status, from, to, page = 1, pageSize = 15 }) {
  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (q && clean(q)) query = query.or(`order_number.ilike.%${clean(q)}%,customer_name.ilike.%${clean(q)}%,phone.ilike.%${clean(q)}%`);
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", new Date(`${from}T00:00:00`).toISOString());
  if (to) query = query.lte("created_at", new Date(`${to}T23:59:59`).toISOString());
  const { data, count } = ok(await query.range((page - 1) * pageSize, page * pageSize - 1));
  return { orders: data || [], total: count || 0 };
}
export const getOrderItems = async (orderId) => ok(await supabase.from("order_items").select("*").eq("order_id", orderId).order("product_name")).data;
export const setOrderStatus = async (id, status) => ok(await supabase.rpc("admin_set_order_status", { p_order_id: id, p_status: status }));
export const saveOrderNotes = async (id, notes) => ok(await supabase.from("orders").update({ internal_notes: notes || null }).eq("id", id));
export const listCustomers = async () => ok(await supabase.rpc("admin_customers")).data || [];
export const ordersByPhone = async (phone) => ok(await supabase.from("orders").select("*").eq("phone", phone).order("created_at", { ascending: false })).data;

// ---------- settings ----------
export const saveSettings = async (fields) => ok(await supabase.from("site_settings").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", 1));
