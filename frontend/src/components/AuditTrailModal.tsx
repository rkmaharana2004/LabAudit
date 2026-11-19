import React from 'react';
import type { AuditEntry, Sample } from '../types/lab.types';
import { StatusBadge } from './StatusBadge';
import { X, History, User, Clock, CheckCircle2, AlertTriangle, PlayCircle, PlusCircle, RefreshCw } from 'lucide-react';

interface AuditTrailModalProps {
  sample: Sample | null;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ sample, onClose }) => {
  if (!sample) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SAMPLE_REGISTERED':
        return <PlusCircle className="w-5 h-5 text-blue-600" />;
      case 'TEST_STARTED':
        return <PlayCircle className="w-5 h-5 text-amber-600" />;
      case 'RESULT_SUBMITTED':
        return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
      case 'SAMPLE_REVIEWED':
        return <History className="w-5 h-5 text-emerald-600" />;
      case 'CALIBRATION_RENEWED':
        return <RefreshCw className="w-5 h-5 text-teal-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Immutable Audit Trail</h3>
              <p className="text-xs text-indigo-200">
                Sample: <span className="font-mono font-semibold text-white">{sample.sampleCode}</span> (Batch: {sample.batchNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Audit Timeline */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {(!sample.auditTrail || sample.auditTrail.length === 0) ? (
            <p className="text-center text-slate-500 py-8 text-sm">No audit entries recorded for this sample.</p>
          ) : (
            <ol className="relative border-l-2 border-indigo-200 ml-4 space-y-8 my-2">
              {sample.auditTrail.map((entry: AuditEntry, index: number) => (
                <li key={index} className="relative pl-6">
                  {/* Marker */}
                  <span className="absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-white ring-4 ring-slate-100 shadow-sm border border-slate-200">
                    {getActionIcon(entry.action)}
                  </span>

                  {/* Entry Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 tracking-tight">
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        {entry.fromStatus && (
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                            <StatusBadge status={entry.fromStatus} size="sm" />
                            <span>&rarr;</span>
                            <StatusBadge status={entry.toStatus} size="sm" />
                          </div>
                        )}
                        {!entry.fromStatus && (
                          <StatusBadge status={entry.toStatus} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 mb-2">
                      {entry.remarks}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center space-x-1.5 font-medium text-slate-600">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Performed by: <strong className="text-slate-800">{entry.performedBy}</strong></span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Entry #{index + 1}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
