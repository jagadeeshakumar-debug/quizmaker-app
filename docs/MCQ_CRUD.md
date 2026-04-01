---
title: "Technical PRD — MCQ CRUD + Listing + Preview/Attempt Flow"
owner: "QuizMaker"
status: "Draft"
last_updated: "2026-03-31"
---

## Summary
Build the first end-to-end workflow for **MCQ management and attempt recording**:

- When a user enters the application, they land on an **MCQ Listing** page (empty state initially).
- A **Create MCQ** action lets users create an MCQ with **title**, **description**, **question text**, and **up to 4 choices** (each choice has **text** + **isCorrect** flag).
- Listing shows saved MCQs in a table with an **Actions** dropdown per row (Edit/Delete).
- Clicking an MCQ **title** opens a **Preview/Attempt** view where the user selects a choice and submits an attempt.
- Each attempt is recorded with **mcqId**, **userId**, **selectedChoiceId**, **correctness**, and **timestamp**.

This PRD intentionally excludes authentication implementation details; it depends on a resolved **current user id** from `docs/BASIC_AUTHENTICATION.md` so attempts can be recorded against a user.

## Goals
- **Default entry page** is the MCQ listing.
- Support **Create / Read / Update / Delete** for MCQs and their choices.
- Support **attempting** an MCQ and recording **Attempt** rows tied to the authenticated user.
- Ensure database design is **normalized** and scalable: separate `mcq`, `choice`, and `attempt` tables (and a `user` table is owned by auth PRD).

## Non-goals (Phase 1)
- Import/export, bulk editing, tags, categories, standards alignment, AI generation.
- Rich text editor, images, math rendering.
- Multiple correct answers (Phase 1 assumes **exactly one** correct choice per MCQ; see Open Questions if we want different).
- Analytics dashboards beyond a basic “Attempts” count if needed.
- Sharing/public links, classroom assignments, rosters.

## User Stories
- As a user, I can see an empty MCQ list and a **Create MCQ** button.
- As a user, I can create an MCQ with up to four choices and mark the correct choice.
- As a user, I can edit an MCQ and its choices.
- As a user, I can delete an MCQ (and its choices/attempts are handled safely).
- As a user, I can click an MCQ title to preview and attempt it.
- As a user, when I submit an attempt, it’s recorded and I immediately see whether I was correct.

## UX / Screens (App Router)
### 1) MCQ Listing (default entry)
- **Route**: `app/(app)/mcqs/page.tsx` (exact segment naming TBD)
- **UI**
  - Page title: “Multiple Choice Questions”
  - Top-right primary button aligned with title: **Create MCQ**
  - Table columns (initial):
    - Title (clickable link)
    - Description (optional truncation)
    - Updated (or Created) timestamp
    - Attempts (optional)
    - Actions dropdown button at far right (Edit/Delete)
  - **Empty state**: “No MCQs yet. Create your first one.”

### 2) Create MCQ
- **Route**: `app/(app)/mcqs/new/page.tsx`
- **Form fields**
  - Title (required)
  - Description (optional)
  - Question Text (required)
  - Choices (1–4)
    - Each: Choice text (required if present)
    - Radio/select to mark exactly one correct choice
- **Validation**
  - Must have between 2 and 4 choices for a meaningful MCQ (recommended).
  - Exactly one correct choice.
- **Save behavior**
  - On success: redirect to listing (or to MCQ detail/preview).

### 3) Edit MCQ
- **Route**: `app/(app)/mcqs/[mcqId]/edit/page.tsx`
- Same form as Create, pre-filled.
- Save updates both MCQ metadata + choice set.

### 4) Preview / Attempt MCQ
- **Route**: `app/(app)/mcqs/[mcqId]/page.tsx`
- **UI**
  - MCQ title + description
  - Question text
  - Choices rendered as radio group
  - Submit button (“Submit Answer”)
  - After submit: show “Correct/Incorrect” and record attempt (an “attempt” is the user “taking” the MCQ)

## Data Model (Normalized)
### Tables owned by this PRD
#### `mcq`
- `id` (TEXT, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NULL)
- `question_text` (TEXT, NOT NULL)
- `created_at` (INTEGER, NOT NULL) — unix epoch ms
- `updated_at` (INTEGER, NOT NULL) — unix epoch ms
- `created_by_user_id` (TEXT, NOT NULL, FK → `user.id`) *(optional for Phase 1 if listing is public; recommended for ownership and auditing)*

