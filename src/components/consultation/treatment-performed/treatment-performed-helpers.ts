/**
 * Funciones de utilidad para el paso de Tratamiento Realizado
 * Integracion con APIs reales del backend (procedure_history, procedure_income, evolution_odontogram)
 */

import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';
import { procedureHistoryApi, type ProcedureHistoryData } from '@/services/api/procedureHistoryApi';
import { procedureIncomeApi, type ProcedureIncomeData } from '@/services/api/procedureIncomeApi';
import { evolutionOdontogramApi, type EvolutionOdontogramData } from '@/services/api/evolutionOdontogramApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { TreatmentHistoryEntry } from '@/types';

/**
 * Calcular presupuesto total consolidado
 */
export const calculateTreatmentBudget = (
  odontogramConditions: any[],
  diagnosticExams: any[],
  customExams: any[]
) => {
  // Calcular total de procedimientos del odontograma
  const odontogramTotal = odontogramConditions.reduce((total, condition) => {
    const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === condition.conditionId);
    const price = officialCondition?.price || condition.price || 100;
    return total + price;
  }, 0);

  // Calcular total de examenes de diagnostico
  const diagnosticTotal = diagnosticExams.reduce((total: number, exam: any) => {
    return total + (exam.price || 0);
  }, 0);

  // Calcular total de examenes personalizados
  const customExamsTotal = customExams.reduce((total: number, exam: any) => {
    return total + (exam.estimatedPrice || 0);
  }, 0);

  return {
    odontogramTotal,
    diagnosticTotal,
    customExamsTotal,
    consolidatedTotal: odontogramTotal + diagnosticTotal + customExamsTotal
  };
};

/**
 * Transformar ProcedureHistoryData del backend a TreatmentHistoryEntry del frontend
 */
const transformToTreatmentHistoryEntry = (data: ProcedureHistoryData): TreatmentHistoryEntry => {
  return {
    id: data.procedure_history_id?.toString() || '',
    patientId: data.patient_id?.toString() || '',
    doctorId: data.performed_by_dentist_id?.toString() || '',
    appointmentId: undefined,
    date: data.performed_date ? new Date(data.performed_date) : new Date(),
    treatmentData: {
      appliedTreatments: [],
      performedProcedures: [{
        name: data.procedure_name,
        code: data.procedure_code,
        tooth: data.tooth_number,
        surface: data.surface_code,
        status: data.procedure_status
      }],
      odontogramState: {
        teeth: {},
        notes: data.clinical_notes || '',
        lastUpdated: data.date_time_registration ? new Date(data.date_time_registration) : new Date()
      },
      observations: data.clinical_notes || '',
      complications: data.complications || undefined,
      nextAppointment: undefined,
      checklistSavedAt: data.date_time_registration ? new Date(data.date_time_registration) : undefined,
      doctorComment: data.dentist_name ? `Tratamiento realizado por ${data.dentist_name}${data.dentist_cop ? ` - COP: ${data.dentist_cop}` : ''}` : undefined
    },
    createdAt: data.date_time_registration ? new Date(data.date_time_registration) : new Date(),
    updatedAt: data.date_time_registration ? new Date(data.date_time_registration) : new Date(),
    createdBy: data.performed_by_dentist_id?.toString() || ''
  };
};

/**
 * Guardar tratamiento realizado en el historial (usa APIs reales)
 */
