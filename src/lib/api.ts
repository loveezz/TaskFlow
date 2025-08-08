export const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:4000';

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

async function request(path: string, options: RequestInit = {}, retry = true): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (res.status === 401 && retry) {
    const refreshed = await refresh();
    if (refreshed) return request(path, options, false);
  }
  
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

export async function login(email: string, password: string) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function register(email: string, password: string, name: string) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refresh(): Promise<boolean> {
  try {
    const data = await request('/api/auth/refresh', { method: 'POST' }, false);
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function logout() {
  await request('/api/auth/logout', { method: 'POST' }, false);
  setAccessToken(null);
}

// Tasks
export type ApiTask = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  projectId: string;
  assigneeId?: string;
};

export async function fetchTasks(): Promise<ApiTask[]> {
  const data = await request('/api/tasks');
  return data.tasks;
}

export async function createTask(payload: Partial<ApiTask>): Promise<ApiTask> {
  const data = await request('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
  return data.task;
}

export async function updateTask(id: string, payload: Partial<ApiTask>): Promise<ApiTask> {
  const data = await request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return data.task;
}

// Dashboard
export async function fetchStats(): Promise<{ projectsCount: number; tasks: number; completedTasks: number; pendingTasks: number; completionRate: number; }>{
  return request('/api/dashboard/stats');
}

// Chat
export type ApiChannel = { id: string; name: string; description?: string; type: 'public'|'private'|'direct'; taskId?: string; projectId?: string };
export type ApiMessage = { id: string; content: string; createdAt: string; author: { id: string; name: string }; channelId: string };

export async function fetchChannels(params?: { taskId?: string; projectId?: string }): Promise<ApiChannel[]> {
  const query = new URLSearchParams();
  if (params?.taskId) query.set('taskId', params.taskId);
  if (params?.projectId) query.set('projectId', params.projectId);
  const data = await request(`/api/chat/channels${query.toString() ? `?${query.toString()}` : ''}`);
  return data.channels;
}

export async function fetchMessages(channelId: string): Promise<ApiMessage[]> {
  const data = await request(`/api/chat/channels/${channelId}/messages`);
  return data.messages;
}

export async function sendMessage(channelId: string, content: string): Promise<ApiMessage> {
  const data = await request(`/api/chat/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
  return data.message;
}

// Graph
export type TaskGraph = {
  nodes: Array<{ id: string; label: string; status: 'todo'|'in_progress'|'review'|'done'; priority: 'low'|'medium'|'high'|'urgent' }>;
  edges: Array<{ from: string; to: string }>;
};

export async function fetchTaskGraph(params: { projectId?: string; rootTaskId?: string }): Promise<TaskGraph> {
  const query = new URLSearchParams();
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.rootTaskId) query.set('rootTaskId', params.rootTaskId);
  return request(`/api/graph/tasks?${query.toString()}`);
}


