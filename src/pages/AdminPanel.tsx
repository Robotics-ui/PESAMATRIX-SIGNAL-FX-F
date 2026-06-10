import * as React from 'react';
import {
  ShieldAlert, Users, TrendingUp, Activity, Loader2, AlertCircle,
  RefreshCw, Trash2, UserCog, CheckCircle, XCircle, Settings,
  CreditCard, BarChart2, Cpu, Plus, Save,
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
import {
  useAdminGetUsers, useAdminGetStats, useAdminUpdateUser, useAdminDeleteUser,
  useAdminSubscriptionConfig, useUpdateSubscriptionConfig,
  useAdminSubscribers, useAdminAnalytics,
  useAdminMasterAccounts, useAdminCreateMasterAccount, useAdminDeleteMasterAccount,
} from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

type Tab = 'overview' | 'config' | 'subscribers' | 'analytics' | 'master-accounts';

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

interface Subscriber {
  id: string;
  name?: string;
  email?: string;
  planName?: string;
  tradingDays?: number;
  expiresAt?: string;
  phone?: string;
}

interface MasterAccount {
  id: string;
  login: string;
  server: string;
  label?: string;
  balance?: number;
  currency?: string;
  createdAt?: string;
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',       label: 'Overview',         icon: Users },
  { key: 'config',         label: 'Sub Config',       icon: Settings },
  { key: 'subscribers',    label: 'Subscribers',      icon: CreditCard },
  { key: 'analytics',      label: 'Analytics',        icon: BarChart2 },
  { key: 'master-accounts', label: 'Master Accounts', icon: Cpu },
];

export default function AdminPanel() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>('overview');

  // Overview
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminGetStats();
  const { data: usersData, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useAdminGetUsers();
  const updateMutation = useAdminUpdateUser();
  const deleteMutation = useAdminDeleteUser();

  // Config
  const { data: configData, isLoading: configLoading, refetch: refetchConfig } = useAdminSubscriptionConfig();
  const updateConfigMutation = useUpdateSubscriptionConfig();
  const [configForm, setConfigForm] = React.useState({ pricePerDay: '', minDays: '', maxDays: '', currency: 'KES' });
  const [configSaved, setConfigSaved] = React.useState(false);

  React.useEffect(() => {
    if (configData && !configLoading) {
      const c = configData as { pricePerDay?: number; minDays?: number; maxDays?: number; currency?: string };
      setConfigForm({
        pricePerDay: String(c.pricePerDay ?? ''),
        minDays: String(c.minDays ?? ''),
        maxDays: String(c.maxDays ?? ''),
        currency: c.currency ?? 'KES',
      });
    }
  }, [configData, configLoading]);

  // Subscribers
  const { data: subscribersData, isLoading: subsLoading, isError: subsError, refetch: refetchSubs } = useAdminSubscribers();
  const [subsTab, setSubsTab] = React.useState<'active' | 'expired'>('active');

  // Analytics
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useAdminAnalytics();

  // Master Accounts
  const { data: mastersData, isLoading: mastersLoading, isError: mastersError, refetch: refetchMasters } = useAdminMasterAccounts();
  const createMasterMutation = useAdminCreateMasterAccount();
  const deleteMasterMutation = useAdminDeleteMasterAccount();
  const [masterForm, setMasterForm] = React.useState({ login: '', server: '', label: '' });
  const [addingMaster, setAddingMaster] = React.useState(false);
  const [deleteMasterTarget, setDeleteMasterTarget] = React.useState<MasterAccount | null>(null);

  // Users
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);
  const [editTarget, setEditTarget] = React.useState<AdminUser | null>(null);
  const [editRole, setEditRole] = React.useState('');
  const [search, setSearch] = React.useState('');

  const s: AdminStats = stats || {};
  const users: AdminUser[] = Array.isArray(usersData) ? usersData : [];
  const subs = (subscribersData as { active?: Subscriber[]; expired?: Subscriber[] }) || {};
  const activeSubscribers: Subscriber[] = Array.isArray(subs.active) ? subs.active : [];
  const expiredSubscribers: Subscriber[] = Array.isArray(subs.expired) ? subs.expired : [];
  const masters: MasterAccount[] = Array.isArray(mastersData) ? mastersData : [];
  const filteredUsers = search.trim()
    ? users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const a = (analyticsData as {
    totalRevenue?: number; revenueThisMonth?: number; revenueGrowth?: number;
    activeSubscriptions?: number; expiredSubscriptions?: number;
    totalCopiedTrades?: number; successfulTrades?: number; failedTrades?: number;
    successRate?: number; currency?: string;
  }) || {};
  const currency = a.currency || 'KES';

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

  async function handleSaveConfig() {
    const payload = {
      pricePerDay: configForm.pricePerDay ? Number(configForm.pricePerDay) : undefined,
      minDays: configForm.minDays ? Number(configForm.minDays) : undefined,
      maxDays: configForm.maxDays ? Number(configForm.maxDays) : undefined,
      currency: configForm.currency || undefined,
    };
    try {
      await updateConfigMutation.mutateAsync(payload);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      toast('Subscription config saved', 'success');
      refetchConfig();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save config', 'error');
    }
  }

  async function handleAddMaster() {
    if (!masterForm.login.trim() || !masterForm.server.trim()) {
      toast('Login and server are required', 'warning'); return;
    }
    try {
      await createMasterMutation.mutateAsync(masterForm);
      toast('Master account added', 'success');
      setMasterForm({ login: '', server: '', label: '' });
      setAddingMaster(false);
      refetchMasters();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to add master account', 'error');
    }
  }

  async function handleDeleteMaster() {
    if (!deleteMasterTarget) return;
    try {
      await deleteMasterMutation.mutateAsync(deleteMasterTarget.id);
      toast('Master account removed', 'success');
      setDeleteMasterTarget(null);
      refetchMasters();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  }

  const roleBadge = (role: string | undefined) => {
    if (role === 'admin') return <Badge variant="destructive">Admin</Badge>;
    if (role === 'provider') return <Badge variant="warning">Provider</Badge>;
    return <Badge variant="info">User</Badge>;
  };

  function handleRefreshAll() {
    refetchStats(); refetchUsers(); refetchConfig(); refetchSubs(); refetchAnalytics(); refetchMasters();
  }

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
          <Button variant="secondary" onClick={handleRefreshAll} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              data-testid={`tab-admin-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
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
                    data-testid="input-user-search"
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
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
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
                              data-testid={`button-edit-user-${user.id}`}
                              onClick={() => { setEditTarget(user); setEditRole(user.role || 'user'); }}
                              className="h-7 w-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
                            >
                              <UserCog className="h-3.5 w-3.5 text-zinc-400 hover:text-purple-400" />
                            </button>
                            <button
                              data-testid={`button-delete-user-${user.id}`}
                              onClick={() => setDeleteTarget(user)}
                              className="h-7 w-7 rounded-lg hover:bg-red-900/30 flex items-center justify-center transition-colors"
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
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {tab === 'config' && (
          <Card className="bg-[#0c0c0e] border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base text-zinc-100">Subscription Pricing Configuration</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">Set the price per trading day and subscriber day limits</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500 py-8">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading config…
                </div>
              ) : (
                <div className="space-y-6 max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Price Per Trading Day
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={configForm.pricePerDay}
                          onChange={e => setConfigForm(f => ({ ...f, pricePerDay: e.target.value }))}
                          placeholder="150"
                          data-testid="input-price-per-day"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Currency
                      </label>
                      <input
                        type="text"
                        value={configForm.currency}
                        onChange={e => setConfigForm(f => ({ ...f, currency: e.target.value }))}
                        placeholder="KES"
                        data-testid="input-currency"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Minimum Trading Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={configForm.minDays}
                        onChange={e => setConfigForm(f => ({ ...f, minDays: e.target.value }))}
                        placeholder="5"
                        data-testid="input-min-days"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1">Mon–Fri minimum</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Maximum Trading Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={configForm.maxDays}
                        onChange={e => setConfigForm(f => ({ ...f, maxDays: e.target.value }))}
                        placeholder="60"
                        data-testid="input-max-days"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1">Mon–Fri maximum</p>
                    </div>
                  </div>

                  {configForm.pricePerDay && configForm.minDays && configForm.maxDays && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preview</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Min subscription</span>
                        <span className="text-zinc-200">{configForm.currency} {(Number(configForm.pricePerDay) * Number(configForm.minDays)).toLocaleString()} ({configForm.minDays} days)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Max subscription</span>
                        <span className="text-zinc-200">{configForm.currency} {(Number(configForm.pricePerDay) * Number(configForm.maxDays)).toLocaleString()} ({configForm.maxDays} days)</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveConfig}
                      disabled={updateConfigMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-config"
                    >
                      {updateConfigMutation.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                        : <><Save className="h-4 w-4" />Save Configuration</>}
                    </Button>
                    {configSaved && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" /> Saved
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── SUBSCRIBERS TAB ── */}
        {tab === 'subscribers' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['active', 'expired'] as const).map(s => (
                <button
                  key={s}
                  data-testid={`tab-subscribers-${s}`}
                  onClick={() => setSubsTab(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    subsTab === s ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {s === 'active' ? `Active (${activeSubscribers.length})` : `Expired (${expiredSubscribers.length})`}
                </button>
              ))}
              <Button variant="secondary" onClick={() => refetchSubs()} className="ml-auto gap-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Card className="bg-[#0c0c0e] border-zinc-800">
              {subsLoading && (
                <CardContent className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                  <p className="text-sm text-zinc-500">Loading subscribers…</p>
                </CardContent>
              )}
              {subsError && (
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-zinc-300">Failed to load subscribers</p>
                  <Button variant="secondary" onClick={() => refetchSubs()} className="text-xs gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </CardContent>
              )}
              {!subsLoading && !subsError && (subsTab === 'active' ? activeSubscribers : expiredSubscribers).length === 0 && (
                <CardContent className="flex flex-col items-center py-12 gap-2">
                  <CreditCard className="h-10 w-10 text-zinc-700" />
                  <p className="text-sm text-zinc-400">No {subsTab} subscribers.</p>
                </CardContent>
              )}
              {!subsLoading && !subsError && (subsTab === 'active' ? activeSubscribers : expiredSubscribers).length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Trading Days</TableHead>
                      <TableHead>{subsTab === 'active' ? 'Expires' : 'Expired'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(subsTab === 'active' ? activeSubscribers : expiredSubscribers).map(sub => (
                      <TableRow key={sub.id} data-testid={`row-subscriber-${sub.id}`}>
                        <TableCell className="text-sm font-medium text-zinc-200">{sub.name || '—'}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{sub.email || '—'}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{sub.planName || '—'}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-bold tabular-nums ${subsTab === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {sub.tradingDays ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">{fmtDate(sub.expiresAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="space-y-4">
            {analyticsLoading && (
              <div className="flex items-center justify-center py-20 gap-3">
                <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                <p className="text-sm text-zinc-500">Loading analytics…</p>
              </div>
            )}
            {analyticsError && !analyticsLoading && (
              <Card className="bg-[#0c0c0e]">
                <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-zinc-300">Failed to load analytics</p>
                  <Button variant="secondary" onClick={() => refetchAnalytics()} className="text-xs gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </CardContent>
              </Card>
            )}
            {!analyticsLoading && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `${currency} ${Number(a.totalRevenue || 0).toLocaleString()}`, color: 'text-emerald-400' },
                    { label: 'This Month', value: `${currency} ${Number(a.revenueThisMonth || 0).toLocaleString()}`, color: 'text-purple-400' },
                    { label: 'Active Subs', value: a.activeSubscriptions ?? '—', color: 'text-blue-400' },
                    { label: 'Expired Subs', value: a.expiredSubscriptions ?? '—', color: 'text-red-400' },
                  ].map(stat => (
                    <Card key={stat.label} className="bg-[#0c0c0e] border-zinc-800">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</p>
                        <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-[#0c0c0e] border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        Revenue Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {a.revenueGrowth != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Growth Rate</span>
                            <span className={`font-bold ${a.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {a.revenueGrowth > 0 ? '+' : ''}{a.revenueGrowth}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Total Revenue</span>
                          <span className="font-bold text-zinc-100">{currency} {Number(a.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">This Month</span>
                          <span className="font-bold text-zinc-100">{currency} {Number(a.revenueThisMonth || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0c0c0e] border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-400" />
                        Trade Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Total Copied Trades', value: a.totalCopiedTrades ?? '—' },
                          { label: 'Successful Trades', value: a.successfulTrades ?? '—', color: 'text-emerald-400' },
                          { label: 'Failed Trades', value: a.failedTrades ?? '—', color: 'text-red-400' },
                          { label: 'Success Rate', value: a.successRate != null ? `${a.successRate}%` : '—', color: 'text-emerald-400' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-sm">
                            <span className="text-zinc-400">{row.label}</span>
                            <span className={`font-bold ${row.color || 'text-zinc-100'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MASTER ACCOUNTS TAB ── */}
        {tab === 'master-accounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-zinc-400">MT5 master accounts used for copy trading</p>
              <Button onClick={() => setAddingMaster(true)} className="gap-2 text-xs" data-testid="button-add-master">
                <Plus className="h-3.5 w-3.5" /> Add Master Account
              </Button>
            </div>

            <Card className="bg-[#0c0c0e] border-zinc-800">
              {mastersLoading && (
                <CardContent className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                  <p className="text-sm text-zinc-500">Loading master accounts…</p>
                </CardContent>
              )}
              {mastersError && (
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-zinc-300">Failed to load master accounts</p>
                  <Button variant="secondary" onClick={() => refetchMasters()} className="text-xs gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </CardContent>
              )}
              {!mastersLoading && !mastersError && masters.length === 0 && (
                <CardContent className="flex flex-col items-center py-12 gap-2">
                  <Cpu className="h-10 w-10 text-zinc-700" />
                  <p className="text-sm text-zinc-400">No master accounts configured.</p>
                  <Button onClick={() => setAddingMaster(true)} className="text-xs gap-2 mt-2">
                    <Plus className="h-3.5 w-3.5" /> Add First Account
                  </Button>
                </CardContent>
              )}
              {!mastersLoading && !mastersError && masters.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login</TableHead>
                      <TableHead>Server</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {masters.map(m => (
                      <TableRow key={m.id} data-testid={`row-master-${m.id}`}>
                        <TableCell className="font-mono text-sm text-zinc-200">{m.login}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{m.server}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{m.label || '—'}</TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-400">
                          {m.balance != null ? `${m.currency || 'USD'} ${Number(m.balance).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">{fmtDate(m.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <button
                              data-testid={`button-delete-master-${m.id}`}
                              onClick={() => setDeleteMasterTarget(m)}
                              className="h-7 w-7 rounded-lg hover:bg-red-900/30 flex items-center justify-center transition-colors"
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
          </div>
        )}

        {/* ── DIALOGS ── */}

        {/* Edit Role */}
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
                  data-testid="select-role"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">User</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                <Button onClick={handleUpdateRole} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User */}
        <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Permanently delete <span className="text-zinc-200 font-medium">"{deleteTarget?.name || deleteTarget?.email}"</span>? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting…</> : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Master Account */}
        <Dialog open={addingMaster} onOpenChange={open => !open && setAddingMaster(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Master Account</DialogTitle>
              <DialogDescription>Connect a new MT5 master account for copy trading.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {[
                { label: 'MT5 Login', key: 'login', placeholder: '12345678', required: true },
                { label: 'Server', key: 'server', placeholder: 'Broker-Demo', required: true },
                { label: 'Label (optional)', key: 'label', placeholder: 'My Main Account', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={masterForm[f.key as keyof typeof masterForm]}
                    onChange={e => setMasterForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    data-testid={`input-master-${f.key}`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setAddingMaster(false)}>Cancel</Button>
                <Button onClick={handleAddMaster} disabled={createMasterMutation.isPending} data-testid="button-confirm-add-master">
                  {createMasterMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</> : 'Add Account'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Master */}
        <Dialog open={!!deleteMasterTarget} onOpenChange={open => !open && setDeleteMasterTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Master Account</DialogTitle>
              <DialogDescription>
                Remove master account <span className="text-zinc-200 font-medium">{deleteMasterTarget?.login}</span> ({deleteMasterTarget?.server})? Copy trading will stop.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={handleDeleteMaster} disabled={deleteMasterMutation.isPending}>
                {deleteMasterMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Removing…</> : 'Remove Account'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
