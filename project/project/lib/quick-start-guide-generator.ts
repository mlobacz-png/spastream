import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export async function generateQuickStartGuide() {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  addCoverPage(pdf, pageWidth, pageHeight, margin);

  pdf.addPage();
  addTableOfContents(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addGettingStartedSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addDashboardSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addClientsSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addAppointmentsSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addServicesSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addPaymentsSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addTipsSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  pdf.addPage();
  addSupportSection(pdf, pageWidth, pageHeight, margin, contentWidth);

  const fileName = `SpaStream_Quick_Start_Guide_${format(new Date(), 'yyyyMMdd')}.pdf`;
  pdf.save(fileName);
}

function addCoverPage(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number) {
  pdf.setFillColor(20, 184, 166);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFontSize(42);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SpaStream', pageWidth / 2, 80, { align: 'center' });

  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Quick Start Guide', pageWidth / 2, 95, { align: 'center' });

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Get up and running in minutes', pageWidth / 2, 110, { align: 'center' });

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(40, 130, pageWidth - 80, 60, 5, 5, 'F');

  pdf.setFontSize(14);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Welcome to SpaStream!', pageWidth / 2, 145, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  const welcomeText = [
    'This guide will help you set up and start using',
    'SpaStream to manage your med spa operations.',
    '',
    'From scheduling to payments, we\'ve got you covered.'
  ];

  let yPos = 155;
  welcomeText.forEach(line => {
    pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  });

  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Version 1.0 | ${format(new Date(), 'MMMM yyyy')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
}

function addTableOfContents(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  pdf.setFontSize(24);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Table of Contents', margin, yPos);
  yPos += 15;

  const contents = [
    { title: '1. Getting Started', page: 3 },
    { title: '2. Dashboard Overview', page: 4 },
    { title: '3. Managing Clients', page: 5 },
    { title: '4. Scheduling Appointments', page: 6 },
    { title: '5. Services & Pricing', page: 7 },
    { title: '6. Processing Payments', page: 8 },
    { title: '7. Pro Tips', page: 9 },
    { title: '8. Support & Resources', page: 10 },
  ];

  pdf.setFontSize(11);

  contents.forEach(item => {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(item.title, margin + 5, yPos);

    const dots = '.'.repeat(80);
    pdf.setTextColor(203, 213, 225);
    pdf.setFontSize(9);
    pdf.text(dots, margin + 65, yPos);

    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text(item.page.toString(), pageWidth - margin - 10, yPos);

    yPos += 10;
  });
}

function addGettingStartedSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '1. Getting Started', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'First Login', margin, yPos, contentWidth);
  yPos += 8;

  const loginSteps = [
    '1. Visit your SpaStream dashboard URL',
    '2. Enter your email and password',
    '3. Click "Sign In" to access your dashboard',
    '4. You\'ll be greeted with the home screen'
  ];

  yPos = addBulletList(pdf, loginSteps, margin, yPos, contentWidth);
  yPos += 8;

  addInfoBox(pdf, 'Tip: Bookmark your dashboard URL for quick access!', margin, yPos, contentWidth);
  yPos += 20;

  addSubSection(pdf, 'Complete Your Profile', margin, yPos, contentWidth);
  yPos += 8;

  const profileSteps = [
    '1. Click on Settings in the sidebar',
    '2. Fill in your business information',
    '3. Add your business logo',
    '4. Set your business hours',
    '5. Configure notification preferences'
  ];

  yPos = addBulletList(pdf, profileSteps, margin, yPos, contentWidth);
}

function addDashboardSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '2. Dashboard Overview', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Navigation Menu', margin, yPos, contentWidth);
  yPos += 8;

  const menuItems = [
    'Home - Your daily overview and quick stats',
    'Calendar - View and manage all appointments',
    'Clients - Access your complete client database',
    'Services - Manage your service offerings',
    'Staff - Organize your team schedules',
    'Revenue - Track earnings and financial reports',
    'Marketing - Send campaigns and track results'
  ];

  yPos = addBulletList(pdf, menuItems, margin, yPos, contentWidth, false);
  yPos += 10;

  addSubSection(pdf, 'Quick Stats Cards', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  const statsText = pdf.splitTextToSize(
    'Your dashboard displays real-time metrics including today\'s appointments, weekly revenue, total active clients, and upcoming bookings. These cards give you an instant snapshot of your business health.',
    contentWidth
  );
  pdf.text(statsText, margin + 5, yPos);
}

function addClientsSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '3. Managing Clients', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Adding a New Client', margin, yPos, contentWidth);
  yPos += 8;

  const addClientSteps = [
    '1. Navigate to the Clients section',
    '2. Click the "Add Client" button',
    '3. Fill in client information (name, email, phone)',
    '4. Add optional notes or preferences',
    '5. Click "Save" to create the client profile'
  ];

  yPos = addBulletList(pdf, addClientSteps, margin, yPos, contentWidth);
  yPos += 10;

  addSubSection(pdf, 'Client Profiles', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  const profileText = pdf.splitTextToSize(
    'Each client profile stores appointment history, treatment notes, photos, payments, and communication logs. Click on any client to view their complete record and add new information.',
    contentWidth
  );
  pdf.text(profileText, margin + 5, yPos);
  yPos += profileText.length * 4 + 8;

  addSubSection(pdf, 'Importing Existing Clients', margin, yPos, contentWidth);
  yPos += 8;

  const importSteps = [
    '1. Download the CSV template from the Clients page',
    '2. Fill in your client data following the template format',
    '3. Click "Import Clients" and upload your CSV file',
    '4. Review and confirm the import'
  ];

  yPos = addBulletList(pdf, importSteps, margin, yPos, contentWidth);
}

function addAppointmentsSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '4. Scheduling Appointments', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Creating an Appointment', margin, yPos, contentWidth);
  yPos += 8;

  const appointmentSteps = [
    '1. Go to the Calendar section',
    '2. Click on a time slot or use "New Appointment"',
    '3. Select the client (or create a new one)',
    '4. Choose the service(s) to be performed',
    '5. Assign a staff member',
    '6. Set date and time',
    '7. Add any special notes',
    '8. Click "Save" to confirm'
  ];

  yPos = addBulletList(pdf, appointmentSteps, margin, yPos, contentWidth);
  yPos += 10;

  addSubSection(pdf, 'Managing Appointments', margin, yPos, contentWidth);
  yPos += 8;

  const managementOptions = [
    'View - Click any appointment to see details',
    'Reschedule - Drag and drop to a new time slot',
    'Cancel - Mark appointments as cancelled with notes',
    'Complete - Check off finished appointments',
    'No-Show - Track client attendance patterns'
  ];

  yPos = addBulletList(pdf, managementOptions, margin, yPos, contentWidth, false);
  yPos += 10;

  addInfoBox(pdf, 'Automated reminders are sent 24 hours before appointments!', margin, yPos, contentWidth);
}

function addServicesSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '5. Services & Pricing', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Adding Services', margin, yPos, contentWidth);
  yPos += 8;

  const serviceSteps = [
    '1. Navigate to the Services section',
    '2. Click "Add Service"',
    '3. Enter service name and description',
    '4. Set the price and duration',
    '5. Choose a category (e.g., Injectables, Laser, Facials)',
    '6. Add any preparation instructions',
    '7. Save your service'
  ];

  yPos = addBulletList(pdf, serviceSteps, margin, yPos, contentWidth);
  yPos += 10;

  addSubSection(pdf, 'Service Packages', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  const packageText = pdf.splitTextToSize(
    'Create package deals by bundling multiple services together at a discounted rate. Packages are great for promoting series treatments and increasing client retention.',
    contentWidth
  );
  pdf.text(packageText, margin + 5, yPos);
  yPos += packageText.length * 4 + 10;

  addSubSection(pdf, 'Dynamic Pricing', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFontSize(9);
  const dynamicText = pdf.splitTextToSize(
    'Enable AI-powered dynamic pricing to automatically adjust prices based on demand, time of day, and booking patterns to maximize your revenue.',
    contentWidth
  );
  pdf.text(dynamicText, margin + 5, yPos);
}

function addPaymentsSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '6. Processing Payments', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Taking Payments', margin, yPos, contentWidth);
  yPos += 8;

  const paymentSteps = [
    '1. Go to the appointment or client profile',
    '2. Click "Collect Payment"',
    '3. Enter the amount',
    '4. Select payment method (Card, Cash, Check)',
    '5. Process the transaction',
    '6. Send receipt to client via email or text'
  ];

  yPos = addBulletList(pdf, paymentSteps, margin, yPos, contentWidth);
  yPos += 10;

  addSubSection(pdf, 'Payment Links', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  const linkText = pdf.splitTextToSize(
    'Generate secure payment links to send to clients for remote payments. Perfect for deposits, package purchases, or missed appointments.',
    contentWidth
  );
  pdf.text(linkText, margin + 5, yPos);
  yPos += linkText.length * 4 + 10;

  addSubSection(pdf, 'Invoicing', margin, yPos, contentWidth);
  yPos += 8;

  const invoiceSteps = [
    '1. Navigate to Invoices section',
    '2. Click "Create Invoice"',
    '3. Select client and services',
    '4. Review and adjust amounts',
    '5. Send invoice via email',
    '6. Track payment status'
  ];

  yPos = addBulletList(pdf, invoiceSteps, margin, yPos, contentWidth);
  yPos += 10;

  addInfoBox(pdf, 'All transactions are automatically recorded in your revenue reports!', margin, yPos, contentWidth);
}

function addTipsSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '7. Pro Tips', margin, yPos, pageWidth);
  yPos += 15;

  const tips = [
    {
      title: 'Use Client Tags',
      description: 'Tag clients by preferences, services, or loyalty status for targeted marketing campaigns.'
    },
    {
      title: 'Enable Automated Reminders',
      description: 'Reduce no-shows by 60% with automated SMS and email appointment reminders.'
    },
    {
      title: 'Review Analytics Weekly',
      description: 'Check your revenue dashboard weekly to spot trends and optimize your business.'
    },
    {
      title: 'Take Before/After Photos',
      description: 'Document treatment results with photos stored securely in client profiles.'
    },
    {
      title: 'Create Service Packages',
      description: 'Boost revenue with package deals that encourage clients to book multiple sessions.'
    },
    {
      title: 'Use the Client Portal',
      description: 'Enable clients to book online 24/7, reducing phone calls and admin work.'
    }
  ];

  tips.forEach(tip => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(187, 247, 208);
    pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'FD');

    pdf.setFontSize(10);
    pdf.setTextColor(21, 128, 61);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tip.title, margin + 3, yPos + 6);

    pdf.setFontSize(8);
    pdf.setTextColor(22, 101, 52);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(tip.description, contentWidth - 6);
    pdf.text(descLines, margin + 3, yPos + 11);

    yPos += 22;
  });
}

