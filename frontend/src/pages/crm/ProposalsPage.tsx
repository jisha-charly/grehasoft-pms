import React, { useState, useEffect } from 'react';
import { Proposal, Lead, ProposalItem } from '../../types';
import { generateProposalPDF } from '../../utils/pdfGenerator';
import { useLocation } from "react-router-dom";
import axiosInstance from '../../api/axiosInstance';
import { useCrud } from '../../hooks/useCrud';
import { ProposalBuilderProvider } from '../../components/proposal-builder/ProposalBuilderContext';
import ProposalBuilderWorkspace from '../../components/proposal-builder/ProposalBuilderWorkspace';
import { useAlert } from '../../hooks/useAlert';
import { AlertVariant } from '../../types/alert';
import ConfirmModal from '../../components/ConfirmModal';

interface ProposalsPageProps {
  leads: Lead[];
  setProjects?: (projects: any[]) => void;
  setLeads?: (leads: any[]) => void;
}

// Default Builder configuration structure
const defaultBuilderConfig = {
  template: 'corporate',
  theme: 'blue',
  colors: {
    primary: '#0753F6',
    secondary: '#6B7280',
    accent: '#1AB728',
    text: '#1F2937',
    tableHeader: '#0753F6',
    footer: '#6B7280',
    link: '#0753F6',
    bg_card: '#f8fafc'
  },
  typography: {
    fontFamily: 'Helvetica',
    titleSize: 36,
    subtitleSize: 20,
    headingSize: 16,
    bodySize: 10,
    lineHeight: 14,
    letterSpacing: 0,
    fontWeight: 'normal'
  },
  layout: {
    topMargin: 54,
    bottomMargin: 54,
    leftMargin: 54,
    rightMargin: 54,
    headerHeight: 78,
    headerSpacing: 15,
    footerHeight: 45,
    watermarkSize: 65,
    watermarkOpacity: 15
  },
  branding: {
    logo: { enabled: true, width: 320, position: 'center' },
    watermark: { enabled: true, opacity: 15, size: 65 },
    headerBanner: { enabled: true }
  },
  sections: [
    'cover',
    'cover_letter',
    'company_profile',
    'project_overview',
    'scope',
    'features',
    'deliverables',
    'pricing',
    'payment_terms',
    'why_us',
    'terms',
    'thank_you'
  ],
  cover_page: {
    title: '',
    autoTitle: true,
    subtitle: 'Business Proposal',
    showSubtitle: true,
    preparedForCompany: '',
    preparedForName: '',
    preparedByCompany: 'Grehasoft Smart IT Solutions',
    preparedByAddress: 'Kochi, Kerala',
    preparedByEmail: 'info@grehasoft.com',
    preparedByWebsite: 'www.grehasoft.com',
    proposalId: '',
    proposalDate: '',
    place: 'Kochi'
  },
  cover_letter: `<p>Dear Sir,</p><p>Thank you for considering GrehaSoft for your software development needs. As discussed, we are pleased to submit a proposal for your consideration.</p><p>At GrehaSoft, we prioritize client satisfaction, delivering modern, secure, and SEO friendly solutions designed for scalability.</p><p>Best regards,</p><p><b>Grehasoft Smart IT Solutions</b></p>`,
  company_profile: `<p>Grehasoft Smart IT Solutions is an enterprise software development agency based in Kochi, Infopark.</p><p>We provide comprehensive mobile app, web application, branding, and digital marketing services to clients worldwide.</p>`,
  project_overview: '',
  scope_of_work: '',
  features: [
    { title: 'Device Independence', desc: 'Fully responsive layouts suitable for desktops, tablets, and mobiles.' },
    { title: 'SEO Friendliness', desc: 'Pre-configured SEO URLs, meta fields, and Google Search Console tags.' },
    { title: 'Security & Encryption', desc: 'Pre-coded SSL certificate integration and encrypted user credentials.' }
  ],
  deliverables: [
    { phase: 'Phase 1: Wireframes', timeline: 'Week 1', details: 'Initial layout mockups, user flow, and design review.' },
    { phase: 'Phase 2: Core Development', timeline: 'Week 2-3', details: 'Frontend UI elements, backend database, and REST APIs.' },
    { phase: 'Phase 3: UAT & Launch', timeline: 'Week 4', details: 'Unit testing, client acceptance testing, server deployment.' }
  ],
  timeline: `<p>The estimated delivery timeline is 4-6 weeks upon contract signoff and advance payment. Any change in scope may affect this estimate.</p>`,
  pricing: { items: [] as ProposalItem[], subtotal: 0, discount: 0, amount: 0 },
  payment_terms: { advance: 50, development: 30, deployment: 20 },
  why_choose_us: `<p>• <b>Experienced Team:</b> Senior engineers with expertise in modern frameworks.</p><p>• <b>SEO Centric Coding:</b> Fast loading speeds and standards-compliant markups.</p><p>• <b>Pixel-Perfect UIs:</b> Premium design aesthetics that reflect your brand identity.</p><p>• <b>Post-launch Support:</b> Dedicated support windows for seamless maintenance.</p>`,
  terms_conditions: `<p>1. <b>Validity:</b> This proposal remains valid for 30 days from issuance.</p><p>2. <b>Scope Change:</b> Features outside this specification will require a scope change request.</p><p>3. <b>Support:</b> Support is provided on business days between 9:00 AM and 6:00 PM IST.</p><p>4. <b>IP Ownership:</b> Intellectual property rights transfer upon final balance clearance.</p>`,
  thank_you: {
    message: 'For any queries or clarifications, please feel free to contact us.',
    contact: 'info@grehasoft.com | +91 89215 40183',
    rep_name: 'Raji T. Skariah',
    rep_phone: '+91 89215 40183 | +91 98954 80145',
    rep_email: 'info@grehasoft.com | grehasoft@gmail.com'
  }
};

