# Security Audit — XINDIA Web (Next.js 14 App Router)

Audit date: 2026-08-24
Scope: `/web/Xindia` (Next.js 14 + middleware + Route Handlers + React server/client components).
No backend (Express) source was in scope — only the web app. Backend recommendations are flagged where the web app's behaviour depends on the backend enforcing them.

Severity legend:
- 🔴 **Critical** — exploitable now, direct business/security impact, fix ASAP.
- 🟠 **High** — exploitable under realistic conditions or chained with other findings.
- 🟡 **Medium** — defense-in-depth, abuse/UX, or only exploitable with extra assumptions.
- 🔵 **Low** — code hygiene, hardening, future-proofing.

---

## 1. Executive summary

The app is a relatively thin **Next.js front-end + 6 Route Handler proxies** in front of an Express backend (`NEXT_PUBLIC_API_URL`). Almost all real auth/authz lives on the backend, and the front-end mostly gets this right (httpOnly cookies, JWT verification in middleware, path-segment injection guards in the catch-all proxies, no SQL/NoSQL in this codebase). The biggest real risks are:

1. **No rate-limiting anywhere** — login, OTP request, OTP verify, review submit, and any `/api/seller/*` mutation are all unthrottled. Credential stuffing and OTP flooding are trivial.
2. **No CSRF protection on any state-changing route** — only cookie-based auth, and `SameSite=Lax` (not `Strict`) — so top-level cross-site `POST` to `/api/auth/admin-login` is *prevented by SameSite*, but admin/seller POSTs from any embedded link or form is possible.
3. **No security response headers** anywhere — no CSP, X-Frame-Options, Referrer-Policy, HSTS (Xindia is on Vercel behind HTTPS).
4. **Client-side `Math.random()` password generator** (`admin/staff/page.js`) — used to mint temporary credentials for admin/staff accounts.
5. **Browser-driven SSRF** in `/admin/settings` ("Test Connection" pings an arbitrary URL).
6. **`dangerouslySetInnerHTML` JSON-LD sink** in the public storefront — relies on backend sanitization.
7. **Public storefront builds `tel:`, `mailto:`, `wa.me/` hrefs from untrusted seller-supplied strings** without scheme enforcement — depends on backend validator.
8. **`YouTubePlayer` falls back to `<video src={...}>` for non-YouTube URLs** — relies entirely on `isDirectVideoUrl()`'s substring check.

Items 1–3 should be fixed before any further production changes. Items 4–8 should be fixed in the next iteration.

---

## 2. Findings

### 🔴 CRIT-1 — No rate limiting on any API route

**Where:**
- `app/api/auth/admin-login/route.js`
- `app/api/auth/seller-login/route.js`
- `app/api/auth/seller-request-otp/route.js`
- `app/api/auth/seller-verify-otp/route.js`
- `app/api/auth/logout/route.js`
- `app/api/revalidate/route.js`
- `app/api/admin/[...path]/route.js`
- `app/api/seller/[...path]/route.js`
- `app/api/seller-products/[[...path]]/route.js`
- `app/api/system/config/route.js`
- `lib/api.js` (public seller fetch)

