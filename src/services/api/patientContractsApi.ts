/**
 * API Service para Contratos de Pacientes
 * Maneja contratos de tratamiento y financiamiento con el backend
 */

import httpClient, { ApiResponse } from './httpClient';
import { formatDateToYMD } from '@/utils/dateUtils';

export interface PatientContractData {
  contract_id?: number;
  patient_id: number;
  company_id?: number;
  treatment_plan_id?: number;
  contract_type: string;
  contract_number?: string;
  contract_date: string;
  start_date: string;
  end_date?: string;
  total_amount: number;
  payment_method?: string;
  installments?: number;
  installment_amount?: number;
  contract_status?: string;
  terms_and_conditions?: string;
  special_clauses?: string;
  signed_by_patient?: boolean;
  patient_signature_date?: string;
  patient_signature_data?: string;
  signed_by_doctor?: boolean;
  doctor_signature_date?: string;
  doctor_id?: number;
  contract_file_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  company_name?: string;
  doctor_name?: string;
}

export interface PatientContractsListResponse {
  success: boolean;
  data: PatientContractData[];
}

export interface PatientContractResponse {
  success: boolean;
  data: PatientContractData;
  message?: string;
}

export interface PatientContractFilters {
  patient_id?: number;
  company_id?: number;
  treatment_plan_id?: number;
  contract_type?: string;
  contract_status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

class PatientContractsApiService {
  /**
   * Obtiene todos los contratos con filtros opcionales
   */
  async getPatientContracts(filters?: PatientContractFilters): Promise<PatientContractsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.company_id) params.append('company_id', filters.company_id.toString());
      if (filters?.treatment_plan_id) params.append('treatment_plan_id', filters.treatment_plan_id.toString());
      if (filters?.contract_type) params.append('contract_type', filters.contract_type);
      if (filters?.contract_status) params.append('contract_status', filters.contract_status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/patient-contracts${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PatientContractsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un contrato por su ID
   */
  async getPatientContractById(contractId: number): Promise<PatientContractResponse> {
    try {
      const response = await httpClient.get<PatientContractResponse>(`/patient-contracts/${contractId}`);

      if (!response.success || !response.data) {
        throw new Error('Contrato no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los contratos de un paciente
   */
  async getContractsByPatientId(patientId: number): Promise<PatientContractData[]> {
    try {
      const response = await this.getPatientContracts({
        patient_id: patientId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo contrato
   */
  async createPatientContract(contractData: PatientContractData): Promise<PatientContractResponse> {
    try {
      const response = await httpClient.post<PatientContractResponse>('/patient-contracts', contractData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo contrato con archivo PDF adjunto usando FormData
   */
  async uploadContractWithFile(contractData: {
    patient_id: number;
    branch_id: number;
    contract_type: string;
    contract_date: string;
    start_date: string;
    notes?: string;
    contract_content?: string;
  }, file: File): Promise<PatientContractResponse> {
    try {
      const formData = new FormData();

      // Agregar datos del contrato
      formData.append('patient_id', contractData.patient_id.toString());
      formData.append('branch_id', contractData.branch_id.toString());
      formData.append('contract_type', contractData.contract_type);
      formData.append('contract_date', contractData.contract_date);
      formData.append('start_date', contractData.start_date);
      if (contractData.notes) {
        formData.append('notes', contractData.notes);
      }
      if (contractData.contract_content) {
        formData.append('contract_content', contractData.contract_content);
      }

      // Agregar archivo PDF
      formData.append('contract_file', file);

      const response = await httpClient.post<PatientContractResponse>('/patient-contracts', formData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un contrato existente
   */
  async updatePatientContract(contractId: number, contractData: Partial<PatientContractData>): Promise<PatientContractResponse> {
    try {
      const response = await httpClient.put<PatientContractResponse>(`/patient-contracts/${contractId}`, contractData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un contrato
   */
  async deletePatientContract(contractId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/patient-contracts/${contractId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Firma un contrato por parte del paciente
   */
  async signContractByPatient(contractId: number, signatureData: string): Promise<PatientContractResponse> {
    try {
      return await this.updatePatientContract(contractId, {
        signed_by_patient: true,
        patient_signature_date: formatDateToYMD(new Date()),
        patient_signature_data: signatureData
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Firma un contrato por parte del doctor
   */
  async signContractByDoctor(contractId: number, doctorId: number): Promise<PatientContractResponse> {
    try {
      return await this.updatePatientContract(contractId, {
        signed_by_doctor: true,
        doctor_signature_date: formatDateToYMD(new Date()),
        doctor_id: doctorId
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el estado de un contrato
   */
  async updateContractStatus(contractId: number, status: string): Promise<PatientContractResponse> {
    try {
      return await this.updatePatientContract(contractId, {
        contract_status: status
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene contratos activos
   */
  async getActiveContracts(patientId?: number): Promise<PatientContractData[]> {
    try {
      const response = await this.getPatientContracts({
        patient_id: patientId,
        contract_status: 'active',
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene contratos pendientes de firma
   */
  async getPendingContracts(patientId?: number): Promise<PatientContractData[]> {
    try {
      const response = await this.getPatientContracts({
        patient_id: patientId,
        contract_status: 'pending',
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Descarga un contrato como PDF
   */
  async downloadContractPDF(contractId: number): Promise<Blob> {
    try {
      const response = await httpClient.get(`/patient-contracts/${contractId}/download`, {
        responseType: 'blob'
      });

      return response as unknown as Blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Genera un contrato a partir de un plan de tratamiento
   */
  async generateContractFromTreatmentPlan(treatmentPlanId: number, contractData: Partial<PatientContractData>): Promise<PatientContractResponse> {
    try {
      const response = await httpClient.post<PatientContractResponse>('/patient-contracts/generate-from-treatment', {
        treatment_plan_id: treatmentPlanId,
        ...contractData
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al generar contrato');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const patientContractsApi = new PatientContractsApiService();
export default patientContractsApi;
