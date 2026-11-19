import React from 'react';
import type { SampleStatus } from '../types/lab.types';

interface StatusBadgeProps {
  status: SampleStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20';
      case 'IN_TESTING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'PENDING_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'NON_CONFORMANCE':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20 animate-pulse';
      case 'RETEST_REQUIRED':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/20';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/20';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'RECEIVED':
        return 'Received';
      case 'IN_TESTING':
        return 'In Testing';
      case 'PENDING_REVIEW':
        return 'Pending Review';
      case 'COMPLETED':
        return 'Completed';
      case 'NON_CONFORMANCE':
        return 'Non-Conformance';
      case 'RETEST_REQUIRED':
        return 'Retest Required';
      default:
        return status;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ring-1 ring-inset ${getStyles()} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {getLabel()}
    </span>
  );
};

export const CalibrationBadge: React.FC<{ dueDate: string }> = ({ dueDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

  if (dueDate < today) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />
        EXPIRED ({dueDate})
      </span>
    );
  } else if (diffDays <= 30) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
        Due Soon ({diffDays}d)
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Compliant ({dueDate})
      </span>
    );
  }
};
