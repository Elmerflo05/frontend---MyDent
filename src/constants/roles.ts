/**
 * Constantes de Roles del Sistema
 * Single Source of Truth para roles y permisos
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  IMAGING_TECHNICIAN: 'imaging_technician',
  PATIENT: 'patient',
  EXTERNAL_CLIENT: 'external_client',
} as const;

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  DOCTOR: 3,
  RECEPTIONIST: 4,
  IMAGING_TECHNICIAN: 5,
  PATIENT: 6,
  EXTERNAL_CLIENT: 7,
} as const;

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.ADMIN]: 'Administrador de Sede',
  [ROLES.DOCTOR]: 'Odontólogo',
  [ROLES.RECEPTIONIST]: 'Recepcionista',
  [ROLES.IMAGING_TECHNICIAN]: 'Técnico de Imágenes',
  [ROLES.PATIENT]: 'Paciente',
  [ROLES.EXTERNAL_CLIENT]: 'Cliente Externo',
} as const;

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Acceso total al sistema',
  [ROLES.ADMIN]: 'Gestiona una sede específica',
  [ROLES.DOCTOR]: 'Profesional de salud dental',
  [ROLES.RECEPTIONIST]: 'Gestiona citas y atención',
  [ROLES.IMAGING_TECHNICIAN]: 'Especialista en estudios imagenológicos',
  [ROLES.PATIENT]: 'Usuario paciente',
  [ROLES.EXTERNAL_CLIENT]: 'Cliente externo de laboratorio',
} as const;

export const ROLE_ID_TO_NAME_MAP: Record<number, string> = {
  [ROLE_IDS.SUPER_ADMIN]: ROLES.SUPER_ADMIN,
  [ROLE_IDS.ADMIN]: ROLES.ADMIN,
  [ROLE_IDS.DOCTOR]: ROLES.DOCTOR,
  [ROLE_IDS.RECEPTIONIST]: ROLES.RECEPTIONIST,
  [ROLE_IDS.IMAGING_TECHNICIAN]: ROLES.IMAGING_TECHNICIAN,
  [ROLE_IDS.PATIENT]: ROLES.PATIENT,
  [ROLE_IDS.EXTERNAL_CLIENT]: ROLES.EXTERNAL_CLIENT,
};

export const ROLE_NAME_TO_ID_MAP: Record<string, number> = {
  [ROLES.SUPER_ADMIN]: ROLE_IDS.SUPER_ADMIN,
  [ROLES.ADMIN]: ROLE_IDS.ADMIN,
  [ROLES.DOCTOR]: ROLE_IDS.DOCTOR,
  [ROLES.RECEPTIONIST]: ROLE_IDS.RECEPTIONIST,
  [ROLES.IMAGING_TECHNICIAN]: ROLE_IDS.IMAGING_TECHNICIAN,
  [ROLES.PATIENT]: ROLE_IDS.PATIENT,
  [ROLES.EXTERNAL_CLIENT]: ROLE_IDS.EXTERNAL_CLIENT,
};

/**
 * Roles que pueden gestionar colaboradores
 */
export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
] as const;

/**
 * Roles de personal clínico
 */
export const CLINICAL_ROLES = [
  ROLES.DOCTOR,
  ROLES.IMAGING_TECHNICIAN,
] as const;

/**
 * Roles de clientes/pacientes
 */
export const CLIENT_ROLES = [
  ROLES.PATIENT,
  ROLES.EXTERNAL_CLIENT,
] as const;

/**
 * Todos los roles activos del sistema
 */
export const ALL_ACTIVE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
  ROLES.IMAGING_TECHNICIAN,
  ROLES.PATIENT,
  ROLES.EXTERNAL_CLIENT,
] as const;

/**
 * Roles que pueden ser asignados al crear colaboradores
 */
export const ASSIGNABLE_ROLES = [
  ROLES.ADMIN,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
  ROLES.IMAGING_TECHNICIAN,
] as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
export type RoleIdType = typeof ROLE_IDS[keyof typeof ROLE_IDS];
