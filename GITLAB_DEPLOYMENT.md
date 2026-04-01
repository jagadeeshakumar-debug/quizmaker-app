# GitLab CI/CD Deployment Guide

## How to Add Secrets in GitLab

### Step 1: Get Cloudflare Credentials

**Get API Token:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Click "Continue to summary" → "Create Token"
5. **Copy the token** (you won't see it again!)

**Get Account ID:**
1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages" from the left sidebar
3. Your Account ID is displayed in the right sidebar
4. **Copy the Account ID**

---

### Step 2: Add Secrets to GitLab

1. Go to your GitLab project: https://gitlab.com/YOUR_USERNAME/quizmaker-app
2. Navigate to: **Settings** → **CI/CD**
3. Expand the **Variables** section
4. Click **Add variable** button

**Add First Secret:**
- Key: `CLOUDFLARE_API_TOKEN`
- Value: (paste your Cloudflare API token)
- Type: Variable
- Environment scope: All
- Flags: 
  - ✅ **Protect variable** (recommended)
  - ✅ **Mask variable** (recommended)
- Click **Add variable**

**Add Second Secret:**
- Key: `CLOUDFLARE_ACCOUNT_ID`
- Value: (paste your Cloudflare Account ID)
- Type: Variable
- Environment scope: All
- Flags:
  - ✅ **Protect variable** (recommended)
  - ✅ **Mask variable** (recommended)
- Click **Add variable**

---

### Step 3: Push Code to GitLab

If you haven't already set up GitLab remote:

```bash
# Add GitLab remote
git remote add gitlab https://gitlab.com/YOUR_USERNAME/quizmaker-app.git

# Or if you want to replace the GitHub remote:
git remote set-url origin https://gitlab.com/YOUR_USERNAME/quizmaker-app.git

# Push to GitLab
git push -u gitlab master
# or
git push -u origin master
```

---

### Step 4: Monitor Deployment

1. Go to your GitLab project
2. Click **CI/CD** → **Pipelines** in the left sidebar
3. You should see a pipeline running
4. Click on it to see the progress
5. Wait for the "deploy_to_cloudflare" job to complete (2-3 minutes)

---

### Step 5: Verify Deployment

After the pipeline succeeds:

```bash
# Check deployment status
npx wrangler deployments list

# Get your live URL
npx wrangler deployments list | head -n 10
```

Your app will be at: `https://quizmaker-app.YOUR_SUBDOMAIN.workers.dev`

---

## Quick Reference

### GitLab CI/CD Variables Location:
```
Project → Settings → CI/CD → Variables
```

### Required Variables:
- `CLOUDFLARE_API_TOKEN` (masked, protected)
- `CLOUDFLARE_ACCOUNT_ID` (masked, protected)

### View Pipeline Logs:
```
Project → CI/CD → Pipelines → Click on pipeline → Click on job
```

---

## Troubleshooting

**Pipeline fails with "CLOUDFLARE_API_TOKEN not found":**
- Check that you added the variables in Settings → CI/CD → Variables
- Make sure the variable names are exactly: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
- Try unmasking the variables temporarily to verify they're set correctly

**Pipeline fails at build step:**
- Check the job logs for specific errors
- Verify `package.json` has correct build scripts

**Deployment succeeds but app shows 500 error:**
- This is the Windows OpenNext bug we're avoiding with GitLab CI
- GitLab CI runs on Linux, so this should work correctly

---

## Files Created

- `.gitlab-ci.yml` - GitLab CI/CD pipeline configuration
- `GITLAB_DEPLOYMENT.md` - This guide

---

## Database Note

Your database is already set up with all tables:
- ✅ user
- ✅ session
- ✅ mcq
- ✅ mcq_choice
- ✅ mcq_attempt

No migrations needed!
