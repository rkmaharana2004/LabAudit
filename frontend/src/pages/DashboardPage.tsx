import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';
import type { Equipment, Sample, SampleStats } from '../types/lab.types';
import { StatusBadge, CalibrationBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  FlaskConical,
  AlertTriangle,
  Clock,
  Wrench,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, sampleId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SampleStats | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [recentSamples, setRecentSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, equipRes, samplesRes] = await Promise.all([
        axiosClient.get('/samples/stats'),
        axiosClient.get('/equipment'),
        axiosClient.get('/samples'),
      ]);
      setStats(statsRes.data);
      setEquipmentList(equipRes.data);
      setRecentSamples(samplesRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const expiredEquipmentCount = equipmentList.filter(
    (e) => e.calibrationDueDate < todayStr
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIMS Operational Workspace &middot; ISO 17025 Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.username}
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-2xl">
            Monitor real-time laboratory sample intakes, active testing, quality reviews, and instrument calibration compliance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('samples')}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Manage Samples
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh metrics"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compliance Alert if Equipment Expired */}
      {expiredEquipmentCount > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl shadow-sm flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Compliance Risk: {expiredEquipmentCount} Instrument(s) Calibration Expired!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Lab technicians will be blocked from submitting test results with these instruments until calibration is renewed.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('equipment')}
            className="text-xs font-bold text-rose-800 hover:text-rose-900 bg-rose-200/60 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-4"
          >
            Inspect Equipment &rarr;
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Samples */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Samples</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.total ?? 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center">
            <span>Intake to completion</span>
          </div>
        </div>

        {/* In Testing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">In Testing</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <FlaskConical className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">
              {stats?.byStatus?.IN_TESTING ?? 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Active technician workbench
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-purple-600">
              {stats?.byStatus?.PENDING_REVIEW ?? 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Awaiting Reviewer sign-off
          </div>
        </div>

        {/* Non-Conformance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Non-Conformance</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-600">
              {stats?.byStatus?.NON_CONFORMANCE ?? 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Out-of-specification measurements
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Samples & Equipment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Samples Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Recent Sample Batches</h3>
            </div>
            <button
              onClick={() => onNavigate('samples')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View all samples <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Sample Code</th>
                  <th className="px-5 py-3 font-semibold">Material</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Measurement</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSamples.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No sample records available yet.
                    </td>
                  </tr>
                ) : (
                  recentSamples.map((sample) => (
                    <tr
                      key={sample.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => onNavigate('sample-detail', sample.id)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-indigo-600">
                          {sample.sampleCode}
                        </span>
                        <div className="text-xs text-slate-400">{sample.batchNumber}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {sample.materialGrade}
                        <div className="text-xs text-slate-400">{sample.testMethod}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={sample.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {sample.measuredValue != null ? (
                          <span
                            className={
                              sample.outOfRange
                                ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                                : 'text-emerald-700 font-medium'
                            }
                          >
                            {sample.measuredValue} {sample.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not tested</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('sample-detail', sample.id);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Equipment Status Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Instruments Compliance</h3>
            </div>
            <button
              onClick={() => onNavigate('equipment')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {equipmentList.slice(0, 4).map((eq) => (
              <div
                key={eq.id}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {eq.assetTag}
                  </span>
                  <CalibrationBadge dueDate={eq.calibrationDueDate} />
                </div>
                <div className="text-xs text-slate-600 font-medium">{eq.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Category: {eq.category} &middot; SN: {eq.serialNumber}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('equipment')}
              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Manage Lab Instruments ({equipmentList.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
