import {
  RefreshCw, Loader2, AlertCircle, Copy, ShieldCheck, Cpu, Wifi,
  CheckCircle2, XCircle, Clock, ArrowRight, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useCopyTradingStatus, useGetSubscription } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';
import { countRemainingTradingDays } from '../utils/tradingDays';

interface CopyStatus {
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  masterAccount?: {
    login?: string;
    server?: string;
    label?: string;
    balance?: number;
    equity?: number;
    currency?: string;
  };
  mt5Status?: string;
  slaveAccount?: {
    login?: string;
    server?: string;
    balance?: number;
    currency?: string;
  };
  copyTradingStatus?: string;
  syncStatus?: string;
  lastSyncAt?: string;
  totalCopiedTrades?: number;
  openPositions?: number;
}

function StatusIndicator({ status, label }: { status?: string; label: string }) {
  const isOk = status === 'active' || status === 'connected' || status === 'running' || status === 'synced';
  const isPending = status === 'pending' || status === 'connecting' || status === 'syncing';
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <span className="text-sm text-zinc-300 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {isOk ? (
          <><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-semibold text-emerald-400 capitalize">{status}</span></>
        ) : isPending ? (
          <><Loader2 className="h-3 w-3 text-amber-400 animate-spin" /><span className="text-xs font-semibold text-amber-400 capitalize">{status}</span></>
        ) : status ? (
          <><span className="h-2 w-2 rounded-full bg-red-500" /><span className="text-xs font-semibold text-red-400 capitalize">{status}</span></>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </div>
    </div>
  );
}

export default function CopyTrading() {
  const { data, isLoading, isError, refetch } = useCopyTradingStatus();
  const { data: subscription } = useGetSubscription();

  const cs: CopyStatus = data || {};
  const sub = subscription as { expiresAt?: string; status?: string } | null;
  const remainingDays = sub?.expiresAt ? countRemainingTradingDays(sub.expiresAt) : 0;
  const subActive = sub?.status === 'active' || cs.subscriptionStatus === 'active';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Copy className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Copy Trading</h1>
              <p className="text-sm text-zinc-400">Real-time status of your copy trading setup</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            <p className="text-sm text-zinc-500">Loading copy trading status…</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <Card className="bg-[#0c0c0e]">
            <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-zinc-300">Failed to load copy trading status</p>
              <Button variant="secondary" onClick={() => refetch()} className="text-xs gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && (
          <>
            {/* Subscription Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`${subActive ? 'bg-gradient-to-br from-emerald-950/30 to-zinc-950 border-emerald-500/20' : 'bg-gradient-to-br from-red-950/20 to-zinc-950 border-red-500/20'}`}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <ShieldCheck className={`h-5 w-5 ${subActive ? 'text-emerald-400' : 'text-red-400'}`} />
                    <Badge variant={subActive ? 'success' : 'destructive'}>
                      {cs.subscriptionStatus || (subActive ? 'active' : 'inactive')}
                    </Badge>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Subscription</p>
                  <p className="text-lg font-bold text-white mt-1">{subActive ? 'Active' : 'Inactive'}</p>
                  {sub?.expiresAt && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Expires {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Trading Days Left</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1 tabular-nums">{remainingDays}</p>
                  <p className="text-xs text-zinc-600 mt-1">Mon–Fri only</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0c0c0e] border-zinc-800">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Open Positions</p>
                  <p className="text-3xl font-bold text-blue-400 mt-1 tabular-nums">{cs.openPositions ?? '—'}</p>
                  <p className="text-xs text-zinc-600 mt-1">Total copied: {cs.totalCopiedTrades ?? 0} trades</p>
                </CardContent>
              </Card>
            </div>

            {/* Master → Slave Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
              {/* Master Account */}
              <Card className="lg:col-span-2 bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    Master Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cs.masterAccount ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Login</span>
                        <span className="font-mono text-zinc-200 font-medium">{cs.masterAccount.login || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Server</span>
                        <span className="text-zinc-300 text-xs">{cs.masterAccount.server || '—'}</span>
                      </div>
                      {cs.masterAccount.label && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Label</span>
                          <span className="text-zinc-300">{cs.masterAccount.label}</span>
                        </div>
                      )}
                      {cs.masterAccount.balance != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Balance</span>
                          <span className="font-semibold text-emerald-400">
                            {cs.masterAccount.currency || 'USD'} {Number(cs.masterAccount.balance).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {cs.masterAccount.equity != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Equity</span>
                          <span className="text-zinc-200">
                            {cs.masterAccount.currency || 'USD'} {Number(cs.masterAccount.equity).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <Cpu className="h-8 w-8 text-zinc-700" />
                      <p className="text-xs text-zinc-500">No master account assigned</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="hidden lg:flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-px w-8 bg-zinc-700" />
                  <ArrowRight className="h-5 w-5 text-zinc-500" />
                </div>
                <p className="text-[10px] uppercase text-zinc-600 tracking-widest">Copy</p>
              </div>

              {/* Slave Account */}
              <Card className="lg:col-span-2 bg-[#0c0c0e] border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-blue-400" />
                    Your MT5 Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cs.slaveAccount ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Login</span>
                        <span className="font-mono text-zinc-200 font-medium">{cs.slaveAccount.login || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Server</span>
                        <span className="text-zinc-300 text-xs">{cs.slaveAccount.server || '—'}</span>
                      </div>
                      {cs.slaveAccount.balance != null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Balance</span>
                          <span className="font-semibold text-emerald-400">
                            {cs.slaveAccount.currency || 'USD'} {Number(cs.slaveAccount.balance).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <Wifi className="h-8 w-8 text-zinc-700" />
                      <p className="text-xs text-zinc-500">No MT5 account connected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Grid */}
            <Card className="bg-[#0c0c0e] border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Connection & Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StatusIndicator status={cs.mt5Status || 'disconnected'} label="MT5 Bridge" />
                  <StatusIndicator status={cs.copyTradingStatus || 'idle'} label="Copy Trading Engine" />
                  <StatusIndicator status={cs.syncStatus || 'idle'} label="Account Synchronization" />
                  <StatusIndicator status={cs.subscriptionStatus || 'inactive'} label="Subscription Status" />
                </div>

                {cs.lastSyncAt && (
                  <p className="text-xs text-zinc-600 mt-4 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Last synced: {new Date(cs.lastSyncAt).toLocaleString('en-GB')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* No subscription warning */}
            {!subActive && (
              <Card className="bg-amber-950/20 border-amber-500/20">
                <CardContent className="flex items-start gap-3 pt-5 pb-5">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Subscription Required</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Copy trading is paused because your subscription is inactive or expired.
                      Go to <a href="/billing" className="text-purple-400 hover:text-purple-300 underline">Subscriptions</a> to renew.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <div className="flex items-center gap-5 flex-wrap text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Connected / Active</span>
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 text-amber-400" /> Pending / Connecting</span>
              <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-400" /> Disconnected / Failed</span>
              <span className="flex items-center gap-1.5 ml-auto"><RefreshCw className="h-3 w-3" /> Auto-refreshes every 10s</span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
