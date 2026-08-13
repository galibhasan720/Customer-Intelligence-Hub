# SeatFlow — What to do next

**Verified:** 13 Aug 2026 against GitHub issues, PRs, Actions, [Seat-Flow MVP board](https://github.com/users/galibhasan720/projects/6), and this repo.

**Tracker:** 9 issues **open** / 21 **closed**. Closed 13 Aug 2026 after code verify: [#42](https://github.com/galibhasan720/Seat-Flow/issues/42), [#47](https://github.com/galibhasan720/Seat-Flow/issues/47). Board: #40, #42, #47 moved to **Done**.

Auth in this repo is **local JWT + bcrypt**, not Supabase Auth. Treat that as the implemented path unless you decide to switch.

---

## Still open (leftover)

| # | Board | Code | Remaining |
|---|-------|------|-----------|
| [#39](https://github.com/galibhasan720/Seat-Flow/issues/39) audit | Backlog | No inventory doc | Write the inventory, then close |
| [#41](https://github.com/galibhasan720/Seat-Flow/issues/41) auth | Backlog | Register/login/JWT/RBAC/`/users/me` | Customer profile page; forgot-password (or document in-app change only) |
| [#43](https://github.com/galibhasan720/Seat-Flow/issues/43) shell | Backlog | Layout + API client + role nav | Admin route; drop mock fallbacks |
| [#45](https://github.com/galibhasan720/Seat-Flow/issues/45) seats | Backlog | Seat map + holds + DB unique + 409 | Refresh seats on 409; 409 pytest |
| [#48](https://github.com/galibhasan720/Seat-Flow/issues/48) organizer CRUD | Backlog | Backend CRUD + seat gen; [PR #65](https://github.com/galibhasan720/Seat-Flow/pull/65) open | Merge #65; booking-window UI; `myEvents` |
| [#49](https://github.com/galibhasan720/Seat-Flow/issues/49) analytics | Backlog | API + organizer tab | Drop mock chart fallbacks |
| [#50](https://github.com/galibhasan720/Seat-Flow/issues/50) admin | Backlog | Full admin API | Admin UI |
| [#51](https://github.com/galibhasan720/Seat-Flow/issues/51) tests | Backlog | Pytest suite exists | Vitest; CI full pytest |
| [#52](https://github.com/galibhasan720/Seat-Flow/issues/52) deploy | Backlog | Dockerfile + docs | Live Vercel + HF |

---

## Do this next (real leftovers)

### P0

#### 1. Auth leftover — Feature 4 + customer profile ([#41](https://github.com/galibhasan720/Seat-Flow/issues/41))

Specs: [04_authentication-jwt-and-rbac.md](./04_authentication-jwt-and-rbac.md), [05_profile-and-password-reset.md](./05_profile-and-password-reset.md)

Already in code: register/login, JWT header, FastAPI 401, RBAC, `GET`/`PATCH /users/me`, in-app password change, guest discovery.

- [x] Register / login / logout (logout is client-side; `POST /auth/logout` unused)
- [x] Attach JWT; API rejects missing/invalid tokens
- [x] RBAC Guest / Customer / Organizer / Admin
- [x] `GET` / `PATCH /users/me` (organizer profile tab only)
- [ ] Customer-facing profile page
- [ ] Forgot-password UI + email reset (or document “logged-in change password only”)
- [x] Guests can hit public discovery

#### 2. Frontend audit ([#39](https://github.com/galibhasan720/Seat-Flow/issues/39))

Spec: [06_frontend-shell-routing-and-api-client.md](./06_frontend-shell-routing-and-api-client.md)

- [ ] Write a screen inventory: mock / partial / API / missing (Events, seats, booking, dashboard, organizer, venues, admin, auth, notifications)

#### 3. App shell leftover ([#43](https://github.com/galibhasan720/Seat-Flow/issues/43))

- [x] Shared layout + role-aware nav (organizer/admin link)
- [x] Central API client (base URL, JWT, 401 → clear session)
- [ ] Real route groups (or document `App.tsx` view-state as the routing model)
- [ ] Admin shell / route
- [ ] Loading / empty / error without mock fallbacks where API is live

#### 4. Seat 409 UI ([#45](https://github.com/galibhasan720/Seat-Flow/issues/45))

Spec: [10_seat-selection-and-concurrency.md](./10_seat-selection-and-concurrency.md)

- [x] Seat map from live API + selection + hold
- [x] Unique seat constraints + transaction → 409
- [x] VIP vs Standard visible
- [ ] On 409: reload seats and show conflict (today: toast only)
- [ ] Pytest for two users booking the same seat → 409

---

### P1

#### 5. Organizer CRUD — finish PR [#65](https://github.com/galibhasan720/Seat-Flow/pull/65) ([#48](https://github.com/galibhasan720/Seat-Flow/issues/48))

Specs: [08_organizer-event-crud-and-booking-windows.md](./08_organizer-event-crud-and-booking-windows.md), [09_seat-capacity-and-categories.md](./09_seat-capacity-and-categories.md)

CI on #65: **Pytest + Frontend Build both green**. Description still says `Closes #` (empty) — add `Closes #48` before merge if the leftover UI below is done.

- [x] `POST` / `PATCH` / `DELETE /events` + organizer 403
- [x] Seat generate on create (VIP / Standard)
- [x] Closed booking window blocks bookings (backend)
- [ ] Merge PR #65
- [ ] Organizer list uses owned events (`myEvents`), not the public catalog
- [ ] Booking-window toggle in edit UI
- [ ] Capacity change updates seats on PATCH

#### 6. Analytics ([#49](https://github.com/galibhasan720/Seat-Flow/issues/49))

Spec: [13_analytics-dashboard.md](./13_analytics-dashboard.md)

- [x] Aggregate API + organizer widgets + role gating
- [ ] Stop using mock chart data when the API fails / is empty
- [ ] Optional: admin-only dashboard route

#### 7. Tests ([#51](https://github.com/galibhasan720/Seat-Flow/issues/51))

Spec: [15_testing-strategy-unit-and-integration.md](./15_testing-strategy-unit-and-integration.md)

- [x] Pytest suite under `backend/tests/` (auth, bookings, seats, events, admin, analytics)
- [ ] CI: run full `pytest`, not only `tests/test_health.py` ([ci-backend.yml](../.github/workflows/ci-backend.yml))
- [ ] Vitest for frontend helpers (none today; frontend CI is **build only**)
- [ ] Double-book 409 test

#### 8. Deploy ([#52](https://github.com/galibhasan720/Seat-Flow/issues/52))

Spec: [16_deployment-vercel-hf-supabase.md](./16_deployment-vercel-hf-supabase.md)

- [x] Dockerfile, CORS config, env examples, docs
- [ ] Deploy HF Space; verify `/health` + `/health/db`
- [ ] Deploy Vercel with `VITE_API_BASE_URL`
- [ ] Set `CORS_ORIGINS` to the Vercel origin
- [ ] Enable [deploy-production.yml](../.github/workflows/deploy-production.yml) (currently a placeholder)
- [ ] Smoke: guest browse → login → book
- [x] No secrets committed

---

### P2

#### 9. Admin UI ([#50](https://github.com/galibhasan720/Seat-Flow/issues/50))

Spec: [14_admin-governance-and-category-management.md](./14_admin-governance-and-category-management.md)

- [x] Admin API: categories, users, force-cancel bookings, 403 for non-admins
- [ ] Admin panel UI + `api.ts` `/admin/*` methods + nav for `role === "admin"`

---

## PRs

| PR | State | Notes |
|----|-------|--------|
| [#65](https://github.com/galibhasan720/Seat-Flow/pull/65) Crud 02 | **Open** (board: Backlog) | CI green. Wire `Closes #48` (and related leftovers) before merge. |
| [#64](https://github.com/galibhasan720/Seat-Flow/pull/64) Crud 01 | Closed, not merged | Board wrongly shows Done |
| [#63](https://github.com/galibhasan720/Seat-Flow/pull/63) UI/UX | Merged | Done |
| [#61](https://github.com/galibhasan720/Seat-Flow/pull/61) hall overlap 409 | Merged | Done |
| [#59](https://github.com/galibhasan720/Seat-Flow/pull/59) FE/BE integration | Merged | Closed #44 and #46 |

---

## GitHub Actions

| Workflow | Status |
|----------|--------|
| CI Frontend (build) | Passing on PRs / `main` |
| CI Backend | Passing, but **only** `pytest tests/test_health.py` |
| Deploy Staging / Production | Placeholder `workflow_dispatch` — “Deferred until #52” |

---

## Done (closed on GitHub)

| Feature / work | GitHub |
|----------------|--------|
| Feature 0 — FastAPI MVC scaffolding | [#55](https://github.com/galibhasan720/Seat-Flow/issues/55) |
| Feature 1 — Schema | [#40](https://github.com/galibhasan720/Seat-Flow/issues/40) |
| OpenAPI contract | [#42](https://github.com/galibhasan720/Seat-Flow/issues/42) |
| Feature 5 — Event discovery | [#44](https://github.com/galibhasan720/Seat-Flow/issues/44) |
| Features 9–11 — Booking lifecycle | [#46](https://github.com/galibhasan720/Seat-Flow/issues/46) |
| Feature 12 — Notifications | [#47](https://github.com/galibhasan720/Seat-Flow/issues/47) |
| CI workflows created | [#37](https://github.com/galibhasan720/Seat-Flow/issues/37) |
| CONTRIBUTING + PR template | [#38](https://github.com/galibhasan720/Seat-Flow/issues/38) |
| Env bootstrap + `/health` | [#36](https://github.com/galibhasan720/Seat-Flow/issues/36) |
| Local tools + cloud accounts | [#35](https://github.com/galibhasan720/Seat-Flow/issues/35) |
| Epic — Features 0–15 order | [#56](https://github.com/galibhasan720/Seat-Flow/issues/56) |
| Docs — BA, PRD, SRS, TDD | [#2](https://github.com/galibhasan720/Seat-Flow/issues/2)–[#5](https://github.com/galibhasan720/Seat-Flow/issues/5) |
| Early setup | [#16](https://github.com/galibhasan720/Seat-Flow/issues/16), [#27](https://github.com/galibhasan720/Seat-Flow/issues/27)–[#31](https://github.com/galibhasan720/Seat-Flow/issues/31) |

---

## How to work one leftover

1. Use the **unchecked** boxes above (checked = already in code).
2. Demo, then close GitHub with `Closes #N` on the PR.
3. Move the [project board](https://github.com/users/galibhasan720/projects/6) card to **Done**.
4. Tick the box in this file.
