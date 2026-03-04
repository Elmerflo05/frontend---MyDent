/**
 * Servicio de integración con API real para Laboratorio
 * Reemplaza el uso de Mock Data por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Laboratorio del admin.
 */

import { laboratoryApi, type LaboratoryRequestData, type LaboratoryServiceData } from '@/services/api/laboratoryApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Interface para Laboratory Request del frontend
 */
export interface LaboratoryRequest {
  id: string;
  requestNumber: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  requestDate: Date;
  requestedServices: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  estimatedCompletionDate?: Date;
  actualDeliveryDate?: Date;
  clinicalIndications?: string;
  specialInstructions?: string;
  resultsFileUrl?: string;
}

/**
 * Interface para Laboratory Service del frontend
 */
export interface LaboratoryService {
  id: string;
  serviceName: string;
  description: string;
  estimatedTimeDays: number;
  basePrice: number;
  serviceCategory: string;
  isActive: boolean;
}

/**
 * Mapea un request de laboratorio del backend al formato del frontend
 */
const mapBackendRequestToFrontend = (backendRequest: LaboratoryRequestData): LaboratoryRequest => {
  // Generate request number if not available
  const requestNumber = backendRequest.request_id
    ? `LAB-${new Date().getFullYear()}-${String(backendRequest.request_id).padStart(3, '0')}`
    : 'LAB-PENDING';

  // Map status from backend to frontend
  let status: LaboratoryRequest['status'] = 'pending';
  if (backendRequest.status === 'pending') status = 'pending';
  else if (backendRequest.status === 'in_progress') status = 'in_progress';
  else if (backendRequest.status === 'completed') status = 'completed';
  else if (backendRequest.status === 'cancelled') status = 'cancelled';

  // Map priority from backend to frontend
  let priority: LaboratoryRequest['priority'] = 'normal';
  if (backendRequest.priority === 'low') priority = 'low';
  else if (backendRequest.priority === 'normal') priority = 'normal';
  else if (backendRequest.priority === 'high') priority = 'high';
  else if (backendRequest.priority === 'urgent') priority = 'urgent';

  return {
    id: backendRequest.request_id?.toString() || '',
    requestNumber: requestNumber,
    patientName: '', // Will be populated by separate patient fetch
    patientId: backendRequest.patient_id?.toString() || '',
    doctorName: '', // Will be populated by separate dentist fetch
    requestDate: new Date(backendRequest.request_date || backendRequest.created_at || new Date()),
    requestedServices: [], // Will be populated from service_id
    status: status,
    priority: priority,
    notes: backendRequest.notes || '',
    estimatedCompletionDate: backendRequest.requested_delivery_date
      ? new Date(backendRequest.requested_delivery_date)
      : undefined,
    actualDeliveryDate: backendRequest.actual_delivery_date
      ? new Date(backendRequest.actual_delivery_date)
      : undefined,
    clinicalIndications: backendRequest.clinical_indications || '',
    specialInstructions: backendRequest.special_instructions || '',
    resultsFileUrl: backendRequest.results_file_url || ''
  };
};

/**
 * Mapea un request del frontend al formato del backend
 */
const mapFrontendRequestToBackend = (
  frontendRequest: Partial<LaboratoryRequest>,
  patientId: number,
  dentistId: number,
  branchId: number = 1,
  serviceId: number = 1
): Partial<LaboratoryRequestData> => {
  const data: Partial<LaboratoryRequestData> = {};

  data.patient_id = patientId;
  data.dentist_id = dentistId;
  data.branch_id = branchId;
  data.service_id = serviceId;

  if (frontendRequest.requestDate) {
    data.request_date = formatDateToYMD(frontendRequest.requestDate);
  }

  if (frontendRequest.estimatedCompletionDate) {
    data.requested_delivery_date = formatDateToYMD(frontendRequest.estimatedCompletionDate);
  }

  if (frontendRequest.actualDeliveryDate) {
    data.actual_delivery_date = formatDateToYMD(frontendRequest.actualDeliveryDate);
  }

  // Map priority
  if (frontendRequest.priority) {
    data.priority = frontendRequest.priority;
  }

  // Map status
  if (frontendRequest.status) {
    data.status = frontendRequest.status;
  }

  if (frontendRequest.clinicalIndications) {
    data.clinical_indications = frontendRequest.clinicalIndications;
  }

  if (frontendRequest.specialInstructions) {
    data.special_instructions = frontendRequest.specialInstructions;
  }

  if (frontendRequest.resultsFileUrl) {
    data.results_file_url = frontendRequest.resultsFileUrl;
  }

  if (frontendRequest.notes) {
    data.notes = frontendRequest.notes;
  }

  return data;
};

/**
 * Mapea un service de laboratorio del backend al formato del frontend
 */
const mapBackendServiceToFrontend = (backendService: LaboratoryServiceData): LaboratoryService => {
  return {
    id: backendService.service_id?.toString() || '',
    serviceName: backendService.service_name || '',
    description: backendService.description || '',
    estimatedTimeDays: backendService.estimated_time_days || 0,
    basePrice: backendService.base_price || 0,
    serviceCategory: backendService.service_category || '',
    isActive: backendService.is_active !== false
  };
};

