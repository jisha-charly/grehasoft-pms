import { BuilderConfig } from './BuilderSchema';

export interface SectionDefinition {
  id: string;
  builderKey: string;
  displayName: string;
  description: string;
  icon: string;
  editorType: 'cover' | 'richtext' | 'features' | 'deliverables' | 'pricing' | 'payment_terms' | 'thank_you';
  defaultContent: any;
  enabledByDefault: boolean;
}

export const SECTION_CONFIG: SectionDefinition[] = [
  {
    id: 'cover',
    builderKey: 'cover_page',
    displayName: 'Cover Page',
    description: 'Customize cover titles, theme presets, logo size and watermark visibility.',
    icon: 'bi-file-earmark-person',
    editorType: 'cover',
    defaultContent: {
      title: '',
      autoTitle: true,
      subtitle: 'Business Proposal',
      showSubtitle: true,
      preparedForCompany: '',
      preparedForName: '',
      preparedByCompany: 'Grehasoft Smart IT Solutions',
      preparedByAddress: 'Kochi, Kerala',
      preparedByEmail: 'info@grehasoft.com',
      preparedByWebsite: 'www.grehasoft.com',
      proposalId: '',
      proposalDate: '',
      place: 'Kochi'
    },
    enabledByDefault: true
  },
  {
    id: 'cover_letter',
    builderKey: 'cover_letter',
    displayName: 'Cover Letter',
    description: 'Initial greeting letter outlining the proposal submission.',
    icon: 'bi-envelope-open',
    editorType: 'richtext',
    defaultContent: `<p>Dear Sir,</p><p>Thank you for considering GrehaSoft for your software development needs. As discussed, we are pleased to submit a proposal for your consideration.</p><p>At GrehaSoft, we prioritize client satisfaction, delivering modern, secure, and SEO friendly solutions designed for scalability.</p><p>Best regards,</p><p><b>Grehasoft Smart IT Solutions</b></p>`,
    enabledByDefault: true
  },
  {
    id: 'company_profile',
    builderKey: 'company_profile',
    displayName: 'Company Profile',
    description: 'Outline background and core capabilities of the agency.',
    icon: 'bi-building',
    editorType: 'richtext',
    defaultContent: `<p>Grehasoft Smart IT Solutions is an enterprise software development agency based in Kochi, Infopark.</p><p>We provide comprehensive mobile app, web application, branding, and digital marketing services to clients worldwide.</p>`,
    enabledByDefault: true
  },
  {
    id: 'project_overview',
    builderKey: 'project_overview',
    displayName: 'Project Overview',
    description: 'Define the target project objectives and requirements.',
    icon: 'bi-briefcase',
    editorType: 'richtext',
    defaultContent: '',
    enabledByDefault: true
  },
  {
    id: 'scope',
    builderKey: 'scope_of_work',
    displayName: 'Scope of Work',
    description: 'Detail the functional scope of the proposed services.',
    icon: 'bi-card-checklist',
    editorType: 'richtext',
    defaultContent: '',
    enabledByDefault: true
  },
  {
    id: 'features',
    builderKey: 'features',
    displayName: 'Features List',
    description: 'Bullet points highlighting technical features included in design.',
    icon: 'bi-lightning-charge',
    editorType: 'features',
    defaultContent: [
      { title: 'Device Independence', desc: 'Fully responsive layouts suitable for desktops, tablets, and mobiles.' },
      { title: 'SEO Friendliness', desc: 'Pre-configured SEO URLs, meta fields, and Google Search Console tags.' },
      { title: 'Security & Encryption', desc: 'Pre-coded SSL certificate integration and encrypted user credentials.' }
    ],
    enabledByDefault: true
  },
  {
    id: 'deliverables',
    builderKey: 'deliverables',
    displayName: 'Deliverables',
    description: 'Phases, timelines and details of milestones to be delivered.',
    icon: 'bi-calendar-check',
    editorType: 'deliverables',
    defaultContent: [
      { phase: 'Phase 1: Wireframes', timeline: 'Week 1', details: 'Initial layout mockups, user flow, and design review.' },
      { phase: 'Phase 2: Core Development', timeline: 'Week 2-3', details: 'Frontend UI elements, backend database, and REST APIs.' },
      { phase: 'Phase 3: UAT & Launch', timeline: 'Week 4', details: 'Unit testing, client acceptance testing, server deployment.' }
    ],
    enabledByDefault: true
  },
  {
    id: 'timeline',
    builderKey: 'timeline',
    displayName: 'Project Timeline',
    description: 'Overview description of development schedule constraints.',
    icon: 'bi-hourglass-split',
    editorType: 'richtext',
    defaultContent: `<p>The estimated delivery timeline is 4-6 weeks upon contract signoff and advance payment. Any change in scope may affect this estimate.</p>`,
    enabledByDefault: true
  },
  {
    id: 'pricing',
    builderKey: 'pricing',
    displayName: 'Pricing Details',
    description: 'Itemized costing items table, taxes, discounts, and grand totals.',
    icon: 'bi-currency-rupee',
    editorType: 'pricing',
    defaultContent: {
      items: [],
      subtotal: 0,
      discount: 0,
      amount: 0
    },
    enabledByDefault: true
  },
  {
    id: 'payment_terms',
    builderKey: 'payment_terms',
    displayName: 'Payment Terms',
    description: 'Configure milestone percentage disbursements (Advance, Development, Launch).',
    icon: 'bi-credit-card',
    editorType: 'payment_terms',
    defaultContent: { advance: 50, development: 30, deployment: 20 },
    enabledByDefault: true
  },
  {
    id: 'why_us',
    builderKey: 'why_choose_us',
    displayName: 'Why Choose Us',
    description: 'Identify strengths and specialized focus points.',
    icon: 'bi-award',
    editorType: 'richtext',
    defaultContent: `<p>• <b>Experienced Team:</b> Senior engineers with expertise in modern frameworks.</p><p>• <b>SEO Centric Coding:</b> Fast loading speeds and standards-compliant markups.</p><p>• <b>Pixel-Perfect UIs:</b> Premium design aesthetics that reflect your brand identity.</p><p>• <b>Post-launch Support:</b> Dedicated support windows for seamless maintenance.</p>`,
    enabledByDefault: true
  },
  {
    id: 'terms',
    builderKey: 'terms_conditions',
    displayName: 'Terms & Conditions',
    description: 'Specify terms of validity, intellectual property rights, and support.',
    icon: 'bi-shield-check',
    editorType: 'richtext',
    defaultContent: `<p>1. <b>Validity:</b> This proposal remains valid for 30 days from issuance.</p><p>2. <b>Scope Change:</b> Features outside this specification will require a scope change request.</p><p>3. <b>Support:</b> Support is provided on business days between 9:00 AM and 6:00 PM IST.</p><p>4. <b>IP Ownership:</b> Intellectual property rights transfer upon final balance clearance.</p>`,
    enabledByDefault: true
  },
  {
    id: 'thank_you',
    builderKey: 'thank_you',
    displayName: 'Thank You',
    description: 'Sign-off card featuring contact details and message.',
    icon: 'bi-hand-thumbs-up',
    editorType: 'thank_you',
    defaultContent: {
      message: 'Thank you for the opportunity to work with you. We look forward to a successful collaboration!',
      contact: 'info@grehasoft.com | +91 89215 40183'
    },
    enabledByDefault: true
  }
];

