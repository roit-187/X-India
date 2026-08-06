# NEXT_PUBLIC_API_URL=https://ascend-ds0q.onrender.com
# NEXT_PUBLIC_SITE_URL=https://xindia-64cxf25fy-utkarshdhi776-7228s-projects.vercel.app
# REVALIDATE_SECRET=e58730c4705644ffe50b846c70d8a3e37a04b75f5c7edc82

# Frontend Implementation Plan — Admin Control Panel + Seller Web Portal

**Owner:** Frontend developer (implemented with an AI coding assistant — this doc is written to remove ambiguity, not just describe intent)
**Codebase:** `web/Xindia/` (Next.js 14, App Router, JavaScript — not TypeScript)
**Backend API base:** `NEXT_PUBLIC_API_URL` env var (default `http://localhost:5000`)

This document is the complete, self-contained spec. Every endpoint, every request/response shape, every file to create, and full literal code for the trickiest parts (auth, proxying, one worked example page) are included. **Do not infer or invent anything not written here** — see Section 0.

---

## Table of Contents

0. [Rules for This Implementation — Read First](#0-rules-for-this-implementation--read-first)
1. [Architecture & Conventions](#1-architecture--conventions)
2. [Auth System — Full Code](#2-auth-system--full-code)
3. [Complete File Checklist](#3-complete-file-checklist)
4. [Reference Implementation — Worked Example](#4-reference-implementation--worked-example)
5. [API Reference — Auth](#5-api-reference--auth)
6. [API Reference — Admin: Manufacturers](#6-api-reference--admin-manufacturers)
7. [API Reference — Admin: Buyers](#7-api-reference--admin-buyers)
8. [API Reference — Admin: Dashboard](#8-api-reference--admin-dashboard)
9. [API Reference — Admin: Verification Queue](#9-api-reference--admin-verification-queue)
10. [API Reference — Admin: Search & Audit](#10-api-reference--admin-search--audit)
11. [API Reference — Seller Portal](#11-api-reference--seller-portal)
12. [UI Components to Build](#12-ui-components-to-build)
13. [Seller Portfolio Field Mapping](#13-seller-portfolio-field-mapping)
14. [Error Handling Convention](#14-error-handling-convention)

---

## 0. Rules for This Implementation — Read First

These rules exist because this spec will be implemented by an AI coding assistant. Follow them literally, even where a "smarter" or "more idiomatic" alternative seems obvious — deviating creates integration bugs against a backend built by a different person from a different spec.

1. **Every API endpoint this frontend calls is listed in Sections 5–11. Do not call any endpoint not listed here.** If a UI need seems to require an endpoint that isn't documented, stop and flag it — do not invent a plausible-looking one.
2. **Do not guess response field names.** Every response shape in this doc is a literal example with real field names. Use exactly those names (e.g. `manufacturer.planStatus`, not `manufacturer.plan_status` or `manufacturer.subscriptionStatus`).
3. **Never call the Express backend URL (`NEXT_PUBLIC_API_URL`) directly from a `'use client'` component.** Client components call same-origin paths (`/api/admin/...`, `/api/seller/...`, `/api/auth/...`) which are Next.js Route Handlers in this repo. Only Server Components and Route Handlers (files with no `'use client'` at the top) may reference `NEXT_PUBLIC_API_URL`.
4. **Never store the auth token in `localStorage`, `sessionStorage`, or a non-httpOnly cookie, and never put it in a query string.** It lives only in the `admin_token` / `seller_token` httpOnly cookies set by the Route Handlers in Section 2.
5. **Use plain CSS with CSS custom properties, matching this repo's existing convention.** Do not introduce Tailwind, styled-components, CSS modules, or any CSS-in-JS library. Do not invent new color hex values — use the tokens defined in Section 2's `admin.css` / `seller-portal.css` starter files, which already extend the real values from `app/globals.css`.
6. **The only new npm dependency to add is `react-hook-form`.** Do not add a UI kit, a data-fetching library (SWR/react-query), a state manager (Redux/Zustand), an HTTP client (axios), or a date library unless this doc explicitly says so. Use the browser's native `Intl.DateTimeFormat` / `Date` for date formatting.
7. **File extension is `.js` / `.jsx`, not `.ts` / `.tsx`.** This project (`web/Xindia`) is JavaScript, not TypeScript — confirmed by its `jsconfig.json`, not `tsconfig.json`.
8. **Components default to `'use client'`** per this repo's existing convention (see `components/landing/*.jsx`, `components/portfolio/*.jsx` — all client components). Exception: `layout.js` files in `app/admin/` and `app/seller-portal/` are Server Components (no `'use client'`) because they read the auth cookie server-side — see Section 4.
9. **Money values from the backend are in INR rupees, not paise.** Format with `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
10. **All list endpoints paginate the same way**: query params `page` (1-based) and `limit`, response includes `total`, `page`, `totalPages`. Build one reusable pagination UI pattern (see Section 4) and reuse it — do not build a different pagination approach per page.
11. **If a response field is `null` or an empty array/string, render an empty state — do not treat it as an error.** E.g. `manufacturer.deactivatedAt: null` means "never deactivated," not "failed to load."

---

## 1. Architecture & Conventions

### Existing patterns in this codebase (verified by reading the actual files)

- **Styling:** plain CSS with CSS custom properties, one scoped `.css` file per major section, imported once in that section's `layout.js`. Example: `app/portfolio.css` (imported only in `app/p/[slug]/layout.js`) defines its own token set (`--p-slate`, `--p-navy`, `--p-blue`, etc.) distinct from the landing page's `app/globals.css` tokens (`--primary`, `--navy`, `--gray-50`...`--gray-900`). **You will do the same**: `app/admin.css` and `app/seller-portal.css`, each with their own prefixed tokens, given to you complete in Section 2.
- **Navigation pattern:** route-folder-per-tab. Each sidebar link is a real Next.js route (its own `page.js` in a subfolder), not client-side tab switching. The exact template to copy is `components/portfolio/PortfolioNav.jsx`:

```js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '', label: 'Overview' },
  { href: '/products', label: 'Products' },
  // ...
];

export default function PortfolioNav({ slug }) {
  const pathname = usePathname();
  const base = `/p/${slug}`;
  return (
    <nav className="portfolio-nav">
      <div className="portfolio-nav-inner">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
          return (
            <Link key={tab.href} href={href} className={`portfolio-nav-link ${isActive ? 'active' : ''}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

`AdminSidebar.jsx` and `SellerSidebar.jsx` follow this exact structure — see full code in Section 4.

- **Icons:** `lucide-react` (already a dependency). Import named icons, e.g. `import { LayoutDashboard, Factory, Users } from 'lucide-react'`.

### New dependency to add

Run this exact command in `web/Xindia/`:

```bash
npm install react-hook-form
```

Nothing else. Do not add `@hookform/resolvers`, `zod`, or `yup` — validation in this feature is simple enough to do with plain `register(name, { required: true, minLength: 80 })` style rules built into `react-hook-form` itself.

---

## 2. Auth System — Full Code

### Design

- Two httpOnly cookies: `admin_token` (8h expiry, admin sessions) and `seller_token` (24h expiry, seller sessions).
- Login forms submit to Next.js Route Handlers, which call the Express backend and set the cookie server-side. The token is **never** sent to client JavaScript.
- A root `middleware.js` redirects to `/login` if the relevant cookie is **absent**. It does not decode or verify the JWT — that is the backend's job on every actual API call. This middleware check is a UX redirect only, not the security boundary.
- Server Components (`page.js`/`layout.js` files with no `'use client'`) read the cookie via `cookies()` from `next/headers` and call the Express backend directly.
- Client Components call same-origin proxy routes (`/api/admin/...`, `/api/seller/...`) which read the cookie server-side and forward the request to Express. Two catch-all proxy files handle **every** admin/seller API call — you do not create one Route Handler file per endpoint.

### File: `web/Xindia/middleware.js` (new, at the Xindia project root — same level as `next.config.js`)

```js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login?tab=admin', request.url));
    }
  }

  if (pathname.startsWith('/seller-portal')) {
    const token = request.cookies.get('seller_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login?tab=seller', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/seller-portal/:path*'],
};
```

### File: `web/Xindia/app/api/auth/admin-login/route.js` (new)

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (data.success && data.token) {
    cookies().set('admin_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours, matches backend token expiry
    });
  }

  return Response.json(data, { status: res.status });
}
```

### File: `web/Xindia/app/api/auth/seller-request-otp/route.js` (new)

```js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/api/seller/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
```

### File: `web/Xindia/app/api/auth/seller-verify-otp/route.js` (new)

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/api/seller/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (data.success && data.token) {
    cookies().set('seller_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
  }

  return Response.json(data, { status: res.status });
}
```

### File: `web/Xindia/app/api/auth/logout/route.js` (new)

```js
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('admin_token');
  cookies().delete('seller_token');
  return Response.json({ success: true });
}
```

### File: `web/Xindia/app/api/admin/[...path]/route.js` (new — catch-all proxy for ALL admin API calls made from Client Components)

This single file handles every `/api/admin/*` request from the browser and forwards it to `${API_URL}/api/v1/admin/*` with the `admin_token` cookie attached as a Bearer token. **Do not create separate Route Handler files per admin endpoint** — this file covers all of them, including ones added later.

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxy(request, { params }) {
  const token = cookies().get('admin_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  const search = request.nextUrl.search; // e.g. "?page=1&limit=20", empty string if none
  const targetUrl = `${API_URL}/api/v1/admin/${path}${search}`;

  const init = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData();
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = await request.text();
    }
  }

  const res = await fetch(targetUrl, init);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
```

**How this maps:** a client fetch to `/api/admin/manufacturers?page=1` forwards to `${API_URL}/api/v1/admin/manufacturers?page=1`. A client fetch to `/api/admin/manufacturers/507f.../status` (PATCH) forwards to `${API_URL}/api/v1/admin/manufacturers/507f.../status`. The path segment after `/api/admin/` is passed through unchanged.

### File: `web/Xindia/app/api/seller/[...path]/route.js` (new — catch-all proxy for ALL seller-portal API calls made from Client Components)

Identical pattern, but reads `seller_token` and forwards to `${API_URL}/api/seller/*` (no `/v1` in this prefix — confirm against Section 11, the seller endpoints do not use `/v1`):

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxy(request, { params }) {
  const token = cookies().get('seller_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/seller/${path}${search}`;

  const init = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData();
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = await request.text();
    }
  }

  const res = await fetch(targetUrl, init);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
```

**Important exception:** the seller product-CRUD endpoints in Section 11 are at `/api/products` (no `/seller` prefix — they're the shared product routes, seller-scoped by the `sellerId` query param / auth token). Those are **not** covered by this `/api/seller/[...path]` proxy. For those specific calls, either (a) add one more small dedicated proxy file `app/api/seller-products/[...path]/route.js` forwarding to `${API_URL}/api/products/${path}` with the `seller_token` cookie, or (b) reuse the same proxy pattern under a distinct route. Use option (a) — create `app/api/seller-products/[...path]/route.js` with the identical code above except `targetUrl` becomes `` `${API_URL}/api/products/${path}${search}` `` (and handle the no-path case for the bare `GET /api/products` list call — when `params.path` is undefined because the base route matches too, ensure this file structure is `app/api/seller-products/route.js` for the no-id case AND `app/api/seller-products/[id]/route.js` for the with-id case, OR simpler: make it `app/api/seller-products/[[...path]]/route.js` — a Next.js **optional** catch-all, which matches both `/api/seller-products` and `/api/seller-products/anything` in one file. Use the optional catch-all (`[[...path]]`, double brackets) so `params.path` can be `undefined` for the bare list/create case; guard with `const path = params.path ? params.path.join('/') : ''`.

### File: `web/Xindia/lib/adminApi.js` (new — for Server Component reads only)

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function adminFetch(path, options = {}) {
  const token = cookies().get('admin_token')?.value;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  });
  return res.json();
}
```

Usage in a Server Component: `const data = await adminFetch('/api/v1/admin/dashboard/summary?range=month');` — note the full backend path (`/api/v1/admin/...`) is passed here, unlike the client-side proxy calls which use the shorter `/api/admin/...` local path.

### File: `web/Xindia/lib/sellerPortalApi.js` (new — for Server Component reads only)

```js
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function sellerFetch(path, options = {}) {
  const token = cookies().get('seller_token')?.value;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  });
  return res.json();
}
```

### Summary — which mechanism to use when

| Where | Mechanism | Example |
|---|---|---|
| Server Component initial page load (read-only) | `lib/adminApi.js` / `lib/sellerPortalApi.js`, full backend path | `adminFetch('/api/v1/admin/manufacturers')` |
| Client Component fetch/mutation (button click, filter change, form submit) | Same-origin proxy path | `fetch('/api/admin/manufacturers/' + id + '/status', { method: 'PATCH', ... })` |
| Login forms | Dedicated auth Route Handlers | `fetch('/api/auth/admin-login', { method: 'POST', ... })` |
| Seller product CRUD from Client Components | `/api/seller-products/...` proxy | `fetch('/api/seller-products?sellerId=' + id)` |

---

## 3. Complete File Checklist

Create these files in this order (later files depend on earlier ones existing). This is the full list — nothing else needs to be created outside of Section 12's component list.

**Auth infrastructure:**
1. `web/Xindia/middleware.js`
2. `web/Xindia/app/api/auth/admin-login/route.js`
3. `web/Xindia/app/api/auth/seller-request-otp/route.js`
4. `web/Xindia/app/api/auth/seller-verify-otp/route.js`
5. `web/Xindia/app/api/auth/logout/route.js`
6. `web/Xindia/app/api/admin/[...path]/route.js`
7. `web/Xindia/app/api/seller/[...path]/route.js`
8. `web/Xindia/app/api/seller-products/[[...path]]/route.js`
9. `web/Xindia/lib/adminApi.js`
10. `web/Xindia/lib/sellerPortalApi.js`

**Login page:**
11. `web/Xindia/app/login/page.js`

**Admin shell:**
12. `web/Xindia/app/admin.css`
13. `web/Xindia/components/admin/AdminSidebar.jsx`
14. `web/Xindia/app/admin/layout.js`

**Admin pages:**
15. `web/Xindia/app/admin/dashboard/page.js`
16. `web/Xindia/app/admin/manufacturers/page.js`
17. `web/Xindia/app/admin/manufacturers/[id]/page.js`
18. `web/Xindia/app/admin/buyers/page.js`
19. `web/Xindia/app/admin/buyers/[id]/page.js`

**Seller portal shell:**
20. `web/Xindia/app/seller-portal.css`
21. `web/Xindia/components/seller-portal/SellerSidebar.jsx`
22. `web/Xindia/app/seller-portal/layout.js`

**Seller portal pages:**
23. `web/Xindia/app/seller-portal/dashboard/page.js`
24. `web/Xindia/app/seller-portal/portfolio/page.js`
25. `web/Xindia/app/seller-portal/products/page.js`

**Shared UI components** (see Section 12 for full list): `components/admin/Badge.jsx`, `components/admin/Toggle.jsx`, `components/admin/Modal.jsx`, `components/admin/StatCard.jsx`, `components/admin/FilterBar.jsx`, `components/admin/ManufacturerCard.jsx`, `components/admin/BuyerCard.jsx`, `components/admin/SearchBar.jsx`, `components/seller-portal/PortfolioEditForm.jsx`, `components/seller-portal/ProductManager.jsx`.

**Environment variable** — confirm `web/Xindia/.env.local` contains:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
(Matches what `lib/api.js` already expects — do not rename this variable.)

---

## 4. Reference Implementation — Worked Example

This section gives complete, literal code for one full vertical slice: the CSS tokens, the sidebar, the layout with auth guard, the Dashboard page (Server Component pattern), and the Manufacturers list page (Client Component pattern) including a card, a badge, and a toggle-with-confirmation. **Every other admin/seller page follows one of these two patterns exactly** — copy the relevant pattern rather than inventing a new structure.

### `web/Xindia/app/admin.css` (new — literal starter file, extend as needed but do not rename existing tokens)

```css
/* ─── Admin Panel design tokens ─────────────────────────────────────────── */
:root {
  --adm-bg: #F8FAFC;
  --adm-surface: #FFFFFF;
  --adm-border: #E2E8F0;
  --adm-text: #0F172A;
  --adm-text-med: #64748B;
  --adm-text-light: #94A3B8;
  --adm-primary: #E8581C;
  --adm-navy: #0F1B2D;
  --adm-green: #10B981;
  --adm-green-bg: #D1FAE5;
  --adm-yellow: #F59E0B;
  --adm-yellow-bg: #FEF3C7;
  --adm-red: #EF4444;
  --adm-red-bg: #FEE2E2;
  --adm-gray-bg: #F1F5F9;
  --adm-radius: 12px;
  --adm-radius-sm: 8px;
  --adm-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --adm-sidebar-width: 240px;
}

.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--adm-bg);
  font-family: var(--font-family, 'Inter', -apple-system, sans-serif);
}

.admin-sidebar {
  width: var(--adm-sidebar-width);
  background: var(--adm-navy);
  color: #fff;
  flex-shrink: 0;
  padding: 24px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.admin-sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--adm-radius-sm);
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 4px;
}
.admin-sidebar-link:hover { background: rgba(255,255,255,0.06); color: #fff; }
.admin-sidebar-link.active { background: var(--adm-primary); color: #fff; }

.admin-main {
  flex: 1;
  padding: 32px;
  overflow-x: auto;
}

.admin-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  box-shadow: var(--adm-shadow);
  padding: 20px;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.admin-badge-green { background: var(--adm-green-bg); color: #047857; }
.admin-badge-yellow { background: var(--adm-yellow-bg); color: #92400E; }
.admin-badge-red { background: var(--adm-red-bg); color: #B91C1C; }
.admin-badge-gray { background: var(--adm-gray-bg); color: var(--adm-text-med); }

.admin-btn {
  padding: 8px 16px;
  border-radius: var(--adm-radius-sm);
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.admin-btn-primary { background: var(--adm-primary); color: #fff; }
.admin-btn-secondary { background: var(--adm-gray-bg); color: var(--adm-text); }
.admin-btn-danger { background: var(--adm-red); color: #fff; }

.admin-input, .admin-select {
  padding: 8px 12px;
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius-sm);
  font-size: 14px;
  background: #fff;
}

.admin-toggle {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  background: var(--adm-border);
  transition: background 0.15s;
}
.admin-toggle.on { background: var(--adm-green); }
.admin-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.15s;
}
.admin-toggle.on .admin-toggle-knob { left: 20px; }

.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.admin-modal {
  background: #fff;
  border-radius: var(--adm-radius);
  padding: 24px;
  width: 420px;
  max-width: 90vw;
}

.admin-stat-card {
  background: var(--adm-surface);
  border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius);
  padding: 20px;
}
.admin-stat-value { font-size: 28px; font-weight: 700; color: var(--adm-text); }
.admin-stat-label { font-size: 13px; color: var(--adm-text-med); margin-top: 4px; }

.admin-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}
```

`app/seller-portal.css` should be a copy of this file with `--adm-` renamed to `--sp-` and class prefixes `admin-` renamed to `seller-` (e.g. `.seller-shell`, `.seller-sidebar`, `.seller-card`). Same structure, same values.

### `web/Xindia/components/admin/Badge.jsx` (new)

```jsx
'use client';

const VARIANT_MAP = {
  active: 'admin-badge-green',
  verified: 'admin-badge-green',
  grace: 'admin-badge-yellow',
  expired: 'admin-badge-red',
  blocked: 'admin-badge-red',
  blacklisted: 'admin-badge-red',
  none: 'admin-badge-gray',
  draft: 'admin-badge-gray',
  published: 'admin-badge-green',
};

export default function Badge({ label, variant }) {
  const cls = VARIANT_MAP[variant] || 'admin-badge-gray';
  return <span className={`admin-badge ${cls}`}>{label}</span>;
}
```

Usage: `<Badge label="Active" variant="active" />`, `<Badge label="Grace Period" variant="grace" />`.

### `web/Xindia/components/admin/Toggle.jsx` (new — purely presentational, no fetch logic inside)

```jsx
'use client';

export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`admin-toggle ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="admin-toggle-knob" />
    </button>
  );
}
```

### `web/Xindia/components/admin/Modal.jsx` (new — purely presentational shell)

```jsx
'use client';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
```

### `web/Xindia/components/admin/AdminSidebar.jsx` (new — copy of PortfolioNav.jsx pattern, vertical instead of horizontal)

```jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Factory, Users, LogOut } from 'lucide-react';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/manufacturers', label: 'Manufacturers', icon: Factory },
  { href: '/admin/buyers', label: 'Buyers', icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login?tab=admin';
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24, padding: '0 12px' }}>Xindia Admin</div>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`admin-sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="admin-sidebar-link"
        style={{ width: '100%', background: 'none', border: 'none', marginTop: 24, cursor: 'pointer' }}
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
```

### `web/Xindia/app/admin/layout.js` (new — Server Component, NO `'use client'`)

```js
import { cookies } from 'next/headers';
import '../admin.css';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  // middleware.js already redirects unauthenticated requests before this
  // component renders — this file does not need to re-check the cookie.
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
```

Confirmed: `web/Xindia/jsconfig.json` already defines `"@/*": ["./*"]`, so `@/components/...` and `@/lib/...` imports work as-is throughout this codebase — use that alias form everywhere in the code below (not relative `../../` imports).

### `web/Xindia/app/admin/dashboard/page.js` (new — Server Component read pattern)

```js
import { adminFetch } from '@/lib/adminApi';
import StatCard from '@/components/admin/StatCard';

export default async function AdminDashboardPage() {
  const summary = await adminFetch('/api/v1/admin/dashboard/summary?range=month');
  const revenue = await adminFetch('/api/v1/admin/dashboard/revenue?range=month');
  const moderation = await adminFetch('/api/v1/admin/dashboard/moderation-count');

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div className="admin-grid">
        <StatCard label="New Buyers (Month)" value={summary.newBuyers} />
        <StatCard label="New Sellers (Month)" value={summary.newSellers} />
        <StatCard label="Total Inquiries (Month)" value={summary.totalInquiries} />
        <StatCard label="Active Sellers" value={summary.activeSellers} />
        <StatCard label="Expired Sellers" value={summary.expiredSellers} />
        <StatCard
          label="Plan Revenue (Month)"
          value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue.planRevenue)}
        />
        <StatCard
          label="Credit Revenue (Month)"
          value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue.creditRevenue)}
        />
        <StatCard label="Open Moderation Cases" value={moderation.count} />
      </div>
      {/* Verification queue table goes here — fetch from /api/v1/admin/verification/queue via adminFetch, same pattern as above. See Section 9 for the response shape. */}
    </div>
  );
}
```

### `web/Xindia/components/admin/StatCard.jsx` (new)

```jsx
export default function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}
```

### `web/Xindia/components/admin/ManufacturerCard.jsx` (new)

```jsx
'use client';

import Link from 'next/link';
import Badge from './Badge';
import Toggle from './Toggle';

export default function ManufacturerCard({ manufacturer, onToggleActive }) {
  const planVariant = manufacturer.planStatus === 'active' ? 'active'
    : manufacturer.planStatus === 'grace' ? 'grace'
    : manufacturer.planStatus === 'expired' ? 'expired'
    : 'none';

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href={`/admin/manufacturers/${manufacturer._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ margin: 0 }}>{manufacturer.name}</h3>
        </Link>
        <Toggle checked={manufacturer.isActive} onChange={(next) => onToggleActive(manufacturer._id, next)} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <Badge label={manufacturer.planStatus} variant={planVariant} />
        {manufacturer.verified && <Badge label="Verified" variant="verified" />}
        <Badge label={manufacturer.portfolioStatus} variant={manufacturer.portfolioStatus} />
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--adm-text-med)' }}>
        {manufacturer.productCount} products &middot; {manufacturer.rating?.toFixed(1) || '0.0'} ★ ({manufacturer.reviewCount})
      </div>
      <div style={{ fontSize: 13, color: 'var(--adm-text-light)', marginTop: 4 }}>{manufacturer.address}</div>
    </div>
  );
}
```

### `web/Xindia/app/admin/manufacturers/page.js` (new — Client Component, interactive filters + proxy fetch + toggle-with-confirmation)

```jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import ManufacturerCard from '@/components/admin/ManufacturerCard';
import Modal from '@/components/admin/Modal';

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ planStatus: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [pendingDeactivate, setPendingDeactivate] = useState(null); // manufacturer id awaiting confirmation
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.planStatus) params.set('planStatus', filters.planStatus);
    if (filters.search) params.set('search', filters.search);

    const res = await fetch(`/api/admin/manufacturers?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setManufacturers(data.manufacturers);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = (id, next) => {
    if (next === false) {
      // Deactivating requires a reason — open confirmation modal instead of firing immediately.
      setPendingDeactivate(id);
      return;
    }
    // Reactivating needs no reason — fire immediately.
    applyStatusChange(id, true, '');
  };

  const applyStatusChange = async (id, isActive, statusReason) => {
    await fetch(`/api/admin/manufacturers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive, reason: statusReason }),
    });
    setPendingDeactivate(null);
    setReason('');
    load();
  };

  return (
    <div>
      <h1>Manufacturers</h1>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <input
          className="admin-input"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value })); }}
        />
        <select
          className="admin-select"
          value={filters.planStatus}
          onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, planStatus: e.target.value })); }}
        >
          <option value="">All plan statuses</option>
          <option value="active">Active</option>
          <option value="grace">Grace</option>
          <option value="expired">Expired</option>
          <option value="none">None</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-grid">
          {manufacturers.map((m) => (
            <ManufacturerCard key={m._id} manufacturer={m} onToggleActive={handleToggleActive} />
          ))}
        </div>
      )}

      <div className="admin-pagination">
        <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      <Modal open={!!pendingDeactivate} onClose={() => setPendingDeactivate(null)} title="Deactivate Seller">
        <p style={{ marginBottom: 12 }}>This will hide all their products and business opportunities from the public site until reactivated.</p>
        <textarea
          className="admin-input"
          style={{ width: '100%', minHeight: 80 }}
          placeholder="Reason (e.g. non-payment after grace period)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-secondary" onClick={() => setPendingDeactivate(null)}>Cancel</button>
          <button className="admin-btn admin-btn-danger" onClick={() => applyStatusChange(pendingDeactivate, false, reason)}>Deactivate</button>
        </div>
      </Modal>
    </div>
  );
}
```

**This is the template for every other list page** (`app/admin/buyers/page.js` follows the identical structure: state for list/page/filters/loading, a `useCallback` load function fetching `/api/admin/buyers?...`, a filter bar, a card grid using `BuyerCard` instead of `ManufacturerCard`, and pagination). Detail pages (`app/admin/manufacturers/[id]/page.js`, `app/admin/buyers/[id]/page.js`) can be Server Components using `adminFetch` since they're read-heavy with occasional mutations — mutations on those pages still go through the `/api/admin/...` client proxy inside small `'use client'` sub-components (e.g. a `VerifiedToggle` client component embedded in an otherwise-server-rendered detail page), matching the pattern shown above.

---

## 5. API Reference — Auth

### Admin Login

```
POST /api/v1/admin/login
```

**Request body:**
```json
{
  "username": "admin_user",
  "password": "secret123"
}
```

**Success response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "admin": {
    "id": "6651abc123...",
    "username": "admin_user",
    "email": "admin@xindia.com",
    "role": "SUPER_ADMIN",
    "permissions": ["manage_sellers", "manage_buyers"]
  }
}
```

**Error response (401):**
```json
{
  "success": false,
  "message": "Invalid administrative credentials"
}
```

Token expiry: **8 hours**. Admin roles: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `OPERATIONS_ADMIN`, `SUPPORT_AGENT`, `MODERATOR`, `COMPLIANCE_OFFICER`, `FINANCE_ADMIN`, `DEVOPS_ENGINEER`, `SECURITY_ADMIN`, `AUDITOR`.

---

### Seller OTP Login (email only, v1 — no phone OTP)

**Step 1 — Request OTP:**

```
POST /api/seller/auth/request-otp
```

**Request body:**
```json
{
  "email": "seller@company.com"
}
```

**Response (always 200 — does not leak whether email exists):**
```json
{
  "success": true
}
```

**Step 2 — Verify OTP:**

```
POST /api/seller/auth/verify-otp
```

**Request body:**
```json
{
  "email": "seller@company.com",
  "otp": "482917"
}
```

**Success response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "6651def456...",
    "firstName": "Rajesh",
    "lastName": "Kumar",
    "email": "seller@company.com",
    "companyName": "Kumar Textiles",
    "role": "seller"
  }
}
```

**Error responses:**
- 400: `{ "success": false, "message": "Invalid or expired code" }`
- 403: `{ "success": false, "code": "BLOCKED", "message": "Account temporarily blocked.", "blockedUntil": "2026-09-01T00:00:00Z" }`
- 403: `{ "success": false, "code": "BLACKLISTED", "message": "Account permanently restricted." }`

### `web/Xindia/app/login/page.js` (new — full code)

```jsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'seller' ? 'seller' : 'admin');

  // Admin form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Seller form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sellerError, setSellerError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/admin/dashboard');
    } else {
      setAdminError(data.message || 'Login failed');
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSellerError('');
    await fetch('/api/auth/seller-request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSellerError('');
    const res = await fetch('/api/auth/seller-verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/seller-portal/dashboard');
    } else {
      setSellerError(data.message || 'Invalid code');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('admin')} style={{ fontWeight: tab === 'admin' ? 700 : 400 }}>Admin</button>
        <button onClick={() => setTab('seller')} style={{ fontWeight: tab === 'seller' ? 700 : 400 }}>Seller</button>
      </div>

      {tab === 'admin' && (
        <form onSubmit={handleAdminLogin}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          {adminError && <p style={{ color: 'red' }}>{adminError}</p>}
          <button type="submit">Log In</button>
        </form>
      )}

      {tab === 'seller' && !otpSent && (
        <form onSubmit={handleRequestOtp}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          <button type="submit">Send Code</button>
        </form>
      )}

      {tab === 'seller' && otpSent && (
        <form onSubmit={handleVerifyOtp}>
          <p>Enter the code sent to {email}</p>
          <input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          {sellerError && <p style={{ color: 'red' }}>{sellerError}</p>}
          <button type="submit">Verify & Log In</button>
        </form>
      )}
    </div>
  );
}
```

This inline-styled version is intentionally minimal — restyle using `admin.css`/global tokens as desired, but keep the exact same state variables, handler names, and fetch calls (they map directly to the Route Handlers in Section 2).

---

## 6. API Reference — Admin: Manufacturers

All admin endpoints require header: `Authorization: Bearer <admin_token>` — but from the frontend, you never set this header manually; the proxy in Section 2 does it. When calling from a Client Component, use the shorter path shown in each "Client fetch" line below.

All list endpoints follow the same pagination convention:
- **Query params:** `page` (default 1), `limit` (default 20, max 50)
- **Response shape:** `{ success: true, [items], total, page, totalPages }`

### List Manufacturers

Backend path: `GET /api/v1/admin/manufacturers?category=&planStatus=&verified=&isActive=&stateId=&cityId=&search=&page=1&limit=20`
Client fetch: `fetch('/api/admin/manufacturers?' + params)`

**Query params (all optional):**
| Param | Type | Values / Example |
|---|---|---|
| `category` | string | Category ObjectId or slug |
| `planStatus` | string | `none`, `active`, `grace`, `expired` |
| `verified` | string | `true` or `false` |
| `isActive` | string | `true` or `false` (omit to show all) |
| `stateId` | string | State ObjectId |
| `cityId` | string | City ObjectId |
| `search` | string | Searches manufacturer name only |
| `page` | number | Page number |
| `limit` | number | Items per page (max 50) |

**Response (200):**
```json
{
  "success": true,
  "manufacturers": [
    {
      "_id": "6651abc123...",
      "name": "Kumar Textiles Pvt Ltd",
      "slug": "kumar-textiles",
      "logo": "https://res.cloudinary.com/.../logo.jpg",
      "planStatus": "active",
      "planKey": "growth",
      "productCount": 12,
      "rating": 4.2,
      "reviewCount": 8,
      "portfolioStatus": "published",
      "verified": true,
      "isActive": true,
      "categories": [
        { "_id": "cat1", "name": "Textiles", "slug": "textiles" }
      ],
      "address": "Industrial Area Phase 2, Ludhiana, Punjab",
      "lastActiveAt": "2026-08-04T14:30:00Z",
      "createdAt": "2025-03-15T10:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "totalPages": 8
}
```

Full worked implementation of this page (filters, card grid, pagination, deactivate-with-reason modal) is in Section 4 — copy it exactly.

---

### Manufacturer Detail

Backend path: `GET /api/v1/admin/manufacturers/:id`
Client fetch (if built as Client Component): `fetch('/api/admin/manufacturers/' + id)`
Server Component: `adminFetch('/api/v1/admin/manufacturers/' + id)`

**Response (200):**
```json
{
  "success": true,
  "manufacturer": {
    "_id": "6651abc123...",
    "name": "Kumar Textiles Pvt Ltd",
    "slug": "kumar-textiles",
    "logo": "...",
    "coverImage": "...",
    "description": "...",
    "portfolioAbout": "Leading manufacturer of premium cotton textiles since 1998...",
    "verified": true,
    "isActive": true,
    "planKey": "growth",
    "planStatus": "active",
    "planExpiresAt": "2026-12-15T00:00:00Z",
    "graceEndsAt": "2026-12-22T00:00:00Z",
    "portfolioStatus": "published",
    "productCount": 12,
    "rating": 4.2,
    "reviewCount": 8,
    "categories": [{ "_id": "cat1", "name": "Textiles", "slug": "textiles" }],
    "address": "Industrial Area Phase 2, Ludhiana, Punjab",
    "contact": { "phone": "+919876543210", "email": "info@kumartextiles.com", "whatsapp": "+919876543210" },
    "buyerContactPhone": "+919876543211",
    "certifications": ["ISO 9001:2015", "OEKO-TEX"],
    "factorySize": "25,000+ Sq. Ft.",
    "machinesCount": 15,
    "employeesCount": 250,
    "monthlyCapacity": "50,000 units",
    "exportPercentage": "45%",
    "yearOfEstablishment": 1998,
    "businessType": "Manufacturer, Exporter",
    "legalStatus": "Private Limited",
    "adminNotes": [
      { "text": "Verified in-person on 2026-06-15. Factory in excellent condition.", "adminId": "...", "createdAt": "2026-06-15T12:00:00Z" }
    ],
    "deactivatedAt": null,
    "deactivationReason": ""
  },
  "products": [
    {
      "_id": "prod1",
      "name": "Premium Cotton Fabric",
      "isActive": true,
      "status": "active",
      "createdAt": "2026-04-01T00:00:00Z",
      "category": "Textiles"
    }
  ],
  "stats": {
    "inquiriesReceived": 45,
    "conversationCount": 32,
    "moderationCaseCount": 0,
    "profileCompleteness": {
      "about": true,
      "factoryPhotos": true,
      "logo": true,
      "buyerContactPhone": true,
      "address": true
    },
    "accountAge": "2025-03-15T10:00:00Z"
  },
  "planHistory": [
    { "planKey": "basic", "billingCycle": "monthly", "amount": 999, "startedAt": "2025-06-01T00:00:00Z", "expiresAt": "2025-07-01T00:00:00Z" },
    { "planKey": "growth", "billingCycle": "yearly", "amount": 9999, "startedAt": "2025-07-01T00:00:00Z", "expiresAt": "2026-07-01T00:00:00Z" }
  ],
  "creditHistory": [
    { "type": "daily_grant", "amount": 3, "createdAt": "2026-08-05T03:00:00Z", "meta": {} },
    { "type": "unlock_normal", "amount": -1, "createdAt": "2026-08-05T10:30:00Z", "meta": { "requirementId": "req123" } },
    { "type": "purchase_stub", "amount": 10, "createdAt": "2026-07-20T00:00:00Z", "meta": { "package": "bundle10", "priceInr": 399 } }
  ],
  "latestVerification": {
    "_id": "vr1",
    "status": "verified",
    "assignedVerifier": { "name": "Field Agent Sharma", "assignedAt": "2026-06-10T00:00:00Z" },
    "evidence": [{ "photoUrl": "https://...", "uploadedAt": "2026-06-15T00:00:00Z" }],
    "verifierNotes": "Factory verified. All machinery operational.",
    "decidedAt": "2026-06-15T12:00:00Z"
  },
  "gstVerified": true
}
```

**Detail UI sections (build as a single page with these regions, not separate routes):**
1. **Profile overview** — name, logo, cover, plan badge, verified badge, active toggle, all contact info, business details
2. **Products list** — with per-product visibility toggle (calls `PATCH /api/admin/manufacturers/:id/products/:productId/visibility`)
3. **Plan & Credits** — `planHistory` as a timeline list, `creditHistory` as a table
4. **Verification** — `latestVerification` status, evidence photo thumbnails, verifier notes
5. **Admin notes** — list of `adminNotes` + a small add-note form (`POST /api/admin/manufacturers/:id/notes`)
6. **Stats sidebar** — `stats.inquiriesReceived`, `stats.conversationCount`, `stats.moderationCaseCount`, `stats.profileCompleteness` (render as 5 checkmarks), `stats.accountAge` (format as "Member since ...")

---

### Toggle Manufacturer Active/Inactive

Backend path: `PATCH /api/v1/admin/manufacturers/:id/status`
Client fetch: `fetch('/api/admin/manufacturers/' + id + '/status', { method: 'PATCH', ... })`

**Request body:**
```json
{
  "isActive": false,
  "reason": "Non-payment after grace period expired"
}
```

**Response (200):**
```json
{
  "success": true,
  "manufacturer": { "_id": "...", "isActive": false, "deactivatedAt": "2026-08-05T...", "deactivationReason": "Non-payment..." }
}
```

**UI:** confirmation modal before deactivating, with a required reason field (see Section 4's full code — deactivating does NOT fire immediately, reactivating does).

---

### Toggle Verified Badge

Backend path: `PATCH /api/v1/admin/manufacturers/:id/verified`
Client fetch: `fetch('/api/admin/manufacturers/' + id + '/verified', { method: 'PATCH', ... })`

**Request body:**
```json
{ "verified": true }
```

**Response (200):**
```json
{ "success": true, "manufacturer": { "_id": "...", "verified": true } }
```

---

### Toggle Product Visibility (admin)

Backend path: `PATCH /api/v1/admin/manufacturers/:id/products/:productId/visibility`
Client fetch: `fetch('/api/admin/manufacturers/' + id + '/products/' + productId + '/visibility', { method: 'PATCH', ... })`

**Request body:**
```json
{ "isActive": false }
```

**Response (200):**
```json
{ "success": true, "product": { "_id": "...", "isActive": false } }
```

**Required role:** SUPER_ADMIN, PLATFORM_ADMIN, or OPERATIONS_ADMIN — other admin roles get a 403 with `{ success: false, message: "Access denied. Requires role: ..." }`. If this happens, show the message as a toast/alert; do not treat it as a network failure.

---

### Add Admin Note

Backend path: `POST /api/v1/admin/manufacturers/:id/notes`
Client fetch: `fetch('/api/admin/manufacturers/' + id + '/notes', { method: 'POST', ... })`

**Request body:**
```json
{ "text": "Spoke with owner about renewal. Will renew by end of week." }
```

**Response (201):**
```json
{ "success": true, "note": { "text": "...", "adminId": "...", "createdAt": "2026-08-05T..." } }
```

---

### Bulk Toggle Status

Backend path: `PATCH /api/v1/admin/manufacturers/bulk-status`
Client fetch: `fetch('/api/admin/manufacturers/bulk-status', { method: 'PATCH', ... })`

**Request body:**
```json
{ "ids": ["id1", "id2", "id3"], "isActive": false, "reason": "Batch deactivation for expired plans" }
```

**Response (200):**
```json
{ "success": true, "updatedCount": 3 }
```

This is a v1.1 nice-to-have (multi-select checkboxes on the list page) — build the single-item toggle first; add bulk selection only after the base list page works.

---

## 7. API Reference — Admin: Buyers

### List Buyers

Backend path: `GET /api/v1/admin/buyers?joinedFrom=&joinedTo=&active=&search=&page=1&limit=20`
Client fetch: `fetch('/api/admin/buyers?' + params)`

**Query params (all optional):**
| Param | Type | Values / Example |
|---|---|---|
| `joinedFrom` | string | ISO date, e.g. `2026-01-01` |
| `joinedTo` | string | ISO date, e.g. `2026-08-05` |
| `active` | string | `true` (active in last 30 days) or `false` (inactive/passive) |
| `search` | string | Searches name, email, phone |
| `page` | number | Page number |
| `limit` | number | Items per page (max 50) |

**Response (200):**
```json
{
  "success": true,
  "buyers": [
    {
      "_id": "buyer1",
      "firstName": "Amit",
      "lastName": "Sharma",
      "email": "amit@company.com",
      "phone": "+919876000000",
      "location": "Mumbai, Maharashtra",
      "createdAt": "2026-02-10T00:00:00Z",
      "lastActiveAt": "2026-08-04T18:00:00Z",
      "isBlacklisted": false,
      "blockedUntil": null,
      "inquiryCount": 12,
      "conversationCount": 8
    }
  ],
  "total": 340,
  "page": 1,
  "totalPages": 17
}
```

Build `app/admin/buyers/page.js` and `components/admin/BuyerCard.jsx` using the exact same structure as the Manufacturers list in Section 4 (state, `useCallback` load function, filter bar, card grid, pagination) — just different fields and a "Block" button instead of a toggle.

**BuyerCard should show:** name, email, phone, location, date joined, last active, inquiry count, conversation count, `isBlacklisted`/`blockedUntil` badges (red "Blacklisted" badge if `isBlacklisted === true`; yellow "Blocked until {date}" badge if `blockedUntil` is a future date; nothing if both are null/past), and a "Block" button that opens a modal (see below).

---

### Buyer Detail

Backend path: `GET /api/v1/admin/buyers/:id`
Server Component: `adminFetch('/api/v1/admin/buyers/' + id)`

**Response (200):**
```json
{
  "success": true,
  "buyer": {
    "_id": "buyer1",
    "firstName": "Amit",
    "lastName": "Sharma",
    "email": "amit@company.com",
    "phone": "+919876000000",
    "location": "Mumbai, Maharashtra",
    "createdAt": "2026-02-10T00:00:00Z",
    "lastActiveAt": "2026-08-04T18:00:00Z",
    "isBlacklisted": false,
    "blockedUntil": null,
    "blacklistReason": ""
  },
  "inquiries": [
    {
      "_id": "wp1",
      "name": "Need 10,000 cotton shirts",
      "description": "Looking for a manufacturer who can deliver...",
      "budget": "5-10 Lakh",
      "location": "Mumbai",
      "categoryId": "textiles",
      "createdAt": "2026-07-20T00:00:00Z",
      "boostTier": "none"
    }
  ],
  "categoriesOfInterest": ["textiles", "packaging", "electronics"],
  "conversationCount": 8
}
```

Note: `budget` is a free-text string (e.g. `"5-10 Lakh"`), not a number — display it verbatim, do not attempt to parse or sum it.

---

### Block Buyer

Backend path: `PATCH /api/v1/admin/buyers/:id/block`
Client fetch: `fetch('/api/admin/buyers/' + id + '/block', { method: 'PATCH', ... })`

**Request body — temporary block:**
```json
{ "mode": "temporary", "days": 30, "reason": "Spam inquiries reported by multiple sellers" }
```

**Request body — permanent blacklist:**
```json
{ "mode": "blacklist", "reason": "Fraudulent activity confirmed" }
```

**Response (200):**
```json
{ "success": true, "buyer": { "_id": "...", "blockedUntil": "2026-09-04T...", "isBlacklisted": false } }
```

**UI:** clicking "Block" opens a modal with exactly these controls (build it as a variant of the `Modal.jsx` pattern from Section 4):
- Two radio buttons: "Block temporarily" / "Blacklist permanently"
- If "temporary" is selected: a number input for `days` (default 30)
- A required `reason` text input
- Confirm button — disabled until `reason` is non-empty

---

### Unblock Buyer

Backend path: `PATCH /api/v1/admin/buyers/:id/unblock`
Client fetch: `fetch('/api/admin/buyers/' + id + '/unblock', { method: 'PATCH' })`

**No request body.**

**Response (200):**
```json
{ "success": true, "buyer": { "_id": "...", "blockedUntil": null, "isBlacklisted": false } }
```

**Note:** un-blacklisting requires SUPER_ADMIN or COMPLIANCE_OFFICER role — other roles get 403. Show the returned `message` if that happens.

---

## 8. API Reference — Admin: Dashboard

### Summary Stats

Backend path: `GET /api/v1/admin/dashboard/summary?range=week|month|year`

**Response (200):**
```json
{ "success": true, "newBuyers": 42, "newSellers": 8, "totalInquiries": 156, "activeSellers": 35, "expiredSellers": 12 }
```

**UI:** stat cards at the top of the dashboard (see Section 4's full `AdminDashboardPage` code). Add a range selector (week/month/year buttons or a dropdown) that re-fetches — this requires converting the Dashboard page's range-dependent cards into a small Client Component if you want it to update without a full page reload; the simplest correct approach is to make just the stat-card row a `'use client'` sub-component that holds `range` state and re-fetches via `/api/admin/dashboard/summary?range=...` and `/api/admin/dashboard/revenue?range=...` on change, while the rest of the Dashboard page (verification queue, moderation count) stays server-rendered.

---

### Revenue

Backend path: `GET /api/v1/admin/dashboard/revenue?range=week|month|year`

**Response (200):**
```json
{ "success": true, "planRevenue": 149850, "creditRevenue": 23940 }
```

Both values are **INR rupees** (not paise). Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` as shown in Section 4.

---

### Seller Funnel

Backend path: `GET /api/v1/admin/dashboard/funnel`

**Response (200):**
```json
{ "success": true, "signedUp": 200, "selectedPlan": 85, "publishedPortfolio": 62, "createdProduct": 48, "receivedInquiry": 35 }
```

**UI:** a simple horizontal bar list is sufficient — one row per stage, bar width proportional to `value / signedUp`. Do not add a charting library for this; five `<div>` bars with inline `width: ${pct}%` styling is enough.

---

### Top Sellers

Backend path: `GET /api/v1/admin/dashboard/top-sellers?metric=inquiries|rating|products&limit=10`

**Response (200):**
```json
{ "success": true, "sellers": [{ "_id": "...", "name": "Kumar Textiles", "logo": "...", "rating": 4.8, "productCount": 25, "inquiriesReceived": 120 }] }
```

**UI:** a simple table with a metric-select dropdown that re-fetches.

---

### Moderation Count

Backend path: `GET /api/v1/admin/dashboard/moderation-count`

**Response (200):**
```json
{ "success": true, "count": 3 }
```

Shown as a single stat card, already included in Section 4's example.

---

## 9. API Reference — Admin: Verification Queue

Shown on the Dashboard page, below the analytics cards.

### List Verification Queue

Backend path: `GET /api/v1/admin/verification/queue?status=pending|accepted|scheduled&cityId=&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "vr1",
      "status": "pending",
      "userId": {
        "_id": "user1",
        "firstName": "Rajesh",
        "lastName": "Kumar",
        "email": "seller@company.com",
        "phone": "+919876543210",
        "location": "Ludhiana, Punjab"
      },
      "manufacturerId": {
        "_id": "mfr1",
        "name": "Kumar Textiles",
        "slug": "kumar-textiles",
        "address": "Industrial Area Phase 2, Ludhiana"
      },
      "requestedLocation": { "address": "Industrial Area Phase 2, Ludhiana, Punjab" },
      "assignedVerifier": null,
      "scheduledVisit": null,
      "createdAt": "2026-08-01T00:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 1
}
```

Note: `userId` and `manufacturerId` are **populated objects** here, not plain ID strings — this endpoint's response shape differs from most others in that respect. Access `request.userId.firstName`, not a separate lookup.

**UI:** a table/list with one row per request: seller name (`userId.firstName + ' ' + userId.lastName`), company (`manufacturerId.name`), location, requested date (`createdAt`), status badge. Each `status: 'pending'` row gets an "Accept" button; each `status: 'accepted'` or `'scheduled'` row gets a "Record Decision" button.

---

### Accept Verification Request

Backend path: `POST /api/v1/admin/verification/:id/accept`
Client fetch: `fetch('/api/admin/verification/' + id + '/accept', { method: 'POST', ... })`

**Request body:**
```json
{ "verifierName": "Field Agent Sharma", "assignedAdminId": "admin123" }
```

`assignedAdminId` is optional — omit it entirely (don't send `null`) to default to the current logged-in admin.

**Response (200):**
```json
{ "success": true, "request": { "_id": "vr1", "status": "accepted", "assignedVerifier": { "name": "Field Agent Sharma", "assignedAt": "..." } } }
```

**UI:** small modal/inline form with one text input for `verifierName`.

---

### Record Verification Decision

Backend path: `POST /api/v1/admin/verification/:id/decision`
Client fetch: `fetch('/api/admin/verification/' + id + '/decision', { method: 'POST', ... })`

**Request body:**
```json
{
  "decision": "verified",
  "verifierNotes": "Factory verified. All machinery operational. Clean premises.",
  "evidencePhotos": ["https://res.cloudinary.com/.../photo1.jpg", "https://res.cloudinary.com/.../photo2.jpg"]
}
```

`decision` must be exactly `"verified"` or `"rejected"` (lowercase strings, not booleans). `evidencePhotos` is an array of already-hosted URLs — this endpoint does not accept file uploads directly; if photo upload UI is needed, that is out of scope for v1 (photos would need to be uploaded elsewhere first — flag this to the backend dev if the UI requires it, do not invent an upload endpoint).

**Response (200):**
```json
{ "success": true, "request": { "_id": "vr1", "status": "verified", "decidedAt": "...", "evidence": [...] } }
```

**UI:** modal with a radio (Verified/Rejected) and a notes textarea. On success, refresh the verification queue list.

---

## 10. API Reference — Admin: Search & Audit

### Global Search

Backend path: `GET /api/v1/admin/search?q=kumar`
Client fetch: `fetch('/api/admin/search?q=' + encodeURIComponent(query))`

**Response (200):**
```json
{
  "success": true,
  "manufacturers": [{ "_id": "mfr1", "name": "Kumar Textiles", "slug": "kumar-textiles", "logo": "...", "planStatus": "active", "verified": true, "isActive": true }],
  "buyers": [{ "_id": "buyer1", "firstName": "Amit", "lastName": "Kumar", "email": "amit.kumar@...", "phone": "+91...", "location": "Mumbai" }]
}
```

**UI:** search input in `AdminSidebar.jsx` or a top header bar. Debounce input by 300ms before firing the fetch (use a `setTimeout`/`clearTimeout` pair in a `useEffect` — do not add a debounce library). Show results in a dropdown with two labeled sections ("Manufacturers", "Buyers"); clicking a result navigates to `/admin/manufacturers/{id}` or `/admin/buyers/{id}`.

---

### Admin Audit Logs

Backend path: `GET /api/v1/admin/audit/logs?page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "_id": "log1",
      "adminId": "admin1",
      "adminUsername": "admin_user",
      "action": "MANUFACTURER_DEACTIVATED",
      "resource": "MANUFACTURER",
      "targetId": "mfr1",
      "changes": { "isActive": false, "reason": "Non-payment" },
      "ipAddress": "203.0.113.42",
      "createdAt": "2026-08-05T10:30:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "totalPages": 25
}
```

`changes` is a free-form object — its shape varies per `action` type. Render it with `JSON.stringify(log.changes, null, 2)` in a `<pre>` tag rather than trying to build a custom renderer per action type.

**UI:** this is a v1.1 nice-to-have. Build it as a simple table on its own page or a collapsible panel on the Dashboard — not required for the core admin workflows (manufacturer/buyer management) to function.

---

## 11. API Reference — Seller Portal

All seller endpoints require header: `Authorization: Bearer <seller_token>` — handled automatically by the proxy in Section 2. Backend paths below do **not** include `/v1` — this is intentional, the seller routes are mounted differently from the admin routes on the backend.

### Seller Dashboard Stats

Backend path: `GET /api/seller/dashboard/stats`
Client fetch: `fetch('/api/seller/dashboard/stats')`
Server Component: `sellerFetch('/api/seller/dashboard/stats')`

**Response (200):**
```json
{
  "success": true,
  "portfolioStatus": "published",
  "planKey": "growth",
  "planBillingCycle": "yearly",
  "planStatus": "active",
  "planExpiresAt": "2026-12-15T00:00:00Z",
  "graceEndsAt": "2026-12-22T00:00:00Z",
  "mandatoryFieldsComplete": { "about": true, "factoryPhotos": true, "logo": true, "buyerContactPhone": true, "address": true },
  "completedCount": 5,
  "totalRequired": 5,
  "productCount": 12,
  "totalInquiries": 45,
  "conversationCount": 32,
  "rating": 4.2,
  "reviewCount": 8,
  "creditsBalance": 5,
  "verified": true
}
```

**UI:** stat cards (reuse `StatCard.jsx` from the admin panel — it's a generic presentational component, import it from `components/admin/StatCard.jsx` or duplicate it into `components/seller-portal/` if you prefer folder isolation, either is fine) showing: plan status badge + expiry date + a "Renew Plan" button if `planStatus !== 'active'`, product count, total inquiries, conversation count, rating, credits balance, verified badge, and a progress bar for `completedCount / totalRequired`.

---

### Get Full Portfolio (for editor pre-fill)

Backend path: `GET /api/seller/portfolio`
Server Component: `sellerFetch('/api/seller/portfolio')`

**Response (200):**
```json
{
  "success": true,
  "manufacturer": {
    "_id": "mfr1",
    "portfolioAbout": "Leading manufacturer...",
    "buyerContactPhone": "+919876543211",
    "address": "Industrial Area Phase 2, Ludhiana",
    "logo": "https://...",
    "coverImage": "https://...",
    "manufacturingPlants": ["https://photo1.jpg", "https://photo2.jpg"],
    "factoryVideo": "https://...",
    "categories": [{ "_id": "cat1", "name": "Textiles", "slug": "textiles" }],
    "certifications": ["ISO 9001:2015"],
    "factorySize": "25,000+ Sq. Ft.",
    "machinesCount": 15,
    "employeesCount": 250,
    "monthlyCapacity": "50,000 units",
    "exportPercentage": "45%",
    "yearOfEstablishment": 1998,
    "businessType": "Manufacturer, Exporter",
    "legalStatus": "Private Limited",
    "portfolioStatus": "published",
    "slug": "kumar-textiles"
  }
}
```

**Important field-name note:** the photos array is called `manufacturingPlants` in this response, NOT `factoryPhotos` — but the `PATCH /api/seller/portfolio` request below uses the form field name `factoryPhotos` to **upload new** photos. These are two different names for related-but-distinct things: `manufacturingPlants` is the current stored list of photo URLs (read), `factoryPhotos` is the multipart field for new file uploads (write). Do not conflate them.

---

### Update Portfolio

Backend path: `PATCH /api/seller/portfolio`
Client fetch: `fetch('/api/seller/portfolio', { method: 'PATCH', body: formData })` — **do not set a `Content-Type` header manually when sending FormData; let the browser set the multipart boundary automatically.**

**Form fields (all optional — send only fields the user actually changed):**

| Field | Type | Notes |
|---|---|---|
| `portfolioAbout` | string | Min 80 chars if portfolio is currently published |
| `buyerContactPhone` | string | Cannot be blank if published |
| `address` | string | Cannot be blank if published |
| `logo` | file | Single image |
| `coverImage` | file | Single image |
| `factoryPhotos` | file[] (append each file under the same key `factoryPhotos`) | Up to 20 total. Min 5 required if published |
| `removeFactoryPhotos` | JSON string | Array of photo URLs to remove: `'["url1","url2"]'` — this must be a JSON-stringified array, sent as a plain form field, not a file |
| `factoryVideo` | string | A URL, not a file — upload the video first via the endpoint below, then send its returned URL here |
| `categories` | JSON string | Array of Category ObjectIds: `'["cat1","cat2"]'` |
| `certifications` | JSON string | Array of strings: `'["ISO 9001:2015","OEKO-TEX"]'` |
| `factorySize` | string | |
| `machinesCount` | number | Sent as a form field, will be a string in FormData — backend coerces with `Number()` |
| `employeesCount` | number | Same coercion note |
| `monthlyCapacity` | string | |
| `exportPercentage` | string | |
| `yearOfEstablishment` | number | |
| `businessType` | string | |
| `legalStatus` | string | |

**Building the FormData object in JS:**
```js
const formData = new FormData();
formData.append('portfolioAbout', values.portfolioAbout);
formData.append('categories', JSON.stringify(values.categoryIds)); // array -> JSON string
if (values.newLogoFile) formData.append('logo', values.newLogoFile); // File object from <input type="file">
values.newFactoryPhotoFiles.forEach((file) => formData.append('factoryPhotos', file)); // append multiple times under same key
if (values.photosToRemove.length) formData.append('removeFactoryPhotos', JSON.stringify(values.photosToRemove));
```

**This endpoint requires an active plan** (`planStatus` = `active` or `grace`). If plan is expired/none, returns 403:
```json
{ "success": false, "code": "PLAN_REQUIRED", "message": "Select a plan to unlock this feature." }
```
When this happens, show a message directing the seller to select a plan (the plan-selection flow itself is not part of this feature — it already exists in the mobile app; for v1 of the web portal, just show the error message, do not build a plan-selection UI unless separately asked).

**Response (200):**
```json
{ "success": true, "manufacturer": { "...full updated manufacturer object, same shape as GET /api/seller/portfolio..." } }
```

---

### Upload Factory Tour Video

Backend path: `POST /api/seller/portfolio/upload-video`
Client fetch: `fetch('/api/seller/portfolio/upload-video', { method: 'POST', body: formData })` where `formData.append('video', fileObject)`

**Response (200):**
```json
{ "success": true, "url": "https://res.cloudinary.com/.../video.mp4" }
```

Use the returned `url` as the `factoryVideo` value in the next `PATCH /api/seller/portfolio` call — this is a two-step process, not a single combined upload.

---

### Publish Portfolio

Backend path: `POST /api/seller/portfolio/publish`
Client fetch: `fetch('/api/seller/portfolio/publish', { method: 'POST' })` — no body needed.

**Success (200):**
```json
{ "success": true, "slug": "kumar-textiles", "url": "https://xindia.com/p/kumar-textiles" }
```

**Failure — missing fields (400):**
```json
{ "success": false, "message": "Portfolio is missing mandatory fields.", "missingFields": ["factoryPhotos", "buyerContactPhone"] }
```

`missingFields` values are exactly the keys from `mandatoryFieldsComplete` in the dashboard-stats response (`about`, `factoryPhotos`, `logo`, `buyerContactPhone`, `address`) — map them to the same accordion section labels used in Section 13's table when highlighting errors.

**UI:** disable the Publish button (don't just let it fail) whenever `completedCount < totalRequired` from the dashboard-stats response — compute this client-side before allowing the click, rather than relying solely on the 400 response.

---

### Unpublish Portfolio

Backend path: `POST /api/seller/portfolio/unpublish`
Client fetch: `fetch('/api/seller/portfolio/unpublish', { method: 'POST' })`

**Response (200):**
```json
{ "success": true, "portfolioStatus": "draft" }
```

**UI:** confirmation modal before unpublishing (reuse the `Modal.jsx` pattern).

---

### Product CRUD (existing shared endpoints, proxied via `/api/seller-products/...` per Section 2)

**List seller's products:**
Backend path: `GET /api/products?sellerId=<seller_user_id>&page=1&limit=20`
Client fetch: `fetch('/api/seller-products?sellerId=' + userId + '&page=1&limit=20')`

The `sellerId` value is the logged-in seller's `user.id`, returned from the login response (Section 5) — store it in component state/context after login, or re-fetch it from `GET /api/seller/dashboard/stats` if needed (that response does not currently include the raw user id, so prefer capturing it at login time and passing it down, e.g. via a small client-side context provider or by reading it fresh from `/api/seller/portfolio`'s `manufacturer.userId` if present — check the actual response before assuming this field exists; if it's absent, ask the backend dev to confirm the exact source of the seller's own id for this call rather than guessing).

**Create product:**
Backend path: `POST /api/products` (multipart/form-data)
Client fetch: `fetch('/api/seller-products', { method: 'POST', body: formData })`
Fields: `name`, `description`, `price`, `unit`, `moq`, `location`, `category`, `image` (file). Requires active plan — same `PLAN_REQUIRED` 403 behavior as the portfolio endpoint.

**Update product:**
Backend path: `PATCH /api/products/:id`
Client fetch: `fetch('/api/seller-products/' + id, { method: 'PATCH', ... })`
Same fields as create, all optional.

**Delete product:**
Backend path: `DELETE /api/products/:id`
Client fetch: `fetch('/api/seller-products/' + id, { method: 'DELETE' })`

---

## 12. UI Components to Build

### Admin components (`components/admin/`)

| Component | Full code given? | Description |
|---|---|---|
| `AdminSidebar.jsx` | Yes, Section 4 | Vertical nav, Dashboard/Manufacturers/Buyers links + logout |
| `Badge.jsx` | Yes, Section 4 | Color-coded pill |
| `Toggle.jsx` | Yes, Section 4 | Presentational on/off switch |
| `Modal.jsx` | Yes, Section 4 | Presentational modal shell |
| `StatCard.jsx` | Yes, Section 4 | Dashboard number tile |
| `ManufacturerCard.jsx` | Yes, Section 4 | List-view card |
| `BuyerCard.jsx` | No — build following `ManufacturerCard.jsx`'s structure, fields per Section 7 |
| `FilterBar.jsx` | No — the manufacturers/buyers list pages in Sections 4/7 inline their filter controls directly; extracting a separate `FilterBar` component is optional cleanup, not required for correctness |
| `SearchBar.jsx` | No — build per Section 10's description (debounced input + dropdown results) |

### Seller portal components (`components/seller-portal/`)

| Component | Full code given? | Description |
|---|---|---|
| `SellerSidebar.jsx` | No — identical structure to `AdminSidebar.jsx` in Section 4, but with links `/seller-portal/dashboard` (label "Dashboard"), `/seller-portal/portfolio` (label "Portfolio"), `/seller-portal/products` (label "Products"), and logout posting to `/api/auth/logout` then redirecting to `/login?tab=seller` |
| `PortfolioEditForm.jsx` | No — `react-hook-form` based, accordion sections per Section 13's table, submits via the FormData pattern shown in Section 11 |
| `ProductManager.jsx` | No — list + add/edit modal + delete confirmation + visibility toggle, calling the `/api/seller-products/...` proxy from Section 11 |

---

## 13. Seller Portfolio Field Mapping

The portfolio editor (`PortfolioEditForm.jsx`) should have these accordion sections, matching the mobile app's `ascend/src/app/seller/portfolio.js`:

| Section | Form Fields | API Field (PATCH /api/seller/portfolio) |
|---|---|---|
| About Your Business | Textarea (min 80 chars) | `portfolioAbout` |
| Contact for Buyers | Phone input | `buyerContactPhone` |
| Factory Location | Address textarea | `address` |
| Company Logo | Image upload (single) | `logo` (file) |
| Factory Photos | Multi-image upload (min 5, max 20) | `factoryPhotos` (files, repeat key) + `removeFactoryPhotos` (JSON) |
| Cover Image | Image upload (single) | `coverImage` (file) |
| Factory Tour Video | Video upload → URL | Upload via `POST /portfolio/upload-video` first, then include the returned URL as `factoryVideo` |
| Categories | Multi-select from category list | `categories` (JSON array of Category IDs) |
| Certifications | Tag input (free text list, add/remove chips) | `certifications` (JSON array of strings) |
| Factory Details | `factorySize` (text), `machinesCount` (number), `employeesCount` (number), `monthlyCapacity` (text), `exportPercentage` (text) | Same field names, sent as separate form fields |
| Business Info | `yearOfEstablishment` (number), `businessType` (text), `legalStatus` (text) | Same field names |

**Mandatory fields** (must be complete before publish is allowed): About (80+ chars), Factory Photos (5+ photos), Logo, Buyer Contact Phone, Address. Cross-reference `mandatoryFieldsComplete` from the dashboard-stats response (Section 11) to show live completion status per section (e.g. a green checkmark next to "About Your Business" once `mandatoryFieldsComplete.about === true`).

**Publish flow:**
1. User clicks "Publish" → `POST /api/seller/portfolio/publish`
2. If 400 with `missingFields` array → highlight the corresponding accordion sections using this mapping: `about` → About section, `factoryPhotos` → Factory Photos section, `logo` → Company Logo section, `buyerContactPhone` → Contact section, `address` → Factory Location section
3. If 200 → show success message with the returned `url`, and a "View Live Portfolio" link
4. If 403 with `code: "PLAN_REQUIRED"` → show the message, do not attempt to build a plan-selection flow (out of scope, see Section 11's note)

**Categories multi-select data source:** the category list to populate this select is not one of the endpoints documented in this file — check with the backend dev for the correct public categories endpoint (likely something under the existing `/api/v1/discovery` or `/api/explore` routes visible elsewhere in this codebase) rather than guessing a path. Do not invent `/api/v1/admin/categories` or similar.

---

## 14. Error Handling Convention

All API errors follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "OPTIONAL_ERROR_CODE"
}
```

Known error codes:
- `PLAN_REQUIRED` (403) — seller needs to select a plan
- `BLOCKED` (403) — user is temporarily blocked, includes `blockedUntil` date
- `BLACKLISTED` (403) — user is permanently restricted

HTTP status codes used across this API:
- 200 — success
- 201 — created (notes, verification acceptance)
- 400 — validation error (missing fields, invalid data)
- 401 — not authenticated (missing or invalid token)
- 403 — forbidden (wrong role, blocked, plan required)
- 404 — resource not found
- 500 — server error

**Generic handling pattern for every fetch call in this app:**
```js
const res = await fetch(url, options);
const data = await res.json();
if (!data.success) {
  // Show data.message to the user (toast, inline error, etc.)
  // If data.code === 'PLAN_REQUIRED', show the plan-required-specific message
  // Do not throw an unhandled exception — every endpoint in this doc returns
  // a JSON body with `success: false` on failure, never a bare non-JSON error.
}
```

Do not wrap every fetch in a generic `try/catch` that shows "Something went wrong" — check `data.success` explicitly and surface `data.message`, since the backend always provides a specific, user-appropriate message.
