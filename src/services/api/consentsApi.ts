/**
 * API Service para Consentimientos Informados
 * Maneja consentimientos médicos de pacientes con el backend
 */

import httpClient, { ApiResponse } from './httpClient';
import { formatDateToYMD } from '@/utils/dateUtils';

export interface ConsentData {
  // Campos de la tabla signed_consents
  signed_consent_id?: number;
  consent_id?: number; // Alias para compatibilidad
  patient_id: number;
  consent_template_id?: number;
  consultation_id?: number;
  appointment_id?: number;
  consent_date: string;
  consent_content: string;
  signature_data?: string;
  signed_by?: number;
  witness_name?: string;
  witness_signature_data?: string;
  notes?: string;
  status?: string;
  date_time_registration?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  identification_number?: string;
  template_name?: string;
  template_category?: string;

  // Campos de compatibilidad con el frontend
  consent_type?: string;
  consent_title?: string;
  is_signed?: boolean;
  signed_by_name?: string;
}

export interface ConsentsListResponse {
  success: boolean;
  data: ConsentData[];
}

export interface ConsentResponse {
  success: boolean;
  data: ConsentData;
  message?: string;
}

export interface ConsentFilters {
  patient_id?: number;
  consent_template_id?: number;
  page?: number;
  limit?: number;
}

class ConsentsApiService {
  /**
   * Mapea los datos del backend al formato esperado por el frontend
   */
  private mapConsentData(consent: any): ConsentData {
    return {
      ...consent,
      consent_id: consent.signed_consent_id,
      consent_type: consent.template_category || 'general',
      consent_title: consent.template_name || 'Consentimiento Informado',
      is_signed: consent.status === 'active' && consent.consent_content ? true : false
    };
  }

  /**
   * Obtiene todos los consentimientos firmados con filtros opcionales
   */
  async getConsents(filters?: ConsentFilters): Promise<ConsentsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.consent_template_id) params.append('consent_template_id', filters.consent_template_id.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/consents/signed${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ConsentsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: (response.data || []).map(this.mapConsentData)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un consentimiento por su ID
   */
  async getConsentById(consentId: number): Promise<ConsentResponse> {
    try {
      const response = await httpClient.get<ConsentResponse>(`/consents/signed/${consentId}`);

      if (!response.success || !response.data) {
        throw new Error('Consentimiento no encontrado');
      }

      return {
        ...response,
        data: this.mapConsentData(response.data)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los consentimientos de un paciente
   */
  async getConsentsByPatientId(patientId: number): Promise<ConsentData[]> {
    try {
      const response = await this.getConsents({
        patient_id: patientId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo consentimiento firmado
   */
  async createConsent(consentData: Partial<ConsentData>): Promise<ConsentResponse> {
    try {
      // Mapear campos del frontend al formato del backend
      const backendData = {
        patient_id: consentData.patient_id,
        consent_template_id: consentData.consent_template_id || null,
        consultation_id: consentData.consultation_id || null,
        appointment_id: consentData.appointment_id || null,
        consent_date: consentData.consent_date || formatDateToYMD(new Date()),
        consent_content: consentData.consent_content,
        signature_data: consentData.signature_data || null,
        signed_by: consentData.signed_by || null,
        witness_name: consentData.witness_name || null,
        witness_signature_data: consentData.witness_signature_data || null,
        notes: consentData.notes || null
      };

      const response = await httpClient.post<ConsentResponse>('/consents/signed', backendData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear consentimiento');
      }

      return {
        ...response,
        data: this.mapConsentData(response.data)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un consentimiento (soft delete)
   */
  async deleteConsent(consentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/consents/signed/${consentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar consentimiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const consentsApi = new ConsentsApiService();
export default consentsApi;
