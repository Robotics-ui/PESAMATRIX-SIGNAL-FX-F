import * as React from 'react';
import { useLocation } from 'wouter';
import { Activity, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useChangePassword } from '../api/client';

export default function ChangePassword() {
  const [, navigate] = useLocation();
  const changeMutation = useChangePassword();

  const [form, setForm] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = React.useState({ current: false, next: false, confirm: false });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const isFirstLogin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('pmatrix_user') || '{}');
      return u?.active === false;
    } catch { return false; }
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    try {
      await changeMutation.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      const stored = localStorage.getItem('pmatrix_user');
      if (stored) {
        const user = JSON.parse(stored);
        localStorage.setItem('pmatrix_user', JSON.stringify({ ...user, active: true }));
      }
      setSuccess(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-purple-600 p-2.5 rounded-xl">
            <Activity className="h-7 w-7 text-white animate-pulse" />
          </div>
          <span className="font-bold text-2xl tracking-wider text-white">PMATRIX</span>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <KeyRound className="h-5 w-5 text-purple-400" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {isFirstLogin ? 'Set Your Password' : 'Change Password'}
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mb-6 ml-1">
            {isFirstLogin
              ? 'You\'re using a temporary password. Please set a new one to continue.'
              : 'Update your account password below.'}
          </p>

          {isFirstLogin && (
            <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                For security, your temporary password must be changed before you can access the platform.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 mb-5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">Password changed successfully. Redirecting to dashboard…</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword', showKey: 'current' as const, autoComplete: 'current-password' },
              { label: 'New Password', key: 'newPassword', showKey: 'next' as const, autoComplete: 'new-password' },
              { label: 'Confirm New Password', key: 'confirmPassword', showKey: 'confirm' as const, autoComplete: 'new-password' },
            ].map(({ label, key, showKey, autoComplete }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    required
                    autoComplete={autoComplete}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    data-testid={`input-${key}`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {show[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="submit"
              data-testid="button-change-password"
              className="w-full mt-2"
              disabled={changeMutation.isPending || success}
            >
              {changeMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating Password…</>
                : 'Update Password'}
            </Button>
          </form>

          {!isFirstLogin && (
            <p className="text-center text-sm text-zinc-500 mt-6">
              <button
                onClick={() => navigate('/')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                ← Back to Dashboard
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          PMATRIX Signal Distribution Platform · Secure Connection
        </p>
      </div>
    </div>
  );
}
