/**
 * Servicio de integración con API real para Planes de Tratamiento (Treatment Plans)
 * Reemplaza el uso de Mock Data por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Tratamientos Aplicados de clínica.
 */

import { treatmentPlansApi, type TreatmentPlanData, type TreatmentPlanProcedureData } from '@/services/api/treatmentPlansApi';
import { patientsApi } from '@/services/api/patientsApi';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Patient, TreatmentPlan } from '@/types';

/**
 * Mapea el estado del backend al formato del frontend
 */
const mapStatusIdToStatus = (statusId?: number): TreatmentPlan['status'] => {
  const statusMap: Record<number, TreatmentPlan['status']> = {
    1: 'draft',       // Borrador
    2: 'active',      // Activo
    3: 'completed',   // Completado
    4: 'cancelled'    // Cancelado
  };
  return statusMap[statusId || 1] || 'draft';
};

/**
 * Mapea el estado del frontend al ID del backend
 */
const mapStatusToStatusId = (status: TreatmentPlan['status']): number => {
  const statusMap: Record<TreatmentPlan['status'], number> = {
    'draft': 1,
    'active': 2,
    'completed': 3,
    'cancelled': 4
  };
  return statusMap[status] || 1;
};

/**
 * Mapea la prioridad del backend al frontend
 */
const mapPriorityToFrontend = (priority?: string): TreatmentPlan['priority'] => {
  const priorityLower = (priority || 'normal').toLowerCase();
  if (priorityLower === 'high' || priorityLower === 'alta') return 'high';
  if (priorityLower === 'low' || priorityLower === 'baja') return 'low';
  return 'normal';
};

/**
 * Mapea el estado del procedimiento del backend al frontend
 */
const mapProcedureStatus = (status?: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
  const statusLower = (status || 'pending').toLowerCase();
  if (statusLower.includes('progress') || statusLower.includes('curso')) return 'in_progress';
  if (statusLower.includes('complete') || statusLower.includes('completado')) return 'completed';
  if (statusLower.includes('cancel') || statusLower.includes('cancelado')) return 'cancelled';
  return 'pending';
};

/**
 * Mapea los datos del procedimiento del backend al frontend
 */
const mapBackendProcedureToFrontend = (backendProcedure: TreatmentPlanProcedureData): TreatmentPlan['procedures'][0] => {
  return {
    id: backendProcedure.procedure_id?.toString() || '',
    name: backendProcedure.procedure_name || 'Procedimiento',
    description: backendProcedure.notes || '',
    status: mapProcedureStatus(backendProcedure.status),
    cost: backendProcedure.estimated_cost || backendProcedure.actual_cost || 0,
    duration: 60, // Duración por defecto (el backend no tiene este campo)
    tooth: backendProcedure.tooth_number,
    surface: backendProcedure.tooth_surface,
    scheduledDate: backendProcedure.scheduled_date ? new Date(backendProcedure.scheduled_date) : undefined,
    completedDate: backendProcedure.completed_date ? new Date(backendProcedure.completed_date) : undefined,
    notes: backendProcedure.notes
  };
};

/**
 * Mapea los datos del plan del backend al frontend
 */
const mapBackendTreatmentPlanToFrontend = (backendPlan: TreatmentPlanData): TreatmentPlan => {
  return {
    id: backendPlan.treatment_plan_id?.toString() || '',
    patientId: backendPlan.patient_id?.toString() || '',
    title: backendPlan.plan_name || 'Plan de Tratamiento',
    description: backendPlan.description || '',
    diagnosis: backendPlan.diagnosis,
    status: mapStatusIdToStatus(backendPlan.status_id),
    priority: mapPriorityToFrontend(backendPlan.priority),
    startDate: backendPlan.start_date ? new Date(backendPlan.start_date) : new Date(),
    estimatedEndDate: backendPlan.estimated_end_date ? new Date(backendPlan.estimated_end_date) : undefined,
    actualEndDate: backendPlan.actual_end_date ? new Date(backendPlan.actual_end_date) : undefined,
    totalCost: backendPlan.total_estimated_cost || backendPlan.total_actual_cost || 0,
    doctorId: backendPlan.dentist_id?.toString() || '',
    procedures: (backendPlan.procedures || []).map(mapBackendProcedureToFrontend),
    notes: backendPlan.notes,
    createdAt: backendPlan.created_at ? new Date(backendPlan.created_at) : new Date(),
    updatedAt: backendPlan.updated_at ? new Date(backendPlan.updated_at) : new Date()
  };
};

/**
 * Mapea los datos del plan del frontend al backend
 */
