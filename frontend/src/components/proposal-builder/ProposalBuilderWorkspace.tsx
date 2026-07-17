import React, { useState, Suspense, useMemo } from 'react';
import { useProposalBuilder } from './ProposalBuilderHooks';
import ConfirmModal from '../ConfirmModal';
import { SECTION_CONFIG, contentLibrary, colorPresets } from './SECTION_CONFIG';
import { EDITOR_REGISTRY } from './EDITOR_REGISTRY';
import ErrorBoundary from './ErrorBoundary';

interface ProposalBuilderWorkspaceProps {
  onClose: () => void;
}

// Memoized Preview Pane to prevent iframe flickering on every keypress
const PreviewPane: React.FC<{ url: string; loading: boolean; onRefresh: () => void }> = React.memo(({ url, loading, onRefresh }) => {
  return (
    <div className="bg-light border-start d-flex flex-column h-100" style={{ width: '420px', overflowY: 'hidden' }}>
      <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0 text-uppercase text-secondary small">Live PDF Preview</h6>
        <button type="button" className="btn btn-xs btn-secondary py-0 px-2 text-dark" onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </div>
      
      <div className="flex-grow-1 bg-secondary position-relative">
        {loading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 10 }}>
            <div className="spinner-border text-white" role="status" />
          </div>
        )}
        {url ? (
          <iframe src={`${url}#toolbar=0&navpanes=0`} width="100%" height="100%" className="border-0 bg-white" title="PDF Preview" />
        ) : (
          <div className="text-white text-center p-5 mt-5">
            <i className="bi bi-file-earmark-pdf fs-1 mb-2"></i>
            <p>No preview generated yet.<br/>Click "Refresh Preview" to build.</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Sidebar styling properties pane
const Sidebar: React.FC = React.memo(() => {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const {
    builderConfig,
    setBuilderConfig,
    setUnsavedChanges,
    restoreDefaults,
    activeSections,
    enableSection,
    disableSection,
    reorderSections
  } = useProposalBuilder();

  const applyThemePreset = (presetName: string) => {
    let presetColors = { primary: '#0753F6', secondary: '#6B7280', accent: '#1AB728', text: '#1F2937', tableHeader: '#0753F6', footer: '#6B7280', link: '#0753F6', bg_card: '#f8fafc' };
    if (presetName === 'modern') presetColors = { primary: '#0f172a', secondary: '#3b82f6', accent: '#10b981', text: '#1f2937', tableHeader: '#0f172a', footer: '#475569', link: '#3b82f6', bg_card: '#f1f5f9' };
    else if (presetName === 'enterprise') presetColors = { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#047857', text: '#1f2937', tableHeader: '#1e3a8a', footer: '#1e3a8a', link: '#3b82f6', bg_card: '#eff6ff' };
    else if (presetName === 'minimal') presetColors = { primary: '#000000', secondary: '#4b5563', accent: '#1f2937', text: '#1f2937', tableHeader: '#000000', footer: '#4b5563', link: '#000000', bg_card: '#ffffff' };
    else if (presetName === 'classic') presetColors = { primary: '#701a75', secondary: '#a21caf', accent: '#b5179e', text: '#1f2937', tableHeader: '#701a75', footer: '#a21caf', link: '#b5179e', bg_card: '#fae8ff' };
    
    setBuilderConfig((prev) => ({
      ...prev,
      template: presetName,
      colors: presetColors
    }));
    setUnsavedChanges(true);
  };

  const handleGeometryChange = (field: string, val: number) => {
    setBuilderConfig((prev) => ({
      ...prev,
      layout: {
        ...(prev.layout || { topMargin: 54, bottomMargin: 54, leftMargin: 54, rightMargin: 54, headerHeight: 78, headerSpacing: 15, footerHeight: 45, watermarkSize: 65, watermarkOpacity: 15 }),
        [field]: val
      }
    }));
    setUnsavedChanges(true);
  };

  return (
    <div className="bg-light border-end d-flex flex-column h-100" style={{ width: '320px', overflowY: 'auto' }}>
      <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0 text-uppercase text-secondary small">Properties</h6>
        <button className="btn btn-xs btn-outline-danger py-0 px-2 small" style={{ fontSize: '10px' }} onClick={() => setShowRestoreModal(true)}>
          Reset
        </button>
      </div>

      <div className="accordion accordion-flush" id="styleAccordion">
        {/* ACCORDION: Theme & Colors */}
        <div className="accordion-item bg-light">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed py-2 px-3 fw-bold small text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTheme">
              Colors & Themes
            </button>
          </h2>
          <div id="collapseTheme" className="accordion-collapse collapse" data-bs-parent="#styleAccordion">
            <div className="accordion-body p-3 bg-white border-top">
              <select className="form-select form-select-sm mb-2 text-dark" value={builderConfig.template || 'corporate'} onChange={(e) => applyThemePreset(e.target.value)}>
                <option value="corporate">Corporate (Blue)</option>
                <option value="modern">Modern (Slate)</option>
                <option value="enterprise">Enterprise (Royal)</option>
                <option value="classic">Classic (Magenta)</option>
                <option value="minimal">Minimal (Black)</option>
              </select>
              <div className="row g-2">
                <div className="col-6">
                  <label className="smaller text-muted mb-0">Primary</label>
                  <input type="color" className="form-control form-control-sm p-0 border-0" value={builderConfig.colors?.primary || '#0753F6'} onChange={(e) => {
                    setBuilderConfig((prev) => ({ ...prev, colors: { ...(prev.colors || { primary: '', secondary: '', accent: '', text: '', tableHeader: '', footer: '', link: '', bg_card: '' }), primary: e.target.value } }));
                    setUnsavedChanges(true);
                  }} />
                </div>
                <div className="col-6">
                  <label className="smaller text-muted mb-0">Secondary</label>
                  <input type="color" className="form-control form-control-sm p-0 border-0" value={builderConfig.colors?.secondary || '#6B7280'} onChange={(e) => {
                    setBuilderConfig((prev) => ({ ...prev, colors: { ...(prev.colors || { primary: '', secondary: '', accent: '', text: '', tableHeader: '', footer: '', link: '', bg_card: '' }), secondary: e.target.value } }));
                    setUnsavedChanges(true);
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACCORDION: Layout Geometry */}
        <div className="accordion-item bg-light">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed py-2 px-3 fw-bold small text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMargins">
              Layout & Margins
            </button>
          </h2>
          <div id="collapseMargins" className="accordion-collapse collapse" data-bs-parent="#styleAccordion">
            <div className="accordion-body p-3 bg-white border-top">
              <div className="row g-2">
                <div className="col-6">
                  <label className="smaller text-muted mb-0">Top</label>
                  <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.layout?.topMargin ?? 54} onChange={(e) => handleGeometryChange('topMargin', Number(e.target.value))} />
                </div>
                <div className="col-6">
                  <label className="smaller text-muted mb-0">Bottom</label>
                  <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.layout?.bottomMargin ?? 54} onChange={(e) => handleGeometryChange('bottomMargin', Number(e.target.value))} />
                </div>
                <div className="col-6 mt-1">
                  <label className="smaller text-muted mb-0">Left</label>
                  <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.layout?.leftMargin ?? 54} onChange={(e) => handleGeometryChange('leftMargin', Number(e.target.value))} />
                </div>
                <div className="col-6 mt-1">
                  <label className="smaller text-muted mb-0">Right</label>
                  <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.layout?.rightMargin ?? 54} onChange={(e) => handleGeometryChange('rightMargin', Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACCORDION: Branding Assets */}
        <div className="accordion-item bg-light">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed py-2 px-3 fw-bold small text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBrand">
              Branding Assets
            </button>
          </h2>
          <div id="collapseBrand" className="accordion-collapse collapse" data-bs-parent="#styleAccordion">
            <div className="accordion-body p-3 bg-white border-top">
              <div className="mb-3">
                <div className="form-check form-switch mb-1">
                  <input type="checkbox" className="form-check-input" id="logoSwitch" checked={builderConfig.branding?.logo?.enabled ?? true} onChange={(e) => {
                    setBuilderConfig((prev) => ({ ...prev, branding: { ...(prev.branding || {}), logo: { ...(prev.branding?.logo || { enabled: true, width: 320, position: 'center' }), enabled: e.target.checked } } }));
                    setUnsavedChanges(true);
                  }} />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="logoSwitch">Logo (Header)</label>
                </div>
                {builderConfig.branding?.logo?.enabled !== false && (
                  <div className="mt-1 d-flex gap-2 align-items-center">
                    <img src="/media/logo/grehasoftlogo.png" style={{ maxHeight: '20px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = "/media/grehasoftlogo.png"; }} />
                    <input type="number" className="form-control form-control-sm text-dark" style={{ width: '80px' }} value={builderConfig.branding?.logo?.width || 320} onChange={(e) => {
                      setBuilderConfig((prev) => ({ ...prev, branding: { ...(prev.branding || {}), logo: { ...(prev.branding?.logo || { enabled: true, width: 320, position: 'center' }), width: Number(e.target.value) } } }));
                      setUnsavedChanges(true);
                    }} />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <div className="form-check form-switch mb-1">
                  <input type="checkbox" className="form-check-input" id="wmSwitch" checked={builderConfig.branding?.watermark?.enabled ?? true} onChange={(e) => {
                    setBuilderConfig((prev) => ({ ...prev, branding: { ...(prev.branding || {}), watermark: { ...(prev.branding?.watermark || { enabled: true, opacity: 15, size: 65 }), enabled: e.target.checked } } }));
                    setUnsavedChanges(true);
                  }} />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="wmSwitch">Watermark</label>
                </div>
                {builderConfig.branding?.watermark?.enabled !== false && (
                  <div className="row g-2 mt-1">
                    <div className="col-6">
                      <label className="smaller text-muted">Opacity</label>
                      <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.branding?.watermark?.opacity || 15} onChange={(e) => {
                        setBuilderConfig((prev) => ({ ...prev, branding: { ...(prev.branding || {}), watermark: { ...(prev.branding?.watermark || { enabled: true, opacity: 15, size: 65 }), opacity: Number(e.target.value) } } }));
                        setUnsavedChanges(true);
                      }} />
                    </div>
                    <div className="col-6">
                      <label className="smaller text-muted">Scale</label>
                      <input type="number" className="form-control form-control-sm text-dark" value={builderConfig.branding?.watermark?.size || 65} onChange={(e) => {
                        setBuilderConfig((prev) => ({ ...prev, branding: { ...(prev.branding || {}), watermark: { ...(prev.branding?.watermark || { enabled: true, opacity: 15, size: 65 }), size: Number(e.target.value) } } }));
                        setUnsavedChanges(true);
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS MANAGEMENT LIST */}
      <div className="p-3 border-top mt-auto bg-white flex-grow-1 overflow-auto">
        <h6 className="fw-bold text-uppercase text-secondary small mb-2">Sections Ordering</h6>
        <ul className="list-group list-group-flush border rounded mb-3">
          {activeSections.map((sectionId, idx) => {
            const isFixed = ['additional_charges', 'maintenance_cost', 'terms_conditions'].includes(sectionId);
            return (
              <li key={sectionId} className="list-group-item d-flex justify-content-between align-items-center py-1.5 px-2 bg-white">
                <div className="form-check form-switch mb-0">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    id={`sec-${sectionId}`} 
                    checked={true} 
                    disabled={isFixed}
                    onChange={() => !isFixed && disableSection(sectionId)} 
                  />
                  <label className="form-check-label fw-bold text-dark" htmlFor={`sec-${sectionId}`} style={{ fontSize: '10px' }}>
                    {sectionId.replace('_', ' ').toUpperCase()}
                  </label>
                </div>
                {!isFixed && (
                  <div className="d-flex gap-1">
                    <button type="button" className="btn btn-link p-0 text-secondary" onClick={() => reorderSections(idx, 'up')} disabled={idx === 0}>
                      <i className="bi bi-arrow-up-short fs-6"></i>
                    </button>
                    <button type="button" className="btn btn-link p-0 text-secondary" onClick={() => reorderSections(idx, 'down')} disabled={idx === activeSections.length - 1}>
                      <i className="bi bi-arrow-down-short fs-6"></i>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <h6 className="fw-bold text-uppercase text-secondary small mb-2">Add Sections</h6>
        <div className="d-flex flex-wrap gap-1">
          {SECTION_CONFIG.filter(sec => !activeSections.includes(sec.id)).map(sec => (
            <button key={sec.id} type="button" className="btn btn-xs btn-outline-primary py-0.5 px-1.5 text-dark small" style={{ fontSize: '10px' }} onClick={() => enableSection(sec.id)}>
              + {sec.displayName}
            </button>
          ))}
        </div>
        <ConfirmModal
          isOpen={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          onConfirm={() => {
            restoreDefaults();
            setShowRestoreModal(false);
          }}
          title="Restore Defaults"
          message="Are you sure you want to restore the entire workspace to fallback configuration?"
          confirmText="Restore"
          variant="warning"
        />
      </div>
    </div>
  );
});

// Library Drawer Panel
const ContentLibrary: React.FC = React.memo(() => {
  const { insertLibraryContent } = useProposalBuilder();

  return (
    <div className="p-3 border-bottom bg-white" style={{ maxHeight: '140px', overflowY: 'auto' }}>
      <div className="d-flex flex-column gap-1">
        {contentLibrary.map(lib => (
          <div key={lib.name} className="d-flex justify-content-between align-items-center border p-1 rounded bg-light">
            <span className="small font-monospace" style={{ fontSize: '11px' }}>{lib.name}</span>
            <div className="btn-group btn-group-sm">
              <button type="button" className="btn btn-xs btn-outline-primary py-0 px-2 text-dark" onClick={() => insertLibraryContent(lib.text, 'website_structure')}>Insert</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const ProposalBuilderWorkspace: React.FC<ProposalBuilderWorkspaceProps> = ({ onClose }) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const {
    proposal,
    activeSections,
    previewLoading,
    previewUrl,
    unsavedChanges,
    saveStatus,
    saveDraft,
    refreshPreview,
    downloadPDF,
    builderReady
  } = useProposalBuilder(true); // Enable debounced autosave

  const [builderSearch, setBuilderSearch] = useState('');

  const matchesSearch = (sectionId: string) => {
    if (!builderSearch) return true;
    return sectionId.replace('_', ' ').toLowerCase().includes(builderSearch.toLowerCase());
  };

  // Show loading spinner until builder is ready (preview generated)
  if (!builderReady) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const getSaveStatusLabel = () => {
    if (saveStatus === 'saving') return <span className="badge bg-info text-white animate__animated animate__pulse animate__infinite">Saving...</span>;
    if (saveStatus === 'saved') return <span className="badge bg-success text-white">Draft Saved</span>;
    if (unsavedChanges) return <span className="badge bg-warning text-dark">Unsaved Changes</span>;
    return null;
  };

  return (
    <div className="proposal-builder-container bg-white d-flex flex-column" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1060 }}>
      {/* TOP TOOLBAR */}
      <div className="d-flex justify-content-between align-items-center bg-dark text-white py-2 px-4 shadow sticky-top">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0 fw-bold">{proposal.title}</h5>
          <span className="badge bg-primary">ReportLab PDF System</span>
          {getSaveStatusLabel()}
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-light" onClick={() => refreshPreview()} disabled={previewLoading}>
            {previewLoading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-arrow-clockwise me-1"></i>}
            Refresh Preview
          </button>
          <button className="btn btn-sm btn-success" onClick={() => saveDraft()} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-save me-1"></i>}
            Save Draft
          </button>
          <button className="btn btn-sm btn-outline-info" onClick={downloadPDF}>
            <i className="bi bi-download me-1"></i>Download PDF
          </button>
          <button className="btn btn-sm btn-danger ms-2" onClick={() => {
            if (unsavedChanges) {
              setShowExitModal(true);
            } else {
              onClose();
            }
          }}>
            <i className="bi bi-x-lg me-1"></i>Exit
          </button>
        </div>
      </div>

      {/* WORKSPACE PANELS */}
      <div className="d-flex flex-grow-1 overflow-hidden text-start">
        
        {/* LEFT SIDEBAR */}
        <Sidebar />

        {/* CENTER PANEL: Content Editors */}
        <div className="flex-grow-1 p-4 bg-light border-end" style={{ overflowY: 'auto' }}>
          <div className="card shadow-sm border-0 p-3 bg-white mb-4 d-flex justify-content-between align-items-center flex-row">
            <div className="w-50">
              <h5 className="fw-bold text-dark mb-0">Dynamic Section Content</h5>
              <p className="text-secondary small mb-0">Edit active proposal pages text, tables and outlines.</p>
            </div>
            <div className="w-50 d-flex justify-content-end align-items-center">
              <div className="input-group input-group-sm w-75">
                <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control border-start-0 text-dark bg-white" placeholder="Search sections content..." value={builderSearch} onChange={(e) => setBuilderSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {activeSections.length === 0 ? (
            <div className="card shadow-sm border-0 p-5 text-center bg-white rounded-3">
              <i className="bi bi-folder-x fs-1 text-muted mb-3"></i>
              <h5 className="fw-bold text-dark">No sections are currently enabled</h5>
              <p className="text-secondary small mb-0">Enable sections from the left sidebar to start building your proposal.</p>
            </div>
          ) : (
            activeSections.filter(matchesSearch).map((sectionId) => {
              const sec = SECTION_CONFIG.find(s => s.id === sectionId);
              if (!sec) return null;

              const LazyEditor = EDITOR_REGISTRY[sec.editorType];

              return (
                <ErrorBoundary key={sectionId}>
                  <div className="card shadow-sm border-0 bg-white rounded-3 overflow-hidden mb-4">
                    <div className="card-header bg-white border-bottom py-2.5 px-3">
                      <h6 className="fw-bold mb-0 text-primary d-flex align-items-center">
                        <i className={`bi ${sec.icon} me-2`}></i>{sec.displayName}
                      </h6>
                    </div>
                    
                    <div className="card-body p-3">
                      <Suspense fallback={
                        <div className="d-flex align-items-center gap-2 p-3 text-secondary">
                          <span className="spinner-border spinner-border-sm" role="status" />
                          <span className="small">Loading {sec.displayName} editor...</span>
                        </div>
                      }>
                        <LazyEditor sectionId={sectionId} />
                      </Suspense>
                    </div>
                  </div>
                </ErrorBoundary>
              );
            })
          )}
        </div>

        {/* RIGHT SIDEBAR: Content Library & PDF Live Preview */}
        <div className="d-flex flex-column h-100" style={{ width: '420px' }}>
          <div className="bg-light border-start border-bottom">
            <div className="p-3 border-bottom bg-white">
              <h6 className="fw-bold mb-0 text-uppercase text-secondary small">Company Content Library</h6>
            </div>
            <ContentLibrary />
          </div>
          <div className="flex-grow-1">
            <PreviewPane url={previewUrl} loading={previewLoading} onRefresh={() => refreshPreview()} />
          </div>
        </div>
        <ConfirmModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          onConfirm={onClose}
          title="Unsaved Changes"
          message="You have unsaved changes. Exit anyway?"
          confirmText="Exit Anyway"
          variant="warning"
        />
      </div>
    </div>
  );
};

export default ProposalBuilderWorkspace;
