/**
 * API Service para Documentos de Pacientes
 * Maneja documentos, archivos y consentimientos de pacientes con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface PatientDocumentData {
  document_id?: number;
  patient_id: number;
  document_type?: string;
  document_name: string;
  description?: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: number;
  upload_date?: string;
  is_sensitive?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  uploaded_by_name?: string;
}

export interface PatientDocumentsListResponse {
  success: boolean;
  data: PatientDocumentData[];
}

export interface PatientDocumentResponse {
  success: boolean;
  data: PatientDocumentData;
  message?: string;
}

export interface PatientDocumentFilters {
  patient_id?: number;
  document_type?: string;
  uploaded_by?: number;
  is_sensitive?: boolean;
  limit?: number;
}

class PatientDocumentsApiService {
  /**
   * Obtiene todos los documentos de pacientes con filtros opcionales
   */
  async getPatientDocuments(filters?: PatientDocumentFilters): Promise<PatientDocumentsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.document_type) params.append('document_type', filters.document_type);
      if (filters?.uploaded_by) params.append('uploaded_by', filters.uploaded_by.toString());
      if (filters?.is_sensitive !== undefined) params.append('is_sensitive', filters.is_sensitive.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/patient-documents${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<PatientDocumentsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un documento por su ID
   */
  async getPatientDocumentById(documentId: number): Promise<PatientDocumentResponse> {
    try {
      const response = await httpClient.get<PatientDocumentResponse>(`/patient-documents/${documentId}`);

      if (!response.success || !response.data) {
        throw new Error('Documento no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los documentos de un paciente específico
   */
  async getDocumentsByPatientId(patientId: number): Promise<PatientDocumentData[]> {
    try {
      const response = await this.getPatientDocuments({
        patient_id: patientId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo documento de paciente
   */
  async createPatientDocument(documentData: PatientDocumentData): Promise<PatientDocumentResponse> {
    try {
      const response = await httpClient.post<PatientDocumentResponse>('/patient-documents', documentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear documento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sube un archivo de documento (multipart/form-data)
   */
  async uploadDocument(file: File, documentData: Partial<PatientDocumentData>): Promise<PatientDocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Agregar metadata del documento
      Object.keys(documentData).forEach(key => {
        const value = documentData[key as keyof PatientDocumentData];
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await httpClient.post<PatientDocumentResponse>('/patient-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al subir documento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un documento existente
   */
  async updatePatientDocument(documentId: number, documentData: Partial<PatientDocumentData>): Promise<PatientDocumentResponse> {
    try {
      const response = await httpClient.put<PatientDocumentResponse>(`/patient-documents/${documentId}`, documentData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar documento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async deletePatientDocument(documentId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/patient-documents/${documentId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar documento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Descarga un documento
   */
  async downloadDocument(documentId: number): Promise<Blob> {
    try {
      const response = await httpClient.get(`/patient-documents/${documentId}/download`, {
        responseType: 'blob'
      });

      return response as unknown as Blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene documentos sensibles de un paciente (requiere permisos especiales)
   */
  async getSensitiveDocuments(patientId: number): Promise<PatientDocumentData[]> {
    try {
      const response = await this.getPatientDocuments({
        patient_id: patientId,
        is_sensitive: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const patientDocumentsApi = new PatientDocumentsApiService();
export default patientDocumentsApi;
