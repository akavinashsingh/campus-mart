# CampusMart UI Refresh

A site-wide visual rebuild of the user-facing UI. Style: **Vibrant + Block-based marketplace** with glassmorphism hero, bento grids, and a purple/green palette. No build step — Tailwind via CDN, layered on top of existing Bootstrap. All Express routes, controllers, and Mongoose schemas were left untouched.

Run the server normally (`npm start`) — nothing in the runtime contract changed.

---

## Design tokens

Defined as both Tailwind theme extensions and CSS custom properties in `views/layouts/boilerplate.ejs`, mirrored in `public/css/style.css` for legacy/admin pages.

| Role        | Token            | Hex       |
|-------------|------------------|-----------|
| Primary     | `--cm-primary`   | `#7C3AED` |
| Secondary   | `--cm-secondary` | `#A78BFA` |
| CTA         | `--cm-cta`       | `#22C55E` |
| Background  | `--cm-bg`        | `#FAF5FF` |
| Heading text| `--cm-text`      | `#4C1D95` |
| Body text   | `--cm-ink`       | `#1F1147` |
| Muted text  | `--cm-muted`     | `#6B5B95` |
| Border      | `--cm-border`    | `#E9D5FF` |

Typography: **Rubik** (display / headings) + **Nunito Sans** (body), loaded from Google Fonts with `display=swap`.

Shared utility classes: `.cm-glass`, `.cm-gradient`, `.cm-gradient-soft`, `.cm-blob`, `.cm-pill`, `.cm-dot`, `.cm-card`, `.cm-info-card`, `.cm-btn-action(-primary|-cta|-ghost)`, `.cm-input`, `.cm-label`, `.cm-focus`.

---

## Files changed

### Layout & shared partials
- **views/layouts/boilerplate.ejs** — Tailwind CDN + theme extension, Google Fonts (Rubik, Nunito Sans), CSS variables for the new palette, global `prefers-reduced-motion` reset. Theme-color meta updated to `#7C3AED`.
- **views/includes/navbar.ejs** — Sticky glass navbar with always-visible search on desktop, separate mobile search row, hamburger that opens a slide-in drawer with focus-trapped a11y, Login/Sign-up CTAs, avatar dropdown, primary "List item" CTA in CTA green.
- **views/includes/footer.ejs** — 4-col footer with newsletter, marketplace shortcuts, help links, gradient glow.
- **views/includes/flash.ejs** — Animated flash banner with dismiss button, success/error variants using palette greens/reds.
- **views/includes/_auth-styles.ejs** — New shared style partial for the four auth pages (split-screen glass).

### Marketplace
- **views/products/index.ejs** — Glass hero + popular-search chips + category bento (Books, Electronics, Sports, Furniture). Sticky desktop filter sidebar (purple-themed range slider). Mobile filters live in a slide-up bottom-sheet with grip handle and `Esc`/scrim/close handling. New `.cm-card` listing grid: bigger imagery, condition-color tokens, view counter pill, seller chip.
- **views/products/show.ejs** — Bigger gallery card with arrow nav + horizontal thumbnail strip; condition-color badges; price block as a gradient card; 3-stat row (views, location, contact); verified-seller card with "Profile" link; CTAs for **Chat with seller**, **Make an offer** (only when negotiable), **Save** (with optimistic toggle); restyled comments with avatars; restyled contact + offer modals.
- **views/products/new.ejs** — 3-step listing flow (Basics → Pricing → Photos) with progress pills. Photos step is a real drag-and-drop dropzone with thumbnail previews, per-tile remove, 5-image cap. Live preview card on the right updates with title/category/condition/price/discount/first photo as you type.
- **views/products/edit.ejs** — Same single-page form structure, dropzone for adding more images, live preview card, existing images shown as thumbnails.

### Auth (split-screen glass)
- **views/users/login.ejs** — Brand panel left (gradient + bullets), form right.
- **views/users/signup.ejs** — Same shell, signup-specific bullets.
- **views/users/forgot-password.ejs** — Same shell, amber/violet brand blobs.
- **views/users/reset-password.ejs** — Same shell, password-strength hint.
- **views/admin/login.ejs** — Same shell with darker (admin) gradient and shield icon.

