# Frontend Runtime Error Fixes

> Generated: 2026-06-15 | Applies to `apps/frontend/`

## 🔴 Critical: Missing `@gamers-sg/database` Dependency

**5 files** import `Role` from `@gamers-sg/database`, but the frontend `package.json` does NOT list it as a dependency. With pnpm's strict resolution, the module will not resolve at build time.

**Fix:** Import `Role` from `@gamers-sg/shared/enums` instead — the shared package re-exports all Prisma enums, and this is the documented convention per `CLAUDE.md`.

### Files to change

| File | Line |
|---|---|
| `apps/frontend/src/lib/auth-context.tsx` | 13 |
| `apps/frontend/src/lib/auth.ts` | 2 |
| `apps/frontend/src/components/dashboard/role-badge.tsx` | 1 |
| `apps/frontend/src/components/dashboard/welcome-card.tsx` | 6 |
| `apps/frontend/src/app/(dashboard)/profile/page.tsx` | 6 |

**Before:**
```typescript
import type { Role } from "@gamers-sg/database";
```

**After:**
```typescript
import type { Role } from "@gamers-sg/shared/enums";
```

---

## 🟠 Medium #1: 401 Interceptor Fires on Public Auth Endpoints

**File:** `apps/frontend/src/lib/api-client.ts` ~line 56

The response interceptor attempts token refresh for **any** 401 response. But `/auth/magic-link/request` and `/auth/magic-link/verify` can legitimately return 401 (invalid email, expired token, etc.). When those 401s get intercepted, the refresh attempt fails (no cookie yet), redirects to `/login`, and the original error-message toast in the calling component is swallowed.

**Fix:** Add a guard before the refresh logic:

```typescript
// Insert after line 60 (after the "/auth/refresh" check):

      // Don't refresh for public auth endpoints (they return 401 legitimately)
      const PUBLIC_ENDPOINTS = ["/auth/magic-link/request", "/auth/magic-link/verify"];
      if (PUBLIC_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep))) {
        return Promise.reject(error);
      }
```

---

## 🟠 Medium #2: `router.push()` Called During Render

**Files:**
- `apps/frontend/src/app/(auth)/login/page.tsx` ~line 18
- `apps/frontend/src/app/(auth)/verify/page.tsx` ~line 43

Calling `router.push()` directly in the render path is a React anti-pattern — it causes issues with concurrent rendering and StrictMode (double-invocation). Move it into `useEffect`.

### Login page (`login/page.tsx`)

**Before:**
```tsx
import { useState } from "react";
// ...
export default function LoginPage() {
  // ...
  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }
```

**After:**
```tsx
import { useState, useEffect } from "react";
// ...
export default function LoginPage() {
  // ...
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }
```

### Verify page (`verify/page.tsx`)

**Before:**
```tsx
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }
```

**After:**
```tsx
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }
```

---

## 🟡 Low #1: `prompt()` Cancel Sends `null` as `reason`

**File:** `apps/frontend/src/components/admin/user-management-table.tsx` ~line 70

When suspending a user, `prompt()` returns `null` on cancel. This sends `{ status: "SUSPENDED", reason: null }` to the backend. The DTO expects `reason?: string` — `null` is not `string | undefined` and may cause a 400 error depending on validation config.

**Before:**
```typescript
const reason =
  status === "SUSPENDED"
    ? prompt("Reason for suspension:")
    : undefined;
```

**After:**
```typescript
const reason =
  status === "SUSPENDED"
    ? (prompt("Reason for suspension:") || undefined)
    : undefined;
```

---

## 🟡 Low #2: No Feedback When Rejection Reason Prompt Cancelled

**File:** `apps/frontend/src/components/admin/organiser-review-table.tsx` ~line 144

When admin clicks "Reject" then cancels the reason prompt, nothing happens — no toast, no feedback. The backend requires a rejection reason.

**Before:**
```typescript
onClick={() => {
  const reason = prompt("Rejection reason:");
  if (reason) handleReview(org.userId, "REJECT", reason);
}}
```

**After:**
```typescript
onClick={() => {
  const reason = prompt("Rejection reason:");
  if (!reason) {
    toast.error("Rejection reason is required");
    return;
  }
  handleReview(org.userId, "REJECT", reason);
}}
```

---

## Notes

- The `useSearchParams()` in `verify/page.tsx` should ideally be wrapped in a `<Suspense>` boundary for optimal Next.js 15 behavior, but this is a performance optimization (not a runtime crash) and can be deferred.
- The build was not verified on this device (database is on another machine) — run `pnpm --filter @gamers-sg/frontend build` after applying to confirm.
