import * as React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuthUser } from '../api/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuthUser();


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
