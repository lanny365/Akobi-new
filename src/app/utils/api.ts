const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8001/api';
const TOKEN_STORAGE_KEY = 'akobi_backend_token';
const DEMO_EMAIL = 'admin@akobi.test';
const DEMO_PASSWORD = 'password';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || DEFAULT_API_BASE_URL;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export interface BackendDepartment {
  id: number;
  name: string;
  code: string;
  category: string;
  is_clinical: boolean;
  status: string;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id?: number | null;
}

export interface BackendPatientCard {
  id: number;
  patient_id: number;
  card_number: string;
  card_type: string;
  wallet_balance?: number;
  issued_at?: string | null;
  status: string;
}

export interface BackendPatient {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  next_of_kin_name?: string | null;
  next_of_kin_phone?: string | null;
  status: string;
  card?: BackendPatientCard | null;
}

export interface BackendVisit {
  id: number;
  patient_id: number;
  department_id: number;
  doctor_id?: number | null;
  visit_number: string;
  chief_complaint: string;
  reason_to_see_doctor?: string | null;
  consultation_type?: string | null;
  treatment_type?: string | null;
  status: string;
  queued_at?: string | null;
  patient: BackendPatient;
  department?: BackendDepartment | null;
  doctor?: BackendUser | null;
  vital_sign?: {
    id: number;
  } | null;
}

export interface CreatePatientPayload {
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
  genotype?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  card_type: string;
}

export interface CreateVisitPayload {
  patient_id: number;
  department_id: number;
  doctor_id?: number;
  chief_complaint: string;
  reason_to_see_doctor?: string;
  consultation_type?: string;
  treatment_type?: string;
}

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

let inMemoryToken: string | null = null;
let departmentsCache: BackendDepartment[] | null = null;

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return inMemoryToken;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function storeToken(token: string): void {
  inMemoryToken = token;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

function clearStoredToken(): void {
  inMemoryToken = null;

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isApiErrorPayload(payload)) {
    return fallback;
  }

  const fieldError = payload.errors
    ? Object.values(payload.errors).flat()[0]
    : null;

  return fieldError || payload.message || fallback;
}

async function loginWithDemoAccount(): Promise<string> {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      device_name: 'react-frontend',
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; user?: BackendUser }
    | null;

  if (!response.ok || !payload?.token) {
    throw new Error(getErrorMessage(payload, 'Unable to sign in to the backend.'));
  }

  storeToken(payload.token);
  return payload.token;
}

async function ensureAuthToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const existingToken = inMemoryToken || getStoredToken();
    if (existingToken) {
      inMemoryToken = existingToken;
      return existingToken;
    }
  }

  return loginWithDemoAccount();
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!path.startsWith('/auth/login')) {
    headers.set('Authorization', `Bearer ${await ensureAuthToken()}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (response.status === 401 && retry && !path.startsWith('/auth/login')) {
    clearStoredToken();
    return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'The backend request failed.'));
  }

  return payload as T;
}

export async function getDepartments(forceRefresh = false): Promise<BackendDepartment[]> {
  if (departmentsCache && !forceRefresh) {
    return departmentsCache;
  }

  const response = await apiRequest<{ data: BackendDepartment[] }>('/departments');
  departmentsCache = response.data;
  return response.data;
}

export async function searchPatients(search: string): Promise<BackendPatient[]> {
  const query = search.trim();
  if (!query) {
    return [];
  }

  const response = await apiRequest<{ data: BackendPatient[] }>(
    `/patients?search=${encodeURIComponent(query)}`,
  );

  return response.data;
}

export async function createPatient(payload: CreatePatientPayload): Promise<BackendPatient> {
  const response = await apiRequest<{ message: string; data: BackendPatient }>('/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function createVisit(payload: CreateVisitPayload): Promise<BackendVisit> {
  const response = await apiRequest<{ message: string; data: BackendVisit }>('/visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function fetchVitalSignsQueue(): Promise<BackendVisit[]> {
  const response = await apiRequest<{ data: BackendVisit[] }>('/queue/vital-signs');
  return response.data;
}

export async function resolveDepartmentId(selection?: string): Promise<number> {
  const departments = await getDepartments();
  const normalizedSelection = selection?.trim().toLowerCase();

  const preferredCode = normalizedSelection === 'surgery' ? 'THR' : 'CLIN';
  const department =
    departments.find((item) => item.code === preferredCode) ||
    departments.find((item) => item.code === 'CLIN') ||
    departments[0];

  if (!department) {
    throw new Error('No departments are available in the backend.');
  }

  return department.id;
}
