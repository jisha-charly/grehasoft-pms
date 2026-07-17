import React from 'react';

export const EDITOR_REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  cover: React.lazy(() => import('./CoverEditor')),
  richtext: React.lazy(() => import('./RichTextEditor')),
  pricing: React.lazy(() => import('./PricingEditor')),
  timeline: React.lazy(() => import('./TimelineEditor')),
  features: React.lazy(() => import('./FeaturesEditor')),
  deliverables: React.lazy(() => import('./DeliverablesEditor')),
  payment_terms: React.lazy(() => import('./PaymentTermsEditor')),
  thank_you: React.lazy(() => import('./ThankYouEditor')),
  fixed: React.lazy(() => import('./FixedSectionEditor'))
};
