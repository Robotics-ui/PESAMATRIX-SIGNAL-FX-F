import { useAuthUser } from '../api/client';
import { Bell, ShieldCheck, Radio } from 'lucide-react';
import { Badge } from './ui/badge';

export default function Header() {
  const { data: user } = useAuthUser();

  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-zinc-400 text-xs bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          <Radio className="h-3 w-3 text-emerald-400 animate-ping" />
          <span>Core Synchronization Engine Functional</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-zinc-400 hover:text-zinc-200 relative p-1">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-purple-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-zinc-850" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-100">{user?.fullName || user?.name || user?.email || 'Operator'}</p>
            <div className="flex items-center justify-end gap-1">
              <ShieldCheck className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-purple-400 text-sm">
            {(user?.fullName || user?.name || user?.email || 'PM').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
