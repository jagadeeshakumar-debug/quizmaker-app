# QuizMaker Deployment Steps

## Why GitHub Actions?

Due to a known OpenNext compatibility issue on Windows, we're using GitHub Actions to deploy from a Linux environment. This ensures a clean, successful deployment.

---

## Step 1: Get Cloudflare Credentials

### Get API Token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Click "Continue to summary" → "Create Token"
5. **Copy the token** (you won't see it again!)

### Get Account ID:
1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages" from the left sidebar
3. Your Account ID is displayed in the right sidebar
4. **Copy the Account ID**

---

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name your repository (e.g., `quizmaker-app`)
3. Choose "Private" or "Public"
4. **Do NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

---

## Step 3: Add Secrets to GitHub

1. Go to your new repository on GitHub
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add these two secrets:

   **Secret 1:**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: (paste the API token from Step 1)

   **Secret 2:**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: (paste the Account ID from Step 1)

---

## Step 4: Push Code to GitHub

Run these commands in your terminal:

```bash
# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/quizmaker-app.git

# Push code to GitHub
git push -u origin master
```

---

## Step 5: Watch Deployment

1. Go to your GitHub repository
2. Click "Actions" tab
3. You should see the "Deploy to Cloudflare" workflow running
4. Click on it to watch the progress
5. Wait for all steps to complete (usually 2-3 minutes)

---

## Step 6: Run Database Migrations

After deployment succeeds, run migrations on your production database:

```bash
# Create the database (if not exists)
npx wrangler d1 create quizmaker_database

# Run migrations
npx wrangler d1 execute quizmaker_database --remote --file=./migrations/0001_auth-tables.sql
npx wrangler d1 execute quizmaker_database --remote --file=./migrations/0002_mcq-tables.sql
```

---

## Step 7: Get Your Live URL

After deployment completes:

1. Check the GitHub Actions output for your Workers URL
2. Or run: `npx wrangler deployments list`
3. Your app will be at: `https://quizmaker-app.YOUR_SUBDOMAIN.workers.dev`

---

## Troubleshooting

**If deployment fails:**
- Check the GitHub Actions logs for errors
- Verify your secrets are correctly set
- Ensure your Cloudflare API token has "Edit Cloudflare Workers" permissions

**If the app shows errors:**
- Make sure you ran the database migrations (Step 6)
- Check Cloudflare dashboard → Workers & Pages → quizmaker-app → Logs

---

## Quick Commands Reference

```bash
# View deployment status
npx wrangler deployments list

# View live logs
npx wrangler tail

# Check D1 database
npx wrangler d1 info quizmaker_database
```
