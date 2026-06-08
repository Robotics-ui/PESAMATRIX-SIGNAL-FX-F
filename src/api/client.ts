import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Interceptor-mimicking base fetcher
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('pmatrix_access_token');
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem('pmatrix_access_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Execution Failure');
  }
  return res.status !== 204 ? res.json() : null;
}

// Multipart upload fetcher with XHR for progress tracking
export async function apiUpload(
  endpoint: string,
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<any> {
  const token = localStorage.getItem('pmatrix_access_token');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        localStorage.removeItem('pmatrix_access_token');
        window.location.href = '/login';
        reject(new Error('Unauthorized'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.status !== 204 ? JSON.parse(xhr.responseText) : null);
        } catch {
          resolve(null);
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    xhr.send(formData);
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const useAuthUser = () =>
  useQuery({ queryKey: ['auth-user'], queryFn: () => apiFetch('/auth/me'), retry: false });

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const useGetDashboard = () =>
  useQuery({ queryKey: ['dashboard-metrics'], queryFn: () => apiFetch('/dashboard/overview'), refetchInterval: 5000 });

// ─── Providers ───────────────────────────────────────────────────────────────
export const useGetProviders = () =>
  useQuery({ queryKey: ['providers'], queryFn: () => apiFetch('/providers') });

// ─── MT5 Accounts ────────────────────────────────────────────────────────────
export const useGetMT5Accounts = () =>
  useQuery({ queryKey: ['mt5-accounts'], queryFn: () => apiFetch('/accounts') });

export const useConnectMT5 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/accounts/connect', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mt5-accounts'] }),
  });
};

// ─── Trades ──────────────────────────────────────────────────────────────────
export const useGetTrades = () =>
  useQuery({ queryKey: ['trades'], queryFn: () => apiFetch('/trades'), refetchInterval: 4000 });

// ─── Plans & Billing ─────────────────────────────────────────────────────────
export const useGetPlans = () =>
  useQuery({ queryKey: ['plans'], queryFn: () => apiFetch('/plans') });

export const useMpesaPush = () =>
  useMutation({
    mutationFn: (data: { planId: string; phoneNumber: string }) =>
      apiFetch('/billing/mpesa/stk-push', { method: 'POST', body: JSON.stringify(data) }),
  });

// ─── Media ───────────────────────────────────────────────────────────────────
export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  uploadedBy?: string;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MediaMetadataUpdate {
  title?: string;
  description?: string;
}

export const useGetMedia = () =>
  useQuery<MediaItem[]>({
    queryKey: ['media'],
    queryFn: () => apiFetch('/media'),
    retry: false,
  });

export const useDeleteMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
};

export const useUpdateMediaMetadata = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MediaMetadataUpdate }) =>
      apiFetch(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
};