const contentLibrary = [
  { name: 'Company Profile', text: `<p>Grehasoft Smart IT Solutions is an enterprise software development agency based in Kochi, Infopark.</p><p>We provide comprehensive mobile app, web application, branding, and digital marketing services to clients worldwide.</p>` },
  { name: 'Technology Stack', text: `<p>We build our applications using a robust state-of-the-art stack: Django Rest Framework (Python) for secure backend APIs, React (TypeScript) and Vite for responsive frontends, PostgreSQL/MySQL/SQLite for databases, and AWS/Azure/DigitalOcean for scalable cloud hosting.</p>` },
  { name: 'Why Choose Grehasoft', text: `<p>• <b>Experienced Team:</b> Senior engineers with expertise in modern frameworks.</p><p>• <b>SEO Centric Coding:</b> Fast loading speeds and standards-compliant markups.</p><p>• <b>Pixel-Perfect UIs:</b> Premium design aesthetics that reflect your brand identity.</p><p>• <b>Post-launch Support:</b> Dedicated support windows for seamless maintenance.</p>` },
  { name: 'Terms & Conditions', text: `<p>1. <b>Validity:</b> This proposal remains valid for 30 days from issuance.</p><p>2. <b>Scope Change:</b> Features outside this specification will require a scope change request.</p><p>3. <b>Support:</b> Support is provided on business days between 9:00 AM and 6:00 PM IST.</p><p>4. <b>IP Ownership:</b> Intellectual property rights transfer upon final balance clearance.</p>` },
  { name: 'Payment Terms', text: `<p>The payment for the project is scheduled as follows:<br/>• 50% Advance: payable immediately to kick off the development.<br/>• 30% Development Milestone: payable upon completion of core modules.<br/>• 20% Final Deployment: payable prior to launching the workspace.</p>` }
];

const colorPresets = [
  { name: 'Blue', primary: '#1f4e79', secondary: '#2b6cb0' },
  { name: 'Slate', primary: '#0f172a', secondary: '#3b82f6' },
  { name: 'Green', primary: '#047857', secondary: '#10b981' },
  { name: 'Purple', primary: '#701a75', secondary: '#a21caf' },
  { name: 'Dark', primary: '#1e293b', secondary: '#475569' }
];

interface RichEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

