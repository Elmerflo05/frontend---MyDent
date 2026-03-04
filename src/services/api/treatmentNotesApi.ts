/**
 * API Service para Notas de Tratamiento
 * Maneja notas clínicas durante los tratamientos con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface TreatmentNoteData {
  note_id?: number;
  treatment_id: number;
  patient_id: number;
  dentist_id: number;
  note_date: string;
  note_type?: string;
  note_content: string;
  is_private?: boolean;
  attachments?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  created_at?: string;
  updated_at?: string;

  // Datos relacionados (joins)
  patient_name?: string;
  dentist_name?: string;
  treatment_name?: string;
}

export interface TreatmentNotesListResponse {
  success: boolean;
  data: TreatmentNoteData[];
}

export interface TreatmentNoteResponse {
  success: boolean;
  data: TreatmentNoteData;
  message?: string;
}

export interface TreatmentNoteFilters {
  treatment_id?: number;
  patient_id?: number;
  dentist_id?: number;
  note_type?: string;
  is_private?: boolean;
  follow_up_required?: boolean;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

class TreatmentNotesApiService {
  /**
   * Obtiene todas las notas de tratamiento con filtros opcionales
   */
  async getTreatmentNotes(filters?: TreatmentNoteFilters): Promise<TreatmentNotesListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.treatment_id) params.append('treatment_id', filters.treatment_id.toString());
      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.note_type) params.append('note_type', filters.note_type);
      if (filters?.is_private !== undefined) params.append('is_private', filters.is_private.toString());
      if (filters?.follow_up_required !== undefined) params.append('follow_up_required', filters.follow_up_required.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/treatment-notes${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<TreatmentNotesListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una nota de tratamiento por su ID
   */
  async getTreatmentNoteById(noteId: number): Promise<TreatmentNoteResponse> {
    try {
      const response = await httpClient.get<TreatmentNoteResponse>(`/treatment-notes/${noteId}`);

      if (!response.success || !response.data) {
        throw new Error('Nota de tratamiento no encontrada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las notas de un tratamiento específico
   */
  async getNotesByTreatmentId(treatmentId: number): Promise<TreatmentNoteData[]> {
    try {
      const response = await this.getTreatmentNotes({
        treatment_id: treatmentId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las notas de un paciente
   */
  async getNotesByPatientId(patientId: number): Promise<TreatmentNoteData[]> {
    try {
      const response = await this.getTreatmentNotes({
        patient_id: patientId,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva nota de tratamiento
   */
  async createTreatmentNote(noteData: TreatmentNoteData): Promise<TreatmentNoteResponse> {
    try {
      const response = await httpClient.post<TreatmentNoteResponse>('/treatment-notes', noteData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear nota de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una nota de tratamiento existente
   */
  async updateTreatmentNote(noteId: number, noteData: Partial<TreatmentNoteData>): Promise<TreatmentNoteResponse> {
    try {
      const response = await httpClient.put<TreatmentNoteResponse>(`/treatment-notes/${noteId}`, noteData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar nota de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una nota de tratamiento
   */
  async deleteTreatmentNote(noteId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/treatment-notes/${noteId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar nota de tratamiento');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene notas que requieren seguimiento
   */
  async getFollowUpNotes(dentistId?: number): Promise<TreatmentNoteData[]> {
    try {
      const response = await this.getTreatmentNotes({
        dentist_id: dentistId,
        follow_up_required: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene notas privadas (solo visibles para el dentista que las creó)
   */
  async getPrivateNotes(dentistId: number, patientId?: number): Promise<TreatmentNoteData[]> {
    try {
      const response = await this.getTreatmentNotes({
        dentist_id: dentistId,
        patient_id: patientId,
        is_private: true,
        limit: 1000
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una nota como completada (seguimiento realizado)
   */
  async markFollowUpComplete(noteId: number): Promise<TreatmentNoteResponse> {
    try {
      return await this.updateTreatmentNote(noteId, {
        follow_up_required: false
      });
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const treatmentNotesApi = new TreatmentNotesApiService();
export default treatmentNotesApi;
