export type ContactRole = 'Client' | 'Agency' | 'Crew' | 'Talent' | 'Vendor' | 'Partner';
export type ContactStatus = 'Active' | 'Inactive' | 'Prospect';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: ContactRole;
  status: ContactStatus;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ProjectType = 'Commercial' | 'Documentary' | 'Music Video' | 'Corporate' | 'Social Media';
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPhase = 'Pre-production' | 'Production' | 'Post-production' | 'Delivered';

export interface Project {
  id: string;
  title: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  phase: ProjectPhase;
  client_id?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  team_members: string[];
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Creative' | 'Technical' | 'Administrative';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  project_id: string;
  assigned_to?: string;
  due_date?: string;
  priority: TaskPriority;
  type: TaskType;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  hourly_rate?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  title: string;
  location_id: string;
  client_id?: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
