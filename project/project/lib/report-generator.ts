import { jsPDF } from 'jspdf';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface MonthlyRevenueData {
  month: string;
  totalRevenue: number;
  previousMonthRevenue: number;
  topServices: Array<{
    name: string;
    revenue: number;
    count: number;
  }>;
  revenueByDay: Array<{
    date: string;
    amount: number;
  }>;
  newClients: number;
  returningClients: number;
  averageTransactionValue: number;
}

interface StaffPerformanceData {
  period: string;
  staff: Array<{
    name: string;
    role: string;
    totalRevenue: number;
    appointments: number;
    clientSatisfaction: number;
    utilizationRate: number;
    topServices: string[];
  }>;
}

interface ClientSatisfactionData {
  period: string;
  overallRating: number;
  totalResponses: number;
  ratings: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  topComplaints: Array<{ issue: string; count: number }>;
  topPraises: Array<{ praise: string; count: number }>;
  serviceRatings: Array<{ service: string; rating: number }>;
}

export function generateMonthlyRevenueReport(data: MonthlyRevenueData) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  addReportHeader(pdf, 'Monthly Revenue Report', data.month);
  yPos = 50;

  const revenueChange = ((data.totalRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100;
  const changeColor: [number, number, number] = revenueChange >= 0 ? [34, 197, 94] : [239, 68, 68];

  addMetricCard(pdf, margin, yPos, contentWidth / 2 - 5, 'Total Revenue', `$${data.totalRevenue.toLocaleString()}`, changeColor);
  addMetricCard(pdf, margin + contentWidth / 2 + 5, yPos, contentWidth / 2 - 5, 'vs Last Month', `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`, changeColor);

  yPos += 35;

  addMetricCard(pdf, margin, yPos, contentWidth / 3 - 5, 'New Clients', data.newClients.toString(), [59, 130, 246]);
  addMetricCard(pdf, margin + contentWidth / 3, yPos, contentWidth / 3 - 5, 'Returning', data.returningClients.toString(), [147, 51, 234]);
  addMetricCard(pdf, margin + 2 * contentWidth / 3 + 5, yPos, contentWidth / 3 - 5, 'Avg Transaction', `$${data.averageTransactionValue}`, [234, 179, 8]);

  yPos += 40;

  pdf.setFontSize(14);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Performing Services', margin, yPos);
  yPos += 8;

  data.topServices.forEach((service, index) => {
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'FD');

    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${service.name}`, margin + 3, yPos + 6);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${service.count} appointments`, margin + 3, yPos + 10);

    pdf.setFontSize(12);
    pdf.setTextColor(34, 197, 94);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${service.revenue.toLocaleString()}`, pageWidth - margin - 25, yPos + 7);

    yPos += 14;
  });

  addFooter(pdf);

  const fileName = `Revenue_Report_${data.month.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
}

export function generateStaffPerformanceReport(data: StaffPerformanceData) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  addReportHeader(pdf, 'Staff Performance Report', data.period);
  yPos = 50;

  data.staff.forEach((member, index) => {
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'FD');

    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(member.name, margin + 5, yPos + 8);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.text(member.role, margin + 5, yPos + 14);

    const metricsY = yPos + 22;
    const metricWidth = (contentWidth - 10) / 4;

    addInlineMetric(pdf, margin + 5, metricsY, 'Revenue', `$${member.totalRevenue.toLocaleString()}`);
    addInlineMetric(pdf, margin + 5 + metricWidth, metricsY, 'Appointments', member.appointments.toString());
    addInlineMetric(pdf, margin + 5 + 2 * metricWidth, metricsY, 'Satisfaction', `${member.clientSatisfaction.toFixed(1)}/5`);
    addInlineMetric(pdf, margin + 5 + 3 * metricWidth, metricsY, 'Utilization', `${member.utilizationRate}%`);

    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Top Services:', margin + 5, yPos + 40);

    pdf.setTextColor(59, 130, 246);
    pdf.text(member.topServices.join(', '), margin + 5, yPos + 45);

    const rating = member.clientSatisfaction;
    const barWidth = 40;
    const barHeight = 6;
    const barX = pageWidth - margin - barWidth - 5;
    const barY = yPos + 50;

    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

    const fillColor: [number, number, number] = rating >= 4.5 ? [34, 197, 94] : rating >= 4.0 ? [234, 179, 8] : [239, 68, 68];
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.roundedRect(barX, barY, (rating / 5) * barWidth, barHeight, 1, 1, 'F');

    yPos += 65;
  });

  addFooter(pdf);

  const fileName = `Staff_Performance_${data.period.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
}

export function generateClientSatisfactionReport(data: ClientSatisfactionData) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  addReportHeader(pdf, 'Client Satisfaction Report', data.period);
  yPos = 50;

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'FD');

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Overall Rating', margin + 5, yPos + 8);

  pdf.setFontSize(32);
  pdf.setTextColor(34, 197, 94);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.overallRating.toFixed(1), margin + 5, yPos + 22);

  pdf.setFontSize(18);
  pdf.setTextColor(100, 116, 139);
  pdf.text('/5.0', margin + 25, yPos + 22);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Based on ${data.totalResponses} responses`, margin + 5, yPos + 27);

  const starSize = 8;
  const starSpacing = 2;
  const startX = pageWidth - margin - (5 * (starSize + starSpacing));
  const starY = yPos + 15;

  for (let i = 0; i < 5; i++) {
    const x = startX + i * (starSize + starSpacing);
    const filled = i < Math.round(data.overallRating);
    drawStar(pdf, x, starY, starSize, filled);
  }

  yPos += 35;

  pdf.setFontSize(14);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Rating Distribution', margin, yPos);
  yPos += 8;

  const total = Object.values(data.ratings).reduce((sum, count) => sum + count, 0);
  [5, 4, 3, 2, 1].forEach((stars) => {
    const count = data.ratings[stars as keyof typeof data.ratings];
    const percentage = (count / total) * 100;

    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${stars} stars`, margin, yPos + 4);

    const barWidth = contentWidth - 40;
    const barHeight = 6;
    const barX = margin + 20;

    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(barX, yPos, barWidth, barHeight, 1, 1, 'F');

    const fillColors: { [key: number]: [number, number, number] } = {
      5: [34, 197, 94],
      4: [132, 204, 22],
      3: [234, 179, 8],
      2: [249, 115, 22],
      1: [239, 68, 68]
    };

    const fillColor = fillColors[stars];
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.roundedRect(barX, yPos, (percentage / 100) * barWidth, barHeight, 1, 1, 'F');

    pdf.setFontSize(9);
    pdf.text(`${count}`, pageWidth - margin - 10, yPos + 4);

    yPos += 10;
  });

  yPos += 5;

  const halfWidth = contentWidth / 2 - 5;

  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Praises', margin, yPos);
  pdf.text('Areas for Improvement', margin + halfWidth + 10, yPos);
  yPos += 8;

  const maxItems = Math.max(data.topPraises.length, data.topComplaints.length);

  for (let i = 0; i < maxItems; i++) {
    if (i < data.topPraises.length) {
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'normal');
      const praiseText = pdf.splitTextToSize(data.topPraises[i].praise, halfWidth - 5);
      pdf.text(praiseText, margin, yPos);

      pdf.setTextColor(34, 197, 94);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`(${data.topPraises[i].count})`, margin + halfWidth - 15, yPos);
    }

    if (i < data.topComplaints.length) {
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'normal');
      const complaintText = pdf.splitTextToSize(data.topComplaints[i].issue, halfWidth - 5);
      pdf.text(complaintText, margin + halfWidth + 10, yPos);

      pdf.setTextColor(239, 68, 68);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`(${data.topComplaints[i].count})`, pageWidth - margin - 15, yPos);
    }

    yPos += 10;
  }

  addFooter(pdf);

  const fileName = `Client_Satisfaction_${data.period.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
}

function addReportHeader(pdf: jsPDF, title: string, subtitle: string) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;

  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, 18);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle, margin, 28);

  pdf.setFontSize(9);
  pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth - margin - 45, 28);
}

