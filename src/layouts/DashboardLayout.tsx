import * as React from 'react';
import { useLocation } from 'wouter';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuthUser } from '../api/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useAuthUser();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (!isLoading && (isError || !user)) {
      const token = localStorage.getItem('pmatrix_access_token');
      if (!token) navigate('/login');
    }
  }, [isLoading, isError, user, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Initializing Platform Session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070709]">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
