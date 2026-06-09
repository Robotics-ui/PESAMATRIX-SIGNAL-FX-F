import * as React from 'react';
import { useLocation } from 'wouter';
import { Activity, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useRegister } from '../api/client';

export default function Register() {
  const [, navigate] = useLocation();
  const registerMutation = useRegister();

  const [form, setForm] = React.useState({ fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '' });
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await registerMutation.mutateAsync({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phoneNumber: form.phoneNumber,
      });
      const token = res?.access_token || res?.token || res?.accessToken;
      if (token) {
        localStorage.setItem('pmatrix_access_token', token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-purple-600 p-2.5 rounded-xl">
            <Activity className="h-7 w-7 text-white animate-pulse" />
          </div>
          <span className="font-bold text-2xl tracking-wider text-white">PMATRIX</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm text-zinc-400 mb-6">Join PMATRIX signal distribution platform</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="John Trader"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="trader@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Phone Number <span className="text-zinc-600 normal-case font-normal">(for M-Pesa)</span>
              </label>
              <input
                type="tel"
                required
                value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="+254712345678"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your password"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
                : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          PMATRIX Signal Distribution Platform · Secure Connection
        </p>
      </div>
    </div>
  );
}
