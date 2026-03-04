/**
 * Servicio de integración con API real para Catálogo de Tratamientos
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Gestión de Tratamientos (catálogo).
 *
 * NOTA: El componente TreatmentManagement.tsx maneja un CATÁLOGO de tratamientos
 * con condiciones dentales y precios, que se mapea a "dental_procedures" en el backend.
 */

import { dentalProceduresApi, type DentalProcedureData } from '@/services/api/dentalProceduresApi';
import { httpClient } from '@/services/api/httpClient';
import type { Treatment, TreatmentCondition } from '@/types';

/**
 * Mapea los datos del backend (dental_procedures) al formato del frontend (Treatment)
 *
 * IMPORTANTE: El backend usa "dental_procedures" (procedimientos individuales con precio base)
 * mientras que el frontend usa "treatments" (combinaciones de condiciones con precio total).
 *
 * Para esta integración, cada procedimiento dental del backend se convierte en un tratamiento
 * con una sola condición.
 */
const mapBackendProcedureToFrontendTreatment = (backendProcedure: DentalProcedureData): Treatment => {
  // Crear una condición dental a partir del procedimiento
  const condition: TreatmentCondition = {
    id: backendProcedure.dental_procedure_id?.toString() || `proc_${Date.now()}`,
    label: backendProcedure.procedure_name,
    price: backendProcedure.base_cost || 0,
    editable: false
  };

  return {
    id: backendProcedure.dental_procedure_id?.toString() || '',
    nombre: backendProcedure.procedure_name,
    descripcion: backendProcedure.description || '',
    conditions: [condition],
    precioTotal: backendProcedure.base_cost || 0,
    status: backendProcedure.is_active === false ? 'inactivo' : 'activo',
    createdAt: backendProcedure.created_at ? new Date(backendProcedure.created_at) : new Date(),
    updatedAt: backendProcedure.updated_at ? new Date(backendProcedure.updated_at) : new Date(),
    createdBy: backendProcedure.user_id_registration?.toString() || ''
  };
};

/**
 * Mapea los datos del frontend (Treatment) al formato del backend (dental_procedures)
 */
const mapFrontendTreatmentToBackendProcedure = (frontendTreatment: Partial<Treatment>): Partial<DentalProcedureData> => {
  const backendData: Partial<DentalProcedureData> = {};

  if (frontendTreatment.nombre) backendData.procedure_name = frontendTreatment.nombre;
  if (frontendTreatment.descripcion !== undefined) backendData.description = frontendTreatment.descripcion;
  if (frontendTreatment.precioTotal !== undefined) backendData.base_cost = frontendTreatment.precioTotal;
  if (frontendTreatment.status) backendData.is_active = frontendTreatment.status === 'activo';

  // Generar código automático si es nuevo tratamiento
  if (!backendData.procedure_code && frontendTreatment.nombre) {
    const codigo = frontendTreatment.nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10);
    backendData.procedure_code = `PROC-${codigo}-${Date.now().toString().slice(-4)}`;
  }

  // Categoría por defecto
  if (!backendData.procedure_category) {
    backendData.procedure_category = 'General';
  }

  // Duración estimada por defecto
  if (!backendData.estimated_duration_minutes) {
    backendData.estimated_duration_minutes = 30;
  }

  return backendData;
};

export const TreatmentCatalogApiService = {
  /**
   * Carga todos los tratamientos (procedimientos dentales) desde el backend
   */
  async loadTreatments(): Promise<Treatment[]> {
    try {
      const response = await dentalProceduresApi.getDentalProcedures();
      return response.data.map(mapBackendProcedureToFrontendTreatment);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo tratamiento (procedimiento dental)
   */
  async createTreatment(treatment: Treatment): Promise<Treatment> {
    try {
      const backendData = mapFrontendTreatmentToBackendProcedure(treatment) as DentalProcedureData;

      // Validar campos requeridos
      if (!backendData.procedure_name) {
        throw new Error('El nombre del tratamiento es requerido');
      }

      const response = await dentalProceduresApi.createDentalProcedure(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendProcedureToFrontendTreatment(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un tratamiento existente
   */
  async updateTreatment(treatmentId: string, treatmentData: Partial<Treatment>): Promise<Treatment> {
    try {
      const treatmentIdNum = parseInt(treatmentId);
      const backendData = mapFrontendTreatmentToBackendProcedure(treatmentData);

      const response = await dentalProceduresApi.updateDentalProcedure(treatmentIdNum, backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendProcedureToFrontendTreatment(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un tratamiento
   */
  async deleteTreatment(treatmentId: string): Promise<void> {
    try {
      const treatmentIdNum = parseInt(treatmentId);
      await dentalProceduresApi.deleteDentalProcedure(treatmentIdNum);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca tratamientos por término
   */
  async searchTreatments(searchTerm: string): Promise<Treatment[]> {
    try {
      const procedures = await dentalProceduresApi.searchProcedures(searchTerm);
      return procedures.map(mapBackendProcedureToFrontendTreatment);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene tratamientos activos
   */
  async getActiveTreatments(): Promise<Treatment[]> {
    try {
      const procedures = await dentalProceduresApi.getActiveProcedures();
      return procedures.map(mapBackendProcedureToFrontendTreatment);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene tratamientos por categoría
   */
  async getTreatmentsByCategory(category: string): Promise<Treatment[]> {
    try {
      const procedures = await dentalProceduresApi.getProceduresByCategory(category);
      return procedures.map(mapBackendProcedureToFrontendTreatment);
    } catch (error) {
      throw error;
    }
  }
};
