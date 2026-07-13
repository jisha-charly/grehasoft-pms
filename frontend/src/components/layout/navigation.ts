import { Permission, UserRole } from '../../types';

export interface NavChildConfig {
  id: string;
  label: string;
  route: string;
  requiredPermissions?: Permission[];
  roles?: UserRole[];
  badge?: string;
}

export interface NavItemConfig {
  id: string;
  label: string;
  route?: string;
  icon: string;
  requiredPermissions?: Permission[];
  roles?: UserRole[];
  badge?: string;
  children?: NavChildConfig[];
  isActionButton?: boolean;
}

export const generalNavigationConfig: NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    route: "/",
    icon: "bi-speedometer2",
    requiredPermissions: [Permission.VIEW_DASHBOARD],
  },
  {
    id: "projects",
    label: "Projects",
    route: "/projects",
    icon: "bi-briefcase",
    requiredPermissions: [Permission.VIEW_PROJECTS],
  },
  {
    id: "tasks",
    label: "Tasks",
    route: "/tasks",
    icon: "bi-check2-square",
    requiredPermissions: [Permission.VIEW_TASKS],
  },
  {
    id: "clients",
    label: "Clients",
    route: "/clients",
    icon: "bi-people",
    requiredPermissions: [Permission.VIEW_CLIENTS],
  },
  {
    id: "crm",
    label: "CRM",
    icon: "bi-graph-up-arrow",
    requiredPermissions: [Permission.VIEW_LEADS],
    children: [
      { id: "leads", label: "Leads", route: "/crm", requiredPermissions: [Permission.VIEW_LEADS] },
      { id: "proposals", label: "Proposals", route: "/proposals", requiredPermissions: [Permission.VIEW_PROPOSALS] },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "bi-cash-stack",
    requiredPermissions: [Permission.VIEW_LEADS],
    children: [{ id: "invoices", label: "Invoices", route: "/invoices", requiredPermissions: [Permission.VIEW_LEADS] }],
  },
  {
    id: "operations",
    label: "Operations",
    icon: "bi-gear",
    requiredPermissions: [Permission.VIEW_REMINDERS],
    children: [
      { id: "reminders", label: "Reminders", route: "/reminders", requiredPermissions: [Permission.VIEW_REMINDERS] },
      { id: "seo", label: "SEO Dashboard", route: "/seo", requiredPermissions: [Permission.VIEW_SEO_DASHBOARD] },
    ],
  },
  {
    id: "hr_docs",
    label: "HR Docs",
    route: "/hr-documents",
    icon: "bi-file-earmark-lock",
    requiredPermissions: [Permission.GENERATE_HR_DOCS],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: "bi-hdd-network",
    requiredPermissions: [Permission.MANAGE_INFRASTRUCTURE],
    children: [
      { id: "servers", label: "Servers", route: "/admin/servers", requiredPermissions: [Permission.MANAGE_INFRASTRUCTURE] },
      { id: "domains", label: "Domains", route: "/infrastructure/domains", requiredPermissions: [Permission.MANAGE_INFRASTRUCTURE] },
      { id: "credentials", label: "Credentials", route: "/infrastructure/credentials", requiredPermissions: [Permission.MANAGE_INFRASTRUCTURE] }
    ]
  },
  {
    id: "tracking",
    label: "Work Tracking",
    route: "/admin/tracking",
    icon: "bi-clock-history",
    requiredPermissions: [Permission.MANAGE_SETTINGS],
  },
  {
    id: "reports",
    label: "Work Reports",
    route: "/admin/reports",
    icon: "bi-graph-up",
    requiredPermissions: [Permission.MANAGE_SETTINGS],
  },
];

export const clientNavigationConfig: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", route: "/client/dashboard", icon: "bi-speedometer2" },
  { id: "projects", label: "Projects", route: "/client/projects", icon: "bi-briefcase" },
  { id: "updates", label: "Daily Work Updates", route: "/client/updates", icon: "bi-journal-text" },
  { id: "seo_reports", label: "SEO Reports", route: "/client/seo", icon: "bi-graph-up-arrow" },
  { id: "documents", label: "Documents", route: "/client/documents", icon: "bi-file-earmark-medical" },
  { id: "invoices", label: "Invoices", route: "/client/invoices", icon: "bi-cash-stack" },
];

export const seoManagerNavigationConfig: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", route: "/seo?tab=dashboard", icon: "bi-speedometer2" },
  { id: "websites", label: "Websites", route: "/seo?tab=websites", icon: "bi-globe" },
  { id: "activities", label: "Activities", route: "/seo?tab=activities", icon: "bi-link-45deg" },
  { id: "targets", label: "Monthly Targets", route: "/seo?tab=targets", icon: "bi-graph-up-arrow" },
  { id: "performance", label: "Team Performance", route: "/seo?tab=performance", icon: "bi-users" },
  { id: "reports", label: "Reports", route: "/seo?tab=reports", icon: "bi-file-earmark-text" },
  { id: "activity_types", label: "Activity Types", route: "/seo?tab=activity-types", icon: "bi-gear" },
  { id: "tasks", label: "Tasks & Reminders", route: "/seo?tab=tasks", icon: "bi-check2-circle" }
];

export const seoExecutiveNavigationConfig: NavItemConfig[] = [
  { id: "dashboard", label: "Dashboard", route: "/seo?tab=performance", icon: "bi-speedometer2" },
  { id: "websites", label: "Assigned Websites", route: "/seo?tab=websites", icon: "bi-globe" },
  { id: "activities", label: "My Activities", route: "/seo?tab=activities", icon: "bi-link-45deg" },
  { id: "targets", label: "My Monthly Targets", route: "/seo?tab=targets", icon: "bi-graph-up-arrow" },
  { id: "tasks", label: "My SEO Tasks", route: "/seo?tab=tasks", icon: "bi-check2-circle" },
  { id: "reminders", label: "My Reminders", route: "/reminders", icon: "bi-clock" },
  { id: "submit_work", label: "Submit Daily Work", route: "/seo?tab=activities&action=submit-work", icon: "bi-plus-circle", isActionButton: true }
];