export const contentLibrary = [
  { name: 'Company Profile', text: `<p>Grehasoft Smart IT Solutions is an enterprise software development agency based in Kochi, Infopark.</p><p>We provide comprehensive mobile app, web application, branding, and digital marketing services to clients worldwide.</p>` },
  { name: 'Technology Stack', text: `<p>We build our applications using a robust state-of-the-art stack: Django Rest Framework (Python) for secure backend APIs, React (TypeScript) and Vite for responsive frontends, PostgreSQL/MySQL/SQLite for databases, and AWS/Azure/DigitalOcean for scalable cloud hosting.</p>` },
  { name: 'Why Choose Grehasoft', text: `<p>• <b>Experienced Team:</b> Senior engineers with expertise in modern frameworks.</p><p>• <b>SEO Centric Coding:</b> Fast loading speeds and standards-compliant markups.</p><p>• <b>Pixel-Perfect UIs:</b> Premium design aesthetics that reflect your brand identity.</p><p>• <b>Post-launch Support:</b> Dedicated support windows for seamless maintenance.</p>` },
  { name: 'Terms & Conditions', text: `<p>1. <b>Validity:</b> This proposal remains valid for 30 days from issuance.</p><p>2. <b>Scope Change:</b> Features outside this specification will require a scope change request.</p><p>3. <b>Support:</b> Support is provided on business days between 9:00 AM and 6:00 PM IST.</p><p>4. <b>IP Ownership:</b> Intellectual property rights transfer upon final balance clearance.</p>` },
  { name: 'Payment Terms', text: `<p>The payment for the project is scheduled as follows:<br/>• 50% Advance: payable immediately to kick off the development.<br/>• 30% Development Milestone: payable upon completion of core modules.<br/>• 20% Final Deployment: payable prior to launching the workspace.</p>` }
];

export const colorPresets = [
  { name: 'Blue', primary: '#0753F6', secondary: '#6B7280' },
  { name: 'Slate', primary: '#0f172a', secondary: '#3b82f6' },
  { name: 'Green', primary: '#047857', secondary: '#10b981' },
  { name: 'Purple', primary: '#701a75', secondary: '#a21caf' },
  { name: 'Dark', primary: '#1e293b', secondary: '#475569' }
];
