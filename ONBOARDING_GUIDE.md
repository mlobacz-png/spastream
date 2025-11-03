# SpaStream Onboarding Guide

Welcome to SpaStream! This guide will help you get your med spa up and running on the platform in under 30 minutes.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Initial Setup](#initial-setup)
3. [Staff Configuration](#staff-configuration)
4. [Service Menu Setup](#service-menu-setup)
5. [Payment Integration](#payment-integration)
6. [SMS Setup (Optional)](#sms-setup-optional)
7. [Online Booking Setup](#online-booking-setup)
8. [Client Import](#client-import)
9. [Go Live Checklist](#go-live-checklist)

---

## Getting Started

### What You'll Need
- ✅ Your business information (name, address, phone, email)
- ✅ List of staff members and their roles
- ✅ Your service menu with prices
- ✅ A Stripe account (for accepting payments)
- ⭐ Optional: Twilio account (for SMS reminders)
- ⭐ Optional: Existing client list (CSV format)

### Time Estimate
- **Basic Setup**: 15-20 minutes
- **Full Setup with Integrations**: 30-45 minutes

---

## Initial Setup

### Step 1: Create Your Account
1. Visit your SpaStream dashboard
2. Click "Sign Up" and create an admin account
3. Use a secure password and business email address
4. Verify your email address

### Step 2: Business Profile
1. Navigate to **Settings** → **Business Profile**
2. Fill in your business details:
   - Business name
   - Address
   - Phone number
   - Business email
   - Operating hours
   - Time zone
3. Upload your logo (recommended: 200x200px PNG)
4. Click **Save Changes**

---

## Staff Configuration

### Adding Your Team
1. Go to **Staff** section in the main menu
2. Click **Add Staff Member**
3. For each team member, enter:
   - Full name
   - Email address
   - Phone number
   - Role (Provider, Front Desk, Manager)
   - Specialties (treatments they can perform)
4. Set their **Availability**:
   - Working days
   - Working hours
   - Break times
5. Click **Save**

### Staff Permissions
- **Manager**: Full access to all features
- **Provider**: Can view schedule, manage own appointments, view client records
- **Front Desk**: Can book appointments, manage clients, view schedules

**Tip**: Invite staff to create their own accounts so they can access their schedules on mobile!

---

## Service Menu Setup

### Adding Your Treatments
1. Navigate to **Settings** → **Services**
2. Click **Add Service**
3. For each treatment, enter:
   - Service name (e.g., "Botox", "Hydrafacial")
   - Category (Injectable, Facial, Laser, etc.)
   - Duration (in minutes)
   - Price
   - Description
   - Which staff members can perform it
4. Click **Save**

### Creating Treatment Packages
1. Go to **Packages** section
2. Click **Create Package**
3. Enter package details:
   - Package name (e.g., "Summer Skin Package")
   - Services included
   - Number of sessions
   - Package price (discounted)
   - Expiration (e.g., 6 months)
4. Click **Save**

**Example Package**:
- Name: "Glow Up Package"
- Services: 3 Hydrafacials + 1 Chemical Peel
- Regular Price: $800
- Package Price: $650
- Valid for: 6 months

---

## Payment Integration

### Setting Up Stripe (Required)

**Why Stripe?**
Stripe is the industry standard for secure payment processing. Your clients can pay with credit/debit cards, and funds go directly to your bank account.

#### Step 1: Create a Stripe Account
1. Visit [stripe.com](https://stripe.com)
2. Click **Start now** and create an account
3. Complete business verification:
   - Business details
   - Bank account information
   - Tax ID (EIN)
4. Activate your account

#### Step 2: Get Your API Keys
1. Log in to Stripe Dashboard
2. Click **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`) - Click to reveal
4. Copy both keys

#### Step 3: Connect to SpaStream
1. In SpaStream, go to **Settings** → **Payment Settings**
2. Paste your Stripe keys:
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`
3. Configure payment options:
   - ✅ Accept card payments
   - ✅ Save cards for future use
   - ✅ Accept tips
   - Set default tip percentages (15%, 18%, 20%)
4. Click **Save Settings**

#### Step 4: Test a Payment
1. Book a test appointment
2. Process a payment in the **Invoices** section
3. Verify the payment appears in your Stripe dashboard

**Security Note**: Your Stripe keys are encrypted and stored securely. SpaStream never sees or stores actual credit card numbers.

---

## SMS Setup (Optional)

SMS reminders can reduce no-shows by up to 40%!

### Setting Up Twilio

#### Step 1: Create a Twilio Account
1. Visit [twilio.com](https://www.twilio.com)
2. Sign up for an account
3. Verify your business information

#### Step 2: Get a Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Search for a local number in your area code
3. Purchase the number (typically $1-2/month)

#### Step 3: Get Your API Credentials
1. Go to Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token**
3. Copy both values

#### Step 4: Connect to SpaStream
1. In SpaStream, go to **Settings** → **SMS Settings**
2. Enter your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number (with country code: +1234567890)
3. Configure SMS preferences:
   - ✅ Appointment reminders (24 hours before)
   - ✅ Booking confirmations
   - ✅ Marketing messages (with opt-in)
4. Click **Save Settings**

#### Step 5: Test SMS
1. Go to **SMS** section
2. Send yourself a test message
3. Verify you receive it

**Cost**: Twilio charges approximately $0.0075 per SMS sent. 1,000 messages ≈ $7.50.

---

## Online Booking Setup

Give your clients the ability to book appointments 24/7!

### Step 1: Configure Booking Settings
1. Go to **Settings** → **Online Booking**
2. Enable online booking
3. Configure booking rules:
   - **Advance booking**: How far in advance clients can book (e.g., 3 months)
   - **Minimum notice**: How soon they can book (e.g., 2 hours)
   - **Buffer time**: Time between appointments (e.g., 15 minutes)
   - **Cancellation policy**: How far in advance they can cancel (e.g., 24 hours)
4. Select which services are bookable online
5. Require deposit for new clients (optional but recommended)
6. Click **Save Settings**

### Step 2: Customize Your Booking Page
1. Go to **Settings** → **Booking Page**
2. Customize appearance:
   - Upload cover photo
   - Choose brand colors
   - Add welcome message
   - Add policies and disclaimers
3. Your booking URL will be: `spastream.com/book/your-business-name`
4. Click **Save**

### Step 3: Share Your Booking Link
Add your booking link to:
- ✅ Your website
- ✅ Email signature
- ✅ Social media bio
- ✅ Google Business Profile
- ✅ Marketing materials

**Pro Tip**: Create a QR code for your booking link and display it at your front desk!

---

## Client Import

### Migrating from Another System

If you're switching from another booking system, you can import your existing clients.

#### Step 1: Export from Old System
Export your client list as a CSV file with these columns:
- First Name
- Last Name
- Email
- Phone Number
- Date of Birth (optional)
- Notes (optional)

#### Step 2: Format Your CSV
1. Download our template: [client-import-template.csv](./public/client-import-template.csv)
2. Copy your data into the template format
3. Ensure phone numbers include country code (+1 for US)
4. Save as CSV

#### Step 3: Import to SpaStream
1. Go to **Clients** section
2. Click **Import Clients**
3. Upload your CSV file
4. Map columns if needed
5. Click **Import**
6. Review any errors and fix as needed

#### Step 4: Verify Import
1. Check that all clients appear in your client list
2. Spot-check a few client profiles
3. Verify phone numbers and emails are correct

**Note**: Clients won't receive any notifications about the import. They'll only hear from you when you send them an appointment reminder or marketing message.

---

## Go Live Checklist

Before accepting your first booking, make sure you've completed:

### Business Setup ✅
- [ ] Business profile completed
- [ ] Logo uploaded
- [ ] Operating hours set
- [ ] Time zone configured

### Team Setup ✅
- [ ] All staff members added
- [ ] Staff availability configured
- [ ] Staff permissions assigned
- [ ] Staff have created their accounts

### Services Setup ✅
- [ ] All treatments added with prices
- [ ] Service durations set correctly
- [ ] Staff assigned to services
- [ ] Treatment categories organized

### Payment Setup ✅
- [ ] Stripe account connected
- [ ] Test payment processed successfully
- [ ] Payment preferences configured
- [ ] Cancellation/refund policy set

### Optional Integrations ✅
- [ ] SMS reminders enabled (Twilio)
- [ ] Test SMS sent successfully
- [ ] Email notifications configured

### Online Booking ✅
- [ ] Online booking enabled
- [ ] Booking rules configured
- [ ] Booking page customized
- [ ] Booking link shared publicly

### Client Management ✅
- [ ] Existing clients imported (if applicable)
- [ ] Client records verified
- [ ] Consent forms uploaded (if required)

---

## Getting Help

### Support Resources
- **Documentation**: Check our complete setup guides in the Help section
- **Video Tutorials**: Watch step-by-step videos at spastream.com/tutorials
- **Email Support**: support@spastream.com (Response within 24 hours)
- **Live Chat**: Available Mon-Fri, 9am-5pm EST

### Common Questions

**Q: Can I try the platform before committing?**
A: Yes! You have a 14-day free trial with full access to all features.

**Q: What if I need help with setup?**
A: We offer complimentary onboarding calls! Email support@spastream.com to schedule.

**Q: Can I cancel anytime?**
A: Yes, you can cancel your subscription anytime. Your data will be available for 30 days after cancellation.

**Q: Is my data secure?**
A: Absolutely. We're HIPAA compliant with bank-level encryption. Your data is backed up daily.

**Q: Do clients need to create accounts?**
A: No! Clients can book as guests. They only need an account if they want to access the client portal.

---

## Next Steps

Now that you're set up, explore these advanced features:

### Week 1-2: Get Comfortable
- Book test appointments
- Process test payments
- Explore the calendar
- Add client notes and photos

### Week 3-4: Optimize
- Set up automated appointment reminders
- Create your first treatment package
- Import client history
- Train staff on the system

### Month 2: Advanced Features
- Launch automated marketing campaigns
- Set up client memberships
- Use AI treatment recommendations
- Analyze revenue reports

### Month 3+: Scale
- Use dynamic pricing for peak times
- Implement no-show predictor
- Optimize staff scheduling with AI
- Launch reputation booster for reviews

---

## Welcome to SpaStream!

You're now ready to transform your med spa operations. We're excited to be part of your growth journey!

**Questions?** We're here to help: support@spastream.com

---

*Last updated: October 2025*
