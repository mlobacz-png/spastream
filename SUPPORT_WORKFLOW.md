# Customer Support & Troubleshooting Workflow

## Overview
This document outlines how to handle customer issues and provide support after launching SpaStream.

## Support Channels

### Recommended Setup
1. **Email**: support@spastream.net (primary)
2. **In-app help**: Link to help docs or contact form
3. **Optional**: Live chat widget (Intercom, Crisp, etc.)

### Email Template Setup
Create canned responses for common issues:

```
Subject: Re: [Issue Description]

Hi [Customer Name],

Thank you for reaching out. I understand you're experiencing [brief description of issue].

[Solution/Next steps]

I've [action taken] and this should resolve the issue. Please try [specific action] and let me know if you're still experiencing problems.

Best regards,
[Your Name]
SpaStream Support
```

## Issue Triage Process

### Step 1: Categorize the Issue

**Critical (Fix Immediately)**
- Platform down/not loading
- Payment processing broken
- Data loss or corruption
- Security vulnerability
- Unable to access appointments

**High Priority (Fix within 24 hours)**
- Feature not working for all users
- SMS not sending
- Calendar sync issues
- Reporting errors

**Medium Priority (Fix within 3-5 days)**
- UI bugs (visual issues)
- Minor feature glitches
- Performance issues (slow but working)
- Feature requests from paying customers

**Low Priority (Backlog)**
- Feature requests (new functionality)
- Nice-to-have improvements
- Documentation updates

### Step 2: Information Gathering

**Always Ask For**:
1. User's email (to find their account)
2. What they were trying to do
3. What happened vs what they expected
4. Screenshots if relevant
5. Browser and device (if UI issue)
6. Approximate time issue occurred

**Template Email**:
```
Thank you for reporting this issue. To help me investigate, could you please provide:

1. Your account email address
2. What you were trying to do when this happened
3. What you expected to happen
4. What actually happened
5. A screenshot if possible
6. Approximate time this occurred

This will help me resolve this quickly for you.
```

## Troubleshooting Steps

### Issue: User Can't Log In

**Investigation**:
1. Check Supabase Authentication logs
   - Go to Supabase Dashboard → Authentication → Users
   - Search for user's email
   - Check "Last Sign In" timestamp

2. Common causes:
   - Wrong password (reset password)
   - Email not confirmed (if you enable email confirmation)
   - Account doesn't exist (check spelling)
   - Browser cookies disabled

**Solution**:
```sql
-- Check if user exists in Supabase Dashboard SQL Editor:
SELECT email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'customer@example.com';

-- If user exists, send password reset email through Supabase Dashboard
-- Or use the Auth API to resend confirmation email if needed
```

**Customer Response**:
```
I've checked your account and [found the issue]. I've sent a password reset
email to [their email]. Please check your spam folder if you don't see it
within 5 minutes.
```

### Issue: Data Not Showing Up

**Investigation**:
1. Check RLS policies - most common issue!
2. Verify data actually exists in database
3. Check browser console for errors

**Steps**:
```sql
-- In Supabase SQL Editor, check if data exists:
SELECT * FROM clients WHERE business_id = 'their_business_id';

-- Check RLS policies are working:
SELECT * FROM clients WHERE id = 'specific_client_id';
-- If you can see it but user can't, it's an RLS issue
```

**Common RLS Issues**:
- User's `business_id` doesn't match data
- User role not set correctly
- Policy logic error

**Solution**:
```sql
-- Check user's business_id:
SELECT id, email, business_id FROM profiles WHERE email = 'customer@example.com';

-- If business_id is wrong, update it:
UPDATE profiles SET business_id = 'correct_business_id'
WHERE email = 'customer@example.com';
```

### Issue: Payments Not Processing

**Investigation**:
1. Check Stripe Dashboard → Payments → All payments
2. Look for failed payments for that customer
3. Check error message in Stripe

