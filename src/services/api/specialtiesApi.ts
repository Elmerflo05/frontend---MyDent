/**
 * API Service para Especialidades
 */

import httpClient from './httpClient';
import type {
  SpecialtyApiResponse,
  CreateSpecialtyDto,
  UpdateSpecialtyDto
} from '@/types/api/specialty';

export interface SpecialtiesResponse {
  success: boolean;
  data: SpecialtyApiResponse[];
}

export interface SpecialtyResponse {
  success: boolean;
  data: SpecialtyApiResponse;
  message?: string;
}

class SpecialtiesApiService {
  /**
   * Obtiene todas las especialidades
   * @param includeInactive - Si es true, incluye también las especialidades inactivas
   */
  async getSpecialties(includeInactive: boolean = false): Promise<SpecialtiesResponse> {
    try {
      const url = includeInactive
        ? '/catalogs/specialties?includeInactive=true'
        : '/catalogs/specialties';
      const response = await httpClient.get<SpecialtiesResponse>(url);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      throw error;
    }
  }

  /**
   * Obtiene una especialidad por su ID
   * @param includeInactive - Si es true, incluye también las especialidades inactivas
   */
  async getSpecialtyById(specialtyId: number, includeInactive: boolean = true): Promise<SpecialtyApiResponse> {
    try {
      const url = includeInactive
        ? `/catalogs/specialties/${specialtyId}?includeInactive=true`
        : `/catalogs/specialties/${specialtyId}`;
      const response = await httpClient.get<SpecialtyResponse>(url);

      if (!response.success || !response.data) {
        throw new Error('Especialidad no encontrada');
      }

      return response.data;
    } catch (error) {
      console.error(`Error al obtener especialidad ${specialtyId}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva especialidad
   */
  async createSpecialty(specialty: CreateSpecialtyDto): Promise<SpecialtyApiResponse> {
    try {
      const payload = {
        specialty_name: specialty.name,
        specialty_description: specialty.description || null,
        status: specialty.isActive !== false ? 'active' : 'inactive'
      };

      const response = await httpClient.post<SpecialtyResponse>(
        '/catalogs/specialties',
        payload
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear especialidad');
      }

      return response.data;
    } catch (error) {
      console.error('Error al crear especialidad:', error);
      throw error;
    }
  }

  /**
   * Actualiza una especialidad existente
   */
  async updateSpecialty(
    specialtyId: number,
    updates: UpdateSpecialtyDto
  ): Promise<SpecialtyApiResponse> {
    try {
      const payload: Record<string, any> = {};

      if (updates.name !== undefined) {
        payload.specialty_name = updates.name;
      }

      if (updates.description !== undefined) {
        payload.specialty_description = updates.description;
      }

      if (updates.isActive !== undefined) {
        payload.status = updates.isActive ? 'active' : 'inactive';
      }

      const response = await httpClient.put<SpecialtyResponse>(
        `/catalogs/specialties/${specialtyId}`,
        payload
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar especialidad');
      }

      return response.data;
    } catch (error) {
      console.error(`Error al actualizar especialidad ${specialtyId}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una especialidad
   */
  async deleteSpecialty(specialtyId: number): Promise<void> {
    try {
      const response = await httpClient.delete<{ success: boolean; message?: string }>(
        `/catalogs/specialties/${specialtyId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar especialidad');
      }
    } catch (error) {
      console.error(`Error al eliminar especialidad ${specialtyId}:`, error);
      throw error;
    }
  }

  /**
   * Cambia el estado de una especialidad (activa/inactiva)
   */
  async toggleSpecialtyStatus(specialtyId: number): Promise<SpecialtyApiResponse> {
    try {
      // Primero obtenemos la especialidad actual
      const currentSpecialty = await this.getSpecialtyById(specialtyId);

      // Invertimos su estado
      const newStatus = currentSpecialty.status === 'active' ? 'inactive' : 'active';

      // Actualizamos solo el estado
      return await this.updateSpecialty(specialtyId, {
        isActive: newStatus === 'active'
      });
    } catch (error) {
      console.error(`Error al cambiar estado de especialidad ${specialtyId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las especialidades activas (endpoint público)
   */
  async getAllSpecialties(): Promise<SpecialtyApiResponse[]> {
    try {
      const response = await httpClient.get<SpecialtiesResponse>('/public/specialties');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo especialidades:', error);
      throw error;
    }
  }

  /**
   * Obtiene especialidades por sede (endpoint público)
   */
  async getSpecialtiesByBranch(branchId: number): Promise<SpecialtyApiResponse[]> {
    try {
      const response = await httpClient.get<SpecialtiesResponse>(
        `/public/specialties/by-branch/${branchId}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo especialidades de sede:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const specialtiesApi = new SpecialtiesApiService();
export default specialtiesApi;
