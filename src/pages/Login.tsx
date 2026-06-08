import * as React from 'react';
import { useLocation } from 'wouter';
import { Activity, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useLogin } from '../api/client';

export default function Login() {
  const [, navigate] = useLocation();
  const loginMutation = useLogin();

  const [form, setForm] = React.useState({ email: '', password: '' });
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await loginMutation.mutateAsync(form);
      const token = res?.access_token || res?.token || res?.accessToken;
      if (token) {
        localStorage.setItem('pmatrix_access_token', token);
        navigate('/');
      } else {
        setError('Login succeeded but no token was returned. Contact support.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-400 mb-6">Sign in to your trading account</p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
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

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Authenticating…</>
                : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Create one
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
