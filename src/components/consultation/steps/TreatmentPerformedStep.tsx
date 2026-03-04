/**
 * Step 10: Tratamiento Realizado
 *
 * Componente para registrar los procedimientos realizados durante la consulta.
 *
 * FLUJO DE TRABAJO:
 * 1. Usuario ve el Odontograma de Evolucion (SOLO LECTURA) con condiciones en rojo (pendientes)
 * 2. Usuario ve el Checklist de Tratamientos con los procedimientos del plan
 * 3. Usuario marca checkbox de un tratamiento completado
 * 4. Automaticamente:
 *    - La condicion cambia de ROJO a AZUL en el odontograma
 *    - Al guardar, se registra en procedure_history, procedure_income y evolution_odontogram
 * 5. El usuario NO puede hacer clic en el odontograma para marcar condiciones
 *
 * INTEGRACION CON APIs REALES:
 * - consultationsApi: Plan de tratamiento y diagnostico definitivo
 * - consultationBudgetsApi: Presupuesto consolidado
 * - procedure_history: Historial de procedimientos clinicos
 * - procedure_income: Ingresos por procedimientos (comisiones)
 * - evolution_odontogram: Estado visual del odontograma de evolucion
 */

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Activity, ChevronLeft, Save, Check, FileText, Image, Loader2, AlertCircle } from 'lucide-react';
import { StepHeader } from '@/components/consultation/shared';
import type { TreatmentHistoryEntry } from '@/types';
import {
  calculateTreatmentBudget,
  saveTreatmentToHistory,
  loadLastTreatment,
  loadTreatmentHistory,
  PatientInfoCard,
  TreatmentHistorySection,
  TreatmentPlanReference,
  PrescriptionDisplay,
  TreatmentOdontogramSection,
  TreatmentChecklistSection,
  TreatmentObservationsSection,
  CompletionModal
} from '@/components/consultation/treatment-performed';
import type { TreatmentOdontogramSectionRef } from '@/components/consultation/treatment-performed/TreatmentOdontogramSection';
import type { TreatmentChecklistSectionRef } from '@/components/consultation/treatment-performed/TreatmentChecklistSection';
import { exportTreatmentAsPDF, exportOdontogramAsPDF } from '@/utils/exportTreatment';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { useAuthStore } from '@/store/authStore';
import {
  consultationsApi,
  consultationBudgetsApi,
  type ConsultationTreatmentPlanFullData,
  type DefinitiveDiagnosisConditionData,
  type ConsultationBudgetData,
  type ConsultationTreatmentItem,
  type ConsultationAdditionalService
} from '@/services/api/consultationsApi';
import { evolutionOdontogramApi, type EvolutionOdontogramData } from '@/services/api/evolutionOdontogramApi';

/**
 * Genera una clave única y estable para un procedimiento del diagnóstico definitivo.
 * PRIORIDAD 1: Usar definitive_condition_id si existe (ID de BD - más estable)
 * PRIORIDAD 2: Usar combinación tooth_position_id + dental_condition_id (estable ante reordenamientos)
 * FALLBACK: Usar índice solo si no hay otra opción (legacy)
 *
 * NOTA: Esta función debe ser idéntica a la de TreatmentChecklistSection.tsx
 */
const generateUniqueKey = (cond: DefinitiveDiagnosisConditionData, index: number): string => {
  // Prioridad 1: Usar definitive_condition_id si existe (viene de BD)
  if (cond.definitive_condition_id && typeof cond.definitive_condition_id === 'number') {
    return `procedure-id-${cond.definitive_condition_id}`;
  }

  // Prioridad 2: Usar combinación tooth_position_id + dental_condition_id (estable)
  const toothId = cond.tooth_position_id || cond.tooth_number || 'unknown';
  const conditionId = cond.dental_condition_id || cond.condition_code || 'unknown';
  if (toothId !== 'unknown' && conditionId !== 'unknown') {
    return `procedure-tooth-${toothId}-cond-${conditionId}`;
  }

  // Fallback: Usar índice (solo para datos legacy sin IDs)
  return `procedure-${index}`;
};

/**
 * Normaliza el numero de diente al formato FDI con punto (ej: "11" -> "1.1", "21" -> "2.1")
 * El frontend usa el formato "1.1", "2.1", etc.
 * El backend puede guardar "11", "21", etc.
 */
const normalizeToothNumber = (toothNumber: string): string => {
  if (!toothNumber) return toothNumber;

  // Si ya tiene punto, retornar tal cual
  if (toothNumber.includes('.')) return toothNumber;

  // Si tiene 2 caracteres (ej: "11", "21", "36"), insertar punto
  if (toothNumber.length === 2) {
    return `${toothNumber[0]}.${toothNumber[1]}`;
  }

  // Si tiene 3 caracteres (ej: "110" para deciduos?), manejar segun sea necesario
  if (toothNumber.length === 3) {
    return `${toothNumber.slice(0, 2)}.${toothNumber[2]}`;
  }

  return toothNumber;
};

interface TreatmentPerformedStepProps {
  // Datos del paciente
  selectedPatient: any;

  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Odontograma y examenes para calcular presupuesto
  getPatientOdontogram: (patientId: string) => any[];
  currentOdontogram?: any[];
  setCurrentOdontogram?: (data: any[]) => void;

  // Estado de completitud del odontograma
  isOdontogramIncomplete?: boolean;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;
  handleSaveProgress: () => Promise<void>;
  markStepCompleted: (step: number) => void;
  toast: {
    success: (message: string) => void;
  };

  // Control de acceso
  readOnly?: boolean;

  // Usuario (doctor) para comentarios
  user?: any;

  // ID de la cita (para marcar como completada)
  appointmentId?: string;

  // Navegacion
  onBack: () => void;
}

// Interfaces para datos del backend
interface BackendData {
  treatmentPlan: ConsultationTreatmentPlanFullData | null;
  definitiveDiagnosis: {
    conditions: DefinitiveDiagnosisConditionData[];
    summary: {
      total_conditions: number;
      total_price: number;
      modified_count?: number;
    };
  } | null;
  budget: ConsultationBudgetData | null;
  evolutionData: EvolutionOdontogramData[]; // Datos guardados de evolucion del odontograma
  loading: boolean;
  error: string | null;
}

/**
 * Componente del Step 10: Tratamiento Realizado
 */
