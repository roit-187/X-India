# Admin Control Panel + Seller Web Portal — Implementation Plan

## Context

The MART platform has a mobile app (Expo/React Native) and a Next.js marketing website (`web/Xindia`) backed by an Express+Mongoose API (`server/`). The website currently has no login, no admin panel, and no seller portal. A second developer is building the website frontend; this plan is the shared spec both devs work against. The backend dev (this session) implements the API; the frontend dev builds against the documented contracts.

**Decisions locked in:**
- Session: httpOnly cookie + Next.js `middleware.js` route guard
- Seller web login: email-only OTP (no phone OTP for v1)
- Buyer inquiry metric: count-based (not currency amount — `budget` is free text)
- New frontend dependency: `react-hook-form` approved

---

## Phase 0 — New/Changed Mongoose Schemas

### New model: `VerificationRequest` (`server/src/models/VerificationRequest.model.js`)

```
userId:            ObjectId ref User (required, index)
manufacturerId:    ObjectId ref Manufacturer (index)
status:            enum ['pending','accepted','scheduled','verified','rejected'] default 'pending' (index)
assignedVerifier:  { name: String, adminId: ObjectId ref AdminUser, assignedAt: Date }
requestedLocation: { cityId: ObjectId, address: String }
scheduledVisit:    { date: String, slot: String, bookedAt: Date }
evidence:          [{ photoUrl: String, uploadedAt: Date }]
verifierNotes:     String
decidedAt:         Date
decidedBy:         ObjectId ref AdminUser
reVerificationDueAt: Date
timestamps: true
```

### New model: `BlacklistRegistry` (`server/src/models/BlacklistRegistry.model.js`)

```
email:          String (lowercase, sparse unique index)
phone:          String (sparse unique index)
reason:         String
blacklistedBy:  ObjectId ref AdminUser
blacklistedAt:  Date (default now)
```

Purpose: survives the 30-day soft-delete purge cron so blacklisted users can't re-register.

### Changed: `Manufacturer` model (`server/src/models/manufacturer.model.js`)

Add fields:
```js
adminNotes:        [{ text: String, adminId: { type: ObjectId, ref: 'AdminUser' }, createdAt: { type: Date, default: Date.now } }]
planHistory:       [{ planKey: String, billingCycle: String, amount: Number, startedAt: Date, expiresAt: Date }]
deactivatedAt:     Date
deactivatedBy:     { type: ObjectId, ref: 'AdminUser' }
deactivationReason: String
```

### Changed: `User` model (`server/src/models/user.model.js`)

Add fields:
```js
isBlacklisted:     { type: Boolean, default: false, index: true }
blacklistReason:   String
blacklistedBy:     { type: ObjectId, ref: 'AdminUser' }
blacklistedAt:     Date
blockedUntil:      { type: Date, default: null }
lastActiveAt:      { type: Date, default: null }
```

### Changed: `Notification` model — `sender` field

Currently `sender` is `required: true` (ref User). Admin-initiated notifications need a system sender. Change `required` to `false` (default `null`) so admin actions can omit a sender, or create a dedicated system-user ObjectId seed. Recommend relaxing `required` — simpler, no fake user needed.

---

## Phase 1 — Seller Web Login (backend)

**Files:** new `server/src/controllers/sellerAuth.controller.js`, extend `server/src/routes/seller.routes.js`

Mount these **before** `router.use(requireAuth)` in seller.routes.js:

### `POST /api/seller/auth/request-otp`