function addSupportSection(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, contentWidth: number) {
  let yPos = margin;

  addSectionHeader(pdf, '8. Support & Resources', margin, yPos, pageWidth);
  yPos += 15;

  addSubSection(pdf, 'Need Help?', margin, yPos, contentWidth);
  yPos += 8;

  pdf.setFillColor(239, 246, 255);
  pdf.setDrawColor(191, 219, 254);
  pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');

  pdf.setFontSize(10);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Information', margin + 5, yPos + 8);

  pdf.setFontSize(9);
  pdf.setTextColor(29, 78, 216);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Email: support@spastream.net', margin + 5, yPos + 15);
  pdf.text('Phone: 404-660-3648', margin + 5, yPos + 21);
  pdf.text('Website: www.spastream.net', margin + 5, yPos + 27);

  yPos += 45;

  addSubSection(pdf, 'Additional Resources', margin, yPos, contentWidth);
  yPos += 8;

  const resources = [
    'Video Tutorials - Access our complete video library',
    'Knowledge Base - Search articles and guides',
    'Live Chat - Get instant help during business hours',
    'Webinars - Join monthly training sessions',
    'Community Forum - Connect with other spa owners'
  ];

  yPos = addBulletList(pdf, resources, margin, yPos, contentWidth, false);
  yPos += 15;

  pdf.setFillColor(240, 253, 250);
  pdf.setDrawColor(204, 251, 241);
  pdf.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');

  pdf.setFontSize(11);
  pdf.setTextColor(19, 78, 74);
  pdf.setFont('helvetica', 'bold');
  pdf.text('We\'re Here to Help!', pageWidth / 2, yPos + 10, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setTextColor(20, 83, 45);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Our support team is available Monday-Friday, 9 AM - 6 PM EST', pageWidth / 2, yPos + 17, { align: 'center' });

  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`Generated ${format(new Date(), 'MMMM dd, yyyy')} | SpaStream Quick Start Guide v1.0`, pageWidth / 2, footerY, { align: 'center' });
}

function addSectionHeader(pdf: jsPDF, title: string, x: number, y: number, pageWidth: number) {
  pdf.setFillColor(20, 184, 166);
  pdf.rect(0, y - 5, pageWidth, 12, 'F');

  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, x, y + 3);
}

function addSubSection(pdf: jsPDF, title: string, x: number, y: number, contentWidth: number) {
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, x, y);
}

function addBulletList(pdf: jsPDF, items: string[], x: number, y: number, contentWidth: number, numbered: boolean = true): number {
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');

  items.forEach((item, index) => {
    const bulletText = numbered ? item : `• ${item}`;
    const lines = pdf.splitTextToSize(bulletText, contentWidth - 10);
    pdf.text(lines, x + 5, y);
    y += lines.length * 4 + 2;
  });

  return y;
}

function addInfoBox(pdf: jsPDF, text: string, x: number, y: number, contentWidth: number) {
  pdf.setFillColor(254, 252, 232);
  pdf.setDrawColor(254, 240, 138);
  pdf.roundedRect(x, y, contentWidth, 12, 2, 2, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(113, 63, 18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💡 ', x + 3, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.text(text, x + 10, y + 7);
}