const RichEditor: React.FC<RichEditorProps> = ({ label, value, onChange, placeholder, rows = 5 }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
    onChange(newVal);
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selected.length);
    }, 50);
  };

  return (
    <div className="mb-3 text-start">
      <div className="d-flex justify-content-between align-items-center mb-1 bg-light border p-2 rounded-top">
        <label className="form-label small fw-bold mb-0 text-dark">{label}</label>
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
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

const ProposalsPage: React.FC<ProposalsPageProps> = ({ leads, setProjects, setLeads }) => {
  const {
    items: proposals,
    pagination: { page, setPage, totalPages, totalCount: count },
    add,
    update,
    delete: remove,
    refetch,
    setItems: setProposalsList,
  } = useCrud<Proposal>({ endpoint: '/proposals' });

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([
    { service: '', description: '', cost: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [hasImported, setHasImported] = useState(false);
  const [importedLeadId, setImportedLeadId] = useState<number | ''>('');
  const [isItemsDirty, setIsItemsDirty] = useState(false);
  
  // Builder Workspace States
  const [isBuilderActive, setIsBuilderActive] = useState(false);
  const [builderConfig, setBuilderConfig] = useState<any>(null);
  const { showAlert } = useAlert();
  const [pendingLeadId, setPendingLeadId] = useState<number | '' | null>(null);
  const [showLeadChangeConfirm, setShowLeadChangeConfirm] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!proposalToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/proposals/${proposalToDelete.id}/`);
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Proposal deleted successfully."
      });
      setProposalToDelete(null);
      refetch();
    } catch (err: any) {
      console.error("Failed to delete proposal:", err);
      if (err.response?.status === 404) {
        showAlert({
          variant: AlertVariant.ERROR,
          message: "This proposal no longer exists."
        });
        setProposalToDelete(null);
        refetch();
      } else {
        showAlert({
          variant: AlertVariant.ERROR,
          message: "Failed to delete proposal. Please try again."
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!proposalToDelete) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        setProposalToDelete(null);
      } else if (e.key === "Enter" && !isDeleting) {
        handleConfirmDelete();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [proposalToDelete, isDeleting, handleConfirmDelete]);

  const location = useLocation();

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const params = new URLSearchParams(location.search);
  const leadId = params.get("lead");
  useEffect(() => {
    if (leadId) {
      axiosInstance.get(`/leads/${leadId}/`).then(res => {
        const lead = res.data;

        setSelectedLeadId(lead.id);   // ⭐ important
        setClientName(lead.name);
        setEmail(lead.email);
        setPhone(lead.phone);

        if (!editingProposal) {
          if (lead.service_required && lead.service_required.length > 0) {
            const importedItems = lead.service_required.map((s: string) => {
              const serviceName = s.startsWith('Other: ') ? s.replace('Other: ', '') : s;
              return {
                service: serviceName,
                description: '',
                cost: 0
              };
            });
            setItems(importedItems);
            setHasImported(true);
          } else {
            setItems([{ service: '', description: '', cost: 0 }]);
            setHasImported(false);
          }
          setImportedLeadId(lead.id);
          setIsItemsDirty(false);
        }

        setModalOpen(true);
      });
    }
  }, [leadId, editingProposal]);

  useEffect(() => {
    if (editingProposal) {
      // ✅ Existing logic
      setItems(editingProposal.items || [{ service: '', description: '', cost: 0 }]);
      setDiscount(editingProposal.discount || 0);

      // 🔥 ADD THIS BLOCK
      const lead = leads.find(l => l.id === editingProposal.leadId);

      if (lead) {
        setSelectedLeadId(lead.id);   // ✅ FIX DROPDOWN
        setClientName(lead.name);
        setEmail(lead.email);
        setPhone(lead.phone);
      }
    } else {
      if (!isModalOpen) {
        setItems([{ service: '', description: '', cost: 0 }]);
        setDiscount(0);

        // 🔥 Reset when creating new
        setSelectedLeadId('');
        setClientName('');
        setEmail('');
        setPhone('');
        setHasImported(false);
        setImportedLeadId('');
        setIsItemsDirty(false);
      }
    }
  }, [editingProposal, isModalOpen, leads]);

  useEffect(() => {
    if (!selectedLeadId) {
      if (!editingProposal) {
        setClientName('');
        setEmail('');
        setPhone('');
        setItems([{ service: '', description: '', cost: 0 }]);
        setHasImported(false);
        setImportedLeadId('');
      }
      return;
    }

    const lead = leads.find(l => l.id === Number(selectedLeadId));

    if (lead) {
      setClientName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);

      if (!editingProposal && selectedLeadId !== importedLeadId) {
        if (lead.service_required && lead.service_required.length > 0) {
          const importedItems = lead.service_required.map((s: string) => {
            const serviceName = s.startsWith('Other: ') ? s.replace('Other: ', '') : s;
            return {
              service: serviceName,
              description: '',
              cost: 0
            };
          });
          setItems(importedItems);
          setHasImported(true);
        } else {
          setItems([{ service: '', description: '', cost: 0 }]);
          setHasImported(false);
        }
        setImportedLeadId(selectedLeadId);
        setIsItemsDirty(false);
      }
    }
  }, [selectedLeadId, leads, editingProposal, importedLeadId]);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalAmount = subtotal - discount;

  const handleAddItem = () => {
    setItems([...items, { service: '', description: '', cost: 0 }]);
    setIsItemsDirty(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setIsItemsDirty(true);
  };

  const handleItemChange = (index: number, field: keyof ProposalItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setIsItemsDirty(true);
  };

  const handleLeadChange = (newLeadId: number | '') => {
    if (!editingProposal && isItemsDirty) {
      setPendingLeadId(newLeadId);
      setShowLeadChangeConfirm(true);
    } else {
      setSelectedLeadId(newLeadId);
    }
  };

  const handleConfirmLeadChange = () => {
    if (pendingLeadId !== null) {
      setSelectedLeadId(pendingLeadId);
      setPendingLeadId(null);
    }
    setShowLeadChangeConfirm(false);
  };

  const handleCancelLeadChange = () => {
    setPendingLeadId(null);
    setShowLeadChangeConfirm(false);
  };
  const [errors, setErrors] = useState<any>({});
  const validateForm = () => {
  const newErrors: any = {};

  if (!selectedLeadId) {
    newErrors.leadId = "Please select a lead.";
  }

  const titleInput = (document.querySelector('[name="title"]') as HTMLInputElement)?.value;
  if (!titleInput || titleInput.trim().length < 3) {
    newErrors.title = "Title must be at least 3 characters.";
  }

  if (items.length === 0) {
    newErrors.items = "At least one service item is required.";
  }

  items.forEach((item, index) => {
    if (!item.service) {
      newErrors[`service_${index}`] = "Service name is required.";
    }
    if (!item.cost || item.cost <= 0) {
      newErrors[`cost_${index}`] = "Cost must be greater than 0.";
    }
  });

  if (discount > subtotal) {
    newErrors.discount = "Discount cannot be greater than subtotal.";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!validateForm()) return;

  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData.entries());

  const selectedLead = leads.find(l => l.id === Number(data.leadId));

  const payload = {
    lead: Number(data.leadId),
    leadName: selectedLead?.name,
    title: data.title,
    description: data.description,
    project_overview: data.project_overview,
    items: items,
    subtotal: subtotal,
    discount: discount,
    amount: totalAmount,
    status: data.status || 'draft'
  };

  if (editingProposal) {
    await update(editingProposal.id!, payload);
  } else {
    await add(payload);
  }

  setModalOpen(false);
  setEditingProposal(null);
};

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-success';
      case 'sent': return 'bg-primary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

const handleConvert = async (proposal: Proposal) => {
  try {
    console.log("Converting proposal:", proposal.id);

    const res = await axiosInstance.post(
      `/proposals/${proposal.id}/convert/`
    );

    console.log("✅ Convert success:", res.data);

    // ✅ update UI instantly
    setProposalsList(prev =>
      prev.map(p =>
        p.id === proposal.id
          ? { ...p, is_converted: true, client: res.data.project?.client }
          : p
      )
    );

    // ✅ refresh projects
    if (setProjects) {
      const projectRes = await axiosInstance.get('/projects/?limit=1000');
      setProjects(projectRes.data.results ?? []);
    }

    // ✅ refresh leads
    if (setLeads) {
      const leadsRes = await axiosInstance.get('/leads/');
      setLeads(leadsRes.data.results ?? leadsRes.data ?? []);
    }

  } catch (err: any) {
    console.error("❌ Convert error:", err.response?.data);
    showAlert({
      variant: AlertVariant.ERROR,
      message: err.response?.data?.error || "Convert failed"
    });
  }
};

  // ==========================================
  // PROPOSAL BUILDER WORKSPACE HANDLERS
  // ==========================================
  const handleOpenBuilder = async (proposal: Proposal) => {
    try {
      // Fetch latest proposal details directly from Proposal API
      const res = await axiosInstance.get(`/proposals/${proposal.id}/`);
      const fetchedProposal = res.data;
      
      setEditingProposal(fetchedProposal);
      
      // Auto-generate cover page metadata if not present
      const clientName = fetchedProposal.client?.name || fetchedProposal.leadName || "Valued Client";
      const clientCompany = fetchedProposal.client?.company_name || "Client Company";
      const coverTitle = fetchedProposal.title ? (fetchedProposal.title.toLowerCase().endsWith("proposal") ? fetchedProposal.title : `${fetchedProposal.title} Proposal`) : "Project Proposal";
      const propDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      const config = {
        ...defaultBuilderConfig,
        ...(fetchedProposal.builder_config || {}),
        cover_page: {
          ...defaultBuilderConfig.cover_page,
          title: fetchedProposal.builder_config?.cover_page?.title || coverTitle,
          preparedForName: fetchedProposal.builder_config?.cover_page?.preparedForName || clientName,
          preparedForCompany: fetchedProposal.builder_config?.cover_page?.preparedForCompany || clientCompany,
          proposalId: fetchedProposal.builder_config?.cover_page?.proposalId || `PROP-${String(fetchedProposal.id).padStart(4, '0')}`,
          proposalDate: fetchedProposal.builder_config?.cover_page?.proposalDate || propDate,
          ...(fetchedProposal.builder_config?.cover_page || {})
        },
        pricing: {
          items: fetchedProposal.items || [],
          subtotal: Number(fetchedProposal.subtotal) || 0,
          discount: Number(fetchedProposal.discount) || 0,
          amount: Number(fetchedProposal.amount) || 0
        },
        // Auto-populate empty sections with defaults
        cover_letter: fetchedProposal.builder_config?.cover_letter || defaultBuilderConfig.cover_letter,
        company_profile: fetchedProposal.builder_config?.company_profile || defaultBuilderConfig.company_profile,
        project_overview: fetchedProposal.builder_config?.project_overview || defaultBuilderConfig.project_overview,
        scope_of_work: fetchedProposal.builder_config?.scope_of_work || defaultBuilderConfig.scope_of_work,
        timeline: fetchedProposal.builder_config?.timeline || defaultBuilderConfig.timeline,
        why_choose_us: fetchedProposal.builder_config?.why_choose_us || defaultBuilderConfig.why_choose_us,
        terms_conditions: fetchedProposal.builder_config?.terms_conditions || defaultBuilderConfig.terms_conditions,
        features: (fetchedProposal.builder_config?.features && fetchedProposal.builder_config.features.length > 0) ? fetchedProposal.builder_config.features : defaultBuilderConfig.features,
        deliverables: (fetchedProposal.builder_config?.deliverables && fetchedProposal.builder_config.deliverables.length > 0) ? fetchedProposal.builder_config.deliverables : defaultBuilderConfig.deliverables,
        thank_you: {
          ...defaultBuilderConfig.thank_you,
          ...(fetchedProposal.builder_config?.thank_you || {})
        }
      };
      
      setBuilderConfig(config);
      setIsBuilderActive(true);
    } catch (err) {
      console.error("Failed to load proposal details for builder:", err);
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to load proposal builder data."
      });
    }
  };





  if (isBuilderActive && editingProposal && builderConfig) {
    return (
      <ProposalBuilderProvider
        proposal={editingProposal}
        initialConfig={builderConfig}
        onClose={() => {
          setIsBuilderActive(false);
          setEditingProposal(null);
          setBuilderConfig(null);
        }}
        onUpdateSuccess={refetch}
      >
        <ProposalBuilderWorkspace
          onClose={() => {
            setIsBuilderActive(false);
            setEditingProposal(null);
            setBuilderConfig(null);
          }}
        />
      </ProposalBuilderProvider>
    );
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">Business Proposals</h4>
          <p className="text-secondary small mb-0">Manage and track client project proposals</p>
        </div>
        <button className="btn btn-primary btn-sm shadow-sm" onClick={() => { setEditingProposal(null); setModalOpen(true); }}>
          <i className="bi bi-plus-lg me-2"></i>Create Proposal
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 small text-uppercase fw-bold text-secondary">Title</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Lead</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Amount</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Status</th>
              <th className="py-3 small text-uppercase fw-bold text-secondary">Created</th>
              <th className="text-end px-4 py-3 small text-uppercase fw-bold text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">No proposals found</td>
              </tr>
            ) : (
             proposals.map(proposal => (
                <tr key={proposal.id}>
                  <td className="px-4 fw-bold">{proposal.title}</td>
                  <td>{proposal.leadName}</td>
                  <td><span className="fw-bold text-primary">₹{proposal.amount.toLocaleString()}</span></td>
                  <td>
                    <span className={`badge rounded-pill ${getStatusBadgeClass(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="small text-muted">{new Date(proposal.created_at).toLocaleDateString()}</td>
                  <td className="text-end px-4">
            <div className="btn-group">

  {/* Converted badge OR Convert button */}
 {proposal.is_converted ? (
  <span className="badge bg-success-subtle text-success border border-success me-2 py-2 px-3">
    <i className="bi bi-check-circle-fill me-1"></i>Converted
  </span>
) : proposal.status === "accepted" && (
  <button
    className="btn btn-sm btn-outline-success me-2 shadow-sm"
   onClick={() => handleConvert(proposal)}
  >
    <i className="bi bi-rocket-takeoff me-1"></i>Convert
  </button>
)}

  {/* Builder Workspace trigger */}
                      <button
                        className="btn btn-sm btn-primary me-2 shadow-sm"
                        onClick={() => handleOpenBuilder(proposal)}
                        title="Open Advanced Proposal Builder"
                      >
                        <i className="bi bi-palette-fill me-1"></i>Builder
                      </button>

  {/* Download PDF */}
  <button
    className="btn btn-sm btn-outline-dark me-2 shadow-sm"
    onClick={() => generateProposalPDF(proposal)}
    title="Download PDF Proposal"
  >
    <i className="bi bi-file-earmark-pdf me-1"></i>PDF
  </button>

  {/* WhatsApp */}
 <button
  className="btn btn-sm btn-outline-success me-2 shadow-sm"
  onClick={() => {
    try {
      if (proposal.leadPhone) {
        const phone = proposal.leadPhone.replace(/\D/g, '');
        showAlert({
          variant: AlertVariant.INFO,
          message: "Direct file attachment is not supported by browsers. Sharing a secure download link instead."
        });
        const clientName = proposal.leadName || "Client";
        const proposalTitle = proposal.title;
        const securePdfLink = proposal.secure_pdf_link || '';
        
        const rawMessage = `Hello ${clientName},\n\nPlease find your proposal for "${proposalTitle}".\n\nYou can securely view or download the proposal using the link below:\n\n${securePdfLink}\n\n⚠️ This secure link will expire in 2 days.\n\nRegards,\nGrehasoft Team`;
        
        const message = encodeURIComponent(rawMessage);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Secure proposal link shared via WhatsApp."
        });
      } else {
        showAlert({
          variant: AlertVariant.WARNING,
          message: "No phone number for this lead"
        });
      }
    } catch (err) {
      console.error("Failed to share proposal:", err);
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to share proposal."
      });
    }
  }}
  title="Share Proposal via WhatsApp"
>
  <i className="bi bi-whatsapp"></i>
</button>

  {/* Email */}
  <button
  className="btn btn-sm btn-outline-primary me-2 shadow-sm"
  onClick={async () => {
    if (proposal.leadEmail) {
      try {
        showAlert({
          variant: AlertVariant.INFO,
          message: "Sending proposal email..."
        });
        await axiosInstance.post(`/proposals/${proposal.id}/send/`);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Proposal emailed successfully."
        });
        refetch();
      } catch (err) {
        console.error("Failed to send proposal email:", err);
        showAlert({
          variant: AlertVariant.ERROR,
          message: "Failed to send proposal email."
        });
      }
    } else {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "No email for this lead"
      });
    }
  }}
  title="Email Proposal to Lead"
