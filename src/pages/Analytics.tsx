import * as React from 'react';
import {
  RefreshCw, Loader2, AlertCircle, TrendingUp, Users, CreditCard,
  CheckCircle2, XCircle, BarChart2, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAdminAnalytics } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

interface RevenuePoint { date: string; amount: number; }
interface GrowthPoint { date: string; count: number; }
interface AnalyticsData {
  totalRevenue?: number;
  revenueThisMonth?: number;
  revenueGrowth?: number;
  totalSubscribers?: number;
  activeSubscriptions?: number;
  expiredSubscriptions?: number;
  subscriberGrowth?: number;
  revenue?: RevenuePoint[];
  subscriberGrowthData?: GrowthPoint[];
  totalCopiedTrades?: number;
  successfulTrades?: number;
  failedTrades?: number;
  successRate?: number;
  currency?: string;
}

function BarChart({ data, valueKey, color }: { data: Array<Record<string, unknown>>; valueKey: string; color: string }) {
  if (!data?.length) return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  const values = data.map(d => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-full w-full">
      {data.map((d, i) => {
        const pct = (values[i] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-t transition-all ${color}`}
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-200 px-2 py-1 rounded whitespace-nowrap z-10">
              {String(d.date || d.label || i)}: {values[i].toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data, valueKey }: { data: Array<Record<string, unknown>>; valueKey: string }) {
  if (!data?.length) return <div className="flex items-center justify-center h-full text-xs text-zinc-600">No data</div>;
  const values = data.map(d => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const W = 300; const H = 80;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${pts.join(' L ')}`}
        fill="none"
        stroke="#9333ea"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M 0,${H} L ${pts.join(' L ')} L ${W},${H} Z`}
        fill="url(#lineGrad)"
      />
    </svg>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="bg-[#0c0c0e] border-zinc-800">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const { data, isLoading, isError, refetch } = useAdminAnalytics();
  const a: AnalyticsData = data || {};
  const currency = a.currency || 'KES';
  const revenueData: Array<Record<string, unknown>> = Array.isArray(a.revenue) ? a.revenue : [];
  const growthData: Array<Record<string, unknown>> = Array.isArray(a.subscriberGrowthData) ? a.subscriberGrowthData : [];
  const successRate = a.successRate ?? (a.totalCopiedTrades ? Math.round(((a.successfulTrades || 0) / a.totalCopiedTrades) * 100) : null);
  const failureRate = successRate != null ? 100 - successRate : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
              <p className="text-sm text-zinc-400">Revenue, subscriber growth and trading statistics</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
            <p className="text-sm text-zinc-500">Loading analytics…</p>
          </div>
        )}

        {isError && !isLoading && (
          <Card className="bg-[#0c0c0e]">
            <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-zinc-300">Failed to load analytics data</p>
              <Button variant="secondary" onClick={() => refetch()} className="text-xs gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue"
                value={`${currency} ${Number(a.totalRevenue || 0).toLocaleString()}`}
                sub={a.revenueGrowth != null ? `${a.revenueGrowth > 0 ? '+' : ''}${a.revenueGrowth}% vs last period` : undefined}
                icon={TrendingUp}
                color="text-emerald-400"
              />
              <StatCard
                label="This Month"
                value={`${currency} ${Number(a.revenueThisMonth || 0).toLocaleString()}`}
                icon={CreditCard}
                color="text-purple-400"
              />
              <StatCard
                label="Active Subs"
                value={a.activeSubscriptions ?? '—'}
                sub={a.subscriberGrowth != null ? `${a.subscriberGrowth > 0 ? '+' : ''}${a.subscriberGrowth}% growth` : undefined}
                icon={Users}
                color="text-blue-400"
              />
              <StatCard
                label="Expired Subs"
                value={a.expiredSubscriptions ?? '—'}
                icon={XCircle}
                color="text-red-400"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData.length > 0 ? (
                    <div className="h-36">
                      <LineChart data={revenueData} valueKey="amount" />
                    </div>
                  ) : (
                    <div className="h-36 flex items-end gap-1">
                      <BarChart data={[
                        { date: 'No data', amount: 0 }
                      ]} valueKey="amount" color="bg-purple-600/30" />
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-zinc-600 mt-3">
                    <span>{revenueData[0]?.date as string || '—'}</span>
                    <span>{revenueData[revenueData.length - 1]?.date as string || '—'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriber Growth */}
              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    Subscriber Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-36">
                    {growthData.length > 0 ? (
                      <BarChart data={growthData} valueKey="count" color="bg-blue-500/60 hover:bg-blue-500/80" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-zinc-600">No growth data available</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 mt-3">
                    <span>{growthData[0]?.date as string || '—'}</span>
                    <span>{growthData[growthData.length - 1]?.date as string || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Breakdown & Trade Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Breakdown */}
              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-400" />
                    Subscription Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Active Subscriptions', value: a.activeSubscriptions ?? 0, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                    { label: 'Expired Subscriptions', value: a.expiredSubscriptions ?? 0, color: 'bg-red-500', textColor: 'text-red-400' },
                  ].map(item => {
                    const total = (a.activeSubscriptions ?? 0) + (a.expiredSubscriptions ?? 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className={`font-bold ${item.textColor}`}>{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-zinc-900">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Total Subscribers</span>
                      <span className="font-bold text-zinc-100">{a.totalSubscribers ?? ((a.activeSubscriptions ?? 0) + (a.expiredSubscriptions ?? 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trade Copy Stats */}
              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    Trade Copy Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Copied', value: a.totalCopiedTrades ?? '—', color: 'text-zinc-100' },
                      { label: 'Successful', value: a.successfulTrades ?? '—', color: 'text-emerald-400' },
                      { label: 'Failed', value: a.failedTrades ?? '—', color: 'text-red-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                        <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {successRate != null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1 text-zinc-400"><CheckCircle2 className="h-3 w-3 text-emerald-400" />Success Rate</span>
                        <span className="font-bold text-emerald-400">{successRate}%</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${successRate}%` }} />
                      </div>
                    </div>
                  )}

                  {failureRate != null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1 text-zinc-400"><XCircle className="h-3 w-3 text-red-400" />Failure Rate</span>
                        <span className="font-bold text-red-400">{failureRate}%</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${failureRate}%` }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