**Common Causes**:
- Card declined (customer's bank issue)
- Stripe webhook not configured
- Wrong Stripe keys in environment variables
- Customer's card expired

**Steps**:
```bash
# Check Stripe webhook logs in Stripe Dashboard:
Developers → Webhooks → [your webhook] → Attempts

# Check edge function logs in Supabase:
Edge Functions → stripe-webhook → Logs
```

**Solution Templates**:

*If card declined*:
```
Your payment was declined by your bank. This is usually due to:
- Insufficient funds
- Card security settings
- Expired card

Please try a different payment method or contact your bank.
```

*If Stripe webhook failed*:
```
I found a technical issue with our payment processing. I've fixed it
and manually processed your payment. Your subscription is now active.
```

### Issue: SMS Not Sending

**Investigation**:
1. Check Twilio Dashboard → Monitor → Logs
2. Look for failed messages
3. Check error codes

**Common Causes**:
- Phone number not verified (Twilio trial)
- Insufficient Twilio balance
- Invalid phone number format
- Twilio credentials wrong

**Solution**:
```bash
# Check Twilio logs in Supabase Edge Functions:
Edge Functions → send-sms → Logs

# Check phone number format in database:
SELECT phone FROM clients WHERE id = 'client_id';
# Should be: +1234567890 (with country code)
```

**Fix Invalid Phone Numbers**:
```sql
-- Update phone number to correct format:
UPDATE clients
SET phone = '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
WHERE id = 'client_id';
```

### Issue: Slow Performance

**Investigation**:
1. Vercel Analytics → Performance
2. Supabase Dashboard → Database → Query Performance
3. Check for slow queries

**Common Causes**:
- Missing database indexes
- Fetching too much data
- N+1 query problem
- Large images not optimized

**Solution**:
```sql
-- Check slow queries in Supabase:
-- Go to Database → Query Performance

-- Add missing indexes if needed:
CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_clients_business
ON clients(business_id);
```

### Issue: Email Not Received

**Investigation**:
1. Check spam/junk folder (tell customer first)
2. Check Supabase Edge Functions logs
3. Verify email sending service is working

**Common Causes**:
- In spam folder (90% of the time)
- Wrong email address
- Email service credentials wrong
- Email service rate limit hit

**Customer Response**:
```
Please check your spam/junk folder first - that's where it usually ends up.
If it's not there, I can:
1. Resend the email
2. Send it to a different email address
3. [Alternative solution depending on context]
```

## Direct Database Access (When Needed)

### Viewing Customer Data

**IMPORTANT**: Only access production database when necessary. Never modify production data without backing up first.

```sql
-- Find user's business:
SELECT b.* FROM businesses b
JOIN profiles p ON p.business_id = b.id
WHERE p.email = 'customer@example.com';

-- View their clients:
SELECT * FROM clients
WHERE business_id = (
  SELECT business_id FROM profiles WHERE email = 'customer@example.com'
);

-- View their appointments:
SELECT a.*, c.name as client_name
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE a.business_id = (
  SELECT business_id FROM profiles WHERE email = 'customer@example.com'
)
ORDER BY a.appointment_date DESC
LIMIT 10;
```

### Common Data Fixes

**Fix: Reset User's Password**
- Do this through Supabase Dashboard → Authentication → Users
- Click user → "Send Password Reset Email"
- OR set temporary password and send it securely

**Fix: Change User's Subscription Tier**
```sql
-- Check current tier:
SELECT subscription_tier, subscription_status
FROM businesses
WHERE id = 'business_id';

-- Update tier:
UPDATE businesses
SET subscription_tier = 'professional',
    subscription_status = 'active'
WHERE id = 'business_id';
```

**Fix: Restore Deleted Data (within 24 hours of deletion)**
```sql
-- Check if soft-deleted (if you implemented soft deletes):
SELECT * FROM clients WHERE id = 'client_id' AND deleted_at IS NOT NULL;

-- Restore:
UPDATE clients SET deleted_at = NULL WHERE id = 'client_id';
```

**Fix: Duplicate Data Issue**
```sql
-- Find duplicates:
SELECT email, COUNT(*)
FROM clients
WHERE business_id = 'business_id'
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates (keep newest):
DELETE FROM clients
WHERE id NOT IN (
  SELECT MAX(id) FROM clients GROUP BY email, business_id
)
AND business_id = 'business_id';
```

## Development Environment for Fixing Bugs

### Option 1: Use This Bolt Workspace

**Pros**: Already set up, easy to test
**Cons**: Uses shared development database

**Workflow**:
1. Customer reports bug
2. Try to reproduce in Bolt
3. Fix the bug
4. Test the fix
5. Push to GitHub
6. Vercel auto-deploys to production

### Option 2: Local Development Setup

**One-time Setup**:
```bash
# Clone your GitHub repo:
git clone https://github.com/yourusername/spastream.git
cd spastream

# Install dependencies:
npm install

# Create .env.local with development credentials:
cp .env.example .env.local
# Edit .env.local with your dev database credentials

# Run locally:
npm run dev
# App runs at http://localhost:3000
```

**For Each Bug Fix**:
```bash
# Create a new branch:
git checkout -b fix/description-of-bug

# Make changes
# Test locally

# Commit and push:
git add .
git commit -m "Fix: Description of what was fixed"
git push origin fix/description-of-bug

# Merge to main (or create PR)
git checkout main
git merge fix/description-of-bug
git push origin main

# Vercel auto-deploys
```

## Hotfix Process (Critical Bugs)

### When Production is Broken

**Step 1: Assess Impact**
- How many users affected?
- Is data at risk?
- Can we temporarily disable feature?

**Step 2: Quick Fix**
```bash
# Make fix in Bolt or locally
# Test quickly (don't need to be perfect, just working)
# Push to GitHub immediately
# Vercel deploys in ~2 minutes
```

**Step 3: Communicate**
- Email affected customers
- Post status update if you have status page
- Be transparent about timeline

**Step 4: Proper Fix Later**
- Quick fix gets things working
- Proper fix addresses root cause
- Deploy proper fix when ready

**Template Communication**:
```
Subject: Service Issue Resolved

Hi [Customer Name],

We experienced a technical issue between [start time] and [end time]
that affected [description of impact].

This has been resolved and everything is now working normally.

We apologize for any inconvenience. [Optional: offer of credit/extension]

If you have any questions or continuing issues, please reply to this email.

Best regards,
[Your Name]
```

## Preventing Future Issues

### Weekly Review
1. Review all issues reported
2. Look for patterns
3. Prioritize fixes for common issues

### Monthly Tasks
1. Update dependencies (`npm outdated`, `npm audit`)
2. Review and optimize slow database queries
3. Check error monitoring dashboard
4. Update documentation based on common questions

### Quarterly Review
1. Customer satisfaction survey
2. Review feature requests
3. Plan major updates
4. Security audit

## Customer Communication Best Practices

### Response Times
- **Critical Issues**: Within 1 hour
- **High Priority**: Within 4 hours
- **Normal Issues**: Within 24 hours
- **Feature Requests**: Acknowledge within 48 hours

### Tone and Language
- Be empathetic ("I understand how frustrating this must be")
- Be specific ("I've fixed X by doing Y")
- Be transparent ("This happened because...")
- Be solution-focused ("Here's what I've done to prevent this in the future")

### Follow Up
- After resolving issue, ask if it's still working
- Send summary email with what was done
- Ask for feedback on support experience

## Escalation Path

### When You Need Help

**Technical Issues**:
1. Stack Overflow (search first)
2. Supabase Discord
3. Vercel Support (if Pro plan)
4. Hire freelancer (Upwork, Toptal)

**Business Issues**:
1. Legal: Consult lawyer
2. Accounting: Consult accountant
3. Strategy: Business mentor/advisor

**Emergency Contact List**:
- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com
- Stripe Status: https://status.stripe.com
- [Add your own emergency contacts]

## Support Metrics to Track

### Key Metrics
- Average response time
- Average resolution time
- Customer satisfaction score
- Number of tickets by category
- Common issues (for prioritization)

### Tools for Tracking
- Simple: Google Sheets
- Better: Help Scout, Zendesk, Freshdesk
- Or use existing email + spreadsheet

## Templates & Scripts

### Password Reset Request
```
Subject: Password Reset - SpaStream

Hi [Name],

I've sent a password reset link to this email address. You should receive
it within 5 minutes. Please check your spam folder if you don't see it.

The link expires in 1 hour for security reasons.

If you didn't request this reset, please ignore this email and your
password will remain unchanged.
```

### Feature Request Response
```
Subject: Re: Feature Request - [Feature Name]

Hi [Name],

Thank you for the suggestion! I really appreciate you taking the time to
share your ideas for improving SpaStream.

I've added this to our feature request list and I'll keep you updated on
its progress. We prioritize features based on customer demand and technical
feasibility.

Is there anything else I can help you with in the meantime?
```

### Subscription Cancellation
```
Subject: Subscription Cancellation Confirmation

Hi [Name],

I've processed your cancellation request. Your subscription will remain
active until [end date], after which you'll no longer be charged.

Your data will be retained for 30 days in case you decide to return, after
which it will be permanently deleted per our data retention policy.

We're sorry to see you go. If there's anything we could have done better,
I'd love to hear your feedback.
```

## Quick Reference: Common SQL Queries

```sql
-- Find user by email:
SELECT * FROM profiles WHERE email = 'user@example.com';

-- Check user's subscription:
SELECT b.name, b.subscription_tier, b.subscription_status
FROM businesses b
JOIN profiles p ON p.business_id = b.id
WHERE p.email = 'user@example.com';

-- Count user's clients:
SELECT COUNT(*) FROM clients
WHERE business_id = (SELECT business_id FROM profiles WHERE email = 'user@example.com');

-- Recent appointments:
SELECT a.appointment_date, a.service_type, c.name as client_name
FROM appointments a
JOIN clients c ON c.id = a.client_id
WHERE a.business_id = (SELECT business_id FROM profiles WHERE email = 'user@example.com')
ORDER BY a.appointment_date DESC
LIMIT 10;

-- Check payment history:
SELECT * FROM transactions
WHERE business_id = (SELECT business_id FROM profiles WHERE email = 'user@example.com')
ORDER BY created_at DESC;
```

## Remember

1. **Customer data is sacred** - Never delete or modify without explicit permission and backup
2. **Test fixes in dev first** - Unless it's a critical hotfix
3. **Document everything** - Notes on each support ticket help identify patterns
4. **Be responsive** - Even if you don't have a solution yet, acknowledge the issue
5. **Learn from issues** - Each bug is an opportunity to improve the platform

## Next Steps

After reading this guide:
1. Set up support email (support@spastream.net)
2. Create email templates for common responses
3. Bookmark Supabase and Vercel dashboards
4. Set up error monitoring (Sentry)
5. Create a spreadsheet for tracking support tickets
6. Test the support workflow with a friend before launch
