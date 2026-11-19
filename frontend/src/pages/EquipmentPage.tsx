import React, { useState, useEffect } from 'react';
import { axiosClient } from '../api/axiosClient';
import type { CalibrationUpdateRequest, Equipment, EquipmentCreateRequest } from '../types/lab.types';
import { CalibrationBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  RefreshCw,
  Calendar,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';

export const EquipmentPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [selectedEquipmentForCalib, setSelectedEquipmentForCalib] = useState<Equipment | null>(null);

  // Forms
  const [registerForm, setRegisterForm] = useState<EquipmentCreateRequest>({
    assetTag: '',
    name: '',
    category: '',
    serialNumber: '',
    lastCalibratedDate: new Date().toISOString().split('T')[0],
    calibrationDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  const [calibForm, setCalibForm] = useState<CalibrationUpdateRequest>({
    lastCalibratedDate: new Date().toISOString().split('T')[0],
    calibrationDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    remarks: '',
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get<Equipment[]>('/equipment');
      setEquipmentList(res.data);
    } catch (err) {
      console.error('Failed to load equipment list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await axiosClient.post('/equipment', registerForm);
      setShowRegisterModal(false);
      setRegisterForm({
        assetTag: '',
        name: '',
        category: '',
        serialNumber: '',
        lastCalibratedDate: new Date().toISOString().split('T')[0],
        calibrationDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      });
      fetchEquipment();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to register equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCalibrateModal = (eq: Equipment) => {
    setSelectedEquipmentForCalib(eq);
    setCalibForm({
      lastCalibratedDate: new Date().toISOString().split('T')[0],
      calibrationDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      remarks: 'Annual recalibration completed by accredited calibration lab',
    });
    setModalError(null);
    setShowCalibrateModal(true);
  };

  const handleCalibrateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForCalib) return;

    setSubmitting(true);
    setModalError(null);
    try {
      await axiosClient.patch(`/equipment/${selectedEquipmentForCalib.id}/calibrate`, calibForm);
      setShowCalibrateModal(false);
      fetchEquipment();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to renew calibration.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEquipment = equipmentList.filter(
    (e) =>
      e.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            <span>Laboratory Metrology & Instrumentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Equipment & Calibration Management
          </h1>
        </div>

        {hasRole('ADMIN') && (
          <button
            onClick={() => {
              setModalError(null);
              setShowRegisterModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register Instrument
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset tag, name, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={fetchEquipment}
          title="Refresh equipment"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Asset Tag</th>
                <th className="px-5 py-3.5 font-semibold">Equipment Name & Category</th>
                <th className="px-5 py-3.5 font-semibold">Serial Number</th>
                <th className="px-5 py-3.5 font-semibold">Last Calibrated</th>
                <th className="px-5 py-3.5 font-semibold">Calibration Due Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading equipment catalog...
                  </td>
                </tr>
              ) : filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No equipment found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {eq.assetTag}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{eq.name}</div>
                      <div className="text-xs text-slate-400">{eq.category}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {eq.serialNumber}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {eq.lastCalibratedDate}
                    </td>
                    <td className="px-5 py-4">
                      <CalibrationBadge dueDate={eq.calibrationDueDate} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {hasRole('ADMIN') ? (
                        <button
                          onClick={() => handleOpenCalibrateModal(eq)}
                          className="inline-flex items-center px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Renew Calibration
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Instrument Modal (ADMIN) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <h3 className="font-bold text-lg">Register Lab Instrument</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Asset Tag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UT-NDT-05"
                  value={registerForm.assetTag}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, assetTag: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Rockwell Hardness Tester"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metrology / NDT"
                    value={registerForm.category}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-889102"
                    value={registerForm.serialNumber}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, serialNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Last Calibrated *
                  </label>
                  <input
                    type="date"
                    required
                    value={registerForm.lastCalibratedDate}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, lastCalibratedDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Calibration Due *
                  </label>
                  <input
                    type="date"
                    required
                    value={registerForm.calibrationDueDate}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, calibrationDueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Calibration Modal (ADMIN) */}
      {showCalibrateModal && selectedEquipmentForCalib && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-teal-700 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-lg">Renew Calibration</h3>
              </div>
              <button
                onClick={() => setShowCalibrateModal(false)}
                className="text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalibrateSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div>
                  <span className="text-slate-500">Asset Tag: </span>
                  <strong className="font-mono text-slate-800">
                    {selectedEquipmentForCalib.assetTag}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Instrument: </span>
                  <strong className="text-slate-800">{selectedEquipmentForCalib.name}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Calibration Date *
                </label>
                <input
                  type="date"
                  required
                  value={calibForm.lastCalibratedDate}
                  onChange={(e) =>
                    setCalibForm({ ...calibForm, lastCalibratedDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Calibration Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={calibForm.calibrationDueDate}
                  onChange={(e) =>
                    setCalibForm({ ...calibForm, calibrationDueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Calibration Certification Remarks
                </label>
                <textarea
                  rows={2}
                  value={calibForm.remarks || ''}
                  onChange={(e) =>
                    setCalibForm({ ...calibForm, remarks: e.target.value })
                  }
                  placeholder="e.g. ISO 17025 certificate #CAL-2026-99"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Renewing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
