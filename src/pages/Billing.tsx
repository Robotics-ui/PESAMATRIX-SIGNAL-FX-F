import * as React from 'react';
import {
  CreditCard, CheckCircle, Loader2, AlertCircle, Smartphone, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ToastProvider';
import { useGetPlans, useGetSubscription, useMpesaPush } from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  interval?: string;
  features?: string[];
  isPopular?: boolean;
  description?: string;
}

interface Subscription {
  planId?: string;
  planName?: string;
  status?: string;
  expiresAt?: string;
  renewsAt?: string;
}

export default function Billing() {
  const { toast } = useToast();
  const { data: plansData, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = useGetPlans();
  const { data: subscription, refetch: refetchSub } = useGetSubscription();

  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState('');
  const [paying, setPaying] = React.useState(false);

  const mpesaMutation = useMpesaPush();
  const plans: Plan[] = Array.isArray(plansData) ? plansData : [];
  const sub: Subscription | null = subscription || null;

  async function handleMpesaPay() {
    if (!selectedPlanId) { toast('Select a plan first', 'warning'); return; }
    if (!phone.trim()) { toast('Enter your M-Pesa phone number', 'warning'); return; }
    const cleaned = phone.replace(/\s+/g, '');
    if (!/^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/.test(cleaned)) {
      toast('Enter a valid Kenyan phone number (e.g. 0712345678)', 'warning');
      return;
    }
    setPaying(true);
    try {
      await mpesaMutation.mutateAsync({ planId: selectedPlanId, phoneNumber: cleaned });
      toast('M-Pesa push sent! Check your phone and enter your PIN to complete payment.', 'success');
      setPhone('');
      setSelectedPlanId(null);
      refetchSub();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Payment initiation failed', 'error');
    } finally {
      setPaying(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Subscriptions & Billing</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your PMATRIX plan and payment methods.</p>
          </div>
          <Button variant="secondary" onClick={() => { refetchPlans(); refetchSub(); }} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Current Subscription */}
        {sub && (
          <Card className="bg-gradient-to-r from-purple-950/40 to-zinc-950 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Current Plan</p>
                    <p className="font-bold text-lg text-white">{sub.planName || 'Active Plan'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={sub.status === 'active' ? 'success' : 'warning'}>
                    {sub.status || 'Active'}
                  </Badge>
                  {sub.expiresAt && (
                    <span className="text-xs text-zinc-400">
                      Expires {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Available Plans</h2>

          {plansLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading plans…</p>
            </div>
          )}

          {plansError && (
            <Card className="bg-[#0c0c0e]">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-zinc-300">Failed to load plans</p>
                <Button variant="secondary" onClick={() => refetchPlans()} className="text-xs gap-2">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {!plansLoading && !plansError && plans.length === 0 && (
            <Card className="bg-[#0c0c0e]">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <CreditCard className="h-10 w-10 text-zinc-700" />
                <p className="text-sm text-zinc-400">No plans available at the moment.</p>
              </CardContent>
            </Card>
          )}

          {!plansLoading && !plansError && plans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = sub?.planId === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                    className={`relative text-left rounded-xl border p-5 transition-all focus:outline-none ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/40'
                        : isCurrent
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-2.5 left-4 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-bold text-zinc-100">{plan.name}</p>
                      {isSelected && <CheckCircle className="h-5 w-5 text-purple-400 shrink-0" />}
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {plan.currency || 'KES'} {Number(plan.price).toLocaleString()}
                      <span className="text-sm font-normal text-zinc-500 ml-1">/ {plan.interval || 'month'}</span>
                    </p>
                    {plan.description && (
                      <p className="text-xs text-zinc-400 mt-2">{plan.description}</p>
                    )}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* M-Pesa Payment */}
        {selectedPlanId && (
          <Card className="bg-[#0c0c0e] border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base text-zinc-100">Pay via M-Pesa</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">An STK push will be sent to your phone</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678 or +254712345678"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-600 transition-colors max-w-sm"
                />
                <p className="text-xs text-zinc-500 mt-1.5">Safaricom line registered with M-Pesa</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="success"
                  onClick={handleMpesaPay}
                  disabled={paying || !phone.trim()}
                  className="gap-2"
                >
                  {paying
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Sending push…</>
                    : <><Smartphone className="h-4 w-4" />Send M-Pesa Push</>}
                </Button>
                <Button variant="ghost" onClick={() => setSelectedPlanId(null)} className="text-xs">
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
                Payments processed securely via Safaricom M-Pesa
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
