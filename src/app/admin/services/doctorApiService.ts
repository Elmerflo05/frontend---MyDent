/**
 * Servicio de integración con API real para Doctores (Dentistas)
 * Reemplaza el uso de IndexedDB por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Doctores del admin.
 */

import { dentistsApi, type DentistData } from '@/services/api/dentistsApi';
import { usersApi, type UserData } from '@/services/api/usersApi';
import type { User } from '@/types';

/**
 * Mapea un dentista/doctor del backend al formato User del frontend
 */
const mapBackendDoctorToUser = (backendDoctor: DentistData & { branches_access?: any }): User => {
  // Mapear especialidades: usar el nuevo array `specialties` si existe, sino usar specialty_name (legacy)
  const specialties = backendDoctor.specialties && Array.isArray(backendDoctor.specialties)
    ? backendDoctor.specialties.map((s: any) => s.specialty_name)
    : backendDoctor.specialty_name
    ? [backendDoctor.specialty_name]
    : [];

  // Mapear branches_access (sedes asignadas al médico)
  // PostgreSQL retorna arrays como arrays de JS, así que solo necesitamos convertir a strings
  let branchesAccess: string[] = [];

  if (backendDoctor.branches_access) {
    if (Array.isArray(backendDoctor.branches_access)) {
      // Es un array: convertir cada elemento a string
      branchesAccess = backendDoctor.branches_access.map(id => String(id));
    } else if (typeof backendDoctor.branches_access === 'number') {
      // Es un número individual: convertir a array de un elemento
      branchesAccess = [String(backendDoctor.branches_access)];
    } else {
      console.warn('⚠️ branches_access tiene un tipo inesperado:', {
        doctor: `${backendDoctor.first_name} ${backendDoctor.last_name}`,
        value: backendDoctor.branches_access,
        type: typeof backendDoctor.branches_access
      });
    }
  }

  return {
    id: backendDoctor.dentist_id?.toString() || '',
    email: backendDoctor.email || '',
    role: 'doctor',
    status: backendDoctor.status || 'active', // Usar status real del backend
    sedeId: backendDoctor.branch_id?.toString(),
    sedesAcceso: branchesAccess,
    profile: {
      firstName: backendDoctor.first_name || '',
      lastName: backendDoctor.last_name || '',
      phone: backendDoctor.phone || '',
      address: backendDoctor.address || '',
      photoUrl: backendDoctor.photo_url || '',
      licenseNumber: backendDoctor.professional_license || backendDoctor.license_number || '',
      specialties: specialties,
      sedeId: backendDoctor.branch_id?.toString()
    },
    // ✅ CORREGIDO: La tabla dentists usa date_time_registration, no created_at
    createdAt: new Date(backendDoctor.date_time_registration || backendDoctor.created_at || new Date()),
    updatedAt: new Date(backendDoctor.date_time_modification || backendDoctor.updated_at || new Date()),
    password: '' // No se expone
  };
};

/**
 * Mapea un usuario del backend (tabla users) al formato User del frontend
 */
const mapBackendUserToUser = (backendUser: UserData): User => {
  return {
    id: backendUser.user_id?.toString() || '',
    email: backendUser.email || '',
    role: backendUser.role_id === 3 ? 'doctor' : 'admin',
    status: 'active',
    sedeId: backendUser.branch_id?.toString(),
    sedesAcceso: [],
    profile: {
      firstName: backendUser.first_name || '',
      lastName: backendUser.last_name || '',
      phone: backendUser.phone || '',
      address: backendUser.address || '',
      photoUrl: backendUser.photo_url || '',
      licenseNumber: '',
      specialties: [],
      sedeId: backendUser.branch_id?.toString()
    },
    createdAt: new Date(backendUser.created_at || new Date()),
    updatedAt: new Date(backendUser.updated_at || new Date()),
    password: ''
  };
};

/**
 * Mapea un User del frontend al formato del backend para dentistas
 */
