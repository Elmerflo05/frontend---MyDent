/**
 * CONSENTS API SERVICE
 * Servicio para comunicación con API de consentimientos informados
 */

import httpClient from './httpClient';

// Tipos para templates de consentimiento (respuesta de API)
export interface ConsentTemplateApi {
  consent_template_id: number;
  template_name: string;
  template_code: string;
  template_category: string;
  template_content: string;
  is_active: boolean;
  version: number;
  status: string;
  date_time_registration: string;
  date_time_modification: string | null;
}

// Tipo para uso en frontend (mapeado del formato hardcodeado)
export interface ConsentTemplate {
  id: string;
  nombre: string;
  categoria: string;
  contenido: string;
  ultimaActualizacion: Date;
  templateId?: number; // ID real de la BD para crear signed consents
}

// Tipos para consentimientos firmados (respuesta de API)
export interface SignedConsentApi {
  signed_consent_id: number;
  patient_id: number;
  consent_template_id: number;
  consultation_id: number | null;
  appointment_id: number | null;
  consent_date: string;
  consent_content: string;
  signature_data: string | null;
  signed_by: string | null;
  witness_name: string | null;
  witness_signature_data: string | null;
  notes: string | null;
  status: string;
  date_time_registration: string;
  // Campos joined
  patient_name: string;
  identification_number: string;
  template_name: string;
  template_category: string;
}

// Tipo para uso en frontend
// NOTA: fechaConsentimiento se mantiene como string (YYYY-MM-DD) para evitar
// problemas de timezone que ocurren al usar new Date() con strings de fecha
export interface SignedConsent {
  id: string;
  pacienteId: string;
  consentimientoId: string;
  consentimientoNombre: string;
  consentimientoCategoria: string;
  doctorId?: string;
  doctorNombre: string;
  doctorCop: string;
  pacienteNombre: string;
  pacienteDni: string;
  pacienteDomicilio?: string;
  tieneRepresentante?: boolean;
  representanteNombre?: string;
  representanteDni?: string;
  representanteDomicilio?: string;
  firmaPaciente?: string;
  firmaDoctor?: string;
  fechaConsentimiento: string; // Mantener como string para evitar desfase de timezone
  observaciones?: string;
  documentoHTML: string;
  estado: string;
  createdAt?: Date;
}

// Payload para crear consentimiento firmado
export interface CreateSignedConsentPayload {
  patient_id: number;
  consent_template_id: number;
  consultation_id?: number;
  appointment_id?: number;
  consent_date: string;
  consent_content: string; // HTML del documento firmado
  signature_data?: string; // Firma del paciente (base64)
  signed_by?: string; // Nombre de quien firma
  witness_name?: string; // Nombre del testigo/doctor
  witness_signature_data?: string; // Firma del testigo/doctor (base64)
  notes?: string;
}

// Tipo de respuesta del backend
interface ApiResponseTemplates {
  success: boolean;
  data: ConsentTemplateApi[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  error?: string;
}

interface ApiResponseSignedConsents {
  success: boolean;
  data: SignedConsentApi[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  error?: string;
}

class ConsentsApiService {
  private readonly basePath = '/consents';

  // =====================
  // TEMPLATES
  // =====================

  /**
   * Obtener todos los templates de consentimiento activos
   */
  async getTemplates(params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ templates: ConsentTemplate[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category && params.category !== 'all') {
      queryParams.append('consent_type', params.category);
    }
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `${this.basePath}/templates${query ? `?${query}` : ''}`;

    // httpClient.get retorna directamente el JSON: { success, data, pagination }
    const response = await httpClient.get(url) as ApiResponseTemplates;

    console.log('[ConsentsAPI] Response templates:', response);

    if (!response.success) {
      throw new Error(response.error || 'Error al obtener templates');
    }

    // response.data es el array de templates
    const templatesData = response.data || [];

    // Mapear a formato del frontend
    const templates: ConsentTemplate[] = templatesData.map(t => this.mapTemplateToFrontend(t));

    return {
      templates,
      total: response.pagination?.total || templates.length
    };
  }

  /**
   * Obtener un template por ID
   */
  async getTemplateById(id: number): Promise<ConsentTemplate> {
    const response = await httpClient.get(`${this.basePath}/templates/${id}`) as {
      success: boolean;
      data: ConsentTemplateApi;
      error?: string;
    };

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Template no encontrado');
    }

    return this.mapTemplateToFrontend(response.data);
  }

  /**
   * Obtener categorías únicas de los templates
   */
  async getCategories(): Promise<string[]> {
    const { templates } = await this.getTemplates({ limit: 100 });
    const categories = new Set(templates.map(t => t.categoria));
    return ['all', ...Array.from(categories)];
  }

  // =====================
  // SIGNED CONSENTS
  // =====================

