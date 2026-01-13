# SpaStream Deployment Guide (Beginner-Friendly)

This guide will help you get your SpaStream website live on the internet at spastream.net.

**Time needed:** About 30-45 minutes
**Cost:** $0 (Vercel is free for your needs)

---

## What You'll Need

1. ✅ Your domain name (you already have spastream.net)
2. ✅ A GitHub account (free - we'll create this)
3. ✅ A Vercel account (free - we'll create this)
4. ✅ Your project files (you already have these)

---

## Part 1: Create a GitHub Account (5 minutes)

**What is GitHub?** Think of it as Google Drive for code. It stores your website files online.

1. Go to [github.com](https://github.com)
2. Click the green "Sign up" button (top right)
3. Enter your email, create a password, choose a username
4. Verify your email address (check your inbox)
5. Choose the free plan when asked

✅ **Done!** You now have a GitHub account.

---

## Part 2: Upload Your Website to GitHub (10 minutes)

**What we're doing:** Putting your SpaStream files online so Vercel can access them.

### Step 2.1: Create a New Repository

A "repository" (or "repo") is just a folder that holds your project files.

1. On GitHub, click the green "New" button (or the + icon in top right → "New repository")
2. Fill out the form:
   - **Repository name:** `spastream` (or whatever you want)
   - **Description:** "SpaStream - Med Spa Management Platform"
   - **Public or Private:** Choose "Private" (keeps your code hidden from others)
   - **DO NOT check** "Add a README file"
3. Click the green "Create repository" button

### Step 2.2: Upload Your Files

After creating the repository, GitHub will show you a page with instructions. **Ignore those for now.**

1. Look for the "uploading an existing file" link on that page and click it
2. You'll see a page that says "Drag files here to add them to your repository"

**IMPORTANT:** You need to upload ALL your project files. Here's how:

#### Option A: Using GitHub Desktop (Easier)

1. Download [GitHub Desktop](https://desktop.github.com/)
2. Install and open it
3. Sign in with your GitHub account
4. Click "File" → "Add Local Repository"
5. Click "Choose..." and find your project folder (the folder containing all your SpaStream files)
6. If it says "This directory does not appear to be a Git repository", click "create a repository"
7. Click "Publish repository" in the top right
8. Uncheck "Keep this code private" if you want it public, or leave it checked for private
9. Click "Publish Repository"

✅ **Done!** Your files are now on GitHub.

#### Option B: Using the Website (If Desktop doesn't work)

Unfortunately, GitHub's website doesn't allow uploading folders with many files at once. We'll use a different approach:

**Download this tool:** [GitHub CLI](https://cli.github.com/)

1. Install GitHub CLI
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Type these commands one at a time (press Enter after each):

```bash
cd path/to/your/spastream/folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/spastream.git
git push -u origin main
```

**Replace** `YOUR-USERNAME` with your actual GitHub username.

---

## Part 3: Create a Vercel Account (5 minutes)

**What is Vercel?** It's a service that takes your code from GitHub and puts it on the internet as a real website.

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" (top right)
3. **Choose "Continue with GitHub"** (this makes everything easier)
4. GitHub will ask you to authorize Vercel - click "Authorize Vercel"
5. Choose the free "Hobby" plan

✅ **Done!** You now have a Vercel account connected to GitHub.

---

## Part 4: Deploy Your Website (10 minutes)

**What we're doing:** Telling Vercel to take your GitHub files and create a live website.

### Step 4.1: Import Your Project

1. On Vercel, click "Add New..." → "Project"
2. You'll see a list of your GitHub repositories
3. Find "spastream" and click "Import"

### Step 4.2: Configure Your Project

Vercel will show you a configuration screen:

1. **Project Name:** Leave it as "spastream" or change it if you want
2. **Framework Preset:** It should automatically detect "Next.js" - leave this alone
3. **Root Directory:** Leave this as "./"
4. **Build Command:** Leave as default (`npm run build`)
5. **Output Directory:** Leave as default

### Step 4.3: Add Environment Variables

**CRITICAL STEP** - This connects your website to your database.

1. Look for the "Environment Variables" section
2. Click to expand it
3. You need to add TWO variables. For each one:

**Variable 1:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Open your `.env` file (in your project folder) and copy the value after `NEXT_PUBLIC_SUPABASE_URL=`
- Click "Add"

**Variable 2:**
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Open your `.env` file and copy the value after `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
- Click "Add"

4. Click the blue "Deploy" button

### Step 4.4: Wait for Deployment

You'll see a screen with fun animations. This usually takes 2-3 minutes. When it's done, you'll see "🎉 Congratulations!"

✅ **Your website is now LIVE!** But it's at a Vercel address like `spastream.vercel.app`

---

## Part 5: Connect Your Custom Domain (10 minutes)

**What we're doing:** Making your website accessible at spastream.net instead of the Vercel address.

### Step 5.1: Add Domain in Vercel

1. On the congratulations screen, click "Continue to Dashboard"
2. Click on the "Settings" tab (top menu)
3. Click "Domains" in the left sidebar
4. In the text box, type: `spastream.net`
5. Click "Add"

Vercel will show you some DNS records you need to add.

### Step 5.2: Update DNS at Your Domain Registrar

**What is DNS?** Think of it as the phone book of the internet. You're telling the internet that "spastream.net" should point to your Vercel website.

**Where you do this depends on where you bought your domain.** Common places:
- GoDaddy
- Namecheap
- Google Domains
- Hover
- Domain.com

**Steps (similar for all registrars):**

1. Log into the website where you bought spastream.net
2. Find "DNS Settings" or "Manage DNS" or "Domain Settings"
3. Look for a section about "DNS Records" or "Nameservers"

**You need to add these records:**

#### Record 1: For spastream.net
- **Type:** A
- **Name:** @ (or leave blank)
- **Value:** `76.76.21.21`
- **TTL:** 3600 (or leave as default)

#### Record 2: For www.spastream.net
- **Type:** CNAME
- **Name:** www
- **Value:** `cname.vercel-dns.com`
- **TTL:** 3600 (or leave as default)

4. Save your changes

### Step 5.3: Wait for DNS to Update

**This takes time!** Usually 5 minutes to 24 hours, but often around 30-60 minutes.

Back in Vercel:
1. Go to your project → Settings → Domains
2. You'll see your domain with a status - wait for it to say "Valid Configuration"

---

## Part 6: Test Your Website

Once DNS has updated (the domain shows "Valid Configuration" in Vercel):

1. Open a new browser window (or private/incognito window)
2. Go to `https://spastream.net`
3. Your website should load! 🎉

### Test These Things:
- ✅ Homepage loads
- ✅ Sign up creates an account
- ✅ Log in works
- ✅ Dashboard shows up after logging in
- ✅ Creating a client works
- ✅ Booking an appointment works

---

## Troubleshooting

### "This site can't be reached"
- **Cause:** DNS hasn't updated yet
- **Fix:** Wait longer (up to 24 hours). Try from a different device or network.

### Website loads but nothing works / errors everywhere
- **Cause:** Environment variables weren't set correctly
- **Fix:**
  1. Go to Vercel → Your Project → Settings → Environment Variables
  2. Double-check both variables are there with correct values
  3. Click "Redeploy" under Deployments tab

### "404 Page Not Found"
- **Cause:** Deployment failed or build error
- **Fix:**
  1. Go to Vercel → Your Project → Deployments
  2. Click on the latest deployment
  3. Check the "Build Logs" for errors
  4. Contact support with the error message

### Can't upload to GitHub
- **Cause:** Too many files or large files
- **Fix:** Use GitHub Desktop (Option A above) instead of the website

---

## Getting Help

If you get stuck:

1. **Vercel Support:** [vercel.com/support](https://vercel.com/support) - They're very responsive
2. **GitHub Support:** [support.github.com](https://support.github.com)
3. **Check Vercel Logs:** In your Vercel dashboard → Deployments → Click on a deployment → View logs

---

## Next Steps After Going Live

1. ✅ Test everything thoroughly
2. Set up your first medspa account
3. Import some test clients
4. Share the link with a friend to get feedback
5. Start inviting real clients!

---

## Important Notes

- **Vercel is FREE** for your usage level (personal/small business)
- **Automatic updates:** When you upload new files to GitHub, Vercel automatically updates your website
- **Backups:** GitHub keeps all your old versions, so you can never truly break your website
- **Security:** Your database credentials are safe - they're stored securely in Vercel and never exposed to visitors

---

**Questions?** If anything in this guide is confusing, ask for help before proceeding to the next step!