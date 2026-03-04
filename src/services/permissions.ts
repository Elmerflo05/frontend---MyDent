import type { User, UserRole } from '@/types';

// Definición de permisos por módulo
export const PERMISSIONS = {
  // Gestión de Sedes
  SEDE_VIEW: 'sede.view',
  SEDE_CREATE: 'sede.create',
  SEDE_EDIT: 'sede.edit',
  SEDE_DELETE: 'sede.delete',
  SEDE_MANAGE_ALL: 'sede.manage_all', // Solo super_admin

  // Gestión de Usuarios
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_VIEW_ALL_SEDES: 'user.view_all_sedes', // Ver usuarios de todas las sedes

  // Pacientes
  PATIENT_VIEW: 'patient.view',
  PATIENT_CREATE: 'patient.create',
  PATIENT_EDIT: 'patient.edit',
  PATIENT_DELETE: 'patient.delete',
  PATIENT_VIEW_HISTORY: 'patient.view_history',

  // Citas
  APPOINTMENT_VIEW: 'appointment.view',
  APPOINTMENT_CREATE: 'appointment.create',
  APPOINTMENT_EDIT: 'appointment.edit',
  APPOINTMENT_CANCEL: 'appointment.cancel',
  APPOINTMENT_VIEW_ALL: 'appointment.view_all', // Ver citas de todos los doctores

  // Historia Clínica
  MEDICAL_RECORD_VIEW: 'medical_record.view',
  MEDICAL_RECORD_CREATE: 'medical_record.create',
  MEDICAL_RECORD_EDIT: 'medical_record.edit',

  // Laboratorio
  LAB_REQUEST_VIEW: 'lab_request.view',
  LAB_REQUEST_CREATE: 'lab_request.create',
  LAB_REQUEST_EDIT: 'lab_request.edit',
  LAB_REQUEST_PROCESS: 'lab_request.process',
  LAB_REQUEST_EXTERNAL: 'lab_request.external', // Gestionar pedidos externos

  // Laboratorio de Prótesis
  PROSTHESIS_REQUEST_VIEW: 'prosthesis_request.view',
  PROSTHESIS_REQUEST_CREATE: 'prosthesis_request.create',
  PROSTHESIS_REQUEST_EDIT: 'prosthesis_request.edit',
  PROSTHESIS_REQUEST_DELETE: 'prosthesis_request.delete',
  PROSTHESIS_REQUEST_RECEIVE: 'prosthesis_request.receive', // Marcar como recibido
  PROSTHESIS_REQUEST_PROCESS: 'prosthesis_request.process', // Gestionar procesamiento
  PROSTHESIS_DASHBOARD_VIEW: 'prosthesis_dashboard.view', // Ver dashboard de prótesis

  // Pagos
  PAYMENT_VIEW: 'payment.view',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_REFUND: 'payment.refund',

  // Inventario
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_DELETE: 'inventory.delete',

  // Reportes
  REPORT_VIEW: 'report.view',
  REPORT_FINANCIAL: 'report.financial',
  REPORT_CLINICAL: 'report.clinical',
  REPORT_ALL_SEDES: 'report.all_sedes',

  // Configuración
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_SYSTEM: 'settings.system',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS), // Todos los permisos

  admin: [
    // Sede (solo su sede)
    PERMISSIONS.SEDE_VIEW,
    PERMISSIONS.SEDE_EDIT,

    // Usuarios (solo de su sede)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,

    // Pacientes
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_EDIT,
    PERMISSIONS.PATIENT_DELETE,
    PERMISSIONS.PATIENT_VIEW_HISTORY,

    // Citas
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_EDIT,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,

    // Historia Clínica
    PERMISSIONS.MEDICAL_RECORD_VIEW,
    PERMISSIONS.MEDICAL_RECORD_CREATE,
    PERMISSIONS.MEDICAL_RECORD_EDIT,

    // Laboratorio
    PERMISSIONS.LAB_REQUEST_VIEW,
    PERMISSIONS.LAB_REQUEST_CREATE,
    PERMISSIONS.LAB_REQUEST_EDIT,
    PERMISSIONS.LAB_REQUEST_PROCESS,
    PERMISSIONS.LAB_REQUEST_EXTERNAL,

    // Laboratorio de Prótesis (gestión completa)
    PERMISSIONS.PROSTHESIS_REQUEST_VIEW,
    PERMISSIONS.PROSTHESIS_REQUEST_CREATE,
    PERMISSIONS.PROSTHESIS_REQUEST_EDIT,
    PERMISSIONS.PROSTHESIS_REQUEST_DELETE,
    PERMISSIONS.PROSTHESIS_REQUEST_RECEIVE,
    PERMISSIONS.PROSTHESIS_REQUEST_PROCESS,
    PERMISSIONS.PROSTHESIS_DASHBOARD_VIEW,

    // Inventario (gestión completa)
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,

    // Pagos
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_REFUND,

    // Reportes (solo de su sede)
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_FINANCIAL,
    PERMISSIONS.REPORT_CLINICAL,

    // Configuración
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],

  doctor: [
    // Pacientes (lectura)
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_VIEW_HISTORY,

    // Citas (propias)
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_EDIT,

    // Historia Clínica
    PERMISSIONS.MEDICAL_RECORD_VIEW,
    PERMISSIONS.MEDICAL_RECORD_CREATE,
    PERMISSIONS.MEDICAL_RECORD_EDIT,

    // Laboratorio (crear solicitudes)
    PERMISSIONS.LAB_REQUEST_VIEW,
    PERMISSIONS.LAB_REQUEST_CREATE,

    // Laboratorio de Prótesis (crear y gestionar)
    PERMISSIONS.PROSTHESIS_REQUEST_VIEW,
    PERMISSIONS.PROSTHESIS_REQUEST_CREATE,
    PERMISSIONS.PROSTHESIS_REQUEST_EDIT,
    PERMISSIONS.PROSTHESIS_DASHBOARD_VIEW,

    // Reportes clínicos
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CLINICAL,
  ],

  receptionist: [
    // Pacientes
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_EDIT,
    PERMISSIONS.PATIENT_VIEW_HISTORY,

    // Citas
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_EDIT,
    PERMISSIONS.APPOINTMENT_CANCEL,
    PERMISSIONS.APPOINTMENT_VIEW_ALL,

    // Historia Clínica (solo lectura)
    PERMISSIONS.MEDICAL_RECORD_VIEW,

    // Laboratorio de Prótesis (gestión completa)
    PERMISSIONS.PROSTHESIS_REQUEST_VIEW,
    PERMISSIONS.PROSTHESIS_REQUEST_CREATE,
    PERMISSIONS.PROSTHESIS_REQUEST_EDIT,
    PERMISSIONS.PROSTHESIS_REQUEST_RECEIVE,
    PERMISSIONS.PROSTHESIS_DASHBOARD_VIEW,

    // Inventario (gestión completa)
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.INVENTORY_DELETE,

    // Pagos
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_CREATE,

    // Reportes básicos
    PERMISSIONS.REPORT_VIEW,
  ],

  lab_technician: [
    // Laboratorio
    PERMISSIONS.LAB_REQUEST_VIEW,
    PERMISSIONS.LAB_REQUEST_EDIT,
    PERMISSIONS.LAB_REQUEST_PROCESS,
    PERMISSIONS.LAB_REQUEST_EXTERNAL,

    // Pacientes (solo lectura básica)
    PERMISSIONS.PATIENT_VIEW,
  ],

  prosthesis_technician: [
    // Laboratorio de Prótesis (gestión especializada)
    PERMISSIONS.PROSTHESIS_REQUEST_VIEW,
    PERMISSIONS.PROSTHESIS_REQUEST_EDIT,
    PERMISSIONS.PROSTHESIS_REQUEST_PROCESS,
    PERMISSIONS.PROSTHESIS_DASHBOARD_VIEW,

    // Pacientes (solo lectura básica)
    PERMISSIONS.PATIENT_VIEW,
  ],

  patient: [
    // Solo pueden ver su propia información
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_VIEW_HISTORY,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.MEDICAL_RECORD_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],

  external_client: [
    // Solo laboratorio externo
    PERMISSIONS.LAB_REQUEST_VIEW,
    PERMISSIONS.LAB_REQUEST_CREATE,
    PERMISSIONS.PAYMENT_VIEW,
  ],
};

