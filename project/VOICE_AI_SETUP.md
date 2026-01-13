# Voice AI Phone System Setup Guide

## Overview

The Voice AI system provides each med spa with a dedicated phone number powered by Vapi.ai and Twilio. Calls are handled by an AI receptionist that can:

- Answer questions about services and pricing
- Schedule appointments automatically
- Collect caller information
- Handle after-hours calls
- Provide business hours and location info

## Architecture

```
Customer Call → Vapi.ai Number → Webhook → Supabase Edge Function → Database
                     ↓
              GPT-4 AI Assistant (configured per business)
```

Each business gets:
1. **Dedicated Twilio phone number** (via Vapi.ai)
2. **Custom AI assistant** (personalized greeting, services, hours)
3. **Call logging** (transcripts, summaries, analytics)
4. **Minutes tracking** (usage monitoring)

## Prerequisites

### 1. Vapi.ai Account

1. Sign up at [vapi.ai](https://vapi.ai)
2. Get your API key from the dashboard
3. Copy your API key

### 2. Twilio Account

1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from the console
3. Fund your account (phone numbers cost ~$1-2/month + usage)

### 3. Environment Variables

Add these to your `.env` file:

```bash
# Vapi.ai Configuration
VAPI_API_KEY=your_vapi_api_key_here

# Twilio Configuration (used by Vapi.ai)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## Database Setup

The database migration has already been applied with these tables:

### `voice_ai_config`
Stores each business's AI configuration:
- Phone number
- AI assistant name and greeting
- Business hours
- Booking instructions
- Minutes tracking

### `voice_ai_call_logs`
Stores all call activity:
- Call metadata (duration, cost, status)
- Full transcripts
- AI-generated summaries
- Intent detection (booking, question, complaint)

## Edge Functions

### 1. Vapi Webhook (`vapi-webhook`)

Handles three types of events:

#### a) `assistant-request` (incoming call)
- Looks up business by phone number
- Loads services and configuration
- Returns dynamic AI assistant config
- Creates call log entry

#### b) `status-update` (during call)
- Updates call status in real-time

#### c) `end-of-call-report` (after call)
- Saves transcript and summary
- Updates minutes used
- Logs final call details

### 2. Provision Phone Number (`provision-voice-number`)

Provisions a new Twilio number via Vapi.ai:
- Purchases number from Twilio
- Configures webhook URL
- Saves to database
- Returns number to user

## How It Works

### Step 1: Business Provisions Number

1. User enters business name
2. Clicks "Get Your AI Phone Number"
3. System calls `/functions/v1/provision-voice-number`
4. Vapi.ai purchases Twilio number
5. Number saved to `voice_ai_config` table

### Step 2: Customer Calls

1. Customer dials the business's dedicated number
2. Vapi.ai receives call, sends webhook to `/functions/v1/vapi-webhook`
3. Webhook looks up business by phone number
4. Returns AI configuration with:
   - Business name
   - Services list
   - Business hours
   - Custom instructions

### Step 3: AI Conversation

1. AI greets caller with custom message
2. GPT-4 processes conversation
3. Can answer questions about:
   - Services and pricing
   - Availability
   - Location and hours
4. Can collect booking information
5. Provides professional responses

### Step 4: Call Completion

1. Vapi.ai sends `end-of-call-report`
2. System saves:
   - Full transcript
   - AI summary
   - Call duration and cost
   - Detected intent (booking, question, etc.)
3. Updates monthly minutes used

## User Interface

### Voice AI Section (`/app?tab=voice-ai`)

**Dashboard Metrics:**
- Your dedicated phone number
- Total calls received
- Minutes used (with progress bar)

**Settings Tab:**
- AI Assistant Name
- Custom greeting message
- Booking instructions
- Enable/disable toggle

**Call History Tab:**
- Date and time of each call
- Caller's phone number
- Call duration
- Status (completed, in-progress, failed)
- Intent detected
- View full transcript and summary

## Deployment Checklist

- [ ] Set up Vapi.ai account and get API key
- [ ] Set up Twilio account and get credentials
- [ ] Add environment variables to `.env`
- [ ] Deploy edge functions:
  ```bash
  # These are already created in supabase/functions/
  # They will be deployed when you push to production
  ```
- [ ] Test webhook endpoint
- [ ] Test number provisioning
- [ ] Test incoming call flow

## Testing

### 1. Test Provisioning

```typescript
// From the UI:
1. Navigate to Voice AI tab
2. Enter your business name
3. Click "Get Your AI Phone Number"
4. Verify number appears in the UI
```

### 2. Test Webhook

```bash
# Manually trigger webhook (for development)
curl -X POST https://your-project.supabase.co/functions/v1/vapi-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "assistant-request",
    "call": {
      "id": "test-call-123",
      "phoneNumberId": "test-number-id",
      "customer": {
        "number": "+15551234567"
      }
    },
    "phoneNumber": {
      "number": "+15559876543"
    }
  }'
