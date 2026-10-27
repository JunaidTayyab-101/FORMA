-- FORMA storefront schema. Run once in Supabase Dashboard > SQL Editor.
-- Safe to re-run: it uses "if not exists" and "create or replace".

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  stock int not null default 0 check (stock >= 0),
  width_cm numeric, height_cm numeric, depth_cm numeric,
  material text, finish text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  is_published boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_published_idx on public.products(is_published, created_at desc);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- One row of store-wide settings (id is always 1).
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  brand_name text default 'FORMA Furniture & Interior',
  footer_brand_name text,
  logo_url text, favicon_url text,
  meta_title text default 'FORMA Furniture & Interior',
  meta_description text default 'Considered furniture. Timeless interiors.',
  currency text not null default 'PKR',
  shipping_flat numeric(12,2) not null default 0,
  free_shipping_threshold numeric(12,2) not null default 0,
  announcement text,
  contact_email text, contact_phone text, address text,
  instagram_url text, facebook_url text, pinterest_url text,
  hero_title text default 'Spaces That Speak.',
  hero_text text default 'Considered furniture. Timeless interiors.',
  hero_image_url text,
  promo_title text, promo_text text, about_text text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, hero_image_url, shipping_flat, free_shipping_threshold)
values (1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=2000&q=80', 3000, 150000)
on conflict (id) do nothing;

create sequence if not exists public.order_seq;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  idempotency_key uuid not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null, phone text not null, email text,
  address text not null, city text not null, postal_code text, notes text,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending',
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Snapshot columns keep old orders readable even if a product later changes.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, sku text,
  unit_price numeric(12,2) not null, quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- Row Level Security ----------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (is_published);
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (is_published);
drop policy if exists "public read product images" on public.product_images;
create policy "public read product images" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
-- orders and order_items: RLS on, no policies => browsers cannot read or write them directly.

-- Browsers may only read. All writes go through place_order() below (or the admin panel later).
revoke insert, update, delete, truncate on public.categories, public.products, public.product_images, public.site_settings from anon, authenticated;
revoke all on public.orders, public.order_items from anon, authenticated;

-- ---------- Trusted order placement ----------
create or replace function public.place_order(p_items jsonb, p_customer jsonb, p_key uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing public.orders; v_s public.site_settings; v_prod public.products;
  v_item jsonb; v_qty int; v_price numeric; v_sub numeric := 0; v_ship numeric; v_id uuid; v_num text;
begin
  -- Retry with the same key returns the original order and never touches stock again.
  select * into v_existing from public.orders where idempotency_key = p_key;
  if found then return jsonb_build_object('order_number', v_existing.order_number, 'total', v_existing.total); end if;

  if p_key is null then raise exception 'Missing order key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;
  if length(trim(coalesce(p_customer->>'name',''))) < 2 or length(trim(coalesce(p_customer->>'phone',''))) < 9
     or length(trim(coalesce(p_customer->>'address',''))) < 6 or length(trim(coalesce(p_customer->>'city',''))) < 2
  then raise exception 'Please complete your name, phone, address and city'; end if;

  select * into v_s from public.site_settings where id = 1;
  v_num := 'FRM-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_seq')::text, 5, '0');

  insert into public.orders (order_number, idempotency_key, user_id, customer_name, phone, email, address, city, postal_code, notes)
  values (v_num, p_key, auth.uid(), trim(p_customer->>'name'), trim(p_customer->>'phone'), nullif(trim(p_customer->>'email'),''),
          trim(p_customer->>'address'), trim(p_customer->>'city'), nullif(trim(p_customer->>'postal_code'),''), nullif(trim(p_customer->>'notes'),''))
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity'; end if;
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid and is_published for update;
    if not found then raise exception 'An item in your cart is no longer available'; end if;
    if v_prod.stock < v_qty then raise exception '% has only % left in stock', v_prod.name, v_prod.stock; end if;
    v_price := coalesce(v_prod.sale_price, v_prod.price);   -- price always comes from the database
    insert into public.order_items (order_id, product_id, product_name, sku, unit_price, quantity, line_total)
    values (v_id, v_prod.id, v_prod.name, v_prod.sku, v_price, v_qty, v_price * v_qty);
    update public.products set stock = stock - v_qty, updated_at = now() where id = v_prod.id;
    v_sub := v_sub + v_price * v_qty;
  end loop;

  v_ship := case when v_s.free_shipping_threshold > 0 and v_sub >= v_s.free_shipping_threshold then 0 else v_s.shipping_flat end;
  update public.orders set subtotal = v_sub, shipping = v_ship, total = v_sub + v_ship where id = v_id;
  return jsonb_build_object('order_number', v_num, 'total', v_sub + v_ship);
end $$;

revoke all on function public.place_order(jsonb, jsonb, uuid) from public;
grant execute on function public.place_order(jsonb, jsonb, uuid) to anon, authenticated;
