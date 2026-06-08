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
    // Attempt token refresh logic or redirect
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

// Global API Hooks (Matching OpenAPI Backend Specifications)
export const useAuthUser = () => useQuery({ queryKey: ['auth-user'], queryFn: () => apiFetch('/auth/me'), retry: false });
export const useGetDashboard = () => useQuery({ queryKey: ['dashboard-metrics'], queryFn: () => apiFetch('/dashboard/overview'), refetchInterval: 5000 });
export const useGetProviders = () => useQuery({ queryKey: ['providers'], queryFn: () => apiFetch('/providers') });
export const useGetMT5Accounts = () => useQuery({ queryKey: ['mt5-accounts'], queryFn: () => apiFetch('/accounts') });
export const useGetTrades = () => useQuery({ queryKey: ['trades'], queryFn: () => apiFetch('/trades'), refetchInterval: 4000 });
export const useGetPlans = () => useQuery({ queryKey: ['plans'], queryFn: () => apiFetch('/plans') });

export const useMpesaPush = () => {
  return useMutation({
    mutationFn: (data: { planId: string; phoneNumber: string }) => 
      apiFetch('/billing/mpesa/stk-push', { method: 'POST', body: JSON.stringify(data) })
  });
};

export const useConnectMT5 = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/accounts/connect', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mt5-accounts'] })
  });
};
