/**
 * API Service para Roles y Permisos
 * Maneja roles de usuario y permisos del sistema con el backend
 */

import httpClient, { ApiResponse } from './httpClient';

export interface RoleData {
  role_id?: number;
  role_name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionData {
  permission_id?: number;
  permission_name: string;
  description?: string;
  module?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermissionData {
  role_permission_id?: number;
  role_id: number;
  permission_id: number;
  created_at?: string;
}

export interface RolesListResponse {
  success: boolean;
  data: RoleData[];
}

export interface RoleResponse {
  success: boolean;
  data: RoleData;
  message?: string;
}

export interface PermissionsListResponse {
  success: boolean;
  data: PermissionData[];
}

export interface PermissionResponse {
  success: boolean;
  data: PermissionData;
  message?: string;
}

export interface RolePermissionsListResponse {
  success: boolean;
  data: RolePermissionData[];
}

class RolesApiService {
  // ==================== ROLES ====================

  /**
   * Obtiene todos los roles
   */
  async getRoles(): Promise<RolesListResponse> {
    try {
      const response = await httpClient.get<RolesListResponse>('/roles-permissions/roles');
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un rol por su ID
   */
  async getRoleById(roleId: number): Promise<RoleResponse> {
    try {
      const response = await httpClient.get<RoleResponse>(`/roles-permissions/roles/${roleId}`);

      if (!response.success || !response.data) {
        throw new Error('Rol no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo rol
   */
  async createRole(roleData: RoleData): Promise<RoleResponse> {
    try {
      const response = await httpClient.post<RoleResponse>('/roles-permissions/roles', roleData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear rol');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un rol existente
   */
  async updateRole(roleId: number, roleData: Partial<RoleData>): Promise<RoleResponse> {
    try {
      const response = await httpClient.put<RoleResponse>(`/roles-permissions/roles/${roleId}`, roleData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar rol');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un rol
   */
  async deleteRole(roleId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/roles-permissions/roles/${roleId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar rol');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== PERMISOS ====================

  /**
   * Obtiene todos los permisos
   */
  async getPermissions(): Promise<PermissionsListResponse> {
    try {
      const response = await httpClient.get<PermissionsListResponse>('/roles-permissions/permissions');
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un permiso por su ID
   */
  async getPermissionById(permissionId: number): Promise<PermissionResponse> {
    try {
      const response = await httpClient.get<PermissionResponse>(`/roles-permissions/permissions/${permissionId}`);

      if (!response.success || !response.data) {
        throw new Error('Permiso no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo permiso
   */
  async createPermission(permissionData: PermissionData): Promise<PermissionResponse> {
    try {
      const response = await httpClient.post<PermissionResponse>('/roles-permissions/permissions', permissionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear permiso');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un permiso existente
   */
  async updatePermission(permissionId: number, permissionData: Partial<PermissionData>): Promise<PermissionResponse> {
    try {
      const response = await httpClient.put<PermissionResponse>(`/roles-permissions/permissions/${permissionId}`, permissionData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar permiso');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un permiso
   */
  async deletePermission(permissionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/roles-permissions/permissions/${permissionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar permiso');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== ASIGNACIÓN DE PERMISOS A ROLES ====================

  /**
   * Obtiene todos los permisos de un rol
   */
  async getRolePermissions(roleId: number): Promise<RolePermissionsListResponse> {
    try {
      const response = await httpClient.get<RolePermissionsListResponse>(`/roles-permissions/roles/${roleId}/permissions`);
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asigna un permiso a un rol
   */
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.post(`/roles-permissions/roles/${roleId}/permissions`, {
        permission_id: permissionId
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al asignar permiso');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remueve un permiso de un rol
   */
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/roles-permissions/roles/${roleId}/permissions/${permissionId}`);

      if (!response.success) {
        throw new Error(response.message || 'Error al remover permiso');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza todos los permisos de un rol (reemplaza todos)
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<ApiResponse> {
    try {
      const response = await httpClient.put(`/roles-permissions/roles/${roleId}/permissions`, {
        permission_ids: permissionIds
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar permisos');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const rolesApi = new RolesApiService();
export default rolesApi;
