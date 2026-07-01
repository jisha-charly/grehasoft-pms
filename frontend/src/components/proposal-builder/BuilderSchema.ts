export interface CoverSection {
  title: string;
  autoTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  preparedForCompany: string;
  preparedForName: string;
  preparedByCompany: string;
  preparedByAddress: string;
  preparedByEmail: string;
  preparedByWebsite: string;
  proposalId: string;
  proposalDate: string;
  place: string;
}

export interface FeatureCard {
  title: string;
  desc: string;
}

export interface DeliverableRow {
  phase: string;
  timeline: string;
  details: string;
}

export interface PricingItem {
  service: string;
  description: string;
  cost: number;
  qty?: number;
  unit?: string;
  rate?: number;
  discount?: number;
  tax?: number;
}

export interface PricingSection {
  items: PricingItem[];
  subtotal: number;
  discount: number;
  amount: number;
}

export interface PaymentTermsSection {
  advance: number;
  development: number;
  deployment: number;
}

export interface ThankYouSection {
  message: string;
  contact: string;
  rep_name?: string;
  rep_phone?: string;
  rep_email?: string;
}

export interface BuilderConfig {
  template: string;
  theme: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    tableHeader: string;
    footer: string;
    link: string;
    bg_card: string;
  };
  typography?: {
    fontFamily: string;
    titleSize: number;
    subtitleSize: number;
    headingSize: number;
    bodySize: number;
    lineHeight: number;
    letterSpacing: number;
    fontWeight: string;
  };
  layout?: {
    topMargin: number;
    bottomMargin: number;
    leftMargin: number;
    rightMargin: number;
    headerHeight: number;
    headerSpacing: number;
    footerHeight: number;
    watermarkSize: number;
    watermarkOpacity: number;
  };
  branding?: {
    logo?: {
      enabled: boolean;
      width: number;
      position: string;
    };
    watermark?: {
      enabled: boolean;
      opacity: number;
      size: number;
    };
    headerBanner?: {
      enabled: boolean;
    };
  };
  sections: string[];
  cover_page: CoverSection;
  cover_letter: string;
  company_profile: string;
  project_overview: string;
  scope_of_work: string;
  features: FeatureCard[];
  deliverables: DeliverableRow[];
  timeline: string;
  pricing: PricingSection;
  payment_terms: PaymentTermsSection;
  why_choose_us: string;
  terms_conditions: string;
  thank_you: ThankYouSection;
  [key: string]: any; // Allow indexing
}
