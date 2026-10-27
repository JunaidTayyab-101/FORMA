import { supabase } from "../lib/supabase.js";

const PRODUCT_SELECT = "*, category:categories(name,slug), product_images(url,is_primary,sort_order)";

const unwrap = ({ data, error, count }) => {
  if (error) throw new Error(error.message);
  return { data, count };
};

export const getSettings = async () => (unwrap(await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle())).data;

export const getCategories = async () =>
  unwrap(await supabase.from("categories").select("*").eq("is_published", true).order("sort_order")).data;

export async function getProducts({ category, q, min, max, sort = "featured", inStock, page = 1, pageSize = 12, flag, limit, excludeId } = {}) {
  const select = category ? PRODUCT_SELECT.replace("category:categories(", "category:categories!inner(") : PRODUCT_SELECT;
  let query = supabase.from("products").select(select, { count: "exact" }).eq("is_published", true);
  if (category) query = query.eq("category.slug", category);
  if (q) {
    const safe = q.replace(/[,()%*]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (min) query = query.gte("price", Number(min));
  if (max) query = query.lte("price", Number(max));
  if (inStock) query = query.gt("stock", 0);
  if (flag) query = query.eq(flag, true);
  if (excludeId) query = query.neq("id", excludeId);
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  else query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const { data, count } = unwrap(await query);
  return { products: data || [], total: count || 0 };
}

export const getProductBySlug = async (slug) =>
  unwrap(await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_published", true).maybeSingle()).data;

export const getProductsByIds = async (ids) =>
  ids.length ? unwrap(await supabase.from("products").select(PRODUCT_SELECT).in("id", ids).eq("is_published", true)).data : [];

export async function placeOrder({ items, customer, key }) {
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
    p_customer: customer,
    p_key: key,
  });
  if (error) throw new Error(error.message);
  return data;
}
