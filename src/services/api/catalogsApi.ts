/**
 * API Service para Catálogos
 * Maneja todas las operaciones de catálogos del sistema
 */

import httpClient, { ApiResponse } from './httpClient';

// Interfaces base para catálogos
export interface CatalogItem {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogResponse<T = CatalogItem> {
  success: boolean;
  data: T[];
}

export interface CatalogItemResponse<T = CatalogItem> {
  success: boolean;
  data: T;
  message?: string;
}

// Tipos específicos de catálogos
export type GenderData = CatalogItem;
export type BloodTypeData = CatalogItem;
export type DocumentTypeData = CatalogItem;
export type MaritalStatusData = CatalogItem;
export type IdentificationTypeData = CatalogItem;
export type MedicationUnitData = CatalogItem;
export type UserStatusData = CatalogItem;
export type DiagnosisOptionData = CatalogItem & { severity_level?: string };
export type AppointmentStatusData = CatalogItem & { color?: string };
export type BudgetStatusData = CatalogItem & { color?: string };
export type TreatmentStatusData = CatalogItem & { color?: string };
export type TreatmentPlanStatusData = CatalogItem & { color?: string };
export type ReminderTypeData = CatalogItem;
export type PaymentMethodData = CatalogItem;
export type SpecialtyData = CatalogItem;
export type ToothPositionData = CatalogItem & { tooth_number?: string };
export type ToothSurfaceData = CatalogItem & { surface_code?: string };
export type PrescriptionFrequencyData = CatalogItem & { times_per_day?: number };
export type PrescriptionDurationData = CatalogItem & { days?: number };

// Dental Conditions (Condiciones Dentales del Odontograma)
export interface DentalConditionData {
  condition_id?: number;
  condition_code: string;
  condition_name: string;
  category: 'patologia' | 'anomalia' | 'tratamiento' | 'protesis' | 'ortodoncia';
  cie10_code?: string;
  abbreviation?: string;
  abbreviations?: Record<string, string>;
  description?: string;
  specifications?: string;
  // Precios - Columnas separadas en BD
  price_base?: number;
  price_state_good?: number;
  price_state_bad?: number;
  // Campos legacy (mantener por compatibilidad)
  default_price?: number;
  prices?: Record<string, number>;
  symbol_type: string;
  color_type: string;
  fill_surfaces?: boolean;
  between_teeth?: boolean;
  color_conditional?: Record<string, string>;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Condition Procedures (Procedimientos por Condición)
export interface ConditionProcedureData {
  condition_procedure_id?: number;
  odontogram_condition_id: number;
  procedure_name: string;
  procedure_code?: string;
  specialty?: string;
  // Precios por plan de salud
  price_without_plan?: number;
  price_plan_personal?: number | null;
  price_plan_familiar?: number | null;
  price_plan_platinium?: number | null;
  price_plan_oro?: number | null;
  // Estado al que aplica (null=ambos, 'good'=buen estado, 'bad'=mal estado)
  applies_to_state?: string | null;
  observations?: string;
  display_order?: number;
  status?: string;
  date_time_registration?: string;
  date_time_modification?: string;
}

/**
 * Servicio genérico para catálogos
 */
class CatalogsApiService {
  /**
   * Método genérico para obtener items de un catálogo
   */
  private async getCatalog<T = CatalogItem>(catalogPath: string): Promise<CatalogResponse<T>> {
    try {
      const response = await httpClient.get<CatalogResponse<T>>(`/catalogs/${catalogPath}`);
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método genérico para obtener un item por ID
   */
  private async getCatalogItem<T = CatalogItem>(catalogPath: string, id: number): Promise<CatalogItemResponse<T>> {
    try {
      const response = await httpClient.get<CatalogItemResponse<T>>(`/catalogs/${catalogPath}/${id}`);
      if (!response.success || !response.data) {
        throw new Error('Item no encontrado');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método genérico para crear item
   */
  private async createCatalogItem<T = CatalogItem>(catalogPath: string, data: Partial<T>): Promise<CatalogItemResponse<T>> {
    try {
      const response = await httpClient.post<CatalogItemResponse<T>>(`/catalogs/${catalogPath}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al crear item');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método genérico para actualizar item
   */
  private async updateCatalogItem<T = CatalogItem>(catalogPath: string, id: number, data: Partial<T>): Promise<CatalogItemResponse<T>> {
    try {
      const response = await httpClient.put<CatalogItemResponse<T>>(`/catalogs/${catalogPath}/${id}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error al actualizar item');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método genérico para eliminar item
   */
  private async deleteCatalogItem(catalogPath: string, id: number): Promise<ApiResponse> {
    try {
      const response = await httpClient.delete(`/catalogs/${catalogPath}/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Error al eliminar item');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== CATÁLOGOS ESPECÍFICOS ====================

  // Géneros
  getGenders = () => this.getCatalog<GenderData>('genders');
  getGender = (id: number) => this.getCatalogItem<GenderData>('genders', id);
  createGender = (data: Partial<GenderData>) => this.createCatalogItem<GenderData>('genders', data);
  updateGender = (id: number, data: Partial<GenderData>) => this.updateCatalogItem<GenderData>('genders', id, data);
  deleteGender = (id: number) => this.deleteCatalogItem('genders', id);

  // Tipos de sangre
  getBloodTypes = () => this.getCatalog<BloodTypeData>('blood-types');
  getBloodType = (id: number) => this.getCatalogItem<BloodTypeData>('blood-types', id);
  createBloodType = (data: Partial<BloodTypeData>) => this.createCatalogItem<BloodTypeData>('blood-types', data);
  updateBloodType = (id: number, data: Partial<BloodTypeData>) => this.updateCatalogItem<BloodTypeData>('blood-types', id, data);
  deleteBloodType = (id: number) => this.deleteCatalogItem('blood-types', id);

  // Tipos de documento
  getDocumentTypes = () => this.getCatalog<DocumentTypeData>('document-types');
  getDocumentType = (id: number) => this.getCatalogItem<DocumentTypeData>('document-types', id);
  createDocumentType = (data: Partial<DocumentTypeData>) => this.createCatalogItem<DocumentTypeData>('document-types', data);
  updateDocumentType = (id: number, data: Partial<DocumentTypeData>) => this.updateCatalogItem<DocumentTypeData>('document-types', id, data);
  deleteDocumentType = (id: number) => this.deleteCatalogItem('document-types', id);

  // Estados civiles
  getMaritalStatuses = () => this.getCatalog<MaritalStatusData>('marital-statuses');
  getMaritalStatus = (id: number) => this.getCatalogItem<MaritalStatusData>('marital-statuses', id);
  createMaritalStatus = (data: Partial<MaritalStatusData>) => this.createCatalogItem<MaritalStatusData>('marital-statuses', data);
  updateMaritalStatus = (id: number, data: Partial<MaritalStatusData>) => this.updateCatalogItem<MaritalStatusData>('marital-statuses', id, data);
  deleteMaritalStatus = (id: number) => this.deleteCatalogItem('marital-statuses', id);

  // Tipos de identificación
  getIdentificationTypes = () => this.getCatalog<IdentificationTypeData>('identification-types');
  getIdentificationType = (id: number) => this.getCatalogItem<IdentificationTypeData>('identification-types', id);
  createIdentificationType = (data: Partial<IdentificationTypeData>) => this.createCatalogItem<IdentificationTypeData>('identification-types', data);
  updateIdentificationType = (id: number, data: Partial<IdentificationTypeData>) => this.updateCatalogItem<IdentificationTypeData>('identification-types', id, data);
  deleteIdentificationType = (id: number) => this.deleteCatalogItem('identification-types', id);

  // Unidades de medicación
  getMedicationUnits = () => this.getCatalog<MedicationUnitData>('medication-units');
  getMedicationUnit = (id: number) => this.getCatalogItem<MedicationUnitData>('medication-units', id);
  createMedicationUnit = (data: Partial<MedicationUnitData>) => this.createCatalogItem<MedicationUnitData>('medication-units', data);
  updateMedicationUnit = (id: number, data: Partial<MedicationUnitData>) => this.updateCatalogItem<MedicationUnitData>('medication-units', id, data);
  deleteMedicationUnit = (id: number) => this.deleteCatalogItem('medication-units', id);

  // Estados de usuario
  getUserStatuses = () => this.getCatalog<UserStatusData>('user-statuses');
  getUserStatus = (id: number) => this.getCatalogItem<UserStatusData>('user-statuses', id);
  createUserStatus = (data: Partial<UserStatusData>) => this.createCatalogItem<UserStatusData>('user-statuses', data);
  updateUserStatus = (id: number, data: Partial<UserStatusData>) => this.updateCatalogItem<UserStatusData>('user-statuses', id, data);
  deleteUserStatus = (id: number) => this.deleteCatalogItem('user-statuses', id);

  // Opciones de diagnóstico
  getDiagnosisOptions = () => this.getCatalog<DiagnosisOptionData>('diagnosis-options');
  getDiagnosisOption = (id: number) => this.getCatalogItem<DiagnosisOptionData>('diagnosis-options', id);
  createDiagnosisOption = (data: Partial<DiagnosisOptionData>) => this.createCatalogItem<DiagnosisOptionData>('diagnosis-options', data);
  updateDiagnosisOption = (id: number, data: Partial<DiagnosisOptionData>) => this.updateCatalogItem<DiagnosisOptionData>('diagnosis-options', id, data);
  deleteDiagnosisOption = (id: number) => this.deleteCatalogItem('diagnosis-options', id);

  // Estados de cita
  getAppointmentStatuses = () => this.getCatalog<AppointmentStatusData>('appointment-statuses');
  getAppointmentStatus = (id: number) => this.getCatalogItem<AppointmentStatusData>('appointment-statuses', id);
  createAppointmentStatus = (data: Partial<AppointmentStatusData>) => this.createCatalogItem<AppointmentStatusData>('appointment-statuses', data);
  updateAppointmentStatus = (id: number, data: Partial<AppointmentStatusData>) => this.updateCatalogItem<AppointmentStatusData>('appointment-statuses', id, data);
  deleteAppointmentStatus = (id: number) => this.deleteCatalogItem('appointment-statuses', id);

  // Estados de presupuesto
  getBudgetStatuses = () => this.getCatalog<BudgetStatusData>('budget-statuses');
  getBudgetStatus = (id: number) => this.getCatalogItem<BudgetStatusData>('budget-statuses', id);
  createBudgetStatus = (data: Partial<BudgetStatusData>) => this.createCatalogItem<BudgetStatusData>('budget-statuses', data);
  updateBudgetStatus = (id: number, data: Partial<BudgetStatusData>) => this.updateCatalogItem<BudgetStatusData>('budget-statuses', id, data);
  deleteBudgetStatus = (id: number) => this.deleteCatalogItem('budget-statuses', id);

  // Estados de tratamiento
  getTreatmentStatuses = () => this.getCatalog<TreatmentStatusData>('treatment-statuses');
  getTreatmentStatus = (id: number) => this.getCatalogItem<TreatmentStatusData>('treatment-statuses', id);
  createTreatmentStatus = (data: Partial<TreatmentStatusData>) => this.createCatalogItem<TreatmentStatusData>('treatment-statuses', data);
  updateTreatmentStatus = (id: number, data: Partial<TreatmentStatusData>) => this.updateCatalogItem<TreatmentStatusData>('treatment-statuses', id, data);
  deleteTreatmentStatus = (id: number) => this.deleteCatalogItem('treatment-statuses', id);

  // Estados de plan de tratamiento
  getTreatmentPlanStatuses = () => this.getCatalog<TreatmentPlanStatusData>('treatment-plan-statuses');
  getTreatmentPlanStatus = (id: number) => this.getCatalogItem<TreatmentPlanStatusData>('treatment-plan-statuses', id);
  createTreatmentPlanStatus = (data: Partial<TreatmentPlanStatusData>) => this.createCatalogItem<TreatmentPlanStatusData>('treatment-plan-statuses', data);
  updateTreatmentPlanStatus = (id: number, data: Partial<TreatmentPlanStatusData>) => this.updateCatalogItem<TreatmentPlanStatusData>('treatment-plan-statuses', id, data);
  deleteTreatmentPlanStatus = (id: number) => this.deleteCatalogItem('treatment-plan-statuses', id);

  // Tipos de recordatorio
  getReminderTypes = () => this.getCatalog<ReminderTypeData>('reminder-types');
  getReminderType = (id: number) => this.getCatalogItem<ReminderTypeData>('reminder-types', id);
  createReminderType = (data: Partial<ReminderTypeData>) => this.createCatalogItem<ReminderTypeData>('reminder-types', data);
  updateReminderType = (id: number, data: Partial<ReminderTypeData>) => this.updateCatalogItem<ReminderTypeData>('reminder-types', id, data);
  deleteReminderType = (id: number) => this.deleteCatalogItem('reminder-types', id);

  // Métodos de pago
  getPaymentMethods = () => this.getCatalog<PaymentMethodData>('payment-methods');
  getPaymentMethod = (id: number) => this.getCatalogItem<PaymentMethodData>('payment-methods', id);
  createPaymentMethod = (data: Partial<PaymentMethodData>) => this.createCatalogItem<PaymentMethodData>('payment-methods', data);
  updatePaymentMethod = (id: number, data: Partial<PaymentMethodData>) => this.updateCatalogItem<PaymentMethodData>('payment-methods', id, data);
  deletePaymentMethod = (id: number) => this.deleteCatalogItem('payment-methods', id);

  // Especialidades
  getSpecialties = () => this.getCatalog<SpecialtyData>('specialties');
  getSpecialty = (id: number) => this.getCatalogItem<SpecialtyData>('specialties', id);
  createSpecialty = (data: Partial<SpecialtyData>) => this.createCatalogItem<SpecialtyData>('specialties', data);
  updateSpecialty = (id: number, data: Partial<SpecialtyData>) => this.updateCatalogItem<SpecialtyData>('specialties', id, data);
  deleteSpecialty = (id: number) => this.deleteCatalogItem('specialties', id);

  // Posiciones dentales
  getToothPositions = () => this.getCatalog<ToothPositionData>('tooth-positions');
  getToothPosition = (id: number) => this.getCatalogItem<ToothPositionData>('tooth-positions', id);
  createToothPosition = (data: Partial<ToothPositionData>) => this.createCatalogItem<ToothPositionData>('tooth-positions', data);
  updateToothPosition = (id: number, data: Partial<ToothPositionData>) => this.updateCatalogItem<ToothPositionData>('tooth-positions', id, data);
  deleteToothPosition = (id: number) => this.deleteCatalogItem('tooth-positions', id);

  // Superficies dentales
  getToothSurfaces = () => this.getCatalog<ToothSurfaceData>('tooth-surfaces');
  getToothSurface = (id: number) => this.getCatalogItem<ToothSurfaceData>('tooth-surfaces', id);
  createToothSurface = (data: Partial<ToothSurfaceData>) => this.createCatalogItem<ToothSurfaceData>('tooth-surfaces', data);
  updateToothSurface = (id: number, data: Partial<ToothSurfaceData>) => this.updateCatalogItem<ToothSurfaceData>('tooth-surfaces', id, data);
  deleteToothSurface = (id: number) => this.deleteCatalogItem('tooth-surfaces', id);

  // Frecuencias de prescripción
  getPrescriptionFrequencies = () => this.getCatalog<PrescriptionFrequencyData>('prescription-frequencies');
  getPrescriptionFrequency = (id: number) => this.getCatalogItem<PrescriptionFrequencyData>('prescription-frequencies', id);
  createPrescriptionFrequency = (data: Partial<PrescriptionFrequencyData>) => this.createCatalogItem<PrescriptionFrequencyData>('prescription-frequencies', data);
  updatePrescriptionFrequency = (id: number, data: Partial<PrescriptionFrequencyData>) => this.updateCatalogItem<PrescriptionFrequencyData>('prescription-frequencies', id, data);
  deletePrescriptionFrequency = (id: number) => this.deleteCatalogItem('prescription-frequencies', id);

  // Duraciones de prescripción
  getPrescriptionDurations = () => this.getCatalog<PrescriptionDurationData>('prescription-durations');
  getPrescriptionDuration = (id: number) => this.getCatalogItem<PrescriptionDurationData>('prescription-durations', id);
  createPrescriptionDuration = (data: Partial<PrescriptionDurationData>) => this.createCatalogItem<PrescriptionDurationData>('prescription-durations', data);
  updatePrescriptionDuration = (id: number, data: Partial<PrescriptionDurationData>) => this.updateCatalogItem<PrescriptionDurationData>('prescription-durations', id, data);
  deletePrescriptionDuration = (id: number) => this.deleteCatalogItem('prescription-durations', id);

  // ==================== ENDPOINTS UNIFICADOS DE ODONTOGRAMA ====================

  /**
   * Obtener todos los catálogos del odontograma en una sola petición
   * @returns Objeto con todos los catálogos
   */
  async getAllOdontogramCatalogs() {
    try {
      const response = await httpClient.get('/catalogs/all');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de catálogos
   * @returns Objeto con conteo de registros
   */
  async getCatalogStatistics() {
    try {
      const response = await httpClient.get('/catalogs/statistics');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener opciones de diagnóstico agrupadas por categoría
   * @returns Objeto con diagnósticos agrupados
   */
  async getDiagnosisOptionsByCategory() {
    try {
      const response = await httpClient.get('/catalogs/diagnosis-options/by-category');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener procedimientos dentales agrupados por categoría
   * @returns Objeto con procedimientos agrupados
   */
  async getDentalProceduresByCategory() {
    try {
      const response = await httpClient.get('/catalogs/dental-procedures/by-category');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener información de un diente específico por su número FDI
   * @param toothNumber Número FDI del diente (ej: 11, 21, 51)
   * @returns Información completa del diente
   */
  async getToothPositionByNumber(toothNumber: string) {
    try {
      const response = await httpClient.get(`/catalogs/tooth-positions/${toothNumber}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener posiciones dentales con filtros
   * @param filters Filtros opcionales (is_adult, quadrant, tooth_type)
   * @returns Array de posiciones filtradas
   */
  async getFilteredToothPositions(filters?: {
    is_adult?: boolean;
    quadrant?: number;
    tooth_type?: string;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.is_adult !== undefined) {
        params.append('is_adult', String(filters.is_adult));
      }
      if (filters?.quadrant !== undefined) {
        params.append('quadrant', String(filters.quadrant));
      }
      if (filters?.tooth_type) {
        params.append('tooth_type', filters.tooth_type);
      }

      const queryString = params.toString();
      const url = queryString ? `/catalogs/tooth-positions?${queryString}` : '/catalogs/tooth-positions';
      const response = await httpClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener procedimientos dentales con filtros
   * @param filters Filtros opcionales (category, search, requires_anesthesia)
   * @returns Array de procedimientos filtrados
   */
  async getFilteredDentalProcedures(filters?: {
    category?: string;
    search?: string;
    requires_anesthesia?: boolean;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.requires_anesthesia !== undefined) {
        params.append('requires_anesthesia', String(filters.requires_anesthesia));
      }

      const queryString = params.toString();
      const url = queryString ? `/catalogs/dental-procedures?${queryString}` : '/catalogs/dental-procedures';
      const response = await httpClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener opciones de diagnóstico con filtros
   * @param filters Filtros opcionales (category, search)
   * @returns Array de diagnósticos filtrados
   */
  async getFilteredDiagnosisOptions(filters?: {
    category?: string;
    search?: string;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const queryString = params.toString();
      const url = queryString ? `/catalogs/diagnosis-options?${queryString}` : '/catalogs/diagnosis-options';
      const response = await httpClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== DENTAL CONDITIONS (Condiciones Dentales) ====================

  /**
   * Obtener todas las condiciones dentales
   * @param filters Filtros opcionales (category, search, status)
   * @returns Array de condiciones dentales
   */
  async getDentalConditions(filters?: {
    category?: string;
    search?: string;
    status?: string;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }

      const queryString = params.toString();
      const url = queryString ? `/catalogs/dental-conditions?${queryString}` : '/catalogs/dental-conditions';
      const response = await httpClient.get<CatalogResponse<DentalConditionData>>(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener condiciones dentales agrupadas por categoría
   * @returns Objeto con condiciones agrupadas por categoría
   */
  async getDentalConditionsByCategory() {
    try {
      const response = await httpClient.get('/catalogs/dental-conditions/by-category');
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener una condición dental por código
   * @param code Código de la condición (ej: caries-cd, restauracion)
   * @returns Condición dental completa
   */
  async getDentalConditionByCode(code: string) {
    try {
      const response = await httpClient.get<CatalogItemResponse<DentalConditionData>>(`/catalogs/dental-conditions/${code}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener una condición dental por ID
   * @param id ID de la condición
   * @returns Condición dental completa
   */
  async getDentalConditionById(id: number) {
    try {
      const response = await httpClient.get<CatalogItemResponse<DentalConditionData>>(`/catalogs/dental-conditions/id/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar precio por defecto de una condición
   * @param id ID de la condición
   * @param price Nuevo precio
   * @returns Condición actualizada
   */
  async updateConditionPrice(id: number, price: number) {
    try {
      const response = await httpClient.put<CatalogItemResponse<DentalConditionData>>(
        `/catalogs/dental-conditions/${id}/price`,
        { price }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar precios variables de una condición (JSON)
   * @param id ID de la condición
   * @param prices Objeto JSON con precios variables por tipo
   * @returns Condición actualizada
   */
  async updateConditionPrices(id: number, prices: Record<string, number>) {
    try {
      const response = await httpClient.put<CatalogItemResponse<DentalConditionData>>(
        `/catalogs/dental-conditions/${id}/prices`,
        { prices }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de condiciones dentales
   * @returns Estadísticas por categoría
   */
  async getDentalConditionsStatistics() {
    try {
      const response = await httpClient.get('/catalogs/dental-conditions/statistics');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==================== CONDITION PROCEDURES (Procedimientos por Condición) ====================

  /**
   * Obtener todos los procedimientos de una condición dental
   * @param conditionId ID de la condición
   * @returns Array de procedimientos asociados
   */
  async getConditionProcedures(conditionId: number) {
    try {
      const response = await httpClient.get<CatalogResponse<ConditionProcedureData>>(
        `/catalogs/dental-conditions/${conditionId}/procedures`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear un nuevo procedimiento para una condición
   * @param conditionId ID de la condición
   * @param procedureData Datos del procedimiento
   * @returns Procedimiento creado
   */
  async createConditionProcedure(conditionId: number, procedureData: Partial<ConditionProcedureData>) {
    try {
      const response = await httpClient.post<CatalogItemResponse<ConditionProcedureData>>(
        `/catalogs/dental-conditions/${conditionId}/procedures`,
        procedureData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar un procedimiento de una condición
   * @param conditionId ID de la condición
   * @param procedureId ID del procedimiento
   * @param procedureData Datos a actualizar
   * @returns Procedimiento actualizado
   */
  async updateConditionProcedure(
    conditionId: number,
    procedureId: number,
    procedureData: Partial<ConditionProcedureData>
  ) {
    try {
      const response = await httpClient.put<CatalogItemResponse<ConditionProcedureData>>(
        `/catalogs/dental-conditions/${conditionId}/procedures/${procedureId}`,
        procedureData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) un procedimiento de una condición
   * @param conditionId ID de la condición
   * @param procedureId ID del procedimiento
   * @returns Respuesta de eliminación
   */
  async deleteConditionProcedure(conditionId: number, procedureId: number) {
    try {
      const response = await httpClient.delete(
        `/catalogs/dental-conditions/${conditionId}/procedures/${procedureId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export const catalogsApi = new CatalogsApiService();
export default catalogsApi;
