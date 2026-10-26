# Deployment guide

This guide covers:

1. [Production database (Supabase)](#1-production-database-supabase)
2. [Deploy to Vercel](#2-deploy-to-vercel) (recommended), or [Netlify](#3-deploy-to-netlify)
3. [Connect a custom `.rw` domain from Register.rw](#4-connect-a-custom-domain-from-registerrw)
4. [Go-live checklist](#5-go-live-checklist)

---

## 1. Production database (Supabase)

Follow **Enabling Supabase** in the [README](../README.md#enabling-supabase): run `supabase/schema.sql`,
create your admin user, add it to `public.admins`, and disable public sign-ups.
Keep the **Project URL** and the **anon public key** handy for the next step.

> The anon key is safe to expose in the browser. Row Level Security is what protects your data.
> **Never** put the `service_role` key in a `NEXT_PUBLIC_*` variable.

## 2. Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repository, and keep the detected **Next.js** preset.
3. Under **Environment Variables**, add:

   | Name                            | Value                      |
   | ------------------------------- | -------------------------- |
   | `NEXT_PUBLIC_DATA_PROVIDER`     | `supabase`                 |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key              |

4. Click **Deploy**. You will get a URL like `authentic-commerce.vercel.app`.
5. Every push to your main branch redeploys production, and every pull request gets a preview URL.

**Using the CLI instead:**

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_DATA_PROVIDER production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

> `NEXT_PUBLIC_*` values are baked in at build time. After changing one, redeploy.

## 3. Deploy to Netlify

The repository includes `netlify.toml`, which uses the official Next.js runtime (`@netlify/plugin-nextjs`).

1. In [app.netlify.com](https://app.netlify.com), go to **Add new site → Import an existing project** and pick the repository.
2. Netlify reads the build command (`npm run build`) from `netlify.toml`.
3. Under **Site configuration → Environment variables**, add the same three variables as for Vercel.
4. Click **Deploy site**. You will get `your-site.netlify.app`.

## 4. Connect a custom domain from Register.rw

`.rw` domains (e.g. `authentic.rw` or `authentic.co.rw`) are administered by RICTA and sold through accredited
local registrars such as **Register.rw**. After buying the domain, point it at your host using **one** of
these two methods.

### Option A: keep DNS at Register.rw and add records (simplest)

**On Vercel:**

1. Go to **Project → Settings → Domains** and add both `authentic.rw` and `www.authentic.rw`.
   Choose which one is primary; Vercel redirects the other to it.
2. Vercel shows the exact DNS records to create. They are typically:

   | Type    | Host / Name     | Value                  | TTL  |
   | ------- | --------------- | ---------------------- | ---- |
   | `A`     | `@` (apex)      | `76.76.21.21`          | 3600 |
   | `CNAME` | `www`           | `cname.vercel-dns.com` | 3600 |

   Always use the values your Vercel dashboard shows, which may be project-specific.

**On Netlify:**

1. Go to **Domain management → Add a domain** and enter `authentic.rw`.
2. Create these records:

   | Type    | Host / Name | Value                  |
   | ------- | ----------- | ---------------------- |
   | `A`     | `@`         | `75.2.60.5`            |
   | `CNAME` | `www`       | `your-site.netlify.app` |

**At Register.rw:**

1. Sign in to the Register.rw client area and open **Domains → My Domains → (your domain)**.
2. Open the DNS management page (labelled **DNS Management** or **Manage DNS Zone**, depending on the panel version).
3. Delete any default `A` / `CNAME` records for `@` and `www` that point to a parking page.
4. Add the records from the tables above and save.
   - Some panels want the apex host as `@`, others as blank or the full domain (`authentic.rw.`).
   - If DNS management isn't available on your plan, ask Register.rw support to add the records, or use Option B.

### Option B: delegate nameservers to your host

This gives your host full control of DNS and is useful if you'll add email, subdomains or other records there.

1. **Vercel:** Domains → your domain → **Vercel DNS** shows nameservers such as `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
   **Netlify:** Domain management → **Set up Netlify DNS** shows four `dnsN.pXX.nsone.net` nameservers.
2. At Register.rw, open **Domains → (your domain) → Nameservers**, choose **custom nameservers**, paste the values and save.

> ⚠️ Changing nameservers moves **all** DNS to the new provider. Re-create any existing MX (email) records there first.

### Verification and HTTPS

- DNS changes usually take minutes, but `.rw` updates can take **up to 24–48 hours** to propagate. Check with:
  ```bash
  dig +short authentic.rw A
  dig +short www.authentic.rw CNAME
  ```
  or use [dnschecker.org](https://dnschecker.org).
- Once the records resolve, Vercel or Netlify issues a free Let's Encrypt certificate automatically. The domain shows **Valid Configuration**.

### Update Supabase for the new domain

In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to `https://authentic.rw`.
Add `https://www.authentic.rw` and your `*.vercel.app` or `*.netlify.app` preview URLs to **Redirect URLs**.

## 5. Go-live checklist

- [ ] `supabase/schema.sql` has been run, and your admin user is in `public.admins`.
- [ ] Public sign-ups are **disabled** in Supabase Auth.
- [ ] `NEXT_PUBLIC_DATA_PROVIDER=supabase` is set in production, and you have redeployed since setting it.
- [ ] You placed a test order on the live site and saw stock drop on `/admin` in another browser.
- [ ] The custom domain shows a valid HTTPS certificate, and `www` redirects to the apex (or the reverse).
- [ ] The demo payment step is replaced with a real gateway (MTN MoMo, Airtel Money, Flutterwave, Stripe or similar). Call it from a server route **before** `place_order`.
- [ ] Optional: enable Supabase Point-in-Time Recovery or scheduled backups.
