/**
 * TreatmentPlanReference - Referencia del Plan de Tratamiento
 *
 * Muestra un resumen del plan de tratamiento y presupuesto
 * con datos cargados desde el backend.
 *
 * FUNCIONALIDADES:
 * - Actualizacion dinamica conforme se registren ingresos
 * - Seccion clickeable que abre modal de historial de ingresos
 * - Resumen de totales (total plan, pagado, pendiente)
 * - Desglose por categoria (procedimientos, tratamientos, servicios)
 *
 * Incluye:
 * - Nombre del plan con fecha
 * - Presupuesto total consolidado
 * - Desglose de totales por categoria
 * - Tratamientos aplicados
 * - Servicios adicionales (Ortodoncia, Implantes, Protesis)
 * - Procedimientos del diagnostico definitivo
 */

import { motion } from 'framer-motion';
import {
  FileText,
  DollarSign,
  Package,
  Layers,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  History,
  ExternalLink,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ConsultationTreatmentItem,
  ConsultationAdditionalService,
  DefinitiveDiagnosisConditionData
} from '@/services/api/consultationsApi';
import { procedureIncomeApi, type ProcedureIncomeData } from '@/services/api/procedureIncomeApi';
import { IncomeHistoryModal } from './IncomeHistoryModal';
import { getEffectiveProcedurePrice } from '@/components/consultation/final-diagnosis';

interface TreatmentPlanReferenceProps {
  // Nombre del plan
  planName?: string;
  // Total consolidado
  consolidatedTotal: number;
  // Desglose de totales
  definitiveDiagnosisTotal?: number;
  treatmentsTotal?: number;
  additionalServicesTotal?: number;
  examsTotal?: number;
  // Adelanto y saldo
  advancePayment?: number;
  balance?: number;
  // Datos detallados del backend
  treatments?: ConsultationTreatmentItem[];
  additionalServices?: ConsultationAdditionalService[];
  definitiveDiagnosisConditions?: DefinitiveDiagnosisConditionData[];
  // IDs para cargar ingresos dinamicamente
  patientId?: number;
  consultationId?: number;
  // Callback para sincronizacion
  onIncomeUpdate?: () => void;
}

