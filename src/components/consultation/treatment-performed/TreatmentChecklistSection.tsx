/**
 * TreatmentChecklistSection - Checklist de Tratamientos Realizados
 *
 * COMPORTAMIENTO ACTUALIZADO:
 * 1. Marcar checkbox -> Solo cambia estado visual local (NO llama API)
 * 2. Click "Guardar" -> Registra todos los marcados en procedure_history + procedure_income
 * 3. Items ya guardados -> Quedan bloqueados visualmente (checkbox deshabilitado)
 *
 * Sistema de cuotas para Ortodoncia/Implantes:
 * - Boton "+Cuota #X" -> Registra pago de cuota
 * - Limite: Solo 1 cuota por cita (validacion con appointment_id)
 * - Ultima cuota cierra el plan
 */

import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  ClipboardCheck,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Stethoscope,
  Check,
  Wrench,
  Pill,
  FileText,
  Save,
  Lock
} from 'lucide-react';

// Interface para exponer funciones al padre via ref
export interface TreatmentChecklistSectionRef {
  saveAll: () => Promise<boolean>;
  getPendingCount: () => number;
  hasPendingChanges: () => boolean;
}
import { SectionCard } from '@/components/consultation/shared';
import { calculateTreatmentProgress } from './treatment-performed-helpers';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { MonthlyPaymentTracker, type MonthlyPaymentTrackerRef } from './MonthlyPaymentTracker';
import { procedureIncomeApi, type ProcedureIncomeData } from '@/services/api/procedureIncomeApi';
import { procedureHistoryApi } from '@/services/api/procedureHistoryApi';
import { evolutionOdontogramApi } from '@/services/api/evolutionOdontogramApi';
import { getEffectiveProcedurePrice } from '@/components/consultation/final-diagnosis';
import type {
  ConsultationTreatmentItem,
  ConsultationAdditionalService,
  DefinitiveDiagnosisConditionData
} from '@/services/api/consultationsApi';

interface TreatmentChecklistSectionProps {
  odontogramConditions: any[];
  diagnosticExams: any[];
  customExams: any[];
  medications?: any[];
  completedTreatments: Record<string, boolean>;
  onCompletedTreatmentsChange: (treatments: Record<string, boolean>) => void;
  setUnsavedChanges: (val: boolean) => void;
  readOnly?: boolean;
  checklistSavedAt?: Date;
  doctorComment?: string;
  consultationId?: number;
  branchId?: number;
  dentistId?: number;
  patientId?: number | string;
  appointmentId?: number | string;
  treatments?: ConsultationTreatmentItem[];
  additionalServices?: ConsultationAdditionalService[];
  definitiveDiagnosisConditions?: DefinitiveDiagnosisConditionData[];
  evolutionOdontogramConditions?: any[];
  onSaveComplete?: () => void;
  /** Callback para sincronizar con el odontograma cuando se marca/desmarca un procedimiento */
  onProcedureCheckChange?: (procedureIndex: number, checked: boolean, procedureData: DefinitiveDiagnosisConditionData) => void;
  /** Mostrar botón de guardar local (default: true). Poner false si el padre maneja el guardado */
  showSaveButton?: boolean;
  /** Callback cuando se crean nuevos registros de ingreso (para actualizar TreatmentPlanReference) */
  onIncomeCreated?: () => void;
}

