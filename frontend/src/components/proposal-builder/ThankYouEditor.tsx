import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const ThankYouEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges } = useProposalBuilderContext();
  const thank = builderConfig.thank_you || { message: '', contact: '', rep_name: '', rep_phone: '', rep_email: '' };

  const handleFieldChange = (field: string, value: string) => {
    setBuilderConfig((prev) => ({
      ...prev,
      thank_you: {
        ...(prev.thank_you || {}),
        [field]: value
      }
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="row g-3 text-start">
      <div className="col-md-12">
        <label className="form-label small fw-bold text-dark mb-1">Sign-off Message</label>
        <textarea
          className="form-control form-control-sm text-dark bg-white"
          rows={2}
          value={thank.message || ''}
          onChange={(e) => handleFieldChange('message', e.target.value)}
          placeholder="For any queries or clarifications, please feel free to contact us."
        />
      </div>
      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Representative Name</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={thank.rep_name || ''}
          onChange={(e) => handleFieldChange('rep_name', e.target.value)}
          placeholder="Raji T. Skariah"
        />
      </div>
      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Phone Number(s)</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={thank.rep_phone || ''}
          onChange={(e) => handleFieldChange('rep_phone', e.target.value)}
          placeholder="+91 89215 40183 | +91 98954 80145"
        />
      </div>
      <div className="col-md-4">
        <label className="form-label small fw-bold text-dark mb-1">Email Address(es)</label>
        <input
          type="text"
          className="form-control form-control-sm text-dark bg-white"
          value={thank.rep_email || ''}
          onChange={(e) => handleFieldChange('rep_email', e.target.value)}
          placeholder="info@grehasoft.com | grehasoft@gmail.com"
        />
      </div>
    </div>
  );
};

export default ThankYouEditor;
