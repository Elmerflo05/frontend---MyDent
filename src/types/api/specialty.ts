/**
 * Tipos y transformadores para el módulo de Especialidades Médicas
 * Maneja la conversión entre el formato de la API (backend) y el formato del Frontend
 */

// Tipo de la API (Backend - PostgreSQL)
export interface SpecialtyApiResponse {
  specialty_id: number;
  specialty_name: string;
  specialty_description?: string | null;
  status: string; // 'active' | 'inactive'
}

// Tipo del Frontend (UI)
export interface SpecialtyFrontend {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo para crear una especialidad (sin ID)
export interface CreateSpecialtyDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Tipo para actualizar una especialidad
export interface UpdateSpecialtyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Transforma una especialidad de la API al formato del Frontend
 */
export function transformSpecialtyFromApi(apiSpecialty: SpecialtyApiResponse): SpecialtyFrontend {
  return {
    id: apiSpecialty.specialty_id.toString(),
    name: apiSpecialty.specialty_name,
    description: apiSpecialty.specialty_description || undefined,
    isActive: apiSpecialty.status === 'active',
    createdAt: undefined, // El backend no devuelve estas fechas actualmente
    updatedAt: undefined
  };
}

/**
 * Transforma un array de especialidades de la API al formato del Frontend
 */
export function transformSpecialtiesFromApi(apiSpecialties: SpecialtyApiResponse[]): SpecialtyFrontend[] {
  return apiSpecialties.map(transformSpecialtyFromApi);
}

/**
 * Transforma datos del Frontend al formato de la API para crear
 */
export function transformSpecialtyToApiCreate(specialty: CreateSpecialtyDto): {
  specialty_name: string;
  specialty_description?: string;
  status: string;
} {
  return {
    specialty_name: specialty.name,
    specialty_description: specialty.description || undefined,
    status: specialty.isActive !== false ? 'active' : 'inactive'
  };
}

/**
 * Transforma datos del Frontend al formato de la API para actualizar
 */
export function transformSpecialtyToApiUpdate(updates: UpdateSpecialtyDto): {
  specialty_name?: string;
  specialty_description?: string;
  status?: string;
} {
  const apiUpdates: {
    specialty_name?: string;
    specialty_description?: string;
    status?: string;
  } = {};

  if (updates.name !== undefined) {
    apiUpdates.specialty_name = updates.name;
  }

  if (updates.description !== undefined) {
    apiUpdates.specialty_description = updates.description;
  }

  if (updates.isActive !== undefined) {
    apiUpdates.status = updates.isActive ? 'active' : 'inactive';
  }

  return apiUpdates;
}
