/**
 * CivicEye API Service
 * File: services/api.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://10.10.49.30:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CivicUser {
  id:          number;
  email:       string;
  date_joined: string;
  is_staff?:   boolean;
  department?: string;
}

export interface AuthResponse {
  message:  string;
  user:     CivicUser;
  access:   string;
  refresh:  string;
  is_staff?: boolean;
  department?: string;
}

export interface Department {
  id:       number;
  name:     string;
  category: string;
  email:    string;
}

export interface Report {
  id:          number;
  title:       string;
  description: string;
  location:    string;
  category:    string;
  status:      'pending' | 'in_progress' | 'resolved';
  image?:      string | null;
  latitude?:   number | null;
  longitude?:  number | null;
  is_sos:      boolean;
  ai_detected: boolean;
  department?: Department | null;
  comments:    ReportComment[];
  created_at:  string;
  updated_at:  string;
}

export interface ReportComment {
  id:           number;
  author_email: string;
  text:         string;
  created_at:   string;
}

export interface DashboardStats {
  total:       number;
  resolved:    number;
  pending:     number;
  in_progress: number;
}

// ─── Token storage ────────────────────────────────────────────────────────────
const ACCESS_KEY    = 'civiceye_access';
const REFRESH_KEY   = 'civiceye_refresh';
const IS_STAFF_KEY  = 'civiceye_is_staff';
const DEPT_KEY      = 'civiceye_department';

export const storeTokens = async (tokens: { access: string; refresh: string; is_staff?: boolean; department?: string }) => {
  const pairs: [string, string][] = [
    [ACCESS_KEY,   tokens.access],
    [REFRESH_KEY,  tokens.refresh],
    [IS_STAFF_KEY, tokens.is_staff ? '1' : '0'],
  ];
  if (tokens.department) {
    pairs.push([DEPT_KEY, tokens.department]);
  }
  await AsyncStorage.multiSet(pairs);
};

export const getAccessToken   = async () => AsyncStorage.getItem(ACCESS_KEY);
export const getRefreshToken  = async () => AsyncStorage.getItem(REFRESH_KEY);
export const getIsStaff       = async () => {
  const v = await AsyncStorage.getItem(IS_STAFF_KEY);
  return v === '1';
};
export const getDepartment    = async () => AsyncStorage.getItem(DEPT_KEY);
export const clearTokens      = async () => {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, IS_STAFF_KEY, DEPT_KEY]);
};

// ─── Base fetch ───────────────────────────────────────────────────────────────
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error || data?.detail || data?.non_field_errors?.[0] || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const isStaff = !!(data.is_staff || data.user?.is_staff);
  await storeTokens({ access: data.access, refresh: data.refresh, is_staff: isStaff });
  return { ...data, is_staff: isStaff };
}

export async function staffLoginUser(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch('/auth/staff-login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const department = data.department || data.user?.department;
  await storeTokens({ access: data.access, refresh: data.refresh, is_staff: true, department });
  return { ...data, is_staff: true, department };
}

export async function registerUser(email: string, password: string, password2: string): Promise<AuthResponse> {
  const data = await apiFetch('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, password2 }),
  });
  await storeTokens({ access: data.access, refresh: data.refresh, is_staff: false });
  return data;
}

export async function logoutUser(): Promise<void> {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  if (access) {
    await apiFetch('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }).catch(() => {});
  }
  await clearTokens();
}

export async function getMe(): Promise<CivicUser> {
  return apiFetch('/auth/me/');
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function fetchStats(department?: string): Promise<DashboardStats> {
  let path = '/reports/stats/';
  if (department) path += `?department=${department}`;
  return apiFetch(path);
}

export async function fetchReports(params?: { limit?: number; status?: string; department?: string }): Promise<Report[]> {
  let path = '/reports/?ordering=-created_at';
  if (params?.limit)     path += `&limit=${params.limit}`;
  if (params?.status)    path += `&status=${params.status}`;
  if (params?.department) path += `&department=${params.department}`;
  const data = await apiFetch(path);
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function fetchReportDetail(id: number): Promise<Report> {
  return apiFetch(`/reports/${id}/`);
}

export async function submitReport(form: FormData): Promise<Report> {
  return apiFetch('/reports/', { method: 'POST', body: form });
}

export async function updateReportStatus(id: number, status: string): Promise<Report> {
  return apiFetch(`/reports/${id}/`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function addComment(reportId: number, text: string): Promise<ReportComment> {
  return apiFetch(`/reports/${reportId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function submitSOS(form: FormData): Promise<any> {
  return apiFetch('/reports/sos/', { method: 'POST', body: form });
}