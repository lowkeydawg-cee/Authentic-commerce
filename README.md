# Authentic Commerce

A premium e-commerce storefront with a **live admin stock management dashboard**, built with
Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion and Lucide icons. It runs with
zero setup on browser storage, and switches to **Supabase (PostgreSQL + Realtime)** for production
with one environment variable.

![stack](https://img.shields.io/badge/Next.js-15-black) ![tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![supabase](https://img.shields.io/badge/Supabase-optional-3ecf8e)

## Features

**Customer storefront (`/`)**
- Animated hero: staggered blur-in headline, ambient orbs, parallax floating cards for featured products.
- Product catalog with animated category pills (shared layout), debounced search (title, description, SKU, category), sorting, and spring-based card enter/exit.
- Live stock tags: **In Stock**, **Only X left**, **Out of Stock**, updated in real time.
- Glass cards with 3D tilt, a cursor-following sheen, and tactile add-to-cart feedback.
- Slide-over cart drawer. Quantities are capped at live stock, and if stock drops while a shopper browses, the cart clamps automatically and shows a notice.
- Four-step animated checkout (Delivery → Payment → Review → Confirmation) with MTN MoMo, Airtel Money and card options (demo payment, nothing is charged).
- **Atomic stock decrement** on order submission. If someone else bought the last unit first, the order is rejected, the shopper sees exactly which item changed, and the cart is corrected.

**Admin dashboard (`/admin`)**
- Real-time inventory table: SKU, product, category, unit price, remaining quantity, status.
- Every storefront purchase decrements stock on the dashboard immediately, with a highlight flash. A live orders feed shows each new order.
- Colour-coded status: 🟢 Healthy · 🟡 Low stock (configurable threshold) · 🔴 Out of stock.
- Full CRUD: add, edit and delete products; inline price and quantity edits; +/- stock steppers; category reassignment; visibility toggle; "featured in hero" toggle.
- Storefront control: edit hero copy, store name, currency and low-stock threshold; add, rename, hide and reorder categories. All changes go live for every shopper.
- Animated KPI cards: units, inventory value, revenue, low-stock and out-of-stock counts.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; defaults to the local provider
npm run dev                  # http://localhost:3000
```

Open `/` and `/admin` in two tabs, buy something, and watch the dashboard update.

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Development server         |
| `npm run build`     | Production build           |
| `npm start`         | Serve the production build |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | TypeScript, no emit        |

## Data providers

The UI only talks to the `StoreRepository` interface (`src/lib/data/repository.ts`). Two implementations ship:

| `NEXT_PUBLIC_DATA_PROVIDER` | Storage                     | Real-time sync                         | Admin auth                         | Use for                       |
| --------------------------- | --------------------------- | -------------------------------------- | ---------------------------------- | ----------------------------- |
| `local` (default)           | Browser `localStorage`      | Between tabs (BroadcastChannel + Web Locks) | None (demo)                   | Demos, design work, local dev |
| `supabase`                  | PostgreSQL (`supabase/schema.sql`) | Across all devices (Supabase Realtime) | Supabase Auth + `admins` table + RLS | **Production**           |

> ⚠️ The `local` provider keeps data in each visitor's own browser, so it is a showcase mode, not a
> shared store. Use Supabase for a real shop.

### Enabling Supabase

1. Create a project at [supabase.com](https://supabase.com) (pick the EU region closest to Rwanda, e.g. Frankfurt, for low latency).
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, RLS policies, the atomic `place_order` and `adjust_stock` functions, enables Realtime, and seeds the demo catalog.
3. **Authentication → Users → Add user**: create your admin email and password. Then in SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@yourstore.rw';
   ```
4. **Authentication → Providers → Email**: turn off "Allow new users to sign up" so nobody else can create accounts.
5. Set the environment variables (from **Project Settings → API**):
   ```bash
   NEXT_PUBLIC_DATA_PROVIDER=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

**Security model:** shoppers (anon key) can read visible products, categories and settings, and can only
create orders through `place_order()`. That function locks the affected product rows, validates stock and
decrements it in a single transaction, so two buyers can never both get the last unit. Only users in
`public.admins` can modify the catalog or read orders. These rules are enforced by Postgres RLS, not by the UI.

## Project structure

```
src/
  app/
    layout.tsx            Fonts, metadata, providers
    page.tsx              Storefront
    admin/page.tsx        Admin dashboard
  components/
    storefront/           Navbar, Hero, Catalog, ProductCard, CartDrawer, CheckoutModal, …
    admin/                AdminApp, StatsCards, InventoryTable, ProductFormModal,
                          CategoryManager, SettingsPanel, OrdersPanel, LoginCard
    ui/                   Button, Modal, Field, Toaster, StockBadge, ProductArt
  lib/
    types.ts              Domain model (Product, Category, StoreSettings, Order…)
    data/                 StoreRepository interface + local and Supabase adapters
    seed.ts               Demo catalog and default settings
    stock.ts              Status rules (healthy / low / out) and colours
    format.ts             Currency (RWF by default), ids, slugs
  store/
    inventory.tsx         Live store context (subscribes to the repository)
    cart.ts               Persisted cart (Zustand) with stock clamping
    toast.ts              Notifications
supabase/schema.sql       Database schema, RLS, RPCs, realtime, seed
docs/DEPLOYMENT.md        Vercel / Netlify deployment + Register.rw custom domain
```

## Customisation

- **Products, prices, stock, visibility, featured hero picks:** Admin → Inventory.
- **Categories (add, rename, hide, reorder), hero copy, store name, currency, low-stock threshold:** Admin → Storefront.
- **Product images:** set an image URL on any product. Without one, the product gets an on-brand gradient with an accent colour you choose.
- **Brand palette and fonts:** `tailwind.config.ts` (`gold` and `ink` scales) and `src/app/layout.tsx` (Google Fonts).
- **New backend** (e.g. your own API): implement `StoreRepository` and return it from `src/lib/data/index.ts`.
- **Real payments:** `placeOrder` is the single integration point. Call your MTN MoMo, Airtel Money, Flutterwave, Stripe or similar gateway from a server route, and only call `place_order` once payment succeeds.

## Deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for step-by-step Vercel and Netlify deployment, and for
connecting a `.rw` domain registered through a Rwandan registrar such as Register.rw.
