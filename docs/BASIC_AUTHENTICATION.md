---
title: "Technical PRD — Basic Authentication + Sessions (v1) with Path to JWT/OAuth2"
owner: "QuizMaker"
status: "Draft"
last_updated: "2026-03-31"
---

## Summary
Implement **sign-up**, **login**, **logout**, and **basic session management** to support tying MCQ attempts to a real user. This is the minimal secure foundation for the app, with a modular structure that can evolve to **JWT** or **OAuth2** later.

This PRD owns the `user` table and session mechanism. MCQ CRUD/attempt features must treat authentication as a dependency and only require a “current user id”.

## Goals
- Provide a secure **User** model:
  - `id`, `first_name`, `last_name`, `username`, `email`, `password_hash`
- Provide **Sign-up** form:
  - Validates input
  - Hashes password before storage
- Provide **Login** form:
  - Verifies credentials against stored hash
- Provide **Session management (v1)**:
  - Establish user identity across requests
  - Support logout
- Keep the system modular so we can later replace the session approach with **JWT** or **OAuth2** without rewriting MCQ features.

## Why this is required for MCQs
- Each MCQ “take” is an **attempt** that must be recorded against a **user id**.
- Therefore, MCQ features must be able to call `requireUser()` and receive a stable `user.id` for `attempt.user_id`.

## Non-goals (Phase 1)
- SSO / OAuth providers (Google/Microsoft)
- Password reset / email verification
- MFA, CAPTCHA, device tracking
- Roles/permissions beyond basic “logged-in user”
- Full-blown auth framework adoption (we can adopt later if desired)

## Assumptions
- App runs on **Next.js App Router** deployed to **Cloudflare Workers** via OpenNext.
- Persistence is **Cloudflare D1 (SQLite)**.
- Phase 1 will store sessions in D1 (recommended) or signed cookies (alternative). See Session Design.

## User Stories
- As a new user, I can sign up with name, username, email, and password.
- As a returning user, I can log in with username or email + password.
- As a logged-in user, I stay logged in across page navigation and refreshes.
- As a logged-in user, I can log out and my session is invalidated.

## UX / Screens
### Sign-up
- **Route**: `app/(auth)/signup/page.tsx`
- Fields:
  - First name (required)
  - Last name (required)
  - Username (required, unique)
  - Email (required, unique)
  - Password (required)
  - Confirm password (required)
- Success:
  - Create user
  - Create session
  - Redirect to MCQ listing

### Login
- **Route**: `app/(auth)/login/page.tsx`
- Fields:
  - Username or Email
  - Password
- Success:
  - Create session
  - Redirect to MCQ listing

### Logout
- **Route/UI**:
  - A Logout button in an app header/menu (route TBD)
  - Calls a server action to invalidate session and clear cookie

## Data Model (Authentication)
### `user` (owned by this PRD)
- `id` (TEXT, PK)
- `first_name` (TEXT, NOT NULL)
- `last_name` (TEXT, NOT NULL)
- `username` (TEXT, NOT NULL, UNIQUE)
- `email` (TEXT, NOT NULL, UNIQUE)
- `password_hash` (TEXT, NOT NULL)
- `created_at` (INTEGER, NOT NULL)
- `updated_at` (INTEGER, NOT NULL)

### `session` (recommended for v1)
- `id` (TEXT, PK) — session identifier (opaque)
- `user_id` (TEXT, NOT NULL, FK → `user.id`)
- `expires_at` (INTEGER, NOT NULL) — unix epoch ms
- `created_at` (INTEGER, NOT NULL)
- `revoked_at` (INTEGER, NULL)
- `ip_hash` (TEXT, NULL) — optional
- `user_agent_hash` (TEXT, NULL) — optional

Indexes:
- `session(user_id)`
- `session(expires_at)`

## Password Storage & Verification
### Hash algorithm (Phase 1 recommendation)
- Use a modern password hashing algorithm:
  - **Preferred**: `argon2id`
  - **Fallback**: `bcrypt`
- Store only the **hash string** (including parameters/salt as encoded by the library).

### Signup input rules (initial)
- `username`: 3..30 chars, lowercase normalization recommended, allowed chars `[a-z0-9._-]` (tunable)
- `email`: must be valid email format, lowercase normalization recommended
- `first_name` / `last_name`: 1..80 chars
- Password:
  - min length 8
  - confirmation must match

### Validation
- Minimum password requirements (initial):
  - length >= 8 (tunable)
  - optionally require complexity later (out of scope)

### Security rules
- Never log plaintext passwords.
- Rate-limit login attempts (Phase 1: basic throttling; may be per-IP, see constraints on Cloudflare Workers).
- Use generic error messages (“Invalid credentials”) to prevent account enumeration.

## Session Management (v1)
### Approach A (recommended): DB-backed sessions + HttpOnly cookie
- On login/signup:
  - Create a `session` row
  - Set cookie `qm_session` = session id
    - `HttpOnly; Secure; SameSite=Lax; Path=/`
    - Add `Max-Age` aligned to expiration
- On each request needing auth:
  - Read cookie
  - Look up session in D1
  - Validate not revoked and not expired
  - Resolve `currentUserId`
- On logout:
  - Mark session revoked (or delete row)
  - Clear cookie

### Approach B (alternative): Signed session cookie (no DB session table)
- Store user id + expiry in a signed cookie.
- Pros: fewer DB reads
- Cons: revocation harder; rotation/invalidations more complex
- Phase 1 recommendation remains Approach A for clarity and auditability.

## Authorization Boundaries (modularity requirement)
### Contract exposed to other features (MCQ PRD)
Provide a small API surface:
- `getCurrentUser()` → `{ id, username, email, firstName, lastName } | null`
- `requireUser()` → same but throws/redirects if not logged in

### Where it is used
- MCQ “create attempt” must call `requireUser()` and write `attempt.user_id = user.id`.

MCQ code should **never** query passwords/sessions directly; it should only call the above.

## Server-Side Interfaces (initial proposal)
Prefer **Server Actions** for form submissions.

### Services (suggested)
- `src/lib/services/auth-service.ts`
  - `signUp(input)`
  - `login(input)`
  - `logout()`
  - `getCurrentUser()`
- `src/lib/services/user-service.ts`
  - `getUserByUsernameOrEmail(identifier)`
  - `createUser(userInput)`

### D1 access
All D1 access goes through `lib/d1-client.ts` (prepared statements, placeholder normalization).

## Edge Cases
- Username/email uniqueness conflicts
- Password mismatch on sign-up
- Expired/revoked session → redirect to login
- Multiple sessions per user allowed (Phase 1) vs single-session only (decision)

## Acceptance Criteria
- A new user can sign up and is immediately logged in.
- An existing user can log in with correct credentials; incorrect creds return a generic error.
- Authenticated state persists via session cookie.
- Logout invalidates the session and user becomes unauthenticated.
- MCQ attempt creation can reliably associate `attempt.user_id` with the current user.

## Future: JWT / OAuth2 Migration Path
- Keep auth boundary behind `getCurrentUser()/requireUser()`.
- Introduce token issuance/verification later without changing MCQ services/routes.
- If adopting OAuth2:
  - add `oauth_account` table (provider, provider_user_id, user_id, tokens)
  - keep `user` as core identity record

## Open Questions / Decisions Needed
- **Identifier for login**: username only vs username/email.
- **Session duration**: e.g., 7 days vs 30 days; sliding vs fixed expiration.
- **Single vs multi-session**: should logging in revoke prior sessions?
- **Rate limiting**: what’s acceptable in v1 given Worker constraints?
