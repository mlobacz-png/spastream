# SMS Communication System Setup Guide

## Overview

SpaStream now includes a complete SMS messaging system with Twilio integration, automated appointment reminders, two-way texting, and message history tracking.

## Features

### 1. Twilio Integration
- Send and receive SMS messages
- Professional business phone number
- Delivery tracking and status updates
- Message history with audit trail

### 2. Automated Appointment Reminders
- Configurable reminder timing (hours before appointment)
- Customizable message templates
- Variable substitution (client name, service, time, etc.)
- Automatic sending based on schedule

### 3. Two-Way SMS Conversations
- Real-time messaging with clients
- Conversation threads by client
- Unread message badges
- Message status tracking (sent, delivered, failed)

### 4. Quick Send
- Send one-off messages to any client
- Character counter for SMS length
- Template support

## Getting Started

### Step 1: Create Twilio Account

1. **Sign Up for Twilio**
   - Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up for free (includes $15 trial credit)
   - Complete phone verification

2. **Get a Phone Number**
   - In Twilio Console, go to Phone Numbers → Buy a Number
   - Choose a local US number (+1)
   - Complete purchase ($1/month)
   - Note: Trial accounts can only send to verified numbers

### Step 2: Get Your Twilio Credentials

1. **Account SID**
   - Found on [Twilio Console Dashboard](https://console.twilio.com/)
   - Starts with "AC..."
   - This is your account identifier

2. **Auth Token**
   - Click "Show" next to Auth Token on dashboard
   - Keep this secret!
   - Used to authenticate API requests

3. **Phone Number**
   - Go to Phone Numbers → Manage → Active Numbers
   - Click your number
   - Copy the phone number in E.164 format (e.g., +15551234567)

### Step 3: Configure SpaStream

1. Navigate to **SMS** tab in your dashboard
2. Click **Settings** tab
3. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number
4. Enable "SMS System"
5. Configure appointment reminders (optional)
6. Click **Save Settings**

### Step 4: Configure Twilio Webhook (For Two-Way SMS)

To receive SMS messages from clients:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click your phone number
4. Scroll to "Messaging Configuration"
5. Under "A MESSAGE COMES IN":
   - Webhook: `https://[your-supabase-url]/functions/v1/twilio-webhook`
   - HTTP Method: POST
6. Click **Save**

Now when clients text your number, you'll receive their messages in the Conversations tab!

## Using the SMS System

### Sending Appointment Reminders

**Automatic Reminders:**
1. Enable "Auto-Send Reminders" in SMS Settings
2. Set hours before appointment (default: 24 hours)
3. Customize the reminder template
4. Reminders are sent automatically!

**Manual Reminders:**
1. Go to Calendar tab
2. Click on appointment
3. Click "Send Reminder"
4. SMS is sent instantly

**Message Template Variables:**
- `{{client_name}}` - Client's name
- `{{service}}` - Service name
- `{{time}}` - Appointment time
- `{{business_name}}` - Your business name
- `{{date}}` - Appointment date

**Example Template:**
```
Hi {{client_name}}! This is a reminder about your {{service}} appointment tomorrow at {{time}}. Reply CONFIRM to confirm or call us to reschedule. - {{business_name}}
```

### Two-Way SMS Conversations

1. Navigate to **SMS** tab
2. Click **Conversations** tab
3. See all conversations with unread badges
4. Click a conversation to view message history
5. Type reply and press Enter or click Send
6. Responses appear in real-time

**Tips:**
- Unread messages show a red badge
- Messages are color-coded (blue = you, white = client)
- Conversations auto-update when new messages arrive
- Click client name to see full profile

### Quick Send Messages

1. Navigate to **SMS** tab
2. Click **Quick Send** tab
3. Select a client from dropdown
4. Type your message
5. See character count (160 chars = 1 SMS)
6. Click **Send Message**

**Use Cases:**
- Send special offers or promotions
- Follow up after treatments
- Confirm appointment changes
- Birthday wishes
- Referral requests

## Pricing & Costs

### Twilio Costs (as of 2025)

**Phone Number:**
- $1.00/month for US local number
- Toll-free numbers: $2.00/month

**SMS Messages (US):**
- Outbound SMS: $0.0079 per message
- Inbound SMS: $0.0079 per message
- Long messages (>160 chars) count as multiple messages

**Example Monthly Costs:**

| Usage | Cost |
|-------|------|
| Phone number | $1.00 |
| 100 outbound SMS | $0.79 |
| 50 inbound SMS | $0.40 |
| **Total** | **$2.19/month** |

For a busy medspa (500 SMS/month): ~$5-10/month

### SpaStream Fees

**$0** - No markup on Twilio costs. You only pay Twilio's standard rates.

## Best Practices

### Message Content

1. **Always identify yourself:**
   - Start with your business name
   - Example: "This is [Business Name]..."

2. **Keep messages short and clear:**
   - Limit to 160 characters when possible
   - Get to the point quickly
   - Include a clear call-to-action

3. **Include opt-out instructions:**
   - "Reply STOP to unsubscribe" (Twilio handles this automatically)

4. **Be professional:**
   - Avoid slang or emojis unless brand-appropriate
   - Double-check spelling and grammar
   - HIPAA compliance: Never mention specific treatments publicly

### Timing

1. **Respect quiet hours:**
   - Don't send between 9 PM - 8 AM
   - Consider time zones

2. **Appointment reminders:**
   - 24 hours before is standard
   - 2-hour reminder for same-day bookings
   - Send confirmation within 1 hour of booking

3. **Marketing messages:**
   - Limit to 2-4 per month
   - Send during business hours
   - Test timing for best open rates

### HIPAA Compliance

1. **Never include PHI in SMS:**
   - No specific treatment details
   - No medical conditions
   - No prescription information

2. **Use generic language:**
   - "Your appointment tomorrow at 2 PM" ✅
   - "Your Botox injection tomorrow at 2 PM" ❌

3. **Secure your Twilio account:**
   - Use strong passwords
   - Enable two-factor authentication
   - Limit user access

4. **Document consent:**
   - Get written consent to send SMS
   - Keep consent forms on file
   - Honor opt-outs immediately

## Troubleshooting

### SMS Not Sending

**Check Twilio credentials:**
- Verify Account SID is correct
- Ensure Auth Token hasn't expired
- Confirm phone number format (+15551234567)

**Twilio account issues:**
- Check Twilio balance (trial or paid)
- Verify phone number is active
- Check for service outages on Twilio Status page

**Client phone number:**
- Ensure it's in correct format
- Verify it's a mobile number (not landline)
- Check if number is blocked by Twilio

### Not Receiving Client Messages

**Webhook configuration:**
- Verify webhook URL is correct
- Check webhook is set to POST
- Test webhook in Twilio Console

**Twilio number setup:**
- Ensure number has SMS capability
- Check messaging settings are enabled

### Message Delivery Failed

**Common reasons:**
- Invalid phone number
- Number on carrier blocklist
- Content flagged as spam
- Carrier network issues

**How to fix:**
- Ask client to verify their number
- Avoid spam trigger words (free, winner, etc.)
- Space out bulk messages
- Check message status in Twilio Console

## SMS Best Practices Checklist

✅ **Setup**
- [ ] Twilio account verified
- [ ] Business phone number purchased
- [ ] Credentials entered in SpaStream
- [ ] Webhook configured for two-way SMS
- [ ] Test message sent successfully

✅ **Compliance**
- [ ] SMS consent forms created
- [ ] Client consent obtained
- [ ] Opt-out process documented
- [ ] Staff trained on HIPAA rules
- [ ] Generic message templates created

✅ **Operations**
- [ ] Appointment reminder template customized
- [ ] Quick response templates prepared
- [ ] Quiet hours policy established
- [ ] Response time expectations set
- [ ] Escalation process for urgent messages

✅ **Monitoring**
- [ ] Weekly delivery rate check
- [ ] Monthly cost review
- [ ] Client feedback collected
- [ ] Message templates optimized
- [ ] Response times tracked

## Advanced Features

### Bulk SMS Campaigns (Coming Soon)

- Send promotional messages to filtered client lists
- Schedule campaigns for specific dates/times
- Track open and response rates
- A/B test message variations

### SMS Analytics (Coming Soon)

- Delivery rates by carrier
- Response time metrics
- Peak messaging hours
- Client engagement scores
- ROI tracking for campaigns

### Smart Auto-Replies (Coming Soon)

- Keyword-based automatic responses
- After-hours auto-reply
- FAQ auto-responses
- Appointment booking via SMS

## Support Resources

### Twilio Documentation
- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)
- [HIPAA Compliance Guide](https://www.twilio.com/docs/glossary/what-is-hipaa)

### SpaStream Support
- Check this documentation first
- Review message logs in SMS section
- Test with your own phone number first
- Contact support if issues persist

## FAQ

**Q: Can I use my existing business phone number?**
A: Not directly, but you can port your number to Twilio for $20 one-time fee.

**Q: What happens if I run out of Twilio credit?**
A: Messages will fail to send. Add credit or set up auto-recharge in Twilio Console.

**Q: Can clients text me outside business hours?**
A: Yes, but you can set up auto-replies for after-hours messages.

**Q: Is SMS HIPAA compliant?**
A: Standard SMS is not. Only send generic appointment reminders without PHI.

**Q: Can I send photos via SMS?**
A: MMS (photo messages) cost more ($0.02/message). Enable in Twilio if needed.

**Q: What if a client replies STOP?**
A: Twilio automatically unsubscribes them. You'll see the opt-out in message history.

**Q: Can multiple staff members use SMS?**
A: Yes! All messages are visible to everyone on your team.

**Q: Does this work internationally?**
A: Twilio supports international SMS but costs vary by country ($0.05-$0.50/message).
