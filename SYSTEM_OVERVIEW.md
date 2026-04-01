# QuizMaker System Overview

## Complete Feature Set

### Authentication System ✅
- User signup and login
- Session-based authentication (7-day sessions)
- Password hashing with bcrypt
- Middleware route protection
- API endpoints for auth operations

### MCQ Management System ✅
- Create, Read, Update, Delete MCQs
- Support for 2-4 answer choices per question
- Multiple correct answers support
- Rich text descriptions
- User ownership and permissions

### MCQ Attempt System ✅
- Take MCQ quizzes
- Multiple attempts allowed
- Instant feedback (correct/incorrect)
- Attempt history tracking
- Score calculation (0 or 100)

## Application Structure

```
quizmaker-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/          # Login page
│   │   │   ├── signup/         # Signup page
│   │   │   └── actions.ts      # Auth server actions
│   │   ├── api/
│   │   │   ├── auth/           # Auth API endpoints
│   │   │   │   ├── signup/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── me/
│   │   │   ├── mcq/            # MCQ API endpoints
│   │   │   │   ├── route.ts    # List & Create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # Get, Update, Delete
│   │   │   │       ├── attempt/      # Submit & List attempts
│   │   │   │       └── stats/        # MCQ statistics
│   │   │   └── test/           # Testing endpoints (dev only)
│   │   ├── mcqs/
│   │   │   ├── page.tsx              # MCQ listing
│   │   │   ├── MCQListClient.tsx     # Interactive table
│   │   │   ├── create/
│   │   │   │   └── page.tsx          # Create MCQ form
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Attempt MCQ
│   │   │   │   ├── MCQAttemptClient.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx      # Edit MCQ form
│   │   │   └── components/
│   │   │       └── MCQForm.tsx       # Reusable form
│   │   ├── layout.tsx
│   │   └── page.tsx            # Home page
│   ├── lib/
│   │   ├── d1-client.ts        # D1 database utilities
│   │   ├── auth-middleware.ts  # Auth helpers
│   │   └── services/
│   │       ├── password-service.ts
│   │       ├── session-service.ts
│   │       ├── user-service.ts
│   │       ├── auth-service.ts
│   │       ├── mcq-service.ts
│   │       └── mcq-attempt-service.ts
│   ├── middleware.ts           # Next.js middleware
│   └── components/ui/          # shadcn/ui components
├── migrations/
│   ├── 0001_auth-tables.sql    # User & session tables
│   └── 0002_mcq-tables.sql     # MCQ tables
└── wrangler.jsonc              # Cloudflare configuration
```

## Database Schema

### Tables

1. **user** - User accounts
2. **session** - User sessions
3. **mcq** - MCQ questions
4. **mcq_choice** - Answer choices (2-4 per MCQ)
5. **mcq_attempt** - User attempts and results

### Relationships

```
user (1) ──< (many) mcq
user (1) ──< (many) session
user (1) ──< (many) mcq_attempt

mcq (1) ──< (many) mcq_choice
mcq (1) ──< (many) mcq_attempt
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### MCQ Management
- `GET /api/mcq` - List user's MCQs
- `POST /api/mcq` - Create MCQ
- `GET /api/mcq/[id]` - Get MCQ details
- `PUT /api/mcq/[id]` - Update MCQ
- `DELETE /api/mcq/[id]` - Delete MCQ

### MCQ Attempts
- `POST /api/mcq/[id]/attempt` - Submit attempt
- `GET /api/mcq/[id]/attempt` - List user's attempts
- `GET /api/mcq/[id]/stats` - Get MCQ statistics (owner only)

## User Flows

### First Time User
1. Visit app → Redirected to `/login`
2. Click "Sign up" → Fill form → Submit
3. Redirected to `/mcqs` (empty state)
4. Click "Create MCQ" → Fill form → Submit
5. MCQ appears in listing
6. Click MCQ title → Take quiz → See results

### Returning User
1. Visit app → Redirected to `/login`
2. Enter credentials → Submit
3. Redirected to `/mcqs` (shows existing MCQs)
4. Can create, edit, delete, or attempt MCQs

### Taking an MCQ
1. From listing, click MCQ title
2. Read question and choices
3. Select answer(s)
4. Click "Submit Answer"
5. See instant feedback
6. View previous attempts
7. Click "Try Again" or "Back to MCQs"

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Custom (bcrypt + sessions)
- **Deployment:** OpenNext for Cloudflare

## Security Features

- Password hashing with bcrypt (12 rounds)
- HttpOnly session cookies
- Server-side session validation
- Route protection via middleware
- Ownership verification for edit/delete
- CSRF protection (SameSite cookies)
- Input validation and sanitization

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Generate Cloudflare types
npm run cf-typegen

# Apply database migrations (local)
wrangler d1 execute quizmaker-database --local --file=./migrations/[file].sql

# Apply database migrations (remote)
wrangler d1 execute quizmaker-database --remote --file=./migrations/[file].sql
```

## Testing

See `MCQ_TESTING_GUIDE.md` for comprehensive testing checklist.
See `TESTING.md` for authentication testing guide.

## Next Steps / Future Enhancements

- [ ] Add pagination to MCQ listing
- [ ] Add search and filter functionality
- [ ] Add MCQ categories/tags
- [ ] Add image support for questions and choices
- [ ] Add partial scoring (not just all-or-nothing)
- [ ] Add time limits for attempts
- [ ] Add MCQ sharing/collaboration
- [ ] Add analytics dashboard
- [ ] Add export/import functionality
- [ ] Add rich text editor for questions
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add OAuth integration