#### `choice`
- `id` (TEXT, PK)
- `mcq_id` (TEXT, NOT NULL, FK → `mcq.id`)
- `choice_text` (TEXT, NOT NULL)
- `is_correct` (INTEGER, NOT NULL) — 0/1
- `position` (INTEGER, NOT NULL) — 1..4 for stable ordering
- `created_at` (INTEGER, NOT NULL)
- `updated_at` (INTEGER, NOT NULL)

#### `attempt`
- `id` (TEXT, PK)
- `mcq_id` (TEXT, NOT NULL, FK → `mcq.id`)
- `user_id` (TEXT, NOT NULL, FK → `user.id`)
- `selected_choice_id` (TEXT, NOT NULL, FK → `choice.id`)
- `is_correct` (INTEGER, NOT NULL) — 0/1 (denormalized snapshot)
- `created_at` (INTEGER, NOT NULL) — timestamp of attempt

Notes:
- A user can have **one or more attempts** per MCQ.

### Indexing (initial)
- `choice(mcq_id)`
- `attempt(mcq_id)`
- `attempt(user_id)`
- `attempt(mcq_id, user_id, created_at)`

### Integrity & Cascades
SQLite/D1 supports foreign keys depending on configuration; regardless, enforce in code:
- **Delete MCQ**: delete related `choice` rows and decide policy for `attempt`:
  - Option A (simple): cascade delete attempts with MCQ.
  - Option B (audit): keep attempts but mark MCQ deleted (soft delete).
- Phase 1 recommendation: **hard delete** choices + attempts when MCQ deleted (simpler).

## Server-Side Interfaces (initial proposal)
Prefer **Server Actions** for forms/mutations (per project rules). Reads can be RSC data fetching via service layer.

### Services (suggested)
- `src/lib/services/mcq-service.ts`
  - `listMcqs(userId?)`
  - `getMcqWithChoices(mcqId)`
  - `createMcq(input, userId)`
  - `updateMcq(mcqId, input, userId)`
  - `deleteMcq(mcqId, userId)`
- `src/lib/services/attempt-service.ts`
  - `createAttempt({ mcqId, selectedChoiceId }, userId)`
  - `listAttemptsForMcq(mcqId, userId?)` (optional)

### D1 access
All D1 access goes through `lib/d1-client.ts` per rule; use prepared statements; use placeholder normalization (`?` → `?1`, `?2`, ...).

## Validation Rules (Phase 1)
- **MCQ**
  - `title`: 1..200 chars
  - `question_text`: 1..5000 chars (tunable)
  - `description`: 0..2000 chars
- **Choices**
  - count: 2..4 (recommended; confirm)
  - each `choice_text`: 1..500 chars
  - exactly one `is_correct = 1`
  - `position` unique per MCQ
- **Attempt**
  - `selected_choice_id` must belong to `mcq_id`
  - `is_correct` computed server-side (never trust client)

## Authorization / Ownership (Phase 1)
Assuming basic sessions from auth PRD:
- Only authenticated users can create/edit/delete MCQs.
- Attempt recording requires user session.
- Ownership model:
  - Phase 1: creator can edit/delete; others can only attempt (or restrict everything to owner only).
  - Decision required (see Open Questions).

## Observability
- Log mutation failures with enough context (mcqId, userId) but **never** log choice correctness or sensitive info excessively.
- Consider lightweight audit events later (out of scope).

## Acceptance Criteria
- Visiting the app entry route shows the **MCQ listing**.
- “Create MCQ” opens a form; saving creates rows in `mcq` and `choice`.
- Listing shows new MCQ immediately after save.
- Each listing row shows an **Actions** dropdown with Edit/Delete.
- Clicking title opens preview; submitting records an `attempt` with:
  - correct `mcq_id`
  - correct `user_id`
  - `selected_choice_id`
  - `is_correct` computed server-side
  - `created_at` timestamp
- Edit updates the MCQ and choices; preview reflects updates.
- Delete removes MCQ and related rows per chosen policy.

## Open Questions / Decisions Needed
- **Gating**: Should MCQ listing be accessible without login, or always behind auth (recommended to gate for attempts)?
- **Ownership**: Can any logged-in user edit/delete any MCQ, or only the creator?
- **Correct answers**: Exactly one correct choice (radio) vs multiple correct (checkbox)?
- **Choice count**: allow 1..4 vs enforce 2..4?
- **Delete behavior**: hard delete attempts vs soft delete MCQ?

## Milestones (suggested)
- M1: D1 migrations for `mcq`, `choice`, `attempt` (+ foreign keys/indexes)
- M2: Listing + empty state + create flow
- M3: Edit + delete from actions dropdown
- M4: Preview/attempt + attempt recording
- M5: Polish validation errors + basic tests for services
