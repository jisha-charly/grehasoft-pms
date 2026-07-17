import { BuilderConfig } from './BuilderSchema';

export interface SectionDefinition {
  id: string;
  builderKey: string;
  displayName: string;
  description: string;
  icon: string;
  editorType: 'cover' | 'richtext' | 'features' | 'deliverables' | 'pricing' | 'payment_terms' | 'thank_you' | 'fixed';
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
    defaultContent: `<p>Dear Sir/Madam,</p><p>Thank you for considering Grehasoft for your website development needs. As discussed, we have reviewed your requirements and are pleased to submit this proposal for your consideration.</p><p>At Grehasoft, we understand the challenges of finding the right technology partner for branding, website development, digital marketing, and software solutions. Our top priority is client satisfaction, and we are committed to delivering high-quality, scalable, and future-ready solutions using the latest technologies and industry best practices.</p><p>Throughout the project, our experienced team will work closely with you to ensure that every requirement is understood and implemented with precision. We are also committed to providing dedicated support during our working hours, ensuring that your queries and concerns are addressed promptly and professionally.</p><p>Thank you for considering Grehasoft as your technology partner. We look forward to the opportunity to collaborate with you and build a successful long-term business relationship.</p><p>Best Regards,</p><p>Raji T. Skariah<br/>Grehasoft<br/>+91 89215 40 183 | +91 98950 72 145<br/>info@grehasoft.com | grehasoft@gmail.com</p>`,
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
    id: 'website_structure',
    builderKey: 'website_structure',
    displayName: 'Proposed Website Structure & Pages',
    description: 'Render free-form description of pages, hierarchy, and navigation flow.',
    icon: 'bi-window-sidebar',
    editorType: 'richtext',
    defaultContent: '',
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
    id: 'additional_charges',
    builderKey: 'additional_charges',
    displayName: 'Additional Charges',
    description: 'Fixed Additional Charges (Domain, Hosting, SSL).',
    icon: 'bi-patch-plus',
    editorType: 'fixed',
    defaultContent: '',
    enabledByDefault: true
  },
  {
    id: 'maintenance_cost',
    builderKey: 'maintenance_cost',
    displayName: 'Maintenance Cost',
    description: 'Fixed Maintenance Cost plans and hourly rates.',
    icon: 'bi-wrench',
    editorType: 'fixed',
    defaultContent: '',
    enabledByDefault: true
  },
  {
    id: 'terms_conditions',
    builderKey: 'terms_conditions',
    displayName: 'Terms & Conditions',
    description: 'Fixed Terms & Conditions clauses.',
    icon: 'bi-shield-check',
    editorType: 'fixed',
    defaultContent: '',
    enabledByDefault: true
  }
];

export const contentLibrary = [
  { name: 'Technology Stack', text: `<p>We build our applications using a robust state-of-the-art stack: Django Rest Framework (Python) for secure backend APIs, React (TypeScript) and Vite for responsive frontends, PostgreSQL/MySQL/SQLite for databases, and AWS/Azure/DigitalOcean for scalable cloud hosting.</p>` }
];

export const colorPresets = [
  { name: 'Blue', primary: '#0753F6', secondary: '#6B7280' },
  { name: 'Slate', primary: '#0f172a', secondary: '#3b82f6' },
  { name: 'Green', primary: '#047857', secondary: '#10b981' },
  { name: 'Purple', primary: '#701a75', secondary: '#a21caf' },
  { name: 'Dark', primary: '#1e293b', secondary: '#475569' }
];
