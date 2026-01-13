# Deployment & Production Setup Guide

## Overview
This guide covers how to deploy SpaStream to production and manage it after launch.

## Database Strategy

### Current Setup (Development)
- **Development Database**: `kviciiartofmqbsbrqii.supabase.co`
- **Purpose**: Testing features, fixing bugs, development work
- **Access**: Available in this Bolt workspace and your local environment

### Production Setup (To Create)

**IMPORTANT**: You MUST create a separate Supabase project for production.

#### Step 1: Create Production Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "SpaStream Production"
4. Choose a strong database password (save it securely!)
5. Select a region close to your target customers
6. Wait for setup to complete (~2 minutes)

#### Step 2: Copy All Migrations to Production
Once your production database is created:

```bash
# You'll need to apply all migrations from supabase/migrations/ folder
# Do this in order, starting with the oldest:
```

1. `20251030210921_create_medspaflow_schema.sql`
2. `20251030212709_update_medspaflow_hipaa_compliance.sql`
3. `20251030214655_add_ai_features_schema.sql`
4. `20251030222035_add_client_photos.sql`
5. `20251030223047_add_client_photos.sql`
6. `20251030223111_add_treatment_recommendations_delete_policy.sql`
7. `20251031133846_add_revenue_packages_reminders.sql`
8. `20251031143845_add_inventory_management.sql`
9. `20251031143926_add_marketing_automation.sql`
10. `20251031160355_add_online_booking_system.sql`
11. `20251031172308_add_staff_operations_management.sql`
12. `20251031173132_add_client_portal_access.sql`
13. `20251031174511_fix_client_portal_access_policies.sql`
14. `20251031174814_allow_portal_users_view_booking_settings.sql`
15. `20251031180542_add_payment_system.sql`
16. `20251031182205_add_sms_system.sql`
17. `20251031191220_add_admin_role_system.sql`
18. `20251101013024_add_subscription_system.sql`
19. `20251101183710_fix_transactions_rls_policy.sql`

**Apply these through the Supabase Dashboard**:
- Go to SQL Editor in your production project
- Copy/paste each migration file content
- Run them in order

#### Step 3: Deploy Edge Functions to Production
You'll need to deploy all edge functions to your production Supabase project:

1. `appointment-reminders`
2. `dynamic-pricing`
3. `marketing-campaigns`
4. `no-show-predictor`
5. `process-payment`
6. `send-booking-confirmation`
7. `send-sms`
8. `staff-optimizer`
9. `stripe-webhook`
10. `treatment-recommendations`
11. `twilio-webhook`

**Note**: You may need the Supabase CLI or use the dashboard to deploy these.

## Environment Variables

### Development (.env.local)
```bash
# Development Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kviciiartofmqbsbrqii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key

# OpenAI (if using)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Twilio (Test Credentials)
TWILIO_ACCOUNT_SID=test_account_sid
TWILIO_AUTH_TOKEN=test_auth_token
TWILIO_PHONE_NUMBER=test_phone_number
```

