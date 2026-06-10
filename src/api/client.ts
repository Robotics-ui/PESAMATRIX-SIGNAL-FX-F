import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.PROD
  ? 'https://pesamatrix-backend--philipcraig11.replit.app/api'
  : '/api';

// ─── Core fetcher ────────────────────────────────────────────────────────────
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('pmatrix_access_token');
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error('Network error — check your connection or the API server.');
  }

  if (res.status === 401) {
    localStorage.removeItem('pmatrix_access_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  const data = await res.json();
  if (data && typeof data === 'object' && data.error && !data.accessToken && !data.token && !data.access_token) {
    throw new Error(data.error);
  }
  return data;
}

// ─── Multipart upload with XHR progress ──────────────────────────────────────
export async function apiUpload(
  endpoint: string,
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<unknown> {
  const token = localStorage.getItem('pmatrix_access_token');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        localStorage.removeItem('pmatrix_access_token');
        window.location.href = '/login';
        reject(new Error('Unauthorized'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(xhr.status !== 204 ? JSON.parse(xhr.responseText) : null); }
        catch { resolve(null); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).message || 'Upload failed')); }
        catch { reject(new Error(`Upload failed (${xhr.status})`)); }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    xhr.send(formData);
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const useAuthUser = () =>
  useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const token = localStorage.getItem('pmatrix_access_token');
      if (!token) return null;
      try {
        const stored = localStorage.getItem('pmatrix_user');
        return stored ? JSON.parse(stored) : { token };
      } catch {
        return { token };
      }
    },
    retry: false,
  });

export const useLogin = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  });

export const useRegister = () =>
  useMutation({
    mutationFn: (data: { fullName: string; email: string; password: string; phoneNumber: string; confirmPassword: string }) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  });

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const useGetDashboard = () =>
  useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiFetch('/dashboard/overview'),
    refetchInterval: 5000,
    retry: false,
  });

// ─── Providers ───────────────────────────────────────────────────────────────
export const useGetProviders = () =>
  useQuery({ queryKey: ['providers'], queryFn: () => apiFetch('/providers'), retry: false });

export const useSubscribeProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) =>
      apiFetch(`/providers/${providerId}/subscribe`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });
};

export const useUnsubscribeProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) =>
      apiFetch(`/providers/${providerId}/unsubscribe`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });
};

// ─── MT5 Accounts ────────────────────────────────────────────────────────────
export const useGetMT5Accounts = () =>
  useQuery({ queryKey: ['mt5-accounts'], queryFn: () => apiFetch('/accounts'), retry: false });

export const useConnectMT5 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { login: string; password: string; server: string }) =>
      apiFetch('/accounts/connect', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mt5-accounts'] }),
  });
};

export const useDisconnectMT5 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      apiFetch(`/accounts/${accountId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mt5-accounts'] }),
  });
};

// ─── Trades ──────────────────────────────────────────────────────────────────
export const useGetTrades = () =>
  useQuery({
    queryKey: ['trades'],
    queryFn: () => apiFetch('/trades'),
    refetchInterval: 4000,
    retry: false,
  });

// ─── Plans & Billing ─────────────────────────────────────────────────────────
export const useGetPlans = () =>
  useQuery({ queryKey: ['plans'], queryFn: () => apiFetch('/plans'), retry: false });

export const useGetSubscription = () =>
  useQuery({ queryKey: ['subscription'], queryFn: () => apiFetch('/billing/subscription'), retry: false });

export const useMpesaPush = () =>
  useMutation({
    mutationFn: (data: { planId: string; phoneNumber: string }) =>
      apiFetch('/billing/mpesa/stk-push', { method: 'POST', body: JSON.stringify(data) }),
  });

// ─── Admin ───────────────────────────────────────────────────────────────────
export const useAdminGetUsers = () =>
  useQuery({ queryKey: ['admin-users'], queryFn: () => apiFetch('/admin/users'), retry: false });

export const useAdminGetStats = () =>
  useQuery({ queryKey: ['admin-stats'], queryFn: () => apiFetch('/admin/stats'), refetchInterval: 10000, retry: false });

export const useAdminUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};

export const useAdminDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
};

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
  useQuery<MediaItem[]>({ queryKey: ['media'], queryFn: () => apiFetch('/media'), retry: false });

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