- Body: `{ email }`
- Lookup `User` by `email` with `role: 'seller'`, not deleted/blacklisted
- Generate OTP via existing `generateOtp()` → store via `Otp.create()` → send via `sendEmailOtp()`
- Response: `{ success: true }` always (don't leak existence)
- Reuses: `server/src/models/otp.model.js`, `server/src/utils/otp.utils.js` (`generateOtp`, `sendEmailOtp`)

### `POST /api/seller/auth/verify-otp`

- Body: `{ email, otp }`
- Verify against `Otp` collection, delete on success
- Reject if `user.isDeleted`, `user.isBlacklisted`, or `user.blockedUntil > now`
- Issue token via existing `signToken(user._id)` from `requireAuth.middleware.js`
- Response: `{ success: true, token, user: { id, firstName, lastName, email, companyName, role } }`

No phone OTP in v1 — can be added later by extending this endpoint.

---

## Phase 2 — Admin Manufacturer Management (backend)

**Files:** new `server/src/controllers/adminManufacturer.controller.js`, extend `server/src/routes/admin.routes.js`

All routes behind existing `AdminAuthService.authenticateAdminMiddleware()` (aliased `auth` in admin.routes.js).

**Endpoint convention** (applies to all admin list endpoints): `page`/`limit` query params, response `{ success, [items], total, page, totalPages }`. Every mutation calls `AdminAuditService.logAction(...)` after write.

### `GET /api/v1/admin/manufacturers`

Query params: `category`, `planStatus` (none/active/grace/expired), `verified` (true/false), `isActive` (true/false), `stateId`, `cityId`, `search` (name regex), `page`, `limit`

Copies the filter-resolution pattern from `ManufacturerService.listManufacturers()` in `server/src/services/manufacturer.service.js` but **drops the hardcoded `isActive: true`** so admin sees all sellers.

Response per item:
```json
{ "_id", "name", "logo", "planStatus", "planKey", "productCount", "rating",
  "reviewCount", "portfolioStatus", "verified", "isActive", "categories",
  "address", "lastActiveAt", "createdAt" }
```

### `GET /api/v1/admin/manufacturers/:id`

Full detail: populated Manufacturer doc + computed stats:
- `products`: list from `Product.find({ manufacturerId | sellerId })` with `isActive`, `status`, `createdAt`
- `planHistory`: from `manufacturer.planHistory[]`
- `creditHistory`: from `User.creditLedger` (join via `manufacturer.userId`)
- `inquiriesReceived`: `WorkspaceProject.countDocuments({ unlockedBy: manufacturer.userId })`
- `conversationCount`: `Conversation.countDocuments({ participants: manufacturer.userId })`
- `moderationCaseCount`: `ModerationCase.countDocuments({ targetEntityId: id, status: { $in: ['OPEN','UNDER_REVIEW'] } })`
- `latestVerification`: `VerificationRequest.findOne({ manufacturerId: id }).sort({ createdAt: -1 })`
- `profileCompleteness`: reuse mandatory-fields check logic from `seller.routes.js` `GET /portfolio/status`
- `accountAge`: `User.createdAt` via join

### `PATCH /api/v1/admin/manufacturers/:id/status`

Body: `{ isActive: boolean, reason?: string }`

Sets `Manufacturer.isActive`. When deactivating: sets `deactivatedAt/By/Reason`. When reactivating: clears those fields. Sends push notification to seller via existing `createNotification()` from `server/src/utils/notification.js`. Audit-logs.

### `PATCH /api/v1/admin/manufacturers/:id/verified`

Body: `{ verified: boolean }`

Sets `Manufacturer.verified` + syncs `User.verificationStatus` ('verified' or reverts to 'pending'). Closes any open `VerificationRequest`. Notifies seller. Audit-logs.

### `PATCH /api/v1/admin/manufacturers/:id/products/:productId/visibility`

Body: `{ isActive: boolean }`

Admin-scoped product toggle — same as existing `PATCH /api/products/:id` logic but bypasses seller-ownership check. Roles: `requireRoles(['SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS_ADMIN'])`.

### `POST /api/v1/admin/manufacturers/:id/notes`

Body: `{ text: string }`

Pushes to `manufacturer.adminNotes[]`.

### `PATCH /api/v1/admin/manufacturers/bulk-status`

Body: `{ ids: [string], isActive: boolean, reason?: string }`

Loops single-item logic, single audit log entry.

---

## Phase 3 — Admin Buyer Management (backend)

**Files:** new `server/src/controllers/adminBuyer.controller.js`, extend `admin.routes.js`

### `GET /api/v1/admin/buyers`

Query params: `joinedFrom`/`joinedTo` (date range), `active` (boolean — derived from `lastActiveAt` within 30 days), `search` (name/email/phone regex), `page`, `limit`

Filters `User` where `role: 'buyer'`.

Response per item:
```json
{ "_id", "firstName", "lastName", "email", "phone", "location", "createdAt",
  "lastActiveAt", "isBlacklisted", "blockedUntil", "inquiryCount",
  "conversationCount" }
```

`inquiryCount` = `WorkspaceProject.countDocuments({ ownerId: id })` (ownerId is stored as String).
`conversationCount` = `Conversation.countDocuments({ createdBy: id, isGroup: false })`.

### `GET /api/v1/admin/buyers/:id`

Full detail: user doc + `inquiries` (paginated `WorkspaceProject` list where `ownerId === id`) + `categoriesOfInterest` (distinct `WorkspaceProject.categoryId` values for this buyer — derived, not stored) + `conversationCount`.

### `PATCH /api/v1/admin/buyers/:id/block`

Body: `{ mode: 'temporary' | 'blacklist', days?: number, reason: string }`

- **Temporary**: sets `user.blockedUntil = now + days`
- **Blacklist**: sets `user.isBlacklisted = true`, `blacklistReason`, `blacklistedBy`, `blacklistedAt` + upserts `BlacklistRegistry` by email+phone

Notifies user (if temporary block), audit-logs.

### `PATCH /api/v1/admin/buyers/:id/unblock`

Clears `blockedUntil` and/or `isBlacklisted` fields. Blacklist unblock requires `requireRoles(['SUPER_ADMIN', 'COMPLIANCE_OFFICER'])`. Removes matching `BlacklistRegistry` entry.

---

## Phase 4 — Admin Dashboard Analytics (backend)

**Files:** new `server/src/controllers/adminDashboard.controller.js`, extend `admin.routes.js`

### `GET /api/v1/admin/dashboard/summary?range=week|month|year`

Response:
```json
{ "newBuyers": 42, "newSellers": 8, "totalInquiries": 156,
  "activeSellers": 35, "expiredSellers": 12 }
```

Computed via `User.countDocuments({ createdAt: { $gte: rangeStart }, role: 'buyer'|'seller' })`, `WorkspaceProject.countDocuments(...)`, `Manufacturer.countDocuments({ planStatus: ... })`.

### `GET /api/v1/admin/dashboard/revenue?range=week|month|year`

Response: `{ planRevenue, creditRevenue }` — summed from `Manufacturer.planHistory[]` and `User.creditLedger` (type `purchase_stub`) entries within the range.

### `GET /api/v1/admin/dashboard/funnel`

Response: `{ signedUp, selectedPlan, publishedPortfolio, createdProduct, receivedInquiry }` — counts at each stage for sellers.

### `GET /api/v1/admin/dashboard/top-sellers?metric=inquiries|rating|products&limit=10`

Sorted manufacturer list.

### `GET /api/v1/admin/dashboard/moderation-count`

`ModerationCase.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } })`.

---

## Phase 5 — Verification Queue (backend)

**Files:** extend `admin.routes.js` + new `VerificationRequest` model from Phase 0

### `GET /api/v1/admin/verification/queue?status=pending|accepted|scheduled`

Paginated list of `VerificationRequest` populated with user/manufacturer names, filterable by `status` and `cityId` (location-based verifier routing).

### `POST /api/v1/admin/verification/:id/accept`

Body: `{ verifierName, assignedAdminId? }`

Sets `status: 'accepted'`, `assignedVerifier`, syncs `User.verificationStatus = 'scheduled'`. Notifies seller.

### `POST /api/v1/admin/verification/:id/decision`

Body: `{ decision: 'verified' | 'rejected', verifierNotes?, evidencePhotos?: string[] }`

On **verified**: `Manufacturer.verified = true`, `User.verificationStatus = 'verified'`, sets `reVerificationDueAt` (+1 year).
On **rejected**: `User.verificationStatus = 'rejected'`, `Manufacturer.verified = false`. Notifies seller either way.

### New cron job (add to `server/src/server.js` alongside existing 3am/3:30am/4am jobs)

Daily sweep: `VerificationRequest` where `reVerificationDueAt <= now` and `status === 'verified'` → send re-verification reminder notification to seller.

---

## Phase 6 — Seller Portal Dashboard Endpoint (backend)

**Files:** extend `server/src/routes/seller.routes.js`

### `GET /api/seller/dashboard/stats` (behind existing `requireAuth`)

Composes everything `GET /portfolio/status` already returns, plus:
```json
{
  ...existingPortfolioStatusFields,
  "totalInquiries": 23,
  "conversationCount": 15,
  "rating": 4.2,
  "reviewCount": 8,
  "creditsBalance": 5,
  "verified": true
}
```

No changes to the existing `/portfolio/status` endpoint (mobile app depends on it).

---

## Phase 7 — Global Search + Admin Activity Log (backend)

### `GET /api/v1/admin/search?q=`

Parallel regex search across `Manufacturer.name` and `User` (buyers) `firstName/email/phone`. Returns `{ manufacturers: [...top 10], buyers: [...top 10] }`.

### Admin activity log

No new backend needed — `GET /api/v1/admin/audit/logs` already exists in `admin.routes.js:27`, queries `AdminAuditRecord`. Just surface it in the admin UI.

---

## Phase 8 — Backend Follow-ups (Required for Feature Correctness)

These aren't new endpoints but changes to existing code that make the admin toggles actually work:

1. **`requireAuth.middleware.js`**: Add `blockedUntil` and `isBlacklisted` check after the existing `isDeleted` check → return 403 `{ code: 'BLOCKED' }` or `{ code: 'BLACKLISTED' }`

2. **`auth.controller.js` registration flow**: Before creating a new `User`, check `BlacklistRegistry.findOne({ $or: [{ email }, { phone }] })` → reject with 403 if found

3. **Public product queries** (`product.routes.js:22-29`, `public.routes.js`): When showing public products, additionally check that the product's manufacturer has `isActive: true`. Currently only `product.isActive` is checked — the admin "deactivate seller" toggle would be cosmetic without this fix

4. **`seller.routes.js` `POST /plan/select`**: After setting plan fields, push an entry to `manufacturer.planHistory[]` so plan spend history is queryable

5. **`Notification.sender`**: Relax `required: true` to `required: false` (default `null`) so admin-initiated system notifications work without a fake sender user

6. **`lastActiveAt` tracking**: Add a throttled touch (`if (!user.lastActiveAt || user.lastActiveAt < oneHourAgo)`) in `requireAuth` middleware so last-active is tracked without a write on every request

---

## Phase 9 — Frontend Structure (`web/Xindia`)

### Auth flow (httpOnly cookie approach)

New Next.js Route Handlers that proxy to the Express backend and set cookies:

```
app/api/auth/admin-login/route.js    → POST to /api/v1/admin/login, set httpOnly cookie 'admin_token'
app/api/auth/seller-request-otp/route.js → POST to /api/seller/auth/request-otp
app/api/auth/seller-verify-otp/route.js  → POST to /api/seller/auth/verify-otp, set httpOnly cookie 'seller_token'
app/api/auth/logout/route.js          → clear cookies
```

New `middleware.js` at Xindia root: reads cookie, decodes JWT payload (unsigned, for routing only — backend re-verifies on every API call), redirects `/admin/*` to `/login` if no valid admin token, `/seller-portal/*` if no valid seller token.

### Route/folder structure (follows `app/p/[slug]/*` route-folder-per-tab precedent)

```
app/
  login/page.js                          — tab toggle: Admin (username+password) | Seller (email OTP)
  api/auth/...                           — route handlers above
  admin/
    layout.js                            — server component, reads cookie, renders AdminSidebar + {children}, imports admin.css
    dashboard/page.js                    — stat cards + charts + verification queue
    manufacturers/page.js                — filterable list of manufacturer cards
    manufacturers/[id]/page.js           — detail view with tabbed sections
    buyers/page.js                       — filterable list of buyer cards
    buyers/[id]/page.js                  — detail view
  seller-portal/
    layout.js                            — server component, reads cookie, renders SellerSidebar, imports seller-portal.css
    dashboard/page.js                    — plan status, product count, inquiries, rating
    portfolio/page.js                    — edit form mirroring mobile app's accordion sections
    products/page.js                     — product list with add/edit/toggle
middleware.js                            — route guard
```

### Styling (follow existing conventions)

- `app/admin.css` — own scoped CSS custom properties (like `portfolio.css` does with `--p-*`), imported only in `admin/layout.js`
- `app/seller-portal.css` — same pattern
- All components use plain CSS classes + CSS custom properties — no Tailwind, no CSS-in-JS, matching `globals.css`/`portfolio.css` convention

### New shared components

```
components/admin/
  AdminSidebar.jsx          — 'use client', usePathname() for active link (copy PortfolioNav.jsx pattern)
  ManufacturerCard.jsx      — card component for list view
  BuyerCard.jsx
  DataTable.jsx             — sortable columns, pagination
  FilterBar.jsx             — dropdowns + search input
  Toggle.jsx                — active/inactive switch
  Modal.jsx                 — confirmation dialogs (block, verify, notes)
  Badge.jsx                 — plan-status / verified pills
  StatCard.jsx              — dashboard number tiles

components/seller-portal/
  SellerSidebar.jsx         — same pattern as AdminSidebar
  PortfolioEditForm.jsx     — react-hook-form, fields match mobile app's portfolio.js sections
  ProductManager.jsx        — product list + add/edit
```

### API client libraries

```
lib/adminApi.js             — authenticated fetch wrappers for /api/v1/admin/* (go through Next.js Route Handlers)
lib/sellerPortalApi.js      — authenticated fetch wrappers for /api/seller/*
```

Client components that need mutations call Next.js Route Handlers (which forward to Express with the cookie), since httpOnly cookies aren't readable by client JS.

### New dependency

- `react-hook-form` — for admin panel forms and seller portfolio editor

### Seller Portfolio tab field mapping (for frontend dev)

Mirror `ascend/src/app/seller/portfolio.js` accordion sections against existing `PATCH /api/seller/portfolio`:

| Section | Fields (body keys) |
|---|---|
| About Your Business | `portfolioAbout` |
| Contact for Buyers | `buyerContactPhone` |
| Factory Location | `address` |
| Company Logo | `logo` (file upload) |
| Factory Photos | files + `removeFactoryPhotos` |
| Cover Image | `coverImage` (file upload) |
| Factory Tour Video | via `POST /portfolio/upload-video` |
| Categories | `categories` (JSON array of IDs) |
| Certifications | `certifications` (JSON array of strings) |
| Factory Details | `factorySize`, `machinesCount`, `employeesCount`, `monthlyCapacity`, `exportPercentage` |
| Business Info | `yearOfEstablishment`, `businessType`, `legalStatus` |

Publish: `POST /api/seller/portfolio/publish` — returns `{ missingFields }` on failure.
Unpublish: `POST /api/seller/portfolio/unpublish`.

---

## Implementation Sequence

| Order | What | Owner | Depends on |
|---|---|---|---|
| 1 | Schema changes (Phase 0) | Backend | — |
| 2 | Backend follow-ups (Phase 8) | Backend | Phase 0 |
| 3 | Seller web login (Phase 1) | Backend | Phase 0 |
| 4 | Admin manufacturer endpoints (Phase 2) | Backend | Phase 0 |
| 5 | Admin buyer endpoints (Phase 3) | Backend | Phase 0 |
| 6 | Admin dashboard endpoints (Phase 4) | Backend | Phases 2-3 |
| 7 | Verification queue endpoints (Phase 5) | Backend | Phase 0 |
| 8 | Seller dashboard stats (Phase 6) | Backend | — |
| 9 | Global search + audit log (Phase 7) | Backend | Phases 2-3 |
| — | Login page + auth plumbing (Phase 9 auth) | Frontend | Phase 1 + 3 |
| — | Admin panel UI (Phase 9 admin/*) | Frontend | Phases 2-7 |
| — | Seller portal UI (Phase 9 seller-portal/*) | Frontend | Phases 1, 6, 8 |

Frontend dev can start on login page + admin shell/components as soon as Phase 1 + 3 endpoints are deployed. Backend phases 2-7 can be parallelized since they're mostly independent controllers.

---

## Verification

- **Backend**: For each new endpoint, test with Postman/curl against the dev server. Verify admin JWT auth works (login → use token → hit protected route). Verify the `blockedUntil`/`isBlacklisted` middleware changes by attempting to login as a blocked user.
- **Frontend**: Start the Next.js dev server, test login flow (admin + seller), verify middleware redirects unauthenticated requests, test manufacturer/buyer list+detail views, test toggle actions.
- **Integration**: Deactivate a manufacturer via admin panel → verify their products disappear from the public product list and portfolio site. Block a buyer → verify they get a 403 on their next API call. Grant verification badge → verify it appears on the public portfolio page.