  /**
   * Obtener consentimientos firmados
   */
  async getSignedConsents(params?: {
    patient_id?: number;
    consent_template_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ consents: SignedConsent[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.consent_template_id) queryParams.append('consent_template_id', params.consent_template_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `${this.basePath}/signed${query ? `?${query}` : ''}`;

    const response = await httpClient.get(url) as ApiResponseSignedConsents;

    console.log('[ConsentsAPI] Response signed:', response);

    if (!response.success) {
      throw new Error(response.error || 'Error al obtener consentimientos firmados');
    }

    const consentsData = response.data || [];
    const consents: SignedConsent[] = consentsData.map(c => this.mapSignedConsentToFrontend(c));

    return {
      consents,
      total: response.pagination?.total || consents.length
    };
  }

  /**
   * Obtener un consentimiento firmado por ID
   */
  async getSignedConsentById(id: number): Promise<SignedConsent> {
    const response = await httpClient.get(`${this.basePath}/signed/${id}`) as {
      success: boolean;
      data: SignedConsentApi;
      error?: string;
    };

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Consentimiento no encontrado');
    }

    return this.mapSignedConsentToFrontend(response.data);
  }

  /**
   * Crear un nuevo consentimiento firmado
   */
  async createSignedConsent(payload: CreateSignedConsentPayload): Promise<SignedConsent> {
    console.log('[ConsentsAPI] createSignedConsent - Enviando:', payload);

    const response = await httpClient.post(`${this.basePath}/signed`, payload) as {
      success: boolean;
      data: SignedConsentApi;
      error?: string;
    };

    console.log('[ConsentsAPI] createSignedConsent - Respuesta:', response);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al guardar consentimiento');
    }

    return this.mapSignedConsentToFrontend(response.data);
  }

  /**
   * Eliminar un consentimiento firmado
   */
  async deleteSignedConsent(id: number): Promise<void> {
    const response = await httpClient.delete(`${this.basePath}/signed/${id}`) as {
      success: boolean;
      error?: string;
    };

    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar consentimiento');
    }
  }

  // =====================
  // HELPERS
  // =====================

  private mapTemplateToFrontend(template: ConsentTemplateApi): ConsentTemplate {
    return {
      id: template.template_code || template.consent_template_id.toString(),
      nombre: template.template_name,
      categoria: template.template_category || 'General',
      contenido: template.template_content,
      ultimaActualizacion: template.date_time_modification
        ? new Date(template.date_time_modification)
        : new Date(template.date_time_registration),
      templateId: template.consent_template_id
    };
  }

  private mapSignedConsentToFrontend(consent: SignedConsentApi): SignedConsent {
    // ====== LOGS DE DIAGNÓSTICO DE FECHA ======
    console.log('📅 [consentsApiService] MAPEO DE FECHA - ENTRADA:', {
      consent_date_raw: consent.consent_date,
      tipo_consent_date_raw: typeof consent.consent_date,
      signed_consent_id: consent.signed_consent_id,
      patient_name: consent.patient_name
    });

    // Extraer información del signed_by (formato: "Paciente: nombre | Doctor: nombre COP: cop")
    let doctorNombre = '';
    let doctorCop = '';

    if (consent.signed_by) {
      const doctorMatch = consent.signed_by.match(/Doctor:\s*([^|]+?)(?:\s*COP:\s*(\S+))?$/i);
      if (doctorMatch) {
        doctorNombre = doctorMatch[1]?.trim() || '';
        doctorCop = doctorMatch[2]?.trim() || '';
      }
    }

    // Si hay witness_name, usarlo como nombre del doctor
    if (consent.witness_name) {
      doctorNombre = consent.witness_name;
    }

    const resultado = {
      id: consent.signed_consent_id.toString(),
      pacienteId: consent.patient_id.toString(),
      consentimientoId: consent.consent_template_id.toString(),
      consentimientoNombre: consent.template_name || 'Consentimiento',
      consentimientoCategoria: consent.template_category || 'General',
      doctorNombre: doctorNombre || 'Doctor',
      doctorCop: doctorCop || '-',
      pacienteNombre: consent.patient_name,
      pacienteDni: consent.identification_number || '',
      firmaPaciente: consent.signature_data || undefined,
      firmaDoctor: consent.witness_signature_data || undefined,
      fechaConsentimiento: consent.consent_date, // Mantener como string para evitar desfase de timezone
      observaciones: consent.notes || undefined,
      documentoHTML: consent.consent_content,
      estado: consent.status,
      createdAt: new Date(consent.date_time_registration)
    };

    console.log('📅 [consentsApiService] MAPEO DE FECHA - SALIDA:', {
      fechaConsentimiento_mapeada: resultado.fechaConsentimiento,
      tipo_fechaConsentimiento: typeof resultado.fechaConsentimiento
    });

    return resultado;
  }
}

export const consentsApiService = new ConsentsApiService();
export default consentsApiService;