export const saveTreatmentToHistory = async (
  selectedPatient: any,
  currentRecord: any
): Promise<void> => {
  try {
    // Validar datos requeridos
    const patientId = parseInt(selectedPatient?.patient_id || selectedPatient?.id);
    const dentistId = parseInt(currentRecord.dentistId || currentRecord.doctorId);
    const consultationId = parseInt(currentRecord.consultationId || currentRecord.consultation_id);
    const branchId = parseInt(currentRecord.branchId || currentRecord.branch_id || 1);

    if (!patientId || !dentistId || !consultationId) {
      console.warn('saveTreatmentToHistory: Faltan datos requeridos', { patientId, dentistId, consultationId });
      return;
    }

    // Crear registro en procedure_history
    const procedureData: Omit<ProcedureHistoryData, 'procedure_history_id'> = {
      consultation_id: consultationId,
      patient_id: patientId,
      procedure_name: currentRecord.treatmentPerformed || 'Tratamiento realizado',
      procedure_type: 'treatment',
      procedure_status: 'completed',
      procedure_result: 'successful',
      performed_by_dentist_id: dentistId,
      performed_date: formatDateToYMD(new Date()),
      clinical_notes: currentRecord.treatmentPerformed || '',
      complications: currentRecord.complications || null,
      next_steps: currentRecord.followUpDate ? `Proxima cita: ${currentRecord.followUpDate}` : null
    };

    const historyResponse = await procedureHistoryApi.createProcedureHistory(procedureData);
    console.log('Procedimiento guardado en historial:', historyResponse);

    // Si hay tratamientos aplicados con precio, crear registros de ingreso
    if (currentRecord.appliedTreatments && currentRecord.appliedTreatments.length > 0) {
      for (const treatment of currentRecord.appliedTreatments) {
        const incomeData: Omit<ProcedureIncomeData, 'income_id'> = {
          procedure_history_id: historyResponse.data.procedure_history_id,
          consultation_id: consultationId,
          patient_id: patientId,
          branch_id: branchId,
          income_type: 'treatment',
          item_name: treatment.name || treatment.procedure_name || 'Tratamiento',
          amount: treatment.price || treatment.amount || 0,
          performed_by_dentist_id: dentistId,
          income_status: 'confirmed'
        };

        await procedureIncomeApi.createProcedureIncome(incomeData);
      }
    }

  } catch (error) {
    console.error('Error al guardar tratamiento en historial:', error);
    throw error;
  }
};

/**
 * Cargar ultimo tratamiento realizado del historial (usa API real)
 */
export const loadLastTreatment = async (
  patientId: string | number
): Promise<TreatmentHistoryEntry | null> => {
  try {
    const numericPatientId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
    if (isNaN(numericPatientId)) return null;

    const history = await procedureHistoryApi.getPatientProcedureHistory(numericPatientId);

    if (history && history.length > 0) {
      return transformToTreatmentHistoryEntry(history[0]);
    }

    return null;
  } catch (error) {
    console.error('Error al cargar ultimo tratamiento:', error);
    return null;
  }
};

/**
 * Cargar historial completo de tratamientos (usa API real)
 */
export const loadTreatmentHistory = async (
  patientId: string | number
): Promise<TreatmentHistoryEntry[]> => {
  try {
    const numericPatientId = typeof patientId === 'string' ? parseInt(patientId) : patientId;
    if (isNaN(numericPatientId)) return [];

    const history = await procedureHistoryApi.getPatientProcedureHistory(numericPatientId);

    return history.map(transformToTreatmentHistoryEntry);
  } catch (error) {
    console.error('Error al cargar historial de tratamientos:', error);
    return [];
  }
};

/**
 * Calcular progreso del tratamiento
 */
export const calculateTreatmentProgress = (
  completedTreatments: Record<string, boolean>,
  totalItems: number
) => {
  const completedItems = Object.values(completedTreatments).filter(Boolean).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return {
    completedItems,
    totalItems,
    progress: Math.round(progress)
  };
};

/**
 * Marcar un procedimiento como realizado (crea registros en las 3 tablas)
 */