**Problem:** `grep -ri rate.?limit` returns zero matches. None of the proxies throttle by IP, by cookie identity, or globally. `seller-request-otp` is the most abused vector — an attacker can flood any email with login codes and also enumerate which addresses are registered (the backend's response tells you whether the email exists).

**Fix options:**
1. Add per-IP token bucket at the Next.js layer via `middleware.js` (or a dedicated rate-limit middleware using Upstash / Redis). e.g. Upstash `@upstash/ratelimit` + `@upstash/redis`.
2. Per-account lockout on `/api/auth/*` (5 failed admin logins → 15-min cooldown).
3. Per-email lockout on `/api/auth/seller-request-otp` (1 OTP per email per 60 s, ≤ 5 per hour).
4. Per-IP global cap on the public portfolio data fetches to mitigate scraping (`lib/api.js`).

**Status:** Not implemented.

---

### 🔴 CRIT-2 — No CSRF protection on state-changing routes

**Where:** Every `POST/PATCH/PUT/DELETE` proxy under `/api/admin/[...path]`, `/api/seller/[...path]`, `/api/seller-products/[[...path]]`, plus `/api/auth/admin-login`, `/api/auth/seller-login`, `/api/auth/seller-verify-otp`, `/api/auth/logout`, `/api/revalidate`.

**Problem:** Auth is cookie-only (`httpOnly`, `SameSite=Lax`). `SameSite=Lax` blocks *most* cross-site POSTs (top-level GET only), so the classic CSRF via `<form>` to a `POST` endpoint is mitigated. **However:**
- `SameSite=Lax` does *not* protect against same-site abuse (subdomain takeover, staging on the same eTLD+1).
- The admin "Test Connection" / settings flow expects an attacker to be on `*.xindia.com` already, but a future subdomain (e.g. a marketing blog) would inherit cookie trust.
- Browsers may downgrade `Lax` semantics in some flows (top-level navigation POSTs are sometimes allowed within 2 minutes of cookie creation in Chrome).
- `revalidate` is a backend-pinged secret — see CRIT-3 — and is therefore a separate concern.

**Fix:** Add a double-submit-token CSRF middleware (`middleware.js`): set a non-httpOnly `csrf` cookie on first GET, require `x-csrf-token` header on all non-GET to `/api/*` to equal the cookie value. Exempt the `/api/auth/*-login` and `/api/auth/seller-verify-otp` routes (use the response body or a different mechanism), or accept that those are first-login.

---

### 🔴 CRIT-3 — `revalidate` route shares a static secret

**Where:** `app/api/revalidate/route.js:16`

**Problem:** Constant-time compare (`safeEqual`) is good, but the secret is shared between Vercel and the Render backend. If the backend leaks (logs, error reports, client debugging), the attacker can revalidate any slug — and worse, the route will accept *any* `slug` and trigger `revalidatePath('/sitemap.xml')`. There's no allowlist of slugs or rate limit.

**Fix:**
- Add per-IP rate limit (5/min).
- Optionally allowlist slugs against a "recently published" list.
- Consider rotating `REVALIDATE_SECRET` and using HMAC-signed payloads (timestamp + signature) so replays expire.

---

### 🟠 HIGH-1 — `generateStrongPassword()` uses `Math.random()`

**Where:** `app/admin/staff/page.js:53-60`

**Code:**
```js
function generateStrongPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}
```

**Problem:** `Math.random()` is **not** a CSPRNG. V8's xorshift128+ is predictable from a few samples. If an attacker observes a few generated passwords (e.g. staff list shows last-set temp passwords, leaked logs, etc.) they can reconstruct subsequent values. This matters because these passwords are sent to *new admin/staff accounts*.

**Fix:** Use `crypto.getRandomValues(new Uint8Array(12))` and index into the alphabet. Or have the backend mint them.

---

### 🟠 HIGH-2 — Browser-driven SSRF via "Test Connection"

**Where:** `app/admin/settings/page.js:47-79`

**Code:**
```js
const targetUrl = settings.serverApiUrl.trim().replace(/\/+$/, '');
const res = await fetch(`${targetUrl}/api/health`, { method: 'GET', mode: 'cors' });
```

**Problem:** The URL comes from the system settings record. Any admin (including STAFF?) can write a URL — `http://internal-victim:8080/`, `http://169.254.169.254/` (cloud metadata), or `file:///etc/passwd` (some browsers reject this but the dev environment may not). The browser is the one making the request, so CORS will usually block reads, but:
- Browser-side fetches will *still send the request* and trigger side effects on internal services (cache poisoning, port scanning).
- `mode: 'cors'` doesn't actually prevent this; it only controls whether the *response* is exposed.
- The page shows full error messages including server responses, leaking internal status codes/headers to anyone with admin access (lower bar but still worth flagging).

**Fix:**
- Validate `serverApiUrl` is an HTTPS URL with an allowlisted host suffix on both client and server.
- Restrict the "Test Connection" feature to SUPER_ADMIN role.
- Even better, run the ping from the server-side Route Handler (so you control egress, can use a real IP-allowlist, and can drop the body of internal responses).

---

### 🟠 HIGH-3 — `dangerouslySetInnerHTML` JSON-LD sink trusts backend payload

**Where:** `app/p/[slug]/layout.js:39-43`

**Code:**
```js
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: seller.name,
  image: seller.logo,
  description: seller.portfolioAbout || seller.description,
  address: seller.address,
  aggregateRating: seller.reviewCount > 0 ? {
    '@type': 'AggregateRating',
    ratingValue: seller.rating,
    reviewCount: seller.reviewCount,
  } : undefined,
};
...
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

**Problem:** `seller.name`, `seller.address`, `seller.portfolioAbout`, `seller.description` are all seller-supplied and edited via `ProfileEditForm` / `PortfolioEditForm`. React's `dangerouslySetInnerHTML` writes the string verbatim into a `<script>` tag. If the backend ever stores a value containing `</script><script>alert(1)</script>` (e.g. via a stale admin form that didn't strip tags), this becomes stored XSS on the public storefront. Even without that, the description text could break out of the JSON literal.

**Fix:**
1. Validate on the backend: reject `name`, `description`, `portfolioAbout`, `address` containing `<`, `>`, or quotes (or HTML-encode them).
2. On the client, sanitize before injecting: `const safe = (str) => String(str || '').replace(/[<>&"']/g, c => ({...}[c]));`
3. Or build the JSON manually as an object and use `JSON.stringify` with a replacer that strips control characters (`<`, `>`, backslash, slash) from string values.

Even better — stop using `dangerouslySetInnerHTML` and inject the JSON with React's normal escaping by rendering it as a `<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>` — React *will* escape the `<` to `\u003c` for you, breaking out of the script tag is impossible.

---

### 🟠 HIGH-4 — Public storefront builds URLs from seller input without scheme enforcement

**Where:** `app/p/[slug]/contact/page.js:19, 26, 35`

**Code:**
```jsx
<a href={`tel:${seller.buyerContactPhone}`}>...</a>
<a href={`https://wa.me/${seller.contact.whatsapp.replace(/[^0-9]/g, '')}`}>...</a>
<a href={`mailto:${seller.contact.email}`}>...</a>
```

**Problem:**
- `tel:`, `mailto:`, `wa.me/` are constructed by template literals over fields the seller can edit.
- If the backend ever stores `buyerContactPhone: "12345" + arbitrary text`, the resulting href could be `tel:12345javascript:alert(1)`. Browsers generally require the URL to start with a scheme, but the schemes `tel:` and `mailto:` will trigger whatever client is registered for that handler — a malicious `tel:` value could open an unintended app.
- The `wa.me/` link is currently `https://`, so that's safer — but `seller.contact.whatsapp` is used as raw URL path component, and if it contains characters outside `[0-9]` they are stripped by the regex. That's fine.
- More importantly, this is an *output encoding* bug that depends entirely on backend validation. Backend validation is not in scope but we should still apply client-side hardening.

**Fix:**
- Sanitize phone numbers to `+` and digits only before composing the href.
- Validate `email` against a basic RFC 5322 regex before composing `mailto:`.
- Better, use `<a href={'tel:' + encodeURI(sanitizedPhone)}>` — `encodeURI` won't help much for `tel:`, but normalizing first does.

---

### 🟠 HIGH-5 — `YouTubePlayer` non-YouTube fallback uses unvalidated URL

**Where:** `components/common/YouTubePlayer.jsx:172-183`, validation in `lib/youtube.js:93-103`

**Code:**
```js
return <video src={videoUrl} ... />;
```

**Problem:** When the seller sets `introVideo` or `factoryVideo` to a URL that doesn't match the YouTube regex, the component falls through to a `<video>` tag with `src={videoUrl}`. The `isDirectVideoUrl()` check at `lib/youtube.js:93-103` is a substring search for `.mp4|.webm|.ogg|.mov|res.cloudinary.com` — **it does not enforce that the URL uses `http` or `https`**. A value like `javascript:alert(1)//.mp4` would pass the substring test (`".mp4"` is present), and `<video src>` doesn't execute scripts but a malicious URL could still exfiltrate the user's IP via a request to an attacker-controlled origin if the browser issues a HEAD/GET — most browsers do.

**Fix:**
- In `lib/youtube.js`, validate that `videoUrl` parses via `new URL(videoUrl)` and that `protocol` is `http:` or `https:` before allowing the direct-video fallback.
- Same fix for `getYouTubeThumbnailUrl` and `getYouTubeEmbedUrl` — currently they only check the ID format.
- Consider dropping the fallback entirely if not needed.

---

### 🟠 HIGH-6 — Logout endpoint trusts only `admin_token` cookie for revocation

**Where:** `app/api/auth/logout/route.js:5-25`

**Problem:** The route calls `/api/v1/admin/logout` with `admin_token` to revoke the server session, but does **not** do the same for `seller_token`. The `seller_token` cookie is just deleted client-side. If a leaked seller token is in the wild, it remains valid for `maxAge` (24 h) even after the user "logs out". The admin flow has the same issue (the `admin_token` deletion is client-side; only an attempted backend revoke is done best-effort and silently logs on failure).

**Fix:**
- Always call the backend's revocation endpoint for both `admin_token` and `seller_token`, with parallel `await Promise.all`.
- Surface a failure to the client so they know the server-side session is still live.
- Better: have the backend reject logout failures client-side, and force the user to retry.

---

### 🟠 HIGH-7 — `admin_profile` in localStorage controls UI gating

**Where:**
- `app/login/page.js:41-48` (writes it)
- `app/api/auth/admin-login/route.js:43` (response shape)
- `components/admin/AdminSidebar.jsx:54-59` (reads role from it)
- `app/admin/reviews/page.js:35-38`
- `app/admin/buyers/page.js:23-29`
- `app/admin/manufacturers/page.js`, `app/admin/manufacturers/[id]/page.js`
- `components/admin/ManufacturerCard.jsx` (uses `manufacturer.isBlacklisted`)

**Problem:** Client-side role gates (e.g. `if (role !== 'STAFF') show block button`) are checked from `localStorage`. Any admin can open DevTools → `localStorage.setItem('admin_profile', '{"role":"SUPER_ADMIN","permissions":["*"]}')` and bypass UI restrictions. The middleware (`middleware.js:67-69`) does block STAFF from accessing `/admin/staff`, `/admin/settings`, `/admin/plans`, `/admin/credits` at the *route* level — good. But the API authz lives entirely on the backend, which we trust. So this is mostly a **defense-in-depth issue**:
- If the backend ever has a missing permission check, a STAFF who edits their own `localStorage` could exploit it from the UI alone (no XSS needed).

**Fix:**
- Add a backend `/api/admin/me` endpoint that returns the authoritative role.
- Use SWR/React Query to fetch it on app mount, store in context, and remove the localStorage profile entirely.

---

### 🟡 MED-1 — Admin/seller login proxy is fully reflective

**Where:** `app/api/auth/admin-login/route.js`, `seller-login/route.js`, `seller-verify-otp/route.js`

**Problem:** These proxies return the backend's response body *as-is* (only stripping the token for admin-login). Any backend error message ("user not found", "invalid password", "OTP expired", etc.) is surfaced verbatim. This enables **account enumeration** (different error messages for non-existent vs. wrong-password) and **OTP brute-forcing** (no rate limit, and "Invalid or expired OTP" tells an attacker the OTP format was accepted).

**Fix:**
- Return generic error messages: "Invalid credentials", "Could not complete request".
- Add per-account throttling on the backend (and/or per-IP throttling here).

---

### 🟡 MED-2 — `BfcacheReload` triggers `window.location.reload()` on `event.persisted`

**Where:** `components/BfcacheReload.jsx`

**Problem:** This reloads the page whenever the browser restores from bfcache. On `/admin/manufacturers/[id]`, this means a reload is forced for *every* back-navigation, regardless of whether auth state has changed. If a future feature relies on preserving some state across back/forward, this breaks it. More importantly, the page used to rely on this for security (post-logout stale page), but a real auth check at the server (`middleware.js`) handles that now. This component is a defense-in-depth measure but worth keeping.

**No action required** unless the team wants to remove it. Just noting.

---

### 🟡 MED-3 — `youtube.js` regex is permissive

**Where:** `lib/youtube.js:29`

**Code:**
```js
const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
```

**Problem:** Regex is OK and the captured group is constrained to `[a-zA-Z0-9_-]{11}`, so output is safe. However, the *input* is not length-bounded — an attacker can submit a 1 MB string. Mitigation: react-hook-form already limits input length via `maxLength` in the admin/seller forms; nothing caps the public side, but the public side never sees user-typed URLs (only from the backend).

**No action required** unless we expose this regex to a public input field.

---

### 🟡 MED-4 — Polling never backs off on errors

**Where:** `app/seller-portal/dashboard/page.js:48`

**Code:**
```js
const interval = setInterval(loadStats, 30 * 1000);
```

**Problem:** Even when the network request fails, polling continues at 30 s, hammering the backend. On a flaky connection, this can DoS the backend via the browser.

**Fix:** Clear the interval on persistent error (e.g. after 3 consecutive failures, slow down to 5 min or stop).

---

### 🟡 MED-5 — `Math.max(parseInt(searchParams?.page) || 1, 1)` for pagination

**Where:** `app/p/[slug]/products/page.js:11`

**Problem:** `parseInt('1; DROP TABLE sellers--')` is `1` (parses leading digits), and `Math.max` clamps to ≥1, so this is fine. But `parseInt` accepts `Infinity` and very large numbers without range-binding — `?page=99999999999999999999` becomes a huge integer that could overflow Mongo/SQL limit/offset. Backend should enforce a max page size, but the web shouldn't send it either.

**Fix:** `const page = Math.min(Math.max(parseInt(searchParams?.page, 10) || 1, 1), 500);`

---

### 🟡 MED-6 — `URLSearchParams` building doesn't validate inputs

**Where:** All admin filter forms and `BuyerActivityManager.jsx`.

**Problem:** Admin/seller inputs (search text, category, etc.) are passed straight into `URLSearchParams`. `URLSearchParams` percent-encodes properly, so this is safe in practice. Just noting that the *backend* needs to enforce string length and reject NoSQL injection (`{ $gt: '' }`) if Mongo is involved. Out of scope here but flag for backend team.

---

### 🟡 MED-7 — `window.location.reload()` after admin 404

Not currently present, but if a 404 from the admin route handler causes a hard reload, this could be an issue. None found. Skipping.

---

### 🔵 LOW-1 — `event.persisted` not the only reason for stale auth

**Where:** `components/BfcacheReload.jsx`

**Problem:** Bfcache reload forces a network call. If the cookie is expired, `middleware.js` redirects to `/login`. This is fine.

---

### 🔵 LOW-2 — `console.error` logs include sensitive URLs

**Where:** All proxy route handlers log the full target URL on error (`app/api/admin/[...path]/route.js:46`, etc.)

**Problem:** Backend URL is already public (`NEXT_PUBLIC_API_URL` is in the JS bundle), so this isn't a real leak. But the full target URL with query string could include path IDs (`/api/admin/manufacturers/<id>/...`) which would land in Vercel logs. PII concern.

**Fix:** Sanitize the logged URL to drop path segments after the first 2.

---

### 🔵 LOW-3 — `BfcacheReload` reloads on every back-navigation

Covered in MED-2.

---

### 🔵 LOW-4 — `<a href>` (not `<Link>`) used in some admin tables

**Where:** `app/admin/dashboard/page.js:264` and others (`admin/manufacturers/[id]/page.js:553, 598`).

**Problem:** Full page reloads instead of client-side navigation. UX issue, not security.

---

### 🔵 LOW-5 — `extractYouTubeId` accepts an 11-char alphanumeric ID without scheme

**Where:** `lib/youtube.js:24`

**Problem:** `/^[a-zA-Z0-9_-]{11}$/` is fine, but the embed URL it produces is `https://www.youtube-nocookie.com/embed/${videoId}` which is good (nocookie + same-origin allowed).

---

### 🔵 LOW-6 — JSON.parse of localStorage wrapped in try/catch ✓

Good — already correct in all 4 sites (`components/admin/AdminSidebar.jsx`, `app/admin/reviews/page.js`, `app/admin/buyers/page.js`, `app/admin/manufacturers/[id]/page.js`).

---

### 🔵 LOW-7 — `next/image` not used for seller-uploaded photos

**Where:** Many places — `<img src={seller.logo}>` instead of `<Image>`.

**Problem:** No automatic optimization, no SSRF protection. If `seller.logo` is `https://evil.com/track.gif?session=...`, every page view loads it, leaking the viewer's IP and Referer to the attacker. The `next.config.js` only allows `res.cloudinary.com` and `images.unsplash.com`, but the regular `<img>` tag is **not** constrained by `images.remotePatterns`. So all seller-uploaded photos (likely on Cloudinary) work, but if a seller ever submits an attacker-controlled URL, it's rendered as-is.

**Fix:**
- Move all `<img src={seller.X}>` to `next/image` so the framework's host allowlist applies. Add the seller image CDN host (Cloudinary) to `images.remotePatterns`.

---

### 🔵 LOW-8 — `next.config.js` doesn't lock `images.remotePatterns`

**Where:** `next.config.js:4-7`

**Problem:** Only allows `res.cloudinary.com` and `images.unsplash.com`. The seller-uploaded images are presumably stored on Cloudinary, which is allowed — good. But again, using regular `<img>` bypasses this.

---

### 🔵 LOW-9 — `nanoid` not used for IDs

The codebase uses MongoDB ObjectIDs everywhere. No user-facing ID generation. Not an issue.

---

### 🔵 LOW-10 — `Suspense` boundary around `useSearchParams`

**Where:** `app/login/page.js:351-356`

Good — already wraps `<LoginContent />` in `<Suspense>` to prevent build-time `useSearchParams` errors in Next 14.

---

### 🔵 LOW-11 — `app/sitemap.js` only lists slugs from backend

Good — relies on `getAllPublishedSlugs` which fetches `/api/public/sellers/slugs`. If the backend is compromised or returns garbage, an attacker could add arbitrary URLs to the sitemap. **But this is a backend auth issue**, not a web one.

---

### 🔵 LOW-12 — `app/robots.js` uses hardcoded `allow: '/'`

**Where:** `app/robots.js:6`

**Problem:** The robots.txt allows crawling of the *entire* site, including `/admin/*` and `/seller-portal/*` (the middleware would still redirect, but the bot would still try every URL and could exhaust server resources). Recommended: disallow `/admin/` and `/seller-portal/` for user-agent `*`.

**Fix:**
```js
rules: {
  userAgent: '*',
  allow: '/',
  disallow: ['/admin/', '/seller-portal/', '/api/', '/login'],
},
```

---

### 🔵 LOW-13 — `<a href="/login">` in pricing page (no SPA navigation)

**Where:** `app/pricing/PricingClientSection.js:75-87`

UX nit only.

---

## 3. Checklist of concrete fixes (priority order)

1. **Add rate limiting** to all `/api/*` Route Handlers (Upstash or equivalent). Critical for OTP and login endpoints specifically. → CRIT-1
2. **Add a `headers()` config in `next.config.js`** with at minimum: `Content-Security-Policy` (script-src self + youtube-nocookie + Cloudinary), `Strict-Transport-Security`, `X-Frame-Options: DENY` (or `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` minimal. → addresses several findings and is cheap to add.
3. **Add CSRF tokens** to all `POST/PATCH/PUT/DELETE` (double-submit cookie pattern). → CRIT-2
4. **Fix `generateStrongPassword()` to use `crypto.getRandomValues`**. → HIGH-1
5. **Move "Test Connection" server-side**, validate URL is HTTPS + host allowlisted. → HIGH-2
6. **Sanitize / encode JSON-LD before `dangerouslySetInnerHTML`**, or render as React text. → HIGH-3
7. **Sanitize `tel:`, `mailto:` inputs** before composing hrefs. → HIGH-4
8. **Validate `<video src>` URL protocol is http(s)**. → HIGH-5
9. **Always revoke both `admin_token` and `seller_token`** on logout, surface failures. → HIGH-6
10. **Replace `localStorage` role with backend-fetched `/api/admin/me`**. → HIGH-7
11. **Generic error messages** on login / OTP routes. → MED-1
12. **Disallow `/admin/`, `/seller-portal/`** in `robots.txt`. → LOW-12
13. **Replace `<img src={seller.X}>` with `next/image`** (or whitelist allowed hosts in a CSP). → LOW-7
14. **Cap pagination `page` parameter** to a sane max (e.g. 500). → MED-5
15. **Back off polling** on persistent error. → MED-4
16. **Sanitize error-log URLs** to drop path segments. → LOW-2

---

## 4. Backend notes (out of scope but flagged)

- The web app is a thin proxy over `/api/v1/admin/*`, `/api/seller/*`, `/api/products*`, `/api/public/*`. Almost all real auth/authz lives in the backend. Key things the backend **must** do (or this whole app is at risk):
  - **Re-verify JWT and role** on every protected route — the web middleware is a UX layer, not a security boundary. (Already mentioned in `middleware.js` comments — verified they say so.)
  - **Sanitize strings** before storing them (`name`, `description`, `address`, `portfolioAbout`, `introVideo`, `factoryVideo`, `certifications[]`, etc.).
  - **Validate uploaded image URLs** before persisting (or always proxy through Cloudinary signed uploads).
  - **Validate phone numbers and emails** before they reach `tel:` / `mailto:` URLs on the public storefront.
  - **Bind OTP requests to email and rate-limit** server-side.
  - **Enforce idempotent logout** that revokes the JWT (e.g. a Redis denylist).
- If the backend ever returns a `serverApiUrl` containing an internal hostname, the current web "Test Connection" client-side ping becomes a more serious SSRF (HIGH-2 mitigation also helps).

---

## 5. Items checked and confirmed safe

- ✅ No SQL/NoSQL queries in this codebase — all queries are in the backend.
- ✅ All `target="_blank"` use `rel="noopener noreferrer"`.
- ✅ All `localStorage` JSON parses are wrapped in `try/catch`.
- ✅ JWT secret is loaded from `process.env.JWT_SECRET` (no hardcoded value), missing-secret logs loud error.
- ✅ Catch-all proxy path injection is correctly guarded by `isSafePathSegments` (`lib/safePathSegments.js`).
- ✅ Cookie settings: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`. (Would prefer `'strict'` for admin, but `'lax'` is reasonable.)
- ✅ Middleware verifies token signature, expiry, and `type` claim. STAFF route gating is in place.
- ✅ `.env*` files are properly gitignored.
- ✅ No `eval`, no `new Function`, no `innerHTML`, no `document.write`.
- ✅ `useSearchParams` wrapped in `<Suspense>` (Next 14 requirement).
