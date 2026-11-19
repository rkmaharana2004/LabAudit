import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';
import type { Equipment, ReviewRequest, Sample } from '../types/lab.types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface SampleDetailPageProps {
  sampleId: string;
  onBack: () => void;
}

export const SampleDetailPage: React.FC<SampleDetailPageProps> = ({ sampleId, onBack }) => {
  const { user, hasRole } = useAuth();
  const [sample, setSample] = useState<Sample | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const fetchSampleData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get<Sample>(`/samples/${sampleId}`);
      setSample(res.data);

      if (res.data.equipmentId) {
        try {
          const eqRes = await axiosClient.get<Equipment>(`/equipment/${res.data.equipmentId}`);
          setEquipment(eqRes.data);
        } catch {
          // equipment could not be found or was optional
        }
      }
    } catch (err) {
      console.error('Failed to load sample detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSampleData();
  }, [sampleId]);

  const handleReview = async (approved: boolean) => {
    if (!reviewRemarks.trim()) {
      setReviewError('Review remarks are mandatory for ISO audit trail compliance.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const payload: ReviewRequest = {
        approved,
        remarks: reviewRemarks.trim(),
      };
      await axiosClient.patch(`/samples/${sampleId}/review`, payload);
      setReviewSuccess(
        approved
          ? 'Sample successfully approved and marked COMPLETED!'
          : 'Sample rejected and routed to RETEST_REQUIRED.'
      );
      setReviewRemarks('');
      fetchSampleData();
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading sample inspection record...
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h3 className="text-xl font-bold text-slate-900">Sample Not Found</h3>
        <p className="mt-2 text-sm text-slate-500">The requested sample identifier does not exist.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
        >
          &larr; Back to Samples
        </button>
      </div>
    );
  }

  const canReview =
    (sample.status === 'PENDING_REVIEW' || sample.status === 'NON_CONFORMANCE') &&
    hasRole(['REVIEWER', 'ADMIN']);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button & Top Bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Samples
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSampleData}
            title="Refresh record"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <StatusBadge status={sample.status} size="md" />
        </div>
      </div>

      {/* Main Sample Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                {sample.sampleCode}
              </h1>
              {sample.outOfRange && (
                <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 rounded-lg animate-pulse">
                  OUT OF SPECIFICATION
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Batch: <strong className="font-mono text-slate-800">{sample.batchNumber}</strong> &middot; Intake: {formatDate(sample.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Material Grade</span>
            <span className="text-base font-bold text-slate-800">{sample.materialGrade}</span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Test Method</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">
              {sample.testMethod}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Acceptance Range</span>
            <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">
              [{sample.minAllowedValue} - {sample.maxAllowedValue}] {sample.unit}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Measured Value</span>
            <div className="mt-1 font-mono text-base font-extrabold">
              {sample.measuredValue != null ? (
                <span className={sample.outOfRange ? 'text-rose-600' : 'text-emerald-600'}>
                  {sample.measuredValue} {sample.unit}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-normal italic">Pending</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Testing Instrument</span>
            {equipment ? (
              <div className="mt-1">
                <span className="text-xs font-mono font-bold text-slate-800 block">
                  {equipment.assetTag}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">{equipment.name}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 mt-1 block italic">Not linked yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer Quality Decision Section */}
      {canReview && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-2xl border-2 border-purple-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-purple-900">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-lg">Quality Assurance Review & Disposition</h3>
          </div>

          <p className="text-xs text-purple-800">
            As a certified <strong className="uppercase">{user?.role}</strong>, evaluate compliance with technical specifications and either approve for final release or request re-testing.
          </p>

          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          {reviewSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{reviewSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Reviewer Disposition Remarks * (Recorded into Immutable Audit Trail)
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. Dimensions verify ASTM E114 ultrasonic standard. Approved for production batch integration."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleReview(true)}
              disabled={reviewSubmitting}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {reviewSubmitting ? 'Recording...' : 'Approve Sample (COMPLETED)'}
            </button>

            <button
              onClick={() => handleReview(false)}
              disabled={reviewSubmitting}
              className="inline-flex items-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {reviewSubmitting ? 'Recording...' : 'Request Retest (RETEST_REQUIRED)'}
            </button>
          </div>
        </div>
      )}

      {/* Embedded Audit Trail Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-lg">Embedded Audit Trail History</h3>
        </div>

        <ol className="relative border-l-2 border-indigo-200 ml-4 space-y-6">
          {sample.auditTrail.map((entry, idx) => (
            <li key={idx} className="relative pl-6">
              <span className="absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full bg-white ring-4 ring-slate-100 shadow-sm border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </span>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-slate-200/60">
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
                    {!entry.fromStatus && <StatusBadge status={entry.toStatus} size="sm" />}
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {formatDate(entry.timestamp)}
                  </div>
                </div>

                <p className="text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 mb-2">
                  {entry.remarks}
                </p>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5 font-medium text-slate-600">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      Performed by: <strong className="text-slate-800">{entry.performedBy}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">Audit #{idx + 1}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
