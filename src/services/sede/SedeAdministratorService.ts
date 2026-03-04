// ============================================================================
// SEDE ADMINISTRATOR SERVICE - Gestión de relación Sedes-Administradores
// ============================================================================
// TODO: Implementar API real para gestión de sedes y administradores

import { logger } from '@/lib/logger';

/**
 * Servicio para gestionar la relación bidireccional entre Sedes y Administradores
 *
 * NOTA: Este servicio actualmente usa stubs sin persistencia real.
 * Requiere implementación de API real en el backend.
 */
export class SedeAdministratorService {
  /**
   * Asigna un administrador a una sede
   */
  static async assignAdministratorToSede(
    sedeId: string,
    administratorId: string
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    logger.warn('⚠️ SedeAdministratorService.assignAdministratorToSede: Función stub - requiere API real');
    return {
      success: false,
      error: 'Función no implementada - requiere API de backend'
    };
  }

  /**
   * Desasigna un administrador de una sede
   */
  static async unassignAdministratorFromSede(
    sedeId: string
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    logger.warn('⚠️ SedeAdministratorService.unassignAdministratorFromSede: Función stub - requiere API real');
    return {
      success: false,
      error: 'Función no implementada - requiere API de backend'
    };
  }

  /**
   * Obtiene una sede con su administrador populado
   */
  static async getSedeWithAdministrator(sedeId: string) {
    logger.warn('⚠️ SedeAdministratorService.getSedeWithAdministrator: Función stub - requiere API real');
    return undefined;
  }

  /**
   * Obtiene todas las sedes con sus administradores populados
   */
  static async getAllSedesWithAdministrators() {
    logger.warn('⚠️ SedeAdministratorService.getAllSedesWithAdministrators: Función stub - requiere API real');
    return [];
  }

  /**
   * Verifica si un administrador puede ser asignado a una sede
   */
  static async canAssignAdministratorToSede(
    sedeId: string,
    administratorId: string
  ): Promise<{ canAssign: boolean; reason?: string }> {
    return {
      canAssign: false,
      reason: 'Función no implementada - requiere API de backend'
    };
  }
}
