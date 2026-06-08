import * as React from 'react';
import { Users, TrendingUp, Star, Loader2, AlertCircle, UserCheck, UserPlus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ToastProvider';
import { useGetProviders, useSubscribeProvider, useUnsubscribeProvider } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

interface Provider {
  id: string;
  name: string;
  description?: string;
  winRate?: number;
  totalSignals?: number;
  subscribers?: number;
  isSubscribed?: boolean;
  isActive?: boolean;
  monthlyReturn?: number;
  drawdown?: number;
  pairs?: string[];
}

export default function Providers() {
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useGetProviders();
  const subscribeMutation = useSubscribeProvider();
  const unsubscribeMutation = useUnsubscribeProvider();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const providers: Provider[] = Array.isArray(data) ? data : [];

  async function handleToggle(provider: Provider) {
    setLoadingId(provider.id);
    try {
      if (provider.isSubscribed) {
        await unsubscribeMutation.mutateAsync(provider.id);
        toast(`Unsubscribed from ${provider.name}`, 'info');
      } else {
        await subscribeMutation.mutateAsync(provider.id);
        toast(`Subscribed to ${provider.name}`, 'success');
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Signal Providers</h1>
            <p className="text-sm text-zinc-400 mt-1">Browse and subscribe to verified trading signal providers.</p>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <p className="text-sm text-zinc-500 uppercase tracking-widest">Loading providers…</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card className="bg-[#0c0c0e]">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-zinc-300">Failed to load providers</p>
              <p className="text-xs text-zinc-500">The API may be unavailable or you may need to log in.</p>
              <Button variant="secondary" onClick={() => refetch()} className="mt-2 text-xs gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !isError && providers.length === 0 && (
          <Card className="bg-[#0c0c0e]">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="h-12 w-12 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">No providers available</p>
              <p className="text-xs text-zinc-500">Check back later or contact admin.</p>
            </CardContent>
          </Card>
        )}

        {/* Provider Grid */}
        {!isLoading && !isError && providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {providers.map((p) => (
              <Card key={p.id} className={`bg-[#0c0c0e] transition-all hover:border-zinc-700 ${p.isSubscribed ? 'border-purple-500/30' : ''}`}>
                <CardContent className="pt-6 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-purple-400">
                          {p.name?.substring(0, 2).toUpperCase() || 'PR'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-100 text-sm">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.isSubscribed && <Badge variant="info" className="text-[10px]">Subscribed</Badge>}
                          {p.isActive !== false && <Badge variant="success" className="text-[10px]">Active</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-900/60 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Win Rate</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">
                        {p.winRate != null ? `${p.winRate}%` : '—'}
                      </p>
                    </div>
                    <div className="bg-zinc-900/60 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Signals</p>
                      <p className="text-sm font-bold text-zinc-200 mt-0.5">
                        {p.totalSignals ?? '—'}
                      </p>
                    </div>
                    <div className="bg-zinc-900/60 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Subscribers</p>
                      <p className="text-sm font-bold text-zinc-200 mt-0.5">
                        {p.subscribers ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Extra stats row */}
                  {(p.monthlyReturn != null || p.drawdown != null) && (
                    <div className="flex items-center gap-4 text-xs border-t border-zinc-800 pt-3">
                      {p.monthlyReturn != null && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-zinc-400">Monthly:</span>
                          <span className="font-semibold text-emerald-400">+{p.monthlyReturn}%</span>
                        </div>
                      )}
                      {p.drawdown != null && (
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-zinc-400">DD:</span>
                          <span className="font-semibold text-amber-400">{p.drawdown}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pairs */}
                  {p.pairs && p.pairs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.pairs.slice(0, 5).map(pair => (
                        <span key={pair} className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          {pair}
                        </span>
                      ))}
                      {p.pairs.length > 5 && (
                        <span className="text-[10px] text-zinc-600">+{p.pairs.length - 5} more</span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <Button
                    variant={p.isSubscribed ? 'secondary' : 'primary'}
                    className="w-full gap-2 text-xs"
                    disabled={loadingId === p.id}
                    onClick={() => handleToggle(p)}
                  >
                    {loadingId === p.id
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing…</>
                      : p.isSubscribed
                        ? <><UserCheck className="h-3.5 w-3.5" />Unsubscribe</>
                        : <><UserPlus className="h-3.5 w-3.5" />Subscribe</>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
