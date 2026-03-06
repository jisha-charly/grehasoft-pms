
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
  created_at?: string;
  updated_at?: string;
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
 created_at?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  name?: string;
  username: string;
  email: string;

  role_name?: string;

  department?: number | null;
  department_name?: string;
  departmentId?: number;

  status?: 'active' | 'inactive';

  date_joined?: string;
  last_login?: string;

  createdAt?: string;

  role: UserRole;
}


export interface Client {
  id: number;
   name: string;  
  company_name: string;
  email: string;
  phone?: string;
  gst_number?: string;
  address?: string;
  created_at?: string;
}

export interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName?: string;
  department: number;
  project_manager: number;
  createdBy: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress_percentage: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface Task {
  id: number;

  // relation fields
  projectId?: number;          // used when creating
  project_id?: number;         // from backend
  project_name?: string;       // from backend

  milestoneId?: number;

  title: string;
  description: string;

  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;

  boardOrder?: number;

  dueDate?: string;            // camelCase (if used)
  due_date?: string;           // snake_case from backend

  assignees: number[];

  taskTypeId?: number;
  task_type_name?: string;

  createdBy?: number;
 created_at?: string;
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
  task: number;
  uploaded_by: number;
  file: string;           // actual file URL
  file_path: string;
  file_type: string;
  revision_no: number;
  uploaded_at: string;
}

export interface TaskReview {
  id: number;
  task_file: number;
  reviewer: number;
  reviewed_by_role: 'PM' | 'ADMIN';
  review_version: number;
  comments: string;
  status: 'approved' | 'rework';
  reviewed_at: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

  client?: number;               // 🔥 new
  converted_project?: number | null;
  client_name?: string | null;  
  createdAt: string;
  updatedAt?: string;
}
export interface LeadAssignment {
  id: number;
  lead_id: number;
  sales_exec_id: number;
  assigned_at: string;
    // ✅ ADD THIS
  sales_exec_details?: {
    id: number;
    name: string;
  };
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
 progress_percentage: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface ProjectMember {
  id: number;
  project: number;
  user: number;
  role_in_project: string;

  user_details?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ActivityLog {
  id: number;
  userId: number;
  projectId: number;
  taskId?: string;
  action: string;
  createdBy: number
  created_at: string;
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
