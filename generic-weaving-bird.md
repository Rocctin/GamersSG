# Gamers.SG Phase 1 Implementation Plan — Progress Snapshot

## Status Summary

| Phase | Status | Notes |
|---|---|---|
| Steps 1–4 (Scaffold + Shared) | ✅ Done | All config + packages written |
| Steps 5–12 (Backend) | ✅ Done | All NestJS modules/controllers/services/guards written |
| Steps 13–15 (Frontend core) | ⚠️ Partial | Scaffold, auth pages, API client done. Sidebar missing, header has a bug |
| Steps 16 (Layout) | ⚠️ Partial | layout.tsx, dashboard-layout.tsx, header.tsx exist. `sidebar.tsx` MISSING. header.tsx has corrupted ending |
| Steps 17 (Dashboard pages) | ❌ Not started | |
| Steps 18 (Admin pages) | ❌ Not started | |
| Step 19 (Setup script) | ❌ Not started | |
| `pnpm install` | ❌ Not run | No `pnpm-lock.yaml` exists. Needs to be run before anything compiles. |
| PostgreSQL | ❌ Not installed | Step 3 — user needs to install locally |
| Prisma generate/migrate | ❌ Not run | Depends on PostgreSQL + pnpm install |

---

## What Must Be Done Next (In Order)

### 🔴 Blockers — Must Resolve First

1. **Fix `header.tsx`** — The file ends with a duplicate/corrupted import: `import { useState as useStateReact } from "react";` at the very bottom. This needs to be deleted (line ~130).

2. **`pnpm install`** — No lockfile exists. Dependencies were never installed. After fixing header.tsx, run:
   ```
   pnpm install
   ```

3. **PostgreSQL Setup** — User must install PostgreSQL, create a database `gamers_sg`, and update `apps/backend/.env` with the correct `DATABASE_URL`. Once ready:
   ```
   pnpm db:push
   pnpm db:generate
   pnpm db:seed
   ```

### 🟡 Frontend — Complete Missing Files

4. **Create `sidebar.tsx`** — `apps/frontend/src/components/layout/sidebar.tsx` is missing (was never written). Role-based nav links for GAMER, ORGANISER, ADMIN.

5. **Create dashboard pages** (Step 17):
   - `apps/frontend/src/app/(dashboard)/dashboard/page.tsx`
   - `apps/frontend/src/app/(dashboard)/profile/page.tsx`
   - `apps/frontend/src/app/(dashboard)/settings/page.tsx`
   - `apps/frontend/src/components/dashboard/welcome-card.tsx`
   - `apps/frontend/src/components/dashboard/role-badge.tsx`

6. **Create admin pages** (Step 18):
   - `apps/frontend/src/app/(dashboard)/admin/layout.tsx`
   - `apps/frontend/src/app/(dashboard)/admin/page.tsx`
   - `apps/frontend/src/app/(dashboard)/admin/organisers/page.tsx`
   - `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`
   - `apps/frontend/src/components/admin/organiser-review-table.tsx`
   - `apps/frontend/src/components/admin/user-management-table.tsx`

### 🟢 Polish

7. **Create `scripts/dev-setup.sh`** — One-command dev environment setup script.

8. **End-to-end verification** — Once PostgreSQL is running:
   - Start backend: `pnpm --filter @gamers-sg/backend dev` (should start on :3000)
   - Start frontend: `pnpm --filter @gamers-sg/frontend dev` (should start on :3001)
   - Test login flow: POST email → check console for magic link → click verify → redirect to dashboard
   - Test admin: Login as seeded ADMIN → approve/reject organisers

---

## Files With Known Bugs

| File | Issue | Fix |
|---|---|---|
| `apps/frontend/src/components/layout/header.tsx` | Ends with `import { useState as useStateReact } from "react";` on a line after the component | Delete the stray import at the bottom of the file |

---

## Design System (SCOGA Dark Theme)

All components should use these Tailwind classes:

- **Background**: `bg-surface-950` (#0a0a1a)
- **Cards**: `bg-surface-900 border border-surface-800 rounded-xl`
- **Primary/Accent**: `bg-brand-500` / `text-brand-500` (#f97316 orange)
- **Text**: `text-slate-100` (headings), `text-slate-300` (body), `text-slate-400` (muted)
- **Buttons**: `bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg`
- **Inputs**: `bg-surface-800 border border-surface-700 rounded-lg text-slate-100 focus:border-brand-500`

The existing `globals.css`, `page.tsx` (landing), `login/page.tsx`, `verify/page.tsx`, and layout components all follow this system. New pages must match.

---

## Environment Variables

**`apps/backend/.env`** (already written, update DATABASE_URL):
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gamers_sg
JWT_SECRET=dev-jwt-secret-change-in-production-0123456789abcdef0123456789abcdef
RESEND_API_KEY=re_placeholder
FRONTEND_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
```

**`apps/frontend/.env.local`** (already written):
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
