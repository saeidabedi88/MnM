export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  thinking?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: string;
  project_id: number;
  importance?: number;
  due_date?: string;
  is_recurring?: boolean;
  ai_context?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  created_at: string;
  owner_email: string;
}

export interface User {
  email: string;
  disabled?: boolean;
} 