import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await login('demo@311brampton.ca', 'demo123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-themed hover:bg-hover transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-themed">311.2Brampton</h1>
          <p className="text-muted">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-[var(--border)] rounded-2xl p-8 shadow-themed">
          <h2 className="text-xl font-semibold mb-6 text-themed">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-[var(--border)] rounded-lg px-4 py-2.5 text-themed focus:outline-none focus:border-accent transition-colors"
                placeholder="admin@brampton.ca"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-[var(--border)] rounded-lg px-4 py-2.5 text-themed focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-muted">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading || loading}
            className="mt-4 w-full bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {demoLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Try Demo'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Authorized personnel only. Contact IT for access.
        </p>
      </div>
    </div>
  );
}