/**
 * Genera una clave única y estable para un procedimiento del diagnóstico definitivo.
 * PRIORIDAD 1: Usar definitive_condition_id si existe (ID de BD - más estable)
 * PRIORIDAD 2: Usar combinación tooth_position_id + dental_condition_id (estable ante reordenamientos)
 * FALLBACK: Usar índice solo si no hay otra opción (legacy)
 *
 * IMPORTANTE: Esto evita que los checkboxes se reinicien cuando se modifica el odontograma,
 * ya que la clave NO depende del orden/índice del array.
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
  console.warn(`[TreatmentChecklist] Usando índice como fallback para procedimiento sin IDs:`, cond);
  return `procedure-${index}`;
};

// Interface para items pendientes de guardar
interface PendingItem {
  key: string;
  type: 'procedure' | 'treatment' | 'prosthesis' | 'exam' | 'prescription';
  data: any;
  amount: number;
}

export const TreatmentChecklistSection = forwardRef<TreatmentChecklistSectionRef, TreatmentChecklistSectionProps>(({
  odontogramConditions,
  diagnosticExams,
  customExams,
  medications = [],
  completedTreatments,
  onCompletedTreatmentsChange,
  setUnsavedChanges,
  readOnly = false,
  consultationId,
  branchId,
  dentistId,
  patientId,
  appointmentId,
  treatments = [],
  additionalServices = [],
  definitiveDiagnosisConditions = [],
  evolutionOdontogramConditions = [],
  onSaveComplete,
  onProcedureCheckChange,
  showSaveButton = true,
  onIncomeCreated
}, ref) => {
  // Estado para items ya guardados en BD (bloqueados)
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [loadingSavedItems, setLoadingSavedItems] = useState(false);

  // Estado para guardado en lote
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Refs para MonthlyPaymentTrackers (guardado diferido)
  const paymentTrackerRefs = useRef<Map<string, MonthlyPaymentTrackerRef>>(new Map());

  // Ref callbacks estables para evitar re-renders innecesarios
  const refCallbacksRef = useRef<Map<string, (r: MonthlyPaymentTrackerRef | null) => void>>(new Map());

  const getRefCallback = useCallback((key: string) => {
    if (!refCallbacksRef.current.has(key)) {
      refCallbacksRef.current.set(key, (r: MonthlyPaymentTrackerRef | null) => {
        if (r) {
          paymentTrackerRefs.current.set(key, r);
        } else {
          paymentTrackerRefs.current.delete(key);
        }
      });
    }
    return refCallbacksRef.current.get(key)!;
  }, []);

  // Función para obtener el conteo de pendientes de payment trackers (llamada bajo demanda)
  const getPaymentTrackerPendingCount = useCallback(() => {
    let total = 0;
    paymentTrackerRefs.current.forEach((trackerRef) => {
      total += trackerRef.getPendingCount();
    });
    return total;
  }, []);

  const { toothPositions, toothSurfaces } = useOdontogramConfigStore();

  // Separar servicios por tipo
  const orthodonticServices = useMemo(() =>
    additionalServices.filter(s => s.service_type === 'orthodontic' || s.type === 'orthodontic'),
    [additionalServices]
  );

  const implantServices = useMemo(() =>
    additionalServices.filter(s => s.service_type === 'implant' || s.type === 'implant'),
    [additionalServices]
  );

  const prosthesisServices = useMemo(() =>
    additionalServices.filter(s => s.service_type === 'prosthesis' || s.type === 'prosthesis'),
    [additionalServices]
  );

  // Calcular total de items
  const totalItems = useMemo(() => {
    let count = definitiveDiagnosisConditions.length;
    treatments.forEach(t => {
      count += t.conditions?.length || 1;
    });
    [...orthodonticServices, ...implantServices].forEach(s => {
      const inicial = Number(s.editedFields?.inicial || s.edited_inicial || s.originalFields?.inicial || s.original_inicial || 0);
      const mensual = Number(s.editedFields?.mensual || s.edited_mensual || s.originalFields?.mensual || s.original_mensual || 0);
      if (inicial > 0) count++;
      if (mensual > 0) count++;
      if (inicial === 0 && mensual === 0) count++;
    });
    count += prosthesisServices.length + diagnosticExams.length + customExams.length + medications.length;
    return count;
  }, [definitiveDiagnosisConditions, treatments, orthodonticServices, implantServices, prosthesisServices, diagnosticExams, customExams, medications]);

  const { completedItems, progress } = calculateTreatmentProgress(completedTreatments, totalItems);
  const hasApiIntegration = consultationId && branchId && dentistId && patientId;

  const getToothPositionId = useCallback((toothNumber: string): number | undefined => {
    return toothPositions.find(p => p.tooth_number === toothNumber)?.tooth_position_id;
  }, [toothPositions]);

  // Refs para evitar duplicar cargas y mantener valores actuales sin re-renders
  const hasLoadedSavedItemsRef = useRef(false);
  const lastConsultationIdRef = useRef<number | undefined>(undefined);
  const completedTreatmentsRef = useRef(completedTreatments);
  const onCompletedTreatmentsChangeRef = useRef(onCompletedTreatmentsChange);

  // Mantener las refs actualizadas
  useEffect(() => {
    completedTreatmentsRef.current = completedTreatments;
  }, [completedTreatments]);

  useEffect(() => {
    onCompletedTreatmentsChangeRef.current = onCompletedTreatmentsChange;
  }, [onCompletedTreatmentsChange]);

  // Cargar items ya guardados en BD al montar
  useEffect(() => {
    const loadSavedItems = async () => {
      // Validar que tenemos un consultationId valido (numero positivo)
      if (!consultationId || consultationId <= 0) {
        return;
      }

      // Evitar recargar si ya cargamos para esta consulta y tenemos datos de condiciones
      if (hasLoadedSavedItemsRef.current && lastConsultationIdRef.current === consultationId) {
        return;
      }

      // Esperar a que definitiveDiagnosisConditions tenga datos si es necesario
      const hasData = definitiveDiagnosisConditions.length > 0 ||
                      treatments.length > 0 ||
                      prosthesisServices.length > 0;

      if (!hasData) {
        return;
      }

      setLoadingSavedItems(true);
      try {
        const response = await procedureIncomeApi.getConsultationIncomeItems(consultationId);

        if (response.success && response.data) {
          const saved = new Set<string>();

          // DEBUG: Log para verificar datos
          console.log('[TreatmentChecklist] Items guardados en BD:', response.data.items);
          console.log('[TreatmentChecklist] Condiciones del diagnóstico definitivo:', definitiveDiagnosisConditions);

          // Procesar items guardados y marcar las keys correspondientes
          // NUEVO: Usar claves únicas basadas en IDs en lugar de índices
          response.data.items.forEach((item: ProcedureIncomeData) => {
            if (item.income_type === 'odontogram_procedure') {
              // Buscar la condición correspondiente para generar la clave única
              const matchingCond = definitiveDiagnosisConditions.find((cond, idx) => {
                const nameMatch = cond.condition_label === item.item_name ||
                                  cond.condition_name === item.item_name;
                return cond.tooth_position_id === item.tooth_position_id && nameMatch;
              });

              // Fallback: matching solo por tooth_position_id (si hay un solo procedimiento por diente)
              const fallbackCond = !matchingCond && item.tooth_position_id
                ? definitiveDiagnosisConditions.find(cond =>
                    cond.tooth_position_id === item.tooth_position_id
                  )
                : null;

              const foundCond = matchingCond || fallbackCond;

              if (foundCond) {
                // Encontrar el índice para usar en generateUniqueKey (solo para fallback)
                const condIndex = definitiveDiagnosisConditions.indexOf(foundCond);
                const key = generateUniqueKey(foundCond, condIndex);
                saved.add(key);
                console.log(`[TreatmentChecklist] Match encontrado: ${key} para item:`, item.item_name, 'tooth_position_id:', item.tooth_position_id);
              } else {
                console.log(`[TreatmentChecklist] NO se encontró match para item:`, item.item_name, 'tooth_position_id:', item.tooth_position_id);
              }
            } else if (item.income_type === 'treatment') {
              treatments.forEach((treatment, tIndex) => {
                if (treatment.conditions?.length > 0) {
                  treatment.conditions.forEach((cond, cIndex) => {
                    if (cond.label === item.item_name) {
                      saved.add(`treatment-${tIndex}-cond-${cIndex}`);
                    }
                  });
                } else if (treatment.treatment_name === item.item_name) {
                  saved.add(`treatment-${tIndex}`);
                }
              });
            } else if (item.income_type === 'additional_service') {
              prosthesisServices.forEach((service, sIndex) => {
                if ((service.name || service.service_name) === item.item_name) {
                  saved.add(`prosthesis-${sIndex}`);
                }
              });
            } else if (item.income_type === 'diagnostic_exam') {
              diagnosticExams.forEach((exam, eIndex) => {
                if (exam.name === item.item_name) {
                  saved.add(`exam-${eIndex}`);
                }
              });
            }
          });

          console.log('[TreatmentChecklist] Items guardados (savedItems):', Array.from(saved));
          setSavedItems(saved);

          // Pre-marcar los items guardados como completados
          if (saved.size > 0) {
            const newCompleted = { ...completedTreatmentsRef.current };
            let hasChanges = false;
            saved.forEach(key => {
              if (!newCompleted[key]) {
                newCompleted[key] = true;
                hasChanges = true;
              }
            });
            if (hasChanges) {
              onCompletedTreatmentsChangeRef.current(newCompleted);
            }
          }

          // Marcar como cargado para esta consulta
          hasLoadedSavedItemsRef.current = true;
          lastConsultationIdRef.current = consultationId;
        }
      } catch (error) {
        console.warn('No se pudieron cargar items guardados (puede ser consulta nueva):', error);
      } finally {
        setLoadingSavedItems(false);
      }
    };

    loadSavedItems();
  }, [consultationId, definitiveDiagnosisConditions, treatments, prosthesisServices, diagnosticExams, getToothPositionId]);

  // Auto-completar padres
  useEffect(() => {
    const newCompleted = { ...completedTreatments };
    let hasChanges = false;

    treatments.forEach((treatment, tIndex) => {
      const key = `treatment-${tIndex}`;
      if (treatment.conditions?.length > 0) {
        const allDone = treatment.conditions.every((_, cIndex) => completedTreatments[`treatment-${tIndex}-cond-${cIndex}`]);
        if (allDone !== !!completedTreatments[key]) {
          newCompleted[key] = allDone;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) onCompletedTreatmentsChange(newCompleted);
  }, [completedTreatments, treatments, onCompletedTreatmentsChange]);

  // NOTA: La sincronizacion Odontograma -> Checklist se maneja via:
  // 1. Sincronizacion inicial en TreatmentPerformedStep.tsx (useEffect con treatmentOdontogramData)
  // 2. Sincronizacion en tiempo real via callback onProcedureCheckChange (Checklist -> Odontograma)
  //    y onToothStateChange (Odontograma -> Checklist) en TreatmentPerformedStep.tsx

  // Handler checkbox - CAMBIA ESTADO LOCAL Y SINCRONIZA CON ODONTOGRAMA
  // BLOQUEO PERMANENTE: Items guardados no pueden ser modificados
  const handleCheck = (key: string, checked: boolean) => {
    // BLOQUEO PERMANENTE: Si ya está guardado, no permitir ningún cambio
    if (savedItems.has(key)) {
      console.log(`[TreatmentChecklist] Bloqueado: ${key} ya está guardado permanentemente`);
      return;
    }

    onCompletedTreatmentsChange({ ...completedTreatments, [key]: checked });
    setUnsavedChanges(true);
    setSaveError(null);

    // Si es un procedimiento del plan (procedure-*), notificar al odontograma para sincronizar
    // Las claves ahora usan formato: procedure-id-{id}, procedure-tooth-{toothId}-cond-{condId}, o procedure-{index}
    if (key.startsWith('procedure-') && onProcedureCheckChange) {
      // Buscar el procedimiento correspondiente por su clave única
      const procedureIndex = definitiveDiagnosisConditions.findIndex((cond, idx) => {
        return generateUniqueKey(cond, idx) === key;
      });

      if (procedureIndex !== -1) {
        const procedureData = definitiveDiagnosisConditions[procedureIndex];
        onProcedureCheckChange(procedureIndex, checked, procedureData);
      }
    }
  };

  // Obtener items pendientes de guardar (marcados pero no guardados)
  // ACTUALIZADO: Usa claves únicas en lugar de índices
  const getPendingItems = useCallback((): PendingItem[] => {
    const pending: PendingItem[] = [];

    Object.entries(completedTreatments).forEach(([key, checked]) => {
      if (!checked || savedItems.has(key)) return;

      if (key.startsWith('procedure-')) {
        // Buscar el procedimiento por su clave única (no por índice)
        const cond = definitiveDiagnosisConditions.find((c, idx) =>
          generateUniqueKey(c, idx) === key
        );
        if (cond) {
          pending.push({
            key,
            type: 'procedure',
            data: cond,
            amount: getEffectiveProcedurePrice(cond)
          });
        }
      } else if (key.includes('-cond-')) {
        const [, tIndexStr, , cIndexStr] = key.split('-');
        const tIndex = parseInt(tIndexStr);
        const cIndex = parseInt(cIndexStr);
        const treatment = treatments[tIndex];
        const cond = treatment?.conditions?.[cIndex];
        if (cond) {
          pending.push({
            key,
            type: 'treatment',
            data: { ...cond, treatment_name: treatment.treatment_name },
            amount: cond.subtotal || cond.price * (cond.quantity || 1)
          });
        }
      } else if (key.startsWith('prosthesis-')) {
        const index = parseInt(key.replace('prosthesis-', ''));
        const service = prosthesisServices[index];
        if (service) {
          pending.push({
            key,
            type: 'prosthesis',
            data: service,
            amount: Number(service.editedFields?.montoTotal || service.edited_monto_total || service.originalFields?.montoTotal || service.original_monto_total || 0)
          });
        }
      } else if (key.startsWith('exam-')) {
        const index = parseInt(key.replace('exam-', ''));
        const exam = diagnosticExams[index];
        if (exam) {
          pending.push({
            key,
            type: 'exam',
            data: exam,
            amount: exam.price || 0
          });
        }
      } else if (key.startsWith('prescription-')) {
        const index = parseInt(key.replace('prescription-', ''));
        const med = medications[index];
        if (med) {
          pending.push({
            key,
            type: 'prescription',
            data: med,
            amount: 0
          });
        }
      }
    });

    return pending;
  }, [completedTreatments, savedItems, definitiveDiagnosisConditions, treatments, prosthesisServices, diagnosticExams, medications]);

  const pendingItems = getPendingItems();
  const hasPendingItems = pendingItems.length > 0;

  // Total de items pendientes del checklist
  // Nota: Los payment trackers se consultan bajo demanda via getPaymentTrackerPendingCount()
  const hasPendingChanges = hasPendingItems;

  // Handler para guardar todos los items pendientes
  // Retorna true si fue exitoso, false si hubo error o no había nada que guardar
  const handleSaveAll = async (): Promise<boolean> => {
    const paymentTrackerPending = getPaymentTrackerPendingCount();
    const hasAnythingToSave = hasPendingItems || paymentTrackerPending > 0;

    if (!hasApiIntegration || !hasAnythingToSave || isSaving) return true; // No hay nada que guardar

    setIsSaving(true);
    setSaveError(null);

    try {
      const numericPatientId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
      const numericAppointmentId = typeof appointmentId === 'string' ? parseInt(appointmentId) : appointmentId;
      const today = formatDateToYMD(new Date());

      // Generar un batch_id unico para todos los items que se guardan juntos
      const batchId = crypto.randomUUID();

      // Preparar items para procedure_history y procedure_income
      const historyItems: any[] = [];
      const incomeItems: Omit<ProcedureIncomeData, 'income_id'>[] = [];

      for (const item of pendingItems) {
        // Preparar datos base
        const baseHistoryData = {
          consultation_id: consultationId!,
          patient_id: numericPatientId!,
          performed_by_dentist_id: dentistId!,
          performed_date: today,
          procedure_status: 'completed',
          procedure_result: 'successful'
        };

        const baseIncomeData = {
          consultation_id: consultationId!,
          patient_id: numericPatientId!,
          branch_id: branchId!,
          performed_by_dentist_id: dentistId!,
          performed_date: today,
          income_status: 'confirmed',
          appointment_id: numericAppointmentId || null
        };

        if (item.type === 'procedure') {
          // Usar tooth_position_id directamente del dato si está disponible, sino buscar por tooth_number
          const toothPositionId = item.data.tooth_position_id || getToothPositionId(item.data.tooth_number);

          historyItems.push({
            ...baseHistoryData,
            procedure_name: item.data.condition_label || item.data.condition_name || 'Procedimiento',
            procedure_type: 'odontogram',
            tooth_position_id: toothPositionId,
            clinical_notes: `Procedimiento: Diente ${item.data.tooth_number || 'N/A'}`
          });

          incomeItems.push({
            ...baseIncomeData,
            income_type: 'odontogram_procedure',
            item_name: item.data.condition_label || item.data.condition_name || 'Procedimiento',
            tooth_position_id: toothPositionId,
            amount: item.amount,
            clinical_notes: `Procedimiento: Diente ${item.data.tooth_number || 'N/A'}`,
            batch_id: batchId
          });
        } else if (item.type === 'treatment') {
          historyItems.push({
            ...baseHistoryData,
            procedure_name: item.data.label || item.data.treatment_name,
            procedure_type: 'treatment',
            clinical_notes: `Tratamiento: ${item.data.label}`
          });

          incomeItems.push({
            ...baseIncomeData,
            income_type: 'treatment',
            item_name: item.data.label || item.data.treatment_name,
            amount: item.amount,
            clinical_notes: `Tratamiento: ${item.data.label}`,
            batch_id: batchId
          });
        } else if (item.type === 'prosthesis') {
          historyItems.push({
            ...baseHistoryData,
            procedure_name: item.data.name || item.data.service_name || 'Protesis',
            procedure_type: 'additional_service',
            clinical_notes: 'Protesis completada'
          });

          incomeItems.push({
            ...baseIncomeData,
            income_type: 'additional_service',
            item_name: item.data.name || item.data.service_name || 'Protesis',
            amount: item.amount,
            clinical_notes: 'Protesis completada',
            batch_id: batchId
          });
        } else if (item.type === 'exam') {
          historyItems.push({
            ...baseHistoryData,
            procedure_name: item.data.name,
            procedure_type: 'diagnostic_exam',
            clinical_notes: `Examen: ${item.data.name}`
          });

          incomeItems.push({
            ...baseIncomeData,
            income_type: 'diagnostic_exam',
            item_name: item.data.name,
            amount: item.amount,
            clinical_notes: `Examen: ${item.data.name}`,
            batch_id: batchId
          });
        } else if (item.type === 'prescription') {
          historyItems.push({
            ...baseHistoryData,
            procedure_name: `Receta: ${item.data.name}`,
            procedure_type: 'treatment',
            clinical_notes: `Medicamento: ${item.data.name}`
          });
        }
      }

      // Crear registros en procedure_history
      for (const historyData of historyItems) {
        await procedureHistoryApi.createProcedureHistory(historyData);
      }

      // Crear registros en procedure_income en lote
      if (incomeItems.length > 0) {
        await procedureIncomeApi.createBatchProcedureIncome(incomeItems);
      }

      // Actualizar evolution_odontogram a estado 'completed' para procedimientos del plan
      for (const item of pendingItems) {
        if (item.type === 'procedure' && item.data.tooth_number) {
          // Usar tooth_position_id directamente si está disponible
          const toothPositionId = item.data.tooth_position_id || getToothPositionId(item.data.tooth_number);

          if (toothPositionId && numericPatientId && dentistId) {
            try {
              const toothSurfaceId = item.data.tooth_surface_id || null;

              await evolutionOdontogramApi.upsertEvolutionOdontogram({
                patient_id: numericPatientId,
                consultation_id: consultationId!,
                tooth_position_id: toothPositionId,
                tooth_surface_id: toothSurfaceId,
                condition_status: 'completed',
                original_condition_id: item.data.dental_condition_id || item.data.condition_id || null,
                definitive_condition_id: item.data.definitive_condition_id || null,
                original_condition_name: item.data.condition_label || item.data.condition_name || 'Procedimiento',
                registered_by_dentist_id: dentistId,
                registered_date: today,
                clinical_observation: `Tratamiento completado: ${item.data.condition_label || item.data.condition_name}`
              });
            } catch (evoError) {
              console.warn('Error al actualizar evolution_odontogram:', evoError);
            }
          }
        }
      }

      // Marcar items como guardados
      const newSavedItems = new Set(savedItems);
      pendingItems.forEach(item => newSavedItems.add(item.key));
      setSavedItems(newSavedItems);

      // Guardar cambios de MonthlyPaymentTrackers (cuotas pendientes)
      const paymentTrackerPromises: Promise<boolean>[] = [];
      paymentTrackerRefs.current.forEach((trackerRef) => {
        if (trackerRef.hasPendingChanges()) {
          paymentTrackerPromises.push(trackerRef.saveAll());
        }
      });

      if (paymentTrackerPromises.length > 0) {
        const results = await Promise.all(paymentTrackerPromises);
        if (results.some(r => !r)) {
          setSaveError('Error al guardar algunas cuotas de pago');
          return false;
        }
      }

      // Limpiar flag de cambios no guardados
      setUnsavedChanges(false);

      // Callback de exito
      onSaveComplete?.();

      // Notificar que se crearon nuevos ingresos (para actualizar TreatmentPlanReference)
      onIncomeCreated?.();

      return true;
    } catch (error: any) {
      console.error('Error al guardar tratamientos:', error);
      setSaveError(error.message || 'Error al guardar los tratamientos');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Exponer funciones al padre via ref
  useImperativeHandle(ref, () => ({
    saveAll: handleSaveAll,
    getPendingCount: () => pendingItems.length + getPaymentTrackerPendingCount(),
    hasPendingChanges: () => hasPendingItems || getPaymentTrackerPendingCount() > 0
  }), [handleSaveAll, pendingItems.length, hasPendingItems, getPaymentTrackerPendingCount]);

  // Componente de item compacto
  const CompactItem = ({
    itemKey,
    label,
    price,
    badge,
    badgeColor = 'bg-gray-100 text-gray-600',
    subLabel
  }: {
    itemKey: string;
    label: string;
    price: number | string;
    badge?: string;
    badgeColor?: string;
    subLabel?: string;
  }) => {
    const isCompleted = completedTreatments[itemKey] || false;
    const isSaved = savedItems.has(itemKey);
    const numericPrice = typeof price === 'string' ? parseFloat(price) || 0 : (price || 0);

    return (
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded border transition-all ${
        isSaved
          ? 'bg-blue-50 border-blue-200'
          : isCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-100 hover:border-gray-200'
      }`}>
        <div className="relative flex-shrink-0">
          {isSaved ? (
            <Lock className="w-3.5 h-3.5 text-blue-600" />
          ) : (
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => handleCheck(itemKey, e.target.checked)}
              className="w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
              disabled={readOnly}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs truncate ${
              isSaved
                ? 'text-blue-800'
                : isCompleted
                  ? 'text-green-800 line-through'
                  : 'text-gray-700'
            }`}>
              {label}
            </span>
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeColor}`}>
                {badge}
              </span>
            )}
            {isSaved && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                Guardado
              </span>
            )}
          </div>
          {subLabel && <span className="text-[10px] text-gray-400 block truncate">{subLabel}</span>}
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${
          isSaved
            ? 'text-blue-600'
            : isCompleted
              ? 'text-green-600'
              : 'text-gray-600'
        }`}>
          S/.{numericPrice.toFixed(0)}
        </span>
      </div>
    );
  };

  // Seccion colapsable compacta
  const CompactSection = ({
    icon: Icon,
    title,
    count,
    color,
    children,
    completed = 0
  }: {
    icon: any;
    title: string;
    count: number;
    color: string;
    children: React.ReactNode;
    completed?: number;
  }) => {
    if (count === 0) return null;

    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700'
    };

    return (
      <div className={`rounded-lg border ${colorClasses[color]}`}>
        <div className="px-3 py-2 flex items-center gap-2 border-b border-opacity-50 rounded-t-lg">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-semibold flex-1">{title}</span>
          <span className="text-[10px] font-medium opacity-75">
            {completed}/{count}
          </span>
        </div>
        <div
          className="p-2 bg-white/80 space-y-1 max-h-56 overflow-y-auto rounded-b-lg custom-scrollbar"
          onWheel={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };

  // Contar completados por seccion (usa índices - para secciones que no son procedimientos)
  const countCompleted = (prefix: string, total: number) => {
    let count = 0;
    for (let i = 0; i < total; i++) {
      if (completedTreatments[`${prefix}-${i}`]) count++;
    }
    return count;
  };

  // Contar procedimientos completados (usa claves únicas)
  const countCompletedProcedures = () => {
    let count = 0;
    definitiveDiagnosisConditions.forEach((cond, idx) => {
      const key = generateUniqueKey(cond, idx);
      if (completedTreatments[key]) count++;
    });
    return count;
  };

  const countTreatmentConditionsCompleted = () => {
    let count = 0;
    treatments.forEach((t, tIndex) => {
      if (t.conditions?.length > 0) {
        t.conditions.forEach((_, cIndex) => {
          if (completedTreatments[`treatment-${tIndex}-cond-${cIndex}`]) count++;
        });
      } else if (completedTreatments[`treatment-${tIndex}`]) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="mb-4">
      <SectionCard
        icon={ClipboardCheck}
        title="Checklist de Tratamientos"
        subtitle="Marque los procedimientos realizados y luego haga clic en Guardar"
        colorScheme="green"
        gradientTo="emerald"
        animationDelay={0}
      >
        <div className="space-y-3">
          {/* Barra de progreso compacta */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-900">Progreso</span>
              </div>
              <span className="text-xs font-bold text-green-700">
                {completedItems}/{totalItems} ({progress}%)
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Indicador de estado y boton Guardar */}
          <div className="flex items-center justify-between gap-3">
            <div className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
              hasApiIntegration
                ? hasPendingItems
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
              {loadingSavedItems ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cargando items guardados...</span>
                </>
              ) : hasApiIntegration ? (
                hasPendingItems ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pendingItems.length} procedimientos pendientes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Todos los procedimientos guardados</span>
                  </>
                )
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Modo local (sin conexion a BD)</span>
                </>
              )}
            </div>

            {showSaveButton && hasApiIntegration && hasPendingItems && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving || readOnly}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar ({pendingItems.length})
              </button>
            )}
          </div>

          {/* Error de guardado */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{saveError}</p>
                <button
                  onClick={() => setSaveError(null)}
                  className="text-xs text-red-600 hover:underline mt-1"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Grid de 2 columnas para secciones principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Columna 1: Procedimientos del Plan */}
            <CompactSection
              icon={Stethoscope}
              title="Procedimientos del Plan"
              count={definitiveDiagnosisConditions.length}
              color="blue"
              completed={countCompletedProcedures()}
            >
              {definitiveDiagnosisConditions.map((cond, index) => {
                const uniqueKey = generateUniqueKey(cond, index);
                return (
                  <CompactItem
                    key={uniqueKey}
                    itemKey={uniqueKey}
                    label={cond.condition_label || cond.condition_name || 'Procedimiento'}
                    price={getEffectiveProcedurePrice(cond)}
                    badge={`D${cond.tooth_number || '-'}`}
                    badgeColor="bg-blue-100 text-blue-600"
                  />
                );
              })}
            </CompactSection>

            {/* Columna 2: Tratamientos Aplicados */}
            <CompactSection
              icon={Package}
              title="Tratamientos Aplicados"
              count={treatments.length}
              color="indigo"
              completed={countTreatmentConditionsCompleted()}
            >
              {treatments.map((treatment, tIndex) => {
                if (treatment.conditions?.length > 0) {
                  return (
                    <div key={`treatment-${tIndex}`} className="space-y-1">
                      <div className="text-[10px] font-semibold text-indigo-600 px-1 pt-1">
                        {treatment.treatment_name}
                      </div>
                      {treatment.conditions.map((cond, cIndex) => (
                        <CompactItem
                          key={`treatment-${tIndex}-cond-${cIndex}`}
                          itemKey={`treatment-${tIndex}-cond-${cIndex}`}
                          label={cond.label}
                          price={cond.subtotal || cond.price * (cond.quantity || 1)}
                          subLabel={cond.quantity > 1 ? `x${cond.quantity}` : undefined}
                        />
                      ))}
                    </div>
                  );
                }
                return (
                  <CompactItem
                    key={`treatment-${tIndex}`}
                    itemKey={`treatment-${tIndex}`}
                    label={treatment.treatment_name}
                    price={Number(treatment.total_amount || 0)}
                    badge="Trat."
                    badgeColor="bg-indigo-100 text-indigo-600"
                  />
                );
              })}
            </CompactSection>
          </div>

          {/* Grid de 3 columnas para servicios adicionales */}
          {(orthodonticServices.length > 0 || implantServices.length > 0 || prosthesisServices.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Ortodoncia */}
              {orthodonticServices.length > 0 && (
                <CompactSection
                  icon={Layers}
                  title="Ortodoncia"
                  count={orthodonticServices.length}
                  color="purple"
                  completed={0}
                >
                  {orthodonticServices.map((service, sIndex) => {
                    const serviceId = service.consultation_additional_service_id;
                    const montoTotal = Number(service.editedFields?.montoTotal || service.edited_monto_total || service.originalFields?.montoTotal || service.original_monto_total || 0);
                    const serviceName = service.name || service.service_name || 'Ortodoncia';

                    if (serviceId && hasApiIntegration && montoTotal > 0) {
                      const trackerKey = `ortho-${sIndex}`;
                      return (
                        <MonthlyPaymentTracker
                          key={trackerKey}
                          ref={getRefCallback(trackerKey)}
                          serviceId={serviceId}
                          serviceName={serviceName}
                          consultationId={consultationId!}
                          patientId={typeof patientId === 'string' ? parseInt(patientId) : patientId!}
                          branchId={branchId!}
                          dentistId={dentistId!}
                          readOnly={readOnly}
                          compact
                        />
                      );
                    }

                    return (
                      <CompactItem
                        key={`ortho-${sIndex}`}
                        itemKey={`ortho-${sIndex}`}
                        label={serviceName}
                        price={montoTotal}
                      />
                    );
                  })}
                </CompactSection>
              )}

              {/* Implantes */}
              {implantServices.length > 0 && (
                <CompactSection
                  icon={Layers}
                  title="Implantes"
                  count={implantServices.length}
                  color="cyan"
                  completed={0}
                >
                  {implantServices.map((service, sIndex) => {
                    const serviceId = service.consultation_additional_service_id;
                    const montoTotal = Number(service.editedFields?.montoTotal || service.edited_monto_total || service.originalFields?.montoTotal || service.original_monto_total || 0);
                    const serviceName = service.name || service.service_name || 'Implante';

                    if (serviceId && hasApiIntegration && montoTotal > 0) {
                      const trackerKey = `implant-${sIndex}`;
                      return (
                        <MonthlyPaymentTracker
                          key={trackerKey}
                          ref={getRefCallback(trackerKey)}
                          serviceId={serviceId}
                          serviceName={serviceName}
                          consultationId={consultationId!}
                          patientId={typeof patientId === 'string' ? parseInt(patientId) : patientId!}
                          branchId={branchId!}
                          dentistId={dentistId!}
                          readOnly={readOnly}
                          compact
                        />
                      );
                    }

                    return (
                      <CompactItem
                        key={`implant-${sIndex}`}
                        itemKey={`implant-${sIndex}`}
                        label={serviceName}
                        price={montoTotal}
                      />
                    );
                  })}
                </CompactSection>
              )}

              {/* Protesis */}
              {prosthesisServices.length > 0 && (
                <CompactSection
                  icon={Wrench}
                  title="Protesis"
                  count={prosthesisServices.length}
                  color="orange"
                  completed={countCompleted('prosthesis', prosthesisServices.length)}
                >
                  {prosthesisServices.map((service, sIndex) => {
                    const serviceId = service.consultation_additional_service_id;
                    const montoTotal = Number(service.editedFields?.montoTotal || service.edited_monto_total || service.originalFields?.montoTotal || service.original_monto_total || 0);
                    const serviceName = service.name || service.service_name || 'Protesis';

                    if (serviceId && hasApiIntegration && montoTotal > 0) {
                      const trackerKey = `prosthesis-${sIndex}`;
                      return (
                        <MonthlyPaymentTracker
                          key={trackerKey}
                          ref={getRefCallback(trackerKey)}
                          serviceId={serviceId}
                          serviceName={serviceName}
                          consultationId={consultationId!}
                          patientId={typeof patientId === 'string' ? parseInt(patientId) : patientId!}
                          branchId={branchId!}
                          dentistId={dentistId!}
                          readOnly={readOnly}
                          compact
                        />
                      );
                    }

                    return (
                      <CompactItem
                        key={`prosthesis-${sIndex}`}
                        itemKey={`prosthesis-${sIndex}`}
                        label={serviceName}
                        price={montoTotal}
                      />
                    );
                  })}
                </CompactSection>
              )}
            </div>
          )}

          {/* Grid de 2 columnas para examenes y recetas */}
          {(diagnosticExams.length > 0 || customExams.length > 0 || medications.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Examenes */}
              {(diagnosticExams.length > 0 || customExams.length > 0) && (
                <CompactSection
                  icon={FileText}
                  title="Examenes"
                  count={diagnosticExams.length + customExams.length}
                  color="gray"
                  completed={countCompleted('exam', diagnosticExams.length) + countCompleted('custom', customExams.length)}
                >
                  {diagnosticExams.map((exam, index) => (
                    <CompactItem
                      key={`exam-${index}`}
                      itemKey={`exam-${index}`}
                      label={exam.name}
                      price={exam.price || 0}
                    />
                  ))}
                  {customExams.map((exam, index) => (
                    <CompactItem
                      key={`custom-${index}`}
                      itemKey={`custom-${index}`}
                      label={exam.name}
                      price={exam.estimatedPrice || 0}
                      badge="Custom"
                      badgeColor="bg-purple-100 text-purple-600"
                    />
                  ))}
                </CompactSection>
              )}

              {/* Recetas */}
              {medications.length > 0 && (
                <CompactSection
                  icon={Pill}
                  title="Recetas Medicas"
                  count={medications.length}
                  color="pink"
                  completed={countCompleted('prescription', medications.length)}
                >
                  {medications.map((med, index) => (
                    <CompactItem
                      key={`prescription-${index}`}
                      itemKey={`prescription-${index}`}
                      label={med.name}
                      price={0}
                      subLabel={med.dosage ? `${med.dosage} - ${med.frequency || ''}` : undefined}
                    />
                  ))}
                </CompactSection>
              )}
            </div>
          )}

          {/* Mensaje vacio */}
          {totalItems === 0 && (
            <div className="text-center py-6 text-gray-400">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay procedimientos registrados</p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
});

// Display name para debugging
TreatmentChecklistSection.displayName = 'TreatmentChecklistSection';
