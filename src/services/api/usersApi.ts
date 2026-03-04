/**
 * API Service para Usuarios
 * Maneja todas las operaciones CRUD de usuarios con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface UserFilters {
  role_id?: number;
  branch_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserData {
  user_id?: number;
  role_id: number;
  branch_id?: number | null;
  username: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  mobile?: string;
  avatar_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  email_verified?: boolean;
  last_login?: string;
  profile?: any;
  branches_access?: number[];
  commission_percentage?: number;
  commission_config?: any;
  created_at?: string;
  updated_at?: string;
  date_time_registration?: string;
  date_time_modification?: string;

  // Datos relacionados (joins)
  role_name?: string;
  role_description?: string;
  branch_name?: string;
  dni?: string; // ✅ DNI agregado (puede estar en profile o como campo directo)
  address?: string;
  date_of_birth?: string;
  license_number?: string;
}

/**
 * Payload para crear un nuevo usuario
 * El backend espera estos campos específicos
 */
export interface CreateUserPayload {
  email: string;
  username: string;
  password: string; // ✅ Contraseña en texto plano - el backend la hasheará
  role_id: number;
  branch_id?: number | null;
  first_name: string;
  last_name: string;
  phone?: string;
  mobile?: string;
  dni?: string;
  address?: string;
  date_of_birth?: string;
  status?: 'active' | 'inactive' | 'suspended';
  profile?: any;
  branches_access?: number[];
}

export interface UsersListResponse {
  success: boolean;
  data: UserData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: UserData;
  message?: string;
}

class UsersApiService {
  /**
   * Obtiene todos los usuarios con filtros y paginación
   */
  async getUsers(filters?: UserFilters): Promise<UsersListResponse> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.role_id) params.append('role_id', filters.role_id.toString());
      if (filters?.branch_id) params.append('branch_id', filters.branch_id.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<UsersListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          totalPages: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: number): Promise<UserResponse> {
    try {
      const response = await httpClient.get<UserResponse>(`/users/${userId}`);

      if (!response.success || !response.data) {
        throw new Error('Usuario no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Respuesta con el usuario creado
   */
  async createUser(userData: CreateUserPayload): Promise<UserResponse> {
    try {
      console.log('🔄 [usersApi.createUser] Enviando payload:', {
        ...userData,
        password: '***' // Ocultar password en logs
      });

      const response = await httpClient.post<UserResponse>('/users', userData);

      console.log('✅ [usersApi.createUser] Respuesta recibida:', {
        success: response.success,
        hasData: !!response.data
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear usuario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(userId: number, userData: Partial<UserData>): Promise<UserResponse> {
    try {
      const response = await httpClient.put<UserResponse>(`/users/${userId}`, userData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar usuario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.put(`/users/${userId}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al cambiar contraseña');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(userId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/users/${userId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar usuario');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene usuarios activos
   */
  async getActiveUsers(branchId?: number): Promise<UserData[]> {
    try {
      const filters: UserFilters = {
        status: 'active',
        limit: 100
      };

      if (branchId) filters.branch_id = branchId;

      const response = await this.getUsers(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene usuarios por rol
   * @param roleId - ID del rol a filtrar
   * @param branchId - ID de la sede (opcional)
   * @param includeInactive - Si es true, incluye usuarios inactivos (útil para admins sin sede)
   */
  async getUsersByRole(roleId: number, branchId?: number, includeInactive: boolean = false): Promise<UserData[]> {
    try {
      const filters: UserFilters = {
        role_id: roleId,
        limit: 100
      };

      // Solo filtrar por status si NO queremos incluir inactivos
      if (!includeInactive) {
        filters.status = 'active';
      }

      if (branchId) filters.branch_id = branchId;

      const response = await this.getUsers(filters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene administradores disponibles (sin sede asignada)
   * @param excludeBranchId - ID de la sede a excluir (para permitir el admin actual al editar)
   */
  async getAvailableAdministrators(excludeBranchId?: number): Promise<UserData[]> {
    try {
      const params = new URLSearchParams();
      if (excludeBranchId) {
        params.append('exclude_branch_id', excludeBranchId.toString());
      }

      const queryString = params.toString();
      const endpoint = `/users/available-administrators${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<{ success: boolean; data: UserData[] }>(endpoint);

      if (!response.success || !response.data) {
        throw new Error('Error al obtener administradores disponibles');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const usersApi = new UsersApiService();
export default usersApi;
