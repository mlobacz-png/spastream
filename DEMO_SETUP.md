# Demo Data Setup Guide

This guide will help you populate your SpaStream database with realistic demo data for showcasing the platform to potential customers.

## What Gets Created

The demo seeding script will create:

- **1 Demo Account** with login credentials
- **8 Demo Clients** with contact information
- **3 Staff Members** (Medical Director, Nurse Injector, Aesthetician)
- **4 Treatment Rooms** (Injection, Laser, Facial, Consultation)
- **50 Appointments** spread across past 30 days and next 30 days
- **3 Treatment Packages** (Botox 3-Pack, Filler Series, Laser Package)
- **2 Active Client Packages** assigned to clients
- **4 Inventory Products** (Botox, Fillers, Serums, Supplies)
- **1 Booking Settings** configuration with public booking page
- **2 Public Booking Requests** from potential clients

## Prerequisites

Before running the seeding script, ensure:

1. Your `.env` file has the correct Supabase credentials
2. All database migrations have been applied
3. You have `tsx` installed (the script will handle this)

## Running the Seed Script

### Step 1: Install tsx (if not already installed)

```bash
npm install -D tsx
```

### Step 2: Run the Seeding Script

```bash
npm run seed:demo
```

The script will output progress information as it creates each type of data.

## Demo Account Credentials

After running the script, you can log in with:

**Email:** `demo@spastream.com`
**Password:** `demo123456`

## Demo Booking Page

A public booking page will be created at:

```
/book/serenity-medspa-demo
```

This can be used to demonstrate the client-facing booking experience.

## What to Show Potential Customers

### 1. Dashboard Overview
- Log in and show the main dashboard
- Point out revenue metrics, upcoming appointments, recent clients

### 2. Client Management
- Browse the 8 demo clients
- Show how easy it is to view client history
- Demonstrate adding treatment notes

### 3. Calendar View
- Show the calendar with 50 appointments
- Demonstrate how easy it is to schedule
- Show drag-and-drop functionality

### 4. Revenue Tracking
- Navigate to Revenue section
- Show paid vs pending invoices
- Demonstrate payment collection

### 5. Treatment Packages
- Show pre-configured packages
- Demonstrate how clients can purchase bundles
- Show package tracking

### 6. Staff Management
- Display the 3 staff members
- Show staff schedules and assignments
- Demonstrate commission tracking

### 7. Inventory Management
- Browse the 4 inventory products
- Show stock levels and alerts
- Demonstrate usage tracking

### 8. Online Booking
- Open `/book/serenity-medspa-demo` in a new tab
- Show the beautiful client-facing interface
- Walk through the booking process
- Return to dashboard to show the booking request

### 9. AI Features
- Show treatment recommendations
- Demonstrate smart scheduling
- Display predictive analytics

## Resetting Demo Data

If you need to reset the demo data:

1. Delete the demo user from Supabase Auth dashboard
2. All associated data will be automatically deleted (CASCADE)
3. Re-run the seed script

## Important Notes

- The demo account is a real authenticated user
- All data is isolated to the demo user via RLS policies
- Appointments span 60 days (30 past, 30 future) for realistic calendar view
- Revenue data includes mix of paid, pending, and partial payments
- Some clients have active treatment packages to demonstrate that feature

## Customizing the Demo

You can edit `scripts/seed-demo-data.ts` to:

- Change client names and contact info
- Adjust number of appointments
- Modify service offerings and prices
- Update business name and branding
- Add more staff members or rooms

After making changes, just re-run the seed script.

## Troubleshooting

**Error: "User already exists"**
- The script will automatically sign in to the existing demo user
- All data is created under that user's account

**Error: "RLS policy violation"**
- Ensure all migrations have been applied
- Check that the user session is active

**Error: "Table does not exist"**
- Run migrations first with Supabase CLI or the MCP tools
- Ensure your database is fully set up

## Support

If you encounter issues with the demo seeding script, check:

1. Your `.env` file has correct Supabase credentials
2. Your database has all migrations applied
3. You're running the script from the project root directory