### User dashboard
- **views/users/profile.ejs** — Header card with avatar, verified badge, contact meta. **Bento stat grid** (Total / Active / Sold / Views) with per-tile gradients. 3 quick-link cards (Sell, Saved, Analytics). Pill tabs (All / Active / Sold) rendering `.cm-mini-card` listings via the existing `/api/my-products` endpoint. Edit Profile modal restyled.
- **views/users/public-profile.ejs** — Header card + listings grid using the same `.cm-card` pattern as the marketplace.
- **views/users/saved-items.ejs** — Hero pill + listings grid + empty state with broken-heart art and CTA back to marketplace.

### Errors & misc
- **views/error.ejs** — Friendly illustrated card with status code, dynamic title (404 / 403 / generic), gradient blobs, "Back to marketplace" + "Go back" CTAs, support contact.

### Admin
- **views/admin/login.ejs** — Rebuilt in the new split-screen glass shell.
- **views/admin/dashboard.ejs**, **users.ejs**, **products.ejs**, **user-detail.ejs** — Layout untouched; instead, a **global polish layer** was appended to `public/css/style.css` so legacy Bootstrap atoms (`.card`, `.btn-primary`, `.bg-dark`, `.bg-primary` headers, `.table`, `.dropdown-menu`, `.modal-content`, `.alert`, `.form-control`, `.nav-pills`) inherit the new palette and rounded geometry without touching the EJS markup. Scoped via `:not([class*="cm-"])` so the new components are unaffected.

### Helper additions
- **scripts/check-templates.js** — Compile-only validator for every `.ejs` file under `views/`. Run via `node scripts/check-templates.js`. Exits non-zero on EJS syntax errors. All 24 templates pass.
- **design-system/campusmart/MASTER.md** — Persisted by the `ui-ux-pro-max` skill at the start of the run as the authoritative design-system reference.
- **public/css/style.css** — Appended a "CampusMart 2026" section at the bottom with the polish layer described above. Existing rules above untouched.

---

## Smoke-test results

Server booted on port 3917, MongoDB reachable, hit with curl:

| Route                      | Status | Notes                          |
|----------------------------|--------|--------------------------------|
| `/`                        | 200    | redirects to `/products`       |
| `/products`                | 200    | marketplace hero + grid        |
| `/login`                   | 200    | split-screen glass             |
| `/signup`                  | 200    | split-screen glass             |
| `/forgot-password`         | 200    | split-screen glass             |
| `/products/new`            | 200    | (auth-gated → login render)    |
| `/profile`                 | 302    | redirect to login (correct)    |
| `/saved-items`             | 302    | redirect to login (correct)    |
| `/admin/login`             | 200    | dark-gradient split-screen     |
| `/admin`                   | 302    | redirect to admin login        |
| `/nonexistent-route-test`  | 404    | new illustrated error page     |
| `/reset-password/abc123`   | 404    | invalid token → error page     |

All EJS templates pass `node scripts/check-templates.js` (24/24).

---

## What was *not* changed (intentional)

- Express routes, controllers, validators, Joi schemas, Mongoose models.
- Multer / Cloudinary upload pipeline (the new dropzone writes into the same hidden `<input type="file" name="product[images]">` it already used).
- Save / contact / offer endpoints — the new buttons call the same `/products/:id/save` and `/products/:id/contact` URLs.
- Real-time admin notifications (Socket.IO).
- SEO meta, structured data, and the `/sitemap.xml` route.
- Bootstrap and FontAwesome are still loaded — the new layer is *additive*. Existing modal triggers (`data-bs-toggle="modal"`) still work.

---

## Review checklist for you

- Browse the marketplace at `/products` — hero + bento + filter sidebar + bottom-sheet on mobile.
- Open any product to see the new gallery + Save/Chat/Offer flow.
- Try `/products/new` (logged in) — drag-and-drop a few photos, watch the live preview update.
- Login + signup pages should feel like a real product, not a Bootstrap default.
- `/profile` shows the bento dashboard with stats and the My Listings tabs.
- Admin pages keep their layout but now wear the new palette (cards, buttons, table headers).
- Test responsive at 375 / 768 / 1024 / 1440 px.

If anything feels off, the per-page styles are inline in the EJS files (search for `<style>` near the bottom of each), so they're easy to tweak.
