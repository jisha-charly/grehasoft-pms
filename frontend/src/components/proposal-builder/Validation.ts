import { BuilderConfig } from './BuilderSchema';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateBuilderConfig = (config: BuilderConfig, proposalTitle: string): Record<string, string> => {
  const errors: Record<string, string> = {};

  // 1. Validate Proposal Title
  if (!proposalTitle || proposalTitle.trim().length < 3) {
    errors.title = "Proposal title must be at least 3 characters.";
  }

  // 2. Validate Cover Page Metadata
  if (config.sections.includes('cover')) {
    if (!config.cover_page?.title || config.cover_page.title.trim().length === 0) {
      errors.cover_page_title = "Cover Page Title is required when Cover is enabled.";
    }
    if (!config.cover_page?.preparedForName || config.cover_page.preparedForName.trim().length === 0) {
      errors.cover_page_preparedForName = "Prepared For Name is required.";
    }
  }

  // 3. Validate Pricing Totals
  if (config.sections.includes('pricing')) {
    const items = config.pricing?.items || [];
    items.forEach((item, idx) => {
      if (!item.service || item.service.trim().length === 0) {
        errors[`pricing_item_${idx}_service`] = `Item #${idx + 1} Service Name is required.`;
      }
      if (item.cost !== undefined && item.cost < 0) {
        errors[`pricing_item_${idx}_cost`] = `Item #${idx + 1} Cost cannot be negative.`;
      }
    });

    if (config.pricing?.discount && config.pricing.discount < 0) {
      errors.pricing_discount = "Discount cannot be negative.";
    }
    if (config.pricing?.discount && config.pricing.discount > (config.pricing.subtotal || 0)) {
      errors.pricing_discount = "Discount cannot be greater than the subtotal.";
    }
  }

  // 4. Validate Payment Milestones Percentages
  if (config.sections.includes('payment_terms')) {
    const pt = config.payment_terms || { advance: 0, development: 0, deployment: 0 };
    const sum = (Number(pt.advance) || 0) + (Number(pt.development) || 0) + (Number(pt.deployment) || 0);
    if (sum !== 100) {
      errors.payment_terms = `Payment milestone percentages must sum to exactly 100% (currently ${sum}%).`;
    }
  }

  return errors;
};