const mapFrontendTreatmentPlanToBackend = (frontendPlan: Partial<TreatmentPlan>, branchId: number = 1, dentistId: number = 1): Partial<TreatmentPlanData> => {
  const backendData: Partial<TreatmentPlanData> = {};

  if (frontendPlan.patientId) backendData.patient_id = parseInt(frontendPlan.patientId);
  if (frontendPlan.title) backendData.plan_name = frontendPlan.title;
  if (frontendPlan.description !== undefined) backendData.description = frontendPlan.description;
  if (frontendPlan.diagnosis !== undefined) backendData.diagnosis = frontendPlan.diagnosis;
  if (frontendPlan.status) backendData.status_id = mapStatusToStatusId(frontendPlan.status);
  if (frontendPlan.priority) backendData.priority = frontendPlan.priority;
  if (frontendPlan.startDate) {
    const date = new Date(frontendPlan.startDate);
    backendData.start_date = formatDateToYMD(date);
  }
  if (frontendPlan.estimatedEndDate) {
    const date = new Date(frontendPlan.estimatedEndDate);
    backendData.estimated_end_date = formatDateToYMD(date);
  }
  if (frontendPlan.totalCost !== undefined) backendData.total_estimated_cost = frontendPlan.totalCost;
  if (frontendPlan.doctorId) backendData.dentist_id = parseInt(frontendPlan.doctorId);
  if (frontendPlan.notes !== undefined) backendData.notes = frontendPlan.notes;

  // Valores por defecto requeridos por el backend
  backendData.branch_id = branchId;
  if (!backendData.dentist_id) backendData.dentist_id = dentistId;

  return backendData;
};

/**
 * Mapea paciente del backend al formato frontend
 */
const mapBackendPatientToFrontend = (backendPatient: any): Patient => {
  return {
    id: backendPatient.patient_id?.toString() || '',
    firstName: backendPatient.first_name || '',
    lastName: backendPatient.last_name || '',
    dni: backendPatient.identification_number || '',
    phone: backendPatient.mobile || '',
    email: backendPatient.email || '',
    birthDate: backendPatient.birth_date ? new Date(backendPatient.birth_date) : new Date(),
    gender: backendPatient.gender_id === 1 ? 'male' : 'female',
    address: backendPatient.address || '',
    district: backendPatient.district || '',
    province: backendPatient.province || '',
    department: backendPatient.department || '',
    occupation: backendPatient.occupation || '',
    emergencyContact: backendPatient.emergency_contact_name ? {
      name: backendPatient.emergency_contact_name,
      phone: backendPatient.emergency_contact_phone || '',
      relationship: backendPatient.emergency_contact_relationship || ''
    } : undefined,
    allergies: backendPatient.allergies || '',
    chronicDiseases: backendPatient.chronic_diseases || '',
    currentMedications: backendPatient.current_medications || '',
    insuranceCompany: backendPatient.insurance_company || '',
    insurancePolicyNumber: backendPatient.insurance_policy_number || '',
    companyId: backendPatient.company_id?.toString(),
    ruc: backendPatient.ruc || '',
    businessName: backendPatient.business_name || '',
    referralSource: backendPatient.referral_source || '',
    notes: backendPatient.notes || '',
    photoUrl: backendPatient.profile_photo_url || '',
    esClienteNuevo: backendPatient.is_new_client ?? true,
    createdAt: new Date(backendPatient.created_at || new Date()),
    updatedAt: new Date(backendPatient.updated_at || new Date())
  };
};

export const TreatmentPlanApiService = {
  /**
   * Carga todos los planes de tratamiento desde el backend
   */
  async loadTreatmentPlans(filters?: { branchId?: number; patientId?: number; dentistId?: number }): Promise<TreatmentPlan[]> {
    try {
      const response = await treatmentPlansApi.getTreatmentPlans({
        branch_id: filters?.branchId,
        patient_id: filters?.patientId,
        dentist_id: filters?.dentistId,
        limit: 1000
      });

      return response.data.map(mapBackendTreatmentPlanToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los pacientes
   */
  async loadPatients(): Promise<Patient[]> {
    try {
      const response = await patientsApi.getPatients({ limit: 1000 });
      return response.data.map(mapBackendPatientToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo plan de tratamiento
   */
  async createTreatmentPlan(plan: TreatmentPlan, branchId: number = 1): Promise<TreatmentPlan> {
    try {
      const backendData = mapFrontendTreatmentPlanToBackend(plan, branchId) as TreatmentPlanData;

      // Validar campos requeridos
      if (!backendData.patient_id || !backendData.dentist_id || !backendData.plan_name) {
        throw new Error('Faltan campos requeridos para crear el plan de tratamiento');
      }

      const response = await treatmentPlansApi.createTreatmentPlan(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendTreatmentPlanToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un plan de tratamiento existente
   */
  async updateTreatmentPlan(planId: string, planData: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    try {
      const planIdNum = parseInt(planId);
      const backendData = mapFrontendTreatmentPlanToBackend(planData);

      const response = await treatmentPlansApi.updateTreatmentPlan(planIdNum, backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendTreatmentPlanToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un plan de tratamiento
   */
  async deleteTreatmentPlan(planId: string): Promise<void> {
    try {
      const planIdNum = parseInt(planId);
      await treatmentPlansApi.deleteTreatmentPlan(planIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene planes de un paciente
   */
  async getTreatmentPlansByPatient(patientId: string): Promise<TreatmentPlan[]> {
    try {
      const patientIdNum = parseInt(patientId);
      const response = await treatmentPlansApi.getTreatmentPlans({
        patient_id: patientIdNum,
        limit: 1000
      });

      return response.data.map(mapBackendTreatmentPlanToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Aprueba un plan de tratamiento
   */
  async approveTreatmentPlan(planId: string): Promise<TreatmentPlan> {
    try {
      const planIdNum = parseInt(planId);
      const response = await treatmentPlansApi.approveTreatmentPlan(planIdNum);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendTreatmentPlanToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }
};
