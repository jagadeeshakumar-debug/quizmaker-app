# MCQ System - End-to-End Testing Guide

## Prerequisites

✅ Database migration applied successfully
✅ Dev server running (`npm run dev`)
✅ User authentication system working

## Testing Checklist

### 1. Authentication Flow (Pre-requisite)

- [ ] Navigate to `http://localhost:3000/signup`
- [ ] Create a test user account
- [ ] Verify redirect to `/mcqs` after signup
- [ ] Verify you're logged in (session cookie set)

### 2. MCQ Listing Page (`/mcqs`)

**Initial State:**
- [ ] Page shows "Multiple Choice Questions" title
- [ ] "Create MCQ" button visible at top right
- [ ] Empty state message: "No MCQs yet. Create your first one to get started."
- [ ] "Create Your First MCQ" button in center

### 3. MCQ Creation (`/mcqs/create`)

**Navigation:**
- [ ] Click "Create MCQ" button from listing page
- [ ] Page shows "Create MCQ" title
- [ ] Form displays with all fields

**Form Fields:**
- [ ] Title field (required)
- [ ] Description field (optional)
- [ ] Question field (required)
- [ ] 2 default choice fields shown
- [ ] "Add Choice" button visible

**Adding Choices:**
- [ ] Click "Add Choice" - 3rd choice appears
- [ ] Click "Add Choice" again - 4th choice appears
- [ ] "Add Choice" button disappears (max 4 reached)
- [ ] Try to add 5th choice - should show error toast

**Removing Choices:**
- [ ] Click X on 4th choice - removes successfully
- [ ] Click X on 3rd choice - removes successfully
- [ ] Try to remove when only 2 choices - should show error toast

**Marking Correct Answers:**
- [ ] Click checkbox on Choice 1 - turns green with checkmark
- [ ] Click checkbox on Choice 2 - turns green with checkmark
- [ ] Click checkbox again - unchecks
- [ ] Can mark multiple choices as correct

**Validation:**
- [ ] Try to submit with empty title - shows error
- [ ] Try to submit with empty question - shows error
- [ ] Try to submit with empty choice text - shows error
- [ ] Try to submit with no correct answer marked - shows error

**Successful Creation:**
- [ ] Fill all required fields
- [ ] Mark at least one correct answer
- [ ] Click "Create MCQ"
- [ ] Success toast appears
- [ ] Redirects to `/mcqs` listing page
- [ ] New MCQ appears in the table

### 4. MCQ Listing Page (With Data)

**Table Display:**
- [ ] MCQ appears in table with:
  - [ ] Title (clickable link)
  - [ ] Description preview (truncated if long)
  - [ ] Question preview (truncated)
  - [ ] Number of choices (e.g., "4 choices")
  - [ ] Creation date
  - [ ] Actions dropdown (three dots icon)

**Actions Dropdown:**
- [ ] Click three dots icon - dropdown opens
- [ ] "Edit" option with pencil icon visible
- [ ] "Delete" option with trash icon visible (in red)

### 5. MCQ Edit (`/mcqs/[id]/edit`)

**Navigation:**
- [ ] From listing, click Actions → Edit
- [ ] Page shows "Edit MCQ" title
- [ ] Form pre-populated with existing data:
  - [ ] Title filled
  - [ ] Description filled (if exists)
  - [ ] Question filled
  - [ ] All choices loaded
  - [ ] Correct answers marked with checkmarks

**Editing:**
- [ ] Change title
- [ ] Change description
- [ ] Change question
- [ ] Modify choice text
- [ ] Change which choices are correct
- [ ] Add new choice
- [ ] Remove a choice
- [ ] Click "Update MCQ"
- [ ] Success toast appears
- [ ] Redirects to listing
- [ ] Changes reflected in listing

**Cancel:**
- [ ] Click "Cancel" button
- [ ] Returns to listing without saving

### 6. MCQ Delete

**From Listing Page:**
- [ ] Click Actions → Delete
- [ ] Confirmation dialog appears: "Are you sure you want to delete this MCQ?"
- [ ] Click "Cancel" - nothing happens
- [ ] Click Actions → Delete again
- [ ] Click "OK" - MCQ deleted
- [ ] Success toast appears
- [ ] MCQ removed from table
- [ ] If last MCQ, empty state appears

### 7. MCQ Preview/Attempt (`/mcqs/[id]`)

**Navigation:**
- [ ] From listing, click on MCQ title
- [ ] Page loads with MCQ details

**Page Layout:**
- [ ] "Back to MCQs" button at top
- [ ] MCQ title displayed
- [ ] Description displayed (if exists)
- [ ] Question card with question text
- [ ] Answer choices card with all choices

**Choice Display:**
- [ ] Choices labeled A, B, C, D
- [ ] Radio button style indicators
- [ ] All choices visible

**Selecting Answers:**
- [ ] Click on Choice A - selection indicator fills
- [ ] Click on Choice B - selection indicator fills
- [ ] Click on Choice A again - unselects
- [ ] Can select multiple choices
- [ ] Hover effect on choices

