-- =====================================================================
-- VESPER — stock and orders on Supabase (PostgreSQL)
--
-- Run this whole file once in Supabase Dashboard → SQL Editor, then run
-- supabase/seed.sql (generated from the catalogue by `npm run supabase:seed`).
-- Safe to re-run: tables, functions and policies are created idempotently.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Prices live here so checkout totals are computed by the database, never by the browser.
create table if not exists public.products (
  slug      text primary key,
  title     text not null,
  price     numeric(12, 2) not null check (price >= 0),
  currency  text not null default 'RWF'
);

-- One row per product × colourway × size. sku = '<slug>:<colourway>:<size>'.
create table if not exists public.inventory (
  sku           text primary key,
  product_slug  text not null references public.products(slug) on delete cascade,
  colorway_id   text not null,
  colour_name   text not null,
  size          text not null,
  on_hand       integer not null default 0 check (on_hand >= 0),
  updated_at    timestamptz not null default now()
);
create index if not exists inventory_product_idx on public.inventory(product_slug);

create table if not exists public.delivery_options (
  id     text primary key,
  label  text not null,
  fee    numeric(12, 2) not null check (fee >= 0)
);

create table if not exists public.store_settings (
  id                   integer primary key default 1 check (id = 1),
  low_stock_threshold  integer not null default 3 check (low_stock_threshold between 0 and 99)
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  created_at    timestamptz not null default now(),
  customer      jsonb not null,
  delivery      text not null references public.delivery_options(id),
  payment       text not null check (payment in ('card', 'mtn', 'airtel')),
  subtotal      numeric(12, 2) not null default 0,
  delivery_fee  numeric(12, 2) not null default 0,
  total         numeric(12, 2) not null default 0,
  currency      text not null default 'RWF'
);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  sku           text not null,
  product_slug  text not null,
  colorway_id   text not null,
  size          text not null,
  title         text not null,
  colour_name   text not null,
  unit_price    numeric(12, 2) not null,
  quantity      integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- People listed here can change stock and see orders. After creating your
-- user (Authentication → Users → Add user), run:
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
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

drop trigger if exists inventory_touch on public.inventory;
create trigger inventory_touch before update on public.inventory
  for each row execute function public.touch_updated_at();

