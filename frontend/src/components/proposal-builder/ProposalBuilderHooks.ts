import { useEffect } from 'react';
import { useProposalBuilderContext } from './ProposalBuilderContext';

export const useProposalBuilder = (autoSaveEnabled = true) => {
  const context = useProposalBuilderContext();
  const { saveDraft, unsavedChanges, saveStatus } = context;

  // Debounced Auto Save hook
  useEffect(() => {
    if (!autoSaveEnabled || !unsavedChanges || saveStatus === 'saving') return;

    const timer = setTimeout(() => {
      saveDraft(true); // Auto-save silently without showing alert dialogs
    }, 2500); // 2.5s debounce

    return () => clearTimeout(timer);
  }, [unsavedChanges, autoSaveEnabled, saveDraft, saveStatus]);

  return {
    ...context
  };
};

export const useSectionManager = () => {
  const {
    activeSections,
    enableSection,
    disableSection,
    reorderSections
  } = useProposalBuilderContext();

  return {
    activeSections,
    enableSection,
    disableSection,
    reorderSections
  };
};
