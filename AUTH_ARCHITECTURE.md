# Authentication Architecture

## System Overview

The QuizMaker authentication system is built on Cloudflare Workers with D1 database, Next.js App Router, and server-side session management.

## Architecture Layers

### 1. Database Layer (`src/lib/d1-client.ts`)
**Purpose:** Centralized D1 database access with type safety

**Key Functions:**
- `getDatabase()` - Resolves D1 binding from Cloudflare context
- `executeQuery()` - Execute SELECT queries
- `executeQueryFirst()` - Execute SELECT and return first row
- `executeMutation()` - Execute INSERT/UPDATE/DELETE
- `normalizePlaceholders()` - Converts `?` to `?1`, `?2` for D1

**Binding Configuration:**
- Binding name: `quizmaker_database`
- Configured in: `wrangler.jsonc`
- Type-safe via: `CloudflareEnv` interface

### 2. Service Layer

#### Password Service (`src/lib/services/password-service.ts`)
- `hashPassword()` - Bcrypt hashing with 12 rounds
- `verifyPassword()` - Password verification

#### Session Service (`src/lib/services/session-service.ts`)
- `createSession()` - Create new session
- `getSessionById()` - Retrieve session
- `revokeSession()` - Invalidate session
- `isSessionActive()` - Check expiration and revocation
- Session TTL: 7 days

#### User Service (`src/lib/services/user-service.ts`)
- `createUser()` - Insert new user
- `getUserById()` - Fetch by ID
- `getUserByUsernameOrEmail()` - Fetch by username or email (case-insensitive)
- Handles snake_case ↔ camelCase mapping

#### Auth Service (`src/lib/services/auth-service.ts`)
**High-level authentication orchestration**

- `signUp()` - Complete registration flow:
  1. Validate input (username ≥3 chars, password ≥8 chars, email format)
  2. Check for existing user
  3. Hash password
  4. Create user
  5. Create session
  6. Return user + session

- `login()` - Complete authentication flow:
  1. Find user by username or email
  2. Verify password
  3. Create new session
  4. Return user + session

- `getCurrentUser()` - Get user from session ID
- `requireUser()` - Enforce authentication (throws if not authenticated)

### 3. API Layer (`src/app/api/auth/`)

#### POST /api/auth/signup
- Accepts: `{ firstName, lastName, username, email, password, confirmPassword }`
- Returns: User object (without password)
- Sets: `qm_session` cookie
- Status: 201 on success, 400 on error

#### POST /api/auth/login
- Accepts: `{ identifier, password }` (identifier = username or email)
- Returns: User object (without password)
- Sets: `qm_session` cookie
- Status: 200 on success, 401 on error

#### POST /api/auth/logout
- Revokes current session
- Deletes: `qm_session` cookie
- Status: 200 on success

#### GET /api/auth/me
- Returns: Current user or 401 if not authenticated
- Reads: `qm_session` cookie
- Status: 200 on success, 401 if not authenticated

### 4. Middleware Layer

#### Next.js Middleware (`src/middleware.ts`)
**Route-level protection**

- Public routes: `/`, `/login`, `/signup`
- Auth routes: `/login`, `/signup` (redirect to `/mcqs` if authenticated)
- Protected routes: Everything else (redirect to `/login` if not authenticated)
- Preserves redirect URL: `/login?redirect=/original-path`

#### Auth Middleware Helpers (`src/lib/auth-middleware.ts`)
**Server-side authentication helpers**

- `getAuthenticatedUser()` - Get user or throw error
- `getOptionalUser()` - Get user or return null
- `requireAuth()` - Alias for requiring authentication

Use in server actions or API routes:
```typescript
import { requireAuth } from "@/lib/auth-middleware";

export async function protectedAction() {
  const user = await requireAuth(); // Throws if not authenticated
  // ... protected logic
}
```

### 5. Server Actions (`src/app/(auth)/actions.ts`)
**Form-based authentication for UI**

- `signUpAction()` - Server action for signup form
- `loginAction()` - Server action for login form
- Both set session cookie and redirect on success

## Data Flow

### Signup Flow
```
User Form → signUpAction() → signUp() → createUser() + createSession() → Set Cookie → Redirect
```

### Login Flow
```
User Form → loginAction() → login() → getUserByUsernameOrEmail() + verifyPassword() + createSession() → Set Cookie → Redirect
```

### Protected Route Access
```
Request → Middleware → Check Cookie → getDatabase() → getCurrentUser() → Allow/Deny
```

### API Authentication
```
API Request → Read Cookie → getDatabase() → getCurrentUser() → Return User/401
```

## Security Features

1. **Password Security**
   - Bcrypt hashing with 12 rounds
   - Passwords never stored in plain text
   - Passwords never returned in API responses

2. **Session Security**
   - HttpOnly cookies (not accessible via JavaScript)
   - Secure flag in production (HTTPS only)
   - SameSite: lax (CSRF protection)
   - 7-day expiration
   - Revocation support

3. **Input Validation**
   - Username: minimum 3 characters
   - Password: minimum 8 characters
   - Email: must contain @
   - Password confirmation match
   - Trimmed and normalized inputs

4. **Route Protection**
   - Middleware enforces authentication
   - Server-side session verification
   - No client-side auth bypass possible

## Database Schema

### user table
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### session table
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER,
  ip_hash TEXT,
  user_agent_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

## Testing Endpoints

### Development Only
- `GET /api/test/integration` - Runs automated integration tests
- `/api/test` - Interactive test page

**Note:** Test endpoints are disabled in production.

## Configuration Files

- `wrangler.jsonc` - D1 binding configuration
- `cloudflare-env.d.ts` - TypeScript types for Cloudflare bindings
- `src/middleware.ts` - Route protection configuration

## Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "user": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Common Issues

1. **"D1 binding not found"**
   - Run `npm run cf-typegen` to regenerate types
   - Verify `wrangler.jsonc` has correct binding name

2. **"Authentication required"**
   - Session expired or invalid
   - Cookie not being sent
   - Session revoked

3. **"User already exists"**
   - Username or email already registered
   - Use different credentials

## Future Enhancements

- Rate limiting on auth endpoints
- Email verification
- Password reset flow
- 2FA/MFA support
- OAuth integration
- Session refresh tokens
- IP and user agent tracking
