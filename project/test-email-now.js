#!/usr/bin/env node

/**
 * Quick Email Test Script
 * Run: node test-email-now.js YOUR_EMAIL@gmail.com
 */

const https = require('https');

// Get email from command line argument
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('\n❌ Please provide an email address!');
  console.log('\nUsage: node test-email-now.js your-email@gmail.com\n');
  process.exit(1);
}

console.log('\n🚀 Testing SpaStream Email System...\n');

const SUPABASE_URL = 'https://kviciiartofmqbsbrqii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aWNpaWFydG9mbXFic2JycWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDgyOTYsImV4cCI6MjA3NzQyNDI5Nn0.eP0CLyu6A94MamhTS4ULlDKLbE80qF4-nXV7t0mlX-Y';

function sendTestEmail(functionName, payload, description) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'kviciiartofmqbsbrqii.supabase.co',
      port: 443,
      path: `/functions/v1/${functionName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': data.length
      }
    };

    console.log(`📧 Testing ${description}...`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${description} - SUCCESS!`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Response:`, parsed);
          } catch (e) {
            console.log(`   Response:`, responseData);
          }
          resolve(responseData);
        } else {
          console.log(`❌ ${description} - FAILED (Status: ${res.statusCode})`);
          console.log(`   Error:`, responseData);
          reject(new Error(responseData));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description} - ERROR`);
      console.log(`   ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log(`Testing with email: ${testEmail}\n`);

  // Test 1: Welcome Email
  try {
    await sendTestEmail(
      'send-welcome-email',
      { email: testEmail, name: 'Test User' },
      'Welcome Email'
    );
  } catch (e) {
    // Continue even if one fails
  }

  console.log('');

  // Test 2: Booking Confirmation
  try {
    await sendTestEmail(
      'send-booking-confirmation',
      {
        to: testEmail,
        businessName: 'Test Med Spa',
        clientName: 'Test User',
        service: 'Botox Treatment',
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: '2:00 PM',
        confirmationMessage: 'Thank you for booking with us! We look forward to seeing you.'
      },
      'Booking Confirmation'
    );
  } catch (e) {
    // Continue even if one fails
  }

  console.log('');

  // Test 3: Admin Notification
  try {
    await sendTestEmail(
      'send-signup-notification',
      {
        user_email: testEmail,
        plan_name: 'Pro Plan',
        plan_price: 19900,
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      'Admin Notification (to ADMIN_EMAIL)'
    );
  } catch (e) {
    // Continue even if one fails
  }

  console.log('\n✨ Test complete! Check your email inbox (and spam folder).\n');
  console.log('📝 Note: Admin notification goes to the ADMIN_EMAIL environment variable,');
  console.log('   not to the email you provided.\n');
}

runTests().catch(console.error);