// Clase de gestión de permisos
export class PermissionService {
  /**
   * Verifica si un usuario tiene un permiso específico
   */
  static hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Verifica si un usuario tiene alguno de los permisos especificados
   */
  static hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Verifica si un usuario tiene todos los permisos especificados
   */
  static hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Obtiene todos los permisos de un rol
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Verifica si un usuario puede acceder a datos de una sede específica
   */
  static canAccessSede(user: User | null, sedeId: string): boolean {
    if (!user) return false;

    // Super admin puede acceder a todas las sedes
    if (user.role === 'super_admin') return true;

    // Pacientes y clientes externos pueden acceder a cualquier sede
    if (user.role === 'patient' || user.role === 'external_client') return true;

    // Personal de sede solo puede acceder a su sede asignada
    if (user.sedeId === sedeId) return true;

    // Verificar si tiene acceso múltiple a sedes
    if (user.sedesAcceso?.includes(sedeId)) return true;

    return false;
  }

  /**
   * Verifica si un usuario puede gestionar a otro usuario
   */
  static canManageUser(manager: User | null, targetUser: User): boolean {
    if (!manager) return false;

    // Super admin puede gestionar a todos
    if (manager.role === 'super_admin') return true;

    // Admin puede gestionar usuarios de su sede (excepto super_admin)
    if (manager.role === 'admin') {
      if (targetUser.role === 'super_admin') return false;

      // Verificar que el usuario objetivo pertenece a la misma sede
      if (targetUser.sedeId && manager.sedeId) {
        return targetUser.sedeId === manager.sedeId;
      }
    }

    return false;
  }

