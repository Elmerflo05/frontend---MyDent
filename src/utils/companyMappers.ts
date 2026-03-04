import type { Company } from '@/types';
import type { CompanyData } from '@/services/api/companiesApi';
import { formatDateToYMD } from '@/utils/dateUtils';

// Mapeo de estados: Backend → Frontend
const statusBackendToFrontend: Record<string, Company['estado']> = {
  'active': 'activa',
  'suspended': 'suspendida',
  'expired': 'vencida',
  'inactive': 'inactiva',
  'deleted': 'eliminada'
};

// Mapeo de estados: Frontend → Backend
const statusFrontendToBackend: Record<Company['estado'], string> = {
  'activa': 'active',
  'suspendida': 'suspended',
  'vencida': 'expired',
  'inactiva': 'inactive',
  'eliminada': 'deleted'
};

/**
 * Mapea una empresa del backend al formato del frontend
 * SINGLE SOURCE OF TRUTH para el mapeo de Company
 *
 * @param backendCompany - Datos de empresa desde el backend (CompanyData)
 * @returns Empresa en formato del frontend (Company)
 */
export const mapBackendCompanyToFrontend = (backendCompany: CompanyData): Company => {
  return {
    id: backendCompany.company_id?.toString() || '',
    nombre: backendCompany.company_name || '',
    ruc: backendCompany.ruc || '',
    contactoPrincipal: {
      nombre: backendCompany.contact_person || '',
      cargo: backendCompany.contact_cargo || '',
      telefono: backendCompany.contact_phone || '',
      email: backendCompany.email || ''
    },
    direccion: backendCompany.address || '',
    telefono: backendCompany.phone || '',
    planId: '',
    contratoId: backendCompany.contracts?.[0]?.contract_id?.toString() || '',
    vigenciaInicio: backendCompany.vigencia_inicio
      ? new Date(backendCompany.vigencia_inicio)
      : new Date(),
    vigenciaFin: backendCompany.vigencia_fin
      ? new Date(backendCompany.vigencia_fin)
      : new Date(),
    estado: statusBackendToFrontend[backendCompany.status || 'inactive'] || 'inactiva',
    employeeCount: backendCompany.employee_count ? parseInt(String(backendCompany.employee_count)) : 0,
    observaciones: backendCompany.notes || '',
    createdAt: new Date(backendCompany.date_time_registration || new Date()),
    updatedAt: new Date(backendCompany.date_time_modification || backendCompany.date_time_registration || new Date()),
    createdBy: backendCompany.user_id_registration?.toString() || ''
  };
};

/**
 * Mapea una empresa del frontend al formato del backend
 *
 * @param frontendCompany - Datos de empresa desde el frontend (Company)
 * @returns Empresa en formato del backend (CompanyData parcial)
 */
export const mapFrontendCompanyToBackend = (frontendCompany: Partial<Company>): Partial<CompanyData> => {
  const data: Partial<CompanyData> = {};

  if (frontendCompany.nombre) data.company_name = frontendCompany.nombre;
  if (frontendCompany.ruc) data.ruc = frontendCompany.ruc;
  if (frontendCompany.direccion) data.address = frontendCompany.direccion;
  if (frontendCompany.telefono) data.phone = frontendCompany.telefono;
  if (frontendCompany.contactoPrincipal?.email) data.email = frontendCompany.contactoPrincipal.email;
  if (frontendCompany.contactoPrincipal?.nombre) data.contact_person = frontendCompany.contactoPrincipal.nombre;
  if (frontendCompany.contactoPrincipal?.telefono) data.contact_phone = frontendCompany.contactoPrincipal.telefono;
  if (frontendCompany.contactoPrincipal?.cargo) data.contact_cargo = frontendCompany.contactoPrincipal.cargo;
  if (frontendCompany.observaciones !== undefined) data.notes = frontendCompany.observaciones;
  if (frontendCompany.estado) data.status = statusFrontendToBackend[frontendCompany.estado] || 'inactive';

  // Mapear fechas de vigencia
  if (frontendCompany.vigenciaInicio) {
    const fecha = frontendCompany.vigenciaInicio instanceof Date
      ? frontendCompany.vigenciaInicio
      : new Date(frontendCompany.vigenciaInicio);
    data.vigencia_inicio = formatDateToYMD(fecha);
  }

  if (frontendCompany.vigenciaFin) {
    const fecha = frontendCompany.vigenciaFin instanceof Date
      ? frontendCompany.vigenciaFin
      : new Date(frontendCompany.vigenciaFin);
    data.vigencia_fin = formatDateToYMD(fecha);
  }

  return data;
};
