# Database Migrations

## Overview
This folder contains SQL migrations for the QuizMaker D1 database.

## Migrations

### 0001_auth-tables.sql
Creates authentication tables:
- `user` - User accounts
- `session` - User sessions

### 0002_mcq-tables.sql
Creates MCQ (Multiple Choice Question) tables:
- `mcq` - MCQ questions with title, description, and question text
- `mcq_choice` - Choices for each MCQ (up to 4 per question)
- `mcq_attempt` - User attempts and results

## Applying Migrations

### Local Development
```bash
wrangler d1 execute quizmaker-database --local --file=./migrations/0001_auth-tables.sql
wrangler d1 execute quizmaker-database --local --file=./migrations/0002_mcq-tables.sql
```

### Remote (Production)
```bash
wrangler d1 execute quizmaker-database --remote --file=./migrations/0001_auth-tables.sql
wrangler d1 execute quizmaker-database --remote --file=./migrations/0002_mcq-tables.sql
```

## Database Schema

### mcq table
- `id` - Unique identifier (UUID)
- `user_id` - Creator of the MCQ
- `title` - MCQ title
- `description` - Optional description
- `question` - The actual question text
- `created_at` - Unix timestamp (ms)
- `updated_at` - Unix timestamp (ms)

### mcq_choice table
- `id` - Unique identifier (UUID)
- `mcq_id` - Reference to MCQ
- `choice_text` - The choice text
- `is_correct` - 1 if correct, 0 if incorrect
- `choice_order` - Order of display (1-4)

### mcq_attempt table
- `id` - Unique identifier (UUID)
- `mcq_id` - Reference to MCQ
- `user_id` - User who attempted
- `selected_choice_ids` - JSON array of selected choice IDs
- `is_correct` - 1 if all correct, 0 otherwise
- `score` - Calculated score (0-100)
- `completed_at` - Unix timestamp (ms)

## Notes

- All foreign keys have `ON DELETE CASCADE` for automatic cleanup
- Indexes are created for common query patterns
- Timestamps are stored as Unix milliseconds (INTEGER)
- `is_correct` uses INTEGER (0/1) as D1 doesn't have native BOOLEAN