  /**
   * Verifica si un usuario puede ver datos de paciente
   */
  static canViewPatientData(user: User | null, patientId: string): boolean {
    if (!user) return false;

    // Si es el propio paciente
    if (user.role === 'patient' && user.id === patientId) return true;

    // Si tiene permisos de ver pacientes
    return this.hasPermission(user, PERMISSIONS.PATIENT_VIEW);
  }

  /**
   * Filtra datos según la sede del usuario
   */
  static filterDataBySede<T extends { sedeId?: string }>(
    user: User | null,
    data: T[]
  ): T[] {
    if (!user) return [];

    // Super admin ve todo
    if (user.role === 'super_admin') return data;

    // Pacientes y clientes externos ven todo
    if (user.role === 'patient' || user.role === 'external_client') return data;

    // Personal de sede solo ve datos de su sede
    if (user.sedeId) {
      return data.filter(item => {
        // Si el item no tiene sedeId, es global
        if (!item.sedeId) return true;

        // Verificar si coincide con la sede del usuario
        if (item.sedeId === user.sedeId) return true;

        // Verificar acceso múltiple
        if (user.sedesAcceso?.includes(item.sedeId)) return true;

        return false;
      });
    }

    return data;
  }

  /**
   * Obtiene las sedes a las que un usuario puede acceder
   */
  static getAccessibleSedes(user: User | null): string[] {
    if (!user) return [];

    // Super admin accede a todas (se debe obtener la lista completa de sedes)
    if (user.role === 'super_admin') return ['*']; // Indicador especial para todas

    // Pacientes y clientes externos pueden acceder a cualquier sede
    if (user.role === 'patient' || user.role === 'external_client') return ['*'];

    const sedes: string[] = [];

    // Sede principal
    if (user.sedeId) {
      sedes.push(user.sedeId);
    }

    // Sedes adicionales
    if (user.sedesAcceso) {
      sedes.push(...user.sedesAcceso);
    }

    // Eliminar duplicados
    return [...new Set(sedes)];
  }
}

// Hook de React para usar en componentes
export function usePermission(permission: Permission | Permission[]): boolean {
  // Este hook debe ser implementado en un contexto React
  // Por ahora retornamos la estructura básica
  const user = null; // Obtener del contexto de autenticación

  if (Array.isArray(permission)) {
    return PermissionService.hasAnyPermission(user, permission);
  }

  return PermissionService.hasPermission(user, permission);
}

export default PermissionService;