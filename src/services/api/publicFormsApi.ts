/**
 * API Service para Formularios Publicos y sus Envios
 *
 * Endpoints del backend:
 * - /api/public-forms/forms - CRUD de plantillas de formularios (requiere auth)
 * - /api/public-forms/submissions - CRUD de envios (POST publico, resto requiere auth)
 */

import httpClient, { ApiResponse } from './httpClient';
import type { PublicForm, PublicFormSubmission, FormFieldConfig } from '@/types';

// ============================================================================
// INTERFACES DEL BACKEND
// ============================================================================

/**
 * Datos de formulario del backend (plantilla)
 */
export interface PublicFormBackendData {
  public_form_id?: number;
  branch_id: number;
  form_name: string;
  form_code?: string;
  form_description?: string;
  form_type: string;
  form_config: {
    services?: string[];
    requiredFields?: FormFieldConfig[];
    optionalFields?: FormFieldConfig[];
    successMessage?: string;
    redirectUrl?: string;
    [key: string]: any;
  };
  is_active?: boolean;
  require_authentication?: boolean;
  success_message?: string;
  redirect_url?: string;
  status?: string;
  date_time_registration?: string;
  date_time_modification?: string;
  // Datos relacionados
  branch_name?: string;
}

/**
 * Datos de envio del backend
 */