const TreatmentPerformedStepComponent = ({
  selectedPatient,
  currentRecord,
  setCurrentRecord,
  getPatientOdontogram,
  currentOdontogram,
  setCurrentOdontogram,
  isOdontogramIncomplete = false,
  setUnsavedChanges,
  handleSaveProgress,
  markStepCompleted,
  toast,
  readOnly = false,
  user,
  appointmentId,
  onBack
}: TreatmentPerformedStepProps) => {
  // Handler para actualizar tratamiento realizado
  // El debounce ahora está interno en TreatmentObservationsSection para escritura fluida
  const handleTreatmentPerformedChange = useCallback((value: string) => {
    setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, treatmentPerformed: value }));
    setUnsavedChanges(true);
  }, [setCurrentRecord, setUnsavedChanges]);

  // Obtener usuario autenticado del store
  const authUser = useAuthStore((state) => state.user);

  // Estado del modal de confirmacion
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Estado para el checklist de tratamientos completados
  // IMPORTANTE: Usar currentRecord.completedTreatments para que persista entre navegaciones de pasos
  const completedTreatments: Record<string, boolean> = currentRecord?.completedTreatments || {};

  // Handler para actualizar completedTreatments en currentRecord (persiste entre pasos)
  const setCompletedTreatments = useCallback((newValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setCurrentRecord((prev: any) => {
      const currentCompleted = prev?.completedTreatments || {};
      const updatedCompleted = typeof newValue === 'function'
        ? newValue(currentCompleted)
        : newValue;
      return {
        ...prev,
        completedTreatments: updatedCompleted
      };
    });
  }, [setCurrentRecord]);

  // Estado para el odontograma del tratamiento
  const [treatmentOdontogramData, setTreatmentOdontogramData] = useState<any[]>([]);

  // Estado para el historial de tratamientos
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentHistoryEntry[]>([]);

  // Refs para los componentes hijos (para guardar unificado)
  const odontogramRef = useRef<TreatmentOdontogramSectionRef>(null);
  const checklistRef = useRef<TreatmentChecklistSectionRef>(null);

  // Estado para el guardado unificado
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Estado para forzar recarga de TreatmentPlanReference cuando se crean ingresos
  const [incomeRefreshKey, setIncomeRefreshKey] = useState(0);

  // =====================================================
  // ESTADO PARA DATOS DEL BACKEND
  // =====================================================
  const [backendData, setBackendData] = useState<BackendData>({
    treatmentPlan: null,
    definitiveDiagnosis: null,
    budget: null,
    evolutionData: [],
    loading: true,
    error: null
  });

  // =====================================================
  // OBTENER IDs PARA INTEGRACION CON APIs REALES
  // =====================================================

  // Obtener consultationId del currentRecord o crearlo
  const consultationId = useMemo(() => {
    // Priorizar consultation_id del currentRecord
    if (currentRecord?.consultation_id) return parseInt(currentRecord.consultation_id);
    if (currentRecord?.consultationId) return parseInt(currentRecord.consultationId);
    if (currentRecord?.lastConsultationId) return parseInt(currentRecord.lastConsultationId);

    // Si no hay, intentar obtenerlo del appointmentId (la consulta esta asociada a la cita)
    // Nota: En un flujo real, la consulta deberia crearse al iniciar el flujo de consulta
    return undefined;
  }, [currentRecord?.consultation_id, currentRecord?.consultationId, currentRecord?.lastConsultationId]);

  // Obtener branchId del usuario autenticado o del currentRecord
  const branchId = useMemo(() => {
    // Priorizar del usuario autenticado
    if (authUser?.branch_id) return authUser.branch_id;

    // Luego del currentRecord
    if (currentRecord?.branch_id) return parseInt(currentRecord.branch_id);
    if (currentRecord?.branchId) return parseInt(currentRecord.branchId);

    // Luego del paciente seleccionado
    if (selectedPatient?.branch_id) return parseInt(selectedPatient.branch_id);

    // Valor por defecto (sede principal)
    return 1;
  }, [authUser?.branch_id, currentRecord?.branch_id, currentRecord?.branchId, selectedPatient?.branch_id]);

  // Obtener dentistId del usuario autenticado
  const dentistId = useMemo(() => {
    // Priorizar dentist_id del usuario autenticado (solo para doctores)
    if (authUser?.dentist_id) return authUser.dentist_id;

    // Intentar obtener del user prop
    if (user?.dentist_id) return parseInt(user.dentist_id);

    // Intentar obtener del currentRecord
    if (currentRecord?.dentist_id) return parseInt(currentRecord.dentist_id);
    if (currentRecord?.dentistId) return parseInt(currentRecord.dentistId);
    if (currentRecord?.doctorId) return parseInt(currentRecord.doctorId);

    return undefined;
  }, [authUser?.dentist_id, user?.dentist_id, currentRecord?.dentist_id, currentRecord?.dentistId, currentRecord?.doctorId]);

  // =====================================================
  // CARGAR DATOS DEL BACKEND
  // =====================================================

  useEffect(() => {
    const loadBackendData = async () => {
      const patientId = selectedPatient?.patient_id || selectedPatient?.id;

      if (!consultationId) {
        setBackendData(prev => ({
          ...prev,
          loading: false,
          error: 'No se encontro ID de consulta'
        }));
        return;
      }

      setBackendData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Cargar en paralelo: Plan de tratamiento, Diagnostico Definitivo, Presupuesto y Evolucion
        // IMPORTANTE: Usar bypassCache=true para obtener datos frescos al navegar entre pasos
        const [treatmentPlanRes, definitiveDiagnosisRes, budgetRes, evolutionRes] = await Promise.all([
          consultationsApi.getConsultationTreatmentPlan(consultationId, true).catch((err) => {
            console.warn('Error cargando plan de tratamiento:', err);
            return null;
          }),
          consultationsApi.getDefinitiveDiagnosis(consultationId, true).catch((err) => {
            console.warn('Error cargando diagnostico definitivo:', err);
            return null;
          }),
          consultationBudgetsApi.getBudget(consultationId, true).catch((err) => {
            console.warn('Error cargando presupuesto:', err);
            return null;
          }),
          // Cargar datos de evolucion del odontograma para este paciente
          patientId ? evolutionOdontogramApi.getPatientEvolution(parseInt(String(patientId))).catch((err) => {
            console.warn('Error cargando evolucion del odontograma:', err);
            return { raw: [], grouped: [] };
          }) : Promise.resolve({ raw: [], grouped: [] })
        ]);

        setBackendData({
          treatmentPlan: treatmentPlanRes?.data || null,
          definitiveDiagnosis: definitiveDiagnosisRes?.data || null,
          budget: budgetRes?.data || null,
          evolutionData: evolutionRes?.raw || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error cargando datos del backend:', error);
        setBackendData(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar datos del tratamiento'
        }));
      }
    };

    loadBackendData();
  }, [consultationId, selectedPatient?.patient_id, selectedPatient?.id]);

  // =====================================================
  // EXTRAER DATOS DEL BACKEND CON FALLBACK A DATOS LOCALES
  // IMPORTANTE: Usar useMemo para evitar recrear arrays en cada render
  // Esto previene que MonthlyPaymentTracker pierda su estado interno
  // =====================================================

  // Tratamientos del plan (paso 8) - MEMOIZADO
  // FALLBACK: Si no hay datos de BD, usar datos locales de currentRecord.appliedTreatments
  const treatments = useMemo((): ConsultationTreatmentItem[] => {
    const bdTreatments: ConsultationTreatmentItem[] = backendData.treatmentPlan?.treatments || [];
    const localTreatments = currentRecord?.appliedTreatments || [];

    // Mapear tratamientos locales al formato esperado
    const mappedLocalTreatments: ConsultationTreatmentItem[] = localTreatments.map((t: any) => ({
      consultation_treatment_item_id: t.id ? parseInt(t.id) : undefined,
      treatment_id: t.treatmentId ? parseInt(t.treatmentId) : undefined,
      treatment_name: t.treatmentName || 'Tratamiento',
      total_amount: t.totalAmount || 0,
      display_order: 0,
      conditions: (t.conditions || []).map((c: any) => ({
        condition_id: c.id ? parseInt(c.id) : undefined,
        label: c.label || '',
        price: c.price || 0,
        quantity: c.quantity || 1,
        subtotal: (c.price || 0) * (c.quantity || 1),
        display_order: 0
      }))
    }));

    return bdTreatments.length > 0 ? bdTreatments : mappedLocalTreatments;
  }, [backendData.treatmentPlan?.treatments, currentRecord?.appliedTreatments]);

  // Servicios adicionales (ortodoncia, implantes, protesis) - MEMOIZADO
  // FALLBACK: Si no hay datos de BD, usar datos locales de currentRecord.selectedAdditionalServices
  // CRÍTICO: Este useMemo evita que MonthlyPaymentTracker pierda su estado al marcar checkboxes
  const additionalServices = useMemo((): ConsultationAdditionalService[] => {
    const bdAdditionalServices: ConsultationAdditionalService[] = backendData.treatmentPlan?.additionalServices || [];
    const localAdditionalServices = currentRecord?.selectedAdditionalServices || [];

    // Mapear servicios adicionales locales al formato esperado
    const mappedLocalAdditionalServices: ConsultationAdditionalService[] = localAdditionalServices.map((s: any) => ({
      consultation_additional_service_id: undefined,
      service_type: s.type || 'other',
      service_name: s.name || 'Servicio',
      name: s.name || 'Servicio',
      type: s.type || 'other',
      modality: s.modality || null,
      description: s.description || null,
      original_monto_total: s.originalFields?.montoTotal || 0,
      original_inicial: s.originalFields?.inicial || 0,
      original_mensual: s.originalFields?.mensual || 0,
      edited_monto_total: s.editedFields?.montoTotal || s.originalFields?.montoTotal || 0,
      edited_inicial: s.editedFields?.inicial || s.originalFields?.inicial || 0,
      edited_mensual: s.editedFields?.mensual || s.originalFields?.mensual || 0,
      editedFields: s.editedFields || s.originalFields || { montoTotal: 0, inicial: 0, mensual: 0 },
      originalFields: s.originalFields || { montoTotal: 0, inicial: 0, mensual: 0 },
      display_order: 0
    }));

    return bdAdditionalServices.length > 0 ? bdAdditionalServices : mappedLocalAdditionalServices;
  }, [backendData.treatmentPlan?.additionalServices, currentRecord?.selectedAdditionalServices]);

  // Condiciones del diagnostico definitivo - MEMOIZADO
  // PRIORIDAD ACTUALIZADA: currentOdontogram (cambios locales) -> BD -> currentRecord.definitiveConditions
  const definitiveDiagnosisConditions = useMemo((): DefinitiveDiagnosisConditionData[] => {
    const bdDefinitiveDiagnosisConditions: DefinitiveDiagnosisConditionData[] =
      backendData.definitiveDiagnosis?.conditions || [];
    const localDefinitiveConditions = currentRecord?.definitiveConditions || [];

    // NUEVA PRIORIDAD 0: Si currentOdontogram tiene datos, usarlos SIEMPRE
    // Esto asegura que los cambios locales del odontograma se reflejen inmediatamente
    // sin depender de que estén guardados en BD o en currentRecord.definitiveConditions
    if (currentOdontogram && currentOdontogram.length > 0) {
      return currentOdontogram.map((cond: any, index: number) => {
        const toothNumber = cond.toothNumber || cond.tooth_number || '';
        const dentalConditionId = cond.dental_condition_id || cond.dentalConditionId ||
          (typeof cond.conditionId === 'string' ? cond.conditionId.replace('condition-', '') : cond.conditionId);

        return {
          definitive_condition_id: cond.definitive_condition_id || cond.definitiveConditionId || index,
          consultation_id: consultationId,
          tooth_position_id: cond.tooth_position_id || cond.toothPositionId,
          tooth_number: toothNumber,
          dental_condition_id: dentalConditionId,
          condition_label: cond.label || cond.conditionName || cond.condition_name || cond.condition_label || 'Condición',
          condition_name: cond.conditionName || cond.condition_name || cond.label || cond.condition_label || 'Condición',
          condition_code: cond.conditionId || cond.condition_code || `condition-${dentalConditionId || index}`,
          price: cond.price || 0,
          procedure_price: cond.procedure_price ?? null,
          selected_procedure_id: cond.selected_procedure_id || null,
          selected_procedure_name: cond.selected_procedure_name || null,
          surfaces: cond.surfaces || (cond.sectionId ? [cond.sectionId] : []),
          surfaces_array: cond.surfaces || (cond.sectionId ? [cond.sectionId] : []),
          severity: cond.severity || null,
          notes: cond.notes || null,
          status: cond.status || 'active'
        };
      });
    }

    // Mapear condiciones locales al formato esperado
    // ROBUSTO: Buscar en todas las posibles ubicaciones de cada campo
    const mappedLocalDefinitiveConditions: DefinitiveDiagnosisConditionData[] = localDefinitiveConditions.map((cond: any) => {
      // Extraer valores buscando en múltiples ubicaciones posibles
      const toothPositionId = cond.tooth_position_id || cond.toothPositionId || cond._toothPositionId;
      const toothNumber = cond.toothNumber || cond.tooth_number || '';
      const dentalConditionId = cond.dental_condition_id || cond.dentalConditionId || cond._dentalConditionId || cond.definitive?.dentalConditionId;
      const conditionLabel = cond.definitive?.conditionLabel || cond.condition_label || cond.conditionLabel || cond._conditionName || cond.conditionName || '';
      const conditionName = cond._conditionName || cond.conditionName || cond.definitive?.conditionLabel || cond.condition_name || conditionLabel;
      const conditionCode = cond.condition_code || cond.conditionCode || cond._conditionCode || cond.definitive?.conditionId || `condition-${dentalConditionId}`;
      const price = cond.definitive?.price || cond.price || 0;
      const surfaces = cond.surfaces || cond.definitive?.surfaces || [];

      return {
        definitive_condition_id: cond.definitive_condition_id || cond.definitiveConditionId || cond._definitiveConditionId || cond.id,
        consultation_id: consultationId,
        tooth_position_id: toothPositionId,
        tooth_number: toothNumber,
        dental_condition_id: dentalConditionId,
        condition_label: conditionLabel,
        condition_name: conditionName,
        condition_code: conditionCode,
        price: price,
        procedure_price: cond.procedure_price ?? null,
        selected_procedure_id: cond.selected_procedure_id || cond.selectedProcedureId || null,
        selected_procedure_name: cond.selected_procedure_name || cond._selected_procedure_name || null,
        surfaces: surfaces,
        surfaces_array: surfaces,
        severity: cond.severity || null,
        notes: cond.notes || cond.definitive?.notes || null,
        status: cond.status || 'active'
      };
    });

    // PRIORIDAD 1: Datos del backend (diagnóstico definitivo guardado en BD)
    if (bdDefinitiveDiagnosisConditions.length > 0) {
      return bdDefinitiveDiagnosisConditions;
    }

    // PRIORIDAD 2: Datos locales de definitiveConditions
    if (mappedLocalDefinitiveConditions.length > 0) {
      return mappedLocalDefinitiveConditions;
    }

    // Si llegamos aquí, no hay datos disponibles
    return [];
  }, [backendData.definitiveDiagnosis?.conditions, currentRecord?.definitiveConditions, currentOdontogram, consultationId]);

  // Calcular totales desde el budget guardado o el plan de tratamiento
  const definitiveDiagnosisTotal = backendData.budget?.definitive_diagnosis_total ||
    backendData.treatmentPlan?.definitive_diagnosis_total ||
    backendData.definitiveDiagnosis?.summary?.total_price || 0;

  const treatmentsTotal = backendData.budget?.treatments_total ||
    backendData.treatmentPlan?.treatments_total || 0;

  const additionalServicesTotal = backendData.budget?.additional_services_total ||
    backendData.treatmentPlan?.additional_services_total || 0;

  const examsTotal = backendData.budget?.exams_total || 0;

  // Total consolidado
  const consolidatedTotal = backendData.budget?.grand_total ||
    backendData.treatmentPlan?.grand_total ||
    (definitiveDiagnosisTotal + treatmentsTotal + additionalServicesTotal + examsTotal);

  // Adelanto y saldo
  const advancePayment = backendData.budget?.advance_payment || 0;
  const balance = backendData.budget?.balance || (consolidatedTotal - advancePayment);

  // Nombre del plan
  const planName = backendData.treatmentPlan?.plan_name || 'Plan de Tratamiento';

  // =====================================================
  // CARGAR DATOS INICIALES (ODONTOGRAMA E HISTORIAL)
  // =====================================================

  // Mapeo de superficies del backend al formato del odontograma
  const mapSurfaceToSectionId = (surface: string): string => {
    const surfaceMap: Record<string, string> = {
      // Códigos cortos del backend
      'C': 'corona',
      'O': 'oclusal',
      'M': 'mesial',
      'D': 'distal',
      'V': 'vestibular',
      'L': 'lingual',
      'P': 'lingual', // Palatino = Lingual
      // Códigos en minúsculas
      'c': 'corona',
      'o': 'oclusal',
      'm': 'mesial',
      'd': 'distal',
      'v': 'vestibular',
      'l': 'lingual',
      'p': 'lingual',
      // Nombres completos (por si acaso)
      'corona': 'corona',
      'oclusal': 'oclusal',
      'mesial': 'mesial',
      'distal': 'distal',
      'vestibular': 'vestibular',
      'lingual': 'lingual',
      'palatino': 'lingual'
    };
    return surfaceMap[surface] || surface.toLowerCase();
  };

  // Convertir condiciones del diagnóstico definitivo al formato del odontograma
  // IMPORTANTE: El odontograma de evolución debe cargar desde definitive_diagnosis_conditions
  // y usar los estados guardados de evolution_odontogram para persistir el progreso
  useEffect(() => {
    // PRIORIDAD 1: Cargar desde diagnóstico definitivo (tabla definitive_diagnosis_conditions)
    if (definitiveDiagnosisConditions && definitiveDiagnosisConditions.length > 0) {
      // Obtener datos de evolucion guardados
      const evolutionData = backendData.evolutionData || [];

      // Funcion para verificar si una condicion fue completada en la evolucion
      const isConditionCompleted = (
        toothPositionId: number | undefined,
        definitiveConditionId: number | undefined,
        dentalConditionId: number | undefined,
        toothNumber: string
      ): boolean => {
        if (!evolutionData || evolutionData.length === 0) return false;

        // Buscar en los datos de evolucion
        return evolutionData.some((evo: EvolutionOdontogramData) => {
          // Coincidir por tooth_position_id o tooth_number
          const toothMatch = evo.tooth_position_id === toothPositionId ||
            normalizeToothNumber(evo.tooth_number || '') === toothNumber;

          // Coincidir por cualquier ID de condicion (el guardado usa original_condition_id = dental_condition_id)
          const conditionMatch =
            (evo.definitive_condition_id && evo.definitive_condition_id === definitiveConditionId) ||
            (evo.original_condition_id && evo.original_condition_id === dentalConditionId);

          // La condicion esta completada si:
          // 1. El diente coincide Y la condicion coincide Y el status es 'completed'
          // 2. O solo el diente coincide (para condiciones sin ID especifico) Y el status es 'completed'
          return toothMatch && (conditionMatch || (!definitiveConditionId && !dentalConditionId)) && evo.condition_status === 'completed';
        });
      };

      // Convertir las condiciones del diagnóstico definitivo al formato del odontograma
      const odontogramConditions = definitiveDiagnosisConditions.map(cond => {
        // Normalizar el numero de diente al formato FDI con punto
        const normalizedToothNumber = normalizeToothNumber(cond.tooth_number);

        // Determinar las superficies afectadas
        const surfaces = cond.surfaces || cond.surfaces_array || [];

        // Obtener el conditionId correcto (usar condition_code que es el ID del catálogo)
        const conditionId = cond.condition_code || `condition-${cond.dental_condition_id}`;

        // Verificar si esta condicion ya fue completada (guardada en evolution_odontogram)
        const isCompleted = isConditionCompleted(
          cond.tooth_position_id,
          cond.definitive_condition_id,
          cond.dental_condition_id,
          normalizedToothNumber
        );

        // Determinar estado y color basado en el progreso guardado
        const conditionState = isCompleted ? 'good' as const : 'bad' as const;
        const conditionColor = isCompleted ? 'blue' : 'red';

        // Si hay superficies específicas, crear una entrada por cada superficie
        // Si no hay superficies, es una condición de diente completo
        if (surfaces.length > 0) {
          // Retornar múltiples condiciones si hay varias superficies
          return surfaces.map((surface: string) => ({
            toothNumber: normalizedToothNumber,
            conditionId: conditionId,
            sectionId: mapSurfaceToSectionId(surface),
            state: conditionState,
            color: conditionColor,
            label: cond.condition_label,
            price: cond.price,
            // Datos adicionales para tracking
            definitive_condition_id: cond.definitive_condition_id,
            dental_condition_id: cond.dental_condition_id,
            tooth_position_id: cond.tooth_position_id
          }));
        } else {
          // Condición de diente completo (sin superficie específica)
          return [{
            toothNumber: normalizedToothNumber,
            conditionId: conditionId,
            sectionId: 'corona', // Usar corona como default para condiciones de diente completo
            state: conditionState,
            color: conditionColor,
            label: cond.condition_label,
            price: cond.price,
            // Datos adicionales para tracking
            definitive_condition_id: cond.definitive_condition_id,
            dental_condition_id: cond.dental_condition_id,
            tooth_position_id: cond.tooth_position_id
          }];
        }
      }).flat(); // Aplanar el array de arrays

      setTreatmentOdontogramData(odontogramConditions);
      return;
    }

    // PRIORIDAD 2 (Fallback): Usar currentOdontogram si no hay diagnóstico definitivo
    if (currentOdontogram && currentOdontogram.length > 0) {
      setTreatmentOdontogramData(currentOdontogram);
      return;
    }

    // PRIORIDAD 3 (Fallback final): Usar store del paciente
    if (selectedPatient) {
      const storedOdontogram = getPatientOdontogram(selectedPatient.id);
      if (storedOdontogram && storedOdontogram.length > 0) {
        setTreatmentOdontogramData(storedOdontogram);
      }
    }
  }, [definitiveDiagnosisConditions, currentOdontogram, selectedPatient, getPatientOdontogram, consultationId, backendData.evolutionData]);

  // Cargar historial completo de tratamientos desde la API
  useEffect(() => {
    const loadHistory = async () => {
      // Usar patient_id (del backend) o id (legacy)
      const patientId = selectedPatient?.patient_id || selectedPatient?.id;
      if (!patientId) return;
      const history = await loadTreatmentHistory(patientId);
      setTreatmentHistory(history);
    };

    loadHistory();
  }, [selectedPatient?.patient_id, selectedPatient?.id]);

  // Cargar ultimo tratamiento realizado del historial al iniciar nueva consulta
  useEffect(() => {
    const loadLastTreatmentData = async () => {
      // Usar patient_id (del backend) o id (legacy)
      const patientId = selectedPatient?.patient_id || selectedPatient?.id;
      if (!patientId) return;

      // Solo cargar si es una nueva consulta (sin datos previos de tratamiento)
      if (currentRecord.treatmentPerformed || currentRecord.loadedFromHistory) return;

      const lastTreatment = await loadLastTreatment(patientId);

      if (lastTreatment) {

        // Pre-cargar datos del ultimo tratamiento
        setCurrentRecord({
          ...currentRecord,
          appliedTreatments: lastTreatment.treatmentData.appliedTreatments || [],
          performedProcedures: lastTreatment.treatmentData.performedProcedures || [],
          loadedFromHistory: true, // Flag para indicar que se cargo del historial
          lastHistoryDate: lastTreatment.date // Guardar referencia de cuando fue
        });

        toast.success('Se cargaron los datos del ultimo tratamiento realizado');
      }
    };

    loadLastTreatmentData();
  }, [selectedPatient?.patient_id, selectedPatient?.id]);

  // SINCRONIZACION INICIAL: Detectar condiciones ya completadas al cargar datos
  // Nota: La sincronizacion en tiempo real se maneja via callback handleProcedureCheckChange (Checklist -> Odontograma)
  // ACTUALIZADO: Ahora usa claves únicas en lugar de índices
  useEffect(() => {
    if (!treatmentOdontogramData || treatmentOdontogramData.length === 0) return;
    if (!definitiveDiagnosisConditions || definitiveDiagnosisConditions.length === 0) return;

    // Buscar condiciones marcadas como 'good' (azul = realizadas) en el odontograma
    const completedOdontogramConditions = treatmentOdontogramData.filter(
      condition => condition.state === 'good'
    );

    if (completedOdontogramConditions.length === 0) return;

    // Usar forma funcional para evitar problemas de closure con completedTreatments
    setCompletedTreatments((prevCompletedTreatments: Record<string, boolean>) => {
      const newCompletedTreatments = { ...prevCompletedTreatments };
      let hasChanges = false;

      completedOdontogramConditions.forEach(odontoCond => {
        // Buscar el procedimiento correspondiente en definitiveDiagnosisConditions
        const procedureIndex = definitiveDiagnosisConditions.findIndex((diagCond: any) => {
          const toothMatch = String(diagCond.tooth_number) === String(odontoCond.toothNumber);
          const conditionMatch =
            diagCond.condition_code === odontoCond.conditionId ||
            `condition-${diagCond.dental_condition_id}` === odontoCond.conditionId ||
            diagCond.dental_condition_id === odontoCond.dental_condition_id ||
            diagCond.definitive_condition_id === odontoCond.definitive_condition_id;

          return toothMatch && conditionMatch;
        });

        if (procedureIndex !== -1) {
          // ACTUALIZADO: Usar clave única en lugar de índice
          const procedureData = definitiveDiagnosisConditions[procedureIndex];
          const key = generateUniqueKey(procedureData, procedureIndex);
          if (!newCompletedTreatments[key]) {
            newCompletedTreatments[key] = true;
            hasChanges = true;
          }
        }
      });

      // Solo retornar nuevo objeto si hay cambios
      return hasChanges ? newCompletedTreatments : prevCompletedTreatments;
    });
  }, [treatmentOdontogramData, definitiveDiagnosisConditions, setCompletedTreatments]);

  // =====================================================
  // CALCULOS DE PRESUPUESTO (FALLBACK LOCAL)
  // =====================================================

  // Calcular presupuesto total consolidado (priorizar datos del backend, luego currentOdontogram)
  const treatmentOdontogramConditions = currentOdontogram && currentOdontogram.length > 0
    ? currentOdontogram
    : (selectedPatient ? getPatientOdontogram(selectedPatient.id) : []);
  const treatmentDiagnosticExams = currentRecord.diagnosticPlan?.selectedExams || [];
  const treatmentCustomExams = currentRecord.diagnosticPlan?.customExams || [];

  // Solo usar calculo local si no hay datos del backend
  const localBudget = calculateTreatmentBudget(
    treatmentOdontogramConditions,
    treatmentDiagnosticExams,
    treatmentCustomExams
  );

  // Usar el total del backend si esta disponible, sino el local
  const finalConsolidatedTotal = consolidatedTotal > 0 ? consolidatedTotal : localBudget.consolidatedTotal;

  // =====================================================
  // HANDLERS
  // =====================================================

  // Handler cuando un procedimiento se completa via API (callback del odontograma)
  const handleProcedureCompleted = useCallback((result: any) => {
    // Recargar historial de tratamientos para mostrar el nuevo registro
    const patientId = selectedPatient?.patient_id || selectedPatient?.id;
    if (patientId) {
      loadTreatmentHistory(patientId).then(history => {
        setTreatmentHistory(history);
      });
    }

    // Mostrar notificacion de exito
    toast.success('Procedimiento registrado en historial clinico');
  }, [selectedPatient, toast]);

  /**
   * Handler para SINCRONIZACION UNIDIRECCIONAL: Checklist -> Odontograma
   * Cuando se marca/desmarca un procedimiento en el checklist,
   * actualiza el color del diente correspondiente en el odontograma (rojo -> azul o viceversa)
   */
  const handleProcedureCheckChange = useCallback((
    procedureIndex: number,
    checked: boolean,
    procedureData: any
  ) => {
    if (!procedureData) return;

    // Normalizar el numero de diente
    const toothNumber = normalizeToothNumber(procedureData.tooth_number);
    const conditionId = procedureData.condition_code || `condition-${procedureData.dental_condition_id}`;

    console.log('[TreatmentPerformed] handleProcedureCheckChange:', {
      procedureIndex,
      checked,
      toothNumber,
      conditionId,
      procedureData: {
        tooth_number: procedureData.tooth_number,
        condition_code: procedureData.condition_code,
        dental_condition_id: procedureData.dental_condition_id,
        definitive_condition_id: procedureData.definitive_condition_id
      }
    });

    // Buscar la condicion correspondiente en el odontograma
    setTreatmentOdontogramData((prevConditions: any[]) => {
      let foundMatch = false;
      const newConditions = prevConditions.map((cond: any) => {
        // Coincidir por diente y condicion
        const toothMatch = String(cond.toothNumber) === String(toothNumber);
        const conditionMatch =
          cond.conditionId === conditionId ||
          cond.conditionId === procedureData.condition_code ||
          cond.dental_condition_id === procedureData.dental_condition_id ||
          cond.definitive_condition_id === procedureData.definitive_condition_id;

        if (toothMatch && conditionMatch) {
          foundMatch = true;
          console.log('[TreatmentPerformed] Match encontrado, cambiando color:', {
            tooth: cond.toothNumber,
            oldState: cond.state,
            newState: checked ? 'good' : 'bad',
            oldColor: cond.color,
            newColor: checked ? 'blue' : 'red'
          });
          // Cambiar estado: checked=true -> 'good' (azul), checked=false -> 'bad' (rojo)
          return {
            ...cond,
            state: checked ? 'good' : 'bad',
            color: checked ? 'blue' : 'red'
          };
        }
        return cond;
      });

      if (!foundMatch) {
        console.warn('[TreatmentPerformed] NO se encontró match para:', {
          toothNumber,
          conditionId,
          availableConditions: prevConditions.map(c => ({
            tooth: c.toothNumber,
            conditionId: c.conditionId,
            dental_condition_id: c.dental_condition_id
          }))
        });
      }

      return newConditions;
    });

    setUnsavedChanges(true);
  }, [setUnsavedChanges]);

  // NOTA: El handler handleToothStateChange fue eliminado porque el odontograma ahora es de SOLO LECTURA.
  // La sincronizacion es UNIDIRECCIONAL: Checklist -> Odontograma (via handleProcedureCheckChange)

  const handleFinishConsultation = async () => {
    try {
      // Agregar IDs al currentRecord antes de guardar
      const recordWithIds = {
        ...currentRecord,
        consultation_id: consultationId,
        branch_id: branchId,
        dentist_id: dentistId
      };

      // Actualizar currentRecord con los IDs
      setCurrentRecord(recordWithIds);

      // Guardar progreso y tratamiento en el historial
      await handleSaveProgress();
      await saveTreatmentToHistory(selectedPatient, recordWithIds);

      // Marcar la cita como completada si existe appointmentId
      if (appointmentId) {
        try {
          await appointmentsApi.markAppointmentAsCompleted(parseInt(appointmentId));
        } catch (error) {
          console.error('Error al marcar cita como completada:', error);
          // No bloquear la finalizacion si falla marcar la cita
        }
      }

      markStepCompleted(10);
      setShowCompletionModal(true);
    } catch (error) {
      console.error('Error al finalizar consulta:', error);
      toast.success('Error al finalizar la consulta');
    }
  };

  // Handler UNIFICADO para guardar TODO el paso 10 (metadatos + odontograma + checklist)
  const handleSaveWithMetadata = async () => {
    setIsSavingAll(true);

    try {
      // 1. Guardar metadatos del doctor
      if (user || authUser) {
        const activeUser = user || authUser;
        const doctorName = `${activeUser.profile?.firstName || activeUser.firstName || ''} ${activeUser.profile?.lastName || activeUser.lastName || ''}`.trim() || 'Doctor';
        const doctorCOP = activeUser.profile?.licenseNumber || 'N/A';

        // Agregar metadatos al registro
        setCurrentRecord((prev: any) => ({
          ...prev,
          checklistSavedAt: new Date(),
          doctorComment: `Tratamiento realizado por Dr. ${doctorName} - COP: ${doctorCOP}`,
          // Agregar IDs para persistencia
          consultation_id: consultationId,
          branch_id: branchId,
          dentist_id: dentistId
        }));
      }

      // 2. Guardar cambios del Odontograma (procedure_history + procedure_income + evolution_odontogram)
      if (odontogramRef.current?.hasPendingChanges()) {
        const odontogramSuccess = await odontogramRef.current.saveAll();
        if (!odontogramSuccess) {
          toast.success('Error al guardar cambios del odontograma');
          return;
        }
      }

      // 3. Guardar cambios del Checklist (procedure_history + procedure_income)
      if (checklistRef.current?.hasPendingChanges()) {
        const checklistSuccess = await checklistRef.current.saveAll();
        if (!checklistSuccess) {
          toast.success('Error al guardar cambios del checklist');
          return;
        }
      }

      // 4. Guardar el progreso general
      await handleSaveProgress();

      // 5. Limpiar flag de cambios no guardados
      setUnsavedChanges(false);

      toast.success('Tratamientos guardados correctamente');
    } catch (error) {
      console.error('Error al guardar tratamientos:', error);
      toast.success('Error al guardar los tratamientos');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Calcular si hay cambios pendientes en los componentes hijos
  const hasPendingChangesInChildren = useCallback(() => {
    const odontogramPending = odontogramRef.current?.getPendingCount() || 0;
    const checklistPending = checklistRef.current?.getPendingCount() || 0;
    return odontogramPending + checklistPending;
  }, []);

  // Handler para exportar el tratamiento completo como PDF
  const handleExportPDF = async () => {
    try {
      // Obtener nombre del doctor
      const activeUser = user || authUser;
      const doctorName = activeUser
        ? `Dr. ${activeUser.profile?.firstName || activeUser.firstName || ''} ${activeUser.profile?.lastName || activeUser.lastName || ''}`.trim()
        : currentRecord.doctorName || 'N/A';
      const doctorLicense = activeUser?.profile?.licenseNumber || currentRecord.doctorInfo?.licenseNumber || 'N/A';

      // Preparar currentRecord con info del doctor
      const recordWithDoctorInfo = {
        ...currentRecord,
        doctorName: doctorName,
        doctorInfo: {
          licenseNumber: doctorLicense,
          specialties: activeUser?.profile?.specialties || currentRecord.doctorInfo?.specialties || [],
          email: activeUser?.email || currentRecord.doctorInfo?.email
        }
      };

      await exportTreatmentAsPDF({
        patient: selectedPatient,
        currentRecord: recordWithDoctorInfo,
        odontogramConditions: treatmentOdontogramConditions,
        diagnosticExams: treatmentDiagnosticExams,
        customExams: treatmentCustomExams,
        medications: currentRecord.prescriptionMedications || [],
        consolidatedTotal: finalConsolidatedTotal,
        completedTreatments,
        // Nuevos datos del backend
        definitiveDiagnosis: backendData.definitiveDiagnosis || undefined,
        treatments: treatments,
        additionalServices: additionalServices,
        evolutionOdontogramData: treatmentOdontogramData,
        // Totales desglosados
        definitiveDiagnosisTotal: definitiveDiagnosisTotal,
        treatmentsTotal: treatmentsTotal,
        additionalServicesTotal: additionalServicesTotal,
        examsTotal: examsTotal,
        advancePayment: advancePayment,
        balance: balance,
        planName: planName
      });
      toast.success('Tratamiento exportado como PDF exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.success('Error al exportar el tratamiento. Por favor, intente nuevamente.');
    }
  };

  // Handler para exportar el odontograma como PDF
  const handleExportOdontogram = async () => {
    try {
      // Obtener nombre del doctor
      const activeUser = user || authUser;
      const doctorName = activeUser
        ? `Dr. ${activeUser.profile?.firstName || activeUser.firstName || ''} ${activeUser.profile?.lastName || activeUser.lastName || ''}`.trim()
        : 'N/A';
      const doctorLicense = activeUser?.profile?.licenseNumber || 'N/A';

      await exportOdontogramAsPDF({
        patient: selectedPatient,
        odontogramConditions: treatmentOdontogramData,
        doctorName,
        doctorLicense
      });
      toast.success('Odontograma exportado como PDF exitosamente');
    } catch (error) {
      toast.success('Error al exportar el odontograma. Por favor, intente nuevamente.');
    }
  };

  // =====================================================
  // RENDER - ESTADO DE CARGA
  // =====================================================

  if (backendData.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 shadow-lg"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Cargando datos del tratamiento...</p>
        </div>
      </motion.div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <StepHeader
        icon={Activity}
        title="Tratamiento Realizado"
        description="Registre los procedimientos realizados durante la consulta"
        color="blue"
        className="mb-6"
      />

      {/* Mensaje de error si no hay datos */}
      {backendData.error && !backendData.treatmentPlan && !backendData.budget && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">No hay datos del plan de tratamiento</p>
            <p className="text-amber-600 text-sm mt-1">
              Complete primero el Plan de Tratamiento (Paso 8) y el Presupuesto (Paso 9) para ver el resumen completo.
            </p>
          </div>
        </div>
      )}

      {/* Exportar Documentos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Exportar Documentos
            </h3>
            <p className="text-xs text-gray-600">
              Descargue el reporte completo del tratamiento o solo el odontograma de evolución
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              Exportar Reporte Completo (PDF)
            </button>
            <button
              onClick={handleExportOdontogram}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 active:scale-95 transition-all shadow-md font-medium text-sm"
            >
              <Image className="w-4 h-4" />
              Exportar Solo Odontograma (PDF)
            </button>
          </div>
        </div>
      </motion.div>

      {/* Patient Info Card */}
      <PatientInfoCard patient={selectedPatient} />

      {/* Historial de Tratamientos Realizados */}
      <TreatmentHistorySection
        history={treatmentHistory}
        patientId={selectedPatient?.patient_id || selectedPatient?.id}
      />

      {/* Treatment Plan Reference - Ahora con datos del backend y historial de ingresos */}
      <TreatmentPlanReference
        key={`treatment-plan-ref-${incomeRefreshKey}`}
        planName={planName}
        consolidatedTotal={finalConsolidatedTotal}
        definitiveDiagnosisTotal={definitiveDiagnosisTotal}
        treatmentsTotal={treatmentsTotal}
        additionalServicesTotal={additionalServicesTotal}
        examsTotal={examsTotal}
        advancePayment={advancePayment}
        balance={balance}
        treatments={treatments}
        additionalServices={additionalServices}
        definitiveDiagnosisConditions={definitiveDiagnosisConditions}
        patientId={selectedPatient?.patient_id || selectedPatient?.id}
        consultationId={consultationId}
        onIncomeUpdate={() => {
          // Recargar historial de tratamientos cuando se actualice un ingreso
          const patientId = selectedPatient?.patient_id || selectedPatient?.id;
          if (patientId) {
            loadTreatmentHistory(patientId).then(history => {
              setTreatmentHistory(history);
            });
          }
        }}
      />

      {/* Receta Medica Prescrita */}
      <PrescriptionDisplay
        medications={currentRecord.prescriptionMedications}
        signature={currentRecord.prescriptionSignature}
      />

      {/* Odontograma de Evolucion - SOLO LECTURA
          El usuario NO puede marcar condiciones directamente aqui.
          Los cambios se hacen desde el Checklist de Tratamientos de abajo.
          Cuando se marca un checkbox en el Checklist, el diente cambia de rojo a azul. */}
      <TreatmentOdontogramSection
        ref={odontogramRef}
        patient={selectedPatient}
        initialOdontogramData={currentOdontogram}
        odontogramData={treatmentOdontogramData}
        onConditionsChange={setTreatmentOdontogramData}
        setUnsavedChanges={setUnsavedChanges}
        setCurrentOdontogram={setCurrentOdontogram}
        consultationId={consultationId}
        branchId={branchId}
        dentistId={dentistId}
        appointmentId={appointmentId}
        onProcedureCompleted={handleProcedureCompleted}
      />

      {/* Checklist de Tratamientos - UNICO lugar para marcar procedimientos como completados
          Al marcar un checkbox aqui:
          1. El diente correspondiente cambia de ROJO a AZUL en el odontograma de arriba
          2. Al guardar, se registra en procedure_history, procedure_income y evolution_odontogram */}
      <TreatmentChecklistSection
        ref={checklistRef}
        odontogramConditions={treatmentOdontogramConditions}
        diagnosticExams={treatmentDiagnosticExams}
        customExams={treatmentCustomExams}
        medications={currentRecord.prescriptionMedications}
        completedTreatments={completedTreatments}
        onCompletedTreatmentsChange={setCompletedTreatments}
        setUnsavedChanges={setUnsavedChanges}
        readOnly={readOnly}
        checklistSavedAt={currentRecord.checklistSavedAt}
        doctorComment={currentRecord.doctorComment}
        consultationId={consultationId}
        branchId={branchId}
        dentistId={dentistId}
        patientId={selectedPatient?.patient_id || selectedPatient?.id}
        appointmentId={appointmentId}
        treatments={treatments}
        additionalServices={additionalServices}
        definitiveDiagnosisConditions={definitiveDiagnosisConditions}
        evolutionOdontogramConditions={treatmentOdontogramData}
        onProcedureCheckChange={handleProcedureCheckChange}
        showSaveButton={false}
        onIncomeCreated={() => {
          // Forzar recarga de TreatmentPlanReference para mostrar ingresos actualizados
          setIncomeRefreshKey(prev => prev + 1);
          // Tambien recargar historial de tratamientos
          const patientId = selectedPatient?.patient_id || selectedPatient?.id;
          if (patientId) {
            loadTreatmentHistory(patientId).then(history => {
              setTreatmentHistory(history);
            });
          }
        }}
      />

      <div className="space-y-6">
        {/* Treatment Performed Section */}
        <TreatmentObservationsSection
          value={currentRecord.treatmentPerformed || ''}
          onChange={handleTreatmentPerformedChange}
          readOnly={readOnly}
        />

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 active:scale-98 transition-all font-medium shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver a Presupuesto
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSaveWithMetadata}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 active:scale-98 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
            >
              {isSavingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSavingAll ? 'Guardando...' : 'Guardar Todo'}
            </button>
            <button
              onClick={handleFinishConsultation}
              disabled={!currentRecord.treatmentPerformed?.trim() || isSavingAll}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all active:scale-98 ${
                currentRecord.treatmentPerformed?.trim() && !isSavingAll
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Finalizar Consulta
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmacion de Finalizacion */}
      <CompletionModal
        show={showCompletionModal}
        patient={selectedPatient}
        consolidatedTotal={finalConsolidatedTotal}
        onClose={() => setShowCompletionModal(false)}
        toast={toast}
      />
    </motion.div>
  );
};

// Exportar el componente memoizado
export const TreatmentPerformedStep = memo(TreatmentPerformedStepComponent);