export const TreatmentPlanReference = ({
  planName = 'Plan de Tratamiento',
  consolidatedTotal,
  definitiveDiagnosisTotal = 0,
  treatmentsTotal = 0,
  additionalServicesTotal = 0,
  examsTotal = 0,
  advancePayment = 0,
  balance,
  treatments = [],
  additionalServices = [],
  definitiveDiagnosisConditions = [],
  patientId,
  consultationId,
  onIncomeUpdate
}: TreatmentPlanReferenceProps) => {
  // Estado para controlar secciones colapsables
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    treatments: false,
    services: false,
    procedures: false
  });

  // Estado del modal de historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Estado para ingresos dinamicos
  const [incomeData, setIncomeData] = useState<{
    items: ProcedureIncomeData[];
    totalPaid: number;
    loading: boolean;
    lastUpdate: Date | null;
  }>({
    items: [],
    totalPaid: 0,
    loading: false,
    lastUpdate: null
  });

  // Cargar ingresos registrados desde el backend
  const loadIncomeData = useCallback(async () => {
    if (!consultationId && !patientId) return;

    setIncomeData(prev => ({ ...prev, loading: true }));

    try {
      let items: ProcedureIncomeData[] = [];

      if (consultationId) {
        const response = await procedureIncomeApi.getConsultationIncomeItems(consultationId);
        items = response.data?.items || [];
      } else if (patientId) {
        items = await procedureIncomeApi.getPatientIncome(patientId);
      }

      // Calcular total pagado (excluyendo cancelados)
      const totalPaid = items
        .filter(i => i.income_status !== 'cancelled')
        .reduce((sum, i) => sum + Number(i.final_amount || i.amount || 0), 0);

      setIncomeData({
        items,
        totalPaid,
        loading: false,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      setIncomeData(prev => ({ ...prev, loading: false }));
    }
  }, [consultationId, patientId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadIncomeData();
  }, [loadIncomeData]);

  // Calcular totales dinamicos
  const dynamicTotals = useMemo(() => {
    // Usar adelanto del presupuesto + ingresos registrados
    const totalFromIncome = incomeData.totalPaid;
    const effectiveAdvance = advancePayment + totalFromIncome;
    const dynamicBalance = Math.max(0, consolidatedTotal - effectiveAdvance);

    // Contadores por tipo de ingreso
    const countByType: Record<string, number> = {};
    incomeData.items.forEach(item => {
      const type = item.income_type || 'other';
      countByType[type] = (countByType[type] || 0) + 1;
    });

    return {
      totalPaid: effectiveAdvance,
      balance: dynamicBalance,
      countByType,
      totalIncomeRecords: incomeData.items.length
    };
  }, [incomeData, advancePayment, consolidatedTotal]);

  // Calcular saldo (usar dinamico si hay datos)
  const calculatedBalance = incomeData.items.length > 0
    ? dynamicTotals.balance
    : (balance ?? (consolidatedTotal - advancePayment));

  // Efectivo adelanto (adelanto original + ingresos)
  const effectiveAdvance = incomeData.items.length > 0
    ? dynamicTotals.totalPaid
    : advancePayment;

  // Toggle de secciones
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handler para abrir modal de historial
  const handleOpenHistory = () => {
    setShowHistoryModal(true);
  };

  // Handler para refrescar datos
  const handleRefresh = () => {
    loadIncomeData();
    if (onIncomeUpdate) onIncomeUpdate();
  };

  // Verificar si hay datos
  const hasData = treatments.length > 0 || additionalServices.length > 0 || definitiveDiagnosisConditions.length > 0;

  // Formatear fecha actual
  const currentDate = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mb-6 border border-indigo-200 relative overflow-hidden"
      >
        {/* Indicador de carga */}
        {incomeData.loading && (
          <div className="absolute top-2 right-2">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Header - Clickeable para abrir historial */}
        <button
          onClick={handleOpenHistory}
          className="w-full flex items-center justify-between mb-4 group hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <h4 className="font-semibold text-indigo-900">
                {planName} - {currentDate}
              </h4>
              {incomeData.totalIncomeRecords > 0 && (
                <p className="text-xs text-indigo-600">
                  {dynamicTotals.totalIncomeRecords} registro(s) de ingreso
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-indigo-600 group-hover:text-indigo-800">
            <History className="w-4 h-4" />
            <span className="text-sm font-medium">Ver Historial</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </button>

        {/* Barra de progreso de pago */}
        {consolidatedTotal > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Progreso de pago
              </span>
              <span className="font-medium">
                {Math.min(100, Math.round((effectiveAdvance / consolidatedTotal) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (effectiveAdvance / consolidatedTotal) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Grid de Totales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Total General */}
          <div className="bg-white rounded-lg p-3 border border-indigo-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-500">Total General</span>
            </div>
            <p className="text-lg font-bold text-indigo-700">
              S/. {Number(consolidatedTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Total Pagado/Adelanto */}
          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500">
                {incomeData.items.length > 0 ? 'Total Pagado' : 'Adelanto'}
              </span>
            </div>
            <p className="text-lg font-bold text-green-600">
              S/. {Number(effectiveAdvance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            {incomeData.items.length > 0 && advancePayment > 0 && (
              <p className="text-xs text-gray-400">
                (Adelanto: S/. {advancePayment.toLocaleString('es-PE', { minimumFractionDigits: 2 })})
              </p>
            )}
          </div>

          {/* Saldo */}
          <div className="bg-white rounded-lg p-3 border border-red-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-500">Saldo Pendiente</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              S/. {Number(calculatedBalance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Examenes */}
          <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-500">Examenes</span>
            </div>
            <p className="text-lg font-bold text-purple-600">
              S/. {Number(examsTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Desglose de Subtotales */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <span className="text-xs text-blue-600 font-medium">Procedimientos</span>
            <p className="font-bold text-blue-700">
              S/. {Number(definitiveDiagnosisTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            {dynamicTotals.countByType['odontogram_procedure'] && (
              <p className="text-xs text-blue-500">
                {dynamicTotals.countByType['odontogram_procedure']} registrado(s)
              </p>
            )}
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
            <span className="text-xs text-indigo-600 font-medium">Tratamientos</span>
            <p className="font-bold text-indigo-700">
              S/. {Number(treatmentsTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            {dynamicTotals.countByType['treatment'] && (
              <p className="text-xs text-indigo-500">
                {dynamicTotals.countByType['treatment']} registrado(s)
              </p>
            )}
          </div>
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
            <span className="text-xs text-orange-600 font-medium">Servicios Adicionales</span>
            <p className="font-bold text-orange-700">
              S/. {Number(additionalServicesTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            {(() => {
              // Contar todos los tipos de pagos de servicios adicionales
              const servicePaymentCount =
                (dynamicTotals.countByType['additional_service'] || 0) +
                (dynamicTotals.countByType['monthly_quota'] || 0) +
                (dynamicTotals.countByType['initial_payment'] || 0) +
                (dynamicTotals.countByType['orthodontic_initial'] || 0) +
                (dynamicTotals.countByType['orthodontic_quota'] || 0) +
                (dynamicTotals.countByType['implant_initial'] || 0) +
                (dynamicTotals.countByType['implant_quota'] || 0) +
                (dynamicTotals.countByType['prosthesis_initial'] || 0) +
                (dynamicTotals.countByType['prosthesis_quota'] || 0);
              return servicePaymentCount > 0 && (
                <p className="text-xs text-orange-500">
                  {servicePaymentCount} pago(s) registrado(s)
                </p>
              );
            })()}
          </div>
        </div>

        {/* Mensaje si no hay datos detallados */}
        {!hasData && (
          <div className="text-center py-3 text-gray-500 text-sm">
            <p>No hay detalles disponibles del plan de tratamiento</p>
          </div>
        )}

        {/* Secciones Colapsables con Detalles */}
        {hasData && (
          <div className="space-y-2">
            {/* Procedimientos del Diagnostico Definitivo */}
            {definitiveDiagnosisConditions.length > 0 && (
              <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('procedures')}
                  className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900 text-sm">
                      Procedimientos ({definitiveDiagnosisConditions.length})
                    </span>
                  </div>
                  {expandedSections.procedures ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>
                {expandedSections.procedures && (
                  <div className="border-t border-blue-100 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {definitiveDiagnosisConditions.map((condition, index) => {
                      const price = getEffectiveProcedurePrice(condition);
                      const conditionName = condition.condition_label || condition.condition_name || 'Procedimiento';
                      const toothNumber = condition.tooth_number || '-';
                      const surfaces = condition.surfaces_array || [];
                      const procedures = condition.procedures || [];
                      const mainProcedure = procedures.length > 0 ? procedures[0].procedure_name : conditionName;

                      // Verificar si ya fue registrado como ingreso
                      const isRegistered = incomeData.items.some(
                        i => i.definitive_condition_id === condition.definitive_condition_id ||
                             (i.tooth_number === toothNumber && i.item_name === mainProcedure)
                      );

                      return (
                        <div
                          key={condition.definitive_condition_id || index}
                          className={`px-3 py-2 hover:bg-blue-50/50 flex items-center justify-between gap-2 ${isRegistered ? 'bg-green-50/50' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 text-sm truncate">{mainProcedure}</p>
                              {isRegistered && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                  Registrado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs flex-wrap">
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                Diente {toothNumber}
                              </span>
                              {surfaces.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                                  {surfaces.join('-')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`font-bold text-sm whitespace-nowrap ${isRegistered ? 'text-green-600' : 'text-blue-600'}`}>
                            S/. {price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tratamientos Aplicados */}
            {treatments.length > 0 && (
              <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('treatments')}
                  className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-indigo-900 text-sm">
                      Tratamientos Aplicados ({treatments.length})
                    </span>
                  </div>
                  {expandedSections.treatments ? (
                    <ChevronUp className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
                {expandedSections.treatments && (
                  <div className="border-t border-indigo-100 max-h-64 overflow-y-auto">
                    {treatments.map((treatment, tIndex) => (
                      <div key={treatment.consultation_treatment_item_id || tIndex} className="border-b border-gray-100 last:border-b-0">
                        {/* Header del tratamiento */}
                        <div className="bg-indigo-50/70 px-3 py-2 flex justify-between items-center">
                          <p className="font-semibold text-indigo-800 text-sm">{treatment.treatment_name}</p>
                          <span className="font-bold text-indigo-600 text-sm">
                            S/. {Number(treatment.total_amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {/* Condiciones del tratamiento */}
                        {treatment.conditions && treatment.conditions.length > 0 && (
                          <div className="divide-y divide-gray-50">
                            {treatment.conditions.map((cond, cIndex) => (
                              <div
                                key={cond.condition_id || cIndex}
                                className="px-3 py-1.5 pl-6 flex justify-between items-center text-xs hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">-</span>
                                  <span className="text-gray-700">{cond.label}</span>
                                  <span className="text-gray-400">x{cond.quantity || 1}</span>
                                </div>
                                <span className="text-gray-600">
                                  S/. {Number(cond.subtotal || (cond.price || 0) * (cond.quantity || 1)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Servicios Adicionales */}
            {additionalServices.length > 0 && (
              <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                <button
                  onClick={() => toggleSection('services')}
                  className="w-full flex items-center justify-between p-3 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-900 text-sm">
                      Servicios Adicionales ({additionalServices.length})
                    </span>
                  </div>
                  {expandedSections.services ? (
                    <ChevronUp className="w-4 h-4 text-orange-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-orange-600" />
                  )}
                </button>
                {expandedSections.services && (
                  <div className="border-t border-orange-100 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {additionalServices.map((service, index) => {
                      const montoTotal = Number(service.edited_monto_total || service.original_monto_total || service.editedFields?.montoTotal || service.originalFields?.montoTotal || 0);
                      const serviceType = service.type || service.service_type || 'other';
                      const serviceName = service.name || service.service_name || 'Servicio';

                      // Verificar pagos registrados (inicial + cuotas mensuales)
                      const servicePaymentTypes = [
                        'monthly_quota', 'initial_payment', 'additional_service',
                        'orthodontic_initial', 'orthodontic_quota',
                        'implant_initial', 'implant_quota',
                        'prosthesis_initial', 'prosthesis_quota'
                      ];
                      const paidQuotas = incomeData.items.filter(
                        i => i.parent_additional_service_id === service.consultation_additional_service_id ||
                             (servicePaymentTypes.includes(i.income_type || '') && i.item_name?.includes(serviceName))
                      );

                      // Icono segun tipo
                      const getServiceIcon = () => {
                        switch (serviceType) {
                          case 'orthodontic':
                            return { emoji: 'tooth', label: 'Ortodoncia' };
                          case 'implant':
                            return { emoji: 'medical', label: 'Implante' };
                          case 'prosthesis':
                            return { emoji: 'tool', label: 'Protesis' };
                          default:
                            return { emoji: 'package', label: 'Servicio' };
                        }
                      };

                      const serviceInfo = getServiceIcon();

                      return (
                        <div key={service.consultation_additional_service_id || index} className="px-3 py-2 hover:bg-orange-50/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{serviceName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                  {serviceInfo.label}
                                </span>
                                {paidQuotas.length > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                    {paidQuotas.length} pago(s) registrado(s)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-orange-600 text-sm whitespace-nowrap">
                            S/. {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Indicador de ultima actualizacion */}
        {incomeData.lastUpdate && (
          <div className="mt-3 text-xs text-gray-400 text-right">
            Actualizado: {incomeData.lastUpdate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </motion.div>

      {/* Modal de Historial de Ingresos */}
      <IncomeHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        patientId={patientId}
        consultationId={consultationId}
        planName={planName}
        totalPlan={consolidatedTotal}
        onRefresh={handleRefresh}
      />
    </>
  );
};
