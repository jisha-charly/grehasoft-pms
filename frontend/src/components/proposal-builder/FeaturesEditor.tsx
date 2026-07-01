import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const FeaturesEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges } = useProposalBuilderContext();
  const features = builderConfig.features || [];

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const list = [...features];
    list[index] = {
      ...list[index],
      [field]: value
    };
    setBuilderConfig((prev) => ({
      ...prev,
      features: list
    }));
    setUnsavedChanges(true);
  };

  const handleAddFeature = () => {
    setBuilderConfig((prev) => ({
      ...prev,
      features: [...(prev.features || []), { title: '', desc: '' }]
    }));
    setUnsavedChanges(true);
  };

  const handleRemoveFeature = (index: number) => {
    setBuilderConfig((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="text-start">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold text-dark mb-0">Feature Cards</label>
        <button type="button" className="btn btn-xs btn-outline-primary py-1 text-dark" onClick={handleAddFeature}>
          + Add Card
        </button>
      </div>

      {(features || []).map((feat, fIdx) => (
        <div key={fIdx} className="border p-2 rounded mb-2 bg-light position-relative">
          <button
            type="button"
            className="btn btn-sm text-danger position-absolute"
            style={{ top: '4px', right: '4px' }}
            onClick={() => handleRemoveFeature(fIdx)}
          >
            <i className="bi bi-trash"></i>
          </button>
          <div className="mb-1 w-75">
            <input
              type="text"
              className="form-control form-control-sm text-dark bg-white fw-bold"
              placeholder="Feature Title"
              value={feat.title || ''}
              onChange={(e) => handleFeatureChange(fIdx, 'title', e.target.value)}
            />
          </div>
          <textarea
            className="form-control form-control-sm text-dark bg-white"
            rows={2}
            placeholder="Feature Description"
            value={feat.desc || ''}
            onChange={(e) => handleFeatureChange(fIdx, 'desc', e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};

export default FeaturesEditor;
