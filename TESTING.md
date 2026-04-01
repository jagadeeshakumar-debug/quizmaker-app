# Authentication System Testing Guide

## Overview
This guide covers testing the complete authentication system including D1 database integration, API endpoints, middleware protection, and user flows.

## Prerequisites
- D1 database is configured in `wrangler.jsonc`
- Database tables are created (user, session)
- Application is running locally or deployed to Cloudflare

## Testing Methods

### 1. Automated Integration Tests

Visit the test page:
```
http://localhost:3000/api/test
```

Click "Run Integration Test" to execute:
- Database connection verification
- User signup flow
- Session creation
- getCurrentUser functionality
- Login by username
- Login by email
- Invalid credentials rejection

### 2. Manual API Testing

#### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }' \
  -c cookies.txt
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "johndoe",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

#### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### 3. Middleware Testing

#### Test Protected Routes
1. Visit `/mcqs` without being logged in
   - Expected: Redirect to `/login?redirect=/mcqs`

2. Login, then visit `/login` or `/signup`
   - Expected: Redirect to `/mcqs`

3. Login, then visit `/mcqs`
   - Expected: Access granted

#### Test Public Routes
- `/` - Should be accessible without authentication
- `/login` - Should be accessible without authentication
- `/signup` - Should be accessible without authentication

### 4. UI Flow Testing

#### Signup Flow
1. Navigate to `/signup`
2. Fill in the signup form
3. Submit
4. Expected: Redirect to `/mcqs` with session cookie set

#### Login Flow
1. Navigate to `/login`
2. Enter username/email and password
3. Submit
4. Expected: Redirect to `/mcqs` with session cookie set

#### Logout Flow
1. While logged in, trigger logout
2. Expected: Session revoked, cookie deleted, redirect to login

## Verification Checklist

- [ ] D1 database binding is correctly configured
- [ ] User can sign up with valid credentials
- [ ] Duplicate username/email is rejected
- [ ] User can login with username
- [ ] User can login with email
- [ ] Invalid credentials are rejected
- [ ] Session cookie is set after signup/login
- [ ] Protected routes require authentication
- [ ] Auth routes redirect when already logged in
- [ ] Logout revokes session and clears cookie
- [ ] Password validation works (min 8 chars)
- [ ] Username validation works (min 3 chars)
- [ ] Email validation works (contains @)

## Components Tested

### Services
- `password-service.ts` - Password hashing and verification
- `session-service.ts` - Session CRUD and validation
- `user-service.ts` - User CRUD operations
- `auth-service.ts` - Authentication orchestration

### API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/me` - Current user retrieval

### Middleware
- `middleware.ts` - Route protection and redirects
- `auth-middleware.ts` - Server-side auth helpers

### Infrastructure
- `d1-client.ts` - D1 database client with proper binding
- Cloudflare bindings in `wrangler.jsonc`

## Troubleshooting

### Database Connection Issues
- Verify `wrangler.jsonc` has correct D1 binding
- Run `npm run cf-typegen` to regenerate types
- Check that database tables exist

### Session Issues
- Check cookie settings (httpOnly, secure, sameSite)
- Verify session TTL (7 days)
- Check session expiration logic

### Middleware Issues
- Verify matcher pattern excludes static assets
- Check PUBLIC_ROUTES and AUTH_ROUTES arrays
- Test redirect URLs

## Next Steps
After all tests pass:
1. Remove test endpoints before production deployment
2. Add rate limiting to auth endpoints
3. Add email verification (optional)
4. Add password reset flow (optional)
5. Add 2FA support (optional)
