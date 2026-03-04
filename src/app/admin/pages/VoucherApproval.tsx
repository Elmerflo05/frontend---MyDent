// ============================================================================
// VOUCHER APPROVAL - Panel de Aprobación de Vouchers (SuperAdmin)
// ============================================================================
// NOTA: Este componente usa stubs para datos de pacientes y planes.
// Requiere implementación de API real en el backend.

import { useState, useEffect, useCallback } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { useAuthStore } from '@/store/authStore';
import AlertModal from '@/components/common/AlertModal';
import {
  CheckCircle,
  XCircle,
  Eye,
  X,
  AlertCircle,
  User,
  RefreshCw,
  Clock,
  FileText,
  Filter
} from 'lucide-react';
import type { PaymentVoucher } from '@/types/healthPlans';
import type { Patient, BaseHealthPlan } from '@/types';

export default function VoucherApproval() {
  const { user } = useAuthStore();
  const {
    pendingVouchers,
    loadPendingVouchers,
    approveVoucher,
    rejectVoucher,
    getVoucherStats,
    loading,
    error
  } = useHealthPlanStore();

  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [voucherDetails, setVoucherDetails] = useState<Map<string, { patient: Patient; plan: BaseHealthPlan }>>(new Map());

  // Estados para historial
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [historyVouchers, setHistoryVouchers] = useState<PaymentVoucher[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [reviewerNames, setReviewerNames] = useState<Map<string, string>>(new Map());

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Cargar vouchers del historial (stub - requiere API)
  const loadHistoryVouchers = useCallback(async () => {
    console.warn('⚠️ VoucherApproval.loadHistoryVouchers: Stub - requiere API real');
    // TODO: Implementar API para cargar historial de vouchers
    setHistoryVouchers([]);
    setReviewerNames(new Map());
  }, []);

  const loadData = useCallback(async () => {
    await loadPendingVouchers();
    await loadHistoryVouchers();
    const statsData = await getVoucherStats();
    setStats(statsData);
  }, [loadPendingVouchers, loadHistoryVouchers, getVoucherStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cargar detalles de paciente y plan para vouchers (stub - requiere API)
  useEffect(() => {
    const vouchersToLoad = activeTab === 'pending' ? pendingVouchers : historyVouchers;

    const loadVoucherDetails = async () => {
      console.warn('⚠️ VoucherApproval.loadVoucherDetails: Stub - requiere API real');
      const details = new Map();

      // Stub: Crear datos placeholder para cada voucher
      for (const voucher of vouchersToLoad) {
        const placeholderPatient = {
          id: voucher.patientId,
          firstName: 'Paciente',
          lastName: '(Cargar desde API)',
          email: 'pendiente@api.com',
          dni: 'N/A'
        } as Patient;

        const placeholderPlan = {
          id: voucher.planId,
          name: 'Plan (Cargar desde API)',
          type: 'N/A'
        } as BaseHealthPlan;

        details.set(voucher.id, { patient: placeholderPatient, plan: placeholderPlan });
      }
      setVoucherDetails(details);
    };

    if (vouchersToLoad.length > 0) {
      loadVoucherDetails();
    }
  }, [pendingVouchers, historyVouchers, activeTab]);

  const handleViewVoucher = (voucher: PaymentVoucher) => {
    setSelectedVoucher(voucher);
  };

  const handleApprove = async (voucher: PaymentVoucher) => {
    if (!user) {
      return;
    }

    // Usar detalles del cache o placeholder
    let details = voucherDetails.get(voucher.id);
    if (!details) {
      // Stub: usar datos placeholder
      details = {
        patient: {
          id: voucher.patientId,
          firstName: 'Paciente',
          lastName: '(API)',
          email: 'pendiente@api.com',
          dni: 'N/A'
        } as Patient,
        plan: {
          id: voucher.planId,
          name: 'Plan (API)',
          type: 'N/A'
        } as BaseHealthPlan
      };
    }

    const patientEmail = details.patient.email || 'paciente@email.com';

    setAlertModal({
      isOpen: true,
      type: 'confirm',
      title: 'Aprobar Voucher',
      message: `¿Confirmas que deseas aprobar el voucher de ${details.patient.firstName} ${details.patient.lastName}? El plan del paciente se activará inmediatamente.`,
      onConfirm: async () => {

        // Cerrar el modal de confirmación primero
        setAlertModal(prev => ({ ...prev, isOpen: false }));

        try {
          await approveVoucher(voucher.id, user.id, patientEmail);
          setSelectedVoucher(null);

          // Esperar un momento antes de abrir el modal de éxito
          setTimeout(() => {
            setAlertModal({
              isOpen: true,
              type: 'success',
              title: 'Voucher Aprobado',
              message: 'El voucher ha sido aprobado exitosamente. El paciente ha sido notificado y su plan está activo.'
            });
          }, 300);
        } catch (err) {

          setTimeout(() => {
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: 'Ocurrió un error al aprobar el voucher. Por favor, intenta nuevamente.'
            });
          }, 300);
        }
      }
    });
  };

  const handleRejectClick = (voucher: PaymentVoucher) => {
    setSelectedVoucher(voucher);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!selectedVoucher || !user || !rejectionReason.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Razón Requerida',
        message: 'Por favor ingresa una razón para el rechazo del voucher.'
      });
      return;
    }

    // Usar detalles del cache o placeholder
    let details = voucherDetails.get(selectedVoucher.id);
    if (!details) {
      // Stub: usar datos placeholder
      details = {
        patient: {
          id: selectedVoucher.patientId,
          firstName: 'Paciente',
          lastName: '(API)',
          email: 'pendiente@api.com',
          dni: 'N/A'
        } as Patient,
        plan: {
          id: selectedVoucher.planId,
          name: 'Plan (API)',
          type: 'N/A'
        } as BaseHealthPlan
      };
    }

    const patientEmail = details.patient.email || 'paciente@email.com';

    try {
      await rejectVoucher(selectedVoucher.id, user.id, rejectionReason, patientEmail);
      setShowRejectModal(false);
      setSelectedVoucher(null);
      setRejectionReason('');
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Voucher Rechazado',
        message: 'El voucher ha sido rechazado. El paciente ha sido notificado y puede subir un nuevo comprobante.'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error al rechazar el voucher. Por favor, intenta nuevamente.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aprobación de Vouchers</h1>
            <p className="text-gray-600 mt-1">Revisa y aprueba los comprobantes de pago</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-5 border-2 border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium mb-1">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-5">
            <p className="text-sm text-green-600 mb-1">Aprobados</p>
            <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-5">
            <p className="text-sm text-red-600 mb-1">Rechazados</p>
            <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pendientes ({stats.pending})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Historial ({stats.approved + stats.rejected})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Vouchers List */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'history' && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      historyFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setHistoryFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      historyFilter === 'approved'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Aprobados
                  </button>
                  <button
                    onClick={() => setHistoryFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      historyFilter === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Rechazados
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'pending'
                ? `Vouchers Pendientes (${pendingVouchers.length})`
                : `Historial de Vouchers`
              }
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Cargando vouchers...</p>
            </div>
          ) : activeTab === 'pending' && pendingVouchers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay vouchers pendientes</p>
              <p className="text-gray-500 text-sm mt-2">Todos los pagos han sido procesados</p>
            </div>
          ) : activeTab === 'history' && historyVouchers.filter(v =>
              historyFilter === 'all' || v.status === historyFilter
            ).length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay vouchers en el historial</p>
              <p className="text-gray-500 text-sm mt-2">Los vouchers procesados aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'pending' ? 'Subido' : 'Estado'}
                    </th>
                    {activeTab === 'history' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revisado por
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === 'pending' ? pendingVouchers : historyVouchers.filter(v =>
                    historyFilter === 'all' || v.status === historyFilter
                  )).map((voucher) => {
                    const details = voucherDetails.get(voucher.id);
                    return (
                      <tr key={voucher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {details ? `${details.patient.firstName} ${details.patient.lastName}` : 'Cargando...'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {details?.patient.dni}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {details?.plan.name || 'Cargando...'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {details?.plan.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            S/ {voucher.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {voucher.paymentPeriod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activeTab === 'pending' ? (
                            new Date(voucher.uploadDate).toLocaleDateString()
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              voucher.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {voucher.status === 'approved' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprobado
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rechazado
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        {activeTab === 'history' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {voucher.reviewedBy ? reviewerNames.get(voucher.reviewedBy) || 'Desconocido' : '-'}
                            </div>
                            {voucher.reviewedAt && (
                              <div className="text-xs text-gray-500">
                                {new Date(voucher.reviewedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {activeTab === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewVoucher(voucher)}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </button>
                              <button
                                onClick={() => handleApprove(voucher)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRejectClick(voucher)}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleViewVoucher(voucher)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Detalles
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Voucher Modal */}
        {selectedVoucher && !showRejectModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Detalle del Voucher</h2>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Voucher Image */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Comprobante:</h3>
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={selectedVoucher.voucherImage}
                      alt="Voucher"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>

                {/* Estado del voucher (solo para historial) */}
                {selectedVoucher.status !== 'pending' && (
                  <div className={`mb-6 p-4 rounded-lg border-2 ${
                    selectedVoucher.status === 'approved'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedVoucher.status === 'approved' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="text-sm font-bold text-green-900">Voucher Aprobado</h3>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <h3 className="text-sm font-bold text-red-900">Voucher Rechazado</h3>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">Revisado por:</span>{' '}
                        {selectedVoucher.reviewedBy ? reviewerNames.get(selectedVoucher.reviewedBy) || 'Desconocido' : '-'}
                      </p>
                      {selectedVoucher.reviewedAt && (
                        <p>
                          <span className="font-semibold">Fecha:</span>{' '}
                          {new Date(selectedVoucher.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {selectedVoucher.status === 'rejected' && selectedVoucher.rejectionReason && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="font-semibold mb-1">Motivo del rechazo:</p>
                          <p className="text-red-800 italic">{selectedVoucher.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Paciente</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {voucherDetails.get(selectedVoucher.id) &&
                        `${voucherDetails.get(selectedVoucher.id)!.patient.firstName} ${voucherDetails.get(selectedVoucher.id)!.patient.lastName}`}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Plan</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {voucherDetails.get(selectedVoucher.id)?.plan.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Monto</p>
                    <p className="text-lg font-bold text-gray-900">S/ {selectedVoucher.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Período de Pago</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedVoucher.paymentPeriod}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Fecha del Pago</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedVoucher.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Subido el</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedVoucher.uploadDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions - Solo mostrar si es pendiente */}
                {selectedVoucher.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(selectedVoucher)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Aprobar Voucher
                    </button>
                    <button
                      onClick={() => handleRejectClick(selectedVoucher)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedVoucher && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Rechazar Voucher</h2>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del rechazo *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ej: El voucher está borroso, no se puede verificar el monto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
      />
      </div>
    </div>
  );
}
