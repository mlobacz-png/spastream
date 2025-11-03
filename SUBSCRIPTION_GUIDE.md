# Subscription & Feature Gating System

This guide explains how the subscription system works and how to implement feature gating throughout the application.

## Overview

The application now has a complete subscription management system with 4 pricing tiers:

- **Starter**: $299/month
- **Professional**: $599/month
- **Premium**: $999/month
- **Enterprise**: $1,499/month

## Database Schema

### Tables

**subscription_plans**
- Stores the 4 available subscription tiers
- Each plan has a `features` JSONB column with feature flags and limits
- Example features: `max_clients`, `max_providers`, `payment_processing`, `sms_communications`, `ai_features`, etc.

**user_subscriptions**
- Tracks each user's current subscription
- Fields: `user_id`, `plan_id`, `status`, `trial_ends_at`, `stripe_subscription_id`, etc.
- Status can be: `active`, `trialing`, `cancelled`, `expired`, `past_due`
- One subscription per user (enforced by UNIQUE constraint)

## How It Works

### 1. Plan Selection (Onboarding)

When a user first signs up or visits `/onboarding?step=plan`, they see the `PlanSelection` component which:

1. Displays all 4 pricing tiers with their features
2. When user selects a plan, creates a record in `user_subscriptions` with:
   - Status: `trialing`
   - Trial ends in 14 days
3. Redirects to the main onboarding flow

### 2. Feature Gating

There are three ways to implement feature gating:

#### Option A: Using the FeatureGate Component

Wrap any feature in the `FeatureGate` component:

```tsx
import { FeatureGate } from '@/components/feature-gate';

<FeatureGate featureName="payment_processing">
  <PaymentSection />
</FeatureGate>
```

If the user doesn't have access, they see an upgrade prompt.

#### Option B: Programmatic Checks

Use utility functions to check access:

```tsx
import { hasFeatureAccess, getFeatureLimit } from '@/lib/subscription-utils';

// Check boolean feature
const hasPayments = await hasFeatureAccess('payment_processing');

// Get numeric limit
const maxClients = await getFeatureLimit('max_clients');
// Returns -1 for unlimited
```

#### Option C: Limit Checks (Already Implemented)

For limits like clients and providers, use helper functions:

```tsx
import { canAddClient, canAddProvider } from '@/lib/subscription-utils';

const { allowed, message } = await canAddClient();
if (!allowed) {
  toast({ title: 'Limit Reached', description: message });
  return;
}
```

**Example**: The `ClientDialog` component already implements this check.

### 3. Feature Flags in Database

Each plan has a `features` JSONB object with these keys:

```json
{
  "max_clients": 100,              // -1 for unlimited
  "max_providers": 1,              // -1 for unlimited
  "calendar": true,
  "client_management": true,
  "payment_processing": false,     // Locked on Starter
  "invoice_generation": false,     // Locked on Starter
  "sms_communications": false,     // Locked on Starter
  "sms_monthly_limit": 0,
  "treatment_packages": false,     // Locked on Starter
  "ai_features": false,            // false, "limited", or "full"
  "analytics": "basic",            // "basic" or "advanced"
  "inventory_management": false,
  "marketing_automation": false,
  "staff_management": false,
  "priority_support": false,
  "custom_integrations": false,
  "multi_location": false
}
```

### 4. Viewing Subscription Details

Users can view their subscription and usage in the `SubscriptionSettings` component:

```tsx
import { SubscriptionSettings } from '@/components/subscription-settings';

<SubscriptionSettings />
```

This shows:
- Current plan and status
- Trial countdown (if applicable)
- Usage progress bars for clients/providers
- Feature list
- Upgrade button

## Implementation Examples

### Example 1: Hide a Feature Completely

```tsx
<FeatureGate featureName="marketing_automation" showUpgradePrompt={false}>
  <MarketingSection />
</FeatureGate>
```

Without `showUpgradePrompt`, the feature just won't render.

### Example 2: Show Upgrade Prompt

```tsx
<FeatureGate featureName="ai_features">
  <AIRecommender />
</FeatureGate>
```

User sees a card prompting them to upgrade.

### Example 3: Check Before Action

```tsx
async function handleAddStaff() {
  const { allowed, message } = await canAddProvider();

  if (!allowed) {
    toast({
      title: 'Provider Limit Reached',
      description: message,
      variant: 'destructive',
    });
    return;
  }

  // Proceed with adding staff...
}
```

### Example 4: Conditional UI

```tsx
const [hasAI, setHasAI] = useState(false);

useEffect(() => {
  async function check() {
    const access = await hasFeatureAccess('ai_features');
    setHasAI(access);
  }
  check();
}, []);

return (
  <div>
    {hasAI ? (
      <AIFeatures />
    ) : (
      <Button onClick={() => router.push('/onboarding?step=plan')}>
        Upgrade to Access AI
      </Button>
    )}
  </div>
);
```

## Adding New Feature Gates

To add a new feature gate:

1. Add the feature flag to the plans in the migration file
2. Use `FeatureGate` component or utility functions
3. Test with different subscription tiers

## Upgrading Plans

Users can upgrade by:
1. Clicking "Upgrade Plan" in subscription settings
2. Visiting `/onboarding?step=plan`
3. Selecting a new plan

The system will:
- Update their `user_subscriptions.plan_id`
- Immediately grant access to new features
- Stripe integration handles billing (when configured)

## Database Functions

Two PostgreSQL functions are available:

**has_feature_access(feature_name)**
- Returns boolean
- Checks current user's plan
- Only works for active/trialing subscriptions

**get_feature_limit(feature_name)**
- Returns integer
- Returns -1 for unlimited
- Returns 0 if no subscription

## Next Steps

To fully implement feature gating:

1. Add `FeatureGate` components to locked features
2. Implement limit checks on SMS section (check `sms_monthly_limit`)
3. Gate AI features with "limited" vs "full" access
4. Add provider limit check to staff section
5. Connect Stripe for payment processing
6. Add subscription status to user profile display
7. Implement subscription cancellation flow
8. Add webhook handlers for Stripe subscription events

## Testing

To test different plans:

1. Sign up with a new account
2. Select a plan during onboarding
3. Try to exceed limits (add clients/providers)
4. Visit locked features
5. Upgrade to a higher tier
6. Verify new features are accessible
