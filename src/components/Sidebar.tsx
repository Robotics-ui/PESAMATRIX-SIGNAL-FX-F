import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Users, CreditCard, History, Cpu, ShieldAlert, LogOut, Activity } from 'lucide-react';

interface SidebarProps {
  userRole?: 'user' | 'provider' | 'admin';
}

export default function Sidebar({ userRole = 'user' }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['user', 'provider', 'admin'] },
    { name: 'Providers', path: '/providers', icon: Users, roles: ['user', 'provider', 'admin'] },
    { name: 'MT5 Accounts', path: '/accounts', icon: Cpu, roles: ['user', 'provider', 'admin'] },
    { name: 'Trade Ledger', path: '/history', icon: History, roles: ['user', 'provider', 'admin'] },
    { name: 'Subscriptions', path: '/billing', icon: CreditCard, roles: ['user', 'provider', 'admin'] },
    { name: 'Admin Terminal', path: '/admin', icon: ShieldAlert, roles: ['admin'] },
  ];

  const handleLogout = () => {
    localStorage.removeItem('pmatrix_access_token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-wider text-white">PMATRIX</span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600/10 text-purple-400 border-l-2 border-purple-500 pl-3' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-900">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
