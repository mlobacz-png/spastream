import jsPDF from 'jspdf';

interface LineItem {
  service: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  line_items: LineItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes: string;
}

interface Client {
  name: string;
  email: string;
  phone: string;
}

interface PaymentSettings {
  currency: string;
  tax_rate: number;
}

export function generateInvoicePDF(
  invoice: Invoice,
  client: Client,
  settings: PaymentSettings | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  let currentY = 20;

  doc.setFontSize(24);
  doc.setTextColor(6, 182, 212);
  doc.text('INVOICE', leftMargin, currentY);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const invoiceNumberWidth = doc.getTextWidth(invoice.invoice_number);
  doc.text(invoice.invoice_number, rightMargin - invoiceNumberWidth, currentY);

  currentY += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(leftMargin, currentY, rightMargin, currentY);

  currentY += 15;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('From:', leftMargin, currentY);

  currentY += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('Your MedSpa Name', leftMargin, currentY);
  currentY += 5;
  doc.text('123 Spa Street', leftMargin, currentY);
  currentY += 5;
  doc.text('City, State 12345', leftMargin, currentY);

  currentY = 50;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const billToWidth = doc.getTextWidth('Bill To:');
  doc.text('Bill To:', rightMargin - 80, currentY);

  currentY += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(client.name, rightMargin - 80, currentY);
  currentY += 5;
  doc.text(client.email, rightMargin - 80, currentY);
  currentY += 5;
  doc.text(client.phone, rightMargin - 80, currentY);

  currentY = 80;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice Date: ${invoice.invoice_date}`, leftMargin, currentY);
  currentY += 6;
  doc.text(`Due Date: ${invoice.due_date}`, leftMargin, currentY);
  currentY += 6;

  const statusColors: { [key: string]: [number, number, number] } = {
    paid: [34, 197, 94],
    sent: [59, 130, 246],
    overdue: [239, 68, 68],
    draft: [234, 179, 8],
  };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, leftMargin, currentY);

  currentY += 15;

  doc.setFillColor(6, 182, 212);
  doc.rect(leftMargin, currentY, rightMargin - leftMargin, 8, 'F');

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Description', leftMargin + 2, currentY + 5.5);
  doc.text('Qty', rightMargin - 80, currentY + 5.5);
  doc.text('Price', rightMargin - 60, currentY + 5.5);
  doc.text('Amount', rightMargin - 35, currentY + 5.5, { align: 'right' });

  currentY += 10;

  doc.setTextColor(60, 60, 60);
  invoice.line_items.forEach((item) => {
    doc.text(item.service, leftMargin + 2, currentY + 4);
    doc.text(item.quantity.toString(), rightMargin - 80, currentY + 4);
    doc.text(`$${item.price.toFixed(2)}`, rightMargin - 60, currentY + 4);
    doc.text(`$${item.total.toFixed(2)}`, rightMargin - 2, currentY + 4, { align: 'right' });

    currentY += 8;
    doc.setDrawColor(240, 240, 240);
    doc.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 2;
  });

  currentY += 8;

  doc.setFontSize(10);
  const summaryX = rightMargin - 70;

  doc.text('Subtotal:', summaryX, currentY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
  currentY += 6;

  if (invoice.discount_amount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text('Discount:', summaryX, currentY);
    doc.text(`-$${invoice.discount_amount.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
    currentY += 6;
    doc.setTextColor(60, 60, 60);
  }

  const taxRate = settings?.tax_rate || 0;
  doc.text(`Tax (${(taxRate * 100).toFixed(1)}%):`, summaryX, currentY);
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
  currentY += 8;

  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(summaryX, currentY, rightMargin, currentY);
  currentY += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', summaryX, currentY);
  doc.text(`$${invoice.total_amount.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
  currentY += 6;

  if (invoice.amount_paid > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount Paid:', summaryX, currentY);
    doc.text(`$${invoice.amount_paid.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text('Balance Due:', summaryX, currentY);
    doc.text(`$${invoice.balance_due.toFixed(2)}`, rightMargin - 2, currentY, { align: 'right' });
  }

  if (invoice.notes) {
    currentY += 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', leftMargin, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const notesLines = doc.splitTextToSize(invoice.notes, rightMargin - leftMargin - 10);
    doc.text(notesLines, leftMargin, currentY);
  }

  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`${invoice.invoice_number}.pdf`);
}
