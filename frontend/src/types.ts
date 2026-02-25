
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_EXECUTIVE = 'SALES_EXECUTIVE',
  CLIENT = 'CLIENT'
}

export enum Permission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  MANAGE_PROJECTS = 'MANAGE_PROJECTS',
  VIEW_PROJECTS = 'VIEW_PROJECTS',
  MANAGE_TASKS = 'MANAGE_TASKS',
  VIEW_TASKS = 'VIEW_TASKS',
  MANAGE_CLIENTS = 'MANAGE_CLIENTS',
  VIEW_CLIENTS = 'VIEW_CLIENTS',
  MANAGE_LEADS = 'MANAGE_LEADS',
  VIEW_LEADS = 'VIEW_LEADS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_PROJECTS,
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_TASKS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_LEADS,
    Permission.VIEW_LEADS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
  ],
  [UserRole.PROJECT_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROJECTS,
    Permission.MANAGE_PROJECTS,
    Permission.VIEW_TASKS,
    Permission.MANAGE_TASKS,
    Permission.VIEW_CLIENTS,
    Permission.VIEW_LEADS,
  ],
  [UserRole.TEAM_MEMBER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_PROJECTS,
    Permission.VIEW_TASKS,
    Permission.MANAGE_TASKS,
  ],
  [UserRole.SALES_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_LEADS,
    Permission.MANAGE_LEADS,
  ],
  [UserRole.SALES_EXECUTIVE]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_LEADS,
    Permission.MANAGE_LEADS,
  ],
  [UserRole.CLIENT]: [
    Permission.VIEW_PROJECTS,
    Permission.VIEW_TASKS,
  ],
};

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done'
}

export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed'
}

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  parentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskType {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  departmentId: number;
   department_name?: string; // ✅ ADD THIS
  status: 'active' | 'inactive';
  createdAt?: string;   // ✅ ADD THIS
}


export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  gstNo?: string;
  address: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName?: string;
  departmentId: number;
  projectManagerId: number;
  createdBy: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progressPercentage: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface Task {
  id: string;
  projectId: number;
  milestoneId?: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  boardOrder: number;
  dueDate: string;
  assignees: number[];
  taskTypeId: number;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface TaskAssignment {
  id: number;
  taskId: string;
  employeeId: number;
  assignedBy: number;
  assignedAt: string;
  unassignedAt?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface TaskProgress {
  id: number;
  taskId: string;
  progressPercentage: number;
  updatedBy: number;
  updatedAt: string;
}

export interface TaskComment {
  id: number;
  taskId: string;
  userId: number;
  comment: string;
  createdAt: string;
  deletedAt?: string;
}

export interface TaskFile {
  id: number;
  taskId: string;
  uploadedBy: number;
  filePath: string;
  fileType: string;
  revisionNo: number;
  uploadedAt: string;
}

export interface TaskReview {
  id: number;
  taskFileId: number;
  reviewerId: number;
  reviewedByRole: 'PM' | 'ADMIN';
  reviewVersion: number;
  comments: string;
  status: 'approved' | 'rework';
  reviewedAt: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  converted_project_id?: number | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface LeadAssignment {
  id: number;
  lead_id: number;
  sales_exec_id: number;
  assigned_at: string;
}

export interface LeadFollowup {
  id: number;
  lead_id: number;
  followup_type: 'call' | 'whatsapp' | 'meeting' | 'email';
  notes: string;
  next_followup?: string;
  status: 'done' | 'pending';
  created_by: number;
  created_at: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  roleInProject: 'PM' | 'MEMBER' | 'QA' | 'VIEWER';
  addedAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  projectId: number;
  taskId?: string;
  action: string;
  createdAt: string;
}

export interface SEOTask {
  id: number;
  task_id: string;
  seo_type: 'on_page' | 'off_page' | 'technical' | 'content' | 'keyword';
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SEOOnPage {
  id: number;
  seo_task_id: number;
  page_url: string;
  title_optimized: boolean;
  meta_optimized: boolean;
  keyword_density: number;
  mobile_friendly: boolean;
  page_speed_status: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SEOOffPage {
  id: number;
  seo_task_id: number;
  activity_type: string;
  submission_url: string;
  anchor_text: string;
  da: number;
  spam_score: number;
  live_status: 'live' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SEOTechnical {
  id: number;
  seo_task_id: number;
  broken_links: number;
  sitemap_status: 'updated' | 'submitted';
  core_web_vitals_lcp: number;
  core_web_vitals_cls: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SEOKeyword {
  id: number;
  seo_task_id: number;
  keyword: string;
  search_volume: number;
  difficulty: number;
  current_rank: number;
  target_rank: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface GMBProfile {
  id: number;
  project_id: number;
  business_name: string;
  category: string;
  rating: number;
  total_reviews: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SocialMediaPost {
  id: number;
  project_id: number;
  platform: string;
  post_type: string;
  language: string;
  post_url: string;
  posting_date: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface SocialMetric {
  id: number;
  post_id: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