-- Admin: add or remove units (never below zero).
create or replace function public.adjust_stock(p_sku text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  update public.inventory set on_hand = greatest(0, on_hand + p_delta) where sku = p_sku;
  if not found then raise exception 'unknown sku %', p_sku; end if;
end;
$$;

-- Admin: set an exact count (stock take).
create or replace function public.set_stock(p_sku text, p_on_hand integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if p_on_hand < 0 or p_on_hand > 9999 then
    raise exception 'stock must be between 0 and 9999';
  end if;
  update public.inventory set on_hand = p_on_hand where sku = p_sku;
  if not found then raise exception 'unknown sku %', p_sku; end if;
end;
$$;

-- Checkout: validates stock and decrements it in ONE transaction. The rows
-- are locked FOR UPDATE (in sku order, to avoid deadlocks) so two shoppers
-- can never both buy the last unit. Prices and the delivery fee are read
-- from the database; the browser only sends SKUs and quantities.
create or replace function public.place_order(
  p_lines jsonb,
  p_customer jsonb,
  p_delivery text,
  p_payment text
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
  v_fee        numeric(12, 2);
  v_subtotal   numeric(12, 2);
  v_order      jsonb;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 50 then
    raise exception 'invalid order lines';
  end if;
  if p_payment not in ('card', 'mtn', 'airtel') then
    raise exception 'invalid payment method';
  end if;
  select fee into v_fee from public.delivery_options where id = p_delivery;
  if v_fee is null then
    raise exception 'invalid delivery option';
  end if;
  if coalesce(length(trim(p_customer->>'name')), 0) < 2
     or coalesce(p_customer->>'email', '') !~ '^\S+@\S+\.\S+$'
     or length(p_customer::text) > 2000 then
    raise exception 'invalid customer details';
  end if;

  -- Lock every variant in the order before reading stock.
  perform 1 from public.inventory
   where sku in (select e->>'sku' from jsonb_array_elements(p_lines) e)
   order by sku
     for update;

  for v_line in
    select l.sku, l.quantity, i.on_hand, i.colour_name, i.size, p.title
      from (
        select sku, sum(quantity)::integer as quantity
          from jsonb_to_recordset(p_lines) as x(sku text, quantity integer)
         group by sku
      ) l
      left join public.inventory i on i.sku = l.sku
      left join public.products p on p.slug = i.product_slug
  loop
    if v_line.quantity is null or v_line.quantity <= 0 or v_line.quantity > 99 then
      raise exception 'invalid quantity';
    end if;
    if v_line.on_hand is null or v_line.quantity > v_line.on_hand then
      v_conflicts := v_conflicts || jsonb_build_object(
        'sku', v_line.sku,
        'title', coalesce(v_line.title || ', ' || v_line.colour_name || ', ' || v_line.size, 'Unavailable piece'),
        'requested', v_line.quantity,
        'available', coalesce(v_line.on_hand, 0)
      );
    end if;
  end loop;

  if jsonb_array_length(v_conflicts) > 0 then
    return jsonb_build_object('ok', false, 'conflicts', v_conflicts, 'message', 'Some pieces sold out while you were checking out.');
  end if;

  insert into public.orders (reference, customer, delivery, payment)
  values ('VSP-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)), p_customer, p_delivery, p_payment)
  returning id into v_order_id;

  insert into public.order_items (order_id, sku, product_slug, colorway_id, size, title, colour_name, unit_price, quantity)
  select v_order_id, i.sku, i.product_slug, i.colorway_id, i.size, p.title, i.colour_name, p.price, l.quantity
    from (
      select sku, sum(quantity)::integer as quantity
        from jsonb_to_recordset(p_lines) as x(sku text, quantity integer)
       group by sku
    ) l
    join public.inventory i on i.sku = l.sku
    join public.products p on p.slug = i.product_slug;

  update public.inventory i
     set on_hand = i.on_hand - oi.quantity
    from public.order_items oi
   where oi.order_id = v_order_id and i.sku = oi.sku;

  select coalesce(sum(unit_price * quantity), 0) into v_subtotal from public.order_items where order_id = v_order_id;
  update public.orders
     set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where id = v_order_id;

  select to_jsonb(o) || jsonb_build_object(
           'order_items', (select jsonb_agg(to_jsonb(oi)) from public.order_items oi where oi.order_id = o.id))
    into v_order
    from public.orders o
   where o.id = v_order_id;

  return jsonb_build_object('ok', true, 'order', v_order);
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text, text) to anon, authenticated;
revoke all on function public.adjust_stock(text, integer) from public;
grant execute on function public.adjust_stock(text, integer) to authenticated;
revoke all on function public.set_stock(text, integer) from public;
grant execute on function public.set_stock(text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security: anyone can read stock; only admins change it or see orders
-- ---------------------------------------------------------------------
alter table public.products         enable row level security;
alter table public.inventory        enable row level security;
alter table public.delivery_options enable row level security;
alter table public.store_settings   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.admins           enable row level security;

drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select using (true);
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inventory read" on public.inventory;
create policy "inventory read" on public.inventory for select using (true);
drop policy if exists "inventory admin write" on public.inventory;
create policy "inventory admin write" on public.inventory for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "delivery read" on public.delivery_options;
create policy "delivery read" on public.delivery_options for select using (true);

drop policy if exists "settings read" on public.store_settings;
create policy "settings read" on public.store_settings for select using (true);
drop policy if exists "settings admin write" on public.store_settings;
create policy "settings admin write" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());

-- Orders are only ever written by place_order(); only admins can read them.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select using (public.is_admin());
drop policy if exists "order items admin read" on public.order_items;
create policy "order items admin read" on public.order_items for select using (public.is_admin());

drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Realtime: push stock, settings and order changes to the store and admin
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['inventory', 'store_settings', 'orders'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
