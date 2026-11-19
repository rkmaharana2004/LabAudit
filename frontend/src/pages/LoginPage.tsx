import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, ShieldCheck, UserCheck, Wrench, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password.trim());
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setLoading(true);
    setError(null);
    try {
      await login(userVal, passVal);
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Quick login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-lg mb-4">
            <FlaskConical className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">LabAudit Sign In</h2>
          <p className="mt-2 text-sm text-slate-500">
            Audit-ready Laboratory Information & Compliance System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. tech_arjun"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
              Quick Switch Demo Roles
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('tech_arjun', 'tech123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 transition-all text-left"
              >
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-xs mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Technician</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">tech_arjun</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer_sarah', 'reviewer123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 transition-all text-left"
              >
                <div className="flex items-center space-x-1.5 text-blue-700 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Reviewer</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">reviewer_sarah</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex flex-col items-center p-2.5 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50 text-slate-700 transition-all text-left"
              >
                <div className="flex items-center space-x-1.5 text-purple-700 font-semibold text-xs mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
