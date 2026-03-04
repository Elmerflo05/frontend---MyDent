/**
 * API Service para Laboratorio
 * Maneja solicitudes y servicios de laboratorio con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface LaboratoryRequestData {
  request_id?: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  service_id: number;
  request_date: string;
  requested_delivery_date?: string;
  actual_delivery_date?: string;
  priority?: string;
  status?: string;
  clinical_indications?: string;
  special_instructions?: string;
  results_file_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LaboratoryServiceData {
  service_id?: number;
  service_name: string;
  description?: string;
  estimated_time_days?: number;
  base_price?: number;
  service_category?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

class LaboratoryApiService {
  async getLaboratoryRequests(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.patient_id) params.append('patient_id', filters.patient_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await httpClient.get(`/laboratory/requests?${params.toString()}`);
    return { success: response.success || true, data: response.data || [] };
  }

  async getLaboratoryRequestById(requestId: number) {
    return await httpClient.get(`/laboratory/requests/${requestId}`);
  }

  async createLaboratoryRequest(requestData: LaboratoryRequestData) {
    return await httpClient.post('/laboratory/requests', requestData);
  }

  async updateLaboratoryRequest(requestId: number, requestData: Partial<LaboratoryRequestData>) {
    return await httpClient.put(`/laboratory/requests/${requestId}`, requestData);
  }

  async deleteLaboratoryRequest(requestId: number) {
    return await httpClient.delete(`/laboratory/requests/${requestId}`);
  }

  async getLaboratoryServices() {
    const response = await httpClient.get('/laboratory/services');
    return { success: response.success || true, data: response.data || [] };
  }

  async getLaboratoryServiceById(serviceId: number) {
    return await httpClient.get(`/laboratory/services/${serviceId}`);
  }

  async createLaboratoryService(serviceData: LaboratoryServiceData) {
    return await httpClient.post('/laboratory/services', serviceData);
  }

  async updateLaboratoryService(serviceId: number, serviceData: Partial<LaboratoryServiceData>) {
    return await httpClient.put(`/laboratory/services/${serviceId}`, serviceData);
  }

  async deleteLaboratoryService(serviceId: number) {
    return await httpClient.delete(`/laboratory/services/${serviceId}`);
  }
}

export const laboratoryApi = new LaboratoryApiService();
export default laboratoryApi;
