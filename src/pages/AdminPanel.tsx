import * as React from 'react';
import {
  ShieldAlert, Users, TrendingUp, Activity, Loader2, AlertCircle,
  RefreshCw, Trash2, UserCog, CheckCircle, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '../components/ui/dialog';
import { useToast } from '../components/ToastProvider';
import { useAdminGetUsers, useAdminGetStats, useAdminUpdateUser, useAdminDeleteUser } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  phone?: string;
  planName?: string;
}

interface AdminStats {
  totalUsers?: number;
  activeUsers?: number;
  totalProviders?: number;
  totalTrades?: number;
  totalRevenue?: number;
  activeSubscriptions?: number;
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminGetStats();
  const { data: usersData, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useAdminGetUsers();
  const updateMutation = useAdminUpdateUser();
  const deleteMutation = useAdminDeleteUser();

  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);
  const [editTarget, setEditTarget] = React.useState<AdminUser | null>(null);
  const [editRole, setEditRole] = React.useState('');
  const [search, setSearch] = React.useState('');

  const s: AdminStats = stats || {};
  const users: AdminUser[] = Array.isArray(usersData) ? usersData : [];

  const filteredUsers = search.trim()
    ? users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast(`User "${deleteTarget.name || deleteTarget.email}" deleted`, 'success');
      setDeleteTarget(null);
      refetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  }

  async function handleUpdateRole() {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, data: { role: editRole } });
      toast(`Role updated to ${editRole}`, 'success');
      setEditTarget(null);
      refetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  const roleBadge = (role: string | undefined) => {
    if (role === 'admin') return <Badge variant="destructive">Admin</Badge>;
    if (role === 'provider') return <Badge variant="warning">Provider</Badge>;
    return <Badge variant="info">User</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Admin Terminal</h1>
              <p className="text-sm text-zinc-400">Platform management and system oversight.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => { refetchStats(); refetchUsers(); }} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </Button>
        </div>

        {/* Stats Grid */}
        {!statsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Users',    value: s.totalUsers,          color: 'text-zinc-100' },
              { label: 'Active Users',   value: s.activeUsers,         color: 'text-emerald-400' },
              { label: 'Providers',      value: s.totalProviders,      color: 'text-purple-400' },
              { label: 'Total Trades',   value: s.totalTrades,         color: 'text-blue-400' },
              { label: 'Active Subs',    value: s.activeSubscriptions, color: 'text-amber-400' },
              { label: 'Revenue (KES)',  value: s.totalRevenue != null ? Number(s.totalRevenue).toLocaleString() : null, color: 'text-emerald-400' },
            ].map(stat => (
              <Card key={stat.label} className="bg-[#0c0c0e]">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 ${stat.color}`}>
                    {stat.value != null ? stat.value : '—'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {statsLoading && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
          </div>
        )}

        {/* Users Table */}
        <Card className="bg-[#0c0c0e]">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                User Management
              </CardTitle>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600 w-52"
              />
            </div>
          </CardHeader>

          {usersLoading && (
            <CardContent className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading users…</p>
            </CardContent>
          )}

          {usersError && (
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-zinc-300">Failed to load users</p>
              <Button variant="secondary" onClick={() => refetchUsers()} className="text-xs gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </CardContent>
          )}

          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <CardContent className="flex flex-col items-center py-12 gap-2">
              <Users className="h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-400">{search ? 'No users match your search.' : 'No users found.'}</p>
            </CardContent>
          )}

          {!usersLoading && !usersError && filteredUsers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-purple-400">
                          {(user.name || user.email || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-zinc-200">{user.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">{user.email || '—'}</TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{user.planName || '—'}</TableCell>
                    <TableCell>
                      {user.status === 'active' || user.status == null
                        ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle className="h-3 w-3" />Active</span>
                        : <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><XCircle className="h-3 w-3" />Inactive</span>}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{fmtDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditTarget(user); setEditRole(user.role || 'user'); }}
                          className="h-7 w-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
                          title="Edit role"
                        >
                          <UserCog className="h-3.5 w-3.5 text-zinc-400 hover:text-purple-400" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="h-7 w-7 rounded-lg hover:bg-red-900/30 flex items-center justify-center transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-400" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* System Status */}
        <Card className="bg-[#0c0c0e]">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Signal Engine', status: 'operational' },
                { label: 'MT5 Bridge', status: 'operational' },
                { label: 'M-Pesa Gateway', status: 'operational' },
              ].map(svc => (
                <div key={svc.label} className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-4 py-3">
                  <span className="text-sm text-zinc-300">{svc.label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Changing role for <span className="text-zinc-200 font-medium">{editTarget?.name || editTarget?.email}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">User</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdateRole} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Permanently delete <span className="text-zinc-200 font-medium">"{deleteTarget?.name || deleteTarget?.email}"</span>?
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</> : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
