import * as React from 'react';
import {
  CreditCard, CheckCircle, Loader2, AlertCircle, Smartphone, RefreshCw, ShieldCheck,
  Calendar, TrendingUp, Clock, CheckCircle2, XCircle, RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ToastProvider';
import {
  useGetPlans, useGetSubscription, useMpesaPush,
  useMpesaPushTradingDays, useAdminSubscriptionConfig, usePaymentStatus,
} from '../api/client';
import DashboardLayout from '../layouts/DashboardLayout';
import { addTradingDays, countRemainingTradingDays, formatExpiryDate } from '../utils/tradingDays';

type PaymentStep = 'idle' | 'pushing' | 'pending' | 'success' | 'failed';

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
  tradingDaysRemaining?: number;
}

interface SubscriptionConfig {
  pricePerDay?: number;
  minDays?: number;
  maxDays?: number;
  currency?: string;
}

export default function Billing() {
  const { toast } = useToast();
  const { data: plansData, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = useGetPlans();
  const { data: subscription, refetch: refetchSub } = useGetSubscription();
  const { data: configData } = useAdminSubscriptionConfig();

  const config: SubscriptionConfig = configData || {};
  const pricePerDay = config.pricePerDay ?? 150;
  const minDays = config.minDays ?? 5;
  const maxDays = config.maxDays ?? 60;
  const currency = config.currency ?? 'KES';

  const [tradingDays, setTradingDays] = React.useState<number>(minDays);
  const [phone, setPhone] = React.useState('');
  const [step, setStep] = React.useState<PaymentStep>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = React.useState<string | null>(null);
  const [txnRef, setTxnRef] = React.useState('');
  const [pollTimeout, setPollTimeout] = React.useState(false);

  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null);
  const [legacyPhone, setLegacyPhone] = React.useState('');
  const [paying, setPaying] = React.useState(false);

  React.useEffect(() => {
    if (config.minDays) setTradingDays(Math.max(config.minDays, tradingDays));
  }, [config.minDays]);

  const mpesaTradingDaysMutation = useMpesaPushTradingDays();
  const mpesaMutation = useMpesaPush();
  const plans: Plan[] = Array.isArray(plansData) ? plansData : [];
  const sub: Subscription | null = subscription || null;

  const totalCost = tradingDays * pricePerDay;
  const expiryDate = addTradingDays(new Date(), tradingDays);
  const remainingDays = sub?.expiresAt ? countRemainingTradingDays(sub.expiresAt) : 0;

  const { data: paymentStatusData } = usePaymentStatus(step === 'pending' ? checkoutRequestId : null);

  React.useEffect(() => {
    if (!paymentStatusData || step !== 'pending') return;
    const s = (paymentStatusData as { status?: string })?.status;
    if (s === 'completed' || s === 'success') {
      setTxnRef((paymentStatusData as { transactionId?: string; reference?: string })?.transactionId || (paymentStatusData as { reference?: string })?.reference || '');
      setStep('success');
      refetchSub();
    } else if (s === 'failed' || s === 'cancelled') {
      setStep('failed');
    }
  }, [paymentStatusData, step]);

  React.useEffect(() => {
    if (step !== 'pending') return;
    const t = setTimeout(() => { setPollTimeout(true); setStep('failed'); }, 120000);
    return () => clearTimeout(t);
  }, [step]);

  function validatePhone(p: string) {
    const cleaned = p.replace(/\s+/g, '');
    return /^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/.test(cleaned) ? cleaned : null;
  }

  async function handleTradingDaysPay() {
    const cleaned = validatePhone(phone);
    if (!cleaned) { toast('Enter a valid Kenyan phone number (e.g. 0712 345 678)', 'warning'); return; }
    setStep('pushing');
    try {
      const res = await mpesaTradingDaysMutation.mutateAsync({ tradingDays, phoneNumber: cleaned });
      const id = (res as { checkoutRequestId?: string; CheckoutRequestID?: string })?.checkoutRequestId
        || (res as { CheckoutRequestID?: string })?.CheckoutRequestID || null;
      setCheckoutRequestId(id);
      setStep('pending');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Payment initiation failed', 'error');
      setStep('idle');
    }
  }

  async function handleLegacyPay() {
    if (!selectedPlanId) { toast('Select a plan first', 'warning'); return; }
    const cleaned = validatePhone(legacyPhone);
    if (!cleaned) { toast('Enter a valid Kenyan phone number', 'warning'); return; }
    setPaying(true);
    try {
      await mpesaMutation.mutateAsync({ planId: selectedPlanId, phoneNumber: cleaned });
      toast('M-Pesa push sent! Enter your PIN on your phone to complete payment.', 'success');
      setLegacyPhone('');
      setSelectedPlanId(null);
      refetchSub();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Payment initiation failed', 'error');
    } finally {
      setPaying(false);
    }
  }

  function resetPayment() {
    setStep('idle');
    setCheckoutRequestId(null);
    setTxnRef('');
    setPollTimeout(false);
    setPhone('');
  }

  const sliderPct = maxDays > minDays ? ((tradingDays - minDays) / (maxDays - minDays)) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Subscriptions & Billing</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your PMATRIX plan and payment methods.</p>
          </div>
          <Button variant="secondary" onClick={() => { refetchPlans(); refetchSub(); }} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        {/* Current Subscription Status */}
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
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant={sub.status === 'active' ? 'success' : 'warning'}>
                    {sub.status || 'Active'}
                  </Badge>
                  {sub.expiresAt && (
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Expires</p>
                      <p className="text-sm font-semibold text-zinc-300">
                        {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {sub.expiresAt && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-center">
                      <p className="text-xs text-zinc-500 font-medium">Trading Days Left</p>
                      <p className="text-2xl font-bold text-emerald-400">{remainingDays}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Mon–Fri only</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Trading Days Purchase ── */}
        <Card className="bg-[#0c0c0e] border-zinc-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">Buy Trading Days</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">Select how many trading days (Mon–Fri) you want to subscribe for</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'idle' && (
              <>
                {/* Slider */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Trading Days Selected</p>
                      <p className="text-5xl font-bold text-white tabular-nums">{tradingDays}</p>
                      <p className="text-xs text-zinc-500 mt-1">Mon – Fri only · excludes weekends</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Expiry Date</p>
                      <p className="text-base font-bold text-zinc-200">{formatExpiryDate(expiryDate)}</p>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <input
                      type="range"
                      min={minDays}
                      max={maxDays}
                      step={1}
                      value={tradingDays}
                      onChange={e => setTradingDays(Number(e.target.value))}
                      data-testid="slider-trading-days"
                      className="w-full h-2 appearance-none rounded-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #9333ea ${sliderPct}%, #27272a ${sliderPct}%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-zinc-600 mt-2">
                      <span>{minDays} days min</span>
                      <span>{maxDays} days max</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cost Breakdown</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Trading days</span>
                    <span className="text-zinc-200 font-medium">{tradingDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Price per trading day</span>
                    <span className="text-zinc-200 font-medium">{currency} {pricePerDay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />Subscription valid until
                    </span>
                    <span className="text-zinc-200 font-medium">{formatExpiryDate(expiryDate)}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between">
                    <span className="font-bold text-zinc-100">Total Amount</span>
                    <span className="font-bold text-xl text-purple-400">{currency} {totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712 345 678 or +254712345678"
                    data-testid="input-mpesa-phone"
                    className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">Safaricom line registered with M-Pesa</p>
                </div>

                <Button
                  onClick={handleTradingDaysPay}
                  disabled={!phone.trim()}
                  className="gap-2"
                  data-testid="button-pay-trading-days"
                >
                  <Smartphone className="h-4 w-4" />
                  Pay {currency} {totalCost.toLocaleString()} via M-Pesa
                </Button>
              </>
            )}

            {/* Pushing State */}
            {step === 'pushing' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-14 w-14 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <p className="font-semibold text-zinc-200">Sending M-Pesa request…</p>
                <p className="text-sm text-zinc-500">Please wait while we initiate the STK push</p>
              </div>
            )}

            {/* Pending State */}
            {step === 'pending' && (
              <div className="flex flex-col items-center justify-center py-10 gap-5">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Smartphone className="h-9 w-9 text-amber-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </span>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg text-zinc-100">Check Your Phone</p>
                  <p className="text-sm text-zinc-400">An M-Pesa STK push has been sent to your phone</p>
                  <p className="text-sm text-zinc-400">Enter your <span className="text-amber-400 font-semibold">M-Pesa PIN</span> to complete payment</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-center">
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Amount</p>
                  <p className="text-2xl font-bold text-white mt-1">{currency} {totalCost.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 mt-1">{tradingDays} trading days · expires {formatExpiryDate(expiryDate)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking payment status…
                </div>
                <Button variant="ghost" onClick={resetPayment} className="text-xs text-zinc-500 gap-1.5">
                  <RotateCcw className="h-3 w-3" /> Cancel & Start Over
                </Button>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-10 gap-5">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-xl text-zinc-100">Payment Successful!</p>
                  <p className="text-sm text-zinc-400">Your subscription has been activated</p>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-6 py-4 space-y-2 w-full max-w-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Trading Days</span>
                    <span className="font-semibold text-zinc-200">{tradingDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Valid Until</span>
                    <span className="font-semibold text-zinc-200">{formatExpiryDate(expiryDate)}</span>
                  </div>
                  {txnRef && (
                    <div className="flex justify-between text-sm border-t border-emerald-900/50 pt-2 mt-1">
                      <span className="text-zinc-400">Transaction Ref</span>
                      <span className="font-mono text-xs text-emerald-400">{txnRef}</span>
                    </div>
                  )}
                </div>
                <Button onClick={resetPayment} variant="secondary" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Buy More Days
                </Button>
              </div>
            )}

            {/* Failed State */}
            {step === 'failed' && (
              <div className="flex flex-col items-center justify-center py-10 gap-5">
                <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-xl text-zinc-100">Payment Failed</p>
                  <p className="text-sm text-zinc-400">
                    {pollTimeout
                      ? 'Payment timed out. Please try again.'
                      : 'Your payment was cancelled or failed. Please try again.'}
                  </p>
                </div>
                <Button onClick={resetPayment} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Legacy Plans ── */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Available Plans
          </h2>

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
                    data-testid={`card-plan-${plan.id}`}
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

        {/* Legacy M-Pesa */}
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
                  value={legacyPhone}
                  onChange={e => setLegacyPhone(e.target.value)}
                  placeholder="0712 345 678 or +254712345678"
                  data-testid="input-legacy-mpesa-phone"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-600 transition-colors max-w-sm"
                />
                <p className="text-xs text-zinc-500 mt-1.5">Safaricom line registered with M-Pesa</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="success"
                  onClick={handleLegacyPay}
                  disabled={paying || !legacyPhone.trim()}
                  className="gap-2"
                  data-testid="button-legacy-pay"
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

        {/* Subscription Info */}
        <Card className="bg-[#0c0c0e] border-zinc-900">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-300">Trading Day Policy</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Subscription days are counted as <span className="text-zinc-300">Monday–Friday only</span>. Weekends and public holidays do not count
                  against your subscription. Your expiry date is calculated accordingly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
