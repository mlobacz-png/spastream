# Payment System Setup Guide

## Overview

SpaStream now includes a complete payment processing system with Stripe integration, invoice generation, payment collection, and package payment plans.

## Features

### 1. Payment Settings
- Stripe integration for online card payments
- Multiple payment methods (Card, Cash, Check)
- Deposit collection at booking
- Configurable tax rates
- Currency selection

### 2. Invoice Management
- Professional invoice generation
- Auto-generated invoice numbers (INV-YYYYMMDD-XXX)
- Line items with quantities and pricing
- Tax and discount calculations
- PDF export with branded design
- Multiple statuses: Draft, Sent, Paid, Overdue, Cancelled

### 3. Payment Collection
- Manual payment recording (Cash/Check)
- Stripe payment processing for cards
- Deposit collection for appointments
- Package payment plans
- Transaction history tracking

### 4. Client Portal Integration
- Clients can view invoices
- Clients can see payment history
- Clients can view package payment balances

## Getting Started

### Step 1: Configure Stripe (Optional)

If you want to accept online card payments:

1. **Create a Stripe Account**
   - Go to [stripe.com](https://dashboard.stripe.com/register)
   - Sign up for a free account
   - Complete verification

2. **Get Your API Keys**
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Find your Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Find your Secret Key (starts with `sk_test_` or `sk_live_`)

3. **Add Keys to SpaStream**
   - Navigate to **Payments** tab in your dashboard
   - Enter your Publishable Key
   - Enter your Secret Key
   - Click **Save Settings**

4. **Configure Webhook (Important)**
   - In Stripe Dashboard, go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://[your-supabase-url]/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded` and `payment_intent.payment_failed`
   - Copy the webhook signing secret (optional, for additional security)

### Step 2: Configure Payment Methods

1. Navigate to **Payments** tab
2. Toggle on the payment methods you accept:
   - **Credit/Debit Card** - Requires Stripe configuration
   - **Cash** - In-person payments
   - **Check** - Physical or digital checks

### Step 3: Set Up Deposits (Optional)

If you want to require deposits for bookings:

1. In **Payments** tab, enable "Require Deposit"
2. Choose deposit type:
   - **Percentage**: e.g., 50% of service cost
   - **Fixed Amount**: e.g., $50 flat deposit
3. Deposits are tracked separately and applied to final balance

### Step 4: Configure Tax Settings

1. Enter your Sales Tax Rate (e.g., 8.5 for 8.5%)
2. Tax is automatically calculated on all invoices
3. Select your currency (USD, CAD, EUR, GBP)

## Using the Payment System

### Creating an Invoice

1. Navigate to **Invoices** tab
2. Click **Create Invoice**
3. Select client from dropdown
4. Add line items:
   - Choose service from list
   - Adjust quantity if needed
   - Price is auto-filled but can be modified
5. Add discount if applicable
6. Add notes for client
7. Click **Create Invoice**

The invoice is saved as "Draft" status and can be edited.

### Generating PDF Invoice

1. Find the invoice in your list
2. Click the download icon
3. PDF is automatically generated and downloaded
4. PDF includes:
   - Your business information
   - Client details
   - Itemized line items
   - Tax calculations
   - Payment status
   - Professional branding

### Recording a Payment

**For Manual Payments (Cash/Check):**

1. Find the client's invoice or appointment
2. Click "Collect Payment"
3. Select payment method (Cash or Check)
4. Enter amount received
5. Add notes if needed
6. Click "Record Payment"

The payment is logged and invoice balance is updated automatically.

**For Card Payments (Stripe):**

1. Select "Card" as payment method
2. Amount is processed through Stripe
3. Client receives email receipt
4. Payment status updated automatically via webhook

### Managing Package Payments

1. Create a package with total cost
2. System creates payment plan record
3. Record payments as received
4. Track balance due
5. Option for auto-charging if Stripe configured

### Payment History

All payments are tracked in the **Transactions** table:
- Payment date and time
- Client name
- Amount
- Payment method
- Status (Pending, Completed, Failed, Refunded)
- Card details (last 4 digits, brand) for Stripe payments
- Receipt URL for Stripe payments
- Notes

## Database Schema

### Tables Created

1. **payment_settings**
   - Stores Stripe keys and payment preferences
   - One record per user

2. **invoices**
   - Professional invoices with line items
   - Auto-calculated totals
   - Status tracking

3. **transactions**
   - All payment records
   - Links to invoices, appointments, packages
   - Stripe payment details

4. **package_payments**
   - Payment plans for packages
   - Auto-charge capability
   - Balance tracking

## Security & Compliance

### PCI Compliance
- All card processing handled by Stripe
- No card data stored in your database
- Stripe is PCI DSS Level 1 certified

### Data Protection
- Row Level Security (RLS) on all tables
- Encrypted Stripe keys at rest
- Users can only access their own data
- Clients can only view their own invoices via portal

### Audit Trail
- All payments logged with timestamps
- User actions tracked
- No data can be permanently deleted

## Pricing & Costs

### Stripe Fees (if using card payments)
- 2.9% + $0.30 per successful card charge
- No monthly fees
- No setup fees
- Only pay when you get paid

### Alternatives to Stripe Fees
You can avoid Stripe fees by:
- Accepting cash payments (free)
- Accepting check payments (free)
- Recording payments manually

## Best Practices

### Invoicing
1. Always send invoices before appointments
2. Include clear payment terms
3. Set realistic due dates (30 days is standard)
4. Follow up on overdue invoices promptly

### Payment Collection
1. Offer multiple payment methods
2. Record payments immediately
3. Always provide receipts
4. Track deposits separately from final payments

### Reconciliation
1. Review transaction history weekly
2. Match bank deposits to recorded payments
3. Export reports for accounting
4. Keep records for tax purposes

## Troubleshooting

### Stripe Payment Fails
- Check that Stripe keys are correct
- Verify webhook is configured
- Test with Stripe test cards first
- Check Stripe Dashboard for error details

### Invoice Totals Don't Match
- Verify tax rate is correct
- Check for rounding errors
- Ensure line items are calculated properly
- Refresh the page

### Client Can't View Invoices
- Verify client has portal access enabled
- Check that client email matches portal email
- Ensure invoices are marked as "Sent" not "Draft"

### PDF Generation Issues
- Try refreshing the page
- Check browser console for errors
- Ensure all invoice data is complete
- Try a different browser

## Roadmap

### Coming Soon
- Recurring billing for memberships
- Payment reminders (automated)
- Partial payment schedules
- Refund processing UI
- Payment link generation (send links via email/SMS)
- Apple Pay / Google Pay support
- Multi-currency support
- Accounting software integrations (QuickBooks, Xero)

## Support

For payment system questions:
- Check this documentation first
- Review Stripe documentation at [stripe.com/docs](https://stripe.com/docs)
- Contact support if issues persist

## Quick Reference

### Stripe Test Cards

For testing (use any future expiration date and any 3-digit CVC):

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Invoice Statuses

- **Draft**: Created but not sent to client
- **Sent**: Delivered to client, awaiting payment
- **Paid**: Fully paid
- **Overdue**: Past due date, unpaid
- **Cancelled**: Voided invoice

### Transaction Types

- **Payment**: Regular payment towards invoice/service
- **Deposit**: Partial payment upfront
- **Refund**: Money returned to client

### Payment Methods

- **Card**: Online via Stripe
- **Cash**: In-person cash payment
- **Check**: Physical or digital check
- **Stripe**: Same as Card (synonym)
