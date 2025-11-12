import jsPDF from 'jspdf';

export function generatePlatformBrochure() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 0;

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin + 5;
      return true;
    }
    return false;
  };

  const addSectionHeader = (title: string, color: [number, number, number] = [37, 99, 235]) => {
    addNewPageIfNeeded(25);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.setTextColor(...color);
    doc.text(title, margin, yPos);
    yPos += 4;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setTextColor(40, 40, 40);
  };

  const addParagraph = (text: string, fontSize = 11, fontStyle: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('times', fontStyle);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, contentWidth);

    lines.forEach((line: string) => {
      addNewPageIfNeeded(8);
      doc.text(line, margin, yPos);
      yPos += fontSize === 11 ? 6.5 : 7;
    });
    yPos += 3;
  };

  const addBulletPoint = (text: string, indent = 8) => {
    addNewPageIfNeeded(10);
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text('•', margin + indent, yPos);
    const lines = doc.splitTextToSize(text, contentWidth - indent - 8);
    lines.forEach((line: string, index: number) => {
      if (index > 0) addNewPageIfNeeded(7);
      doc.text(line, margin + indent + 8, yPos);
      yPos += 6.5;
    });
    yPos += 1;
  };

  const addFeatureBox = (title: string, description: string, color: [number, number, number]) => {
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    const descLines = doc.splitTextToSize(description, contentWidth - 12);
    const boxHeight = 18 + (descLines.length * 5.5);

    addNewPageIfNeeded(boxHeight + 8);

    doc.setDrawColor(...color);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'D');

    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setTextColor(...color);
    doc.text(title, margin + 6, yPos + 10);

    let textY = yPos + 18;
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setTextColor(50, 50, 50);
    descLines.forEach((line: string) => {
      doc.text(line, margin + 6, textY);
      textY += 5.5;
    });

    yPos += boxHeight + 6;
    doc.setTextColor(40, 40, 40);
  };

  const addSubsectionTitle = (title: string, color: [number, number, number] = [59, 130, 246]) => {
    addNewPageIfNeeded(15);
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.setTextColor(...color);
    doc.text(title, margin, yPos);
    yPos += 10;
    doc.setTextColor(40, 40, 40);
  };

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 85, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('times', 'bold');
  doc.text('SpaStream', pageWidth / 2, 38, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('times', 'normal');
  doc.text('Complete Practice Management System', pageWidth / 2, 53, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Streamline Your Med Spa Operations', pageWidth / 2, 66, { align: 'center' });

  yPos = 100;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('Executive Summary', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  addParagraph('SpaStream is a comprehensive, cloud-based practice management system designed specifically for medical spas and aesthetic practices. Our platform combines client management, appointment scheduling, financial tracking, and AI-powered features to help you run your business more efficiently and profitably.');

  addParagraph('Built with security and compliance at its core, SpaStream includes HIPAA-compliant data handling, audit logging, and encrypted storage. Whether you\'re a solo practitioner or managing multiple providers, our intuitive interface and powerful features scale with your business.');

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('Core Features', [37, 99, 235]);

  addFeatureBox(
    'Smart Calendar & Scheduling',
    'Intuitive calendar with week, month, and day views. Book appointments with drag-and-drop ease, see availability at a glance, and manage your schedule efficiently.',
    [59, 130, 246]
  );

  addFeatureBox(
    'Client Management',
    'Complete client profiles with contact information, treatment history, photos, medical notes, and consent forms. Everything you need in one place.',
    [59, 130, 246]
  );

  addFeatureBox(
    'Revenue Tracking & Analytics',
    'Track payments, monitor revenue by service type, see collection rates, and identify outstanding balances. Make data-driven business decisions.',
    [16, 185, 129]
  );

  addFeatureBox(
    'Treatment Packages',
    'Create service bundles to increase revenue and client retention. Offer package deals with automatic per-session pricing and expiration tracking.',
    [139, 92, 246]
  );

  addFeatureBox(
    'Automated Reminders',
    'Reduce no-shows with automated appointment reminders via email or SMS. Set custom timing and templates.',
    [245, 158, 11]
  );

  addFeatureBox(
    'Payment Processing & Invoicing',
    'Integrated Stripe payments, professional invoice generation with PDF export, deposit collection, package payment plans, and complete transaction history.',
    [16, 185, 129]
  );

  addFeatureBox(
    'SMS Communication System',
    'Two-way texting with clients via Twilio. Automated appointment reminders, bulk campaigns, conversation threads, and message history tracking.',
    [168, 85, 247]
  );

  addFeatureBox(
    'Advanced Analytics Dashboard',
    'Revenue analysis, client lifetime value, retention metrics, appointment performance, peak hours/days insights, and business intelligence reporting.',
    [251, 146, 60]
  );

  addFeatureBox(
    'AI-Powered Features',
    'Treatment recommendations, dynamic pricing, no-show prediction, reputation management, staff optimization, and compliance auditing powered by artificial intelligence.',
    [139, 92, 246]
  );

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('Detailed Feature Breakdown', [37, 99, 235]);

  addSubsectionTitle('Calendar & Appointment Management', [59, 130, 246]);
  addBulletPoint('Multiple calendar views (week, month, day) for flexible scheduling');
  addBulletPoint('Drag-and-drop appointment creation and rescheduling');
  addBulletPoint('Color-coded appointment statuses (pending, confirmed, completed, cancelled, no-show)');
  addBulletPoint('Appointment details with service, duration, client info, and notes');
  addBulletPoint('Quick edit functionality directly from calendar view');
  addBulletPoint('Today\'s appointments and upcoming appointments dashboard');
  addBulletPoint('Search and filter appointments by status, date, or client');
  yPos += 6;

  addSubsectionTitle('Client Management System', [59, 130, 246]);
  addBulletPoint('Comprehensive client profiles with contact information');
  addBulletPoint('Treatment history tracking with dates, services, and providers');
  addBulletPoint('Before/after photo management with secure cloud storage');
  addBulletPoint('Medical notes and consent form tracking');
  addBulletPoint('Client search functionality by name, email, or phone');
  addBulletPoint('Import clients from CSV for easy migration');
  addBulletPoint('Export client data for reporting or backup');
  addBulletPoint('Quick access to client profiles from appointments');

  doc.addPage();
  yPos = margin + 5;

  addSubsectionTitle('Revenue & Financial Analytics', [16, 185, 129]);
  addBulletPoint('Real-time revenue dashboard with key metrics');
  addBulletPoint('Track total revenue, monthly revenue, and yearly revenue');
  addBulletPoint('Monitor outstanding balances and collection rates');
  addBulletPoint('Payment status tracking (pending, paid, partial, refunded)');
  addBulletPoint('Multiple payment methods (cash, card, transfer, package)');
  addBulletPoint('Revenue breakdown by service type with percentages');
  addBulletPoint('Recent payment history with client details');
  addBulletPoint('Financial reports for tax and accounting purposes');
  yPos += 6;

  addSubsectionTitle('Treatment Package System', [139, 92, 246]);
  addBulletPoint('Create unlimited service packages and bundles');
  addBulletPoint('Set total sessions, pricing, and validity periods');
  addBulletPoint('Automatic per-session cost calculation');
  addBulletPoint('Package descriptions for marketing and sales');
  addBulletPoint('Active/inactive status for seasonal offerings');
  addBulletPoint('Track package purchases per client');
  addBulletPoint('Monitor remaining sessions and expiration dates');
  addBulletPoint('Package revenue reporting and analytics');
  yPos += 6;

  addSubsectionTitle('Automated Communication', [245, 158, 11]);
  addBulletPoint('Automated appointment reminders 24 hours in advance');
  addBulletPoint('Email and SMS reminder options');
  addBulletPoint('Customizable reminder templates and timing');
  addBulletPoint('Reminder status tracking (pending, sent, failed)');
  addBulletPoint('Reduce no-shows by up to 50%');
  addBulletPoint('Professional automated client communication');
  addBulletPoint('Follow-up message scheduling');

  doc.addPage();
  yPos = margin + 5;

  addSubsectionTitle('Payment Processing & Invoicing', [16, 185, 129]);
  addBulletPoint('Integrated Stripe payment processing');
  addBulletPoint('Professional invoice generation with PDF export');
  addBulletPoint('Multiple payment methods (card, cash, check, package)');
  addBulletPoint('Deposit collection and tracking');
  addBulletPoint('Package payment plans with installments');
  addBulletPoint('Complete transaction history with audit trail');
  addBulletPoint('Automatic payment confirmation emails');
  addBulletPoint('Invoice viewing in client portal');
  yPos += 6;

  addSubsectionTitle('SMS Communication System', [168, 85, 247]);
  addBulletPoint('Two-way SMS conversations with clients');
  addBulletPoint('Twilio integration for reliable delivery');
  addBulletPoint('Automated appointment reminders via SMS');
  addBulletPoint('Conversation threads organized by client');
  addBulletPoint('Unread message badges and notifications');
  addBulletPoint('Quick send for one-off messages');
  addBulletPoint('Bulk SMS campaigns (coming soon)');
  addBulletPoint('Message delivery status tracking');
  yPos += 6;

  addSubsectionTitle('Advanced Analytics Dashboard', [251, 146, 60]);
  addBulletPoint('Revenue analysis with growth tracking');
  addBulletPoint('Revenue by service and monthly trends');
  addBulletPoint('Client lifetime value calculations');
  addBulletPoint('Retention rate and churn rate metrics');
  addBulletPoint('Appointment completion and no-show rates');
  addBulletPoint('Peak hours and days identification');
  addBulletPoint('Top performing services analysis');
  addBulletPoint('Customizable time period views (7, 30, 90, 365 days)');

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('AI-Powered Intelligence', [139, 92, 246]);

  addParagraph('SpaStream includes 6 advanced AI features that help you make smarter business decisions and provide better client care:', 11, 'normal');
  yPos += 4;

  addSubsectionTitle('AI Compliance Auditor', [139, 92, 246]);
  addParagraph('Continuously monitors your practice for HIPAA compliance issues. Scans consent forms, data handling, audit logs, and security measures. Prevents costly violations and fines.');
  yPos += 3;

  addSubsectionTitle('Treatment Recommender', [139, 92, 246]);
  addParagraph('Analyzes client history, concerns, and demographics to suggest personalized treatment plans. Increases upsell opportunities and improves client outcomes.');
  yPos += 3;

  addSubsectionTitle('Dynamic Pricing Optimizer', [139, 92, 246]);
  addParagraph('Recommends optimal pricing based on demand patterns, seasonality, competition, and client demographics. Maximize revenue while staying competitive.');
  yPos += 3;

  addSubsectionTitle('No-Show Predictor', [139, 92, 246]);
  addParagraph('Identifies high-risk appointments using historical patterns and client behavior. Take preventive action with extra reminders or deposit requirements.');
  yPos += 3;

  addSubsectionTitle('Reputation Booster', [139, 92, 246]);
  addParagraph('Identifies satisfied clients and suggests optimal timing for review requests. Build your online reputation strategically.');
  yPos += 3;

  addSubsectionTitle('Staff Optimizer', [139, 92, 246]);
  addParagraph('Analyzes booking patterns and provides staffing recommendations based on demand forecasts. Optimize labor costs while maintaining service quality.');

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('Security & Compliance', [220, 38, 38]);

  addParagraph('Medical spas handle sensitive client information. SpaStream is built with security and compliance as top priorities:', 11, 'bold');
  yPos += 4;

  addBulletPoint('HIPAA-compliant data handling and storage');
  addBulletPoint('Encrypted data transmission (SSL/TLS)');
  addBulletPoint('Secure cloud storage with automated backups');
  addBulletPoint('Comprehensive audit logging for all actions');
  addBulletPoint('Role-based access control (coming soon)');
  addBulletPoint('Consent form management and tracking');
  addBulletPoint('Data export for compliance and portability');
  addBulletPoint('Regular security updates and monitoring');
  yPos += 6;

  addParagraph('Every action in the system is logged with timestamps and user information, creating a complete audit trail for compliance and accountability.', 11, 'normal');

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('Business Benefits', [16, 185, 129]);

  const benefits = [
    {
      title: 'Save Time',
      desc: 'Automate scheduling, reminders, SMS communications, and record-keeping. Spend more time with clients and less on administrative tasks.'
    },
    {
      title: 'Increase Revenue',
      desc: 'Integrated payments, invoicing, package deals, reduced no-shows, and AI-optimized pricing. Data-driven decisions that boost your bottom line by 20-40%.'
    },
    {
      title: 'Improve Client Experience',
      desc: 'Professional SMS communication, organized records, personalized treatment recommendations, and convenient online booking create happy, loyal clients.'
    },
    {
      title: 'Scale Your Business',
      desc: 'Whether you have 10 clients or 1,000, SpaStream grows with you. Add providers, services, and locations as you expand. All analytics update in real-time.'
    },
    {
      title: 'Stay Organized',
      desc: 'All client information, appointments, payments, invoices, SMS conversations, and analytics in one centralized, searchable system.'
    },
    {
      title: 'Make Better Decisions',
      desc: 'Revenue analytics, client lifetime value, retention metrics, and 6 AI-powered insights help you understand your business and plan for profitable growth.'
    }
  ];

  benefits.forEach(benefit => {
    addNewPageIfNeeded(22);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`✓ ${benefit.title}`, margin, yPos);
    yPos += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    addParagraph(benefit.desc, 11, 'normal');
    yPos += 2;
  });

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('System Requirements', [100, 116, 139]);

  addParagraph('SpaStream is a cloud-based web application. All you need is:', 11, 'bold');
  yPos += 3;

  addBulletPoint('A modern web browser (Chrome, Firefox, Safari, or Edge)');
  addBulletPoint('Internet connection');
  addBulletPoint('Computer, tablet, or smartphone');
  addBulletPoint('No software installation required');
  addBulletPoint('No hardware to maintain');
  addBulletPoint('Automatic updates and new features');
  yPos += 10;

  addSectionHeader('Getting Started', [37, 99, 235]);

  addParagraph('Getting started with SpaStream is simple and straightforward:', 11, 'bold');
  yPos += 3;

  const steps = [
    'Create your account and set up your practice profile',
    'Import existing clients from a CSV file or add them manually',
    'Configure your services and pricing',
    'Create treatment packages to offer clients',
    'Set up Stripe for payment processing (optional)',
    'Configure Twilio for SMS communications (optional)',
    'Start booking appointments and tracking revenue',
    'Enable AI features to optimize your operations',
    'Review analytics to understand your business performance'
  ];

  steps.forEach((step, index) => {
    addNewPageIfNeeded(10);
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`${index + 1}.`, margin + 3, yPos);
    const lines = doc.splitTextToSize(step, contentWidth - 12);
    lines.forEach((line: string, lineIndex: number) => {
      if (lineIndex > 0) addNewPageIfNeeded(7);
      doc.text(line, margin + 12, yPos);
      yPos += 6.5;
    });
    yPos += 1;
  });

  doc.addPage();
  yPos = margin + 5;

  addSectionHeader('Use Cases', [59, 130, 246]);

  const useCases = [
    {
      title: 'Solo Practitioners',
      desc: 'Perfect for independent providers managing their own schedule, clients, and finances. Keep everything organized without hiring additional staff.'
    },
    {
      title: 'Small Med Spas (2-5 Providers)',
      desc: 'Coordinate multiple providers, share client information, and track revenue across your team. Everyone stays on the same page.'
    },
    {
      title: 'Growing Practices',
      desc: 'As you add services, providers, and clients, SpaStream scales seamlessly. No migration or system changes needed.'
    },
    {
      title: 'Multi-Location Operations',
      desc: 'Manage all locations from one system. Track revenue by location and maintain consistent client records across facilities.'
    }
  ];

  useCases.forEach(useCase => {
    addNewPageIfNeeded(25);
    doc.setFontSize(13);
    doc.setFont('times', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(useCase.title, margin, yPos);
    yPos += 9;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    addParagraph(useCase.desc, 11, 'normal');
    yPos += 3;
  });

  yPos += 6;
  addSectionHeader('Support & Training', [139, 92, 246]);

  addParagraph('We are committed to your success with SpaStream:', 11, 'bold');
  yPos += 3;

  addBulletPoint('Comprehensive documentation and video tutorials');
  addBulletPoint('Email support for technical questions');
  addBulletPoint('Regular feature updates and improvements');
  addBulletPoint('User community and best practices sharing');
  addBulletPoint('Onboarding assistance for new customers');

  doc.addPage();
  yPos = 70;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('times', 'bold');
  doc.text('Transform Your', pageWidth / 2, yPos, { align: 'center' });
  yPos += 16;
  doc.text('Med Spa Practice', pageWidth / 2, yPos, { align: 'center' });
  yPos += 22;

  doc.setFontSize(15);
  doc.setFont('times', 'normal');
  doc.text('SpaStream brings together everything you need', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.text('to run a successful aesthetic practice.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 22;

  doc.setFontSize(13);
  doc.text('Start streamlining your operations today.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 32;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 25, yPos, contentWidth - 50, 42, 4, 4, 'F');

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.text('SpaStream', pageWidth / 2, yPos + 17, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('times', 'normal');
  doc.text('Complete Practice Management', pageWidth / 2, yPos + 30, { align: 'center' });

  yPos = pageHeight - 32;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text('www.spastream.net', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.text('info@spastream.net', pageWidth / 2, yPos, { align: 'center' });

  doc.save('SpaStream-Platform-Overview.pdf');
}
