# Admin Role Setup Guide

This guide explains how to set up admin access for the SpaStream CRM platform.

## Overview

The admin system allows you (the platform owner) to:
- View all spa accounts
- See statistics across all spas
- Access any spa's data for support purposes
- Track all admin actions via audit logging
- Monitor system usage

## Setting Up Your Admin Account

### Step 1: Create Your Account
1. Sign up for an account using your email at the main login page
2. Note your account email address

### Step 2: Grant Admin Role via Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Users**
4. Find your user account in the list
5. Click on your user to open the details
6. Scroll to **User Metadata** section
7. Click **Edit** on the **Raw App Metadata** field
8. Add the following JSON (or update existing JSON):

```json
{
  "role": "admin"
}
```

9. Click **Save**
10. Log out and log back in to your account

### Step 3: Access Admin Dashboard

1. Navigate to `/admin` in your browser
   - Example: `https://your-domain.com/admin`
2. You should now see the admin dashboard with:
   - Total spas count
   - Total clients across all spas
   - Total appointments
   - List of all spa accounts
   - Audit log of admin actions

## Admin Features

### 1. Spa Account Management
- View all registered spa accounts
- See client and appointment counts per spa
- Track when spas were created and last signed in
- Search spas by email

### 2. Audit Logging
All admin actions are automatically logged, including:
- When you view a spa account
- When you access spa data
- Timestamps and details of each action

This provides transparency and helps with compliance.

### 3. Data Access
As an admin, you can:
- View all data across all spas
- Help spas troubleshoot issues
- Access any table in the database

**Important**: With great power comes great responsibility. Only access spa data when providing support or investigating issues.

## Security Features

1. **Role-Based Access**: Only users with `role: "admin"` in their metadata can access admin features
2. **Audit Trail**: Every admin action is logged with timestamps
3. **Authentication Required**: Must be logged in to access admin routes
4. **Automatic Redirection**: Non-admin users are redirected away from admin pages

## Adding Additional Admins

To add more admin users, repeat Step 2 for each user account.

## Removing Admin Access

To remove admin access from a user:
1. Go to Supabase Dashboard > Authentication > Users
2. Find the user
3. Edit their **Raw App Metadata**
4. Remove the `"role": "admin"` line or change it to another value
5. Save changes

## Troubleshooting

### "Access Denied" Error
- Ensure you've set the metadata correctly in Supabase
- Log out and log back in after setting admin role
- Check that the JSON syntax is correct in app metadata

### Can't See Admin Dashboard
- Verify you're accessing `/admin` route
- Check browser console for errors
- Ensure you're logged in

### Audit Logs Not Showing
- Logs are created automatically when admin actions are performed
- Try performing an action (like viewing a spa account) to generate a log entry

## Best Practices

1. **Limit Admin Access**: Only grant admin role to trusted support staff
2. **Document Access**: Keep a record of why you accessed spa data
3. **Respect Privacy**: Only view necessary data when troubleshooting
4. **Regular Audits**: Review audit logs periodically
5. **Communicate**: Let spas know if you need to access their account for support

## Support

If you encounter issues setting up admin access, check:
1. Supabase project is properly configured
2. Database migrations have been applied
3. User is authenticated before accessing admin routes
