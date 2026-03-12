
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposal } from '../types';

export const generateProposalPDF = (proposal: Proposal) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper for centered text
  const centerText = (text: string, yPos: number, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // Header
  centerText('Website Development Proposal', y, 22, true);
  y += 30;

  // Prepared For
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared For:', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(proposal.leadName || 'Valued Client', margin, y);
  y += 20;

  // Prepared By
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared By:', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('GREHASOFT,', margin, y);
  y += 6;
  doc.text('VISMAYA BUILDING, INFOPARK PHASE 1,', margin, y);
  y += 6;
  doc.text('KAKKANADU, KOCHI, KERALA.', margin, y);
  y += 6;
  doc.text('Website: www.grehasoft.com', margin, y);
  y += 6;
  doc.text('Email: grehasoft@gmail.com, info@grehasoft.com', margin, y);
  y += 20;

  // Date and Place
  doc.setFont('helvetica', 'bold');
  doc.text(`DATE: ${new Date(proposal.created_at).toLocaleDateString()}`, margin, y);
  doc.text('PLACE: Kochi', pageWidth - margin - 40, y);
  y += 15;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.text('Dear Sir,', margin, y);
  y += 10;
  const introText = `Thank you for considering GrehaSoft for your website development needs. As discussed, we have reviewed the reference website and are pleased to submit a proposal for your consideration:`;
  const splitIntro = doc.splitTextToSize(introText, pageWidth - 2 * margin);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 7;

  const aboutText = `At GrehaSoft, we understand the challenges of finding the right partner for branding, website development, and software solutions. Our top priority is client satisfaction, and we assure you that our team will deliver the best solutions using the latest technologies. We also commit to providing dedicated support during our office hours, ensuring that all your queries are addressed promptly.`;
  const splitAbout = doc.splitTextToSize(aboutText, pageWidth - 2 * margin);
  doc.text(splitAbout, margin, y);
  y += splitAbout.length * 7;

  doc.text('Thank you for considering us as your partner. We look forward to the opportunity to collaborate with you.', margin, y);
  y += 15;

  doc.text('Best regards,', margin, y);
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Raji T. Skariah', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Grehasoft', margin, y);
  y += 6;
  doc.text('+91 89215 40 183 | +91 98950 72 145', margin, y);
  y += 6;
  doc.text('info@grehasoft.com | grehasoft@gmail.com', margin, y);
  y += 20;

  // New Page for Project Overview and Scope
  doc.addPage();
  y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Project Overview:', margin, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const overviewText = proposal.projectOverview || `To develop a user-friendly, professional, and SEO-optimized website that enhances the client's online presence, improves visibility, and facilitates efficient product and order management.`;
  const splitOverview = doc.splitTextToSize(overviewText, pageWidth - 2 * margin);
  doc.text(splitOverview, margin, y);
  y += splitOverview.length * 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Scope of Work', margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.text('Website Features', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const features = [
    '1. Device Independence: Fully Responsive design to ensure seamless performance on desktops, tablets, and mobile devices.',
    '2. SEO friendliness: Incorporate SEO-friendly URLs, images, and design for improved search engine rankings.',
    '3. Social Media Integration: Links and social sharing buttons for easy promotion of products on social media platforms.',
    '4. Analytics and Tracking: Can easily integrate tools like Google Analytics and Google Search Console for performance monitoring.'
  ];
  features.forEach(f => {
    doc.text(f, margin + 5, y);
    y += 6;
  });
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Proposed Website Structure & Pages', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const pages = [
    '1. Hero Section (Top Banner)',
    '2. About the Magazine',
    '3. Our Vision',
    '4. What Makes the Magazine Unique',
    '5. Editorial Sections of the Magazine',
    '   - Icon & Influence',
    '   - Fitness for Life',
    '   - Fashion in Motion',
    '   - Culture, Heritage & Identity',
    '   - Sportswear & Uniform Stories',
    '   - Brands & Innovation',
    '6. Who This Magazine Is For',
    '7. Our Belief',
    '8. Call To Action (Join the Global Conversation)',
    '9. Contact / Footer Section'
  ];
  pages.forEach(p => {
    doc.text(p, margin + 5, y);
    y += 5;
  });
  y += 10;

  // Estimated Cost Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Estimated Cost', margin, y);
  y += 5;

  const tableBody = (proposal.items || []).map(item => [
    item.service,
    item.description,
    item.cost.toString()
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['Website Development', 'Full website design and development', proposal.amount.toString()]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Service', 'Description', 'Cost (INR)']],
    body: [
      ...tableBody,
      [{ content: 'Total Estimated Cost', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, (proposal.subtotal || proposal.amount).toString()],
      [{ content: 'Discount', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, (proposal.discount || 0).toString()],
      [{ content: 'Grand Total', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: `INR ${proposal.amount}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
    ],
    theme: 'grid',
    headStyles: { fillColor: [13, 110, 253] },
    margin: { left: margin, right: margin }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Additional Charges
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Additional Charges', margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.text('Domain & Hosting: Starts at INR 5,000 per year.', margin, y);
  y += 5;
  doc.text('SSL Certificate: Free SSL included. Paid SSL extra.', margin, y);
  y += 15;

  // Timeline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Estimated Timeline', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('- Website Design & Development: 2 - 3 weeks', margin + 5, y);
  y += 5;
  doc.text('- Testing & Final Review: 1 week', margin + 5, y);
  y += 5;
  doc.text('- Deployment & Launch: Upon final approval', margin + 5, y);
  y += 15;

  // Terms and Conditions (New Page)
  doc.addPage();
  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TERMS AND CONDITIONS:', margin, y);
  y += 10;
  doc.setFontSize(10);
  const terms = [
    '1. Payment Terms: 50% upfront, 50% on completion.',
    '2. Project Scope & Costs: Based on current requirements, changes may incur extra costs.',
    '3. Design: 1 initial design, 2 revisions included.',
    '4. Client Responsibilities: Client must provide all data, logos, and content.',
    '5. E-Commerce: Client provides product list. Extra products at INR 75/each.',
    '6. Third-party tools: Subscription costs not included.',
    '7. Multimedia: Client provides YouTube URLs for videos.',
    '8. Legal: Client responsible for data and image licenses.',
    '9. Timeline: Impacted by client approval speed.',
    '10. Portfolio: Grehasoft may mention client in portfolio.',
    '11. Validity: Proposal valid for 3 months.',
    '12. Support: Available 9:00 AM to 6:00 PM IST on working days.'
  ];
  terms.forEach(t => {
    const splitT = doc.splitTextToSize(t, pageWidth - 2 * margin);
    doc.text(splitT, margin, y);
    y += splitT.length * 6;
  });

  y += 10;
  centerText('WISHING YOU A GREAT DAY!!', y, 12, true);
  y += 15;
  doc.text('RAJI T SKARIAH', margin, y);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, y);

  // Save PDF
  doc.save(`Proposal_${proposal.title.replace(/\s+/g, '_')}.pdf`);
};
