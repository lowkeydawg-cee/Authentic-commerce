-- =====================================================================
-- Authentic Commerce — Supabase / PostgreSQL schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- It is idempotent for tables/policies, and seeds a demo catalog.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  visible     boolean not null default true,
  sort_order  integer not null default 0
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  sku          text not null unique,
  title        text not null,
  description  text not null default '',
  category_id  uuid not null references public.categories(id) on delete restrict,
  price        numeric(12, 2) not null check (price >= 0),
  stock        integer not null default 0 check (stock >= 0),
  visible      boolean not null default true,
  featured     boolean not null default false,
  image_url    text,
  accent       text not null default 'amber'
               check (accent in ('amber','rose','emerald','sky','violet','slate')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);

create table if not exists public.store_settings (
  id                   integer primary key default 1 check (id = 1),
  store_name           text not null default 'Authentic',
  hero_eyebrow         text not null default 'The Autumn Edit · Crafted in Kigali',
  hero_title           text not null default 'Objects of quiet luxury, made to last.',
  hero_subtitle        text not null default 'Hand-finished leather, precision timepieces and artisan homeware — curated in small batches and delivered across Rwanda.',
  currency             text not null default 'RWF',
  low_stock_threshold  integer not null default 5 check (low_stock_threshold >= 0)
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  customer        jsonb not null,
  payment_method  text not null check (payment_method in ('card','mtn_momo','airtel_money')),
  total           numeric(12, 2) not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  title       text not null,
  unit_price  numeric(12, 2) not null,
  quantity    integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Users listed here can manage the store. Add yourself after signing up:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Admin-only atomic stock adjustment (never drops below zero).
create or replace function public.adjust_stock(p_product_id uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  update public.products
     set stock = greatest(0, stock + p_delta)
   where id = p_product_id;
end;
$$;

-- Public checkout: validates and decrements stock in ONE transaction.
-- Rows are locked FOR UPDATE (in id order, to avoid deadlocks) so two
-- simultaneous buyers can never both take the last unit.
create or replace function public.place_order(
  p_lines jsonb,
  p_customer jsonb,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line       record;
  v_conflicts  jsonb := '[]'::jsonb;
  v_order_id   uuid;
  v_reference  text;
  v_total      numeric(12, 2) := 0;
  v_order      jsonb;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0
     or jsonb_array_length(p_lines) > 50 then
    raise exception 'invalid order lines';
  end if;

  -- Lock every product in the order (in id order) before reading stock.
  perform 1
     from public.products
    where id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_lines) e)
    order by id
      for update;

  for v_line in
    select l.product_id, l.quantity, p.title, p.stock, p.visible
      from (
        select product_id, sum(quantity)::integer as quantity
          from jsonb_to_recordset(p_lines) as x(product_id uuid, quantity integer)
         group by product_id
      ) l
      left join public.products p on p.id = l.product_id
  loop
    if v_line.quantity is null or v_line.quantity <= 0 then
      raise exception 'invalid quantity';
    end if;
    if v_line.title is null or not v_line.visible or v_line.quantity > v_line.stock then
      v_conflicts := v_conflicts || jsonb_build_object(
        'productId', v_line.product_id,
        'title', coalesce(v_line.title, 'Unavailable item'),
        'requested', v_line.quantity,
        'available', case when v_line.visible then coalesce(v_line.stock, 0) else 0 end
      );
    end if;
  end loop;

  if jsonb_array_length(v_conflicts) > 0 then
    return jsonb_build_object(
      'ok', false,
      'conflicts', v_conflicts,
      'message', 'Some items sold out while you were checking out.'
    );
  end if;

  v_reference := 'AC-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.orders (reference, customer, payment_method, total)
  values (v_reference, p_customer, p_payment_method, 0)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, title, unit_price, quantity)
  select v_order_id, p.id, p.title, p.price, l.quantity
    from (
      select product_id, sum(quantity)::integer as quantity
        from jsonb_to_recordset(p_lines) as x(product_id uuid, quantity integer)
       group by product_id
    ) l
    join public.products p on p.id = l.product_id;

  update public.products p
     set stock = p.stock - i.quantity
    from public.order_items i
   where i.order_id = v_order_id and p.id = i.product_id;

  select coalesce(sum(unit_price * quantity), 0) into v_total
    from public.order_items where order_id = v_order_id;
  update public.orders set total = v_total where id = v_order_id;

  select jsonb_build_object(
    'id', o.id,
    'reference', o.reference,
    'customer', o.customer,
    'paymentMethod', o.payment_method,
    'total', o.total,
    'createdAt', o.created_at,
    'lines', (
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'title', i.title,
        'unitPrice', i.unit_price,
        'quantity', i.quantity))
      from public.order_items i where i.order_id = o.id
    )
  ) into v_order
  from public.orders o where o.id = v_order_id;

  return jsonb_build_object('ok', true, 'order', v_order);
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;
revoke all on function public.adjust_stock(uuid, integer) from public;
grant execute on function public.adjust_stock(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.admins         enable row level security;

drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories
  for select using (visible or public.is_admin());
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products read" on public.products;
create policy "products read" on public.products
  for select using (visible or public.is_admin());
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.store_settings;
create policy "settings read" on public.store_settings for select using (true);
drop policy if exists "settings admin write" on public.store_settings;
create policy "settings admin write" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- Orders are only written through place_order(); only admins can read them.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select using (public.is_admin());
drop policy if exists "order items admin read" on public.order_items;
create policy "order items admin read" on public.order_items for select using (public.is_admin());

drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Realtime: stream changes to the storefront and the admin dashboard
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['products','categories','store_settings','orders'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Demo seed (skipped if products already exist)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.products) then return; end if;

  insert into public.categories (name, slug, sort_order) values
    ('Accessories', 'accessories', 1),
    ('Audio', 'audio', 2),
    ('Apparel', 'apparel', 3),
    ('Home', 'home', 4)
  on conflict (slug) do nothing;

  insert into public.products (sku, title, description, category_id, price, stock, featured, accent)
  select v.sku, v.title, v.description, c.id, v.price, v.stock, v.featured, v.accent
  from (values
    ('ACC-WCH-001','Meridian Chronograph','Sapphire crystal, brushed steel case and a hand-stitched Imigongo-pattern strap.','accessories',485000,12,true,'amber'),
    ('ACC-BAG-002','Volcanoes Leather Tote','Full-grain leather tote, hand-finished edges and brass hardware.','accessories',210000,4,true,'rose'),
    ('ACC-GLS-003','Lakeside Sunglasses','Polarised acetate frames with UV400 protection.','accessories',95000,0,false,'sky'),
    ('AUD-HDP-004','Aura Studio Headphones','Active noise cancelling, 40-hour battery and memory-foam cushions.','audio',320000,18,true,'violet'),
    ('AUD-SPK-005','Ember Portable Speaker','Room-filling 360° sound in a walnut and wool enclosure.','audio',175000,3,false,'emerald'),
    ('APP-JKT-006','Nyungwe Field Jacket','Waxed organic cotton with a quilted merino lining.','apparel',260000,9,false,'emerald'),
    ('APP-SHR-007','Atelier Linen Shirt','Breathable Belgian linen, mother-of-pearl buttons.','apparel',78000,25,false,'slate'),
    ('HOM-CFE-008','Kivu Single-Origin Coffee Set','Hand-thrown ceramic pour-over set with 500g of Lake Kivu beans.','home',68000,2,false,'amber'),
    ('HOM-LMP-009','Agaseke Woven Lamp','Sisal pendant woven by artisan cooperatives in the Southern Province.','home',135000,7,false,'rose')
  ) as v(sku, title, description, slug, price, stock, featured, accent)
  join public.categories c on c.slug = v.slug;
end $$;
