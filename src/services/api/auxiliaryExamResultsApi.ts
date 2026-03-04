/**
 * API Service para Resultados de Examenes Auxiliares (Paso 6 - Atencion Integral)
 *
 * Maneja la comunicacion con el backend para operaciones de:
 * - Consulta de resultados por consulta/paciente
 * - Crear/actualizar resultados (upsert)
 * - Subir archivos externos
 * - Eliminar archivos
 * - Actualizar observaciones del doctor
 */

import { httpClient, ApiResponse } from './httpClient';

// Obtener la URL base de la API desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';
// URL base del servidor (sin /api) para archivos estáticos (uploads)
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Clave del token en localStorage
const TOKEN_KEY = 'dental_clinic_token';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Archivo externo subido
 */
export interface ExternalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  uploadedAt: string;
}

/**
 * Datos del resultado de examenes auxiliares
 */
export interface AuxiliaryExamResultData {
  auxiliary_exam_result_id: number;
  consultation_id: number;
  patient_id: number;
  dentist_id: number;
  doctor_observations: string | null;
  external_files: ExternalFile[];
  status: string;
  date_time_registration: string;
  date_time_modification?: string;
  // Datos relacionados (opcionales, dependiendo del include)
  patients?: {
    patient_id: number;
    first_name: string;
    last_name: string;
    identification_number?: string;
  };
  dentists?: {
    dentist_id: number;
    users?: {
      first_name: string;
      last_name: string;
    };
  };
  consultations?: {
    consultation_id: number;
    consultation_date: string;
    chief_complaint?: string;
  };
}

/**
 * Respuesta de la API para un resultado
 */
export interface AuxiliaryExamResultResponse extends ApiResponse {
  data?: AuxiliaryExamResultData | null;
  wasUpdated?: boolean;
}

/**
 * Respuesta de la API para lista de resultados
 */
export interface AuxiliaryExamResultsListResponse extends ApiResponse {
  data?: AuxiliaryExamResultData[];
  count?: number;
}

/**
 * Datos para crear o actualizar un resultado
 */
export interface UpsertAuxiliaryExamResultData {
  consultation_id: number;
  patient_id?: number;
  dentist_id?: number;
  doctor_observations?: string;
  external_files?: ExternalFile[];
}

/**
 * Respuesta de subida de archivo
 */
export interface UploadFileResponse extends ApiResponse {
  data?: {
    file: ExternalFile;
    result: AuxiliaryExamResultData;
  };
}

/**
 * Examen externo subido por el paciente desde su portal
 */
export interface PatientExternalExam {
  external_exam_id: number;
  patient_id: number;
  exam_type: 'file' | 'link';
  file_name: string | null;
  original_name: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  date_time_registration: string;
}

/**
 * Respuesta de examenes externos del paciente
 */
export interface PatientExternalExamsResponse extends ApiResponse {
  data?: PatientExternalExam[];
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Obtener token de localStorage
 */
const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error al obtener token de localStorage:', error);
    return null;
  }
};

/**
 * Obtener resultado por consultation_id
 * @param consultationId - ID de la consulta
 */
export const getByConsultationId = async (
  consultationId: number
): Promise<AuxiliaryExamResultResponse> => {
  return httpClient.get<AuxiliaryExamResultData | null>(
    `/auxiliary-exam-results/consultation/${consultationId}`
  );
};

/**
 * Obtener todos los resultados de un paciente
 * @param patientId - ID del paciente
 */
export const getByPatientId = async (
  patientId: number
): Promise<AuxiliaryExamResultsListResponse> => {
  return httpClient.get<AuxiliaryExamResultData[]>(
    `/auxiliary-exam-results/patient/${patientId}`
  );
};

/**
 * Obtener resultado por ID
 * @param id - ID del resultado
 */
export const getById = async (
  id: number
): Promise<AuxiliaryExamResultResponse> => {
  return httpClient.get<AuxiliaryExamResultData>(
    `/auxiliary-exam-results/${id}`
  );
};

/**
 * Crear o actualizar resultado (upsert)
 * @param data - Datos del resultado
 */
export const upsertResult = async (
  data: UpsertAuxiliaryExamResultData
): Promise<AuxiliaryExamResultResponse> => {
  return httpClient.post<AuxiliaryExamResultData>(
    '/auxiliary-exam-results/upsert',
    data
  );
};

/**
 * Subir archivo externo
 * Usa fetch directamente para manejar FormData correctamente
 *
 * @param consultationId - ID de la consulta
 * @param file - Archivo a subir
 * @param patientId - ID del paciente (opcional, requerido si no existe registro)
 * @param dentistId - ID del dentista (opcional, requerido si no existe registro)
 */
export const uploadExternalFile = async (
  consultationId: number,
  file: File,
  patientId?: number,
  dentistId?: number
): Promise<UploadFileResponse> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No se encontro token de autenticacion');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (patientId) formData.append('patient_id', patientId.toString());
    if (dentistId) formData.append('dentist_id', dentistId.toString());

    const response = await fetch(
      `${API_BASE_URL}/auxiliary-exam-results/consultation/${consultationId}/upload-file`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO incluir Content-Type - el navegador lo establece automaticamente
        },
        body: formData
      }
    );

    const data: UploadFileResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Error al subir archivo');
    }

    return data;
  } catch (error: any) {
    console.error('Error al subir archivo externo:', error);
    throw new Error(error.message || 'Error al subir archivo');
  }
};

/**
 * Eliminar archivo externo
 * @param consultationId - ID de la consulta
 * @param fileId - ID del archivo a eliminar
 */
export const deleteExternalFile = async (
  consultationId: number,
  fileId: string
): Promise<ApiResponse> => {
  return httpClient.delete(
    `/auxiliary-exam-results/consultation/${consultationId}/file/${fileId}`
  );
};

/**
 * Actualizar observaciones del doctor
 * @param consultationId - ID de la consulta
 * @param observations - Observaciones del doctor
 */
export const updateObservations = async (
  consultationId: number,
  observations: string
): Promise<AuxiliaryExamResultResponse> => {
  return httpClient.put<AuxiliaryExamResultData>(
    `/auxiliary-exam-results/consultation/${consultationId}/observations`,
    { observations }
  );
};

/**
 * Construir URL completa para un archivo
 * @param filePath - Ruta relativa del archivo
 */
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  // Si ya es una URL completa, retornarla
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Construir URL completa (archivos estáticos se sirven desde la raíz del servidor, sin /api)
  return `${SERVER_BASE_URL}${filePath}`;
};

/**
 * Obtener examenes externos subidos por el paciente desde su portal
 * @param patientId - ID del paciente
 */
export const getPatientExternalExams = async (
  patientId: number
): Promise<PatientExternalExamsResponse> => {
  return httpClient.get<PatientExternalExam[]>(
    `/auxiliary-exam-results/patient/${patientId}/external-exams`
  );
};

/**
 * Construir URL para archivo de examen externo del paciente
 * @param fileName - Nombre del archivo
 */
export const getPatientExternalExamFileUrl = (fileName: string): string => {
  if (!fileName) return '';
  return `${SERVER_BASE_URL}/uploads/patient_external_exams/${fileName}`;
};

// Exportar API como objeto
export const auxiliaryExamResultsApi = {
  getByConsultationId,
  getByPatientId,
  getById,
  upsertResult,
  uploadExternalFile,
  deleteExternalFile,
  updateObservations,
  getFileUrl,
  getPatientExternalExams,
  getPatientExternalExamFileUrl
};

export default auxiliaryExamResultsApi;