### Production (Set in your hosting platform)
```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your_production_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# OpenAI (if using)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key

# Stripe (LIVE Mode - get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (Live Credentials)
TWILIO_ACCOUNT_SID=live_account_sid
TWILIO_AUTH_TOKEN=live_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Pros**:
- Automatic deployments from Git
- Built-in CI/CD
- Great Next.js support
- Free SSL
- Easy environment variable management
- Instant rollbacks

**Setup**:
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Connect your GitHub repo
5. Add production environment variables
6. Deploy!

**Custom Domain**:
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add "spastream.net"
4. Follow DNS instructions to point your domain to Vercel

### Option 2: Netlify

**Pros**:
- Similar to Vercel
- Great developer experience
- Built-in forms and functions

**Setup**:
1. Push code to GitHub
2. Connect to Netlify
3. Configure build settings
4. Add environment variables
5. Deploy

### Option 3: Self-Hosted (VPS)

**Only if you need full control**:
- DigitalOcean, AWS, or Linode
- Requires more DevOps knowledge
- You manage updates, security, scaling

## Deployment Workflow

### Initial Deployment
```bash
1. Create production Supabase project
2. Apply all migrations to production database
3. Deploy edge functions to production Supabase
4. Set up hosting (Vercel recommended)
5. Configure production environment variables
6. Deploy application
7. Configure custom domain (spastream.net)
8. Test thoroughly with test accounts
```

### Regular Updates (After Launch)
```bash
1. Make changes in Bolt or local environment
2. Test against DEVELOPMENT database
3. Push changes to GitHub
4. Vercel auto-deploys to production (or manual trigger)
5. Monitor for errors
6. If issues arise, instant rollback in Vercel
```

## Error Monitoring & Logging

### Recommended: Sentry (Free tier available)

**Setup**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Benefits**:
- Real-time error tracking
- User context (who experienced the error)
- Stack traces
- Email notifications
- Performance monitoring

**After setup**, you'll see:
- JavaScript errors
- API failures
- Database connection issues
- User actions leading to errors

### Alternative: LogRocket
- Session replay (see what user did)
- Network monitoring
- Performance tracking

## Post-Launch Monitoring Checklist

### Daily (First Week)
- [ ] Check Sentry for new errors
- [ ] Monitor Supabase dashboard for database performance
- [ ] Review Stripe dashboard for payment issues
- [ ] Check Twilio logs for SMS delivery

### Weekly
- [ ] Review analytics (user signups, active users)
- [ ] Check database storage usage
- [ ] Review customer support tickets/emails
- [ ] Monitor hosting costs

### Monthly
- [ ] Database backups (Supabase does this automatically, but verify)
- [ ] Review and optimize slow queries
- [ ] Update dependencies (`npm audit`, `npm outdated`)
- [ ] Review feature requests from customers

## Backup Strategy

### Database Backups (Supabase)
- **Automatic**: Supabase creates daily backups (Pro plan and above)
- **Manual**: Use Supabase Dashboard → Database → Backups
- **Download**: Export full database periodically for local storage

### Code Backups
- **GitHub**: Your source of truth
- **Vercel**: Keeps deployment history
- **Local**: Keep a local clone always

## Scaling Considerations

### When You Grow
1. **Database**: Supabase scales with your plan (upgrade as needed)
2. **Hosting**: Vercel auto-scales (pay as you grow)
3. **Edge Functions**: Supabase handles scaling
4. **CDN**: Vercel includes global CDN

### Performance Optimization
- Enable caching for static assets
- Optimize images (Next.js does this automatically)
- Use database indexes (already in migrations)
- Monitor slow API routes

## Security Checklist

### Pre-Launch
- [ ] Production database uses different credentials than dev
- [ ] All RLS policies tested and working
- [ ] Environment variables secured (never in code)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Stripe webhooks use webhook secrets
- [ ] CORS properly configured on edge functions
- [ ] Rate limiting on public endpoints (consider Vercel's protection)

### Ongoing
- [ ] Regular dependency updates
- [ ] Monitor Supabase audit logs
- [ ] Review user permissions quarterly
- [ ] Test RLS policies with new features

## Cost Estimates

### Monthly Operating Costs (Estimated)

**Tier 1: Starting Out (0-10 customers)**
- Vercel: $0 (Hobby plan)
- Supabase: $25/month (Pro plan)
- Stripe: Transaction fees only (2.9% + $0.30)
- Twilio: ~$20/month (varies by usage)
- Sentry: $0 (Free tier)
- Domain: ~$12/year
- **Total: ~$45-50/month**

**Tier 2: Growing (10-50 customers)**
- Vercel: $20/month (Pro plan)
- Supabase: $25/month (Pro plan)
- Stripe: Transaction fees
- Twilio: ~$50-100/month
- Sentry: $0-26/month
- **Total: ~$95-170/month**

**Tier 3: Established (50+ customers)**
- Vercel: $20/month or more
- Supabase: $599/month (Team plan for better performance)
- Stripe: Transaction fees
- Twilio: $200+/month
- Sentry: $26-80/month
- **Total: $845+/month**

**Note**: These are infrastructure costs. Your customer subscriptions should easily cover these.

## Domain Setup (spastream.net)

### DNS Configuration (After deploying to Vercel)

1. **Log in to your domain registrar** (where you bought spastream.net)

2. **Add these DNS records**:
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

3. **In Vercel Dashboard**:
   - Add domain: spastream.net
   - Add domain: www.spastream.net
   - Vercel will verify and issue SSL certificate

4. **Wait for propagation** (can take 24-48 hours)

## Testing Production Before Launch

### Create Test Accounts
1. Sign up with test email (e.g., test@youremail.com)
2. Test all features:
   - Client creation
   - Appointments
   - Payments (use Stripe test cards)
   - SMS (send to your phone)
   - Invoices
   - Reports

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Test Checklist
- [ ] User registration works
- [ ] Email confirmations arrive (if enabled)
- [ ] Dashboard loads properly
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Payments process correctly
- [ ] SMS messages send
- [ ] RLS properly restricts data access
- [ ] Online booking page works
- [ ] Client portal access works
- [ ] Reports generate correctly
- [ ] Mobile responsive design works

## Going Live Checklist

### 1 Week Before
- [ ] Production database created and migrated
- [ ] Edge functions deployed to production
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] All environment variables set
- [ ] Error monitoring configured
- [ ] Test accounts created and tested
- [ ] Stripe in live mode
- [ ] Twilio in live mode

### Launch Day
- [ ] Final test of all critical features
- [ ] Announce to beta users/early customers
- [ ] Monitor errors closely
- [ ] Be available for support

### First Week
- [ ] Daily error monitoring
- [ ] Quick response to customer issues
- [ ] Gather feedback
- [ ] Make hotfixes if needed

## Common Issues & Solutions

### Issue: "Can't connect to database"
- Check environment variables are set correctly in Vercel
- Verify Supabase project is active
- Check RLS policies aren't blocking queries

### Issue: "Stripe payments failing"
- Verify webhook secret is correct
- Check Stripe dashboard for error details
- Ensure using live keys, not test keys

### Issue: "SMS not sending"
- Check Twilio credentials
- Verify phone number is verified in Twilio
- Check Twilio logs for specific errors

### Issue: "Slow performance"
- Check Vercel analytics for slow functions
- Review Supabase query performance
- Optimize database indexes if needed
- Consider upgrading Supabase plan

## Support Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs

### Community Help
- Supabase Discord: https://discord.supabase.com
- Vercel Discord: https://vercel.com/discord
- Stack Overflow (tag: next.js, supabase)

### Paid Support
- Supabase: Team plan includes support
- Vercel: Pro and Enterprise plans include support
- Consider hiring a freelance developer for urgent issues

## Next Steps

1. **Create production Supabase project NOW** - Even before you launch, set this up
2. **Set up GitHub repository** - Version control is critical
3. **Deploy to Vercel** - Get familiar with the deployment process
4. **Configure monitoring** - Set up Sentry or similar
5. **Create test production environment** - Test with real (but test) data

## Questions?

Common questions addressed in this guide:
- ✅ Database strategy (dev vs production)
- ✅ Environment variables
- ✅ Deployment options
- ✅ Error monitoring
- ✅ Cost estimates
- ✅ Domain setup
- ✅ Security checklist
- ✅ Support workflow

For anything not covered here, refer to the SUPPORT_WORKFLOW.md document.
