import React, { useState, useEffect } from 'react';
import { Lead, LeadAssignment, LeadFollowup, User, UserRole, Client, Project, Department, ProjectStatus } from '../../types';
import axiosInstance from '../../api/axiosInstance';
import { useForm } from '../../hooks/useForm';
import { useCrud } from '../../hooks/useCrud';
import FormField from '../../components/FormField';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  converted_project_id: string;
  enquiry_from: string;
  how_contacted: string;
  contacted_person: string;
  reference_person: string;
  company_name: string;
  service_required: string[];
  client_requirements: string;
  details_given: string;
  competitor_websites: string;
  documents_given: string[];
  login_credentials: string[];
};

interface ServiceItem {
  label: string;
  value: string;
}

interface ServiceCategory {
  title: string;
  emoji: string;
  icon: string;
  services: ServiceItem[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    title: 'Website Development',
    emoji: '🌐',
    icon: 'bi-globe',
    services: [
      { label: 'Business Website', value: 'Business Website' },
      { label: 'Corporate Website', value: 'Corporate Website' },
      { label: 'Custom Website', value: 'Custom Website' },
      { label: 'Dynamic Custom Website', value: 'Dynamic Custom Website' },
      { label: 'HTML Website', value: 'HTML Website' },
      { label: 'Landing Page', value: 'Landing Page' },
      { label: 'LearnPress', value: 'LearnPress' },
      { label: 'Portfolio Website', value: 'Portfolio Website' },
      { label: 'Shopify', value: 'Shopify' },
      { label: 'Website Maintenance', value: 'Website Maintenance' },
      { label: 'Website Migration', value: 'Website Migration' },
      { label: 'Website Redesign', value: 'Website Redesign' },
      { label: 'Website Speed Optimization', value: 'Website Speed Optimization' },
      { label: 'WooCommerce', value: 'WooCommerce' },
      { label: 'WordPress Website', value: 'WordPress Website' }
    ]
  },
  {
    title: 'Software Development',
    emoji: '💻',
    icon: 'bi-laptop',
    services: [
      { label: 'Billing Software', value: 'Billing Software' },
      { label: 'CRM Development', value: 'CRM Development' },
      { label: 'Custom Software', value: 'Custom Software' },
      { label: 'ERP Development', value: 'ERP Development' },
      { label: 'Hospital Management', value: 'Hospital Management' },
      { label: 'Hotel Management', value: 'Hotel Management' },
      { label: 'HRMS', value: 'HRMS' },
      { label: 'Inventory Management', value: 'Inventory Management' },
      { label: 'Restaurant POS', value: 'Restaurant POS' },
      { label: 'School Management', value: 'School Management' }
    ]
  },
  {
    title: 'Mobile App Development',
    emoji: '📱',
    icon: 'bi-phone',
    services: [
      { label: 'Android App', value: 'Android App' },
      { label: 'Flutter App', value: 'Flutter App' },
      { label: 'Hybrid App', value: 'Hybrid App' },
      { label: 'iOS App', value: 'iOS App' },
      { label: 'Mobile App', value: 'Mobile App' },
      { label: 'Progressive Web App (PWA)', value: 'Progressive Web App (PWA)' },
      { label: 'React Native App', value: 'React Native App' }
    ]
  },
  {
    title: 'Digital Marketing',
    emoji: '📈',
    icon: 'bi-graph-up-arrow',
    services: [
      { label: 'Content Marketing', value: 'Content Marketing' },
      { label: 'Ecommerce SEO', value: 'Ecommerce SEO' },
      { label: 'Email Marketing', value: 'Email Marketing' },
      { label: 'Google Ads', value: 'Google Ads' },
      { label: 'Local SEO', value: 'Local SEO' },
      { label: 'Meta Ads', value: 'Meta Ads' },
      { label: 'Online Reputation Management', value: 'Online Reputation Management' },
      { label: 'SEO', value: 'SEO' },
      { label: 'Social Media Marketing', value: 'Social Media Marketing' },
      { label: 'Technical SEO', value: 'Technical SEO' },
      { label: 'YouTube Marketing', value: 'YouTube Marketing' }
    ]
  },
  {
    title: 'Branding & Graphic Design',
    emoji: '🎨',
    icon: 'bi-palette',
    services: [
      { label: 'Banner Design', value: 'Banner Design' },
      { label: 'Brand Identity', value: 'Brand Identity' },
      { label: 'Branding', value: 'Branding' },
      { label: 'Brochure', value: 'Brochure' },
      { label: 'Business Card', value: 'Business Card' },
      { label: 'Company Profile', value: 'Company Profile' },
      { label: 'Flyer', value: 'Flyer' },
      { label: 'Letter Head', value: 'Letter Head' },
      { label: 'Letterhead', value: 'Letterhead' },
      { label: 'Logo', value: 'Logo' },
      { label: 'Logo Design', value: 'Logo Design' },
      { label: 'Packaging Design', value: 'Packaging Design' },
      { label: 'Poster Design', value: 'Poster Design' },
      { label: 'Social Media Creatives', value: 'Social Media Creatives' },
      { label: 'UI/UX Design', value: 'UI/UX Design' }
    ]
  },
  {
    title: 'Cloud & Hosting',
    emoji: '☁️',
    icon: 'bi-cloud-arrow-up',
    services: [
      { label: 'Backup Solution', value: 'Backup Solution' },
      { label: 'Business Email', value: 'Business Email' },
      { label: 'CDN', value: 'CDN' },
      { label: 'Cloud Hosting', value: 'Cloud Hosting' },
      { label: 'Dedicated Server', value: 'Dedicated Server' },
      { label: 'Domain Registration', value: 'Domain Registration' },
      { label: 'SSL Certificate', value: 'SSL Certificate' },
      { label: 'VPS Hosting', value: 'VPS Hosting' },
      { label: 'Web Hosting', value: 'Web Hosting' }
    ]
  },
  {
    title: 'IT Infrastructure',
    emoji: '🔒',
    icon: 'bi-shield-lock',
    services: [
      { label: 'Access Control', value: 'Access Control' },
      { label: 'Biometric Attendance', value: 'Biometric Attendance' },
      { label: 'CCTV', value: 'CCTV' },
      { label: 'Cyber Security Audit', value: 'Cyber Security Audit' },
      { label: 'Data Backup', value: 'Data Backup' },
      { label: 'Firewall Setup', value: 'Firewall Setup' },
      { label: 'Network Setup', value: 'Network Setup' },
      { label: 'Server Installation', value: 'Server Installation' },
      { label: 'VPN Setup', value: 'VPN Setup' }
    ]
  },
  {
    title: 'AI & Automation',
    emoji: '🤖',
    icon: 'bi-robot',
    services: [
      { label: 'AI Analytics', value: 'AI Analytics' },
      { label: 'AI Chatbot', value: 'AI Chatbot' },
      { label: 'AI Content Generation', value: 'AI Content Generation' },
      { label: 'AI Voice Assistant', value: 'AI Voice Assistant' },
      { label: 'CRM Automation', value: 'CRM Automation' },
      { label: 'WhatsApp Chatbot', value: 'WhatsApp Chatbot' },
      { label: 'Workflow Automation', value: 'Workflow Automation' }
    ]
  },
  {
    title: 'Other Services',
    emoji: '⚙️',
    icon: 'bi-gear-wide-connected',
    services: [
      { label: 'Annual Maintenance Contract (AMC)', value: 'Annual Maintenance Contract (AMC)' },
      { label: 'API Integration', value: 'API Integration' },
      { label: 'GPS Tracking', value: 'GPS Tracking' },
      { label: 'IoT Solution', value: 'IoT Solution' },
      { label: 'IT Consultation', value: 'IT Consultation' },
      { label: 'Payment Gateway Integration', value: 'Payment Gateway Integration' },
      { label: 'QR Code System', value: 'QR Code System' },
      { label: 'Staff Training', value: 'Staff Training' },
      { label: 'Technical Support', value: 'Technical Support' },
      { label: 'Third-party Integration', value: 'Third-party Integration' },
      { label: 'Other (Custom)', value: 'Other' }
    ]
  }
];

