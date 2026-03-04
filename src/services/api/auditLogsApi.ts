/**
 * API Service para Logs de Auditoría
 * Maneja el registro de acciones del sistema para auditoría y seguridad
 */

import httpClient, { ApiResponse } from './httpClient';

export interface AuditLogData {
  log_id?: number;
  user_id: number;
  action_type: string;
  table_name?: string;
  record_id?: number;
  action_description?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;

  // Datos relacionados (joins)
  user_name?: string;
  user_email?: string;
}

export interface AuditLogsListResponse {
  success: boolean;
  data: AuditLogData[];
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLogData;
  message?: string;
}

export interface AuditLogFilters {
  user_id?: number;
  action_type?: string;
  table_name?: string;
  record_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  page?: number;
}

class AuditLogsApiService {
  /**
   * Obtiene todos los logs de auditoría con filtros opcionales
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogsListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.action_type) params.append('action_type', filters.action_type);
      if (filters?.table_name) params.append('table_name', filters.table_name);
      if (filters?.record_id) params.append('record_id', filters.record_id.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const queryString = params.toString();
      const endpoint = `/audit-logs${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<AuditLogsListResponse>(endpoint);

      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un log de auditoría por su ID
   */
  async getAuditLogById(logId: number): Promise<AuditLogResponse> {
    try {
      const response = await httpClient.get<AuditLogResponse>(`/audit-logs/${logId}`);

      if (!response.success || !response.data) {
        throw new Error('Log de auditoría no encontrado');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo log de auditoría
   */
  async createAuditLog(logData: AuditLogData): Promise<AuditLogResponse> {
    try {
      const response = await httpClient.post<AuditLogResponse>('/audit-logs', logData);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear log de auditoría');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs de un usuario específico
   */
  async getLogsByUserId(userId: number, limit: number = 100): Promise<AuditLogData[]> {
    try {
      const response = await this.getAuditLogs({
        user_id: userId,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs por tipo de acción
   */
  async getLogsByActionType(actionType: string, limit: number = 100): Promise<AuditLogData[]> {
    try {
      const response = await this.getAuditLogs({
        action_type: actionType,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs de una tabla específica
   */
  async getLogsByTable(tableName: string, recordId?: number, limit: number = 100): Promise<AuditLogData[]> {
    try {
      const response = await this.getAuditLogs({
        table_name: tableName,
        record_id: recordId,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs por rango de fechas
   */
  async getLogsByDateRange(dateFrom: string, dateTo: string, limit: number = 500): Promise<AuditLogData[]> {
    try {
      const response = await this.getAuditLogs({
        date_from: dateFrom,
        date_to: dateTo,
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs recientes del sistema
   */
  async getRecentLogs(limit: number = 50): Promise<AuditLogData[]> {
    try {
      const response = await this.getAuditLogs({
        limit: limit
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene logs de acciones críticas (CREATE, UPDATE, DELETE)
   */
  async getCriticalLogs(limit: number = 100): Promise<AuditLogData[]> {
    try {
      // This would need backend support to filter by multiple action types
      const response = await this.getAuditLogs({
        limit: limit
      });

      // Filter critical actions on frontend
      return response.data.filter(log =>
        ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].includes(log.action_type.toUpperCase())
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registra una acción del usuario (helper method)
   */
  async logAction(
    userId: number,
    actionType: string,
    tableName: string,
    recordId?: number,
    description?: string,
    oldValues?: any,
    newValues?: any
  ): Promise<AuditLogResponse> {
    try {
      return await this.createAuditLog({
        user_id: userId,
        action_type: actionType,
        table_name: tableName,
        record_id: recordId,
        action_description: description,
        old_values: oldValues ? JSON.stringify(oldValues) : undefined,
        new_values: newValues ? JSON.stringify(newValues) : undefined
      });
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const auditLogsApi = new AuditLogsApiService();
export default auditLogsApi;
