/**
 * IncomeHistoryModal - Modal de Historial de Ingresos
 *
 * Muestra el historial completo de ingresos registrados para un paciente/consulta.
 * Se activa al hacer clic en la seccion "Plan de Tratamiento".
 *
 * Incluye:
 * - Lista de todos los ingresos registrados
 * - Filtros por tipo, fecha, estado
 * - Totales acumulados (total plan, pagado, pendiente)
 * - Informacion del dentista que realizo cada procedimiento
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  User,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  Stethoscope,
  Package,
  Layers,
  FileText,
  RefreshCw
} from 'lucide-react';
import { procedureIncomeApi, type ProcedureIncomeData } from '@/services/api/procedureIncomeApi';

interface IncomeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: number;
  consultationId?: number;
  planName?: string;
  totalPlan?: number;
  onRefresh?: () => void;
}

// Tipos de ingreso con sus labels e iconos
const INCOME_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  odontogram_procedure: { label: 'Procedimiento', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Stethoscope },
  treatment: { label: 'Tratamiento', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Package },
  additional_service: { label: 'Servicio', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Layers },
  monthly_quota: { label: 'Cuota Mensual', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Calendar },
  initial_payment: { label: 'Pago Inicial', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: DollarSign },
  diagnostic_exam: { label: 'Examen', color: 'text-teal-700', bgColor: 'bg-teal-100', icon: FileText },
  advance_payment: { label: 'Adelanto', color: 'text-green-700', bgColor: 'bg-green-100', icon: DollarSign },
  orthodontic_initial: { label: 'Inicial Ortodoncia', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: DollarSign },
  orthodontic_quota: { label: 'Cuota Ortodoncia', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: Calendar },
  implant_initial: { label: 'Inicial Implante', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: DollarSign },
  implant_quota: { label: 'Cuota Implante', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: Calendar },
  prosthesis_initial: { label: 'Inicial Prótesis', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: DollarSign },
  prosthesis_quota: { label: 'Cuota Prótesis', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: Calendar }
};

// Estados de ingreso con sus configuraciones
const INCOME_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmado', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  paid: { label: 'Pagado', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: DollarSign },
  cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle }
};

export const IncomeHistoryModal = ({
  isOpen,
  onClose,
  patientId,
  consultationId,
  planName = 'Plan de Tratamiento',
  totalPlan = 0,
  onRefresh
}: IncomeHistoryModalProps) => {
  // Estado de datos
  const [incomes, setIncomes] = useState<ProcedureIncomeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Cargar datos de ingresos
  const loadIncomes = useCallback(async () => {
    if (!patientId && !consultationId) return;

    setLoading(true);
    setError(null);

    try {
      let data: ProcedureIncomeData[] = [];

      if (consultationId) {
        // Cargar por consulta (mas especifico)
        const response = await procedureIncomeApi.getConsultationIncomeItems(consultationId);
        data = response.data?.items || [];
      } else if (patientId) {
        // Cargar por paciente (historial completo)
        data = await procedureIncomeApi.getPatientIncome(patientId);
      }

      setIncomes(data);
    } catch (err) {
      console.error('Error al cargar historial de ingresos:', err);
      setError('No se pudo cargar el historial de ingresos');
    } finally {
      setLoading(false);
    }
  }, [patientId, consultationId]);

  // Cargar al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadIncomes();
    }
  }, [isOpen, loadIncomes]);

  // Filtrar ingresos
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      // Filtro por tipo
      if (filterType !== 'all' && income.income_type !== filterType) return false;

      // Filtro por estado
      if (filterStatus !== 'all' && income.income_status !== filterStatus) return false;

      // Filtro por fecha desde
      if (dateFrom && income.performed_date) {
        const incomeDate = new Date(income.performed_date);
        const fromDate = new Date(dateFrom);
        if (incomeDate < fromDate) return false;
      }

      // Filtro por fecha hasta
      if (dateTo && income.performed_date) {
        const incomeDate = new Date(income.performed_date);
        const toDate = new Date(dateTo);
        if (incomeDate > toDate) return false;
      }

      return true;
    });
  }, [incomes, filterType, filterStatus, dateFrom, dateTo]);

  // Calcular totales
  const totals = useMemo(() => {
    const totalPaid = filteredIncomes
      .filter(i => i.income_status !== 'cancelled')
      .reduce((sum, i) => sum + Number(i.final_amount || i.amount || 0), 0);

    const totalPending = totalPlan - totalPaid;

    const byType: Record<string, number> = {};
    filteredIncomes.forEach(income => {
      const type = income.income_type || 'other';
      byType[type] = (byType[type] || 0) + Number(income.final_amount || income.amount || 0);
    });

    return {
      totalPaid,
      totalPending: Math.max(0, totalPending),
      totalCount: filteredIncomes.length,
      byType
    };
  }, [filteredIncomes, totalPlan]);

  // Formatear fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setDateFrom('');
    setDateTo('');
  };

  // Handler para refrescar
  const handleRefresh = () => {
    loadIncomes();
    if (onRefresh) onRefresh();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Historial de Ingresos</h2>
                  <p className="text-white/80 text-sm">{planName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Totales en el header */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white/70 text-xs font-medium">Total Plan</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totalPlan)}</p>
              </div>
              <div className="bg-green-500/30 rounded-lg p-3">
                <p className="text-white/70 text-xs font-medium">Total Pagado</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totals.totalPaid)}</p>
              </div>
              <div className="bg-red-500/30 rounded-lg p-3">
                <p className="text-white/70 text-xs font-medium">Saldo Pendiente</p>
                <p className="text-white text-lg font-bold">{formatCurrency(totals.totalPending)}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros</span>
              {(filterType !== 'all' || filterStatus !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Filtro por tipo */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos los tipos</option>
                {Object.entries(INCOME_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              {/* Filtro por estado */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos los estados</option>
                {Object.entries(INCOME_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              {/* Fecha desde */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Desde"
              />

              {/* Fecha hasta */}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* Contenido - Lista de ingresos */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={loadIncomes}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredIncomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No hay ingresos registrados</p>
                <p className="text-gray-400 text-sm mt-1">
                  Los ingresos apareceran aqui cuando se registren procedimientos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contador de resultados */}
                <div className="text-sm text-gray-500 mb-3">
                  Mostrando {filteredIncomes.length} de {incomes.length} registros
                </div>

                {/* Lista de ingresos */}
                {filteredIncomes.map((income, index) => {
                  const typeConfig = INCOME_TYPE_CONFIG[income.income_type || ''] || {
                    label: 'Otro',
                    color: 'text-gray-700',
                    bgColor: 'bg-gray-100',
                    icon: Package
                  };
                  const statusConfig = INCOME_STATUS_CONFIG[income.income_status || 'pending'] || INCOME_STATUS_CONFIG.pending;
                  const TypeIcon = typeConfig.icon;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={income.income_id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Info principal */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {income.item_name || 'Sin nombre'}
                            </p>
                            {income.item_description && (
                              <p className="text-sm text-gray-500 truncate mt-0.5">
                                {income.item_description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {/* Tipo */}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                              {/* Estado */}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${statusConfig.bgColor} ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>
                              {/* Diente si aplica */}
                              {income.tooth_number && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Diente {income.tooth_number}
                                </span>
                              )}
                              {/* Cuota si aplica */}
                              {income.quota_number && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                  Cuota #{income.quota_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Monto y fecha */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-indigo-600">
                            {formatCurrency(income.final_amount || income.amount || 0)}
                          </p>
                          {income.discount_amount && income.discount_amount > 0 && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatCurrency(income.amount || 0)}
                            </p>
                          )}
                          <div className="flex items-center gap-1 justify-end mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(income.performed_date)}
                          </div>
                        </div>
                      </div>

                      {/* Info adicional */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>
                            {income.dentist_name || 'Dentista no especificado'}
                            {income.dentist_cop && ` - COP: ${income.dentist_cop}`}
                          </span>
                        </div>
                        {income.clinical_notes && (
                          <span className="truncate max-w-[200px]" title={income.clinical_notes}>
                            Nota: {income.clinical_notes}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer con resumen por tipo */}
          {!loading && !error && filteredIncomes.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Resumen por tipo:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(totals.byType).map(([type, amount]) => {
                  const config = INCOME_TYPE_CONFIG[type] || { label: type, color: 'text-gray-700', bgColor: 'bg-gray-100' };
                  return (
                    <div key={type} className={`px-3 py-1.5 rounded-lg ${config.bgColor} ${config.color} text-xs font-medium`}>
                      {config.label}: {formatCurrency(amount)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