interface LeadsPageProps {
  users: User[];
  clients: Client[];
  departments: Department[];
  setProjects?: (projects: any[]) => void;
  setLeads?: (leads: any[]) => void;
}

const LeadsPage: React.FC<LeadsPageProps> = ({
  users = [],
  clients = [],
  departments = [],
  setProjects,
  setLeads,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceSearch, setServiceSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const {
    items: leadList,
    pagination: { page, setPage, totalPages },
    add,
    update,
    delete: deleteLead,
    refetch,
  } = useCrud<Lead>({
    endpoint: '/leads',
    queryParams: {
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
    },
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const syncGlobalLeads = async () => {
    if (!setLeads) return;
    try {
      const res = await axiosInstance.get('/leads/');
      const data = res.data.results || res.data || [];
      setLeads(data);
    } catch (err) {
      console.error("Failed to sync global leads:", err);
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);
  const [isConvertModalOpen, setConvertModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const currentUserId = users?.[0]?.id || null;
  const [assignmentToDelete, setAssignmentToDelete] = useState<LeadAssignment | null>(null);
const [assignmentDeleteModal, setAssignmentDeleteModal] = useState(false);

  // New state variables for assignable Sales Executives
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string | number>('');
  const [assignmentToast, setAssignmentToast] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const triggerAssignmentToast = (type: 'success' | 'danger', message: string) => {
    setAssignmentToast({ type, message });
    setTimeout(() => {
      setAssignmentToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch assignable users on mount
  useEffect(() => {
    const fetchAssignableUsers = async () => {
      try {
        const res = await axiosInstance.get('/users/?all=true&role_name=SALES_EXECUTIVE,SALES_MANAGER&is_active=true');
        const data = res.data.results || res.data || [];
        const sorted = [...data].sort((a: User, b: User) => {
          const nameA = (a.name || a.username || '').toLowerCase();
          const nameB = (b.name || b.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setAssignableUsers(sorted);
      } catch (error) {
        console.error('Failed to fetch assignable users:', error);
        triggerAssignmentToast('danger', 'Failed to load assignable Sales Executives.');
      }
    };
    fetchAssignableUsers();
  }, []);

const handleDeleteAssignmentClick = (assignment: LeadAssignment) => {
  setAssignmentToDelete(assignment);
  setAssignmentDeleteModal(true);
};
const handleConfirmAssignmentDelete = async () => {
  if (!assignmentToDelete) return;

  try {
    await axiosInstance.delete(`/lead-assignments/${assignmentToDelete.id}/`);

    // 🔥 Refresh assignments list
    if (selectedLead) {
      await fetchLeadDetails(selectedLead.id);
    }

  } catch (error) {
    console.error("Assignment delete failed:", error);
  }

  setAssignmentDeleteModal(false);
  setAssignmentToDelete(null);
};

  useEffect(() => {
    if (selectedLead) {
      fetchLeadDetails(selectedLead.id);
    }
  }, [selectedLead]);

 const fetchLeadDetails = async (leadId: number) => {
  try {
    const [assignRes, followRes] = await Promise.all([
      axiosInstance.get(`/lead-assignments/?lead_id=${leadId}`),
      axiosInstance.get(`/lead-followups/?lead_id=${leadId}`),
    ]);

    // ✅ FIX HERE
    const fetchedAssignments = assignRes.data.results || assignRes.data || [];
    setAssignments(fetchedAssignments);
    setFollowups(followRes.data.results || followRes.data || []);

    if (fetchedAssignments && fetchedAssignments.length > 0) {
      const sortedAssignments = [...fetchedAssignments].sort((a, b) => b.id - a.id);
      const latest = sortedAssignments[0];
      if (latest && latest.sales_exec) {
        setSelectedExecId(latest.sales_exec);
      } else {
        setSelectedExecId('');
      }
    } else {
      setSelectedExecId('');
    }

  } catch (error) {
    console.error('Error fetching lead details:', error);
  }
};

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const validationSchema = {
    company_name: {
      required: true,
      message: 'Company name is required.'
    },
    email: {
      validate: (value: string) => {
        if (!value || value.trim() === '') return true;
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value) || 'Enter a valid corporate email address.';
      },
      message: 'Enter a valid corporate email address.'
    },
    phone: {
      validate: (value: string) => {
        if (!value || value.trim() === '') return true;
        const pattern = /^\+?[0-9\s\-()]{7,20}$/;
        return pattern.test(value) || 'Enter a valid phone number.';
      },
      message: 'Enter a valid phone number.'
    }
  };

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setValues
  } = useForm<LeadFormValues>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      source: 'Web',
      status: 'new',
      converted_project_id: '',
      enquiry_from: '',
      how_contacted: '',
      contacted_person: '',
      reference_person: '',
      company_name: '',
      service_required: [],
      client_requirements: '',
      details_given: '',
      competitor_websites: '',
      documents_given: [],
      login_credentials: []
    },
    validationSchema,
    onSubmit: async (formData) => {
      const payload = {
        ...formData,
        converted_project_id: formData.converted_project_id ? Number(formData.converted_project_id) : null,
        service_required: formData.service_required || [],
        documents_given: formData.documents_given || [],
        login_credentials: formData.login_credentials || []
      };

      if (editingLead) {
        await update(editingLead.id!, payload);
      } else {
        await add(payload);
      }
      setModalOpen(false);
      setEditingLead(null);
      syncGlobalLeads();
    }
  });

  const handleAddFollowup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!selectedLead) return;

  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData.entries());

  try {
    await axiosInstance.post('/lead-followups/', {
      lead: selectedLead.id,
      followup_type: data.followup_type,
      notes: data.notes,
      next_followup: data.next_followup || null,
      status: 'pending'
    });

    await fetchLeadDetails(selectedLead.id);
    (e.target as HTMLFormElement).reset();

  } catch (error) {
    console.error("Error adding followup:", error);
  }
};
 const handleDeleteClick = (lead: Lead) => {
  setLeadToDelete(lead);
  setDeleteModalOpen(true);
};

const handleConfirmDelete = async () => {
  if (!leadToDelete) return;

  try {
    await deleteLead(leadToDelete.id);
    syncGlobalLeads();
  } catch (error) {
    console.error("Delete failed:", error);
  }

  setDeleteModalOpen(false);
  setLeadToDelete(null);
};
  const handleExpandAll = () => {
    const allExpanded = SERVICE_CATEGORIES.reduce((acc, cat) => {
      acc[cat.title] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedCategories(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleSelectAllCategory = (services: ServiceItem[]) => {
    const currentSelected = new Set(values.service_required);
    services.forEach(s => {
      if (s.value === 'Other') {
        if (!values.service_required.some(val => val === 'Other' || val.startsWith('Other: '))) {
          currentSelected.add('Other');
        }
      } else {
        currentSelected.add(s.value);
      }
    });
    handleChange('service_required', Array.from(currentSelected));
  };

  const handleClearAllCategory = (services: ServiceItem[]) => {
    const valuesToClear = new Set(services.map(s => s.value));
    const newSelected = values.service_required.filter(val => {
      if (val === 'Other' || val.startsWith('Other: ')) {
        return !valuesToClear.has('Other');
      }
      return !valuesToClear.has(val);
    });
    handleChange('service_required', newSelected);
  };

  const getServiceLabel = (value: string) => {
    if (value.startsWith('Other: ')) {
      return value;
    }
    if (value === 'Other') {
      return 'Other (Custom)';
    }
    for (const cat of SERVICE_CATEGORIES) {
      const found = cat.services.find(s => s.value === value);
      if (found) return found.label;
    }
    return value;
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setValues({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      converted_project_id: lead.converted_project?.toString() || '',
      enquiry_from: lead.enquiry_from || '',
      how_contacted: lead.how_contacted || '',
      contacted_person: lead.contacted_person || '',
      reference_person: lead.reference_person || '',
      company_name: lead.company_name || '',
      service_required: lead.service_required || [],
      client_requirements: lead.client_requirements || '',
      details_given: lead.details_given || '',
      competitor_websites: lead.competitor_websites || '',
      documents_given: lead.documents_given || [],
      login_credentials: lead.login_credentials || []
    });
    setServiceSearch('');
    const initialExpanded: Record<string, boolean> = {};
    if (lead.service_required) {
      lead.service_required.forEach(val => {
        const cleanVal = val.startsWith('Other: ') ? 'Other' : val;
        const cat = SERVICE_CATEGORIES.find(c => c.services.some(s => s.value === cleanVal));
        if (cat) {
          initialExpanded[cat.title] = true;
        }
      });
    }
    setExpandedCategories(initialExpanded);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    resetForm();
    setServiceSearch('');
    setExpandedCategories({});
    setModalOpen(true);
  };

  const handleOpenConvert = (lead: Lead) => {
    setConvertingLead(lead);
    convertForm.setValues({
      clientName: lead.name,
      companyName: lead.company_name || '',
      email: lead.email,
      phone: lead.phone || '',
      address: '',
      projectName: `${lead.name} Project`,
      departmentId: '',
      projectManagerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setConvertModalOpen(true);
  };
 const handleCreateProposal = (lead: Lead) => {
  window.location.href = `#/proposals?lead=${lead.id}`;
};
  const convertForm = useForm({
    initialValues: {
      clientName: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      projectName: '',
      departmentId: '',
      projectManagerId: '',
      startDate: '',
      endDate: ''
    },
    validationSchema: {
      clientName: { required: true, message: 'Client name is required.' },
      companyName: { required: true, message: 'Company name is required.' },
      projectName: { required: true, message: 'Project name is required.' },
      departmentId: { required: true, message: 'Department is required.' },
      projectManagerId: { required: true, message: 'Project Manager is required.' },
      startDate: { required: true, message: 'Start date is required.' },
      endDate: { required: true, message: 'End date is required.' }
    },
    onSubmit: async (values) => {
      if (!convertingLead) return;
      try {
        const clientData = {
          name: values.clientName,
          companyName: values.companyName,
          email: values.email,
          phone: values.phone,
          address: values.address
        };
        const projectData = {
          name: values.projectName,
          departmentId: Number(values.departmentId),
          projectManagerId: Number(values.projectManagerId),
          startDate: values.startDate,
          endDate: values.endDate,
          status: ProjectStatus.NOT_STARTED,
          progressPercentage: 0,
          createdBy: currentUserId // Mocking current user
        };

        await handleConvertLead(convertingLead.id, clientData, projectData);
        setConvertModalOpen(false);
        setConvertingLead(null);
      } catch (error) {
        console.error("Conversion failed:", error);
      }
    }
  });

  const handleConvertLead = async (
    leadId: number,
    clientData: { name: string; companyName: string; email: string; phone: string; address: string },
    projectData: {
      name: string;
      departmentId: number;
      projectManagerId: number;
      startDate: string;
      endDate: string;
      status: ProjectStatus;
      progressPercentage: number;
      createdBy: number | null;
    }
  ) => {
    const convertRes = await axiosInstance.post(`/leads/${leadId}/convert_to_project/`, {
      name: projectData.name,
      department: projectData.departmentId,
      project_manager: projectData.projectManagerId,
      created_by: projectData.createdBy,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      status: projectData.status,
      progress_percentage: projectData.progressPercentage,
      client_address: clientData.address,
    });
    await refetch();
    if (setProjects) {
      const projectsRes = await axiosInstance.get('/projects/?limit=1000');
      setProjects(projectsRes.data.results ?? []);
    }
    return convertRes.data;
  };


  const handleAssignExec = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const execId = Number(selectedExecId);
    if (!execId) return;
    try {
      await axiosInstance.post('/lead-assignments/', {
        lead: selectedLead.id,
        sales_exec: execId,
      });
      triggerAssignmentToast('success', 'Lead assigned successfully!');
      await fetchLeadDetails(selectedLead.id);
      await refetch();
    } catch (error) {
      console.error('Assignment failed:', error);
      triggerAssignmentToast('danger', 'Failed to assign executive. Please try again.');
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignmentToast(null); // Clear toast when opening modal
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedLead(null);
    setAssignmentToast(null); // Clear toast when closing modal
  };
  
 const stats = {
  total: leadList.length,
  new: leadList.filter(l => l.status === 'new').length,
  contacted: leadList.filter(l => l.status === 'contacted').length,
  qualified: leadList.filter(l => l.status === 'qualified').length,
  converted: leadList.filter(l => l.status === 'converted').length,
};
const formatPhoneForWhatsApp = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const filteredCategories = SERVICE_CATEGORIES.map(category => {
  const matchingServices = category.services.filter(s =>
    s.label.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    category.title.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  return {
    ...category,
    services: matchingServices
  };
}).filter(category => category.services.length > 0);
  return (
     <>
    <div className="container-fluid p-0">
      {/* Pipeline Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Leads', count: stats.total, color: 'primary', icon: 'people' },
          { label: 'New', count: stats.new, color: 'info', icon: 'plus-circle' },
          { label: 'Contacted', count: stats.contacted, color: 'warning', icon: 'telephone' },
          { label: 'Qualified', count: stats.qualified, color: 'indigo', icon: 'check-circle' },
          { label: 'Converted', count: stats.converted, color: 'success', icon: 'briefcase' },
        ].map((s, i) => (
          <div key={i} className="col">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex align-items-center">
                <div className={`bg-${s.color}-subtle text-${s.color} rounded-3 p-2 me-3`}>
                  <i className={`bi bi-${s.icon} fs-5`}></i>
                </div>
                <div>
                  <div className="text-secondary smaller fw-bold uppercase">{s.label}</div>
                  <div className="fs-4 fw-bold text-dark">{s.count}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Sales Pipeline</h4>
          <p className="text-secondary small mb-0">Tracking prospects and conversion rates</p>
        </div>
        <button className="btn btn-primary btn-sm fw-bold px-3 shadow-sm" onClick={handleAddNew}>
          <i className="bi bi-person-plus me-2"></i>New Lead
        </button>
      </div>
 <div className="px-4 pb-3 border-bottom">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select form-select-sm bg-light border-0"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-professional align-middle mb-0">
          <thead>
            <tr>
              <th className="px-4">Prospect</th>
              <th>Contact Info</th>
              <th>Source</th>
              <th>Status</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
           {leadList
  .filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchTerm));

    const matchesStatus =
      !statusFilter || statusFilter === "all"
        ? true
        : lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .map(lead => (
              <tr key={lead.id} className="hover-bg-light transition">
                <td className="px-4 fw-bold text-dark">
                  {lead.name}
                  {lead.status === 'converted' && lead.converted_project&& (
                    <div className="smaller mt-1">
                      <a href={`#/projects/${lead.converted_project}`} className="text-decoration-none text-success fw-bold d-flex align-items-center">
                        <i className="bi bi-box-arrow-up-right me-1"></i>View Project
                      </a>
                    </div>
                  )}
                </td>
                <td>
  <div className="small text-dark">{lead.email}</div>

  <div className="smaller text-muted d-flex align-items-center gap-2">
    <span>{lead.phone}</span>

    {lead.phone && (
      <a
        href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}?text=Hello%20${lead.name},%20this%20is%20Grehasoft.`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="text-success"
      >
        <i className="bi bi-whatsapp fs-5"></i>
      </a>
    )}
  </div>
</td>
                <td><span className="badge bg-light text-dark border fw-normal">{lead.source}</span></td>
                <td>
                  <span className={`badge rounded-pill ${lead.status === 'converted' ? 'bg-success' : 'bg-primary'}`}>{lead.status}</span>
                </td>
                <td className="text-end px-4">
                  <div className="btn-group shadow-sm rounded-3 overflow-hidden">
                    {lead.status !== 'converted' && (
  <button
    className="btn btn-sm btn-white border-end"
    onClick={() => handleCreateProposal(lead)}
    title="Create Proposal"
  >
    <i className="bi bi-file-earmark-text text-primary"></i>
  </button>
)}
                    <button className="btn btn-sm btn-white border-end" onClick={() => handleViewDetails(lead)} title="View Details">
                      <i className="bi bi-eye text-info"></i>
                    </button>
                    <button className="btn btn-sm btn-white border-end" onClick={() => handleEdit(lead)} title="Edit Lead">
                      <i className="bi bi-pencil text-primary"></i>
                    </button>
                   <button
  className="btn btn-sm btn-white"
  onClick={() => handleDeleteClick(lead)}
  title="Delete Lead"
>
  <i className="bi bi-trash text-danger"></i>
</button>
                      
                  </div>
                </td>
              </tr>
            ))}
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

      {/* Add/Edit Lead Modal - ENHANCED */}
      {isModalOpen && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
          <div className="modal-dialog modal-lg" style={{ maxHeight: '95vh', display: 'flex', margin: 'auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg d-flex flex-column" style={{ maxHeight: '95vh', overflow: 'hidden' }}>
              <form onSubmit={handleSubmit} noValidate className="d-flex flex-column" style={{ height: '100%' }}>
                <div className="modal-header border-0 bg-white pt-4 px-4 flex-shrink-0">
                  <h5 className="modal-title fw-bold text-dark">{editingLead ? 'Update Prospect Profile' : 'Register New Prospect'}</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
                  <div className="row g-3">
                    {/* BASIC INFO SECTION */}
                    <div className="col-12">
                      <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                        <i className="bi bi-person me-2"></i>Basic Information
                      </h6>
                    </div>
                    <div className="col-12">
                      <FormField label="Contact Person" name="name" value={values.name} onChange={handleChange} error={errors.name} placeholder="e.g. Alex Thompson" />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Email" name="email" type="email" value={values.email} onChange={handleChange} error={errors.email} placeholder="alex@example.com" />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Phone" name="phone" value={values.phone} onChange={handleChange} error={errors.phone} placeholder="+91 00000 00000" />
                    </div>
                    <div className="col-12">
                      <FormField label="Company Name *" name="company_name" value={values.company_name} onChange={handleChange} error={errors.company_name} placeholder="e.g. ABC Corporation" />
                    </div>

                    {/* LEAD SOURCE SECTION */}
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                        <i className="bi bi-funnel me-2"></i>Lead Source
                      </h6>
                    </div>
                    <div className="col-12">
                      <FormField label="Source" name="source" type="select" value={values.source} onChange={handleChange} options={[
                        { label: 'Website', value: 'Web' },
                        { label: 'Ads', value: 'Ads' },
                        { label: 'Referral', value: 'Referral' },
                        { label: 'Direct', value: 'Direct' }
                      ]} />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Enquiry From" name="enquiry_from" type="select" value={values.enquiry_from} onChange={handleChange} options={[
                        { label: 'WhatsApp', value: 'WhatsApp' },
                        { label: 'Call', value: 'Call' },
                        { label: 'Facebook', value: 'Facebook' },
                        { label: 'Instagram', value: 'Instagram' },
                        { label: 'LinkedIn', value: 'LinkedIn' }
                      ]} />
                    </div>
                    <div className="col-md-6">
                      <FormField label="How Contacted" name="how_contacted" type="select" value={values.how_contacted} onChange={handleChange} options={[
                        { label: 'Direct', value: 'Direct' },
                        { label: 'Reference', value: 'Reference' },
                        { label: 'Friend', value: 'Friend' }
                      ]} />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Contacted Person" name="contacted_person" value={values.contacted_person} onChange={handleChange} placeholder="Name of person contacted" />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Reference Person" name="reference_person" value={values.reference_person} onChange={handleChange} placeholder="If referred by someone" />
                    </div>

                    {/* SERVICES SECTION */}
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                        <i className="bi bi-gear me-2"></i>Services Required
                      </h6>
                    </div>
                    <div className="col-12">
                      {/* Selected Chips container */}
                      {values.service_required.length > 0 && (
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-secondary text-uppercase mb-1">Selected Services</label>
                          <div className="d-flex flex-wrap gap-2 p-2 rounded bg-light border border-light-subtle">
                            {values.service_required.map((serviceVal) => (
                              <span 
                                key={serviceVal} 
                                className="badge bg-primary-subtle text-primary border border-primary d-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-pill"
                                style={{ fontSize: '0.8rem' }}
                              >
                                <span>{getServiceLabel(serviceVal)}</span>
                                <button 
                                  type="button" 
                                  className="btn-close text-primary ms-1" 
                                  style={{ fontSize: '0.5rem', filter: 'none', background: 'none', border: 'none', padding: 0 }}
                                  onClick={() => {
                                    handleChange('service_required', values.service_required.filter(s => s !== serviceVal));
                                  }}
                                >
                                  <i className="bi bi-x fs-6"></i>
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search box & Accordion controls */}
                      <div className="row g-2 align-items-center mb-3">
                        <div className="col-12 col-sm">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                            <input 
                              type="text" 
                              className="form-control bg-light border-start-0 shadow-none" 
                              placeholder="Search services..." 
                              value={serviceSearch}
                              onChange={(e) => setServiceSearch(e.target.value)}
                            />
                            {serviceSearch && (
                              <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={() => setServiceSearch('')}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="col-12 col-sm-auto d-flex justify-content-end">
                          <div className="btn-group btn-group-sm w-100">
                            <button 
                              type="button" 
                              className="btn btn-outline-primary fw-medium px-3"
                              onClick={handleExpandAll}
                            >
                              Expand All
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline-secondary fw-medium px-3"
                              onClick={handleCollapseAll}
                            >
                              Collapse All
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Categories Accordion */}
                      <div className="services-accordion-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredCategories.map((category) => {
                          const selectedInCategory = category.services.filter(s => 
                            values.service_required.includes(s.value)
                          );
                          const isOtherCategory = category.title === 'Other Services';
                          const hasOtherSelected = isOtherCategory && values.service_required.some(s => s === 'Other' || s.startsWith('Other: '));
                          const selectedCount = selectedInCategory.length + (hasOtherSelected ? 1 : 0);
                          const totalCount = category.services.length;

                          const isExpanded = serviceSearch ? true : !!expandedCategories[category.title];

                          return (
                            <div key={category.title} className="card border mb-2 overflow-hidden shadow-none rounded-3">
                              <div 
                                className="card-header bg-light d-flex justify-content-between align-items-center cursor-pointer py-2.5 px-3"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => toggleCategory(category.title)}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fs-5">{category.emoji}</span>
                                  <span className="fw-bold text-dark small">{category.title}</span>
                                  <span className={`badge ${selectedCount > 0 ? 'bg-primary-subtle text-primary border border-primary' : 'bg-secondary-subtle text-secondary'} rounded-pill smaller`}>
                                    {selectedCount}/{totalCount} Selected
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="btn-group btn-group-xs">
                                    <button 
                                      type="button" 
                                      className="btn btn-outline-primary btn-xs py-0.5 px-2" 
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => handleSelectAllCategory(category.services)}
                                    >
                                      Select All
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-outline-secondary btn-xs py-0.5 px-2" 
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => handleClearAllCategory(category.services)}
                                    >
                                      Clear All
                                    </button>
                                  </div>
                                  <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
                                </div>
                              </div>
                              
                              <div 
                                className={`collapse ${isExpanded ? 'show' : ''}`}
                                style={{ transition: 'all 0.3s ease-out' }}
                              >
                                <div className="card-body py-3 px-3 bg-white">
                                  <div className="row g-2">
                                    {category.services.map((service) => {
                                      const isOtherItem = service.value === 'Other';
                                      const isChecked = isOtherItem 
                                        ? values.service_required.some(s => s === 'Other' || s.startsWith('Other: '))
                                        : values.service_required.includes(service.value);

                                      return (
                                        <div key={service.value} className="col-md-6 col-lg-4">
                                          <div className={`form-check p-2 rounded border hover-bg-light transition h-100 d-flex flex-column justify-content-center ${isChecked ? 'border-primary bg-primary bg-opacity-10' : 'border-light-subtle'}`}>
                                            <div className="d-flex align-items-center">
                                              <input
                                                className="form-check-input ms-1 me-2 flex-shrink-0"
                                                type="checkbox"
                                                id={`service_${service.value}`}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  if (isOtherItem) {
                                                    if (e.target.checked) {
                                                      handleChange('service_required', [...values.service_required, 'Other']);
                                                    } else {
                                                      handleChange('service_required', values.service_required.filter(s => s !== 'Other' && !s.startsWith('Other: ')));
                                                    }
                                                  } else {
                                                    if (e.target.checked) {
                                                      handleChange('service_required', [...values.service_required, service.value]);
                                                    } else {
                                                      handleChange('service_required', values.service_required.filter(s => s !== service.value));
                                                    }
                                                  }
                                                }}
                                              />
                                              <label className="form-check-label small cursor-pointer flex-grow-1" htmlFor={`service_${service.value}`}>
                                                {service.label}
                                              </label>
                                            </div>
                                            {isOtherItem && isChecked && (
                                              <div className="mt-2 px-2 pb-1" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  placeholder="Enter custom requirement..."
                                                  value={
                                                    values.service_required.find(s => s.startsWith('Other: '))?.replace('Other: ', '') || ''
                                                  }
                                                  onChange={(e) => {
                                                    const newText = e.target.value;
                                                    const updated = values.service_required.filter(s => s !== 'Other' && !s.startsWith('Other: '));
                                                    if (newText.trim()) {
                                                      updated.push(`Other: ${newText}`);
                                                    } else {
                                                      updated.push('Other');
                                                    }
                                                    handleChange('service_required', updated);
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {errors.service_required && (
                        <div className="text-danger smaller mt-1 fw-medium animate-fade-in">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          {errors.service_required}
                        </div>
                      )}
                    </div>

                    {/* PROJECT DETAILS SECTION */}
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                        <i className="bi bi-clipboard me-2"></i>Project Details
                      </h6>
                    </div>
                    <div className="col-12">
                      <FormField label="Client Requirements" name="client_requirements" type="textarea" value={values.client_requirements} onChange={handleChange} placeholder="Describe client's requirements" rows={3} />
                    </div>
                    <div className="col-12">
                      <FormField label="Details Given" name="details_given" type="textarea" value={values.details_given} onChange={handleChange} placeholder="Details provided by client" rows={3} />
                    </div>
                    <div className="col-12">
                      <FormField label="Competitor Websites" name="competitor_websites" type="textarea" value={values.competitor_websites} onChange={handleChange} placeholder="List competitor or reference websites" rows={3} />
                    </div>

                    {/* DOCUMENTS & CREDENTIALS SECTION */}
                    <div className="col-12 mt-3">
                      <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                        <i className="bi bi-file-earmark me-2"></i>Documents & Credentials
                      </h6>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold mb-2">Documents Given</label>
                      <div className="row g-2">
                        {['Logo', 'Brochures', 'Content', 'Drawings'].map(doc => (
                          <div key={doc} className="col-md-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`doc_${doc}`}
                                checked={values.documents_given.includes(doc)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setValues({ ...values, documents_given: [...values.documents_given, doc] });
                                  } else {
                                    setValues({ ...values, documents_given: values.documents_given.filter(d => d !== doc) });
                                  }
                                }}
                              />
                              <label className="form-check-label small" htmlFor={`doc_${doc}`}>{doc}</label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold mb-2">Login Credentials</label>
                      <div className="row g-2">
                        {['Website', 'Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'Meta Business Suite'].map(cred => (
                          <div key={cred} className="col-md-4">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`cred_${cred}`}
                                checked={values.login_credentials.includes(cred)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setValues({ ...values, login_credentials: [...values.login_credentials, cred] });
                                  } else {
                                    setValues({ ...values, login_credentials: values.login_credentials.filter(c => c !== cred) });
                                  }
                                }}
                              />
                              <label className="form-check-label small" htmlFor={`cred_${cred}`}>{cred}</label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LEAD STATUS SECTION (Edit Only) */}
                    {editingLead && (
                      <>
                        <div className="col-12 mt-3">
                          <h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">
                            <i className="bi bi-check-circle me-2"></i>Lead Status
                          </h6>
                        </div>
                        <div className="col-md-6">
                          <FormField label="Status" name="status" type="select" value={values.status} onChange={handleChange} options={[
                            { label: 'New', value: 'new' },
                            { label: 'Contacted', value: 'contacted' },
                            { label: 'Qualified', value: 'qualified' },
                            { label: 'Converted', value: 'converted' },
                            { label: 'Lost', value: 'lost' }
                          ]} />
                        </div>
                        <div className="col-md-6">
                          <FormField label="Converted Project ID" name="converted_project_id" type="number" value={values.converted_project_id} onChange={handleChange} placeholder="Project ID" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 bg-white pb-4 px-4 gap-2 flex-shrink-0">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setModalOpen(false)}>Discard</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={isSubmitting}>
                    {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : (editingLead ? 'Save Changes' : 'Confirm Registration')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal - ENHANCED WITH NEW SECTIONS */}
      {isDetailsModalOpen && selectedLead && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
          <div className="modal-dialog modal-xl" style={{ maxHeight: '95vh', display: 'flex', margin: 'auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg d-flex flex-column" style={{ maxHeight: '95vh', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-white pt-4 px-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedLead.name}</h5>
                  <p className="text-secondary smaller mb-0">{selectedLead.email} | {selectedLead.phone}</p>
                </div>
                <button type="button" className="btn-close" onClick={handleCloseDetails}></button>
              </div>
              <div className="modal-body p-4 bg-light" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
                <div className="row g-4">
                  {/* LEAD INFO SECTION */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm p-3">
                      <h6 className="fw-bold mb-3"><i className="bi bi-person-circle me-2 text-primary"></i>Lead Information</h6>
                      <div className="row g-3">
                        <div className="col-md-6"><div className="small text-muted">Full Name</div><div className="fw-bold text-dark">{selectedLead.name}</div></div>
                        <div className="col-md-6"><div className="small text-muted">Email</div><div className="fw-bold text-dark">{selectedLead.email}</div></div>
                        <div className="col-md-6"><div className="small text-muted">Phone</div><div className="fw-bold text-dark">{selectedLead.phone || 'N/A'}</div></div>
                        <div className="col-md-6"><div className="small text-muted">Company</div><div className="fw-bold text-dark">{selectedLead.company_name || 'N/A'}</div></div>
                        <div className="col-md-6"><div className="small text-muted">Status</div><span className={`badge rounded-pill ${selectedLead.status === 'converted' ? 'bg-success' : 'bg-primary'}`}>{selectedLead.status}</span></div>
                        <div className="col-md-6"><div className="small text-muted">Source</div><span className="badge bg-light text-dark border fw-normal">{selectedLead.source}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* SOURCE INFO SECTION */}
                  {(selectedLead.enquiry_from || selectedLead.how_contacted || selectedLead.contacted_person || selectedLead.reference_person) && (
                    <div className="col-12">
                      <div className="card border-0 shadow-sm p-3">
                        <h6 className="fw-bold mb-3"><i className="bi bi-funnel me-2 text-primary"></i>Enquiry Source</h6>
                        <div className="row g-3">
                          {selectedLead.enquiry_from && <div className="col-md-6"><div className="small text-muted">Enquiry From</div><div className="fw-bold text-dark">{selectedLead.enquiry_from}</div></div>}
                          {selectedLead.how_contacted && <div className="col-md-6"><div className="small text-muted">How Contacted</div><div className="fw-bold text-dark">{selectedLead.how_contacted}</div></div>}
                          {selectedLead.contacted_person && <div className="col-md-6"><div className="small text-muted">Contacted Person</div><div className="fw-bold text-dark">{selectedLead.contacted_person}</div></div>}
                          {selectedLead.reference_person && <div className="col-md-6"><div className="small text-muted">Reference Person</div><div className="fw-bold text-dark">{selectedLead.reference_person}</div></div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SERVICES SECTION */}
                  {selectedLead.service_required && selectedLead.service_required.length > 0 && (
                    <div className="col-12">
                      <div className="card border-0 shadow-sm p-3">
                        <h6 className="fw-bold mb-3"><i className="bi bi-gear me-2 text-primary"></i>Services Required</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedLead.service_required.map(service => (
                            <span key={service} className="badge bg-primary-subtle text-primary border border-primary">{service}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROJECT DETAILS SECTION */}
                  {(selectedLead.client_requirements || selectedLead.details_given || selectedLead.competitor_websites) && (
                    <div className="col-12">
                      <div className="card border-0 shadow-sm p-3">
                        <h6 className="fw-bold mb-3"><i className="bi bi-clipboard me-2 text-primary"></i>Project Details</h6>
                        <div className="row g-3">
                          {selectedLead.client_requirements && <div className="col-12"><div className="small text-muted">Client Requirements</div><div className="text-dark bg-white p-2 rounded border-start border-3 border-primary">{selectedLead.client_requirements}</div></div>}
                          {selectedLead.details_given && <div className="col-12"><div className="small text-muted">Details Given</div><div className="text-dark bg-white p-2 rounded border-start border-3 border-primary">{selectedLead.details_given}</div></div>}
                          {selectedLead.competitor_websites && <div className="col-12"><div className="small text-muted">Competitor/Reference Websites</div><div className="text-dark bg-white p-2 rounded border-start border-3 border-primary">{selectedLead.competitor_websites}</div></div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DOCUMENTS SECTION */}
                  {selectedLead.documents_given && selectedLead.documents_given.length > 0 && (
                    <div className="col-12">
                      <div className="card border-0 shadow-sm p-3">
                        <h6 className="fw-bold mb-3"><i className="bi bi-file-earmark me-2 text-primary"></i>Documents Given</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedLead.documents_given.map(doc => (
                            <span key={doc} className="badge bg-success-subtle text-success border border-success"><i className="bi bi-file-earmark me-1"></i>{doc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOGIN CREDENTIALS SECTION */}
                  {selectedLead.login_credentials && selectedLead.login_credentials.length > 0 && (
                    <div className="col-12">
                      <div className="card border-0 shadow-sm p-3">
                        <h6 className="fw-bold mb-3"><i className="bi bi-key me-2 text-primary"></i>Login Credentials</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedLead.login_credentials.map(cred => (
                            <span key={cred} className="badge bg-warning-subtle text-warning border border-warning"><i className="bi bi-lock me-1"></i>{cred}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ASSIGNMENTS SECTION */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100 p-3">
                      <h6 className="fw-bold mb-3"><i className="bi bi-person-badge me-2 text-primary"></i>Assignments</h6>
                      
                      {assignmentToast && (
                        <div className={`alert alert-${assignmentToast.type} alert-dismissible fade show small py-2 px-3 mb-3 border-0 rounded-3 shadow-sm`} role="alert">
                          {assignmentToast.message}
                          <button type="button" className="btn-close py-2.5 px-3 small" onClick={() => setAssignmentToast(null)} style={{ fontSize: '0.65rem' }}></button>
                        </div>
                      )}

                      <form onSubmit={handleAssignExec} className="mb-3">
                        <div className="input-group input-group-sm">
                          <select 
                            name="sales_exec_id" 
                            className="form-select bg-light border-0" 
                            value={selectedExecId}
                            onChange={(e) => setSelectedExecId(e.target.value)}
                            required
                          >
                            {assignableUsers.length === 0 ? (
                              <option value="">No Sales Executives Available</option>
                            ) : (
                              <>
                                <option value="">Select Executive</option>
                                {assignableUsers.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.name || u.username}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                          <button type="submit" className="btn btn-primary"><i className="bi bi-plus"></i></button>
                        </div>
                      </form>
                      {assignments.length === 0 ? (
                        <p className="text-muted smaller italic">No executives assigned yet.</p>
                      ) : (
                        <ul className="list-group list-group-flush">
                          {Array.isArray(assignments) && assignments.map(a => (
                            <li key={a.id} className="list-group-item bg-transparent px-0 py-2 border-0 d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-bold small">{a.sales_exec_details?.name || 'Unknown'}</div>
                                <div className="smaller text-muted">Assigned: {new Date(a.assigned_at).toLocaleDateString()}</div>
                              </div>
                              <button className="btn btn-sm text-danger p-0 ms-2" onClick={() => handleDeleteAssignmentClick(a)} title="Remove Assignment">
                                <i className="bi bi-x-circle"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* FOLLOW-UPS SECTION */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-3 mb-4">
                      <h6 className="fw-bold mb-3"><i className="bi bi-chat-dots me-2 text-primary"></i>Follow-up History</h6>
                      <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                        {followups.length === 0 ? (
                          <p className="text-muted smaller italic text-center py-4">No follow-up history found.</p>
                        ) : (
                          <div className="timeline-simple">
                            {followups.map(f => (
                              <div key={f.id} className="mb-3 border-start border-primary border-3 ps-3 py-1">
                                <div className="d-flex justify-content-between">
                                  <span className="badge bg-primary-subtle text-primary smaller text-uppercase">{f.followup_type}</span>
                                  <span className="smaller text-muted">{new Date(f.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="small mb-1 mt-1 text-dark">{f.notes}</p>
                                {f.next_followup && <div className="smaller fw-bold text-warning">Next: {f.next_followup}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card border-0 shadow-sm p-3">
                      <h6 className="fw-bold mb-3"><i className="bi bi-plus-circle me-2 text-success"></i>New Follow-up</h6>
                      <form onSubmit={handleAddFollowup}>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <select name="followup_type" className="form-select form-select-sm bg-light border-0" required>
                              <option value="call">Call</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="meeting">Meeting</option>
                              <option value="email">Email</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input name="next_followup" type="date" className="form-control form-control-sm bg-light border-0" />
                          </div>
                          <div className="col-12">
                            <textarea name="notes" className="form-control form-control-sm bg-light border-0" rows={2} placeholder="Add notes here..." required></textarea>
                          </div>
                          <div className="col-12 text-end">
                            <button type="submit" className="btn btn-success btn-sm fw-bold px-3">Log Follow-up</button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Convert Lead Modal */}
      {isConvertModalOpen && convertingLead && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1060 }}>
          <div className="modal-dialog modal-lg" style={{ display: 'flex', margin: 'auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <form onSubmit={convertForm.handleSubmit} noValidate>
                <div className="modal-header border-0 bg-white pt-4 px-4">
                  <h5 className="modal-title fw-bold text-dark">Convert Lead to Project</h5>
                  <button type="button" className="btn-close" onClick={() => setConvertModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-12"><h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">Client Information</h6></div>
                    <div className="col-md-6">
                      <FormField label="Client Name" name="clientName" value={convertForm.values.clientName} onChange={convertForm.handleChange} error={convertForm.errors.clientName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Company Name" name="companyName" value={convertForm.values.companyName} onChange={convertForm.handleChange} error={convertForm.errors.companyName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Email" name="email" type="email" value={convertForm.values.email} onChange={convertForm.handleChange} />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Phone" name="phone" value={convertForm.values.phone} onChange={convertForm.handleChange} />
                    </div>
                    <div className="col-12">
                      <FormField label="Address" name="address" type="textarea" value={convertForm.values.address} onChange={convertForm.handleChange} rows={2} />
                    </div>

                    <div className="col-12 mt-4"><h6 className="fw-bold text-primary small uppercase border-bottom pb-2 mb-3">Project Details</h6></div>
                    <div className="col-12">
                      <FormField label="Project Name" name="projectName" value={convertForm.values.projectName} onChange={convertForm.handleChange} error={convertForm.errors.projectName} required />
                    </div>
                    <div className="col-md-6">
                      <FormField 
                        label="Department" 
                        name="departmentId" 
                        type="select" 
                        value={convertForm.values.departmentId} 
                        onChange={convertForm.handleChange} 
                        error={convertForm.errors.departmentId} 
                        required 
                      options={(Array.isArray(departments) ? departments : [])
  .filter(d => d && d.id)
  .map(d => ({
    label: d.name ?? '',
    value: String(d.id)
  }))
}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField 
                        label="Project Manager" 
                        name="projectManagerId" 
                        type="select" 
                        value={convertForm.values.projectManagerId} 
                        onChange={convertForm.handleChange} 
                        error={convertForm.errors.projectManagerId} 
                        required 
                    options={(Array.isArray(users) ? users : [])
  .filter(u =>
    u &&
    (u.role_name === UserRole.PROJECT_MANAGER ||
     u.role_name === UserRole.SUPER_ADMIN)
  )
  .map(u => ({
    label: u.name ?? '',
    value: String(u.id)
  }))
}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormField label="Start Date" name="startDate" type="date" value={convertForm.values.startDate} onChange={convertForm.handleChange} error={convertForm.errors.startDate} required />
                    </div>
                    <div className="col-md-6">
                      <FormField label="End Date" name="endDate" type="date" value={convertForm.values.endDate} onChange={convertForm.handleChange} error={convertForm.errors.endDate} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-white pb-4 px-4 gap-2">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setConvertModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={convertForm.isSubmitting}>
                    {convertForm.isSubmitting ? 'Converting...' : 'Convert & Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
{assignmentDeleteModal && assignmentToDelete && (
  <DeleteConfirmModal
    isOpen={assignmentDeleteModal}
    title="Remove Assignment"
    message={`Remove ${assignmentToDelete.sales_exec_details?.name}?`}
    onClose={() => {
      setAssignmentDeleteModal(false);
      setAssignmentToDelete(null);
    }}
    onConfirm={handleConfirmAssignmentDelete}
  />
)}

    {deleteModalOpen && leadToDelete && (
  <DeleteConfirmModal
    isOpen={deleteModalOpen}
    title="Delete Lead"
    message={`Are you sure you want to delete "${leadToDelete.name}"? This action cannot be undone.`}
    onClose={() => {
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    }}
    onConfirm={handleConfirmDelete}
  />
)}
     </>
  );
};

export default LeadsPage;
