import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const CoverEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges, validationErrors } = useProposalBuilderContext();
  const cover = builderConfig.cover_page || {};

  const handleFieldChange = (field: string, value: any) => {
    setBuilderConfig((prev) => ({
      ...prev,
      cover_page: {
        ...(prev.cover_page || {}),
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="row g-3 text-start">
      <div className="col-12">
        <label className="form-label small fw-bold text-dark mb-1">Cover Title</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="e.g. Enterprise Website Redesign Proposal"
        />
        {validationErrors.cover_page_title && (
          <div className="text-danger small mt-1">{validationErrors.cover_page_title}</div>
        )}
      </div>

      <div className="col-md-8">
        <label className="form-label small fw-bold text-dark mb-1">Subtitle</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.subtitle || ''}
          onChange={(e) => handleFieldChange('subtitle', e.target.value)}
        />
      </div>

      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="showSubtitleCheck"
            checked={cover.showSubtitle ?? true}
            onChange={(e) => handleFieldChange('showSubtitle', e.target.checked)}
          />
          <label className="form-check-label small fw-bold text-dark" htmlFor="showSubtitleCheck">
            Show Subtitle
          </label>
        </div>
      </div>

      <div className="col-md-6">
        <label className="form-label small fw-bold text-dark mb-1">Prepared For Company</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.preparedForCompany || ''}
          onChange={(e) => handleFieldChange('preparedForCompany', e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small fw-bold text-dark mb-1">Prepared For Contact Name</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.preparedForName || ''}
          onChange={(e) => handleFieldChange('preparedForName', e.target.value)}
        />
        {validationErrors.cover_page_preparedForName && (
          <div className="text-danger small mt-1">{validationErrors.cover_page_preparedForName}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label small fw-bold text-dark mb-1">Prepared By Company</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.preparedByCompany || ''}
          onChange={(e) => handleFieldChange('preparedByCompany', e.target.value)}
        />
      </div>

      <div className="col-md-6">
        <label className="form-label small fw-bold text-dark mb-1">Prepared By Address</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.preparedByAddress || ''}
          onChange={(e) => handleFieldChange('preparedByAddress', e.target.value)}
        />
      </div>

      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Proposal ID</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.proposalId || ''}
          onChange={(e) => handleFieldChange('proposalId', e.target.value)}
        />
      </div>

      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Proposal Date</label>
        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control text-dark bg-white"
            value={cover.proposalDate || ''}
            onChange={(e) => handleFieldChange('proposalDate', e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => handleFieldChange('proposalDate', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}
            title="Set to Today"
          >
            Today
          </button>
        </div>
      </div>

      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Place</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={cover.place || ''}
          onChange={(e) => handleFieldChange('place', e.target.value)}
        />
      </div>
    </div>
  );
};

export default CoverEditor;