```

### 3. Test Actual Call

1. Provision a number through the UI
2. Call your new number from a phone
3. Have a conversation with the AI
4. Check call logs in the Voice AI section
5. Verify transcript was saved

## Configuration Webhook in Vapi.ai

Once you have the edge function deployed, configure the webhook in Vapi.ai:

1. Go to Vapi.ai dashboard
2. Navigate to Settings → Webhooks
3. Add your webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/vapi-webhook
   ```
4. Select these events:
   - assistant-request
   - status-update
   - end-of-call-report

## Pricing Structure

### Costs:
- **Phone Number:** ~$1-2/month (Twilio)
- **AI Calls:** ~$0.10-0.15 per minute (Vapi.ai + OpenAI)
- **Average 5-minute call:** ~$0.50-0.75

### Your Subscription Pricing:
- **Basic Plan:** 300 minutes/month included
- **Pro Plan:** 1000 minutes/month included
- **Elite Plan:** 2500 minutes/month included

### Your Revenue Per Business:
- $97-197/month subscription
- ~$1-2/month phone number cost
- Average 200 minutes usage = ~$20-30/month AI cost
- **Net margin:** $65-175/month per business

## Customization Options

### Per-Business Settings:

1. **AI Assistant Name:** Personalize the receptionist's name
2. **Greeting Message:** Custom greeting script
3. **Business Hours:** Automatically loaded from settings
4. **Services:** Pulled from services table
5. **Booking Instructions:** Special rules for appointments

### System-Wide Settings:

- Voice model (11Labs "Sarah" voice)
- GPT-4 model with temperature 0.7
- Professional, friendly tone
- Medical spa industry knowledge

## Troubleshooting

### Issue: "Configuration not found"
- **Cause:** Phone number not in database
- **Fix:** Verify number was provisioned successfully

### Issue: "Voice AI is not enabled"
- **Cause:** `is_enabled` flag is false
- **Fix:** Toggle switch in Voice AI settings

### Issue: Calls not being logged
- **Cause:** Webhook not receiving events
- **Fix:** Check Vapi.ai webhook configuration

### Issue: High costs
- **Cause:** Too many/long calls
- **Fix:** Set up usage alerts, monitor minutes dashboard

## Future Enhancements

Potential additions:
- Multi-language support
- Advanced intent detection
- Automatic appointment creation (currently manual)
- SMS follow-ups after calls
- Voicemail transcription
- Call recording playback
- Real-time call monitoring
- IVR menu options
- Business-hours routing

## Support Resources

- **Vapi.ai Docs:** [docs.vapi.ai](https://docs.vapi.ai)
- **Twilio Docs:** [twilio.com/docs](https://www.twilio.com/docs)
- **OpenAI API:** [platform.openai.com/docs](https://platform.openai.com/docs)

## Security Notes

- Phone numbers are stored securely in Supabase
- All API keys are environment variables (never committed)
- RLS policies restrict access to each business's own data
- Webhooks use service role for secure database access
- Call recordings are stored with Vapi.ai (HIPAA compliant tier available)

---

**Ready to Launch:** Once environment variables are set, the system is fully functional and ready for production use!
