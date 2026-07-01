import React, { useRef } from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';
import { SECTION_CONFIG } from './SECTION_CONFIG';

interface RichTextEditorProps {
  sectionId: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ sectionId }) => {
  const { builderConfig, setBuilderConfig, setUnsavedChanges } = useProposalBuilderContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const section = SECTION_CONFIG.find((s) => s.id === sectionId);
  const builderKey = section?.builderKey || sectionId;
  const value = builderConfig[builderKey] || '';

  const insertTag = (tag: string, closeTag?: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    
    let replacement = '';
    if (tag === 'bullet') {
      replacement = `\n• ${selected || 'Bullet item'}`;
    } else {
      replacement = `<${tag}>${selected || ''}</${closeTag || tag}>`;
    }
    
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    
    setBuilderConfig((prev) => ({
      ...prev,
      [builderKey]: newVal
    }));
    setUnsavedChanges(true);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selected.length);
    }, 50);
  };

  return (
    <div className="mb-3 text-start">
      <div className="d-flex justify-content-between align-items-center mb-1 bg-light border p-2 rounded-top">
        <label className="form-label smaller fw-bold mb-0 text-dark">
          {section?.displayName || 'Editor'} Content
        </label>
        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => insertTag('b')} title="Bold"><b>B</b></button>
          <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => insertTag('i')} title="Italic"><i>I</i></button>
          <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => insertTag('p')} title="Paragraph">P</button>
          <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => insertTag('bullet')} title="Bullet Point">• List</button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="form-control form-control-sm rounded-0 rounded-bottom font-monospace text-dark"
        style={{ fontSize: '13px', borderTop: 'none', backgroundColor: '#fff' }}
        rows={6}
        value={value}
        onChange={(e) => {
          setBuilderConfig((prev) => ({ ...prev, [builderKey]: e.target.value }));
          setUnsavedChanges(true);
        }}
        placeholder={`Enter ${section?.displayName || 'content'} html / text...`}
      />
    </div>
  );
};

export default RichTextEditor;
