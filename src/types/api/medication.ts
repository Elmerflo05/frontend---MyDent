/**
 * Tipos y transformadores para el módulo de Medicamentos
 * Maneja la conversión entre el formato de la API (backend) y el formato del Frontend
 */

// Tipo de la API (Backend - PostgreSQL)
export interface MedicationApiResponse {
  medication_id: number;
  medication_name: string;
  generic_name?: string | null;
  medication_type?: string | null;
  concentration?: string | null; // Campo de concentración en la BD
  description?: string | null;
  status: string; // 'active' | 'inactive'
  user_id_registration?: number | null;
  date_time_registration?: string | null;
  user_id_modification?: number | null;
  date_time_modification?: string | null;
}

// Tipo del Frontend (UI) - Simplificado para coincidir con el formulario
export interface MedicationFrontend {
  id: string;
  nombre: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo para crear un medicamento (sin ID)
export interface CreateMedicationDto {
  nombre: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
}

// Tipo para actualizar un medicamento
export interface UpdateMedicationDto {
  nombre?: string;
  concentracion?: string;
  formaFarmaceutica?: string;
  viaAdministracion?: string;
}

/**
 * Transforma un medicamento de la API al formato del Frontend
 */
export function transformMedicationFromApi(
  apiMedication: MedicationApiResponse
): MedicationFrontend {
  return {
    id: apiMedication.medication_id.toString(),
    nombre: apiMedication.medication_name,
    concentracion: apiMedication.concentration || '', // Usa el campo concentration de la BD
    formaFarmaceutica: apiMedication.medication_type || '',
    viaAdministracion: apiMedication.description || '',
    isActive: apiMedication.status === 'active',
    createdAt: apiMedication.date_time_registration
      ? new Date(apiMedication.date_time_registration)
      : undefined,
    updatedAt: apiMedication.date_time_modification
      ? new Date(apiMedication.date_time_modification)
      : undefined
  };
}

/**
 * Transforma un array de medicamentos de la API al formato del Frontend
 */
export function transformMedicationsFromApi(
  apiMedications: MedicationApiResponse[]
): MedicationFrontend[] {
  return apiMedications.map(transformMedicationFromApi);
}

/**
 * Transforma datos del Frontend al formato de la API para crear
 */
export function transformMedicationToApiCreate(medication: CreateMedicationDto): {
  medication_name: string;
  concentration?: string;
  medication_type?: string;
  description?: string;
} {
  return {
    medication_name: medication.nombre,
    concentration: medication.concentracion || undefined, // Usa el campo concentration de la BD
    medication_type: medication.formaFarmaceutica || undefined,
    description: medication.viaAdministracion || undefined
  };
}

/**
 * Transforma datos del Frontend al formato de la API para actualizar
 */
export function transformMedicationToApiUpdate(updates: UpdateMedicationDto): {
  medication_name?: string;
  concentration?: string;
  medication_type?: string;
  description?: string;
} {
  const apiUpdates: {
    medication_name?: string;
    concentration?: string;
    medication_type?: string;
    description?: string;
  } = {};

  if (updates.nombre !== undefined) {
    apiUpdates.medication_name = updates.nombre;
  }

  if (updates.concentracion !== undefined) {
    apiUpdates.concentration = updates.concentracion; // Usa el campo concentration de la BD
  }

  if (updates.formaFarmaceutica !== undefined) {
    apiUpdates.medication_type = updates.formaFarmaceutica;
  }

  if (updates.viaAdministracion !== undefined) {
    apiUpdates.description = updates.viaAdministracion;
  }

  return apiUpdates;
}
