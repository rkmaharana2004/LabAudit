import React, { useState, useEffect } from 'react';
import { axiosClient } from '../api/axiosClient';
import type { Equipment, Sample, SampleCreateRequest, TestResultRequest } from '../types/lab.types';
import { StatusBadge } from '../components/StatusBadge';
import { AuditTrailModal } from '../components/AuditTrailModal';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  Plus,
  Search,
  Filter,
  History,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

interface SamplesPageProps {
  onNavigateToDetail: (sampleId: string) => void;
}

export const SamplesPage: React.FC<SamplesPageProps> = ({ onNavigateToDetail }) => {
  const { hasRole } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [outOfRangeFilter, setOutOfRangeFilter] = useState<boolean | null>(null);

  // Modals
  const [selectedAuditSample, setSelectedAuditSample] = useState<Sample | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [activeSampleForResult, setActiveSampleForResult] = useState<Sample | null>(null);

  // Forms
  const [intakeForm, setIntakeForm] = useState<SampleCreateRequest>({
    sampleCode: '',
    batchNumber: '',
    materialGrade: '',
    testMethod: '',
    unit: 'mm',
    minAllowedValue: 10.0,
    maxAllowedValue: 20.0,
    remarks: '',
  });

  const [resultForm, setResultForm] = useState<TestResultRequest>({
    equipmentId: '',
    measuredValue: 0,
    remarks: '',
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (batchSearch.trim()) params.batchNumber = batchSearch.trim();
      if (outOfRangeFilter !== null) params.outOfRange = outOfRangeFilter;

      const res = await axiosClient.get<Sample[]>('/samples', { params });
      setSamples(res.data);
    } catch (err) {
      console.error('Failed to fetch samples', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await axiosClient.get<Equipment[]>('/equipment');
      setEquipmentList(res.data);
    } catch (err) {
      console.error('Failed to fetch equipment list', err);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchEquipment();
  }, [statusFilter, outOfRangeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSamples();
  };

  const handleStartTesting = async (sample: Sample) => {
    try {
      await axiosClient.post(`/samples/${sample.id}/start-test`);
      fetchSamples();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start testing process.');
    }
  };

  const handleOpenResultModal = (sample: Sample) => {
    setActiveSampleForResult(sample);
    setResultForm({
      equipmentId: equipmentList[0]?.id || '',
      measuredValue: (sample.minAllowedValue + sample.maxAllowedValue) / 2,
      remarks: '',
    });
    setActionError(null);
    setShowResultModal(true);
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      await axiosClient.post('/samples', intakeForm);
      setShowIntakeModal(false);
      setIntakeForm({
        sampleCode: '',
        batchNumber: '',
        materialGrade: '',
        testMethod: '',
        unit: 'mm',
        minAllowedValue: 10.0,
        maxAllowedValue: 20.0,
        remarks: '',
      });
      fetchSamples();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to intake sample.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSampleForResult) return;

    setSubmitting(true);
    setActionError(null);
    try {
      await axiosClient.post(`/samples/${activeSampleForResult.id}/results`, resultForm);
      setShowResultModal(false);
      fetchSamples();
    } catch (err: any) {
      setActionError(
        err.response?.data?.message ||
          'Submission rejected. Instrument calibration may be expired or input invalid.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEquipment = equipmentList.find((e) => e.id === resultForm.equipmentId);
  const isSelectedEquipmentExpired =
    selectedEquipment &&
    selectedEquipment.calibrationDueDate < new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Specimens & Inspection Batches</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sample Inventory & Testing
          </h1>
        </div>

        {hasRole(['TECHNICIAN', 'ADMIN']) && (
          <button
            onClick={() => {
              setActionError(null);
              setShowIntakeModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Intake New Sample
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by batch number (e.g. BCH-AERO-88)..."
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Dropdown */}
          <div className="flex items-center space-x-2 text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 pl-3 pr-8 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_TESTING">In Testing</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="NON_CONFORMANCE">Non-Conformance</option>
              <option value="RETEST_REQUIRED">Retest Required</option>
            </select>
          </div>

          {/* Out of range toggle */}
          <button
            onClick={() =>
              setOutOfRangeFilter(outOfRangeFilter === true ? null : true)
            }
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              outOfRangeFilter === true
                ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⚠️ Out-of-Range Only
          </button>

          {(statusFilter || batchSearch || outOfRangeFilter !== null) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setBatchSearch('');
                setOutOfRangeFilter(null);
              }}
              className="p-2 text-slate-400 hover:text-slate-600"
              title="Reset filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Samples Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Sample Code</th>
                <th className="px-5 py-3.5 font-semibold">Material Grade & Method</th>
                <th className="px-5 py-3.5 font-semibold">Specification Limit</th>
                <th className="px-5 py-3.5 font-semibold">Measurement</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading samples...
                  </td>
                </tr>
              ) : samples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No samples match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                samples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sample Code & Batch */}
                    <td className="px-5 py-4">
                      <div
                        onClick={() => onNavigateToDetail(sample.id)}
                        className="font-mono font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {sample.sampleCode}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Batch: {sample.batchNumber}
                      </div>
                    </td>

                    {/* Material Grade & Method */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {sample.materialGrade}
                      </div>
                      <div className="text-xs text-slate-500">{sample.testMethod}</div>
                    </td>

                    {/* Specification Limits */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">
                      [{sample.minAllowedValue} - {sample.maxAllowedValue}] {sample.unit}
                    </td>

                    {/* Measurement */}
                    <td className="px-5 py-4">
                      {sample.measuredValue != null ? (
                        <div className="flex items-center space-x-1.5 font-mono text-xs">
                          <span
                            className={
                              sample.outOfRange
                                ? 'px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-700 border border-rose-300'
                                : 'px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }
                          >
                            {sample.measuredValue} {sample.unit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pending measurement</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={sample.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right space-x-2">
                      {/* Start Test */}
                      {(sample.status === 'RECEIVED' || sample.status === 'RETEST_REQUIRED') &&
                        hasRole(['TECHNICIAN', 'ADMIN']) && (
                          <button
                            onClick={() => handleStartTesting(sample)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start Test
                          </button>
                        )}

                      {/* Log Measurement */}
                      {(sample.status === 'IN_TESTING' || sample.status === 'RECEIVED') &&
                        hasRole(['TECHNICIAN']) && (
                          <button
                            onClick={() => handleOpenResultModal(sample)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                          >
                            <FlaskConical className="w-3 h-3 mr-1" />
                            Log Result
                          </button>
                        )}

                      {/* Review Action */}
                      {(sample.status === 'PENDING_REVIEW' || sample.status === 'NON_CONFORMANCE') &&
                        hasRole(['REVIEWER', 'ADMIN']) && (
                          <button
                            onClick={() => onNavigateToDetail(sample.id)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Review
                          </button>
                        )}

                      {/* Audit Trail Modal */}
                      <button
                        onClick={() => setSelectedAuditSample(sample)}
                        title="View Immutable Audit Trail"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-lg">Intake Sample (RECEIVED)</h3>
              </div>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Sample Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SMP-2026-0201"
                    value={intakeForm.sampleCode}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, sampleCode: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BCH-AERO-92"
                    value={intakeForm.batchNumber}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, batchNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Material Grade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ti-6Al-4V"
                    value={intakeForm.materialGrade}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, materialGrade: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Test Method *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASTM E114 Ultrasonic"
                    value={intakeForm.testMethod}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, testMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mm, MPa, HRC"
                    value={intakeForm.unit}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Min Value *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={intakeForm.minAllowedValue}
                    onChange={(e) =>
                      setIntakeForm({
                        ...intakeForm,
                        minAllowedValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Max Value *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={intakeForm.maxAllowedValue}
                    onChange={(e) =>
                      setIntakeForm({
                        ...intakeForm,
                        maxAllowedValue: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Intake Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Intake condition notes..."
                  value={intakeForm.remarks || ''}
                  onChange={(e) =>
                    setIntakeForm({ ...intakeForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Submission Modal (with Calibration Expiry Guard demonstration) */}
      {showResultModal && activeSampleForResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Log Test Measurement</h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResultSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r-xl space-y-1">
                  <div className="font-bold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 text-rose-600" />
                    Compliance Guard Triggered
                  </div>
                  <p>{actionError}</p>
                </div>
              )}

              {/* Sample Specs Context */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sample:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeSampleForResult.sampleCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tolerance Limits:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeSampleForResult.minAllowedValue} - {activeSampleForResult.maxAllowedValue}{' '}
                    {activeSampleForResult.unit}
                  </span>
                </div>
              </div>

              {/* Equipment Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Measurement Instrument *
                </label>
                <select
                  required
                  value={resultForm.equipmentId}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, equipmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.assetTag} - {eq.name} (Due: {eq.calibrationDueDate})
                    </option>
                  ))}
                </select>

                {/* Expiry Warning */}
                {isSelectedEquipmentExpired && (
                  <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>
                      <strong>Warning:</strong> Selected instrument calibration is expired ({selectedEquipment?.calibrationDueDate}). Submitting will be rejected by the backend Calibration Expiry Guard.
                    </span>
                  </div>
                )}
              </div>

              {/* Measured Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Measured Value ({activeSampleForResult.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={resultForm.measuredValue}
                  onChange={(e) =>
                    setResultForm({
                      ...resultForm,
                      measuredValue: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Values outside [{activeSampleForResult.minAllowedValue} - {activeSampleForResult.maxAllowedValue}] will automatically transition sample to{' '}
                  <strong className="text-rose-600">NON_CONFORMANCE</strong>.
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Technician Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Measurement observations..."
                  value={resultForm.remarks || ''}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Submitting Result...' : 'Submit Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {selectedAuditSample && (
        <AuditTrailModal
          sample={selectedAuditSample}
          onClose={() => setSelectedAuditSample(null)}
        />
      )}
    </div>
  );
};
