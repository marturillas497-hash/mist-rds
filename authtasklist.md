# MIST RDS — Adviser Auth Migration Task List

## Database

- [ ] Add `status` column to `public.profiles` — `text`, default `'active'`, values: `active | pending | rejected`
- [ ] Add `email` column to `public.profiles` — `text`, nullable (for adviser display)
- [ ] Backfill existing student + admin profiles with `status = 'active'`
- [ ] Leave `research_advisers` table as-is for now — deprecate after new flow is stable

---

## Registration page (`app/register/page.js`)

- [ ] Add toggle: "Register as Student" / "Register as Adviser"
- [ ] Adviser form fields: full name, department, email, password
- [ ] On submit (adviser): create auth account + `profiles` row with `role = 'research_adviser'`, `status = 'pending'`
- [ ] Show "Your account is pending admin approval." message after adviser registers — no redirect to dashboard
- [ ] Student registration stays exactly as-is

---

## Login + Middleware (`middleware.js`)

- [ ] After successful auth, check `profiles.status`
- [ ] If `status = 'pending'` → sign out immediately, redirect to `/login?error=pending`
- [ ] If `status = 'rejected'` → sign out immediately, redirect to `/login?error=rejected`
- [ ] If `status = 'active'` and `role = 'research_adviser'` → redirect to `/adviser`
- [ ] If `status = 'active'` and `role = 'student'` → redirect to `/dashboard`
- [ ] Show appropriate error message on login page for `?error=pending` and `?error=rejected`

---

## Admin — Pending Approvals (`app/admin/approvals/page.js`)

- [ ] New page listing all profiles where `status = 'pending'` and `role = 'research_adviser'`
- [ ] Show: full name, department, email, date registered
- [ ] "Approve" button → sets `status = 'active'`
- [ ] "Reject" button → sets `status = 'rejected'` (or deletes auth user + profile entirely — decide)
- [ ] Add link to this page from admin dashboard (`/admin`)
- [ ] Show pending count badge on admin dashboard nav if any pending exist

---

## Admin — Approvals API

- [ ] `GET /api/admin/approvals` — returns profiles where `status = 'pending'` and `role = 'research_adviser'`
- [ ] `PATCH /api/admin/approvals/[id]` — sets `status = 'active'` (approve) or `'rejected'` (reject), `requireAdmin` guard
- [ ] `DELETE /api/admin/approvals/[id]` — deletes auth user + profile row entirely (optional hard reject), `requireAdmin` guard

---

## Registration API (`app/api/register/route.js`)

- [ ] Handle adviser registration: insert `profiles` row with `role = 'research_adviser'`, `status = 'pending'`, `email` field populated
- [ ] Return a clear response so the frontend can show the pending message

---

## Admin Advisers page (`app/admin/advisers/page.js`)

- [ ] Update list to read from `profiles` where `role = 'research_adviser'` and `status = 'active'` instead of `research_advisers` table
- [ ] Remove the old "Add Adviser" form (advisers now self-register)
- [ ] Keep the Remove button — on remove, set `status = 'rejected'` or delete auth user

---

## Phase 5 — Adviser Dashboard (`app/adviser/page.js`)

- [ ] Scaffold page: list of students assigned to the logged-in adviser
- [ ] Show each student's similarity check history with risk badges
- [ ] New route: `GET /api/adviser/students` — returns profiles where `adviser_id = logged-in adviser's id`
- [ ] `requireAdviser` guard already scaffolded in `lib/api-auth.js` — wire it up

---

## research_advisers deprecation (do last)

- [ ] Confirm all advisers have re-registered via the new flow
- [ ] Re-point `profiles.adviser_id` from `research_advisers.id` → new `profiles.id` for affected students
- [ ] Drop `research_advisers` table
- [ ] Add DB CHECK constraint: `adviser_id` must point to a profile where `role = 'research_adviser'`

---

## Order to build

1. Database migration (status + email columns)
2. Registration page toggle + adviser submit
3. Registration API
4. Middleware status check + redirects
5. Login page error messages
6. Admin approvals page + API
7. Admin advisers page update
8. Phase 5 adviser dashboard
9. research_advisers deprecation