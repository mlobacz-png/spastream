import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_EMAIL = 'demo@spastream.net';
const DEMO_PASSWORD = 'demo123456';

async function seedDemoData() {
  console.log('Starting demo data seeding...\n');

  const now = new Date();

  // 1. Create demo user account
  console.log('Creating demo user account...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('Error creating demo user:', authError);
    return;
  }

  // Sign in to get the session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signInError) {
    console.error('Error signing in:', signInError);
    return;
  }

  if (!signInData.session) {
    console.error('No session created after sign in');
    return;
  }

  // Set the session explicitly
  await supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  const userId = signInData.user!.id;
  console.log(`Demo user created/found: ${DEMO_EMAIL}`);
  console.log(`User ID: ${userId}\n`);

  // 2. Create demo clients (realistic demo data - 100+ clients)
  console.log('Creating demo clients...');
  const clientNames = [
    'Sarah Johnson', 'Emma Davis', 'Olivia Martinez', 'Ava Wilson', 'Isabella Brown',
    'Sophia Taylor', 'Mia Anderson', 'Charlotte Thomas', 'Amelia Garcia', 'Harper Rodriguez',
    'Evelyn Lee', 'Abigail Walker', 'Emily Hall', 'Elizabeth Allen', 'Sofia Young',
    'Avery King', 'Ella Wright', 'Scarlett Lopez', 'Grace Hill', 'Chloe Green',
    'Victoria Adams', 'Madison Baker', 'Luna Nelson', 'Penelope Carter', 'Riley Mitchell',
    'Zoey Perez', 'Nora Roberts', 'Lily Turner', 'Eleanor Phillips', 'Hannah Campbell',
    'Lillian Parker', 'Addison Evans', 'Aubrey Edwards', 'Ellie Collins', 'Stella Stewart',
    'Natalie Morris', 'Zoe Rogers', 'Leah Reed', 'Hazel Cook', 'Violet Morgan',
    'Aurora Bell', 'Savannah Murphy', 'Audrey Bailey', 'Brooklyn Rivera', 'Bella Cooper',
    'Claire Richardson', 'Skylar Cox', 'Lucy Howard', 'Paisley Ward', 'Everly Torres',
    'Anna Peterson', 'Caroline Gray', 'Nova Ramirez', 'Genesis James', 'Emilia Watson',
    'Kennedy Brooks', 'Samantha Kelly', 'Maya Sanders', 'Willow Price', 'Kinsley Bennett',
    'Naomi Wood', 'Aaliyah Barnes', 'Elena Ross', 'Sarah Henderson', 'Ariana Coleman',
    'Allison Jenkins', 'Gabriella Perry', 'Alice Powell', 'Madelyn Long', 'Cora Patterson',
    'Ruby Hughes', 'Eva Flores', 'Serenity Washington', 'Autumn Butler', 'Adeline Simmons',
    'Hailey Foster', 'Gianna Gonzales', 'Valentina Bryant', 'Isla Alexander', 'Eliana Russell',
    'Quinn Griffin', 'Nevaeh Diaz', 'Ivy Hayes', 'Sadie Myers', 'Piper Ford',
    'Lydia Hamilton', 'Delilah Graham', 'Josephine Sullivan', 'Emery Wallace', 'Ryleigh Woods',
    'Jade Cole', 'Rylee West', 'Melody Jordan', 'Brielle Owens', 'Dakota Reynolds',
    'Morgan Fisher', 'Mackenzie Ellis', 'Charlie Marshall', 'Kendall Gibson', 'Paige Wells'
  ];

  const clients = clientNames.map((name, index) => ({
    name,
    phone: `(555) ${String(100 + index).padStart(3, '0')}-${String(1000 + index).padStart(4, '0')}`,
    email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
    created_at: new Date(now.getTime() - (90 - index) * 24 * 60 * 60 * 1000).toISOString(), // Spread over 90 days
  }));

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .insert(
      clients.map((client) => ({
        user_id: userId,
        ...client,
        treatments: [],
      }))
    )
    .select();

  if (clientsError) {
    console.error('Error creating clients:', clientsError);
    return;
  }
  console.log(`Created ${clientsData.length} demo clients\n`);

  // 3. Create staff members
  console.log('Creating staff members...');
  const staffMembers = [
    {
      name: 'Dr. Jennifer Smith',
      role: 'Medical Director',
      email: 'dr.smith@medspaflow.com',
      phone: '(555) 111-2222',
      specializations: ['Botox', 'Fillers', 'Laser Treatments'],
      hourly_rate: 200,
      commission_rate: 40,
    },
    {
      name: 'Lisa Thompson',
      role: 'Nurse Injector',
      email: 'lisa.t@medspaflow.com',
      phone: '(555) 222-3333',
      specializations: ['Botox', 'Fillers'],
      hourly_rate: 100,
      commission_rate: 35,
    },
    {
      name: 'Rachel Green',
      role: 'Aesthetician',
      email: 'rachel.g@medspaflow.com',
      phone: '(555) 333-4444',
      specializations: ['Facials', 'Chemical Peels', 'Microneedling'],
      hourly_rate: 75,
      commission_rate: 30,
    },
  ];

  const { data: staffData, error: staffError } = await supabase
    .from('staff_members')
    .insert(
      staffMembers.map((staff) => ({
        user_id: userId,
        ...staff,
        is_active: true,
      }))
    )
    .select();

  if (staffError) {
    console.error('Error creating staff:', staffError);
    return;
  }
  console.log(`Created ${staffData.length} staff members\n`);

  // 4. Create treatment rooms
  console.log('Creating treatment rooms...');
  const rooms = [
    { name: 'Treatment Room 1', room_type: 'injection', equipment: ['Injection chair', 'LED lighting'] },
    { name: 'Treatment Room 2', room_type: 'laser', equipment: ['Laser device', 'Cooling system'] },
    { name: 'Facial Suite', room_type: 'facial', equipment: ['Facial bed', 'Steamer', 'LED mask'] },
    { name: 'Consultation Room', room_type: 'consultation', equipment: ['Desk', 'Mirror'] },
  ];

  const { data: roomsData, error: roomsError } = await supabase
    .from('treatment_rooms')
    .insert(
      rooms.map((room) => ({
        user_id: userId,
        ...room,
        is_active: true,
      }))
    )
    .select();

  if (roomsError) {
    console.error('Error creating rooms:', roomsError);
    return;
  }
  console.log(`Created ${roomsData.length} treatment rooms\n`);

  // 5. Create appointments (realistic revenue growth pattern)
  console.log('Creating appointments...');
  const services = [
    { name: 'Botox', duration: 30, price: 450 },
    { name: 'Dermal Fillers', duration: 60, price: 650 },
    { name: 'Laser Hair Removal', duration: 45, price: 300 },
    { name: 'Chemical Peel', duration: 60, price: 200 },
    { name: 'Microneedling', duration: 75, price: 400 },
    { name: 'HydraFacial', duration: 60, price: 250 },
    { name: 'Laser Skin Resurfacing', duration: 90, price: 850 },
    { name: 'PDO Thread Lift', duration: 120, price: 1200 },
  ];

  const appointments = [];

  // Create appointments with growth pattern over past 90 days and next 30 days
  // More appointments in recent months to show revenue growth
  const appointmentCounts = {
    '-90to-60': 40,  // 3 months ago
    '-60to-30': 55,  // 2 months ago (37.5% growth)
    '-30to0': 75,    // Last month (36% growth) - matches "28% month-over-month"
    '0to30': 50,     // Future appointments
  };

  let appointmentIndex = 0;

  // Past 3 months ago
  for (let i = 0; i < appointmentCounts['-90to-60']; i++) {
    const daysOffset = -90 + Math.floor(Math.random() * 30);
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8));
    appointmentDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clientsData[Math.floor(Math.random() * Math.min(30, clientsData.length))];
    const staff = staffData[Math.floor(Math.random() * staffData.length)];
    const room = roomsData[Math.floor(Math.random() * roomsData.length)];

    appointments.push({
      user_id: userId,
      client_id: client.id,
      staff_member_id: staff.id,
      treatment_room_id: room.id,
      service: service.name,
      start_time: appointmentDate.toISOString(),
      duration: service.duration,
      price: service.price,
      amount_paid: service.price,
      payment_status: 'paid',
      payment_method: 'card',
      payment_date: appointmentDate.toISOString(),
      notes: 'Demo appointment',
    });
  }

  // Past 2 months ago
  for (let i = 0; i < appointmentCounts['-60to-30']; i++) {
    const daysOffset = -60 + Math.floor(Math.random() * 30);
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8));
    appointmentDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clientsData[Math.floor(Math.random() * Math.min(50, clientsData.length))];
    const staff = staffData[Math.floor(Math.random() * staffData.length)];
    const room = roomsData[Math.floor(Math.random() * roomsData.length)];

    appointments.push({
      user_id: userId,
      client_id: client.id,
      staff_member_id: staff.id,
      treatment_room_id: room.id,
      service: service.name,
      start_time: appointmentDate.toISOString(),
      duration: service.duration,
      price: service.price,
      amount_paid: service.price,
      payment_status: 'paid',
      payment_method: 'card',
      payment_date: appointmentDate.toISOString(),
      notes: 'Demo appointment',
    });
  }

  // Last month (most appointments - showing growth)
  for (let i = 0; i < appointmentCounts['-30to0']; i++) {
    const daysOffset = -30 + Math.floor(Math.random() * 30);
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8));
    appointmentDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clientsData[Math.floor(Math.random() * Math.min(70, clientsData.length))];
    const staff = staffData[Math.floor(Math.random() * staffData.length)];
    const room = roomsData[Math.floor(Math.random() * roomsData.length)];

    appointments.push({
      user_id: userId,
      client_id: client.id,
      staff_member_id: staff.id,
      treatment_room_id: room.id,
      service: service.name,
      start_time: appointmentDate.toISOString(),
      duration: service.duration,
      price: service.price,
      amount_paid: service.price,
      payment_status: 'paid',
      payment_method: 'card',
      payment_date: appointmentDate.toISOString(),
      notes: 'Demo appointment',
    });
  }

  // This month (so far - paid appointments)
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysIntoMonth = now.getDate(); // How many days have passed in current month

  // For demo purposes, simulate we're 20 days into the month (even if we're on day 1)
  const daysForDemo = Math.max(20, daysIntoMonth);

  // Create paid appointments for days that have passed this month (28% growth over last month)
  const thisMonthPaidCount = Math.floor(75 * 1.28 * (daysForDemo / 30)); // Pro-rated for days passed
  for (let i = 0; i < thisMonthPaidCount; i++) {
    const dayOfMonth = Math.floor(Math.random() * Math.min(daysForDemo, daysIntoMonth === 1 ? 1 : daysIntoMonth)) + 1;
    const appointmentDate = new Date(currentYear, currentMonth, dayOfMonth);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8));
    appointmentDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clientsData[Math.floor(Math.random() * clientsData.length)];
    const staff = staffData[Math.floor(Math.random() * staffData.length)];
    const room = roomsData[Math.floor(Math.random() * roomsData.length)];

    appointments.push({
      user_id: userId,
      client_id: client.id,
      staff_member_id: staff.id,
      treatment_room_id: room.id,
      service: service.name,
      start_time: appointmentDate.toISOString(),
      duration: service.duration,
      price: service.price,
      amount_paid: service.price,
      payment_status: 'paid',
      payment_method: 'card',
      payment_date: appointmentDate.toISOString(),
      notes: 'Demo appointment - this month',
    });
  }

  // Future appointments (rest of this month + next month)
  for (let i = 0; i < appointmentCounts['0to30']; i++) {
    const daysOffset = Math.floor(Math.random() * 30);
    const appointmentDate = new Date(now);
    appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8));
    appointmentDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

    const service = services[Math.floor(Math.random() * services.length)];
    const client = clientsData[Math.floor(Math.random() * clientsData.length)];
    const staff = staffData[Math.floor(Math.random() * staffData.length)];
    const room = roomsData[Math.floor(Math.random() * roomsData.length)];

    appointments.push({
      user_id: userId,
      client_id: client.id,
      staff_member_id: staff.id,
      treatment_room_id: room.id,
      service: service.name,
      start_time: appointmentDate.toISOString(),
      duration: service.duration,
      price: service.price,
      amount_paid: 0,
      payment_status: 'pending',
      payment_method: null,
      payment_date: null,
      notes: 'Demo appointment',
    });
  }

  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .insert(appointments)
    .select();

  if (appointmentsError) {
    console.error('Error creating appointments:', appointmentsError);
    return;
  }
  console.log(`Created ${appointmentsData.length} appointments\n`);

  // 5b. Create transactions for paid appointments
  console.log('Creating payment transactions...');
  const paidAppointments = appointmentsData.filter(apt => apt.payment_status === 'paid');
  const transactions = paidAppointments.map(apt => ({
    user_id: userId,
    client_id: apt.client_id,
    appointment_id: apt.id,
    transaction_type: 'payment',
    payment_method: apt.payment_method,
    amount: apt.amount_paid,
    status: 'completed',
    processed_at: apt.payment_date,
    created_at: apt.payment_date,
  }));

  const { data: transactionsData, error: transactionsError } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (transactionsError) {
    console.error('Error creating transactions:', transactionsError);
    return;
  }
  console.log(`Created ${transactionsData.length} payment transactions\n`);

  // 6. Create treatment packages
  console.log('Creating treatment packages...');
  const packages = [
    {
      name: 'Botox 3-Pack',
      description: 'Save with 3 Botox sessions',
      service: 'Botox',
      total_sessions: 3,
      price: 1200,
      validity_days: 180,
      active: true,
    },
    {
      name: 'Filler Series',
      description: '2 filler treatments at a discounted rate',
      service: 'Dermal Fillers',
      total_sessions: 2,
      price: 1100,
      validity_days: 365,
      active: true,
    },
    {
      name: 'Laser Package',
      description: '6 laser hair removal sessions',
      service: 'Laser Hair Removal',
      total_sessions: 6,
      price: 1500,
      validity_days: 365,
      active: true,
    },
  ];

  const { data: packagesData, error: packagesError } = await supabase
    .from('packages')
    .insert(
      packages.map((pkg) => ({
        user_id: userId,
        ...pkg,
      }))
    )
    .select();

  if (packagesError) {
    console.error('Error creating packages:', packagesError);
    return;
  }
  console.log(`Created ${packagesData.length} treatment packages\n`);

  // 7. Assign some packages to clients
  console.log('Assigning packages to clients...');
  const clientPackages = [
    {
      client_id: clientsData[0].id,
      package_id: packagesData[0].id,
      sessions_remaining: 2,
      purchase_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiry_date: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      client_id: clientsData[1].id,
      package_id: packagesData[2].id,
      sessions_remaining: 4,
      purchase_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiry_date: new Date(now.getTime() + 305 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
  ];

  const { error: clientPackagesError } = await supabase.from('client_packages').insert(
    clientPackages.map((cp) => ({
      user_id: userId,
      ...cp,
    }))
  );

  if (clientPackagesError) {
    console.error('Error assigning packages:', clientPackagesError);
    return;
  }
  console.log(`Assigned ${clientPackages.length} packages to clients\n`);

  // 8. Create inventory products
  console.log('Creating inventory products...');
  const inventoryProducts = [
    {
      name: 'Botox 100u',
      category: 'Injectable',
      unit_type: 'vials',
      current_quantity: 15,
      min_quantity: 5,
      reorder_quantity: 10,
      unit_cost: 350,
      supplier_name: 'Med Supply Co',
    },
    {
      name: 'Juvederm Ultra',
      category: 'Filler',
      unit_type: 'syringes',
      current_quantity: 8,
      min_quantity: 3,
      reorder_quantity: 6,
      unit_cost: 280,
      supplier_name: 'Aesthetic Supplies',
    },
    {
      name: 'Hyaluronic Acid Serum',
      category: 'Skincare',
      unit_type: 'bottles',
      current_quantity: 25,
      min_quantity: 10,
      reorder_quantity: 20,
      unit_cost: 45,
      supplier_name: 'Beauty Wholesale',
    },
    {
      name: 'Numbing Cream',
      category: 'Supplies',
      unit_type: 'tubes',
      current_quantity: 12,
      min_quantity: 5,
      reorder_quantity: 10,
      unit_cost: 18,
      supplier_name: 'Med Supply Co',
    },
  ];

  const { data: inventoryData, error: inventoryError } = await supabase
    .from('inventory_products')
    .insert(
      inventoryProducts.map((product) => ({
        user_id: userId,
        ...product,
        is_active: true,
      }))
    )
    .select();

  if (inventoryError) {
    console.error('Error creating inventory:', inventoryError);
    return;
  }
  console.log(`Created ${inventoryData.length} inventory products\n`);

  // 9. Create or update booking settings
  console.log('Creating/updating booking settings...');
  const { data: existingBooking } = await supabase
    .from('booking_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingBooking) {
    const { error: updateError } = await supabase
      .from('booking_settings')
      .update({
        enabled: true,
        business_name: 'Serenity MedSpa',
        booking_url_slug: 'serenity-medspa-demo',
        primary_color: '#3b82f6',
        services_offered: [
          { name: 'Botox', duration: 30, price: 450, description: 'Reduce fine lines and wrinkles' },
          { name: 'Dermal Fillers', duration: 60, price: 650, description: 'Restore volume and contour' },
          { name: 'HydraFacial', duration: 60, price: 250, description: 'Deep cleansing facial treatment' },
          { name: 'Chemical Peel', duration: 60, price: 200, description: 'Exfoliate and refresh skin' },
        ],
        confirmation_message: 'Thank you for booking with Serenity MedSpa! We look forward to seeing you.',
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating booking settings:', updateError);
      return;
    }
    console.log('Updated existing booking settings\n');
  } else {
    const { error: bookingError } = await supabase.from('booking_settings').insert({
      user_id: userId,
      enabled: true,
      business_name: 'Serenity MedSpa',
      booking_url_slug: 'serenity-medspa-demo',
      primary_color: '#3b82f6',
      services_offered: [
        { name: 'Botox', duration: 30, price: 450, description: 'Reduce fine lines and wrinkles' },
        { name: 'Dermal Fillers', duration: 60, price: 650, description: 'Restore volume and contour' },
        { name: 'HydraFacial', duration: 60, price: 250, description: 'Deep cleansing facial treatment' },
        { name: 'Chemical Peel', duration: 60, price: 200, description: 'Exfoliate and refresh skin' },
      ],
      confirmation_message: 'Thank you for booking with Serenity MedSpa! We look forward to seeing you.',
    });

    if (bookingError) {
      console.error('Error creating booking settings:', bookingError);
      return;
    }
    console.log('Created booking settings\n');
  }

  // 10. Create some public booking requests
  console.log('Creating public booking requests...');
  const publicBookings = [
    {
      practitioner_user_id: userId,
      client_name: 'Jessica Miller',
      client_email: 'jessica.m@email.com',
      client_phone: '(555) 999-8888',
      service: 'Botox',
      requested_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 30,
      status: 'pending',
      notes: 'First time client',
    },
    {
      practitioner_user_id: userId,
      client_name: 'Amanda Clark',
      client_email: 'amanda.c@email.com',
      client_phone: '(555) 888-7777',
      service: 'HydraFacial',
      requested_time: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      status: 'pending',
      notes: 'Referred by friend',
    },
  ];

  const { error: publicBookingsError } = await supabase.from('public_bookings').insert(publicBookings);

  if (publicBookingsError) {
    console.error('Error creating public bookings:', publicBookingsError);
    return;
  }
  console.log(`Created ${publicBookings.length} public booking requests\n`);

  // Calculate demo stats
  const totalRevenue = appointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, a) => sum + a.price, 0);
  const annualProjection = Math.round((totalRevenue / 90) * 365);

  console.log('='.repeat(60));
  console.log('Demo data seeding completed successfully!');
  console.log('='.repeat(60));
  console.log('\nDemo Account Credentials:');
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log('\nBooking Page:');
  console.log(`URL: /book/serenity-medspa-demo`);
  console.log('\nSummary:');
  console.log(`- ${clientsData.length} active clients`);
  console.log(`- ${staffData.length} staff members`);
  console.log(`- ${roomsData.length} treatment rooms`);
  console.log(`- ${appointmentsData.length} appointments (over 90 days)`);
  console.log(`- ${transactionsData.length} completed transactions`);
  console.log(`- ${packagesData.length} treatment packages`);
  console.log(`- ${inventoryData.length} inventory products`);
  console.log(`- ${publicBookings.length} booking requests`);
  console.log('\nRevenue Metrics:');
  console.log(`- Total Revenue (90 days): $${totalRevenue.toLocaleString()}`);
  console.log(`- Annual Revenue Projection: $${annualProjection.toLocaleString()}`);
  console.log(`- Growth Pattern: 28% month-over-month (built into data)`);
  console.log('='.repeat(60));
}

seedDemoData().catch(console.error);
