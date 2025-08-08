import { API_BASE } from './api';

export type ApiProject = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  tasksCount: number;
  completedTasks: number;
};

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

export async function fetchProjects(): Promise<ApiProject[]> {
  const data = await request('/api/projects');
  return data.projects as ApiProject[];
}

