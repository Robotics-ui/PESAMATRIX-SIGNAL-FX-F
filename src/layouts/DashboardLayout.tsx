import * as React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuthUser } from '../api/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs tracking-widest uppercase">Initializing Platform Session Architecture...</p>
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
