import React, { useEffect, useState } from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

interface MilestoneItem {
  phase: string;
  duration: string;
  desc: string;
}

const TimelineEditor: React.FC = () => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges } = useProposalBuilderContext();
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);

  // Parse HTML string to array on mount
  useEffect(() => {
    const html = builderConfig.timeline || '';
    const match = html.match(/<!--JSON:(.*?)-->/);
    if (match && match[1]) {
      try {
        setMilestones(JSON.parse(match[1]));
      } catch (e) {
        setMilestones([]);
      }
    } else {
      // Fallback: parse default string
      setMilestones([
        { phase: 'Phase 1: Design', duration: '2 Weeks', desc: 'Concept layout mockups and UI theme signoff.' },
        { phase: 'Phase 2: Development', duration: '3 Weeks', desc: 'Frontend construction and backend REST APIs.' }
      ]);
    }
  }, []);

  const syncTimeline = (list: MilestoneItem[]) => {
    setMilestones(list);
    // Serialize to standard HTML and append JSON backing metadata inside HTML comments
    let htmlContent = '<font size="9"><table border="1" cellpadding="5">';
    htmlContent += '<tr><td><b>Milestone / Phase</b></td><td><b>Duration</b></td><td><b>Scope Details</b></td></tr>';
    list.forEach((m) => {
      htmlContent += `<tr><td><b>${m.phase}</b></td><td>${m.duration}</td><td>${m.desc}</td></tr>`;
    });
    htmlContent += '</table></font>';
    
    // Save both the generated HTML and the serialized JSON array in comment
    const saveValue = `${htmlContent}<!--JSON:${JSON.stringify(list)}-->`;
    
    setBuilderConfig((prev) => ({
      ...prev,
      timeline: saveValue
    }));
    setUnsavedChanges(true);
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    const list = [...milestones];
    list[index] = { ...list[index], [field]: value };
    syncTimeline(list);
  };

  const handleAddMilestone = () => {
    const list = [...milestones, { phase: '', duration: '', desc: '' }];
    syncTimeline(list);
  };

  const handleRemoveMilestone = (index: number) => {
    const list = milestones.filter((_, i) => i !== index);
    syncTimeline(list);
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    const list = [...milestones];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    syncTimeline(list);
  };

  return (
    <div className="text-start">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label small fw-bold text-dark mb-0">Project Milestones</label>
        <button type="button" className="btn btn-xs btn-outline-primary py-1 text-dark" onClick={handleAddMilestone}>
          + Add Phase
        </button>
      </div>

      {milestones.map((m, idx) => (
        <div key={idx} className="border p-2 rounded mb-2 bg-light position-relative">
          <div className="position-absolute d-flex gap-1" style={{ top: '4px', right: '4px' }}>
            <button type="button" className="btn btn-sm btn-link text-secondary p-0" onClick={() => handleMoveMilestone(idx, 'up')} disabled={idx === 0}>
              <i className="bi bi-arrow-up"></i>
            </button>
            <button type="button" className="btn btn-sm btn-link text-secondary p-0" onClick={() => handleMoveMilestone(idx, 'down')} disabled={idx === milestones.length - 1}>
              <i className="bi bi-arrow-down"></i>
            </button>
            <button type="button" className="btn btn-sm text-danger p-0 ms-1" onClick={() => handleRemoveMilestone(idx)}>
              <i className="bi bi-trash"></i>
            </button>
          </div>

          <div className="row g-2 mt-1">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control form-control-sm text-dark bg-white fw-bold"
                placeholder="Phase Title"
                value={m.phase || ''}
                onChange={(e) => handleMilestoneChange(idx, 'phase', e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm text-dark bg-white"
                placeholder="Duration (e.g. 2 Weeks)"
                value={m.duration || ''}
                onChange={(e) => handleMilestoneChange(idx, 'duration', e.target.value)}
              />
            </div>
            <div className="col-12">
              <textarea
                className="form-control form-control-sm text-dark bg-white"
                rows={2}
                placeholder="Phase Scope / Details"
                value={m.desc || ''}
                onChange={(e) => handleMilestoneChange(idx, 'desc', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineEditor;