export const markProcedureAsCompleted = async (params: {
  consultationId: number;
  patientId: number;
  branchId: number;
  dentistId: number;
  procedureName: string;
  procedureCode?: string;
  procedureType: 'odontogram' | 'treatment' | 'additional_service';
  toothPositionId?: number;
  toothSurfaceId?: number;
  originalConditionId?: number;
  originalConditionName?: string;
  amount: number;
  clinicalNotes?: string;
  batchId?: string;
}): Promise<{
  procedureHistory: ProcedureHistoryData;
  procedureIncome: ProcedureIncomeData;
  evolution: EvolutionOdontogramData;
}> => {
  const today = formatDateToYMD(new Date());

  // 1. Crear registro en procedure_history
  const historyData: Omit<ProcedureHistoryData, 'procedure_history_id'> = {
    consultation_id: params.consultationId,
    patient_id: params.patientId,
    tooth_position_id: params.toothPositionId || null,
    tooth_surface_id: params.toothSurfaceId || null,
    procedure_name: params.procedureName,
    procedure_code: params.procedureCode || null,
    procedure_type: params.procedureType,
    procedure_status: 'completed',
    procedure_result: 'successful',
    performed_by_dentist_id: params.dentistId,
    performed_date: today,
    clinical_notes: params.clinicalNotes || null,
    odontogram_condition_id: params.originalConditionId || null
  };

  const historyResponse = await procedureHistoryApi.createProcedureHistory(historyData);

  // 2. Crear registro en procedure_income
  const incomeData: Omit<ProcedureIncomeData, 'income_id'> = {
    procedure_history_id: historyResponse.data.procedure_history_id,
    consultation_id: params.consultationId,
    patient_id: params.patientId,
    branch_id: params.branchId,
    income_type: params.procedureType === 'odontogram' ? 'odontogram_procedure' : params.procedureType,
    item_name: params.procedureName,
    tooth_position_id: params.toothPositionId || null,
    amount: params.amount,
    performed_by_dentist_id: params.dentistId,
    performed_date: today,
    clinical_notes: params.clinicalNotes || null,
    income_status: 'confirmed',
    batch_id: params.batchId || null
  };

  const incomeResponse = await procedureIncomeApi.createProcedureIncome(incomeData);

  // 3. Crear/actualizar registro en evolution_odontogram (solo si hay tooth_position_id)
  let evolutionResponse: any = null;
  if (params.toothPositionId) {
    const evolutionData: Omit<EvolutionOdontogramData, 'evolution_id'> = {
      patient_id: params.patientId,
      consultation_id: params.consultationId,
      procedure_history_id: historyResponse.data.procedure_history_id,
      income_id: incomeResponse.data.income_id,
      tooth_position_id: params.toothPositionId,
      tooth_surface_id: params.toothSurfaceId || null,
      condition_status: 'completed', // Azul
      original_condition_id: params.originalConditionId || null,
      original_condition_name: params.originalConditionName || null,
      registered_by_dentist_id: params.dentistId,
      registered_date: today,
      clinical_observation: params.clinicalNotes || null
    };

    evolutionResponse = await evolutionOdontogramApi.upsertEvolutionOdontogram(evolutionData);
  }

  return {
    procedureHistory: historyResponse.data,
    procedureIncome: incomeResponse.data,
    evolution: evolutionResponse?.data || null
  };
};

/**
 * Obtener evolucion del odontograma de un paciente
 */
export const getPatientEvolution = async (patientId: number) => {
  try {
    return await evolutionOdontogramApi.getPatientEvolution(patientId);
  } catch (error) {
    console.error('Error al obtener evolucion del paciente:', error);
    return { raw: [], grouped: [] };
  }
};

/**
 * Obtener resumen de evolucion de un paciente
 */
export const getPatientEvolutionSummary = async (patientId: number) => {
  try {
    return await evolutionOdontogramApi.getPatientEvolutionSummary(patientId);
  } catch (error) {
    console.error('Error al obtener resumen de evolucion:', error);
    return {
      pending: { count: 0, teeth: 0 },
      in_progress: { count: 0, teeth: 0 },
      completed: { count: 0, teeth: 0 }
    };
  }
};
