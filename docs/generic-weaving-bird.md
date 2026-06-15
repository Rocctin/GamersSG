# Gamers.SG Phase 1 Implementation Plan — Progress Snapshot

## Status Summary

| Phase | Status | Notes |
|---|---|---|
| Steps 1–4 (Scaffold + Shared) | ✅ Done | All config + packages written |
| Steps 5–12 (Backend) | ✅ Done | All NestJS modules/controllers/services/guards written |
| Steps 13–15 (Frontend core) | ✅ Done | Scaffold, auth pages, API client, auth context, hooks — all written |
| Steps 16 (Layout) | ✅ Done | layout.tsx, dashboard-layout.tsx, header.tsx, sidebar.tsx — all written |
| Steps 17 (Dashboard pages) | ✅ Done | dashboard, profile, settings pages + welcome-card, role-badge components |
| Steps 18 (Admin pages) | ✅ Done | admin overview, users, organisers, audit-logs pages + review & user tables |
| Step 19 (Setup script) | ✅ Done | `scripts/dev-setup.sh` created |
| `pnpm install` | ✅ Done | `pnpm-lock.yaml` exists. 499 packages installed. |
| `pnpm.onlyBuiltDependencies` | ✅ Configured | Prisma, esbuild, sharp build scripts approved via `package.json` |
| Prisma generate | ✅ Done | Prisma Client generated successfully |
| PostgreSQL | ❌ Not installed | User needs to install locally |
| Prisma db:push / db:seed | ❌ Not run | Depends on PostgreSQL |
| End-to-end verification | ❌ Not run | Depends on PostgreSQL + db:seed |

---

## What Must Be Done Next (In Order)

### 🔴 Remaining Blocker

1. **PostgreSQL Setup** — Install PostgreSQL, create a database `gamers_sg`, and update `apps/backend/.env` with the correct `DATABASE_URL`. Once ready:
   ```
   pnpm db:push
   pnpm db:seed
   ```

### 🟢 Polish

2. **End-to-end verification** — Once PostgreSQL is running:
   - Start backend: `pnpm --filter @gamers-sg/backend dev` (should start on :3000)
   - Start frontend: `pnpm --filter @gamers-sg/frontend dev` (should start on :3001)
   - Test login flow: POST email → check console for magic link → click verify → redirect to dashboard
   - Test admin: Login as seeded ADMIN → approve/reject organisers

---

## Files Completed This Session

| File | Action | Details |
|---|---|---|
| `apps/frontend/src/components/layout/header.tsx` | 🐛 Fixed | Added missing `useState` import; removed stray corrupted import at EOF |
| `apps/frontend/src/components/layout/sidebar.tsx` | ✨ Created | Role-based nav with active highlighting, admin-only section, user footer |
| `apps/frontend/src/app/(dashboard)/dashboard/page.tsx` | ✨ Created | Welcome card + quick links grid |
| `apps/frontend/src/app/(dashboard)/profile/page.tsx` | ✨ Created | Account info, gamer profile, organiser profile cards |
| `apps/frontend/src/app/(dashboard)/settings/page.tsx` | ✨ Created | Notification toggles, security info, appearance placeholder |
| `apps/frontend/src/components/dashboard/welcome-card.tsx` | ✨ Created | Role-aware banner with stats grid (gamer/organiser/admin variants) |
| `apps/frontend/src/components/dashboard/role-badge.tsx` | ✨ Created | Color-coded pill badge: GAMER=blue, ORGANISER=purple, ADMIN=orange |
| `apps/frontend/src/app/(dashboard)/admin/layout.tsx` | ✨ Created | Admin role guard + audit warning banner |
| `apps/frontend/src/app/(dashboard)/admin/page.tsx` | ✨ Created | Admin overview with 3 management cards |
| `apps/frontend/src/app/(dashboard)/admin/users/page.tsx` | ✨ Created | User management page with search table |
| `apps/frontend/src/app/(dashboard)/admin/organisers/page.tsx` | ✨ Created | Pending organiser review page |
| `apps/frontend/src/app/(dashboard)/admin/audit-logs/page.tsx` | ✨ Created | Immutable audit log viewer with pagination |
| `apps/frontend/src/components/admin/user-management-table.tsx` | ✨ Created | Table with search, suspend/reinstate, pagination |
| `apps/frontend/src/components/admin/organiser-review-table.tsx` | ✨ Created | Table with approve/reject workflow + rejection reason prompt |
| `apps/backend/.env` | ✨ Created | Dev environment variables (DATABASE_URL, JWT_SECRET, etc.) |
| `apps/frontend/.env.local` | ✨ Created | NEXT_PUBLIC_API_URL pointing to backend |
| `scripts/dev-setup.sh` | ✨ Created | One-command dev environment bootstrap script |
| `package.json` | 🔧 Updated | Added `pnpm.onlyBuiltDependencies` for Prisma/esbuild/sharp |

---

## Files With Known Bugs

| File | Issue | Fix |
|---|---|---|
| *(none)* | All known bugs resolved | — |

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

**`apps/backend/.env`** (created, update DATABASE_URL if needed):
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gamers_sg
JWT_SECRET=dev-jwt-secret-change-in-production-0123456789abcdef0123456789abcdef
RESEND_API_KEY=re_placeholder
FRONTEND_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
```

**`apps/frontend/.env.local`** (created):
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
Done. The plan file now accurately reflects current reality:

- Status table - all Steps 13â19 marked â Done, pnpm install â Done, Prisma generate â Done
- Known bugs - cleared (was just the header.tsx stray import, now fixed)
- Remaining blocker - only PostgreSQL + db:push/db:seed remain
- New section - "Files Completed This Session" table documents all 18 file actions from this session
- Additional - the audit-logs admin page (not in the original plan) is included, and pnpm.onlyBuiltDependencies config is noted