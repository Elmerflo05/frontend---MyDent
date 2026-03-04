/**
 * API Service para Ordenes de Protesis
 *
 * Endpoints del backend:
 * - GET /api/prosthesis-orders - Listar ordenes con filtros
 * - GET /api/prosthesis-orders/:id - Obtener orden por ID
 * - POST /api/prosthesis-orders - Crear orden
 * - PUT /api/prosthesis-orders/:id - Actualizar orden
 * - DELETE /api/prosthesis-orders/:id - Eliminar orden
 */

import httpClient, { ApiResponse } from './httpClient';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';
import type { ProsthesisRequest } from '@/types';

// ============================================================================
// INTERFACES DEL BACKEND
// ============================================================================

/**
 * Datos de orden de protesis del backend
 */
export interface ProsthesisOrderBackendData {
  prosthesis_order_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  consultation_id?: number;
  order_date: string;
  prosthesis_type: string;
  description?: string;
  laboratory_name?: string;
  tooth_positions?: string;
  material?: string;
  color_shade?: string;
  order_status?: string;
  expected_date?: string;
  received_date?: string;
  cost?: number;
  notes?: string;
  status?: string;
  date_time_registration?: string;
  date_time_modification?: string;
  // Datos relacionados (joins)
  patient_first_name?: string;
  patient_last_name?: string;
  dentist_first_name?: string;
  dentist_last_name?: string;
  branch_name?: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Mapeo de estados: frontend -> backend
 */
const statusFrontendToBackend: Record<string, string> = {
  'pending': 'ordered',
  'sent': 'sent',
  'in_progress': 'in_progress',
  'received': 'received',
  'cancelled': 'cancelled'
};

/**
 * Mapeo de estados: backend -> frontend
 */
const statusBackendToFrontend: Record<string, ProsthesisRequest['status']> = {
  'ordered': 'pending',
  'sent': 'sent',
  'in_progress': 'in_progress',
  'received': 'received',
  'cancelled': 'cancelled',
  'pending': 'pending'
};

/**
 * Convierte datos del backend a formato frontend (ProsthesisRequest)
 * ✅ IMPORTANTE: Usa parseLocalDate para fechas tipo DATE (sin hora) para evitar desfase de timezone
 * Las fechas con hora (timestamps) pueden usar new Date() ya que incluyen la zona horaria
 */
const mapBackendToFrontend = (data: ProsthesisOrderBackendData): ProsthesisRequest => {
  return {
    id: data.prosthesis_order_id?.toString() || '',
    patientId: data.patient_id?.toString() || '',
    doctorId: data.dentist_id?.toString() || '',
    appointmentId: data.consultation_id?.toString(),
    medicalRecordId: undefined,
    description: data.description || '',
    prosthesisName: data.prosthesis_type || '',
    color: data.color_shade || '',
    specifications: data.material || '',
    toothNumbers: data.tooth_positions ? data.tooth_positions.split(',').map(t => t.trim()) : [],
    // ✅ Usar parseLocalDate para campos DATE (sin hora) - evita desfase de timezone
    deliveryDate: data.order_date ? parseLocalDate(data.order_date) : new Date(),
    tentativeDate: data.expected_date ? parseLocalDate(data.expected_date) : new Date(),
    receptionDate: data.received_date ? parseLocalDate(data.received_date) : undefined,
    status: statusBackendToFrontend[data.order_status || 'ordered'] || 'pending',
    createdBy: '',
    sedeId: data.branch_id?.toString() || '',
    notes: data.notes || '',
    // Timestamps con hora pueden usar new Date() ya que incluyen timezone info
    createdAt: data.date_time_registration ? new Date(data.date_time_registration) : new Date(),
    updatedAt: data.date_time_modification ? new Date(data.date_time_modification) : new Date()
  };
};

/**
 * Convierte datos del frontend a formato backend
 */
const mapFrontendToBackend = (request: Partial<ProsthesisRequest>): Partial<ProsthesisOrderBackendData> => {
  const data: Partial<ProsthesisOrderBackendData> = {};

  if (request.patientId !== undefined) data.patient_id = parseInt(request.patientId);
  if (request.doctorId !== undefined) data.dentist_id = parseInt(request.doctorId);
  if (request.sedeId !== undefined) data.branch_id = parseInt(request.sedeId);
  if (request.appointmentId !== undefined) data.consultation_id = parseInt(request.appointmentId);
  if (request.description !== undefined) data.description = request.description;
  if (request.prosthesisName !== undefined) data.prosthesis_type = request.prosthesisName;
  if (request.color !== undefined) data.color_shade = request.color;
  if (request.specifications !== undefined) data.material = request.specifications;
  if (request.toothNumbers !== undefined) data.tooth_positions = request.toothNumbers.join(', ');
  if (request.deliveryDate !== undefined) {
    data.order_date = request.deliveryDate instanceof Date
      ? formatDateToYMD(request.deliveryDate)
      : request.deliveryDate;
  }
  if (request.tentativeDate !== undefined) {
    data.expected_date = request.tentativeDate instanceof Date
      ? formatDateToYMD(request.tentativeDate)
      : request.tentativeDate;
  }
  if (request.receptionDate !== undefined) {
    data.received_date = request.receptionDate instanceof Date
      ? formatDateToYMD(request.receptionDate)
      : request.receptionDate;
  }
  if (request.status !== undefined) {
    data.order_status = statusFrontendToBackend[request.status] || 'ordered';
  }
  if (request.notes !== undefined) data.notes = request.notes;

  return data;
};

// ============================================================================
// RESPONSES
// ============================================================================

export interface ProsthesisOrdersListResponse {
  success: boolean;
  data: ProsthesisOrderBackendData[];
}

export interface ProsthesisOrderResponse {
  success: boolean;
  data: ProsthesisOrderBackendData;
  message?: string;
}

export interface ProsthesisOrderFilters {
  patient_id?: number;
  dentist_id?: number;
  branch_id?: number;
  order_status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// ============================================================================
// API SERVICE
// ============================================================================

class ProsthesisOrdersApiService {
  /**
   * Obtiene todas las ordenes de protesis con filtros opcionales
   */
  async getOrders(filters?: ProsthesisOrderFilters): Promise<ProsthesisRequest[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
      if (filters?.dentist_id) params.append('dentist_id', filters.dentist_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.order_status) params.append('order_status', filters.order_status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/prosthesis-orders${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<ProsthesisOrdersListResponse>(endpoint);

      if (!response.success) throw new Error('Error al obtener ordenes');

      return (response.data || []).map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error al obtener ordenes de protesis:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las ordenes (sin filtros)
   */
  async getAllOrders(): Promise<ProsthesisRequest[]> {
    return this.getOrders({ limit: 1000 });
  }

  /**
   * Obtiene ordenes por sede
   */
  async getOrdersBySede(sedeId: string): Promise<ProsthesisRequest[]> {
    return this.getOrders({ branch_id: parseInt(sedeId), limit: 1000 });
  }

  /**
   * Obtiene una orden por ID
   */
  async getOrderById(orderId: number): Promise<ProsthesisRequest> {
    try {
      const response = await httpClient.get<ProsthesisOrderResponse>(`/prosthesis-orders/${orderId}`);
      if (!response.success || !response.data) throw new Error('Orden no encontrada');
      return mapBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva orden
   */
  async createOrder(requestData: Omit<ProsthesisRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProsthesisRequest> {
    try {
      const backendData = mapFrontendToBackend(requestData);
      const response = await httpClient.post<ProsthesisOrderResponse>('/prosthesis-orders', backendData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear orden');
      }
      return mapBackendToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una orden existente
   */
  async updateOrder(orderId: number, updates: Partial<ProsthesisRequest>): Promise<ProsthesisRequest> {
    try {
      const backendData = mapFrontendToBackend(updates);
      const response = await httpClient.put<ProsthesisOrderResponse>(`/prosthesis-orders/${orderId}`, backendData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar orden');
      }
      return mapBackendToFrontend(response.data);
    } catch (error) {
      console.error('Error al actualizar orden de prótesis:', error);
      throw error;
    }
  }

  /**
   * Elimina una orden
   */
  async deleteOrder(orderId: number): Promise<void> {
    try {
      const response = await httpClient.delete(`/prosthesis-orders/${orderId}`);
      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar orden');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateStatus(orderId: number, status: ProsthesisRequest['status'], notes?: string): Promise<ProsthesisRequest> {
    return this.updateOrder(orderId, { status, notes });
  }

  /**
   * Marca una orden como recibida
   */
  async markAsReceived(orderId: number, receptionDate: Date, notes?: string): Promise<ProsthesisRequest> {
    return this.updateOrder(orderId, {
      status: 'received',
      receptionDate,
      notes
    });
  }

  /**
   * Obtiene ordenes por paciente
   */
  async getOrdersByPatient(patientId: string): Promise<ProsthesisRequest[]> {
    return this.getOrders({ patient_id: parseInt(patientId), limit: 1000 });
  }

  /**
   * Obtiene ordenes por doctor
   */
  async getOrdersByDoctor(doctorId: string): Promise<ProsthesisRequest[]> {
    return this.getOrders({ dentist_id: parseInt(doctorId), limit: 1000 });
  }

  /**
   * Obtiene ordenes pendientes
   */
  async getPendingOrders(sedeId?: string): Promise<ProsthesisRequest[]> {
    return this.getOrders({
      branch_id: sedeId ? parseInt(sedeId) : undefined,
      order_status: 'ordered',
      limit: 1000
    });
  }

  /**
   * Obtiene ordenes en progreso
   */
  async getInProgressOrders(sedeId?: string): Promise<ProsthesisRequest[]> {
    return this.getOrders({
      branch_id: sedeId ? parseInt(sedeId) : undefined,
      order_status: 'in_progress',
      limit: 1000
    });
  }
}

// Exportar instancia singleton
export const prosthesisOrdersApi = new ProsthesisOrdersApiService();
export default prosthesisOrdersApi;
