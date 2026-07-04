import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { BuilderConfig } from './BuilderSchema';
import { validateBuilderConfig } from './Validation';
import axiosInstance from '../../api/axiosInstance';
import { generateProposalPDF } from '../../utils/pdfGenerator';
import { useAlert } from '../../hooks/useAlert';
import { AlertVariant } from '../../types/alert';

interface ProposalBuilderContextProps {
  proposal: any;
  builderConfig: BuilderConfig;
  setBuilderConfig: React.Dispatch<React.SetStateAction<BuilderConfig>>;
  activeSections: string[];
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string | null) => void;
  previewLoading: boolean;
  previewUrl: string;
  unsavedChanges: boolean;
  setUnsavedChanges: (val: boolean) => void;
  validationErrors: Record<string, string>;
  saveStatus: 'idle' | 'saving' | 'saved';
  updateSection: (key: string, data: any) => void;
  enableSection: (id: string) => void;
  disableSection: (id: string) => void;
  reorderSections: (index: number, direction: 'up' | 'down') => void;
  saveDraft: (silent?: boolean) => Promise<boolean>;
  refreshPreview: () => Promise<void>;
  restoreDefaults: () => void;
  insertLibraryContent: (text: string, targetField: string) => void;
  downloadPDF: () => void;
  builderReady: boolean;
}

const ProposalBuilderContext = createContext<ProposalBuilderContextProps | undefined>(undefined);

export const useProposalBuilderContext = () => {
  const context = useContext(ProposalBuilderContext);
  if (!context) {
    throw new Error('useProposalBuilderContext must be used within a ProposalBuilderProvider');
  }
  return context;
};

interface ProviderProps {
  proposal: any;
  initialConfig: BuilderConfig;
  onClose: () => void;
  onUpdateSuccess: () => void;
  children: React.ReactNode;
}

export const ProposalBuilderProvider: React.FC<ProviderProps> = ({
  proposal,
  initialConfig,
  onClose,
  onUpdateSuccess,
  children
}) => {
  const { showAlert } = useAlert();
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig>(initialConfig);
  const [builderReady, setBuilderReady] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialConfig.sections.length > 0 ? initialConfig.sections[0] : null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Trigger Refresh Preview initially
  useEffect(() => {
    refreshPreview(initialConfig);
  }, []);

  // Clean up Object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const updateSection = (key: string, data: any) => {
    setBuilderConfig((prev) => ({
      ...prev,
      [key]: data
    }));
    setUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const enableSection = (id: string) => {
    setBuilderConfig((prev) => {
      if (prev.sections.includes(id)) return prev;
      return {
        ...prev,
        sections: [...prev.sections, id]
      };
    });
    setUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const disableSection = (id: string) => {
    setBuilderConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s !== id)
    }));
    setUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const reorderSections = (index: number, direction: 'up' | 'down') => {
    setBuilderConfig((prev) => {
      const list = [...prev.sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return {
        ...prev,
        sections: list
      };
    });
    setUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const saveDraft = async (silent = false): Promise<boolean> => {
    const errors = validateBuilderConfig(builderConfig, proposal.title);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (!silent) {
        showAlert({
          variant: AlertVariant.WARNING,
          message: "Please fix validation errors before saving."
        });
      }
      return false;
    }

    setSaveStatus('saving');
    try {
      const pricingItems = builderConfig.pricing?.items || [];
      const calculatedSubtotal = pricingItems.reduce(
        (sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate || item.cost) || 0)),
        0
      );
      const calculatedAmount = calculatedSubtotal - (builderConfig.pricing?.discount || 0);

      const payload = {
        lead: proposal.lead || proposal.leadId,
        title: proposal.title,
        description: proposal.description,
        project_overview: builderConfig.project_overview || "",
        items: pricingItems.map((it) => ({
          service: it.service,
          description: it.description,
          cost: (Number(it.qty) || 1) * (Number(it.rate || it.cost) || 0)
        })),
        subtotal: calculatedSubtotal,
        discount: builderConfig.pricing?.discount || 0,
        amount: calculatedAmount,
        status: proposal.status,
        builder_config: {
          ...builderConfig,
          pricing: {
            ...builderConfig.pricing,
            items: pricingItems,
            subtotal: calculatedSubtotal,
            discount: builderConfig.pricing?.discount || 0,
            amount: calculatedAmount
          }
        }
      };

      await axiosInstance.put(`/proposals/${proposal.id}/`, payload);
      setUnsavedChanges(false);
      setSaveStatus('saved');
      onUpdateSuccess();
      return true;
    } catch (err) {
      console.error("Save builder draft error:", err);
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to save draft."
      });
      setSaveStatus('idle');
      return false;
    }
  };

  const refreshPreview = async (currentConfig = builderConfig) => {
    setPreviewLoading(true);
    try {
      const payload = {
        id: proposal.id,
        title: proposal.title || "Proposal",
        builder_config: currentConfig
      };

      const res = await axiosInstance.post("/proposals/preview_pdf/", payload, {
        responseType: "blob"
      });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview render failed:", err);
    } finally {
      setPreviewLoading(false);
      // Mark builder as ready after initial preview load
      setBuilderReady(true);
    }
  };

  const restoreDefaults = () => {
    setBuilderConfig((prev) => ({
      ...initialConfig,
      pricing: prev.pricing // preserve pricing rows
    }));
    setUnsavedChanges(true);
  };

  const insertLibraryContent = (text: string, targetField: string) => {
    setBuilderConfig((prev: any) => ({
      ...prev,
      [targetField]: (prev[targetField] || "") + text
    }));
    setUnsavedChanges(true);
  };

  const downloadPDF = () => {
    generateProposalPDF({
      ...proposal,
      builder_config: builderConfig
    });
  };

  return (
    <ProposalBuilderContext.Provider
      value={useMemo(() => ({
        proposal,
        builderConfig,
        setBuilderConfig,
        activeSections: builderConfig.sections,
        selectedSectionId,
        setSelectedSectionId,
        previewLoading,
        previewUrl,
        unsavedChanges,
        setUnsavedChanges,
        validationErrors,
        saveStatus,
        updateSection,
        enableSection,
        disableSection,
        reorderSections,
        saveDraft,
        refreshPreview,
        restoreDefaults,
        insertLibraryContent,
        downloadPDF,
        builderReady
      }), [
        proposal,
        builderConfig,
        selectedSectionId,
        previewLoading,
        previewUrl,
        unsavedChanges,
        validationErrors,
        saveStatus,
        builderReady
      ])}
    >
      {children}
    </ProposalBuilderContext.Provider>
  );
};
