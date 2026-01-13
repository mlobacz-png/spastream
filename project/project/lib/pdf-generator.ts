import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface TreatmentPlan {
  clientName: string;
  createdAt: string;
  photoUrl?: string;
  concerns: string[];
  recommendations: Array<{
    name: string;
    cost: number;
    duration: string;
    areas: string[];
    addressesConcerns: string[];
  }>;
  estimatedCost: number;
}

export async function generateTreatmentPlanPDF(plan: TreatmentPlan) {
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

  pdf.setFillColor(245, 247, 250);
  pdf.rect(0, 0, pageWidth, 50, 'F');

  pdf.setFontSize(28);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Treatment Plan', margin, yPos + 12);

  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Personalized aesthetic treatment recommendation', margin, yPos + 20);

  yPos = 60;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'FD');

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CLIENT', margin + 5, yPos + 8);

  pdf.setFontSize(16);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text(plan.clientName, margin + 5, yPos + 16);

  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PLAN DATE', margin + 5, yPos + 24);

  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);
  pdf.text(format(new Date(plan.createdAt), 'MMMM dd, yyyy'), margin + 5, yPos + 30);

  yPos += 45;

  if (plan.photoUrl) {
    try {
      const imgData = await loadImageAsBase64(plan.photoUrl);
      const imgWidth = 40;
      const imgHeight = 40;
      pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }

  pdf.setFontSize(14);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Identified Concerns', margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');

  const concernsPerRow = 2;
  const concernWidth = (contentWidth - 5) / concernsPerRow;
  let xOffset = margin;
  let rowCount = 0;

  plan.concerns.forEach((concern, index) => {
    if (rowCount >= concernsPerRow) {
      rowCount = 0;
      xOffset = margin;
      yPos += 10;
    }

    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(187, 247, 208);
    pdf.roundedRect(xOffset, yPos - 5, concernWidth - 2, 8, 2, 2, 'FD');

    pdf.setTextColor(21, 128, 61);
    pdf.text(concern, xOffset + 2, yPos);

    xOffset += concernWidth;
    rowCount++;
  });

  yPos += 15;

  pdf.setFontSize(14);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recommended Treatments', margin, yPos);
  yPos += 10;

  plan.recommendations.forEach((treatment, index) => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }

    const boxHeight = 32;
    pdf.setFillColor(240, 253, 250);
    pdf.setDrawColor(204, 251, 241);
    pdf.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'FD');

    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.text(treatment.name, margin + 5, yPos + 8);

    pdf.setFontSize(14);
    pdf.setTextColor(20, 184, 166);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${treatment.cost}`, pageWidth - margin - 20, yPos + 8);

    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Duration: ${treatment.duration}`, margin + 5, yPos + 14);

    pdf.setFontSize(9);
    pdf.text(`Areas: ${treatment.areas.join(', ')}`, margin + 5, yPos + 19);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const concernsText = `Addresses: ${treatment.addressesConcerns.join(', ')}`;
    const splitText = pdf.splitTextToSize(concernsText, contentWidth - 10);
    pdf.text(splitText, margin + 5, yPos + 25);

    yPos += boxHeight + 5;
  });

  yPos += 5;

  if (yPos > pageHeight - 40) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFillColor(239, 246, 255);
  pdf.setDrawColor(191, 219, 254);
  pdf.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'FD');

  pdf.setFontSize(12);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Investment', margin + 5, yPos + 8);

  pdf.setFontSize(18);
  pdf.setTextColor(29, 78, 216);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`$${plan.estimatedCost}`, margin + 5, yPos + 16);

  const finalY = pageHeight - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.setFont('helvetica', 'italic');
  pdf.text(
    'This treatment plan is a personalized recommendation. Results may vary by individual.',
    pageWidth / 2,
    finalY,
    { align: 'center' }
  );

  pdf.setFontSize(7);
  pdf.text(
    `Generated on ${format(new Date(), 'MMMM dd, yyyy')} | SpaStream`,
    pageWidth / 2,
    finalY + 4,
    { align: 'center' }
  );

  addPrivacyPolicyPage(pdf);

  const fileName = `Treatment_Plan_${plan.clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  pdf.save(fileName);
}

function addPrivacyPolicyPage(pdf: jsPDF) {
  pdf.addPage();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  pdf.setFillColor(245, 247, 250);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setFontSize(20);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Privacy Notice', margin, yPos + 10);

  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Last Updated: ${format(new Date(), 'MMMM dd, yyyy')}`, margin, yPos + 17);

  yPos = 50;

  const sections = [
    {
      title: 'Protected Health Information',
      content: 'This document contains Protected Health Information (PHI) as defined by HIPAA. It is intended solely for the individual named in this treatment plan and their authorized healthcare providers.'
    },
    {
      title: 'HIPAA Compliance',
      content: 'SpaStream maintains strict HIPAA compliance standards. All PHI is encrypted both in transit (TLS 1.3) and at rest (AES-256). Access to PHI is restricted through authentication and role-based access controls.'
    },
    {
      title: 'Data Security',
      content: 'Your information is protected with comprehensive security measures including end-to-end encryption, encrypted database storage, multi-factor authentication options, and regular security audits.'
    },
    {
      title: 'Your Rights',
      content: 'You have the right to access, amend, and request restrictions on the use of your health information. You also have the right to receive a list of disclosures and to be notified of any breach of your PHI.'
    },
    {
      title: 'Confidentiality',
      content: 'We do not sell your information. Your health information may only be shared with your consent, with HIPAA-compliant service providers operating under Business Associate Agreements, when required by law, or in emergency situations to prevent serious harm.'
    },
    {
      title: 'Document Handling',
      content: 'Please store this document securely and dispose of it properly when no longer needed. Do not share this document with unauthorized individuals. If you have questions about our privacy practices, contact: privacy@spastream.com'
    }
  ];

  pdf.setFontSize(9);

  sections.forEach((section, index) => {
    if (yPos > pageHeight - 45) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(section.title, margin, yPos);
    yPos += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    const lines = pdf.splitTextToSize(section.content, contentWidth);
    pdf.text(lines, margin, yPos);
    yPos += lines.length * 4 + 8;
  });

  if (yPos > pageHeight - 30) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFillColor(239, 246, 255);
  pdf.setDrawColor(191, 219, 254);
  pdf.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(30, 58, 138);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Complete Privacy Policy & Terms of Service', margin + 5, yPos + 7);

  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('For our complete Privacy Policy and Terms of Service, please visit:', margin + 5, yPos + 12);

  pdf.setTextColor(29, 78, 216);
  pdf.setFont('helvetica', 'normal');
  pdf.text('www.spastream.com/privacy  |  www.spastream.com/terms', margin + 5, yPos + 16);
}

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