**Submitting Attempt:**
- [ ] "Submit Answer" button disabled when nothing selected
- [ ] Select at least one choice
- [ ] "Submit Answer" button enabled
- [ ] Click "Submit Answer"
- [ ] Button shows "Submitting..." state

**Result Display - Correct Answer:**
- [ ] Green border card appears
- [ ] "Correct!" title with checkmark icon
- [ ] Explanation: "Correct! You selected all the right answers."
- [ ] Correct choices highlighted in green with checkmarks
- [ ] Score badge shows 100
- [ ] "Try Again" button visible

**Result Display - Incorrect Answer:**
- [ ] Red border card appears
- [ ] "Incorrect" title with X icon
- [ ] Explanation message shown
- [ ] Selected wrong choices highlighted in red with X
- [ ] Correct choices highlighted in green (even if not selected)
- [ ] Score badge shows 0
- [ ] "Try Again" button visible

**Try Again:**
- [ ] Click "Try Again" button
- [ ] Result card disappears
- [ ] Selections cleared
- [ ] Can make new attempt

**Previous Attempts:**
- [ ] After submitting, "Previous Attempts" section appears
- [ ] Shows count: "Show (1)"
- [ ] Click "Show" - expands to show attempts
- [ ] Each attempt shows:
  - [ ] Correct/Incorrect icon
  - [ ] Timestamp
  - [ ] Score badge
- [ ] Click "Hide" - collapses section
- [ ] Make multiple attempts - all recorded and displayed
- [ ] Ordered by newest first

### 8. Multiple MCQs Testing

**Create Multiple MCQs:**
- [ ] Create MCQ #1 with 2 choices
- [ ] Create MCQ #2 with 3 choices
- [ ] Create MCQ #3 with 4 choices
- [ ] All appear in listing table
- [ ] Ordered by newest first

**Test Each MCQ:**
- [ ] Attempt MCQ #1 - works correctly
- [ ] Attempt MCQ #2 - works correctly
- [ ] Attempt MCQ #3 - works correctly
- [ ] Edit MCQ #2 - changes saved
- [ ] Delete MCQ #1 - removed from list

### 9. Edge Cases

**Multiple Correct Answers:**
- [ ] Create MCQ with 2 correct answers
- [ ] Attempt: Select only 1 correct - marked incorrect
- [ ] Attempt: Select both correct - marked correct
- [ ] Attempt: Select 1 correct + 1 wrong - marked incorrect

**Navigation:**
- [ ] Direct URL to `/mcqs/[invalid-id]` - shows 404
- [ ] Direct URL to `/mcqs/create` without login - redirects to login
- [ ] Direct URL to `/mcqs/[id]/edit` for MCQ you don't own - shows 404

**Middleware Protection:**
- [ ] Logout
- [ ] Try to access `/mcqs` - redirects to login
- [ ] Try to access `/mcqs/create` - redirects to login
- [ ] Try to access `/mcqs/[id]` - redirects to login
- [ ] Login - redirects back to intended page

### 10. API Endpoints Testing

**Using Browser DevTools or curl:**

```bash
# List MCQs
curl http://localhost:3000/api/mcq -b cookies.txt

# Create MCQ
curl -X POST http://localhost:3000/api/mcq \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test MCQ",
    "question": "What is 2+2?",
    "choices": [
      {"choiceText": "3", "isCorrect": false},
      {"choiceText": "4", "isCorrect": true}
    ]
  }'

# Get single MCQ
curl http://localhost:3000/api/mcq/[id]

# Submit attempt
curl -X POST http://localhost:3000/api/mcq/[id]/attempt \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"selectedChoiceIds": ["choice-id"]}'

# Get attempts
curl http://localhost:3000/api/mcq/[id]/attempt -b cookies.txt

# Update MCQ
curl -X PUT http://localhost:3000/api/mcq/[id] \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title": "Updated Title"}'

# Delete MCQ
curl -X DELETE http://localhost:3000/api/mcq/[id] -b cookies.txt
```

## Expected Behavior Summary

### User Journey:
1. User signs up / logs in
2. Lands on empty MCQ listing page
3. Clicks "Create MCQ"
4. Fills form with question and 2-4 choices
5. Marks correct answer(s)
6. Submits - redirects to listing
7. Clicks on MCQ title to attempt it
8. Selects answer(s) and submits
9. Sees immediate feedback (correct/incorrect)
10. Can try again multiple times
11. Can edit or delete MCQs from listing

### Data Persistence:
- All MCQs saved to D1 database
- All attempts recorded with timestamp
- Previous attempts visible on attempt page
- Changes to MCQs reflected immediately

## Known Limitations (Current Version)

- No pagination (all MCQs loaded at once)
- No search/filter functionality
- No MCQ sharing between users
- No partial scoring (all-or-nothing)
- Test endpoints should be removed before production

## Success Criteria

✅ All checklist items pass
✅ No console errors
✅ No linter errors
✅ Data persists across page refreshes
✅ Multiple users can create independent MCQs
✅ Attempts are recorded correctly
✅ UI is responsive and intuitive