export interface FormSubmissionBackendData {
  submission_id?: number;
  public_form_id: number;
  submission_data: {
    nombre?: string;
    telefono?: string;
    email?: string;
    edad?: string;
    dni?: string;
    motivoConsulta?: string;
    serviciosSolicitados?: string[];
    [key: string]: any;
  };
  submitted_at?: string;
  submitter_ip?: string;
  submitter_email?: string;
  submission_status?: string;
  processed_by?: number;
  processed_at?: string;
  notes?: string;
  status?: string;
  // Datos relacionados del join
  form_name?: string;
  form_code?: string;
  form_type?: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Convierte datos del backend a formato frontend (PublicForm)
 */
const mapFormBackendToFrontend = (data: PublicFormBackendData): PublicForm => {
  return {
    id: data.public_form_id?.toString() || '',
    code: data.form_code || '',
    title: data.form_name || '',
    description: data.form_description || '',
    createdBy: '', // No disponible directamente desde el backend
    active: data.is_active ?? true,
    services: data.form_config?.services || [],
    requiredFields: data.form_config?.requiredFields || [],
    optionalFields: data.form_config?.optionalFields || [],
    createdAt: data.date_time_registration ? new Date(data.date_time_registration) : new Date(),
    updatedAt: data.date_time_modification ? new Date(data.date_time_modification) : new Date()
  };
};

/**
 * Convierte datos del frontend a formato backend (PublicForm)
 */
const mapFormFrontendToBackend = (form: Partial<PublicForm>, branchId: number = 1): Partial<PublicFormBackendData> => {
  const data: Partial<PublicFormBackendData> = {
    branch_id: branchId
  };

  if (form.title !== undefined) data.form_name = form.title;
  if (form.code !== undefined) data.form_code = form.code;
  if (form.description !== undefined) data.form_description = form.description;
  if (form.active !== undefined) data.is_active = form.active;

  // form_type es requerido
  data.form_type = 'general';

  // Configuracion del formulario
  data.form_config = {
    services: form.services || [],
    requiredFields: form.requiredFields || [],
    optionalFields: form.optionalFields || []
  };

  return data;
};

/**
 * Convierte datos del backend a formato frontend (PublicFormSubmission)
 */
const mapSubmissionBackendToFrontend = (data: FormSubmissionBackendData): PublicFormSubmission => {
  // Mapear status del backend al frontend
  const statusMap: Record<string, PublicFormSubmission['status']> = {
    'pending': 'nuevo',
    'contacted': 'contactado',
    'scheduled': 'agendado',
    'completed': 'completado',
    'archived': 'archivado'
  };

  return {
    id: data.submission_id?.toString() || '',
    formId: data.public_form_id?.toString() || '',
    formCode: data.form_code || '',
    formTitle: data.form_name || '',
    status: statusMap[data.submission_status || 'pending'] || 'nuevo',
    formType: (data.form_type as 'simple' | 'radiography') || 'simple',
    data: data.submission_data || {},
    submittedAt: data.submitted_at ? new Date(data.submitted_at) : new Date(),
    contactedAt: data.processed_at ? new Date(data.processed_at) : undefined,
    contactedBy: data.processed_by?.toString(),
    notes: data.notes
  };
};

/**
 * Convierte datos del frontend a formato backend (Submission)
 */
const mapSubmissionFrontendToBackend = (submission: Partial<PublicFormSubmission>): Partial<FormSubmissionBackendData> => {
  const data: Partial<FormSubmissionBackendData> = {};

  if (submission.formId !== undefined) data.public_form_id = parseInt(submission.formId);
  if (submission.data !== undefined) data.submission_data = submission.data;

  // Mapear status del frontend al backend
  const statusMap: Record<string, string> = {
    'nuevo': 'pending',
    'contactado': 'contacted',
    'agendado': 'scheduled',
    'completado': 'completed',
    'archivado': 'archived'
  };

  if (submission.status !== undefined) {
    data.submission_status = statusMap[submission.status] || 'pending';
  }

  if (submission.notes !== undefined) data.notes = submission.notes;

  return data;
};

// ============================================================================
// RESPONSES
// ============================================================================

export interface FormsListResponse {
  success: boolean;
  data: PublicFormBackendData[];
}

export interface FormResponse {
  success: boolean;
  data: PublicFormBackendData;
  message?: string;
}

export interface SubmissionsListResponse {
  success: boolean;
  data: FormSubmissionBackendData[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubmissionResponse {
  success: boolean;
  data: FormSubmissionBackendData;
  message?: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

class PublicFormsApiService {
  // ==================== FORMS (Plantillas) ====================

  /**
   * Obtiene todos los formularios
   */
  async getForms(): Promise<PublicForm[]> {
    try {
      const response = await httpClient.get<FormsListResponse>('/public-forms/forms');
      if (!response.success) throw new Error('Error al obtener formularios');
      return (response.data || []).map(mapFormBackendToFrontend);
    } catch (error) {
      console.error('Error al obtener formularios:', error);
      throw error;
    }
  }

  /**
   * Obtiene formularios activos
   */
  async getActiveForms(): Promise<PublicForm[]> {
    try {
      const forms = await this.getForms();
      return forms.filter(f => f.active);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un formulario por ID
   */
  async getFormById(formId: number): Promise<PublicForm> {
    try {
      const response = await httpClient.get<FormResponse>(`/public-forms/forms/${formId}`);
      if (!response.success || !response.data) throw new Error('Formulario no encontrado');
      return mapFormBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca un formulario por codigo
   */
  async getFormByCode(code: string): Promise<PublicForm | undefined> {
    try {
      const forms = await this.getForms();
      return forms.find(f => f.code === code);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Crea un nuevo formulario
   */
  async createForm(formData: Omit<PublicForm, 'id' | 'createdAt' | 'updatedAt'>, branchId: number = 1): Promise<PublicForm> {
    try {
      const backendData = mapFormFrontendToBackend(formData, branchId);
      const response = await httpClient.post<FormResponse>('/public-forms/forms', backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear formulario');
      }
      return mapFormBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un formulario existente
   */
  async updateForm(formId: number, formData: Partial<PublicForm>, branchId?: number): Promise<PublicForm> {
    try {
      const backendData = mapFormFrontendToBackend(formData, branchId);
      const response = await httpClient.put<FormResponse>(`/public-forms/forms/${formId}`, backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar formulario');
      }
      return mapFormBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un formulario
   */
  async deleteForm(formId: number): Promise<void> {
    try {
      const response = await httpClient.delete(`/public-forms/forms/${formId}`);
      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar formulario');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activa/desactiva un formulario
   */
  async toggleFormStatus(formId: number, currentActive: boolean): Promise<PublicForm> {
    return this.updateForm(formId, { active: !currentActive });
  }

  // ==================== SUBMISSIONS (Envios) ====================

  /**
   * Obtiene todos los envios con filtros opcionales
   */
  async getSubmissions(filters?: {
    formId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ submissions: PublicFormSubmission[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.formId) params.append('public_form_id', filters.formId.toString());
      if (filters?.status) params.append('submission_status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/public-forms/submissions${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<SubmissionsListResponse>(endpoint);
      if (!response.success) throw new Error('Error al obtener envios');

      return {
        submissions: (response.data || []).map(mapSubmissionBackendToFrontend),
        total: response.pagination?.total || response.data?.length || 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los envios (sin filtros)
   */
  async getAllSubmissions(): Promise<PublicFormSubmission[]> {
    const result = await this.getSubmissions({ limit: 1000 });
    return result.submissions;
  }

  /**
   * Obtiene envios por formulario
   */
  async getSubmissionsByForm(formId: string): Promise<PublicFormSubmission[]> {
    const result = await this.getSubmissions({ formId: parseInt(formId), limit: 1000 });
    return result.submissions;
  }

  /**
   * Obtiene envios por estado
   */
  async getSubmissionsByStatus(status: PublicFormSubmission['status']): Promise<PublicFormSubmission[]> {
    // Mapear status frontend a backend
    const statusMap: Record<string, string> = {
      'nuevo': 'pending',
      'contactado': 'contacted',
      'agendado': 'scheduled',
      'completado': 'completed',
      'archivado': 'archived'
    };
    const result = await this.getSubmissions({ status: statusMap[status], limit: 1000 });
    return result.submissions;
  }

  /**
   * Obtiene un envio por ID
   */
  async getSubmissionById(submissionId: number): Promise<PublicFormSubmission> {
    try {
      const response = await httpClient.get<SubmissionResponse>(`/public-forms/submissions/${submissionId}`);
      if (!response.success || !response.data) throw new Error('Envio no encontrado');
      return mapSubmissionBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo envio (endpoint publico, no requiere auth)
   */
  async createSubmission(submissionData: Omit<PublicFormSubmission, 'id' | 'submittedAt'>): Promise<PublicFormSubmission> {
    try {
      const backendData = mapSubmissionFrontendToBackend(submissionData);
      const response = await httpClient.post<SubmissionResponse>('/public-forms/submissions', backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear envio');
      }
      return mapSubmissionBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un envio existente
   */
  async updateSubmission(submissionId: number, data: Partial<PublicFormSubmission>): Promise<PublicFormSubmission> {
    try {
      const backendData = mapSubmissionFrontendToBackend(data);
      const response = await httpClient.put<SubmissionResponse>(`/public-forms/submissions/${submissionId}`, backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar envio');
      }
      return mapSubmissionBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el estado de un envio
   */
  async updateSubmissionStatus(submissionId: number, status: PublicFormSubmission['status'], notes?: string): Promise<PublicFormSubmission> {
    return this.updateSubmission(submissionId, { status, notes });
  }

  /**
   * Marca un envio como contactado
   */
  async markAsContacted(submissionId: number, userId: string, notes?: string): Promise<PublicFormSubmission> {
    try {
      const backendData: Partial<FormSubmissionBackendData> = {
        submission_status: 'contacted',
        processed_by: parseInt(userId),
        processed_at: new Date().toISOString(),
        notes
      };
      const response = await httpClient.put<SubmissionResponse>(`/public-forms/submissions/${submissionId}`, backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al marcar como contactado');
      }
      return mapSubmissionBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un envio
   */
  async deleteSubmission(submissionId: number): Promise<void> {
    try {
      const response = await httpClient.delete(`/public-forms/submissions/${submissionId}`);
      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar envio');
      }
    } catch (error) {
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Genera un codigo unico para un formulario
   */
  async generateUniqueCode(length: number = 8): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    let exists = true;

    while (exists) {
      code = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const existing = await this.getFormByCode(code);
      exists = !!existing;
    }

    return code;
  }
}

// Exportar instancia singleton
export const publicFormsApi = new PublicFormsApiService();
export default publicFormsApi;
