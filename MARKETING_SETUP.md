# Marketing Automation Setup

## Overview

SpaStream includes powerful marketing automation features that can send automated emails to your clients based on triggers like birthdays, win-back campaigns, post-treatment follow-ups, and review requests.

## How It Works

The marketing system uses Supabase Edge Functions to process campaigns and send emails through Resend, a modern email delivery service.

### Campaign Processing

Campaigns are processed when you click the "Process Campaigns" button in the Marketing section. The system:

1. Checks all active campaigns
2. Finds eligible clients based on campaign rules (e.g., birthday today, 90+ days since last visit)
3. Sends personalized emails to eligible clients
4. Records campaign executions and updates statistics

### Campaign Types

- **Birthday Campaign**: Automatically sent on client birthdays
- **Win-Back Campaign**: Sent to clients who haven't visited in 90+ days
- **Post-Treatment Follow-up**: Sent 7 days after each treatment
- **Review Request**: Sent 14 days after treatment completion
- **Promotional**: Manual send - select recipients when ready
- **Referral Program**: Sent to clients who refer new clients

## Setting Up Email Delivery (Optional)

To actually send emails, you need to configure a Resend API key. Without this, the system will simulate sending but won't deliver actual emails.

### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day included)
3. No credit card required

### Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to API Keys
3. Create a new API key
4. Copy the key (it starts with `re_`)

### Step 3: Add API Key to Supabase

This step requires access to your Supabase project dashboard:

1. Go to your Supabase project settings
2. Navigate to Edge Functions → Secrets
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)

### Step 4: Test Your Setup

1. Create a campaign in the Marketing section
2. Click the test tube icon next to the campaign
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox (and spam folder)

## Using the System Without Email Setup

The marketing system works perfectly fine without Resend configuration:

- You can create campaigns
- You can set campaigns to active
- The system tracks when it would send emails
- Statistics are updated as if emails were sent
- This is great for testing and development

When you're ready to send real emails, simply add the Resend API key.

## Features

### Campaign Management

- Create unlimited campaigns
- Use pre-built templates or create custom content
- Variables: `{{client_name}}`, `{{practice_name}}`, `{{discount}}`, `{{treatment_name}}`
- Activate/pause campaigns with one click
- Edit campaigns anytime

### Analytics

- Total emails sent
- Open rate (requires email tracking setup)
- Click rate (requires link tracking)
- Conversion rate (bookings after email)

### Testing

- Send test emails before activating campaigns
- Preview how emails will look to clients
- Safe testing without affecting real statistics

## Best Practices

1. **Start with Templates**: Use the default templates as a starting point
2. **Personalize**: Use variables to make emails feel personal
3. **Test First**: Always send a test email before activating
4. **Monitor Stats**: Check open and conversion rates to optimize
5. **Don't Over-Send**: The system prevents sending to the same client within 30 days
6. **Compliance**: Always include an unsubscribe option (coming soon)

## Future Enhancements

- SMS support via Twilio
- Advanced segmentation
- A/B testing
- Unsubscribe management
- Schedule campaigns for specific times
- Drip campaigns

## Support

For questions about marketing automation, refer to the main documentation or contact support.
