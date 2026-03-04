/**
 * API Service para Health Plan Dependents (Dependientes del Plan Familiar)
 */

import httpClient, { ApiResponse } from './httpClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface DependentData {
  dependent_id: number;
  subscription_id: number;
  patient_id: number;
  relationship: 'conyuge' | 'hijo' | 'hija' | 'padre' | 'madre' | 'otro';
  relationship_description: string | null;
  is_active: boolean;
  status: string;
  // Datos del paciente dependiente (joined)
  first_name?: string;
  last_name?: string;
  identification_number?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  // Datos de la suscripcion (joined)
  subscription_number?: string;
  plan_name?: string;
}

export interface PatientCoverage {
  subscription_id: number;
  subscription_status: string;
  approval_status: string;
  start_date: string;
  end_date: string | null;
  first_free_consultation_used: boolean;
  health_plan_id: number;
  plan_name: string;
  plan_code: string;
  monthly_fee: number;
  coverage_type: 'titular' | 'dependiente';
  relationship?: string;
  titular_name?: string;
}

export interface CoveredPatient {
  patient_id: number;
  first_name: string;
  last_name: string;
  identification_number: string;
  type: 'titular' | 'dependiente';
  relationship: string | null;
}

export interface DependentsListResponse {
  success: boolean;
  data: DependentData[];
  total: number;
}

export interface DependentResponse {
  success: boolean;
  data: DependentData;
  message?: string;
}

export interface CoverageResponse {
  success: boolean;
  has_coverage: boolean;
  data: PatientCoverage | null;
  message?: string;
}

export interface CoveredPatientsResponse {
  success: boolean;
  data: CoveredPatient[];
  total: number;
}

export interface CreateDependentData {
  patient_id: number;
  relationship: 'conyuge' | 'hijo' | 'hija' | 'padre' | 'madre' | 'otro';
  relationship_description?: string;
}

// ============================================================================
// SERVICIO API
// ============================================================================

class HealthPlanDependentsApiService {
  /**
   * Verificar cobertura de un paciente (titular o dependiente)
   */
  async checkPatientCoverage(patientId: number): Promise<CoverageResponse> {
    const response = await httpClient.get<CoverageResponse>(
      `/health-plan-dependents/patient/${patientId}/coverage`
    );
    return response as CoverageResponse;
  }

  /**
   * Obtener todos los pacientes cubiertos por una suscripcion
   */
  async getCoveredPatients(subscriptionId: number): Promise<CoveredPatientsResponse> {
    const response = await httpClient.get<CoveredPatientsResponse>(
      `/health-plan-dependents/subscription/${subscriptionId}/covered-patients`
    );
    return response as CoveredPatientsResponse;
  }

  /**
   * Obtener dependientes de una suscripcion
   */
  async getDependentsBySubscription(subscriptionId: number): Promise<DependentsListResponse> {
    const response = await httpClient.get<DependentsListResponse>(
      `/health-plan-dependents/subscription/${subscriptionId}`
    );
    return response as DependentsListResponse;
  }

  /**
   * Obtener dependiente por ID
   */
  async getDependentById(dependentId: number): Promise<DependentResponse> {
    const response = await httpClient.get<DependentResponse>(
      `/health-plan-dependents/${dependentId}`
    );
    return response as DependentResponse;
  }

  /**
   * Agregar dependiente a una suscripcion
   */
  async addDependent(subscriptionId: number, data: CreateDependentData): Promise<DependentResponse> {
    const response = await httpClient.post<DependentResponse>(
      `/health-plan-dependents/subscription/${subscriptionId}`,
      data
    );
    return response as DependentResponse;
  }

  /**
   * Actualizar dependiente
   */
  async updateDependent(dependentId: number, data: Partial<CreateDependentData>): Promise<DependentResponse> {
    const response = await httpClient.put<DependentResponse>(
      `/health-plan-dependents/${dependentId}`,
      data
    );
    return response as DependentResponse;
  }

  /**
   * Eliminar dependiente
   */
  async removeDependent(dependentId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/health-plan-dependents/${dependentId}`);
    return response;
  }
}

// Exportar instancia singleton
export const healthPlanDependentsApi = new HealthPlanDependentsApiService();
export default healthPlanDependentsApi;