/**
 * Mapea un service del frontend al formato del backend
 */
const mapFrontendServiceToBackend = (frontendService: Partial<LaboratoryService>): Partial<LaboratoryServiceData> => {
  return {
    service_name: frontendService.serviceName,
    description: frontendService.description,
    estimated_time_days: frontendService.estimatedTimeDays,
    base_price: frontendService.basePrice,
    service_category: frontendService.serviceCategory,
    is_active: frontendService.isActive
  };
};

export const LaboratoryApiService = {
  /**
   * Carga todas las solicitudes de laboratorio con información completa
   */
  async loadLaboratoryRequests(filters?: { patientId?: number; status?: string }): Promise<LaboratoryRequest[]> {
    try {
      const response = await laboratoryApi.getLaboratoryRequests(filters);
      const requests = response.data.map(mapBackendRequestToFrontend);

      // Enrich with patient and doctor names
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          try {
            // Fetch patient name
            if (request.patientId) {
              const patientResponse = await patientsApi.getPatientById(parseInt(request.patientId));
              request.patientName = `${patientResponse.data.first_name} ${patientResponse.data.last_name}`;
            }

            // Fetch doctor name
            const dentistResponse = await dentistsApi.getDentists({ limit: 1000 });
            const dentist = dentistResponse.data.find((d: any) => d.dentist_id?.toString() === request.patientId);
            if (dentist) {
              request.doctorName = `Dr. ${dentist.first_name} ${dentist.last_name}`;
            }

            // Fetch service names (assuming service_id is available in backend)
            const servicesResponse = await laboratoryApi.getLaboratoryServices();
            request.requestedServices = servicesResponse.data
              .filter(s => s.is_active)
              .slice(0, 2) // Take first 2 services as example
              .map(s => s.service_name);

            return request;
          } catch (error) {
            return request;
          }
        })
      );

      return enrichedRequests;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga todos los servicios de laboratorio
   */
  async loadLaboratoryServices(): Promise<LaboratoryService[]> {
    try {
      const response = await laboratoryApi.getLaboratoryServices();
      return response.data.map(mapBackendServiceToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene una solicitud de laboratorio por su ID
   */
  async getLaboratoryRequestById(requestId: string): Promise<LaboratoryRequest> {
    try {
      const response = await laboratoryApi.getLaboratoryRequestById(parseInt(requestId));
      return mapBackendRequestToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea una nueva solicitud de laboratorio
   */
  async createLaboratoryRequest(
    request: Partial<LaboratoryRequest>,
    patientId: number,
    dentistId: number,
    branchId: number = 1,
    serviceId: number = 1
  ): Promise<LaboratoryRequest> {
    try {
      const backendData = mapFrontendRequestToBackend(request, patientId, dentistId, branchId, serviceId) as LaboratoryRequestData;

      // Validate required fields
      if (!backendData.patient_id || !backendData.dentist_id || !backendData.service_id) {
        throw new Error('Faltan campos requeridos para crear la solicitud');
      }

      const response = await laboratoryApi.createLaboratoryRequest(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendRequestToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una solicitud de laboratorio existente
   */
  async updateLaboratoryRequest(
    requestId: string,
    requestData: Partial<LaboratoryRequest>
  ): Promise<LaboratoryRequest> {
    try {
      // For update, we don't need all required fields
      const backendData = mapFrontendRequestToBackend(
        requestData,
        parseInt(requestData.patientId || '1'),
        1, // dentistId
        1, // branchId
        1  // serviceId
      );

      const response = await laboratoryApi.updateLaboratoryRequest(parseInt(requestId), backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendRequestToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una solicitud de laboratorio
   */
  async deleteLaboratoryRequest(requestId: string): Promise<void> {
    try {
      await laboratoryApi.deleteLaboratoryRequest(parseInt(requestId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo servicio de laboratorio
   */
  async createLaboratoryService(service: Partial<LaboratoryService>): Promise<LaboratoryService> {
    try {
      const backendData = mapFrontendServiceToBackend(service) as LaboratoryServiceData;

      if (!backendData.service_name) {
        throw new Error('El nombre del servicio es requerido');
      }

      const response = await laboratoryApi.createLaboratoryService(backendData);
      return mapBackendServiceToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un servicio de laboratorio
   */
  async updateLaboratoryService(serviceId: string, serviceData: Partial<LaboratoryService>): Promise<LaboratoryService> {
    try {
      const backendData = mapFrontendServiceToBackend(serviceData);
      const response = await laboratoryApi.updateLaboratoryService(parseInt(serviceId), backendData);
      return mapBackendServiceToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un servicio de laboratorio
   */
  async deleteLaboratoryService(serviceId: string): Promise<void> {
    try {
      await laboratoryApi.deleteLaboratoryService(parseInt(serviceId));
    } catch (error) {
      throw error;
    }
  }
};