function addMetricCard(pdf: jsPDF, x: number, y: number, width: number, label: string, value: string, color: [number, number, number]) {
  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(x, y, width, 30, 3, 3, 'FD');

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + 5, y + 8);

  pdf.setFontSize(18);
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, x + 5, y + 22);
}

function addInlineMetric(pdf: jsPDF, x: number, y: number, label: string, value: string) {
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x, y);

  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, x, y + 6);
}

function drawStar(pdf: jsPDF, x: number, y: number, size: number, filled: boolean) {
  const points: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const radius = filled ? size / 2 : size / 2;
    points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);

    const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    const innerRadius = size / 4;
    points.push([x + innerRadius * Math.cos(innerAngle), y + innerRadius * Math.sin(innerAngle)]);
  }

  if (filled) {
    pdf.setFillColor(234, 179, 8);
    pdf.setDrawColor(234, 179, 8);
  } else {
    pdf.setFillColor(226, 232, 240);
    pdf.setDrawColor(203, 213, 225);
  }

  pdf.lines(points.map((p, i) => {
    const next = points[(i + 1) % points.length];
    return [next[0] - p[0], next[1] - p[1]];
  }), points[0][0], points[0][1], [1, 1], 'FD');
}

function addFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.setFont('helvetica', 'italic');
  pdf.text(
    'Generated by SpaStream Practice Management System',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
}
