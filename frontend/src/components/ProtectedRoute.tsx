import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/lab.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onRedirectToLogin,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    onRedirectToLogin();
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Your active role (<span className="font-semibold">{user.role}</span>) does not have authorization to view this section or perform this operation.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
