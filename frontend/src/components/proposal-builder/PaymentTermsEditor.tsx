import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const PaymentTermsEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges, validationErrors } = useProposalBuilderContext();
  const pt = builderConfig.payment_terms || { advance: 50, development: 30, deployment: 20 };

  const handlePercentageChange = (field: string, val: number) => {
    setBuilderConfig((prev) => ({
      ...prev,
      payment_terms: {
        ...(prev.payment_terms || {}),
        [field]: val
      }
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="text-start">
      <label className="form-label small fw-bold text-dark mb-2">Payment Milestones (%)</label>
      <div className="row g-3">
        <div className="col-4">
          <label className="smaller text-muted mb-0">Advance (%)</label>
          <input
            type="number"
            className="form-control form-control-sm text-dark bg-white"
            value={pt.advance ?? 50}
            onChange={(e) => handlePercentageChange('advance', Number(e.target.value))}
          />
        </div>
        <div className="col-4">
          <label className="smaller text-muted mb-0">Development (%)</label>
          <input
            type="number"
            className="form-control form-control-sm text-dark bg-white"
            value={pt.development ?? 30}
            onChange={(e) => handlePercentageChange('development', Number(e.target.value))}
          />
        </div>
        <div className="col-4">
          <label className="smaller text-muted mb-0">Deployment (%)</label>
          <input
            type="number"
            className="form-control form-control-sm text-dark bg-white"
            value={pt.deployment ?? 20}
            onChange={(e) => handlePercentageChange('deployment', Number(e.target.value))}
          />
        </div>
      </div>
      {validationErrors.payment_terms && (
        <div className="text-danger small mt-2">{validationErrors.payment_terms}</div>
      )}
    </div>
  );
};

export default PaymentTermsEditor;
