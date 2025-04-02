import axios from 'axios';
import { Project, Task } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include token in all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - redirecting to login');
      // Optionally redirect to login or handle 401 error
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface ProjectCreationDetails {
  title: string;
  description: string;
  tasks?: {
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }[];
}

interface ChatOptions {
  createProject?: boolean;
  projectDetails?: ProjectCreationDetails;
}

export const authService = {
  // Auth functionality now handled by the AuthProvider
  isAuthenticated: () => {
    if (typeof window === 'undefined') {
      return false; // We're on the server
    }
    return !!localStorage.getItem('token');
  }
};

export const projectService = {
  getProjects: async () => {
    try {
      const response = await api.get('/api/v1/projects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },

  createProject: async (title: string, description: string) => {
    try {
      const response = await api.post('/api/v1/projects', { title, description });
      return response.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  getProject: async (id: number) => {
    try {
      const response = await api.get(`/api/v1/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  },

  updateProject: async (id: number, data: { title: string; description: string }) => {
    try {
      const response = await api.put(`/api/v1/projects/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },
  
  deleteProject: async (id: number) => {
    try {
      const response = await api.delete(`/api/v1/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }
};

export const taskService = {
  getProjectTasks: async (projectId: number) => {
    const response = await api.get(`/api/v1/projects/${projectId}/tasks`);
    return response.data;
  },
  createTask: async (projectId: number, title: string, description: string) => {
    const response = await api.post(`/api/v1/projects/${projectId}/tasks`, {
      title,
      description
    });
    return response.data;
  },
  updateTask: async (projectId: number, taskId: number, data: {
    title?: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    importance?: number;
    due_date?: string;
    is_recurring?: boolean;
    ai_context?: string;
  }) => {
    const response = await api.put(`/api/v1/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },
  deleteTask: async (projectId: number, taskId: number) => {
    const response = await api.delete(`/api/v1/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }
};

export const chatService = {
  sendMessage: async (message: string, projectId?: number, options?: ChatOptions) => {
    try {
      if (options?.createProject && options.projectDetails) {
        // Create project first
        const projectResponse = await api.post('/api/v1/projects', {
          title: options.projectDetails.title,
          description: options.projectDetails.description,
        });

        const newProject = projectResponse.data;

        // Create tasks if provided
        if (options.projectDetails.tasks) {
          for (const task of options.projectDetails.tasks) {
            await api.post(`/api/v1/projects/${newProject.id}/tasks`, task);
          }
        }

        // Send chat message with context
        const chatResponse = await api.post('/api/v1/chat', {
          message,
          project_id: newProject.id,
        });

        return {
          ...chatResponse.data,
          projectCreated: true,
        };
      }

      // Regular chat message
      const response = await api.post('/api/v1/chat', {
        message,
        project_id: projectId,
      });

      return response.data;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  },
}; 