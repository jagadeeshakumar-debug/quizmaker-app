# Deploy QuizMaker to Cloudflare - Action Required

**Current Status**: 500 error due to Windows compatibility issue  
**Solution**: Deploy via GitHub Actions (uses Linux)

---

## The Problem

You ran `npm run deploy` on Windows, which:
- ✅ Built the application successfully
- ✅ Uploaded worker to Cloudflare
- ❌ **BUT** the worker crashes with 500 error due to Windows path bugs in OpenNext

**The deployment flow you described is correct**, but OpenNext has a bug on Windows that breaks chunk loading.

---

## The Solution: GitHub Actions

GitHub Actions will run **the exact same deployment flow** (`npm run deploy`) but on **Linux** where it works properly.

### Steps to Deploy (15 minutes)

#### 1. Get Cloudflare Credentials (5 minutes)

**Get API Token**:
1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Workers"
4. Click "Continue to summary" → "Create Token"
5. **COPY THE TOKEN** (save it somewhere safe)

**Get Account ID**:
1. Visit: https://dash.cloudflare.com/
2. Look in the right sidebar
3. **COPY YOUR ACCOUNT ID** (looks like: `c89f0d84507646183d5295bff3d2ef7c`)

#### 2. Create GitHub Repository (3 minutes)

1. Go to https://github.com/new
2. Repository name: `quizmaker` (or any name you want)
3. Make it **Private** or **Public** (your choice)
4. **Do NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

#### 3. Push Your Code to GitHub (2 minutes)

Run these commands in your terminal:

```powershell
cd g:\dev\quizmaker\quizmaker-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - QuizMaker application"

# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 4. Add Secrets to GitHub (3 minutes)

1. Go to your GitHub repository page
2. Click **Settings** (top menu)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

**Add Secret 1**:
- Name: `CLOUDFLARE_API_TOKEN`
- Secret: [Paste the API token from step 1]
- Click "Add secret"

**Add Secret 2**:
- Name: `CLOUDFLARE_ACCOUNT_ID`  
- Secret: [Paste the account ID from step 1]
- Click "Add secret"

#### 5. Trigger Deployment (2 minutes)

**Option A: Automatic (push to main)**
```powershell
# Make any small change or just push again
git push origin main
```

**Option B: Manual trigger**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click "Deploy to Cloudflare" workflow (left sidebar)
4. Click "Run workflow" button (right side)
5. Click green "Run workflow" button

#### 6. Watch Deployment (2-3 minutes)

1. Stay on the Actions tab
2. Click on the running workflow
3. Click on "Deploy QuizMaker to Cloudflare Workers" job
4. Watch the steps execute
5. When you see green checkmarks, deployment is complete!

#### 7. Test Your App

Visit: **https://quizmaker-app.aisprint-quizmaker.workers.dev**

- ✅ Should load without 500 error
- ✅ Test signup, login, create MCQ, etc.

---

## Why This Works

| Deployment Method | Environment | Result |
|-------------------|-------------|--------|
| `npm run deploy` on Windows | Windows | ❌ 500 error (chunk bug) |
| `npm run deploy` via GitHub Actions | **Linux** | ✅ Works perfectly |

**Same deployment command, different OS, different result.**

---

## What GitHub Actions Does

```yaml
# Runs on Linux (ubuntu-latest)
steps:
  1. Checkout your code
  2. Setup Node.js 20
  3. npm ci (install dependencies)
  4. npm run build (Next.js build)
  5. npm run deploy (OpenNext build + wrangler deploy)
     ↓
  Cloudflare Workers (your app goes live!)
```

**This is the standard deployment flow, just running on Linux instead of Windows.**

---

## Quick Checklist

- [ ] Get Cloudflare API Token
- [ ] Get Cloudflare Account ID
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Add secrets to GitHub (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [ ] Trigger workflow (push or manual)
- [ ] Wait 2-3 minutes
- [ ] Test production URL
- [ ] ✅ No more 500 error!

---

## Need Help?

Let me know which step you need help with:
- Getting Cloudflare credentials
- Creating GitHub repository
- Pushing to GitHub
- Adding secrets
- Triggering deployment

---

**Your database is already set up, your code is ready. You just need to deploy from Linux (via GitHub Actions) to fix the 500 error.**
