import * as React from 'react';
import { History, TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { useGetTrades } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

interface Trade {
  id: string;
  symbol?: string;
  pair?: string;
  type?: string;
  direction?: string;
  openPrice?: number;
  closePrice?: number;
  profit?: number;
  pips?: number;
  lots?: number;
  volume?: number;
  openTime?: string;
  closeTime?: string;
  createdAt?: string;
  status?: string;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

function fmt(n: number | undefined, decimals = 2) {
  if (n == null) return '—';
  return Number(n).toFixed(decimals);
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type FilterType = 'all' | 'buy' | 'sell' | 'win' | 'loss';

export default function TradeHistory() {
  const { data, isLoading, isError, refetch } = useGetTrades();
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [search, setSearch] = React.useState('');

  const trades: Trade[] = Array.isArray(data) ? data : [];

  const filtered = React.useMemo(() => {
    let list = trades;
    const type = (t: Trade) => (t.type || t.direction || '').toUpperCase();
    if (filter === 'buy') list = list.filter(t => type(t) === 'BUY');
    if (filter === 'sell') list = list.filter(t => type(t) === 'SELL');
    if (filter === 'win') list = list.filter(t => (t.profit ?? 0) > 0);
    if (filter === 'loss') list = list.filter(t => (t.profit ?? 0) < 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => (t.symbol || t.pair || '').toLowerCase().includes(q));
    }
    return list;
  }, [trades, filter, search]);

  const wins = trades.filter(t => (t.profit ?? 0) > 0).length;
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Trade Ledger</h1>
            <p className="text-sm text-zinc-400 mt-1">Full history of executed signals and trades.</p>
          </div>
          <Button variant="secondary" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Trades', value: trades.length, color: 'text-zinc-100' },
              { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Wins', value: wins, color: 'text-emerald-400' },
              {
                label: 'Net P&L',
                value: `${totalProfit >= 0 ? '+' : ''}${fmt(totalProfit)}`,
                color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
            ].map(s => (
              <Card key={s.label} className="bg-[#0c0c0e]">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {(['all', 'buy', 'sell', 'win', 'loss'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search symbol…"
            className="ml-auto bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600 w-36"
          />
        </div>

        {/* Table Card */}
        <Card className="bg-[#0c0c0e]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              <p className="text-sm text-zinc-500 uppercase tracking-widest">Loading trade history…</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-zinc-300">Failed to load trades</p>
              <p className="text-xs text-zinc-500">Check your connection or authentication.</p>
              <Button variant="secondary" onClick={() => refetch()} className="mt-2 text-xs gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <History className="h-12 w-12 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">No trades found</p>
              <p className="text-xs text-zinc-500">
                {search || filter !== 'all' ? 'Try adjusting your filters.' : 'Your trade history will appear here.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Open Price</TableHead>
                  <TableHead>Close Price</TableHead>
                  <TableHead>SL / TP</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((trade) => {
                  const tradeType = (trade.type || trade.direction || '').toUpperCase();
                  const isBuy = tradeType === 'BUY';
                  const profit = trade.profit ?? 0;
                  const isWin = profit > 0;
                  return (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-sm text-zinc-200">
                          {trade.symbol || trade.pair || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isBuy ? 'success' : 'destructive'}>
                          {isBuy
                            ? <><ArrowUpRight className="h-3 w-3 inline mr-0.5" />BUY</>
                            : <><ArrowDownRight className="h-3 w-3 inline mr-0.5" />SELL</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {fmt(trade.openPrice, 5)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {fmt(trade.closePrice, 5)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">
                        {fmt(trade.stopLoss, 5)} / {fmt(trade.takeProfit, 5)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {fmt(trade.lots ?? trade.volume, 2)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold text-sm flex items-center gap-1 ${isWin ? 'text-emerald-400' : profit < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                          {isWin ? <TrendingUp className="h-3.5 w-3.5" /> : profit < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                          {profit !== 0 ? `${isWin ? '+' : ''}${fmt(profit)}` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                        {fmtDate(trade.openTime || trade.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'closed' ? 'info' : trade.status === 'open' ? 'success' : 'warning'}>
                          {trade.status || 'closed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