const mapUserToDentistData = (user: Partial<User>, branchId: number = 1): Partial<DentistData> => {
  const data: Partial<DentistData> = {};

  if (user.profile?.firstName) data.first_name = user.profile.firstName;
  if (user.profile?.lastName) data.last_name = user.profile.lastName;
  if (user.email) data.email = user.email;
  if (user.profile?.phone) data.phone = user.profile.phone;
  if (user.profile?.address) data.address = user.profile.address;
  if (user.profile?.licenseNumber) {
    data.license_number = user.profile.licenseNumber;
    data.professional_license = user.profile.licenseNumber;
  }
  if (user.sedeId) data.branch_id = parseInt(user.sedeId);
  else if (branchId) data.branch_id = branchId;

  // Mapear sedes de acceso
  if (user.sedesAcceso && Array.isArray(user.sedesAcceso) && user.sedesAcceso.length > 0) {
    data.branches_access = user.sedesAcceso.map(id => parseInt(id));
  }

  // Mapear status
  if (user.status) {
    data.status = user.status;
  }

  // Mapear especialidades (convertir a array de IDs)
  if (user.profile?.specialties && user.profile.specialties.length > 0) {
    // Si son strings (nombres), intentar convertir a IDs
    const firstSpecialty = user.profile.specialties[0];
    if (typeof firstSpecialty === 'string' && !isNaN(parseInt(firstSpecialty))) {
      // Son IDs en formato string
      data.specialties = user.profile.specialties.map(s => parseInt(s as string));
    } else if (typeof firstSpecialty === 'number') {
      // Ya son numeros
      data.specialties = user.profile.specialties as unknown as number[];
    }
    // Si son nombres de especialidades, no podemos mapearlos sin un lookup
  }

  return data;
};

export const DoctorApiService = {
  /**
   * Carga todos los doctores desde el backend (incluye suspendidos para gestión)
   */
  async loadDoctors(filters?: { branchId?: number; specialtyId?: number }): Promise<User[]> {
    try {
      const response = await dentistsApi.getDentists({
        branch_id: filters?.branchId,
        specialty_id: filters?.specialtyId,
        include_inactive: true, // Incluir suspendidos para visualización en gestión
        limit: 1000
      });

      return response.data.map(mapBackendDoctorToUser);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Carga doctores y administradores
   * Los doctores vienen de la tabla dentists (con especialidades)
   * Los admins vienen de la tabla users
   */
  async loadDoctorsAndAdmins(filters?: { branchId?: number }): Promise<User[]> {
    try {
      // Cargar doctores desde la tabla dentists (incluye specialty_name)
      const dentistsResponse = await dentistsApi.getDentists({
        branch_id: filters?.branchId,
        limit: 1000
      });

      // Cargar todos los usuarios para obtener admins
      const usersResponse = await usersApi.getUsers({
        branch_id: filters?.branchId,
        limit: 1000
      });

      // Filtrar solo admins (role_id = 1)
      const admins = usersResponse.data.filter(user => user.role_id === 1);

      // Mapear y combinar
      const doctors = dentistsResponse.data.map(mapBackendDoctorToUser);
      const adminUsers = admins.map(mapBackendUserToUser);

      return [...doctors, ...adminUsers];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene un doctor por su ID
   */
  async getDoctorById(doctorId: string): Promise<User> {
    try {
      const response = await dentistsApi.getDentistById(parseInt(doctorId));
      return mapBackendDoctorToUser(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea un nuevo doctor
   */
  async createDoctor(doctor: User, branchId: number = 1): Promise<User> {
    try {
      const dentistData = mapUserToDentistData(doctor, branchId) as DentistData;

      // Validar campos requeridos
      if (!dentistData.first_name || !dentistData.last_name || !dentistData.email) {
        throw new Error('Faltan campos requeridos para crear el doctor');
      }

      const response = await dentistsApi.createDentist(dentistData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendDoctorToUser(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza un doctor existente
   */
  async updateDoctor(doctorId: string, doctorData: Partial<User>): Promise<User> {
    try {
      const dentistData = mapUserToDentistData(doctorData);
      const response = await dentistsApi.updateDentist(parseInt(doctorId), dentistData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendDoctorToUser(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina un doctor
   */
  async deleteDoctor(doctorId: string): Promise<void> {
    try {
      await dentistsApi.deleteDentist(parseInt(doctorId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene el horario de un doctor
   */
  async getDoctorSchedule(doctorId: string): Promise<any[]> {
    try {
      const response = await dentistsApi.getDentistSchedule(parseInt(doctorId));
      return response.data || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de doctores
   */
  async getDoctorStats(branchId?: number): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySpecialty: Record<string, number>;
  }> {
    try {
      const doctors = await this.loadDoctors({ branchId });

      const bySpecialty: Record<string, number> = {};
      doctors.forEach(doctor => {
        if (doctor.profile.specialties && doctor.profile.specialties.length > 0) {
          doctor.profile.specialties.forEach(specialty => {
            bySpecialty[specialty] = (bySpecialty[specialty] || 0) + 1;
          });
        }
      });

      return {
        total: doctors.length,
        active: doctors.filter(d => d.status === 'active').length,
        inactive: doctors.filter(d => d.status === 'inactive').length,
        bySpecialty
      };
    } catch (error) {
      throw error;
    }
  }
};
