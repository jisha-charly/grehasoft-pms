import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import {
  Globe, Zap, TrendingUp, Shield, Download, Plus,
  BarChart3, Link2, Settings, MapPin, Users,
  CheckCircle2, AlertCircle, FileText, Trash2, Edit3, Eye, Upload, Filter, Calendar,
  ArrowLeft, EyeOff, Lock, Unlock, Key, Search, Clock
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";

import {
  SEOWebsite, SEOKeyword, SEODailyWorkLog, SEODailyWorkLogItem, SEOMonthlyTarget, SEOTask, SEOReminder, SEOActivityType, Client, User, SEOCredential
} from "../../types";
import { useAlert } from "../../hooks/useAlert";
import { AlertVariant } from "../../types/alert";
import { getErrorMessage } from "../../utils/getErrorMessage";
import ConfirmModal from "../../components/ConfirmModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import SeoActivityTypesPage from "./SeoActivityTypesPage";

const SEOPage: React.FC = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const location = useLocation();
  const navigate = useNavigate();

  // Deletion and Approval Modal States
  const [showDeleteWebsiteModal, setShowDeleteWebsiteModal] = useState(false);
  const [deleteWebsiteId, setDeleteWebsiteId] = useState<number | null>(null);

  const [showDeleteKeywordModal, setShowDeleteKeywordModal] = useState(false);
  const [deleteKeywordId, setDeleteKeywordId] = useState<number | null>(null);

  const [showDeleteCredentialModal, setShowDeleteCredentialModal] = useState(false);
  const [deleteCredentialId, setDeleteCredentialId] = useState<number | null>(null);

  const [showDeleteTargetModal, setShowDeleteTargetModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null);
  const isManager = user?.is_superuser || user?.role === "SUPER_ADMIN" || user?.role === "SEO_MANAGER";

  // Tab State
  const [activeTab, setActiveTab] = useState<string>(isManager ? "dashboard" : "performance");
  const [detailTab, setDetailTab] = useState<string>("overview");

  // Data States
  const [websites, setWebsites] = useState<SEOWebsite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);
  const [activityTypes, setActivityTypes] = useState<SEOActivityType[]>([]);
  const [dailyLogs, setDailyLogs] = useState<SEODailyWorkLog[]>([]);
  const [targets, setTargets] = useState<SEOMonthlyTarget[]>([]);
  const [tasks, setTasks] = useState<SEOTask[]>([]);
  const [reminders, setReminders] = useState<SEOReminder[]>([]);
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [credentials, setCredentials] = useState<SEOCredential[]>([]);

  // Selection & Loading States
  const [selectedWebsite, setSelectedWebsite] = useState<SEOWebsite | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Forms State
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [websiteForm, setWebsiteForm] = useState<Partial<SEOWebsite>>({
    website_name: "", domain_url: "", package_plan: "basic", target_country: "", status: "active", notes: ""
  });
  const [websiteEditingId, setWebsiteEditingId] = useState<number | null>(null);

  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywordForm, setKeywordForm] = useState<Partial<SEOKeyword>>({
    keyword: "", search_volume: 0, difficulty_score: 0.0, priority: "medium", target_rank: 10, current_rank: 100, notes: ""
  });
  const [keywordEditingId, setKeywordEditingId] = useState<number | null>(null);

  // Credentials Modal State
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credentialForm, setCredentialForm] = useState({
    platform: "", username: "", password: "", notes: ""
  });
  const [credentialEditingId, setCredentialEditingId] = useState<number | null>(null);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<number, boolean>>({});
  const [visibleSubmitPasswords, setVisibleSubmitPasswords] = useState<Record<number, boolean>>({});
  const [visibleActivityPasswords, setVisibleActivityPasswords] = useState<Record<string, boolean>>({});

  // Daily Work Log Multi-Row Form
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [activeLaunchTask, setActiveLaunchTask] = useState<SEOTask | null>(null);
  const [expandedTaskHistoryId, setExpandedTaskHistoryId] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTab, setReviewTab] = useState<'submissions' | 'attachments' | 'timeline'>('submissions');
  const [reviewingTask, setReviewingTask] = useState<SEOTask | null>(null);
  const [managerReviewRemarks, setManagerReviewRemarks] = useState("");
  const [logForm, setLogForm] = useState<{
    website: string;
    log_date: string;
    remarks: string;
    status: string;
    seo_task?: string | number | null;
  }>({
    website: "", log_date: new Date().toISOString().split("T")[0], remarks: "", status: "submitted", seo_task: null
  });
  const [logItems, setLogItems] = useState<Partial<SEODailyWorkLogItem>[]>([
    { activity_type: undefined, count: 1, keyword: "", submission_url: "", domain_authority: null, spam_score: null, time_spent_minutes: null, username: "", password: "" }
  ]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [logEditingId, setLogEditingId] = useState<number | null>(null);
  const [existingLogItems, setExistingLogItems] = useState<SEODailyWorkLogItem[]>([]);
  const [duplicateLogWarning, setDuplicateLogWarning] = useState<string | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);

  // Rejection Remarks Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingLogId, setRejectingLogId] = useState<number | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  // Targets Form Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({
    executive: "", website: "", month: new Date().toISOString().slice(0, 7), activity_type: "", target_count: 50
  });
  const [targetViewAchievement, setTargetViewAchievement] = useState<boolean>(false);

  // Task & Reminder Creation Modals (Manager)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", website: "", assigned_executive: "", due_date: "", priority: "medium", activity_type: "", status: "pending"
  });

  // Tasks Filtering & Search & Sorting State
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [taskTotalCount, setTaskTotalCount] = useState(0);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [taskFilterWebsite, setTaskFilterWebsite] = useState("");
  const [taskFilterExecutive, setTaskFilterExecutive] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState("");
  const [taskFilterPriority, setTaskFilterPriority] = useState("");
  const [taskFilterActivityType, setTaskFilterActivityType] = useState("");
  const [taskSort, setTaskSort] = useState("-created_at");
  const [taskSearch, setTaskSearch] = useState("");
  const [debouncedTaskSearch, setDebouncedTaskSearch] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    ready_for_review: 0,
    completed: 0,
    overdue: 0,
    avg_completion_time: 0,
    avg_review_time: 0
  });

  const handleLaunchWorkLogFromTask = (task: SEOTask) => {
    setActiveLaunchTask(task);
    setLogForm({
      website: String(task.website),
      log_date: new Date().toISOString().split("T")[0],
      remarks: "",
      status: "submitted",
      seo_task: task.id
    });
    setLogItems([
      {
        activity_type: task.activity_type ? task.activity_type : undefined as any,
        count: 1,
        keyword: "",
        submission_url: "",
        domain_authority: null,
        spam_score: null,
        time_spent_minutes: null,
        username: "",
        password: ""
      }
    ]);
    setVisibleSubmitPasswords({});
    setExistingLogItems([]);
    setDuplicateLogWarning(null);
    setIsEditingDraft(false);
    setShowWorkLogModal(true);
  };

  const handleMarkReadyForReview = async (taskId: number) => {
    try {
      await axiosInstance.post(`/seo-tasks/${taskId}/ready-for-review/`);
      loadAllData();
      fetchTasks();
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Task marked as ready for review."
      });
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to mark task ready for review."
      });
    }
  };

  const handleTaskReview = async (action: 'approve' | 'reject') => {
    if (!reviewingTask) return;
    
    if (action === 'reject' && !managerReviewRemarks.trim()) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Rejection requires remarks."
      });
      return;
    }

    try {
      await axiosInstance.post(`/seo-tasks/${reviewingTask.id}/review/`, {
        action,
        remarks: managerReviewRemarks
      });
      setShowReviewModal(false);
      setReviewingTask(null);
      setManagerReviewRemarks("");
      loadAllData();
      fetchTasks();
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: `Task successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: `Failed to ${action} task.`
      });
    }
  };

  const handleApproveIndividualLog = async (logId: number) => {
    try {
      await axiosInstance.post(`/seo-daily-logs/${logId}/approve/`);
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Individual log approved."
      });
      loadAllData();
      const updatedTasksRes = await axiosInstance.get(`/seo-tasks/`);
      const allTasks: SEOTask[] = updatedTasksRes.data.results || [];
      const current = allTasks.find(t => t.id === reviewingTask?.id);
      if (current) {
        setReviewingTask(current);
      }
      fetchTasks();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to approve log."
      });
    }
  };

  const handleRejectIndividualLog = async (logId: number) => {
    const remarks = prompt("Enter remarks for rejecting this log:");
    if (remarks === null) return;
    if (!remarks.trim()) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Rejection remarks are required."
      });
      return;
    }

    try {
      await axiosInstance.post(`/seo-daily-logs/${logId}/reject/`, {
        remarks_by_manager: remarks
      });
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Individual log rejected."
      });
      loadAllData();
      const updatedTasksRes = await axiosInstance.get(`/seo-tasks/`);
      const allTasks: SEOTask[] = updatedTasksRes.data.results || [];
      const current = allTasks.find(t => t.id === reviewingTask?.id);
      if (current) {
        setReviewingTask(current);
      }
      fetchTasks();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to reject log."
      });
    }
  };

  // URL sync active tab & action triggers
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }

    const action = params.get("action");
    if (action === "submit-work") {
      setLogForm({
        website: "",
        log_date: new Date().toISOString().split("T")[0],
        remarks: "",
        status: "submitted"
      });
      setLogItems([{ activity_type: undefined as any, count: 1, keyword: "", submission_url: "", domain_authority: null, spam_score: null, time_spent_minutes: null, username: "", password: "" }]);
      setVisibleSubmitPasswords({});
      setExistingLogItems([]);
      setDuplicateLogWarning(null);
      setIsEditingDraft(false);
      setShowWorkLogModal(true);

      // Clean parameter so it doesn't trigger modal again on refresh
      const newParams = new URLSearchParams(location.search);
      newParams.delete("action");
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [location.search, navigate]);

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTaskSearch(taskSearch);
      setTaskPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [taskSearch]);

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(taskPage));
      params.append("page_size", String(taskPageSize));
      
      if (taskFilterWebsite) params.append("website", taskFilterWebsite);
      if (taskFilterExecutive) params.append("executive", taskFilterExecutive);
      if (taskFilterStatus) params.append("status", taskFilterStatus);
      if (taskFilterPriority) params.append("priority", taskFilterPriority);
      if (taskFilterActivityType) params.append("activity_type", taskFilterActivityType);
      
      let orderingVal = "newest";
      if (taskSort === "created_at") orderingVal = "oldest";
      else if (taskSort === "due_date") orderingVal = "due_date";
      else if (taskSort === "priority") orderingVal = "priority";
      else if (taskSort === "title") orderingVal = "title";
      params.append("ordering", orderingVal);

      if (debouncedTaskSearch) params.append("search", debouncedTaskSearch);

      const res = await axiosInstance.get(`/seo-tasks/?${params.toString()}`);
      setTasks(res.data.results || []);
      setTaskTotalCount(res.data.count || 0);
      setTaskTotalPages(Math.ceil((res.data.count || 0) / taskPageSize) || 1);
      if (res.data.stats) {
        setTaskStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [taskPage, taskPageSize, taskFilterWebsite, taskFilterExecutive, taskFilterStatus, taskFilterPriority, taskFilterActivityType, taskSort, debouncedTaskSearch]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setTaskPage(1);
  };

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "", description: "", website: "", assigned_executive: "", due_date: "", priority: "medium"
  });

  // Reports Filter & Import
  const [reportsFilter, setReportsFilter] = useState({
    status: "", website: "", executive: "", activity_type: "", keyword: "", start_date: "", end_date: ""
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  /* ================= FETCH METHODS ================= */

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [webRes, clientRes, userRes, actTypeRes, logRes, targetRes, taskRes, reminderRes, credRes] = await Promise.all([
        axiosInstance.get("/websites/").catch(err => {
          console.error("Failed to load websites", err);
          throw err; // Critical, throw to trigger fallback
        }),
        (isManager ? axiosInstance.get("/clients/?all=true") : Promise.resolve({ data: [] as any })).catch(err => {
          console.error("Failed to load clients", err);
          return { data: [] };
        }),
        (isManager ? axiosInstance.get("/users/?all=true&role_name=SEO_EXECUTIVE&is_active=true") : Promise.resolve({ data: [] })).catch(err => {
          console.error("Failed to load users", err);
          return { data: [] };
        }),
        axiosInstance.get("/seo/activity-types/").catch(err => {
          console.error("Failed to load activity types", err);
          showAlert({
            variant: AlertVariant.ERROR,
            message: "Failed to load Activity Types from API."
          });
          return { data: { results: [] } };
        }),
        axiosInstance.get("/seo-daily-logs/").catch(err => {
          console.error("Failed to load daily logs", err);
          return { data: [] };
        }),
        axiosInstance.get("/seo-monthly-targets/").catch(err => {
          console.error("Failed to load monthly targets", err);
          return { data: [] };
        }),
        Promise.resolve({ data: { results: [] } as any }),
        axiosInstance.get("/seo-reminders/").catch(err => {
          console.error("Failed to load reminders", err);
          return { data: [] };
        }),
        axiosInstance.get("/seo-credentials/").catch(err => {
          console.error("Failed to load credentials", err);
          return { data: [] };
        })
      ]);

      setWebsites(webRes.data.results || webRes.data || []);
      setClients(clientRes.data.results || clientRes.data || []);
      
      const allUsers = userRes.data.results || userRes.data || [];
      // Filter users who can act as executives
      setExecutives(allUsers.filter((u: User) => u.role_name === "SEO_EXECUTIVE" || u.role === "SEO_EXECUTIVE"));

      setActivityTypes(actTypeRes.data.results || actTypeRes.data || []);
      setDailyLogs(logRes.data.results || logRes.data || []);
      setTargets(targetRes.data.results || targetRes.data || []);
      setTasks(taskRes.data.results || taskRes.data || []);
      setReminders(reminderRes.data.results || reminderRes.data || []);
      setCredentials(credRes.data.results || credRes.data || []);

      // Fetch dashboard summaries
      try {
        const dashRes = await axiosInstance.get("/seo-daily-logs/dashboard/");
        setDashboardData(dashRes.data);
      } catch (dashErr) {
        console.error("Failed to load dashboard data", dashErr);
      }

      if (isManager) {
        try {
          const perfRes = await axiosInstance.get("/seo-daily-logs/team-performance/");
          setPerformanceData(perfRes.data);
        } catch (perfErr) {
          console.error("Failed to load team performance", perfErr);
        }
      }
    } catch (err) {
      console.error("Critical error loading SEO data", err);
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Failed to load initial SEO data."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!showWorkLogModal || isEditingDraft) return;

    const checkDuplicate = () => {
      if (!logForm.website || !logForm.log_date) {
        setDuplicateLogWarning(null);
        setExistingLogItems([]);
        setLogEditingId(null);
        return;
      }

      const match = dailyLogs.find(
        (log) =>
          String(log.website) === String(logForm.website) &&
          log.log_date === logForm.log_date
      );

      if (match) {
        setDuplicateLogWarning(
          "Existing work log found for this date. New activities will be added to the same log."
        );
        setExistingLogItems(match.items || []);
        setLogEditingId(match.id);
        if (!logForm.remarks && match.remarks) {
          setLogForm(prev => ({ ...prev, remarks: match.remarks || "" }));
        }
      } else {
        setDuplicateLogWarning(null);
        setExistingLogItems([]);
        setLogEditingId(null);
      }
    };

    checkDuplicate();
  }, [logForm.website, logForm.log_date, dailyLogs, showWorkLogModal, isEditingDraft]);

  const loadKeywords = async (websiteId: number) => {
    try {
      const res = await axiosInstance.get(`/seo-keywords/?website=${websiteId}`);
      setKeywords(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error loading keywords", err);
    }
  };

  const selectWebsiteWithKeywords = (site: SEOWebsite) => {
    setSelectedWebsite(site);
    loadKeywords(site.id);
  };

  /* ================= CRUD HANDLERS ================= */

  // WEBSITES CRUD
  const handleWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (websiteEditingId) {
        await axiosInstance.put(`/websites/${websiteEditingId}/`, websiteForm);
      } else {
        await axiosInstance.post("/websites/", websiteForm);
      }
      setShowWebsiteModal(false);
      setWebsiteForm({ website_name: "", domain_url: "", package_plan: "basic", target_country: "", status: "active", notes: "" });
      setWebsiteEditingId(null);
      loadAllData();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error saving website. Make sure Client is selected."
      });
    }
  };

  const handleEditWebsite = (site: SEOWebsite) => {
    setWebsiteEditingId(site.id);
    setWebsiteForm(site);
    setShowWebsiteModal(true);
  };

  const handleDeleteWebsiteClick = (id: number) => {
    setDeleteWebsiteId(id);
    setShowDeleteWebsiteModal(true);
  };

  const handleConfirmDeleteWebsite = async () => {
    if (deleteWebsiteId !== null) {
      await axiosInstance.delete(`/websites/${deleteWebsiteId}/`);
      loadAllData();
    }
  };

  const handleDeleteTaskClick = (id: number) => {
    setDeleteTaskId(id);
    setShowDeleteTaskModal(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (deleteTaskId !== null) {
      try {
        await axiosInstance.delete(`/seo-tasks/${deleteTaskId}/`);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Task deleted successfully."
        });
        setShowDeleteTaskModal(false);
        setDeleteTaskId(null);
        
        // Automatic navigation to previous page if the last task on current page is deleted
        if (taskPage > 1 && tasks.length === 1) {
          setTaskPage(prev => prev - 1);
        } else {
          fetchTasks();
        }
      } catch (err) {
        showAlert({
          variant: AlertVariant.ERROR,
          message: "Error deleting task."
        });
      }
    }
  };

  // KEYWORDS CRUD
  const handleKeywordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsite) return;
    try {
      const payload = { ...keywordForm, website: selectedWebsite.id };
      if (keywordEditingId) {
        await axiosInstance.put(`/seo-keywords/${keywordEditingId}/`, payload);
      } else {
        await axiosInstance.post("/seo-keywords/", payload);
      }
      setShowKeywordModal(false);
      setKeywordForm({ keyword: "", search_volume: 0, difficulty_score: 0.0, priority: "medium", target_rank: 10, current_rank: 100, notes: "" });
      setKeywordEditingId(null);
      loadKeywords(selectedWebsite.id);
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error saving keyword."
      });
    }
  };

  const handleEditKeyword = (kw: SEOKeyword) => {
    setKeywordEditingId(kw.id);
    setKeywordForm(kw);
    setShowKeywordModal(true);
  };

  const handleDeleteKeywordClick = (id: number) => {
    setDeleteKeywordId(id);
    setShowDeleteKeywordModal(true);
  };

  const handleConfirmDeleteKeyword = async () => {
    if (deleteKeywordId !== null) {
      await axiosInstance.delete(`/seo-keywords/${deleteKeywordId}/`);
      if (selectedWebsite) loadKeywords(selectedWebsite.id);
    }
  };

  // CREDENTIALS CRUD
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsite) return;
    try {
      const payload = {
        ...credentialForm,
        website: selectedWebsite.id
      };
      if (credentialEditingId) {
        await axiosInstance.put(`/seo-credentials/${credentialEditingId}/`, payload);
      } else {
        await axiosInstance.post("/seo-credentials/", payload);
      }
      setShowCredentialModal(false);
      setCredentialForm({ platform: "", username: "", password: "", notes: "" });
      setCredentialEditingId(null);
      
      // Reload credentials list
      const res = await axiosInstance.get("/seo-credentials/");
      setCredentials(res.data.results || res.data || []);
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error saving credential."
      });
    }
  };

  const handleEditCredential = (cred: SEOCredential) => {
    setCredentialEditingId(cred.id);
    setCredentialForm({
      platform: cred.platform,
      username: cred.username,
      password: cred.decrypted_password || "",
      notes: cred.notes || ""
    });
    setShowCredentialModal(true);
  };

  const handleDeleteCredentialClick = (id: number) => {
    setDeleteCredentialId(id);
    setShowDeleteCredentialModal(true);
  };

  const handleConfirmDeleteCredential = async () => {
    if (deleteCredentialId !== null) {
      await axiosInstance.delete(`/seo-credentials/${deleteCredentialId}/`);
      const res = await axiosInstance.get("/seo-credentials/");
      setCredentials(res.data.results || res.data || []);
    }
  };

  const handleConfirmDeleteTarget = async () => {
    if (deleteTargetId !== null) {
      await axiosInstance.delete(`/seo-monthly-targets/${deleteTargetId}/`);
      loadAllData();
    }
  };

  // WORK LOG CRUD & WORKFLOW
  const handleAddLogItem = () => {
    setLogItems([...logItems, { activity_type: undefined, count: 1, keyword: "", submission_url: "", domain_authority: null, spam_score: null, time_spent_minutes: null, username: "", password: "" }]);
  };

  const handleRemoveLogItem = (idx: number) => {
    setLogItems(logItems.filter((_, i) => i !== idx));
  };

  const handleLogItemChange = (idx: number, field: string, val: any) => {
    const newItems = [...logItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setLogItems(newItems);
  };

  const handleWorkLogSubmit = async (statusVal: "draft" | "submitted") => {
    if (!logForm.website) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Please select a website."
      });
      return;
    }
    const hasInvalidActivityType = logItems.some(item => !item.activity_type);
    if (hasInvalidActivityType) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Please select a valid Activity Type for all rows."
      });
      return;
    }

    const cleanItems = logItems.filter(item => item.activity_type && item.count);
    if (cleanItems.length === 0) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Please add at least one activity item."
      });
      return;
    }

    try {
      const payload = {
        website: Number(logForm.website),
        log_date: logForm.log_date,
        remarks: logForm.remarks,
        status: statusVal,
        seo_task: logForm.seo_task ? Number(logForm.seo_task) : null,
        items: cleanItems.map(it => ({
          activity_type: Number(it.activity_type),
          count: Number(it.count),
          keyword: it.keyword || "",
          submission_url: it.submission_url || "",
          domain_authority: it.domain_authority ? Number(it.domain_authority) : null,
          spam_score: it.spam_score ? Number(it.spam_score) : null,
          time_spent_minutes: it.time_spent_minutes ? Number(it.time_spent_minutes) : null,
          username: it.username || "",
          password: it.password || ""
        }))
      };

      // Step 1: Post JSON payload (nested items work perfectly)
      // Step 1: Post/Patch payload based on flow
      let logId: number;
      if (logEditingId) {
        if (isEditingDraft) {
          const res = await axiosInstance.patch(`/seo-daily-logs/${logEditingId}/`, payload);
          logId = res.data.id;
        } else {
          const res = await axiosInstance.post("/seo-daily-logs/add-items/", payload);
          logId = res.data.id;
        }
      } else {
        const res = await axiosInstance.post("/seo-daily-logs/", payload);
        logId = res.data.id;
      }

      // Step 2: Upload file if present
      if (proofFile && logId) {
        const fileForm = new FormData();
        fileForm.append("proof_file", proofFile);
        await axiosInstance.patch(`/seo-daily-logs/${logId}/`, fileForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setShowWorkLogModal(false);
      setLogForm({ website: "", log_date: new Date().toISOString().split("T")[0], remarks: "", status: "submitted", seo_task: null });
      setLogItems([{ activity_type: undefined, count: 1, keyword: "", submission_url: "", domain_authority: null, spam_score: null, time_spent_minutes: null, username: "", password: "" }]);
      setProofFile(null);
      setLogEditingId(null);
      setExistingLogItems([]);
      setDuplicateLogWarning(null);
      setIsEditingDraft(false);
      setVisibleSubmitPasswords({});
      setActiveLaunchTask(null);
      loadAllData();
      showAlert({
        variant: AlertVariant.SUCCESS,
        message: "Work log saved successfully."
      });
    } catch (err: any) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: getErrorMessage(err)
      });
    }
  };

  const handleEditWorkLog = (log: SEODailyWorkLog) => {
    setIsEditingDraft(true);
    setDuplicateLogWarning(null);
    setExistingLogItems([]);
    setLogEditingId(log.id);
    setLogForm({
      website: String(log.website),
      log_date: log.log_date,
      remarks: log.remarks || "",
      status: log.status
    });
    setLogItems(log.items.map(it => ({
      activity_type: it.activity_type,
      count: it.count,
      keyword: it.keyword || "",
      submission_url: it.submission_url || "",
      domain_authority: it.domain_authority || null,
      spam_score: it.spam_score || null,
      time_spent_minutes: it.time_spent_minutes || null,
      username: it.username || "",
      password: it.decrypted_password || ""
    })));
    setVisibleSubmitPasswords({});
    setShowWorkLogModal(true);
  };

  const handleApproveLogClick = (id: number) => {
    setApproveTargetId(id);
    setShowApproveModal(true);
  };

  const handleConfirmApproveLog = async () => {
    if (approveTargetId !== null) {
      await axiosInstance.post(`/seo-daily-logs/${approveTargetId}/approve/`);
      loadAllData();
    }
  };

  const handleOpenRejectModal = (id: number) => {
    setRejectingLogId(id);
    setRejectionRemarks("");
    setShowRejectModal(true);
  };

  const handleRejectLog = async () => {
    if (!rejectionRemarks) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Remarks are required."
      });
      return;
    }
    try {
      await axiosInstance.post(`/seo-daily-logs/${rejectingLogId}/reject/`, {
        remarks_by_manager: rejectionRemarks
      });
      setShowRejectModal(false);
      loadAllData();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error rejecting log."
      });
    }
  };

  // TARGETS CRUD
  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...targetForm,
        website: targetForm.website ? Number(targetForm.website) : null,
        executive: Number(targetForm.executive),
        activity_type: Number(targetForm.activity_type),
        target_count: Number(targetForm.target_count)
      };
      await axiosInstance.post("/seo-monthly-targets/", payload);
      setShowTargetModal(false);
      setTargetForm({ executive: "", website: "", month: new Date().toISOString().slice(0, 7), activity_type: "", target_count: 50 });
      loadAllData();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error setting target."
      });
    }
  };

  // TASKS & REMINDERS CRUD
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        website: Number(taskForm.website),
        assigned_executive: Number(taskForm.assigned_executive),
        due_date: taskForm.due_date,
        priority: taskForm.priority,
        activity_type: taskForm.activity_type ? Number(taskForm.activity_type) : null,
        status: taskForm.status
      };
      
      if (editingTaskId) {
        await axiosInstance.put(`/seo-tasks/${editingTaskId}/`, payload);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Task updated successfully."
        });
      } else {
        await axiosInstance.post("/seo-tasks/", payload);
        showAlert({
          variant: AlertVariant.SUCCESS,
          message: "Task created successfully."
        });
      }
      setShowTaskModal(false);
      setEditingTaskId(null);
      setTaskForm({ title: "", description: "", website: "", assigned_executive: "", due_date: "", priority: "medium", activity_type: "", status: "pending" });
      fetchTasks();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error saving task."
      });
    }
  };

  const handleToggleTaskStatus = async (task: SEOTask) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    await axiosInstance.patch(`/seo-tasks/${task.id}/`, { status: newStatus });
    fetchTasks();
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...reminderForm,
        website: Number(reminderForm.website),
        assigned_executive: Number(reminderForm.assigned_executive)
      };
      await axiosInstance.post("/seo-reminders/", payload);
      setShowReminderModal(false);
      setReminderForm({ title: "", description: "", website: "", assigned_executive: "", due_date: "", priority: "medium" });
      loadAllData();
    } catch (err) {
      showAlert({
        variant: AlertVariant.ERROR,
        message: "Error creating reminder."
      });
    }
  };



  const handleToggleReminderStatus = async (rem: SEOReminder) => {
    const newStatus = rem.status === "pending" ? "completed" : "pending";
    await axiosInstance.patch(`/seo-reminders/${rem.id}/`, { status: newStatus });
    loadAllData();
  };

  /* ================= EXPORT & IMPORT ================= */

  const handleExportExcel = () => {
    const params = new URLSearchParams(reportsFilter).toString();
    window.open(`${import.meta.env.VITE_API_URL}/seo-daily-logs/export-report/?${params}`, "_blank");
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams({ ...reportsFilter, format: "pdf" }).toString();
    window.open(`${import.meta.env.VITE_API_URL}/seo-daily-logs/export-report/?${params}`, "_blank");
  };

  const handleImportExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      showAlert({
        variant: AlertVariant.WARNING,
        message: "Please select a file."
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", importFile);

    try {
      setImportErrors([]);
      setImportSuccessMsg("");
      const res = await axiosInstance.post("/seo-daily-logs/import-excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImportSuccessMsg(`Successfully imported ${res.data.imported_count} work logs!`);
      setImportFile(null);
      loadAllData();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setImportErrors(err.response.data.errors);
      } else {
        showAlert({
          variant: AlertVariant.ERROR,
          message: getErrorMessage(err)
        });
      }
    }
  };

  const getCompletedCountForTarget = (tg: SEOMonthlyTarget) => {
    const logsInMonth = dailyLogs.filter(log => {
      if (tg.website && log.website !== tg.website) return false;
      if (log.executive !== tg.executive) return false;
      if (!log.log_date.startsWith(tg.month)) return false;
      if (log.status !== "approved" && log.status !== "submitted") return false;
      return true;
    });

    let sum = 0;
    logsInMonth.forEach(log => {
      log.items.forEach(item => {
        if (item.activity_type === tg.activity_type) {
          sum += item.count;
        }
      });
    });
    return sum;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const kpis = dashboardData?.kpis || {};
  const trendData = dashboardData?.monthly_trend || [];
  const typeData = dashboardData?.activities_by_type || [];

  return (
    <div className="container-fluid py-4" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* HEADER BANNER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 p-4 rounded-4 shadow-sm bg-white border">
        <div>
          <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 fw-semibold">
            {isManager ? "SEO Team Manager Dashboard" : "SEO Executive Portal"}
          </span>
          <h2 className="fw-bold text-dark mb-0">Welcome, {user?.name || user?.username}!</h2>
          <p className="text-muted small mb-0 mt-1">Replace sheets with interactive target planning and activity trackers.</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">

          {isManager && (
            <>
              <button className="btn btn-outline-primary shadow-sm rounded-3 px-3 py-2" onClick={() => setShowWebsiteModal(true)}>
                <Plus size={16} className="me-2" /> Add Website
              </button>
              <button className="btn btn-primary shadow-sm rounded-3 px-3 py-2" onClick={() => setShowTargetModal(true)}>
                <Plus size={16} className="me-2" /> Set Targets
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-white border-0 py-3">
          <ul className="nav nav-pills nav-fill gap-2">
            {isManager ? (
              <>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "dashboard" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("dashboard")}>
                    <BarChart3 size={16} className="me-2" /> Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "websites" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("websites")}>
                    <Globe size={16} className="me-2" /> SEO Websites
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "activities" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("activities")}>
                    <Link2 size={16} className="me-2" /> Activities
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "targets" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("targets")}>
                    <TrendingUp size={16} className="me-2" /> Monthly Targets
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "performance" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("performance")}>
                    <Users size={16} className="me-2" /> Team Performance
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "reports" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("reports")}>
                    <FileText size={16} className="me-2" /> Reports & Import
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "activity-types" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("activity-types")}>
                    <Settings size={16} className="me-2" /> Activity Types
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "tasks" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("tasks")}>
                    <CheckCircle2 size={16} className="me-2" /> Tasks & Reminders
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "performance" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("performance")}>
                    <TrendingUp size={16} className="me-2" /> My Performance
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "websites" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("websites")}>
                    <Globe size={16} className="me-2" /> My Assigned Websites
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "activities" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("activities")}>
                    <Link2 size={16} className="me-2" /> My Activities
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "targets" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("targets")}>
                    <TrendingUp size={16} className="me-2" /> My Monthly Targets
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link rounded-3 fw-bold ${activeTab === "tasks" ? "active btn-primary" : "text-secondary"}`} onClick={() => setActiveTab("tasks")}>
                    <CheckCircle2 size={16} className="me-2" /> My Tasks & Reminders
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* ================= TAB 1: MANAGER DASHBOARD ================= */}
      {activeTab === "dashboard" && isManager && (
        <div>
          {/* KPI CARDS ROW 1 */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-primary-subtle text-primary rounded-3 me-3">
                    <Users size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Total Clients</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.total_clients || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-success-subtle text-success rounded-3 me-3">
                    <Globe size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Total Websites</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.total_websites || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-info-subtle text-info rounded-3 me-3">
                    <Users size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Total Executives</small>
                    <h3 className="fw-bold mb-0 mt-1">{executives.length}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-warning-subtle text-warning rounded-3 me-3">
                    <Zap size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Active Projects</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.active_projects || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI CARDS ROW 2 */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-indigo text-white rounded-3 me-3" style={{ background: "#6366F1" }}>
                    <Link2 size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Activities Today</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.activities_today || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-teal text-white rounded-3 me-3" style={{ background: "#14B8A6" }}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Activities This Month</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.activities_this_month || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-danger-subtle text-danger rounded-3 me-3">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Pending Reviews</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.pending_reviews || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-3 bg-primary-subtle text-primary rounded-3 me-3">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Targets Completion %</small>
                    <h3 className="fw-bold mb-0 mt-1">{kpis.target_completion_pct || 0}%</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP PERFORMING EXEC ROW */}
          <div className="alert alert-primary border-0 shadow-sm rounded-4 p-3 d-flex align-items-center mb-4">
            <span className="fs-5 me-2">🏆</span>
            <div>
              <b>Top Performing Executive:</b> <span className="fw-semibold text-primary">{kpis.top_performing_executive || "N/A"}</span> this month.
            </div>
          </div>

          {/* CHARTS ROW 1 */}
          <div className="row g-4 mb-4">
            {/* Monthly Trend AreaChart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <TrendingUp size={18} className="me-2 text-primary" /> Monthly Trend
                </h5>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#6B7280" />
                      <YAxis axisLine={false} tickLine={false} stroke="#6B7280" />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                      <Area type="monotone" dataKey="activities" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity Type Distribution PieChart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <Zap size={18} className="me-2 text-warning" /> Activity Type Distribution
                </h5>
                <div style={{ height: 260 }}>
                  {typeData.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data available for this month.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="type"
                        >
                          {typeData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"][index % 7]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS ROW 2 */}
          <div className="row g-4">
            {/* Website Performance BarChart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <Globe size={18} className="me-2 text-success" /> Website Performance
                </h5>
                <div style={{ height: 260 }}>
                  {(!dashboardData?.activities_by_website || dashboardData.activities_by_website.length === 0) ? (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.activities_by_website}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="website" axisLine={false} tickLine={false} stroke="#6B7280" />
                        <YAxis axisLine={false} tickLine={false} stroke="#6B7280" />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                        <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Executive Productivity BarChart */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <Users size={18} className="me-2 text-info" /> Executive Productivity
                </h5>
                <div style={{ height: 260 }}>
                  {(!dashboardData?.activities_by_executive || dashboardData.activities_by_executive.length === 0) ? (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.activities_by_executive}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="executive" axisLine={false} tickLine={false} stroke="#6B7280" />
                        <YAxis axisLine={false} tickLine={false} stroke="#6B7280" />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }} />
                        <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: EXECUTIVE PERFORMANCE ================= */}
      {activeTab === "performance" && !isManager && (
        <div>
          {/* KPI CARDS */}
          <div className="row g-4 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-3 bg-primary-subtle text-primary rounded-3 me-3">
                    <Link2 size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Today's Work Count</small>
                    <h3 className="fw-bold mb-0 mt-1">{dashboardData?.kpis?.today_count || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-3 bg-success-subtle text-success rounded-3 me-3">
                    <Globe size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Assigned Websites</small>
                    <h3 className="fw-bold mb-0 mt-1">{dashboardData?.kpis?.assigned_websites || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-3 bg-warning-subtle text-warning rounded-3 me-3">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Pending Tasks</small>
                    <h3 className="fw-bold mb-0 mt-1">{dashboardData?.kpis?.pending_tasks || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-3 bg-danger-subtle text-danger rounded-3 me-3">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase">Pending Reminders</small>
                    <h3 className="fw-bold mb-0 mt-1">{dashboardData?.kpis?.pending_reminders || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TARGETS SUMMARY SECTION */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-4">My Monthly Activity Targets</h5>
            <div className="row g-4">
              {dashboardData?.targets?.length === 0 ? (
                <div className="col-12 text-muted text-center py-4">No targets set by manager for this month yet.</div>
              ) : (
                dashboardData?.targets?.map((tg: any, i: number) => (
                  <div key={i} className="col-md-6 col-lg-4">
                    <div className="p-3 border rounded-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">{tg.activity_type}</span>
                        <span className="badge bg-secondary">{tg.completed} / {tg.target}</span>
                      </div>
                      <div className="progress rounded-pill mb-2" style={{ height: "8px" }}>
                        <div className="progress-bar bg-success" role="progressbar" style={{ width: `${Math.min(tg.progress, 100)}%` }}></div>
                      </div>
                      <small className="text-muted">Progress: {tg.progress}%</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: WEBSITES ================= */}
      {activeTab === "websites" && (
        selectedWebsite ? (
          // WEBSITE-CENTRIC WORKSPACE
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            {/* Workspace Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center px-3 py-2" onClick={() => setSelectedWebsite(null)}>
                  <ArrowLeft size={16} className="me-2" /> Back to Websites
                </button>
                <div>
                  <h3 className="fw-bold mb-1 text-dark">{selectedWebsite.website_name}</h3>
                  <a href={selectedWebsite.domain_url.startsWith("http") ? selectedWebsite.domain_url : `https://${selectedWebsite.domain_url}`} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none small d-flex align-items-center">
                    <Globe size={14} className="me-1" /> {selectedWebsite.domain_url}
                  </a>
                </div>
              </div>
              <div className="mt-3 mt-md-0 d-flex gap-2">
                <span className={`badge bg-${selectedWebsite.status === "active" ? "success" : "danger"} align-self-center px-3 py-2 fs-7`}>
                  {selectedWebsite.status.toUpperCase()}
                </span>
                <span className="badge bg-info-subtle text-info align-self-center px-3 py-2 fs-7 text-capitalize">
                  {selectedWebsite.package_plan} Plan
                </span>
                {isManager && (
                  <button className="btn btn-outline-primary btn-sm rounded-3 px-3" onClick={() => handleEditWebsite(selectedWebsite)}>
                    <Edit3 size={14} className="me-1" /> Edit Website
                  </button>
                )}
              </div>
            </div>

            {/* Workspace Sub-Tabs */}
            <div className="mb-4">
              <ul className="nav nav-tabs border-bottom">
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "overview" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("overview")}>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "keywords" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("keywords")}>
                    Keywords
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "credentials" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("credentials")}>
                    Credentials
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "activities" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("activities")}>
                    Activities
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "targets" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("targets")}>
                    Targets
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "tasks" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("tasks")}>
                    Tasks
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link fw-bold border-0 px-4 py-2.5 ${detailTab === "reminders" ? "active border-bottom border-primary text-primary" : "text-secondary"}`} onClick={() => setDetailTab("reminders")}>
                    Reminders
                  </button>
                </li>
              </ul>
            </div>

            {/* Workspace Content */}
            <div className="py-2">
              {/* 1. Overview Tab */}
              {detailTab === "overview" && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 bg-light h-100 shadow-sm">
                      <h6 className="fw-bold mb-4 text-primary text-uppercase font-monospace tracking-wider">General Information</h6>
                      <table className="table table-borderless table-sm small mb-0">
                        <tbody>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2" style={{ width: "35%" }}>Client:</td>
                            <td className="fw-bold text-dark py-2">{selectedWebsite.client_name}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Start Date:</td>
                            <td className="text-dark py-2">{selectedWebsite.start_date || "Not Set"}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Package Plan:</td>
                            <td className="text-dark py-2 text-capitalize">{selectedWebsite.package_plan}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Target Country:</td>
                            <td className="text-dark py-2">{selectedWebsite.target_country || "Global"}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Status:</td>
                            <td className="py-2">
                              <span className={`badge bg-${selectedWebsite.status === "active" ? "success" : "danger"}`}>{selectedWebsite.status}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted fw-semibold py-2">General Notes:</td>
                            <td className="text-dark py-2" style={{ whiteSpace: "pre-wrap" }}>{selectedWebsite.notes || "No additional notes."}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-4 border rounded-4 bg-light h-100 shadow-sm">
                      <h6 className="fw-bold mb-4 text-primary text-uppercase font-monospace tracking-wider">Configuration & Team</h6>
                      <table className="table table-borderless table-sm small mb-4">
                        <tbody>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2" style={{ width: "40%" }}>Search Console ID:</td>
                            <td className="text-dark font-monospace py-2">{selectedWebsite.google_search_console_id || "Not Integrated"}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Google Analytics ID:</td>
                            <td className="text-dark font-monospace py-2">{selectedWebsite.google_analytics_id || "Not Integrated"}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Sitemap URL:</td>
                            <td className="py-2">
                              {selectedWebsite.sitemap_url ? (
                                <a href={selectedWebsite.sitemap_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-semibold">
                                  {selectedWebsite.sitemap_url}
                                </a>
                              ) : (
                                <span className="text-muted">No sitemap configured</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <h6 className="fw-bold mb-3 text-primary text-uppercase font-monospace tracking-wider">Assignment & Audit</h6>
                      <table className="table table-borderless table-sm small mb-0">
                        <tbody>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2" style={{ width: "40%" }}>Assigned Executive:</td>
                            <td className="fw-bold text-dark py-2">{selectedWebsite.executive_name || "Unassigned"}</td>
                          </tr>
                          <tr className="border-bottom">
                            <td className="text-muted fw-semibold py-2">Assigned By:</td>
                            <td className="text-dark py-2">{selectedWebsite.assigned_by_name || "System"}</td>
                          </tr>
                          <tr>
                            <td className="text-muted fw-semibold py-2">Assigned Date:</td>
                            <td className="text-dark py-2">
                              {selectedWebsite.assigned_date ? new Date(selectedWebsite.assigned_date).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Keywords Tab */}
              {detailTab === "keywords" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Website Target Keywords</h5>
                    {isManager && (
                      <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                        setKeywordEditingId(null);
                        setKeywordForm({ keyword: "", search_volume: 0, difficulty_score: 0, priority: "medium", target_rank: 10, current_rank: 100, notes: "" });
                        setShowKeywordModal(true);
                      }}>
                        <Plus size={14} className="me-1" /> Add Keyword
                      </button>
                    )}
                  </div>
                  {keywords.length === 0 ? (
                    <div className="text-center py-5 text-muted bg-light border rounded-3">No target keywords added for this website yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle table-hover border">
                        <thead className="table-light">
                          <tr>
                            <th>Keyword</th>
                            <th>Priority</th>
                            <th className="text-center">Search Volume</th>
                            <th className="text-center">Difficulty</th>
                            <th className="text-center">Current Rank</th>
                            <th className="text-center">Target Rank</th>
                            {isManager && <th className="text-end">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {keywords.map(kw => (
                            <tr key={kw.id}>
                              <td className="fw-bold">{kw.keyword}</td>
                              <td>
                                <span className={`badge bg-${kw.priority === "high" ? "danger" : kw.priority === "medium" ? "warning" : "info"}`}>
                                  {kw.priority}
                                </span>
                              </td>
                              <td className="text-center">{kw.search_volume}</td>
                              <td className="text-center">{kw.difficulty_score}%</td>
                              <td className="text-center">
                                <span className="badge bg-secondary">#{kw.current_rank}</span>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-primary">#{kw.target_rank}</span>
                              </td>
                              {isManager && (
                                <td className="text-end">
                                  <button className="btn btn-sm btn-light me-1" onClick={() => handleEditKeyword(kw)}>
                                    <Edit3 size={14} />
                                  </button>
                                  <button className="btn btn-sm btn-light text-danger" onClick={() => handleDeleteKeywordClick(kw.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Credentials Tab */}
              {detailTab === "credentials" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Website Credentials</h5>
                    {isManager && (
                      <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                        setCredentialEditingId(null);
                        setCredentialForm({ platform: "", username: "", password: "", notes: "" });
                        setShowCredentialModal(true);
                      }}>
                        <Plus size={14} className="me-1" /> Add Credential
                      </button>
                    )}
                  </div>
                  {credentials.filter(c => c.website === selectedWebsite.id).length === 0 ? (
                    <div className="text-center py-5 text-muted bg-light border rounded-3">No credentials configured for this website.</div>
                  ) : (
                    <div className="row g-3">
                      {credentials.filter(c => c.website === selectedWebsite.id).map(cred => (
                        <div key={cred.id} className="col-md-6">
                          <div className="card p-3 border shadow-sm rounded-4 bg-light">
                            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2">
                              <h6 className="fw-bold mb-0 text-primary">{cred.platform}</h6>
                              {isManager && (
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-light" onClick={() => handleEditCredential(cred)}>
                                    <Edit3 size={12} />
                                  </button>
                                  <button className="btn btn-sm btn-light text-danger" onClick={() => handleDeleteCredentialClick(cred.id)}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <table className="table table-sm table-borderless small mb-0">
                              <tbody>
                                <tr>
                                  <td className="text-muted fw-bold" style={{ width: "30%" }}>Username:</td>
                                  <td className="font-monospace text-dark fw-semibold">{cred.username}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted fw-bold">Password:</td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="font-monospace me-2 bg-white px-2 py-1 rounded border text-dark fw-bold">
                                        {visiblePasswordIds[cred.id] ? cred.decrypted_password : "••••••••"}
                                      </span>
                                      <button
                                        className="btn btn-sm btn-light p-1 rounded-circle"
                                        type="button"
                                        onClick={() => setVisiblePasswordIds(prev => ({ ...prev, [cred.id]: !prev[cred.id] }))}
                                      >
                                        {visiblePasswordIds[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {cred.notes && (
                                  <tr>
                                    <td className="text-muted fw-bold">Notes:</td>
                                    <td className="text-muted">{cred.notes}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Activities Tab */}
              {detailTab === "activities" && (
                <div>
                  <h5 className="fw-bold text-dark mb-3">Activities History</h5>
                  <div className="table-responsive">
                    <table className="table align-middle table-hover border">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Executive</th>
                          <th className="text-center">Total Activities</th>
                          <th>Status</th>
                          <th>Proof</th>
                          <th>Work Details</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyLogs.filter(log => log.website === selectedWebsite.id).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5 text-muted">No daily logs found for this website.</td>
                          </tr>
                        ) : (
                          dailyLogs.filter(log => log.website === selectedWebsite.id).map(log => (
                            <tr key={log.id}>
                              <td className="fw-semibold">{log.log_date}</td>
                              <td>{log.executive_name}</td>
                              <td className="text-center fw-bold">{log.total_count}</td>
                              <td>
                                <span className={`badge bg-${log.status === "approved" ? "success" : log.status === "rejected" ? "danger" : log.status === "submitted" ? "info" : "secondary"}`}>
                                  {log.status}
                                </span>
                                {log.status === "rejected" && log.remarks_by_manager && (
                                  <small className="d-block text-danger mt-1">Remarks: {log.remarks_by_manager}</small>
                                )}
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1 align-items-center">
                                  {log.proof_files && log.proof_files.length > 0 ? (
                                    log.proof_files.map((p, pIdx) => (
                                      <a
                                        key={p.id}
                                        href={p.proof_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-xs btn-outline-primary py-0.5 px-1.5 d-inline-flex align-items-center text-decoration-none"
                                        style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                                      >
                                        <Eye size={10} className="me-1" /> Proof #{pIdx + 1}
                                      </a>
                                    ))
                                  ) : log.proof_file ? (
                                    <a href={log.proof_file} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline-primary py-1 px-2 d-inline-flex align-items-center text-decoration-none">
                                      <Eye size={12} className="me-1" /> View Proof
                                    </a>
                                  ) : (
                                    <span className="text-muted small">No Proof</span>
                                  )}
                                </div>
                              </td>
                              <td className="small">
                                <div className="d-flex flex-column gap-1">
                                  {log.items?.map((it, idx) => (
                                    <div key={idx} className="border-bottom pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                      • <b>{it.activity_type_name}</b>: count={it.count}
                                      {it.keyword && ` | KW: ${it.keyword}`}
                                      {it.domain_authority !== null && ` | DA: ${it.domain_authority}`}
                                      {it.spam_score !== null && ` | SS: ${it.spam_score}%`}
                                      {it.time_spent_minutes !== null && ` | Time: ${it.time_spent_minutes}m`}
                                      {it.username && ` | User: ${it.username}`}
                                      {it.decrypted_password && (
                                        <span className="d-inline-flex align-items-center gap-1 ms-1">
                                          | Pass: 
                                          <span className="font-monospace bg-white px-1 border rounded text-dark">
                                            {visibleActivityPasswords[`${it.id || (log.id + '-' + idx)}`] ? it.decrypted_password : "••••••••"}
                                          </span>
                                          <button
                                            className="btn btn-xs btn-light p-0 d-inline-flex align-items-center justify-content-center"
                                            style={{ width: "16px", height: "16px" }}
                                            type="button"
                                            onClick={() => setVisibleActivityPasswords(prev => ({
                                              ...prev,
                                              [`${it.id || (log.id + '-' + idx)}`]: !prev[`${it.id || (log.id + '-' + idx)}`]
                                            }))}
                                          >
                                            {visibleActivityPasswords[`${it.id || (log.id + '-' + idx)}`] ? <EyeOff size={10} /> : <Eye size={10} />}
                                          </button>
                                        </span>
                                      )}
                                      {it.submission_url && (
                                        <div className="text-primary font-monospace mt-0.5" style={{ fontSize: "0.75rem", wordBreak: "break-all", whiteSpace: "pre-line" }}>
                                          URL(s):<br />{it.submission_url}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="text-end">
                                {isManager && log.status === "submitted" && (
                                  <>
                                    <button className="btn btn-sm btn-success me-1" onClick={() => handleApproveLogClick(log.id)}>Approve</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleOpenRejectModal(log.id)}>Reject</button>
                                  </>
                                )}
                                {!isManager && (log.status === "draft" || log.status === "rejected") && (
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditWorkLog(log)}>Edit</button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Targets Tab */}
              {detailTab === "targets" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Monthly Target Progress Tracker</h5>
                    {isManager && (
                      <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                        setTargetForm({ executive: "", website: String(selectedWebsite.id), month: new Date().toISOString().slice(0, 7), activity_type: "", target_count: 50 });
                        setShowTargetModal(true);
                      }}>
                        <Plus size={14} className="me-1" /> Add Target
                      </button>
                    )}
                  </div>
                  {targets.filter(tg => tg.website === selectedWebsite.id).length === 0 ? (
                    <div className="text-center py-5 text-muted bg-light border rounded-3">No targets set for this website.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle border">
                        <thead className="table-light">
                          <tr>
                            <th>Executive</th>
                            <th>Month</th>
                            <th>Activity Type</th>
                            <th className="text-center">Target</th>
                            <th className="text-center">Completed</th>
                            <th className="text-center">Remaining</th>
                            <th>Achievement Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targets.filter(tg => tg.website === selectedWebsite.id).map(tg => {
                            const completed = getCompletedCountForTarget(tg);
                            const remaining = Math.max(0, tg.target_count - completed);
                            const pct = tg.target_count > 0 ? Math.round((completed / tg.target_count) * 100) : 0;
                            return (
                              <tr key={tg.id}>
                                <td className="fw-semibold">{tg.executive_name}</td>
                                <td>{tg.month}</td>
                                <td>{tg.activity_type_name}</td>
                                <td className="text-center fw-bold text-primary">{tg.target_count}</td>
                                <td className="text-center fw-bold text-success">{completed}</td>
                                <td className="text-center fw-bold text-warning">{remaining}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="progress w-100 me-2" style={{ height: "6px" }}>
                                      <div className={`progress-bar bg-${pct >= 100 ? "success" : "primary"}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                    <span className="small fw-bold">{pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Tasks Tab */}
              {detailTab === "tasks" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Tasks Checklist</h5>
                    {isManager && (
                      <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                        setEditingTaskId(null);
                        setTaskForm({ title: "", description: "", website: String(selectedWebsite.id), assigned_executive: "", due_date: "", priority: "medium", activity_type: "", status: "pending" });
                        setShowTaskModal(true);
                      }}>
                        <Plus size={14} className="me-1" /> Add Task
                      </button>
                    )}
                  </div>
                  {tasks.filter(t => t.website === selectedWebsite.id).length === 0 ? (
                    <div className="text-center py-5 text-muted bg-light border rounded-3">No tasks found.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {tasks.filter(t => t.website === selectedWebsite.id).map(t => (
                        <div key={t.id} className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={t.status === "completed"}
                              disabled={!isManager && t.assigned_executive !== user?.id}
                              onChange={() => handleToggleTaskStatus(t)}
                            />
                            <div>
                              <span className={`fw-bold ${t.status === "completed" ? "text-decoration-line-through text-muted" : "text-dark"}`}>{t.title}</span>
                              <p className="text-muted small mb-0 mt-1">{t.description}</p>
                              <div className="small text-muted mt-1">Due: <b>{t.due_date}</b> | Exec: {t.assigned_executive_name}</div>
                            </div>
                          </div>
                          <span className={`badge bg-${t.status === "completed" ? "success" : "warning"}`}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Reminders Tab */}
              {detailTab === "reminders" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">Reminders Settings</h5>
                    {isManager && (
                      <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                        setReminderForm({ title: "", description: "", website: String(selectedWebsite.id), assigned_executive: "", due_date: "", priority: "medium" });
                        setShowReminderModal(true);
                      }}>
                        <Plus size={14} className="me-1" /> Add Reminder
                      </button>
                    )}
                  </div>
                  {reminders.filter(r => r.website === selectedWebsite.id).length === 0 ? (
                    <div className="text-center py-5 text-muted bg-light border rounded-3">No reminders found.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {reminders.filter(r => r.website === selectedWebsite.id).map(r => (
                        <div key={r.id} className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={r.status === "completed"}
                              disabled={!isManager && r.assigned_executive !== user?.id}
                              onChange={() => handleToggleReminderStatus(r)}
                            />
                            <div>
                              <span className={`fw-bold ${r.status === "completed" ? "text-decoration-line-through text-muted" : "text-dark"}`}>{r.title}</span>
                              <p className="text-muted small mb-0 mt-1">{r.description}</p>
                              <div className="small text-muted mt-1">Due: <b>{r.due_date}</b> | Exec: {r.assigned_executive_name}</div>
                            </div>
                          </div>
                          <span className={`badge bg-${r.status === "completed" ? "success" : "warning"}`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // FULL WEBSITE LISTINGS
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="p-4 bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">SEO Websites</h5>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0 table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Website Name</th>
                    <th>Client</th>
                    <th>Start Date</th>
                    <th>Package</th>
                    <th>Assigned Exec</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {websites.map(site => (
                    <tr key={site.id} style={{ cursor: "pointer" }} onClick={() => selectWebsiteWithKeywords(site)}>
                      <td>
                        <div className="fw-bold">{site.website_name}</div>
                        <small className="text-primary">{site.domain_url}</small>
                      </td>
                      <td>{site.client_name}</td>
                      <td className="small">{site.start_date || "N/A"}</td>
                      <td>
                        <span className="badge bg-info text-capitalize">{site.package_plan}</span>
                      </td>
                      <td className="small">{site.executive_name || <span className="text-muted">Unassigned</span>}</td>
                      <td>
                        <span className={`badge bg-${site.status === "active" ? "success" : "danger"}`}>{site.status}</span>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        {isManager && (
                          <>
                            <button className="btn btn-sm btn-light me-1" onClick={() => handleEditWebsite(site)}>
                              <Edit3 size={14} />
                            </button>
                            <button className="btn btn-sm btn-light text-danger" onClick={() => handleDeleteWebsiteClick(site.id)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-primary ms-1" onClick={() => selectWebsiteWithKeywords(site)}>
                          <Eye size={14} className="me-1" /> Open Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ================= TAB 4: ACTIVITIES REVIEW / LOGS ================= */}
      {activeTab === "activities" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">{isManager ? "Review SEO Work Logs" : "My Work Logs"}</h5>
            {!isManager && (
              <button className="btn btn-sm btn-primary rounded-3" onClick={() => {
                setLogEditingId(null);
                setLogForm({
                  website: "",
                  log_date: new Date().toISOString().split("T")[0],
                  remarks: "",
                  status: "submitted"
                });
                setLogItems([{ activity_type: undefined, count: 1, keyword: "", submission_url: "", domain_authority: null, spam_score: null, time_spent_minutes: null, username: "", password: "" }]);
                setVisibleSubmitPasswords({});
                setExistingLogItems([]);
                setDuplicateLogWarning(null);
                setIsEditingDraft(false);
                setShowWorkLogModal(true);
              }}>
                <Plus size={14} className="me-2" /> Log Work
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Executive</th>
                  <th>Website</th>
                  <th>Date</th>
                  <th className="text-center">Total Activities</th>
                  <th>Status</th>
                  <th>Proof Document</th>
                  <th>Work Summary</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.executive_name}</td>
                    <td>{log.website_name}</td>
                    <td className="small">{log.log_date}</td>
                    <td className="text-center fw-bold">{log.total_count}</td>
                    <td>
                      <span className={`badge bg-${log.status === "approved" ? "success" : log.status === "rejected" ? "danger" : log.status === "submitted" ? "info" : "secondary"}`}>
                        {log.status}
                      </span>
                      {log.status === "rejected" && log.remarks_by_manager && (
                        <small className="d-block text-danger mt-1">Rejection Remarks: {log.remarks_by_manager}</small>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        {log.proof_files && log.proof_files.length > 0 ? (
                          log.proof_files.map((p, pIdx) => (
                            <a
                              key={p.id}
                              href={p.proof_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-outline-primary py-0.5 px-1.5 d-inline-flex align-items-center text-decoration-none"
                              style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                            >
                              <Eye size={10} className="me-1" /> Proof #{pIdx + 1}
                            </a>
                          ))
                        ) : log.proof_file ? (
                          <a href={log.proof_file} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center">
                            <Eye size={12} className="me-1" /> View Proof
                          </a>
                        ) : (
                          <span className="text-muted small">No Proof</span>
                        )}
                      </div>
                    </td>
                    <td className="small" style={{ minWidth: "250px" }}>
                      <div className="d-flex flex-column gap-2">
                        {log.items?.map((it, idx) => (
                          <div key={idx} className="border-bottom pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                            • <b>{it.activity_type_name}</b>: count={it.count}
                            {it.keyword && ` | KW: ${it.keyword}`}
                            {it.domain_authority !== null && ` | DA: ${it.domain_authority}`}
                            {it.spam_score !== null && ` | SS: ${it.spam_score}%`}
                            {it.time_spent_minutes !== null && ` | Time: ${it.time_spent_minutes}m`}
                            {it.username && ` | User: ${it.username}`}
                            {it.decrypted_password && (
                              <span className="d-inline-flex align-items-center gap-1 ms-1">
                                | Pass: 
                                <span className="font-monospace bg-white px-1 border rounded text-dark">
                                  {visibleActivityPasswords[`${it.id || (log.id + '-' + idx)}`] ? it.decrypted_password : "••••••••"}
                                </span>
                                <button
                                  className="btn btn-xs btn-light p-0 d-inline-flex align-items-center justify-content-center"
                                  style={{ width: "16px", height: "16px" }}
                                  type="button"
                                  onClick={() => setVisibleActivityPasswords(prev => ({
                                    ...prev,
                                    [`${it.id || (log.id + '-' + idx)}`]: !prev[`${it.id || (log.id + '-' + idx)}`]
                                  }))}
                                >
                                  {visibleActivityPasswords[`${it.id || (log.id + '-' + idx)}`] ? <EyeOff size={10} /> : <Eye size={10} />}
                                </button>
                              </span>
                            )}
                            {it.submission_url && (
                              <div className="text-primary font-monospace mt-0.5" style={{ fontSize: "0.75rem", wordBreak: "break-all", whiteSpace: "pre-line" }}>
                                URL(s):<br />{it.submission_url}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-end">
                      {isManager && log.status === "submitted" && (
                        <>
                          <button className="btn btn-sm btn-success me-1" onClick={() => handleApproveLogClick(log.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger me-1" onClick={() => handleOpenRejectModal(log.id)}>Reject</button>
                        </>
                      )}
                      {!isManager && (log.status === "draft" || log.status === "rejected") && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditWorkLog(log)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: MONTHLY TARGETS (MANAGER / EXECUTIVE) ================= */}
      {activeTab === "targets" && (
        <div>
          {/* Tracker Toggle Buttons */}
          {isManager ? (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0 text-dark">Monthly Activity Targets</h4>
              <div className="btn-group shadow-sm" role="group">
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 fw-semibold ${!targetViewAchievement ? "btn-primary" : "btn-outline-primary bg-white"}`}
                  onClick={() => setTargetViewAchievement(false)}
                >
                  Manage Targets
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 fw-semibold ${targetViewAchievement ? "btn-primary" : "btn-outline-primary bg-white"}`}
                  onClick={() => setTargetViewAchievement(true)}
                >
                  Achievement Tracker
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h4 className="fw-bold mb-0 text-dark">My Monthly Targets</h4>
            </div>
          )}

          {(!isManager || targetViewAchievement) ? (
            // TARGET TRACKING TABLE
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3">Targets vs Achievement Progress</h5>
              <div className="table-responsive">
                <table className="table align-middle border table-hover">
                  <thead className="table-light">
                    <tr>
                      {isManager && <th>Executive</th>}
                      <th>Website</th>
                      <th>Month</th>
                      <th>Activity Type</th>
                      <th className="text-center">Target Count</th>
                      <th className="text-center">Completed Count</th>
                      <th className="text-center">Remaining Count</th>
                      <th>Achievement Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.length === 0 ? (
                      <tr>
                        <td colSpan={isManager ? 8 : 7} className="text-center py-4 text-muted">No monthly targets configured.</td>
                      </tr>
                    ) : (
                      targets.map(tg => {
                        const completed = getCompletedCountForTarget(tg);
                        const remaining = Math.max(0, tg.target_count - completed);
                        const pct = tg.target_count > 0 ? Math.round((completed / tg.target_count) * 100) : 0;
                        return (
                          <tr key={tg.id}>
                            {isManager && <td className="fw-semibold">{tg.executive_name}</td>}
                            <td>{tg.website_name || <span className="text-muted">Overall (All)</span>}</td>
                            <td>{tg.month}</td>
                            <td>{tg.activity_type_name}</td>
                            <td className="text-center fw-bold text-primary">{tg.target_count}</td>
                            <td className="text-center fw-bold text-success">{completed}</td>
                            <td className="text-center fw-bold text-warning">{remaining}</td>
                            <td style={{ width: "20%" }}>
                              <div className="d-flex align-items-center">
                                <div className="progress w-100 me-2" style={{ height: "6px" }}>
                                  <div className={`progress-bar bg-${pct >= 100 ? "success" : "primary"}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                </div>
                                <span className="small fw-bold">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // MANAGE TARGETS VIEW
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                  <div className="p-4 border-bottom">
                    <h5 className="fw-bold mb-0">Set Monthly Activity Targets</h5>
                  </div>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Executive</th>
                          <th>Website</th>
                          <th>Month</th>
                          <th>Activity Type</th>
                          <th className="text-center">Target Count</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targets.map(tg => (
                          <tr key={tg.id}>
                            <td>{tg.executive_name}</td>
                            <td>{tg.website_name || <span className="text-muted">Overall</span>}</td>
                            <td>{tg.month}</td>
                            <td>{tg.activity_type_name}</td>
                            <td className="text-center fw-bold">{tg.target_count}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-light text-danger" onClick={() => {
                                setDeleteTargetId(tg.id);
                                setShowDeleteTargetModal(true);
                              }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h5 className="fw-bold mb-4">Set Executive Target</h5>
                  <form onSubmit={handleTargetSubmit}>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">SELECT EXECUTIVE</label>
                      <select className="form-select" value={targetForm.executive} onChange={e => setTargetForm({ ...targetForm, executive: e.target.value })} required>
                        <option value="">Select Executive</option>
                        {executives.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.name ? `${ex.name} (${ex.username})` : ex.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">SELECT WEBSITE (OPTIONAL)</label>
                      <select className="form-select" value={targetForm.website} onChange={e => setTargetForm({ ...targetForm, website: e.target.value })}>
                        <option value="">Overall Target (All Websites)</option>
                        {websites.map(site => (
                          <option key={site.id} value={site.id}>{site.website_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">TARGET MONTH (YYYY-MM)</label>
                      <input type="month" className="form-control" value={targetForm.month} onChange={e => setTargetForm({ ...targetForm, month: e.target.value })} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">ACTIVITY TYPE</label>
                      <select className="form-select" value={targetForm.activity_type} onChange={e => setTargetForm({ ...targetForm, activity_type: e.target.value })} required>
                        <option value="">Select Activity</option>
                        {activityTypes.map(act => (
                          <option key={act.id} value={act.id}>{act.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">TARGET COUNT</label>
                      <input type="number" className="form-control" min={1} value={targetForm.target_count} onChange={e => setTargetForm({ ...targetForm, target_count: Number(e.target.value) })} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-2 rounded-3 fw-bold mt-2">Save Target</button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: TEAM PERFORMANCE (MANAGER) ================= */}
      {activeTab === "performance" && isManager && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-4">SEO Executive Leaderboard & Productivity</h5>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "50px" }}>Rank</th>
                  <th>Executive Name</th>
                  <th className="text-center">Assigned Websites</th>
                  <th className="text-center">Activities Today</th>
                  <th className="text-center">Activities This Week</th>
                  <th className="text-center">Activities This Month</th>
                  <th className="text-center">Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((exec, idx) => (
                  <tr key={exec.id}>
                    <td className="fw-bold text-primary">#{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{exec.name}</div>
                      <small className="text-muted text-uppercase smaller font-monospace">SEO Executive</small>
                    </td>
                    <td className="text-center fw-bold text-primary">{exec.assigned_websites}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">{exec.activities_today}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">{exec.activities_this_week}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-success px-3 py-2 fw-bold">{exec.activities_this_month}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-info px-3 py-2 fw-bold">{exec.approval_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: REPORTS & EXPORT / IMPORT ================= */}
      {activeTab === "reports" && isManager && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold mb-4">Generate and Export Reports</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">WEBSITE</label>
                  <select className="form-select" value={reportsFilter.website} onChange={e => setReportsFilter({ ...reportsFilter, website: e.target.value })}>
                    <option value="">All Websites</option>
                    {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">EXECUTIVE</label>
                  <select className="form-select" value={reportsFilter.executive} onChange={e => setReportsFilter({ ...reportsFilter, executive: e.target.value })}>
                    <option value="">All Executives</option>
                    {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name || ex.username}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">STATUS</label>
                  <select className="form-select" value={reportsFilter.status} onChange={e => setReportsFilter({ ...reportsFilter, status: e.target.value })}>
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">ACTIVITY TYPE</label>
                  <select className="form-select" value={reportsFilter.activity_type} onChange={e => setReportsFilter({ ...reportsFilter, activity_type: e.target.value })}>
                    <option value="">All Activities</option>
                    {activityTypes.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">KEYWORD FILTER</label>
                  <input type="text" className="form-control" placeholder="Search keyword..." value={reportsFilter.keyword} onChange={e => setReportsFilter({ ...reportsFilter, keyword: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">START DATE</label>
                  <input type="date" className="form-control" value={reportsFilter.start_date} onChange={e => setReportsFilter({ ...reportsFilter, start_date: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">END DATE</label>
                  <input type="date" className="form-control" value={reportsFilter.end_date} onChange={e => setReportsFilter({ ...reportsFilter, end_date: e.target.value })} />
                </div>
              </div>
              <div className="d-flex gap-3 mt-4 pt-2">
                <button className="btn btn-outline-success w-50 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center" onClick={handleExportExcel}>
                  <Download size={16} className="me-2" /> Export Excel
                </button>
                <button className="btn btn-outline-danger w-50 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center" onClick={handleExportPDF}>
                  <Download size={16} className="me-2" /> Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* BULK IMPORT */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold mb-4">Bulk Excel Import</h5>
              <p className="text-muted small">Import activities count breakdowns from old SEO sheets. Validate data before writing to database.</p>
              <form onSubmit={handleImportExcelSubmit}>
                <div className="mb-4">
                  <label className="form-label small text-muted fw-bold">EXCEL FILE</label>
                  <input type="file" className="form-control" accept=".xls,.xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center">
                  <Upload size={16} className="me-2" /> Upload & Validate File
                </button>
              </form>

              {importSuccessMsg && (
                <div className="alert alert-success mt-4 small mb-0">{importSuccessMsg}</div>
              )}

              {importErrors.length > 0 && (
                <div className="mt-4 p-3 border border-danger-subtle bg-danger-subtle text-danger rounded-3 small overflow-auto" style={{ maxHeight: "200px" }}>
                  <h6 className="fw-bold mb-2 small text-uppercase">Validation Errors:</h6>
                  <ul className="ps-3 mb-0">
                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 8: TASKS & REMINDERS ================= */}
      {activeTab === "tasks" && (
        <div className="d-flex flex-column gap-4">
          
          {/* STATS CARDS ROW */}
          <div className="row g-3 animate__animated animate__fadeIn">
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 me-3">
                    <FileText size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Total Tasks</small>
                    <h5 className="fw-bold mb-0 mt-0.5">{taskStats.total}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-warning-subtle text-warning rounded-3 me-3">
                    <Clock size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Pending</small>
                    <h5 className="fw-bold mb-0 mt-0.5">{taskStats.pending}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-info-subtle text-info rounded-3 me-3">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>In Progress</small>
                    <h5 className="fw-bold mb-0 mt-0.5">{taskStats.in_progress}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-warning rounded-3 me-3 text-white" style={{ backgroundColor: "#f59e0b" }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Ready For Review</small>
                    <h5 className="fw-bold mb-0 mt-0.5">{taskStats.ready_for_review}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-success-subtle text-success rounded-3 me-3">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Completed</small>
                    <h5 className="fw-bold mb-0 mt-0.5">{taskStats.completed}</h5>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <div className="d-flex align-items-center">
                  <div className="p-2.5 bg-danger-subtle text-danger rounded-3 me-3">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Overdue</small>
                    <h5 className="fw-bold mb-0 mt-0.5 text-danger">{taskStats.overdue}</h5>
                  </div>
                </div>
              </div>
            </div>
            {isManager && (
              <>
                <div className="col-6 col-md-4 col-lg">
                  <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                    <div className="d-flex align-items-center">
                      <div className="p-2.5 bg-primary-subtle text-primary rounded-3 me-3">
                        <Clock size={18} />
                      </div>
                      <div>
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Avg Comp Time</small>
                        <h5 className="fw-bold mb-0 mt-0.5">{taskStats.avg_completion_time}h</h5>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-4 col-lg">
                  <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                    <div className="d-flex align-items-center">
                      <div className="p-2.5 bg-secondary-subtle text-secondary rounded-3 me-3">
                        <Clock size={18} />
                      </div>
                      <div>
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>Avg Review Time</small>
                        <h5 className="fw-bold mb-0 mt-0.5">{taskStats.avg_review_time}h</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* TASKS PANEL (Full Width) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">SEO Tasks</h5>
                <p className="text-muted small mb-0">Assigned SEO actions and deliverables</p>
              </div>
              {isManager && (
                <button
                  className="btn btn-sm btn-primary rounded-3 px-3"
                  onClick={() => {
                    setEditingTaskId(null);
                    setTaskForm({ title: "", description: "", website: "", assigned_executive: "", due_date: "", priority: "medium", activity_type: "", status: "pending" });
                    setShowTaskModal(true);
                  }}
                >
                  <Plus size={14} className="me-2" /> Assign Task
                </button>
              )}
            </div>

            {/* FILTER TOOLBAR */}
            <div className="bg-light p-3 rounded-4 mb-4">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskFilterWebsite}
                    onChange={e => handleFilterChange(setTaskFilterWebsite, e.target.value)}
                  >
                    <option value="">All Websites</option>
                    {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskFilterExecutive}
                    onChange={e => handleFilterChange(setTaskFilterExecutive, e.target.value)}
                  >
                    <option value="">All Executives</option>
                    {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name || ex.username}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskFilterStatus}
                    onChange={e => handleFilterChange(setTaskFilterStatus, e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskFilterPriority}
                    onChange={e => handleFilterChange(setTaskFilterPriority, e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskFilterActivityType}
                    onChange={e => handleFilterChange(setTaskFilterActivityType, e.target.value)}
                  >
                    <option value="">All Activities</option>
                    {activityTypes.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: "150px", flex: "1 1 0px" }}>
                  <select
                    className="form-select form-select-sm"
                    value={taskSort}
                    onChange={e => setTaskSort(e.target.value)}
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="due_date">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Task Title (A-Z)</option>
                  </select>
                </div>
                <div style={{ minWidth: "220px", flex: "2 1 0px" }}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white text-muted border-end-0">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by task title, website, or executive..."
                      value={taskSearch}
                      onChange={e => setTaskSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ minWidth: "120px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary w-100 fw-semibold"
                    onClick={() => {
                      setTaskFilterWebsite("");
                      setTaskFilterExecutive("");
                      setTaskFilterStatus("");
                      setTaskFilterPriority("");
                      setTaskFilterActivityType("");
                      setTaskSort("-created_at");
                      setTaskSearch("");
                      setDebouncedTaskSearch("");
                      setTaskPage(1);
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* TASKS LIST */}
            {tasksLoading ? (
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 border rounded-3 bg-light placeholder-glow">
                    <div className="placeholder col-6 mb-2 rounded" style={{ height: "18px" }}></div>
                    <div className="placeholder col-10 mb-3 rounded" style={{ height: "12px" }}></div>
                    <div className="placeholder col-4 rounded" style={{ height: "10px" }}></div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light border rounded-3">
                <p className="mb-3">No SEO tasks match your current filters.</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setTaskFilterWebsite("");
                    setTaskFilterExecutive("");
                    setTaskFilterStatus("");
                    setTaskFilterPriority("");
                    setTaskFilterActivityType("");
                    setTaskSort("-created_at");
                    setTaskSearch("");
                    setDebouncedTaskSearch("");
                    setTaskPage(1);
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {tasks.map(t => (
                  <div key={t.id} className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-start">
                    <div className="w-100 me-3">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={t.status === "completed"}
                          onChange={() => handleToggleTaskStatus(t)}
                          className="form-check-input mt-0"
                          disabled={!isManager}
                        />
                        <span className={`fw-bold text-dark ${t.status === "completed" ? "text-decoration-line-through text-muted" : ""}`}>{t.title}</span>
                      </div>
                      <p className="text-muted small mb-2">{t.description}</p>
                      
                      <div className="small text-muted">
                        Assigned to: <b>{t.assigned_executive_name}</b> &nbsp;|&nbsp; Due: <b>{t.due_date}</b> &nbsp;|&nbsp; Website: <b>{t.website_name}</b>
                        {t.activity_type_name && (
                          <> &nbsp;|&nbsp; Activity: <b>{t.activity_type_name}</b></>
                        )}
                      </div>

                      <div className="small text-muted mt-1">
                        Progress: <span className="fw-bold text-dark">{t.current_progress}%</span> &nbsp;|&nbsp; Submissions: <span className="fw-bold text-dark">{t.submitted_logs_count}</span>
                        {t.latest_submission_date && (
                          <>&nbsp;|&nbsp; Latest: <b>{t.latest_submission_date}</b></>
                        )}
                      </div>

                      <div className="small text-muted mt-1">
                        Review Status: <span className={`badge text-capitalize bg-${
                          t.review_status === "approved" ? "success" :
                          t.review_status === "rejected" ? "danger" :
                          t.review_status === "pending" ? "warning text-dark" : "light text-dark border"
                        }`} style={{ fontSize: "0.7rem" }}>
                          {t.review_status === "pending" ? "Pending Review" : t.review_status || "N/A"}
                        </span>
                      </div>

                      {t.manager_remarks && (
                        <div className="alert alert-info py-1.5 px-3 mt-2 rounded-3 small mb-0 border-0 shadow-xs" style={{ background: "rgba(59, 130, 246, 0.08)", color: "#1d4ed8", maxWidth: "600px" }}>
                          <span className="fw-bold">Manager Remarks: </span>"{t.manager_remarks}"
                        </div>
                      )}

                      {t.work_history && t.work_history.length > 0 && (
                        <div className="mt-2 animate__animated animate__fadeIn">
                          <button
                            className="btn btn-xs btn-link text-decoration-none p-0 text-secondary fw-semibold small d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedTaskHistoryId(expandedTaskHistoryId === t.id ? null : t.id);
                            }}
                          >
                            <Clock size={12} />
                            {expandedTaskHistoryId === t.id ? "Hide Work History" : "View Work History"} ({t.work_history.length})
                          </button>
                          
                          {expandedTaskHistoryId === t.id && (
                            <div className="mt-2 bg-white border rounded-3 p-3 d-flex flex-column gap-3 shadow-xs" style={{ maxWidth: "650px" }}>
                              {t.work_history.map((log: any, logIdx: number) => (
                                <div key={log.id || logIdx} className="small pb-3 border-bottom last-border-0 last-pb-0">
                                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5">
                                    <div>
                                      <span className="fw-bold text-dark">{log.log_date}</span> &nbsp;|&nbsp; 
                                      <span className="text-secondary">{log.executive_name}</span> &nbsp;|&nbsp; 
                                      <span className="fw-semibold text-primary">{log.total_count} activities</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      {log.proof_file && (
                                        <a href={log.proof_file} target="_blank" rel="noopener noreferrer" className="badge bg-light text-primary border text-decoration-none d-inline-flex align-items-center gap-1 py-1">
                                          <FileText size={10} /> Proof File
                                        </a>
                                      )}
                                      <span className={`badge text-capitalize bg-${
                                        log.status === "approved" ? "success" :
                                        log.status === "rejected" ? "danger" :
                                        log.status === "submitted" ? "info" : "secondary"
                                      }`} style={{ fontSize: "0.65rem" }}>{log.status}</span>
                                    </div>
                                  </div>
                                  
                                  {log.items && log.items.length > 0 && (
                                    <div className="bg-light p-2 rounded-2 mt-1 mb-1 border shadow-xs">
                                      {log.items.map((it: any, itemIdx: number) => (
                                        <div key={it.id || itemIdx} className="smaller text-secondary d-flex justify-content-between align-items-center py-1 border-bottom last-border-0">
                                          <span>
                                            <b>{it.activity_type_name}</b> &nbsp;|&nbsp; Keyword: <b>{it.keyword || "—"}</b>
                                            {it.time_spent_minutes !== null && <> &nbsp;|&nbsp; Time Spent: <b>{it.time_spent_minutes}m</b></>}
                                          </span>
                                          <span className="badge bg-secondary-subtle text-dark-emphasis fw-bold">Count: {it.count}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {log.remarks && <div className="text-muted italic smaller" style={{ fontSize: "0.75rem" }}><span className="fw-medium">Remarks:</span> "{log.remarks}"</div>}
                                  {log.remarks_by_manager && <div className="text-danger italic smaller mt-0.5" style={{ fontSize: "0.75rem" }}><span className="fw-medium">Manager Notes:</span> "{log.remarks_by_manager}"</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {!isManager && t.status === "pending" && (
                        <button
                          className="btn btn-xs btn-success d-flex align-items-center gap-1 py-1 px-2 rounded text-white fw-bold"
                          onClick={() => handleLaunchWorkLogFromTask(t)}
                        >
                          <Plus size={12} /> Submit Today's Work
                        </button>
                      )}
                      {!isManager && t.status === "in_progress" && (
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-xs btn-primary d-flex align-items-center gap-1 py-1 px-2 rounded text-white fw-bold"
                            onClick={() => handleLaunchWorkLogFromTask(t)}
                          >
                            <Plus size={12} /> Continue Work
                          </button>
                          <button
                            className="btn btn-xs btn-outline-info d-flex align-items-center gap-1 py-1 px-2 rounded fw-bold"
                            onClick={() => handleMarkReadyForReview(t.id)}
                          >
                            <CheckCircle2 size={12} /> Mark Ready for Review
                          </button>
                        </div>
                      )}
                      {isManager && (
                        <button
                          className={`btn btn-xs fw-bold d-flex align-items-center gap-1 py-1 px-2 rounded ${
                            t.status === "ready_for_review" ? "btn-warning text-dark" : "btn-outline-secondary text-secondary"
                          }`}
                          onClick={() => { setReviewingTask(t); setShowReviewModal(true); setReviewTab('submissions'); }}
                        >
                          <Eye size={12} /> {t.status === "ready_for_review" ? "Review Task" : "Task Details"}
                        </button>
                      )}
                      {isManager && (
                        <div className="d-flex gap-1 me-2 animate__animated animate__fadeIn">
                          <button
                            className="btn btn-xs btn-light text-secondary border p-1 rounded hover-shadow"
                            onClick={() => {
                              setEditingTaskId(t.id);
                              setTaskForm({
                                title: t.title,
                                description: t.description,
                                website: String(t.website),
                                assigned_executive: String(t.assigned_executive),
                                due_date: t.due_date,
                                priority: t.priority,
                                activity_type: t.activity_type ? String(t.activity_type) : "",
                                status: t.status
                              });
                              setShowTaskModal(true);
                            }}
                            title="Edit Task"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className="btn btn-xs btn-light text-danger border p-1 rounded hover-shadow"
                            onClick={() => handleDeleteTaskClick(t.id)}
                            title="Delete Task"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <span className={`badge text-capitalize bg-${
                        t.status === "completed" ? "success" : 
                        t.status === "in_progress" ? "info" : 
                        t.status === "ready_for_review" ? "warning text-dark" : 
                        t.status === "on_hold" ? "secondary" : 
                        t.status === "overdue" ? "danger" : "warning"
                      }`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {taskTotalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="small text-muted">
                  Page <b>{taskPage}</b> of <b>{taskTotalPages}</b> ({taskTotalCount} tasks)
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-xs btn-outline-secondary px-3 py-1.5"
                    disabled={taskPage <= 1 || tasksLoading}
                    onClick={() => setTaskPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-xs btn-outline-secondary px-3 py-1.5"
                    disabled={taskPage >= taskTotalPages || tasksLoading}
                    onClick={() => setTaskPage(prev => Math.min(prev + 1, taskTotalPages))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* REMINDERS PANEL (Full Width) */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">SEO Reminders</h5>
                <p className="text-muted small mb-0">Active time-based reminders and alerts</p>
              </div>
              {isManager && (
                <button className="btn btn-sm btn-primary rounded-3 px-3" onClick={() => setShowReminderModal(true)}>
                  <Plus size={14} className="me-2" /> Add Reminder
                </button>
              )}
            </div>
            <div className="d-flex flex-column gap-3">
              {reminders.length === 0 ? (
                <div className="text-center py-4 text-muted small">No reminders active.</div>
              ) : (
                reminders.map(r => (
                  <div key={r.id} className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-start">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <input type="checkbox" checked={r.status === "completed"} onChange={() => handleToggleReminderStatus(r)} className="form-check-input mt-0" />
                        <span className={`fw-bold text-dark ${r.status === "completed" ? "text-decoration-line-through text-muted" : ""}`}>{r.title}</span>
                      </div>
                      <p className="text-muted small mb-2">{r.description}</p>
                      <div className="small text-muted">
                        Due: <b>{r.due_date}</b> &nbsp;|&nbsp; Priority: <b>{r.priority}</b> &nbsp;|&nbsp; Website: <b>{r.website_name}</b>
                      </div>
                      {isManager && (
                        <div className="small text-muted mt-1">
                          Executive: <b>{r.assigned_executive_name}</b>
                        </div>
                      )}
                    </div>
                    <span className={`badge bg-${r.status === "completed" ? "success" : "warning"}`}>{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity-types" && isManager && (
        <SeoActivityTypesPage />
      )}


      {/* =======================================================
          MODAL CONSTRUCTORS
      ======================================================= */}

      {/* WEBSITE MODAL (CREATE / EDIT) */}
      {showWebsiteModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleWebsiteSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">{websiteEditingId ? "Edit Website" : "Add Website"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowWebsiteModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">CLIENT *</label>
                    <select className="form-select" value={websiteForm.client || ""} onChange={e => setWebsiteForm({ ...websiteForm, client: Number(e.target.value) })} required>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">WEBSITE NAME *</label>
                    <input className="form-control" value={websiteForm.website_name || ""} onChange={e => setWebsiteForm({ ...websiteForm, website_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">DOMAIN URL *</label>
                    <input className="form-control" type="text" placeholder="https://example.com" value={websiteForm.domain_url || ""} onChange={e => setWebsiteForm({ ...websiteForm, domain_url: e.target.value })} required />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">PACKAGE PLAN</label>
                      <select className="form-select" value={websiteForm.package_plan || "basic"} onChange={e => setWebsiteForm({ ...websiteForm, package_plan: e.target.value as any })}>
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">START DATE</label>
                      <input className="form-control" type="date" value={websiteForm.start_date || ""} onChange={e => setWebsiteForm({ ...websiteForm, start_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ASSIGNED EXECUTIVE</label>
                    <select className="form-select" value={websiteForm.assigned_executive || ""} onChange={e => setWebsiteForm({ ...websiteForm, assigned_executive: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Unassigned</option>
                      {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name ? `${ex.name} (${ex.username})` : ex.username}</option>)}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">TARGET COUNTRY</label>
                      <input className="form-control" value={websiteForm.target_country || ""} onChange={e => setWebsiteForm({ ...websiteForm, target_country: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">STATUS</label>
                      <select className="form-select" value={websiteForm.status || "active"} onChange={e => setWebsiteForm({ ...websiteForm, status: e.target.value as any })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">NOTES</label>
                    <textarea className="form-control" rows={3} value={websiteForm.notes || ""} onChange={e => setWebsiteForm({ ...websiteForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowWebsiteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Save Website</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TARGET KEYWORD MODAL (CREATE / EDIT) */}
      {showKeywordModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleKeywordSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">{keywordEditingId ? "Edit Target Keyword" : "Add Target Keyword"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowKeywordModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">KEYWORD *</label>
                    <input className="form-control" value={keywordForm.keyword || ""} onChange={e => setKeywordForm({ ...keywordForm, keyword: e.target.value })} required />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">SEARCH VOLUME</label>
                      <input type="number" className="form-control" value={keywordForm.search_volume || 0} onChange={e => setKeywordForm({ ...keywordForm, search_volume: Number(e.target.value) })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">DIFFICULTY SCORE (%)</label>
                      <input type="number" step="0.01" className="form-control" value={keywordForm.difficulty_score || 0} onChange={e => setKeywordForm({ ...keywordForm, difficulty_score: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">PRIORITY</label>
                      <select className="form-select" value={keywordForm.priority || "medium"} onChange={e => setKeywordForm({ ...keywordForm, priority: e.target.value as any })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">TARGET RANK</label>
                      <input type="number" className="form-control" value={keywordForm.target_rank || 10} onChange={e => setKeywordForm({ ...keywordForm, target_rank: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">CURRENT RANK</label>
                    <input type="number" className="form-control" value={keywordForm.current_rank || 100} onChange={e => setKeywordForm({ ...keywordForm, current_rank: Number(e.target.value) })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">NOTES</label>
                    <textarea className="form-control" rows={2} value={keywordForm.notes || ""} onChange={e => setKeywordForm({ ...keywordForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowKeywordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Save Keyword</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DAILY WORK LOG MODAL (EXECUTIVE INPUT) */}
      {showWorkLogModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)", overflowY: "auto" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 px-4 py-3">
                <h5 className="fw-bold mb-0">{logEditingId ? "Edit Daily Work Log" : "Submit Daily Work Log"}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowWorkLogModal(false); setActiveLaunchTask(null); }}></button>
              </div>
              <div className="modal-body px-4 py-3">
                {activeLaunchTask && (
                  <div className="card border-0 bg-light shadow-sm mb-4 rounded-3 p-3 border-start border-4 border-primary">
                    <div className="row g-2 align-items-center">
                      <div className="col-12 mb-1">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Linked SEO Task</span>
                        <h6 className="fw-bold text-dark mb-0">{activeLaunchTask.title}</h6>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Website</span>
                        <span className="text-secondary small fw-medium">{activeLaunchTask.website_name}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Priority</span>
                        <span className={`badge text-capitalize bg-${
                          activeLaunchTask.priority === "high" ? "danger" :
                          activeLaunchTask.priority === "medium" ? "warning text-dark" : "info text-dark"
                        }`} style={{ fontSize: "0.7rem" }}>{activeLaunchTask.priority}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Due Date</span>
                        <span className="text-secondary small fw-medium">{activeLaunchTask.due_date}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Current Status</span>
                        <span className="text-secondary small fw-medium text-capitalize">{activeLaunchTask.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-bold">WEBSITE *</label>
                    <select
                      className="form-select"
                      value={logForm.website}
                      onChange={e => setLogForm({ ...logForm, website: e.target.value })}
                      required
                      disabled={!!activeLaunchTask}
                    >
                      <option value="">Select Website</option>
                      {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-bold">WORK LOG DATE *</label>
                    <input type="date" className="form-control" value={logForm.log_date} onChange={e => setLogForm({ ...logForm, log_date: e.target.value })} required />
                  </div>
                </div>

                {duplicateLogWarning && (
                  <div className="alert alert-warning border-0 rounded-3 d-flex align-items-start mb-4 shadow-sm" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
                    <AlertCircle size={18} className="me-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="small fw-semibold">{duplicateLogWarning}</span>
                    </div>
                  </div>
                )}

                {existingLogItems.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center">
                      <CheckCircle2 size={16} className="text-success me-2" /> Previously Submitted Activities ({existingLogItems.length})
                    </h6>
                    <div className="d-flex flex-column gap-2 bg-light p-2 rounded-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {existingLogItems.map((item, idx) => (
                        <div key={item.id || idx} className="p-3 border rounded-3 bg-white shadow-xs" style={{ borderLeft: "4px solid #10b981" }}>
                          <div className="row g-2 align-items-center">
                            <div className="col-md-4">
                              <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Activity Type</span>
                              <span className="fw-semibold text-dark small">{item.activity_type_name || activityTypes.find(act => act.id === item.activity_type)?.name || "Unknown Activity"}</span>
                            </div>
                            <div className="col-md-4">
                              <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Target Keyword</span>
                              <span className="text-dark small">{item.keyword || "—"}</span>
                            </div>
                            <div className="col-md-2 text-center">
                              <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Count</span>
                              <span className="badge bg-success fw-bold px-2 py-1" style={{ fontSize: "0.75rem" }}>{item.count}</span>
                            </div>
                            <div className="col-md-2 text-end">
                              <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Time Spent</span>
                              <span className="text-dark fw-medium small">{item.time_spent_minutes ? `${item.time_spent_minutes}m` : "—"}</span>
                            </div>
                            {item.username && (
                              <div className="col-md-4 mt-2">
                                <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Username</span>
                                <span className="font-monospace text-secondary small bg-light px-1.5 py-0.5 rounded">{item.username}</span>
                              </div>
                            )}
                            {item.decrypted_password && (
                              <div className="col-md-4 mt-2">
                                <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Password</span>
                                <div className="d-flex align-items-center gap-1">
                                  <span className="font-monospace text-secondary small bg-light px-1.5 py-0.5 rounded">
                                    {visibleActivityPasswords[`${item.id || ('exist-' + idx)}`] ? item.decrypted_password : "••••••••"}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-light p-0 d-inline-flex align-items-center justify-content-center"
                                    style={{ width: "18px", height: "18px" }}
                                    onClick={() => setVisibleActivityPasswords(prev => ({
                                      ...prev,
                                      [`${item.id || ('exist-' + idx)}`]: !prev[`${item.id || ('exist-' + idx)}`]
                                    }))}
                                  >
                                    {visibleActivityPasswords[`${item.id || ('exist-' + idx)}`] ? <EyeOff size={10} /> : <Eye size={10} />}
                                  </button>
                                </div>
                              </div>
                            )}
                            {(item.domain_authority !== null || item.spam_score !== null) && (
                              <div className="col-md-4 mt-2">
                                <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>DA / Spam Score</span>
                                <span className="small text-secondary">
                                  {item.domain_authority !== null ? `DA: ${item.domain_authority}` : ""}
                                  {item.domain_authority !== null && item.spam_score !== null ? " | " : ""}
                                  {item.spam_score !== null ? `Spam Score: ${item.spam_score}%` : ""}
                                </span>
                              </div>
                            )}
                            {item.submission_url && (
                              <div className="col-12 mt-2 pt-2 border-top">
                                <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Submission URL(s)</span>
                                <div className="bg-light p-2 rounded small font-monospace text-primary" style={{ maxHeight: "60px", overflowY: "auto", wordBreak: "break-all", whiteSpace: "pre-line", fontSize: "0.75rem" }}>
                                  {item.submission_url}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">
                    {existingLogItems.length > 0 ? "Add New Activity" : "Logged Activities Summary"}
                  </h6>
                  <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={handleAddLogItem}>
                    <Plus size={12} className="me-1" /> Add Row
                  </button>
                </div>

                {logItems.map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-3 bg-light mb-3 position-relative">
                    {logItems.length > 1 && (
                      <button type="button" className="btn-close position-absolute top-0 end-0 m-2" style={{ fontSize: "0.8rem" }} onClick={() => handleRemoveLogItem(idx)}></button>
                    )}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small text-muted fw-bold">ACTIVITY TYPE *</label>
                        <select
                          className="form-select"
                          value={item.activity_type || ""}
                          onChange={e => handleLogItemChange(idx, "activity_type", e.target.value)}
                          required
                          disabled={loading || activityTypes.length === 0}
                        >
                          {loading ? (
                            <option value="">Loading activities...</option>
                          ) : activityTypes.length === 0 ? (
                            <option value="">No Activity Types Available</option>
                          ) : (
                            <>
                              <option value="">Select Activity</option>
                              {activityTypes.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                            </>
                          )}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-muted fw-bold">TARGET KEYWORD</label>
                        <input type="text" className="form-control" placeholder="E.g. best services" value={item.keyword || ""} onChange={e => handleLogItemChange(idx, "keyword", e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-muted fw-bold">USERNAME</label>
                        <input type="text" className="form-control" placeholder="Generated Username" value={item.username || ""} onChange={e => handleLogItemChange(idx, "username", e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small text-muted fw-bold">PASSWORD</label>
                        <div className="input-group">
                          <input
                            type={visibleSubmitPasswords[idx] ? "text" : "password"}
                            className="form-control"
                            placeholder="Generated Password"
                            value={item.password || ""}
                            onChange={e => handleLogItemChange(idx, "password", e.target.value)}
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setVisibleSubmitPasswords(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          >
                            {visibleSubmitPasswords[idx] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small text-muted fw-bold">SUBMISSION URL(S) (PASTE BULK LINKS SEPARATED BY NEW LINES)</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Paste live links here, one per line. Count updates automatically."
                          value={item.submission_url || ""}
                          onChange={e => {
                            const val = e.target.value;
                            const lines = val.split("\n").map(l => l.trim()).filter(l => l.length > 0);
                            const derivedCount = lines.length > 0 ? lines.length : 1;
                            
                            // Update both submission_url and count
                            const newItems = [...logItems];
                            newItems[idx] = { 
                              ...newItems[idx], 
                              submission_url: val,
                              count: derivedCount
                            };
                            setLogItems(newItems);
                          }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted fw-bold">DOMAIN AUTHORITY (DA)</label>
                        <input type="number" min={0} max={100} className="form-control" placeholder="0-100" value={item.domain_authority === null || item.domain_authority === undefined ? "" : item.domain_authority} onChange={e => handleLogItemChange(idx, "domain_authority", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted fw-bold">SPAM SCORE (%)</label>
                        <input type="number" min={0} max={100} className="form-control" placeholder="0-100" value={item.spam_score === null || item.spam_score === undefined ? "" : item.spam_score} onChange={e => handleLogItemChange(idx, "spam_score", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted fw-bold">TIME SPENT (MINUTES)</label>
                        <input type="number" min={0} className="form-control" placeholder="E.g. 30" value={item.time_spent_minutes === null || item.time_spent_minutes === undefined ? "" : item.time_spent_minutes} onChange={e => handleLogItemChange(idx, "time_spent_minutes", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted fw-bold">COUNT (AUTO-DETECTED) *</label>
                        <input type="number" min={1} className="form-control" value={item.count || 1} onChange={e => handleLogItemChange(idx, "count", Number(e.target.value))} required />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mb-3 mt-4">
                  <label className="form-label small text-muted fw-bold">ATTACH PROOF DOCUMENT (Excel, PDF, Images, Zip - Max 10MB)</label>
                  <input type="file" className="form-control" accept=".xls,.xlsx,.pdf,.jpg,.jpeg,.png,.zip" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-muted fw-bold">GENERAL REMARKS</label>
                  <textarea className="form-control" rows={2} value={logForm.remarks} onChange={e => setLogForm({ ...logForm, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 py-3 pt-0 d-flex justify-content-between">
                <button type="button" className="btn btn-light" onClick={() => { setShowWorkLogModal(false); setActiveLaunchTask(null); }}>Cancel</button>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => handleWorkLogSubmit("draft")}>Save as Draft</button>
                  <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => handleWorkLogSubmit("submitted")}>Submit Work</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REMARKS MODAL (MANAGER WORKFLOW) */}
      {showRejectModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 px-4 py-3">
                <h5 className="fw-bold mb-0 text-danger">Reject Work Log</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-3">
                <p className="text-muted small">Rejection requires specific remarks detailing what correction is needed.</p>
                <div className="mb-3">
                  <label className="form-label small text-muted fw-bold">REJECTION REMARKS *</label>
                  <textarea className="form-control" rows={4} placeholder="E.g. Link verification failed for bookmarking entries..." value={rejectionRemarks} onChange={e => setRejectionRemarks(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 py-3 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger px-4 fw-bold" onClick={handleRejectLog}>Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER TASK REVIEW MODAL */}
      {showReviewModal && reviewingTask && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)", overflowY: "auto" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <div className="modal-header bg-light border-0 px-4 py-3">
                <h5 className="fw-bold mb-0">Review SEO Task Submissions</h5>
                <button type="button" className="btn-close" onClick={() => { setShowReviewModal(false); setReviewingTask(null); }}></button>
              </div>
              <div className="modal-body px-4 py-3">
                <div className="card border-0 bg-light-subtle shadow-sm mb-4 rounded-3 p-3 border-start border-4 border-warning">
                  <div className="row g-2 align-items-center">
                    <div className="col-12 mb-1">
                      <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Task Title</span>
                      <h6 className="fw-bold text-dark mb-0">{reviewingTask.title}</h6>
                    </div>
                    <div className="col-md-4">
                      <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Assigned Executive</span>
                      <span className="text-secondary small fw-medium">{reviewingTask.assigned_executive_name}</span>
                    </div>
                    <div className="col-md-4">
                      <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Due Date</span>
                      <span className="text-secondary small fw-medium">{reviewingTask.due_date}</span>
                    </div>
                    <div className="col-md-4">
                      <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Website</span>
                      <span className="text-secondary small fw-medium">{reviewingTask.website_name}</span>
                    </div>
                  </div>
                </div>

                {reviewingTask.status === "completed" && reviewingTask.completion_summary && (
                  <div className="card border-0 bg-success-subtle shadow-sm mb-4 rounded-3 p-3 border-start border-4 border-success animate__animated animate__fadeIn">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <h6 className="fw-bold text-success-emphasis mb-0">Task Completion Summary</h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-6 col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Total Logs</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.total_logs} logs</span>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Total Activities</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.total_activities} activities</span>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Submission URLs</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.total_urls} links</span>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Total Time Spent</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.total_time} mins</span>
                      </div>
                      <div className="col-6 col-md-4">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Completion Date</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.completion_date || "—"}</span>
                      </div>
                      <div className="col-6 col-md-4">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Completed By</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.completed_by || "—"}</span>
                      </div>
                      <div className="col-6 col-md-4">
                        <span className="small text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Review Duration</span>
                        <span className="text-success-emphasis fw-bold small">{reviewingTask.completion_summary.review_duration || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-bold small ${reviewTab === 'submissions' ? 'active' : ''}`}
                      onClick={() => setReviewTab('submissions')}
                    >
                      Submissions ({reviewingTask.work_history?.length || 0})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-bold small ${reviewTab === 'attachments' ? 'active' : ''}`}
                      onClick={() => setReviewTab('attachments')}
                    >
                      Attachments ({reviewingTask.work_history?.filter(log => log.proof_file).length || 0})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link fw-bold small ${reviewTab === 'timeline' ? 'active' : ''}`}
                      onClick={() => setReviewTab('timeline')}
                    >
                      Timeline / Audit Log ({reviewingTask.timeline?.length || 0})
                    </button>
                  </li>
                </ul>

                {reviewTab === 'submissions' && (
                  <div className="d-flex flex-column gap-3 mb-4 animate__animated animate__fadeIn" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {!reviewingTask.work_history || reviewingTask.work_history.length === 0 ? (
                      <div className="text-muted small py-3 text-center bg-light border rounded-3">No work logs submitted for this task yet.</div>
                    ) : (
                      reviewingTask.work_history.map((log: any, logIdx: number) => (
                        <div key={log.id || logIdx} className="p-3 border rounded-3 bg-white shadow-xs">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <span className="fw-bold text-dark">{log.log_date}</span> &nbsp;|&nbsp; 
                              <span className="text-muted small">{log.executive_name}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              {log.proof_file && (
                                <a href={log.proof_file} target="_blank" rel="noopener noreferrer" className="badge bg-light text-primary border text-decoration-none py-1">
                                  <FileText size={10} className="me-1" /> View Proof
                                </a>
                              )}
                              <span className={`badge text-capitalize bg-${
                                log.status === "approved" ? "success" :
                                log.status === "rejected" ? "danger" :
                                log.status === "submitted" ? "info" : "secondary"
                              }`} style={{ fontSize: "0.65rem" }}>{log.status}</span>
                            </div>
                          </div>

                          {log.items && log.items.length > 0 && (
                            <div className="bg-light p-2 rounded-2 mt-1 mb-2 border shadow-xs">
                              {log.items.map((it: any, itemIdx: number) => (
                                <div key={it.id || itemIdx} className="smaller text-secondary d-flex justify-content-between align-items-center py-1 border-bottom last-border-0">
                                  <span>
                                    <b>{it.activity_type_name}</b> &nbsp;|&nbsp; Keyword: <b>{it.keyword || "—"}</b>
                                    {it.time_spent_minutes !== null && <> &nbsp;|&nbsp; Time Spent: <b>{it.time_spent_minutes}m</b></>}
                                  </span>
                                  <span className="badge bg-secondary-subtle text-dark-emphasis fw-bold">Count: {it.count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.remarks && <div className="text-muted italic smaller mb-2">Remarks: "{log.remarks}"</div>}

                          {log.status === "submitted" && (
                            <div className="d-flex justify-content-end gap-2 border-top pt-2">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-danger py-1 px-2 fw-semibold rounded"
                                onClick={() => handleRejectIndividualLog(log.id)}
                              >
                                Reject Log
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-success text-white py-1 px-2 fw-semibold rounded"
                                onClick={() => handleApproveIndividualLog(log.id)}
                              >
                                Approve Log
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {reviewTab === 'attachments' && (
                  <div className="d-flex flex-column gap-2 mb-4 animate__animated animate__fadeIn" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {(() => {
                      const logsWithFiles = reviewingTask.work_history?.filter(log => log.proof_file) || [];
                      if (logsWithFiles.length === 0) {
                        return <div className="text-muted small py-3 text-center bg-light border rounded-3">No attachments uploaded for this task yet.</div>;
                      }
                      return logsWithFiles.map((log: any) => (
                        <div key={log.id} className="p-3 border rounded-3 bg-white shadow-xs d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-bold text-dark">{log.log_date}</span> &nbsp;|&nbsp; 
                            <span className="text-muted small">Submitted by {log.executive_name}</span>
                            <div className="text-primary fw-medium small mt-1 font-monospace" style={{ fontSize: "0.75rem" }}>
                              {log.proof_file.split("/").pop()}
                            </div>
                          </div>
                          <a
                            href={log.proof_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          >
                            <FileText size={12} /> Download / View File
                          </a>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {reviewTab === 'timeline' && (
                  <div className="d-flex flex-column gap-2 mb-4 animate__animated animate__fadeIn" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {!reviewingTask.timeline || reviewingTask.timeline.length === 0 ? (
                      <div className="text-muted small py-3 text-center bg-light border rounded-3">No activity logged on this task.</div>
                    ) : (
                      reviewingTask.timeline.map((evt: any) => (
                        <div key={evt.id} className="p-3 border rounded-3 bg-white shadow-xs border-start border-3 border-secondary">
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <div>
                              <span className="badge bg-secondary-subtle text-secondary-emphasis fw-bold mb-1">{evt.action}</span>
                              <div className="text-muted smaller" style={{ fontSize: "0.7rem" }}>
                                {new Date(evt.event_time).toLocaleString()} &nbsp;|&nbsp; User: <b>{evt.user_name}</b>
                              </div>
                            </div>
                          </div>
                          {evt.remarks && (
                            <div className="text-dark small mt-1 p-2 bg-light rounded italic" style={{ fontSize: "0.75rem" }}>
                              "{evt.remarks}"
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small text-muted fw-bold">MANAGER REVIEW REMARKS / REJECTION NOTES</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter approval feedback or rejection reasons detailing changes required..."
                    value={managerReviewRemarks}
                    onChange={e => setManagerReviewRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 py-3 pt-0 d-flex justify-content-between">
                <button type="button" className="btn btn-light" onClick={() => { setShowReviewModal(false); setReviewingTask(null); }}>Close</button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger px-4 fw-bold"
                    onClick={() => handleTaskReview("reject")}
                  >
                    Reject & Return to In Progress
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4 fw-bold"
                    onClick={() => handleTaskReview("approve")}
                  >
                    Approve & Complete Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER SET TARGETS MODAL */}
      {showTargetModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleTargetSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">Set Executive Monthly Target</h5>
                  <button type="button" className="btn-close" onClick={() => setShowTargetModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">EXECUTIVE *</label>
                    <select className="form-select" value={targetForm.executive} onChange={e => setTargetForm({ ...targetForm, executive: e.target.value })} required>
                      <option value="">Select Executive</option>
                      {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name ? `${ex.name} (${ex.username})` : ex.username}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">WEBSITE (OPTIONAL)</label>
                    <select className="form-select" value={targetForm.website} onChange={e => setTargetForm({ ...targetForm, website: e.target.value })}>
                      <option value="">Overall Target (All Websites)</option>
                      {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">TARGET MONTH *</label>
                    <input type="month" className="form-control" value={targetForm.month} onChange={e => setTargetForm({ ...targetForm, month: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ACTIVITY TYPE *</label>
                    <select className="form-select" value={targetForm.activity_type} onChange={e => setTargetForm({ ...targetForm, activity_type: e.target.value })} required>
                      <option value="">Select Activity</option>
                      {activityTypes.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">TARGET COUNT *</label>
                    <input type="number" min={1} className="form-control" value={targetForm.target_count} onChange={e => setTargetForm({ ...targetForm, target_count: Number(e.target.value) })} required />
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowTargetModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Set Target</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TASK ASSIGNMENT MODAL (MANAGER) */}
      {showTaskModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">{editingTaskId ? "Edit SEO Task" : "Assign SEO Task"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowTaskModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">TASK TITLE *</label>
                    <input type="text" className="form-control" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">DESCRIPTION *</label>
                    <textarea className="form-control" rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">WEBSITE *</label>
                    <select className="form-select" value={taskForm.website} onChange={e => setTaskForm({ ...taskForm, website: e.target.value })} required>
                      <option value="">Select Website</option>
                      {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ASSIGNED EXECUTIVE *</label>
                    <select className="form-select" value={taskForm.assigned_executive} onChange={e => setTaskForm({ ...taskForm, assigned_executive: e.target.value })} required>
                      <option value="">Select Executive</option>
                      {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name ? `${ex.name} (${ex.username})` : ex.username}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ACTIVITY TYPE (OPTIONAL)</label>
                    <select className="form-select" value={taskForm.activity_type} onChange={e => setTaskForm({ ...taskForm, activity_type: e.target.value })}>
                      <option value="">None / Custom</option>
                      {activityTypes.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                    </select>
                  </div>
                  {editingTaskId && (
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">STATUS</label>
                      <select className="form-select" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  )}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">DUE DATE *</label>
                      <input type="date" className="form-control" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">PRIORITY</label>
                      <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">{editingTaskId ? "Update Task" : "Assign Task"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* REMINDER MODAL (MANAGER) */}
      {showReminderModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleReminderSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">Add SEO Reminder</h5>
                  <button type="button" className="btn-close" onClick={() => setShowReminderModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">REMINDER TITLE *</label>
                    <input type="text" className="form-control" value={reminderForm.title} onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">DESCRIPTION</label>
                    <textarea className="form-control" rows={3} value={reminderForm.description} onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">WEBSITE *</label>
                    <select className="form-select" value={reminderForm.website} onChange={e => setReminderForm({ ...reminderForm, website: e.target.value })} required>
                      <option value="">Select Website</option>
                      {websites.map(s => <option key={s.id} value={s.id}>{s.website_name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">ASSIGNED EXECUTIVE *</label>
                    <select className="form-select" value={reminderForm.assigned_executive} onChange={e => setReminderForm({ ...reminderForm, assigned_executive: e.target.value })} required>
                      <option value="">Select Executive</option>
                      {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name ? `${ex.name} (${ex.username})` : ex.username}</option>)}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">DUE DATE *</label>
                      <input type="date" className="form-control" value={reminderForm.due_date} onChange={e => setReminderForm({ ...reminderForm, due_date: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted fw-bold">PRIORITY</label>
                      <select className="form-select" value={reminderForm.priority} onChange={e => setReminderForm({ ...reminderForm, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowReminderModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Add Reminder</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WEBSITE CREDENTIAL MODAL */}
      {showCredentialModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(17,24,39,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-4 overflow-hidden">
              <form onSubmit={handleCredentialSubmit}>
                <div className="modal-header bg-light border-0 px-4 py-3">
                  <h5 className="fw-bold mb-0">{credentialEditingId ? "Edit Website Credential" : "Add Website Credential"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCredentialModal(false)}></button>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">PLATFORM *</label>
                    <input className="form-control" placeholder="E.g. WordPress Admin, Ahrefs, SEMrush" value={credentialForm.platform} onChange={e => setCredentialForm({ ...credentialForm, platform: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">USERNAME *</label>
                    <input className="form-control" value={credentialForm.username} onChange={e => setCredentialForm({ ...credentialForm, username: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">PASSWORD *</label>
                    <input className="form-control" type="text" placeholder="Enter password (will be encrypted)" value={credentialForm.password} onChange={e => setCredentialForm({ ...credentialForm, password: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-bold">NOTES</label>
                    <textarea className="form-control" rows={3} placeholder="Add notes (URLs, exceptions, recovery keys...)" value={credentialForm.notes} onChange={e => setCredentialForm({ ...credentialForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 py-3 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowCredentialModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Save Credential</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Standardized Modals */}
      <DeleteConfirmModal
        isOpen={showDeleteWebsiteModal}
        onClose={() => { setShowDeleteWebsiteModal(false); setDeleteWebsiteId(null); }}
        onConfirm={handleConfirmDeleteWebsite}
        title="Delete Website"
        message="Are you sure you want to delete this website? All related activities, keywords and targets will be removed."
      />

      <DeleteConfirmModal
        isOpen={showDeleteKeywordModal}
        onClose={() => { setShowDeleteKeywordModal(false); setDeleteKeywordId(null); }}
        onConfirm={handleConfirmDeleteKeyword}
        title="Delete Keyword"
        message="Are you sure you want to delete this keyword?"
      />

      <DeleteConfirmModal
        isOpen={showDeleteCredentialModal}
        onClose={() => { setShowDeleteCredentialModal(false); setDeleteCredentialId(null); }}
        onConfirm={handleConfirmDeleteCredential}
        title="Delete Credential"
        message="Are you sure you want to delete this credential?"
      />

      <DeleteConfirmModal
        isOpen={showDeleteTargetModal}
        onClose={() => { setShowDeleteTargetModal(false); setDeleteTargetId(null); }}
        onConfirm={handleConfirmDeleteTarget}
        title="Remove Target"
        message="Are you sure you want to remove this target?"
      />

      <DeleteConfirmModal
        isOpen={showDeleteTaskModal}
        onClose={() => { setShowDeleteTaskModal(false); setDeleteTaskId(null); }}
        onConfirm={handleConfirmDeleteTask}
        title="Delete SEO Task"
        message="Are you sure you want to delete this SEO task?"
      />

      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => { setShowApproveModal(false); setApproveTargetId(null); }}
        onConfirm={handleConfirmApproveLog}
        title="Approve Work Log"
        message="Are you sure you want to approve this work log?"
        confirmText="Approve"
        variant="success"
      />

    </div>
  );
};

export default SEOPage;