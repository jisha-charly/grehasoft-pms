
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_EXECUTIVE = 'SALES_EXECUTIVE',
  CLIENT = 'CLIENT'
}

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
  status: 'active' | 'inactive';
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
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
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
  createdAt: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  progress: number;
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
