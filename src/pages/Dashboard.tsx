import { useGetDashboard } from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DashboardLayout from '../layouts/DashboardLayout';
import { TrendingUp, Percent, Layers, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const { data: metrics, isLoading } = useGetDashboard();

  // High-fidelity fallback mocks mimicking UI if network response transitions
  const displayMetrics = metrics || {
    accountOverview: { fullName: "John Trader", accountTier: "VIP Member", expiry: "20/06/2026" },
    totalSignals: 128,
    signalDelta: "+12 this week",
    winRate: 82,
    winRateDelta: "+5% this week",
    activePlan: "VIP",
    totalProfit: 4250,
    profitDelta: "+18.7% this month",
    liveOverview: [
      { pair: "EUR/USD", value: "1.08245", change: "+0.45%", active: true, status: "BUY signal updated" },
      { pair: "XAUUSD", value: "2,356.75", change: "+0.89%", active: true, status: "Volatility increasing" },
      { pair: "BTCUSDT", value: "67,892.11", change: "+2.35%", active: true, status: "Trend bullish continuation" }
    ],
    recentSignals: [
      { pair: "EUR/USD", type: "BUY", value: "1.08245", time: "2 min ago", sl: "1.0790", tp: "1.0890", pips: "+45 pips", isPositive: true },
      { pair: "XAUUSD", type: "BUY", value: "2,356.75", time: "15 min ago", sl: "2,340.00", tp: "2,380.00", pips: "+120 pips", isPositive: true },
      { pair: "GBP/USD", type: "SELL", value: "1.26340", time: "1 hour ago", sl: "1.2690", tp: "1.2550", pips: "-25 pips", isPositive: false },
      { pair: "BTCUSDT", type: "BUY", value: "67,892.11", time: "2 hours ago", sl: "66,500.00", tp: "69,500.00", pips: "+230 pips", isPositive: true }
    ]
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Visual Header Grid Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome back, {displayMetrics.accountOverview.fullName} 👋
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Here's the performance evaluation across synchronized master matrices today.</p>
            </div>
          </div>
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="z-10">
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">{displayMetrics.accountOverview.accountTier}</span>
              <p className="text-sm text-zinc-300 mt-2 font-medium">Subscription Term Boundary Active</p>
              <p className="text-xs text-zinc-500 mt-0.5">Valid until {displayMetrics.accountOverview.expiry}</p>
            </div>
            <ShieldCheck className="absolute right-4 bottom-4 h-24 w-24 text-purple-500/5 -rotate-12" />
          </div>
        </div>

        {/* Quant Metric Cards Mapping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0c0c0e]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total System Signals</p>
                <Layers className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-100 mt-2">{displayMetrics.totalSignals}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">{displayMetrics.signalDelta}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0c0e]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aggregated Win Rate</p>
                <Percent className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-zinc-100 mt-2">{displayMetrics.winRate}%</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">{displayMetrics.winRateDelta}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0c0e]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Operational Plan</p>
                <ShieldCheck className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-purple-400 mt-2">{displayMetrics.activePlan}</p>
              <p className="text-xs text-zinc-500 font-medium mt-1">High-Priority Routing Node</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0c0e]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Calculated Gross Profit</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-emerald-400 mt-2">+${displayMetrics.totalProfit.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">{displayMetrics.profitDelta}</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Markets Layout Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#0c0c0e]">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Live Engine Stream Overview</h2>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">Live</span>
              </div>
            </div>
            <div className="divide-y divide-zinc-900/60">
              {displayMetrics.liveOverview.map((item: { pair: string; value: string; change: string; active: boolean; status: string }, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-zinc-200">{item.pair}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-zinc-100">{item.value}</p>
                    <p className="text-xs font-semibold text-emerald-400">{item.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Trend Representation Wrapper */}
          <Card className="bg-[#0c0c0e] flex flex-col justify-between">
            <div className="p-6 border-b border-zinc-900">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Algorithmic Performance Delta</h2>
            </div>
            <div className="p-6 flex flex-col justify-center items-center h-48 border-b border-zinc-900/40">
              {/* SVG Micro Line-Chart mimicking attachment visual trendline */}
              <svg viewBox="0 0 300 100" className="w-full overflow-visible drop-shadow-[0_0_12px_rgba(147,51,234,0.3)]">
                <path
                  d="M0,80 Q30,75 60,50 T120,65 T180,30 T240,40 T300,10"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="p-4 bg-zinc-900/20 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Account status execution matrix evaluation</span>
              <span className="font-bold text-emerald-400 uppercase tracking-widest">+18.7%</span>
            </div>
          </Card>
        </div>

        {/* Recent Execution Signals Layer */}
        <Card className="bg-[#0c0c0e]">
          <div className="p-6 border-b border-zinc-900">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Terminal Stream Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-zinc-900">
                <thead className="bg-zinc-900/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Execution Vector</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Risk Offsets (SL/TP)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Yield Parameter</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Time Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {displayMetrics.recentSignals.map((signal: { pair: string; type: string; value: string; time: string; sl: string; tp: string; pips: string; isPositive: boolean }, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-200">{signal.pair}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${signal.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {signal.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-zinc-300">{signal.value}</td>
                      <td className="px-6 py-4 text-xs text-zinc-400">SL: {signal.sl} / TP: {signal.tp}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={signal.isPositive ? 'text-emerald-400' : 'text-red-400'}>{signal.pips}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{signal.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
