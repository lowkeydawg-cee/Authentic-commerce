# VESPER

A luxury editorial fashion storefront where every piece can be examined in 3D. Footwear, T‑shirts, jackets and accessories are presented in a cinematic, dark showroom, with a live 3D stage on the homepage and a 3D viewer on each product page that has detail hotspots and live colour switching.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, GSAP and three.js (via @react-three/fiber).

> **Status: prototype.** The catalogue, prices (RWF), payment and order storage are samples. The 3D models and images are procedural **stand‑in renders**, not final product photography. The [launch checklist](#launch-checklist) lists everything to replace before going live.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

Node 20 or newer. No environment variables are needed for local development.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run render:standins` | Re-renders every stand‑in still into `public/media` (headless Chromium). `-- --only=journal/` renders a subset. |
| `npm run supabase:seed` | Regenerates `supabase/seed.sql` (products, prices, delivery fees, opening stock) from the catalogue |
| `npm run perf:budget` | Checks the image-size and 3D triangle budgets. Add `-- --url=http://localhost:3000` (with `npm start` running) to also check JavaScript size, LCP and layout shift for each page on a throttled phone. Exits with code 1 if any budget is exceeded. |

## Pages

| Route | |
|---|---|
| `/` | Cinematic hero, three scroll chapters that drive a live 3D camera (desktop), category tiles, film band, journal teaser |
| `/collections`, `/collections/[slug]` | Everything, five categories, plus the `new` and `the-nocturne` edits. Filters (colour, size, sort) live in the URL and are rendered on the server. |
| `/products/[slug]` | Gallery, 3D viewer with hotspots and colourways, size and colour selection, size guide, sticky add-to-bag bar |
| `/bag`, `/checkout` | Bag (also opens as a drawer) and a four-step checkout: details, delivery, payment, confirmation (demo payment) |
| `/account` | Orders placed on this device, with order lookup |
| `/admin` | Stock admin: live stock per colour and size, orders feed, low-stock alerts (see below) |
| `/search?q=` | Products and journal stories. Works without JavaScript. |
| `/journal`, `/journal/[slug]` | Editorial stories with shoppable product rows |
| `/size-guide`, `/shipping-returns`, `/care`, `/contact` | Support pages, built from the same data as the product pages and checkout |
| `/sitemap.xml`, `/robots.txt` | Generated |

## How it is put together

```
src/
  app/                 routes (server components by default)
  components/          shell, home, catalog, product, viewer, bag, account, journal, editorial, support
  content/             editorial content: home, journal, site (contact details)
  lib/commerce/        domain types, CommerceProvider interface, sample catalogue + provider
  lib/cart/            client bag store, stock guard, this device's orders (localStorage)
  lib/inventory/       live stock: types, seed, repository contract, local + Supabase backends, live hook
  lib/delivery.ts      delivery, payment and returns terms (shared by checkout and support pages)
  motion/              motion tokens, reduced-motion hook
  three/               studio lighting, stand‑in model builders and materials
scripts/render/        stand‑in poster renderer
scripts/perf/          performance budget
scripts/supabase/      generates supabase/seed.sql from the catalogue
supabase/              schema.sql (tables, checkout function, security, realtime) and seed.sql
```

- **Commerce is swappable.** UI code depends only on `CommerceProvider` (`src/lib/commerce/types.ts`). To move to Shopify, Medusa or Supabase, write an adapter that implements it and export it from `src/lib/commerce/index.ts`. The bag and orders in `src/lib/cart/` are the other pieces to replace with the platform's cart and order APIs.
- **Content is swappable.** `src/content/*` and `sample-content.ts` are shaped like CMS documents, so they can move to Sanity or a similar CMS without changing components.
- **3D is progressive.** Every product has still images first. The 3D viewer only loads after a capability check (WebGL2, memory, data saver, reduced motion). On touch devices it waits for a tap, it only renders while something changes, and it is never required to shop. Real models should be GLB files with hotspot anchors named `HS_material`, `HS_stitch`, `HS_sole`, `HS_logo` and so on, matching the stand‑ins.
- **Motion** follows the tokens in `src/motion/tokens.ts` and `tailwind.config.ts`. `prefers-reduced-motion` turns off camera moves and pinned scrolling, and shortens fades.

## Stock admin (`/admin`)

Stock is tracked per **product × colour × size** and updates live everywhere:

- **In the store:** sizes show "sold out" and a bronze dot plus "Only N left" when stock is low; product cards show "Sold out" or "Low stock"; a shopper can't add more than what's left; if stock drops below what's in someone's bag, the bag is corrected and they're told why.
- **At checkout:** the order checks and reduces stock in one step. If someone else bought the last unit first, the shopper sees exactly which piece changed and nothing is charged.
- **In the admin:** headline figures (units, stock value, low, sold out, orders), a stock grid with − / + and exact counts, a live orders feed, and the low-stock threshold. Cells and new orders glow when they change elsewhere.

Two backends implement the same contract (`src/lib/inventory/repository.ts`):

| `NEXT_PUBLIC_INVENTORY_PROVIDER` | Where stock lives | Live sync | Who can change stock | Use for |
|---|---|---|---|---|
| `local` (default) | This browser (localStorage) | Between tabs of the same browser | Anyone who opens `/admin` in that browser (it only affects their own copy) | Review and demos: open the store and `/admin` in two tabs |
| `supabase` | PostgreSQL | Every device (Supabase Realtime) | Signed-in admins only, enforced by Row Level Security | **Production** |

### Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql). The schema creates the tables, the security rules, the `place_order` checkout function and live updates; the seed loads the catalogue's products, prices, delivery fees and opening stock.
3. **Authentication → Users → Add user**: create the admin's email and password, then in SQL Editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
4. Set the environment variables from [`.env.example`](.env.example) (`NEXT_PUBLIC_INVENTORY_PROVIDER=supabase`, the project URL and anon key) locally in `.env.local` and on your host, then redeploy.
5. Sign in at `/admin`.

When the catalogue changes (new product, colour, size, price or delivery fee), run `npm run supabase:seed` and run the new `seed.sql` again. It updates products, prices and fees, adds opening stock for new sizes, and never overwrites existing stock counts.

How it is protected: shoppers can read stock but not change it; orders are only created through `place_order`, which locks the affected rows, checks stock, takes prices and the delivery fee from the database (never from the browser) and decrements in one transaction, so two shoppers can't both buy the last unit. Only users in `public.admins` can change stock or read orders. The schema was tested on PostgreSQL 16, including 30 simultaneous buyers for 5 units (exactly 5 orders succeeded, stock ended at 0). Before launch, add rate limiting or a CAPTCHA to checkout so the public `place_order` function can't be spammed, and connect a payment provider so orders are only created after payment is authorised.

## Quality bar

- WCAG 2.2 AA, checked with axe on every page at phone, tablet and desktop sizes.
- Mobile Lighthouse: Performance about 95 on the main pages, Accessibility and SEO 100.
- Budgets in `scripts/perf/budget.mjs`: first-load JavaScript at most 180 KB gzipped, LCP at most 3 s and CLS at most 0.05 on a throttled phone, at most 150 KB per image, at most 60k triangles per shoe and 40k per garment or accessory.

## Launch checklist

These are business decisions and assets that only the brand can provide:

1. **Payments.** Connect card, MTN Mobile Money and Airtel Money through a payment provider, so `place_order` runs only after payment is authorised. Until then, checkout takes no payment. (If you later move to a hosted platform such as Shopify, implement `CommerceProvider` and the inventory repository against it instead.)
2. **Real product assets.** Replace the stand‑in renders in `public/media` with photography, and the procedural models with GLB files (with hotspot anchors). Replace the homepage campaign film (`film.src` in `src/content/home.ts`).
3. **Catalogue and prices** from your CMS or platform, in place of `sample-data.ts` and `sample-content.ts` (then run `npm run supabase:seed`).
4. **Contact details.** Confirm the email, hours and location in `src/content/site.ts`.
5. **Policies.** Confirm delivery times and fees, the returns window and refund timing in `src/lib/delivery.ts` and on `/shipping-returns`.
6. **Forms.** Connect the newsletter sign-up to an email provider. The contact form currently opens the visitor's email app; replace it with a helpdesk or form endpoint if you prefer.
7. **Stock.** Switch the stock admin to Supabase (above), enter real counts in `/admin`, and add your admin users.
8. **Accounts.** Add sign-in and order history from the platform; `/account` currently lists orders placed in the visitor's browser.
9. **Domain.** Set `NEXT_PUBLIC_SITE_URL` (for example `https://vesper.rw`). It is used by the sitemap, robots file and social previews.

## Deploy

On Vercel or Netlify, set the project's root directory to `vesper`. The defaults (`npm run build`, Next.js runtime) work as they are. Set `NEXT_PUBLIC_SITE_URL` in the host's environment variables, plus the Supabase variables once the stock admin runs on Supabase. Connecting a Register.rw domain is covered in [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).
