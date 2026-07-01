import React from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

const DeliverablesEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges } = useProposalBuilderContext();
  const deliverables = builderConfig.deliverables || [];

  const handleDeliverableChange = (index: number, field: string, value: string) => {
    const list = [...deliverables];
    list[index] = {
      ...list[index],
      [field]: value
    };
    setBuilderConfig((prev) => ({
      ...prev,
      deliverables: list
    }));
    setUnsavedChanges(true);
  };

  const handleAddDeliverable = () => {
    setBuilderConfig((prev) => ({
      ...prev,
      deliverables: [...(prev.deliverables || []), { phase: '', timeline: '', details: '' }]
    }));
    setUnsavedChanges(true);
  };

  const handleRemoveDeliverable = (index: number) => {
    setBuilderConfig((prev) => ({
      ...prev,
      deliverables: (prev.deliverables || []).filter((_, i) => i !== index)
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="text-start">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold text-dark mb-0">Project Deliverables</label>
        <button type="button" className="btn btn-xs btn-outline-primary py-1 text-dark" onClick={handleAddDeliverable}>
          + Add Milestone
        </button>
      </div>

      <table className="table table-sm table-bordered mb-0 align-middle">
        <thead>
          <tr className="table-light smaller">
            <th>Phase</th>
            <th style={{ width: '100px' }}>Timeline</th>
            <th>Details / Scope Description</th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {deliverables.map((deliv, dIdx) => (
            <tr key={dIdx}>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 bg-transparent text-dark fw-bold"
                  value={deliv.phase || ''}
                  onChange={(e) => handleDeliverableChange(dIdx, 'phase', e.target.value)}
                  placeholder="Phase name..."
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 bg-transparent text-dark"
                  value={deliv.timeline || ''}
                  onChange={(e) => handleDeliverableChange(dIdx, 'timeline', e.target.value)}
                  placeholder="e.g. Week 1"
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 bg-transparent text-dark"
                  value={deliv.details || ''}
                  onChange={(e) => handleDeliverableChange(dIdx, 'details', e.target.value)}
                  placeholder="Scope details..."
                />
              </td>
              <td className="text-center">
                <button type="button" className="btn btn-link text-danger p-0" onClick={() => handleRemoveDeliverable(dIdx)}>
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeliverablesEditor;
