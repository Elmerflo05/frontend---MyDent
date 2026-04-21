import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTimestampToLima } from '@/utils/dateUtils';
import {
  CreditCard,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Upload,
  FileText,
  Calendar,
  User,
  Stethoscope,
  Receipt,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { incomePaymentsApi, type PendingDebt, type PatientBalance } from '@/services/api/incomePaymentsApi';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import UploadVoucherModal from '@/components/patient/UploadVoucherModal';
import AdditionalServicesAccountStatement from '@/components/additionalServices/AdditionalServicesAccountStatement';

const PatientBilling = () => {
  const { user } = useAuthStore();
  const [debts, setDebts] = useState<PendingDebt[]>([]);
  const [balance, setBalance] = useState<PatientBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'paid' | 'all'>('all');
  const [selectedDebts, setSelectedDebts] = useState<number[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBilling();
  }, [user?.patient_id]);

  const loadBilling = async () => {
    try {
      setIsLoading(true);

      // Obtener patient_id del usuario autenticado
      const patientId = user?.patient_id;

      if (!patientId) {
        console.log('No patient_id found in user:', user);
        setIsLoading(false);
        return;
      }

      // Cargar TODAS las deudas (pendientes + pagadas) y balance del paciente
      const [debtsResponse, balanceResponse] = await Promise.all([
        incomePaymentsApi.getPatientPendingDebts(patientId, { include_all: true }),
        incomePaymentsApi.getPatientBalance(patientId)
      ]);

      console.log('✅ Datos de facturación cargados:', {
        debts: debtsResponse.debts?.length || 0,
        totalBalance: debtsResponse.total_balance,
        balance: balanceResponse
      });

      setDebts(debtsResponse.debts || []);
      setBalance(balanceResponse);

    } catch (error) {
      console.error('Error al cargar facturación:', error);
      toast.error('Error al cargar datos de facturación');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
      case 'courtesy':
        return {
          label: status === 'courtesy' ? 'Cortesía' : 'Pagado',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        };
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        };
      case 'partial':
        return {
          label: 'Parcial',
          color: 'bg-orange-100 text-orange-800',
          icon: AlertCircle
        };
      case 'pending_verification':
        return {
          label: 'Por Verificar',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle
        };
    }
  };

  // Filtrar deudas según la pestaña seleccionada
  const filteredDebts = debts.filter(debt => {
    if (selectedTab === 'pending') {
      return ['pending', 'partial', 'pending_verification'].includes(debt.payment_status);
    } else if (selectedTab === 'paid') {
      return ['paid', 'courtesy'].includes(debt.payment_status);
    }
    return true; // 'all'
  });

  // Agrupar deudas por batch_id para mostrar lotes
  const groupedDebts = filteredDebts.reduce((acc, debt) => {
    if (debt.batch_id) {
      if (!acc[debt.batch_id]) {
        acc[debt.batch_id] = [];
      }
      acc[debt.batch_id].push(debt);
    } else {
      // Sin batch_id, crear un grupo individual
      acc[`single-${debt.income_id}`] = [debt];
    }
    return acc;
  }, {} as Record<string, PendingDebt[]>);

  // Deudas que pueden seleccionarse para subir voucher (solo pendientes o parciales)
  const selectableDebts = filteredDebts.filter(debt =>
    ['pending', 'partial'].includes(debt.payment_status)
  );

  // Toggle selección de una deuda
  const toggleDebtSelection = (incomeId: number) => {
    const debt = debts.find(d => d.income_id === incomeId);

    // Si tiene batch_id, seleccionar/deseleccionar todos del mismo lote
    if (debt?.batch_id) {
      const batchDebts = debts.filter(d => d.batch_id === debt.batch_id && ['pending', 'partial'].includes(d.payment_status));
      const batchIds = batchDebts.map(d => d.income_id);
      const allSelected = batchIds.every(id => selectedDebts.includes(id));

      setSelectedDebts(prev =>
        allSelected
          ? prev.filter(id => !batchIds.includes(id))
          : [...new Set([...prev, ...batchIds])]
      );
    } else {
      // Sin batch_id, seleccionar solo este item
      setSelectedDebts(prev =>
        prev.includes(incomeId)
          ? prev.filter(id => id !== incomeId)
          : [...prev, incomeId]
      );
    }
  };

  // Seleccionar/deseleccionar todas las deudas seleccionables
  const toggleSelectAll = () => {
    if (selectedDebts.length === selectableDebts.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(selectableDebts.map(d => d.income_id));
    }
  };

  // Obtener las deudas seleccionadas como objetos completos
  const getSelectedDebtObjects = (): PendingDebt[] => {
    return debts.filter(debt => selectedDebts.includes(debt.income_id));
  };

  // Manejar éxito del voucher
  const handleVoucherSuccess = () => {
    setSelectedDebts([]);
    loadBilling();
  };

  // Toggle expandir/colapsar batch
  const toggleBatchExpansion = (batchId: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Facturación</h1>
              <p className="text-gray-600">Consulta y gestiona tus pagos y servicios</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Servicios</p>
                  <p className="text-2xl font-bold text-orange-900">{balance?.total_items || 0}</p>
                </div>
                <Receipt className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Por Pagar</p>
                  <p className="text-2xl font-bold text-red-900">
                    S/ {(balance?.total_balance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Pagado</p>
                  <p className="text-2xl font-bold text-green-900">
                    S/ {(balance?.total_paid || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Cargado</p>
                  <p className="text-2xl font-bold text-blue-900">
                    S/ {(balance?.total_charged || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Alerta de deuda pendiente */}
          {(balance?.total_balance || 0) > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Tienes pagos pendientes</p>
                  <p className="text-sm text-amber-700">
                    Recuerda realizar tus pagos para continuar con tu tratamiento sin interrupciones.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estado de cuenta — servicios adicionales (ortodoncia / implantes / prótesis) */}
        {user?.patient_id && (
          <div className="mt-4">
            <AdditionalServicesAccountStatement
              patientId={Number(user.patient_id)}
              emptyMessage="No tienes tratamientos extendidos (ortodoncia, implantes o prótesis) registrados todavía."
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 max-w-md">
            <button
              onClick={() => setSelectedTab('all')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'all'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({debts.length})
            </button>
            <button
              onClick={() => setSelectedTab('pending')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'pending'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pendientes ({balance?.pending_count || 0})
            </button>
            <button
              onClick={() => setSelectedTab('paid')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === 'paid'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pagados ({balance?.paid_count || 0})
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Historial de Servicios</h2>
            {selectedDebts.length > 0 && (
              <button
                onClick={() => setShowVoucherModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir Voucher ({selectedDebts.length})
              </button>
            )}
          </div>

          {/* Lista de servicios/pagos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Checkbox column */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    {selectableDebts.length > 0 && (
                      <input
                        type="checkbox"
                        checked={selectedDebts.length === selectableDebts.length && selectableDebts.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(groupedDebts).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay registros para mostrar</p>
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedDebts).map(([batchKey, batchDebts]) => {
                    const isBatch = batchDebts.length > 1;
                    const firstDebt = batchDebts[0];
                    const isExpanded = expandedBatches.has(batchKey);
                    const batchTotal = batchDebts.reduce((sum, d) => sum + parseFloat(String(d.final_amount)), 0);
                    const batchPaid = batchDebts.reduce((sum, d) => sum + parseFloat(String(d.amount_paid)), 0);
                    const batchBalance = batchDebts.reduce((sum, d) => sum + parseFloat(String(d.balance)), 0);
                    const allBatchDebtsSelected = batchDebts.every(d => selectedDebts.includes(d.income_id));
                    const canSelectBatch = batchDebts.every(d => ['pending', 'partial'].includes(d.payment_status));

                    return (
                      <React.Fragment key={batchKey}>
                        {/* Fila de lote (o item individual) */}
                        <tr
                          className={`${allBatchDebtsSelected ? 'bg-orange-50' : 'hover:bg-gray-50'} ${isBatch ? 'border-l-4 border-l-orange-400' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {canSelectBatch ? (
                              <input
                                type="checkbox"
                                checked={allBatchDebtsSelected}
                                onChange={() => {
                                  if (isBatch && firstDebt.batch_id) {
                                    toggleDebtSelection(firstDebt.income_id);
                                  } else {
                                    toggleDebtSelection(firstDebt.income_id);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                              />
                            ) : firstDebt.payment_status === 'pending_verification' ? (
                              <span title="Voucher pendiente de verificación">
                                <Clock className="w-4 h-4 text-blue-500" />
                              </span>
                            ) : (
                              <span title="Pagado">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </span>
                            )}
                          </td>

                          {/* Expand/Collapse + Fecha */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isBatch && (
                                <button
                                  onClick={() => toggleBatchExpansion(batchKey)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatTimestampToLima(firstDebt.performed_date, 'date')}
                                  </div>
                                  {firstDebt.due_date && (
                                    <div className="text-xs text-gray-500">
                                      Vence: {formatTimestampToLima(firstDebt.due_date, 'date')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Servicio */}
                          <td className="px-6 py-4">
                            {isBatch ? (
                              <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-orange-600" />
                                <div>
                                  <div className="text-sm font-bold text-orange-900">
                                    Lote: {batchDebts.length} tratamientos
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {isExpanded ? 'Ver detalle abajo' : 'Click para expandir'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {firstDebt.item_name}
                                </div>
                                {firstDebt.item_description && (
                                  <div className="text-sm text-gray-500 max-w-xs truncate">
                                    {firstDebt.item_description}
                                  </div>
                                )}
                                {firstDebt.tooth_number && (
                                  <div className="text-xs text-gray-400">
                                    Pieza: {firstDebt.tooth_number} {firstDebt.tooth_name && `- ${firstDebt.tooth_name}`}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Doctor */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-gray-400" />
                              <div className="text-sm text-gray-900">{firstDebt.dentist_name}</div>
                            </div>
                            <div className="text-xs text-gray-500">{firstDebt.branch_name}</div>
                          </td>

                          {/* Monto */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              S/ {batchTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </div>
                          </td>

                          {/* Pagado */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              S/ {batchPaid.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </div>
                            {batchBalance > 0 && (
                              <div className="text-xs text-red-500">
                                Debe: S/ {batchBalance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const statusConfig = getStatusConfig(firstDebt.payment_status);
                              const StatusIcon = statusConfig.icon;
                              return (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </span>
                              );
                            })()}
                            {firstDebt.is_overdue && (
                              <div className="text-xs text-red-600 mt-1 font-medium">
                                ⚠️ Vencido
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Filas expandidas (detalle del lote) */}
                        {isBatch && isExpanded && batchDebts.map((debt) => {
                    const statusConfig = getStatusConfig(debt.payment_status);
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedDebts.includes(debt.income_id);

                    return (
                      <tr
                        key={`detail-${debt.income_id}`}
                        className="bg-orange-50 border-l-4 border-l-orange-200"
                      >
                        {/* Empty cell for checkbox */}
                        <td className="px-4 py-3 whitespace-nowrap"></td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-500 pl-8">
                            {formatTimestampToLima(debt.performed_date, 'date')}
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <div className="pl-8">
                            <div className="text-sm font-medium text-gray-900">
                              {debt.item_name}
                            </div>
                            {debt.item_description && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {debt.item_description}
                              </div>
                            )}
                            {debt.tooth_number && (
                              <div className="text-xs text-gray-400">
                                Pieza: {debt.tooth_number} {debt.tooth_name && `- ${debt.tooth_name}`}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-600">{debt.dentist_name}</div>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            S/ {parseFloat(String(debt.final_amount)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            S/ {parseFloat(String(debt.amount_paid)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </div>
                          {parseFloat(String(debt.balance)) > 0 && (
                            <div className="text-xs text-red-500">
                              Debe: S/ {parseFloat(String(debt.balance)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </span>
                        </td>
                        </tr>
                      );
                    })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago Disponibles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Tarjeta</div>
              <div className="text-xs text-gray-500">Visa, MasterCard</div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg text-center hover:border-green-300 hover:bg-green-50 transition-colors">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Efectivo</div>
              <div className="text-xs text-gray-500">En recepción</div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg text-center hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Transferencia</div>
              <div className="text-xs text-gray-500">Bancaria</div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg text-center hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Yape/Plin</div>
              <div className="text-xs text-gray-500">Subir voucher</div>
            </div>
          </div>
        </div>

        {/* Contact for Payment */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">¿Necesitas ayuda con tus pagos?</h3>
              <p className="text-sm text-orange-700">
                Contacta a nuestro equipo de facturación para resolver cualquier duda sobre tus pagos
              </p>
              <p className="text-sm text-orange-700 mt-1">
                📞 (01) 234-5678 ext. 102 | 📧 pagos@mydent.pe
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de subir voucher */}
      <UploadVoucherModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        selectedDebts={getSelectedDebtObjects()}
        onSuccess={handleVoucherSuccess}
      />
    </div>
  );
};

export default PatientBilling;