>
  <i className="bi bi-envelope"></i>
</button>

  {/* Edit */}
  <button
    className="btn btn-sm btn-light me-2 border shadow-sm"
    onClick={() => {
  setEditingProposal(proposal);
  setSelectedLeadId(proposal.leadId);   // ⭐ important
  setModalOpen(true);
}}
  >
    <i className="bi bi-pencil"></i>
  </button>

  {/* Delete */}
  <button
    className="btn btn-sm btn-light text-danger border shadow-sm"
    onClick={() => setProposalToDelete(proposal)}
    title="Delete Proposal"
  >
    <i className="bi bi-trash"></i>
  </button>

</div>
                    {proposal.lastSentAt && (
                      <div className="smaller text-secondary mt-1">
                        <i className="bi bi-send me-1"></i>Sent: {new Date(proposal.lastSentAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="d-flex justify-content-end align-items-center gap-1 p-3">

  {/* FIRST */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(1)}
  >
    « First
  </button>

  {/* PREV */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    ‹ Prev
  </button>

  {/* PAGE NUMBERS */}
  {pageNumbers.map(num => (
    <button
      key={num}
      className={`btn btn-sm ${page === num ? "btn-primary" : "btn-outline-primary"}`}
      onClick={() => setPage(num)}
    >
      {num}
    </button>
  ))}

  {/* NEXT */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next ›
  </button>

  {/* LAST */}
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={page === totalPages}
    onClick={() => setPage(totalPages)}
  >
    Last »
  </button>

</div>
      </div>

      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
            <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">{editingProposal ? 'Edit Proposal' : 'Create Proposal'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold">Lead</label>
                      <select
  name="leadId"
  className="form-select"
  value={selectedLeadId || ""} 
  onChange={(e) => {
    const val = e.target.value ? Number(e.target.value) : '';
    handleLeadChange(val);
  }}
  required
>
  <option value="">Select Lead</option>
  {leads.map(l => (
    <option key={l.id} value={l.id}>{l.name}</option>
  ))}
</select>
 {/* 🔴 ERROR MESSAGE HERE */}
  {errors.leadId && (
    <div className="text-danger small">{errors.leadId}</div>
  )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold">Title</label>
                      <input name="title" type="text" className="form-control" defaultValue={editingProposal?.title} placeholder="e.g. Website Redesign" required />
                    {errors.title && (
  <div className="text-danger small">{errors.title}</div>
)}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Status</label>
                    <select name="status" className="form-select" defaultValue={editingProposal?.status || 'draft'}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Project Overview</label>
                    <textarea name="project_overview" className="form-control" rows={3} defaultValue={editingProposal?.project_overview} placeholder="Project goals and objectives..."></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description (Intro)</label>
                    <textarea name="description" className="form-control" rows={2} defaultValue={editingProposal?.description} placeholder="Brief introduction..."></textarea>
                  </div>

                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">Estimated Cost Table</h6>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddItem}>
                      <i className="bi bi-plus-lg me-1"></i>Add Item
                    </button>
                  </div>

                  {hasImported && (
                    <div className="alert alert-info py-2 px-3 mb-3 small d-flex align-items-start gap-2 border-0 bg-info-subtle text-info-emphasis rounded-3">
                      <i className="bi bi-info-circle-fill mt-0.5"></i>
                      <div>
                        The services below were automatically imported from the selected lead. You can edit, remove, or add additional services before saving the proposal.
                      </div>
                    </div>
                  )}

                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ width: '30%' }}>Service</th>
                          <th style={{ width: '40%' }}>Description</th>
                          <th style={{ width: '20%' }}>Cost (₹)</th>
                          <th style={{ width: '10%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                value={item.service} 
                                onChange={(e) => handleItemChange(index, 'service', e.target.value)} 
                                placeholder="Service name"
                                required
                                
                              />

{errors[`service_${index}`] && (
  <div className="text-danger small">
    {errors[`service_${index}`]}
  </div>
)}
                            </td>
                            <td>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                value={item.description} 
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                                placeholder="Details"
                              />
                              {errors[`description_${index}`] && (
  <div className="text-danger small">
    {errors[`description_${index}`]}
  </div>
)}
                            </td>
                            <td>
                              <input 
                                type="number" 
                                className="form-control form-control-sm text-end" 
                                value={item.cost} 
                                onChange={(e) => handleItemChange(index, 'cost', Number(e.target.value))} 
                                required
                              />
                              {errors[`cost_${index}`] && (
  <div className="text-danger small">
    {errors[`cost_${index}`]}
  </div>
)}
                            </td>
                            <td className="text-center">
                              <button 
                                type="button" 
                                className="btn btn-link text-danger p-0" 
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="text-end fw-bold">Subtotal:</td>
                          <td className="text-end fw-bold">₹{subtotal.toLocaleString()}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-end fw-bold">Discount:</td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control form-control-sm text-end" 
                              value={discount} 
                              onChange={(e) => setDiscount(Number(e.target.value))} 
                            />
                          </td>
                          <td></td>
                        </tr>
                        <tr className="table-primary">
                          <td colSpan={2} className="text-end fw-bold">Grand Total:</td>
                          <td className="text-end fw-bold">₹{totalAmount.toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 shadow-sm">Save Proposal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showLeadChangeConfirm}
        onClose={handleCancelLeadChange}
        onConfirm={handleConfirmLeadChange}
        title="Change Lead"
        message="You have edited the service items. Are you sure you want to change the selected lead and replace the current service list?"
      />

      {proposalToDelete && (
        <div style={overlayStyle} role="dialog" aria-modal="true">
          <div style={modalStyle}>
            {/* Header */}
            <div style={headerStyle}>
              <div style={titleStyle}>
                <span style={{ color: "#dc3545", marginRight: "8px", fontWeight: "bold" }}>⚠</span>
                Delete Proposal
              </div>
              <button 
                style={closeBtnStyle} 
                onClick={() => !isDeleting && setProposalToDelete(null)}
                disabled={isDeleting}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={bodyStyle}>
              <p style={{ marginBottom: "12px" }}>Are you sure you want to permanently delete this proposal?</p>
              <div style={{ 
                backgroundColor: "#f8f9fa", 
                borderLeft: "4px solid #dc3545", 
                padding: "10px 14px", 
                borderRadius: "4px",
                marginBottom: "12px",
                fontWeight: 500,
                fontSize: "14px",
                fontStyle: "italic"
              }}>
                "{proposalToDelete.title}"
              </div>
              <small style={{ color: "#6c757d", display: "block" }}>
                This action cannot be undone.
              </small>
            </div>

            {/* Footer */}
            <div style={footerStyle}>
              <button 
                className="btn btn-sm btn-light border me-2"
                onClick={() => setProposalToDelete(null)}
                disabled={isDeleting}
                style={{ cursor: isDeleting ? "not-allowed" : "pointer" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-danger px-3"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ 
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  backgroundColor: "#dc3545",
                  color: "#fff"
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  width: "420px",
  borderRadius: "14px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  overflow: "hidden",
  animation: "fadeIn 0.2s ease-in-out",
  textAlign: "left",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "18px 20px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
  fontSize: "16px",
  color: "#1e293b",
};

const titleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const bodyStyle: React.CSSProperties = {
  padding: "20px",
  color: "#334155",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "16px 20px",
  borderTop: "1px solid #eee",
};

const closeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#94a3b8",
};

export default ProposalsPage;
