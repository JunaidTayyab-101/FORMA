-- FORMA admin panel: roles, admin-only permissions, storage bucket, dashboard and order functions.
-- Run AFTER schema.sql (and seed.sql). Safe to re-run.

-- 1) Admin roles. Only you can add rows here (from the SQL Editor). The browser cannot write to it.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) Admin write access to catalog tables (RLS still blocks everyone who is not an admin).
alter table public.orders add column if not exists internal_notes text;

grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant update on public.site_settings to authenticated;

do $$ declare t text; begin
  foreach t in array array['categories','products','product_images'] loop
    execute format('drop policy if exists "admin all %1$s" on public.%1$I', t);
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
drop policy if exists "admin update settings" on public.site_settings;
create policy "admin update settings" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3) Orders: admins can read; they can edit only internal notes directly. Status changes go through the function below.
grant select on public.orders, public.order_items to authenticated;
grant update (internal_notes) on public.orders to authenticated;
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items" on public.order_items for select to authenticated using (public.is_admin());

create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_o public.orders; v_allowed text[];
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select * into v_o from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_allowed := case v_o.status
    when 'pending' then array['confirmed','cancelled']
    when 'confirmed' then array['processing','cancelled']
    when 'processing' then array['shipped','cancelled']
    when 'shipped' then array['delivered','cancelled']
    else array[]::text[] end;
  if not (p_status = any(v_allowed)) then raise exception 'Cannot change an order from % to %', v_o.status, p_status; end if;
  if p_status = 'cancelled' then
    -- Cancelled is final, so stock can only be restored once.
    update public.products p set stock = p.stock + s.qty, updated_at = now()
    from (select product_id, sum(quantity)::int as qty from public.order_items where order_id = p_order_id and product_id is not null group by product_id) s
    where p.id = s.product_id;
  end if;
  update public.orders set status = p_status, updated_at = now(),
    payment_status = case p_status when 'delivered' then 'paid' when 'cancelled' then 'cancelled' else payment_status end
  where id = p_order_id;
end $$;
revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- 4) Dashboard numbers (computed from real orders). p_days = null means all time.
create or replace function public.admin_dashboard(p_days int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_from timestamptz := case when p_days is null then '-infinity'::timestamptz else now() - make_interval(days => p_days) end;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return jsonb_build_object(
    'total_orders', (select count(*) from public.orders where created_at >= v_from),
    'sales', (select coalesce(sum(total), 0) from public.orders where created_at >= v_from and status <> 'cancelled'),
    'pending', (select count(*) from public.orders where created_at >= v_from and status = 'pending'),
    'delivered', (select count(*) from public.orders where created_at >= v_from and status = 'delivered'),
    'products', (select count(*) from public.products),
    'low_stock_count', (select count(*) from public.products where stock <= 5),
    'low_stock', (select coalesce(jsonb_agg(x), '[]') from (select id, name, stock from public.products where stock <= 5 order by stock, name limit 6) x),
    'recent', (select coalesce(jsonb_agg(x), '[]') from (select id, order_number, customer_name, total, status, created_at from public.orders order by created_at desc limit 6) x),
    'best', (select coalesce(jsonb_agg(x), '[]') from (
        select oi.product_name as name, sum(oi.quantity)::int as qty, sum(oi.line_total) as revenue
        from public.order_items oi join public.orders o on o.id = oi.order_id
        where o.created_at >= v_from and o.status <> 'cancelled' group by oi.product_name order by qty desc limit 5) x)
  );
end $$;
revoke all on function public.admin_dashboard(int) from public, anon;
grant execute on function public.admin_dashboard(int) to authenticated;

-- 5) Customers (grouped from orders by phone, since checkout is guest-friendly).
create or replace function public.admin_customers()
returns table (phone text, name text, email text, city text, orders_count bigint, total_spent numeric, last_order timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
    select o.phone, (array_agg(o.customer_name order by o.created_at desc))[1], (array_agg(o.email order by o.created_at desc) filter (where o.email is not null))[1],
           (array_agg(o.city order by o.created_at desc))[1], count(*), coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0), max(o.created_at)
    from public.orders o group by o.phone order by max(o.created_at) desc;
end $$;
revoke all on function public.admin_customers() from public, anon;
grant execute on function public.admin_customers() to authenticated;

-- 6) Image bucket (public read, admin-only write). Max 5 MB; png, jpeg, webp, ico.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin read product images" on storage.objects;
create policy "admin read product images" on storage.objects for select to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- 7) FIRST ADMIN. Do this by hand, once:
--   a) Supabase Dashboard > Authentication > Users > Add user (email + password, tick "Auto Confirm User").
--   b) Run the next statement with YOUR email:
--
-- insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'you@example.com' on conflict do nothing;
