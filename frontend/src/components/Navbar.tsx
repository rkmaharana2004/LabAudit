import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, LayoutDashboard, Database, Wrench, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'REVIEWER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TECHNICIAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">LabAudit</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                LIMS & Compliance
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('samples')}
              className={`inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'samples' || currentPage === 'sample-detail'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 mr-2" />
              Samples & Testing
            </button>
            <button
              onClick={() => onNavigate('equipment')}
              className={`inline-flex items-center px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'equipment'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Equipment & Calibration
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">{user.username}</span>
                  </div>
                  <span
                    className={`inline-block self-end text-[10px] font-bold px-2 py-0.2 rounded border uppercase tracking-wider ${getRoleBadgeStyle(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
