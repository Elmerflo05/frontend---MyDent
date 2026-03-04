// ============================================================================
// HEALTH PLAN SERVICE - Single Responsibility: Gestión CRUD de Planes de Salud
// ============================================================================
// TODO: Migrar completamente a healthPlansApi cuando esté disponible

import healthPlansApi, { type HealthPlanData } from '@/services/api/healthPlansApi';
import { mapHealthPlansFromBackend, mapHealthPlanFromBackend } from '@/services/api/healthPlansMapper';
import {
  HealthPlanStatus
} from '@/types/healthPlans';
import type {
  BaseHealthPlan,
  CreateHealthPlanDTO,
  UpdateHealthPlanDTO,
  IHealthPlanManager,
  IHealthPlanViewer,
  HealthPlanType,
  HealthPlanTerms
} from '@/types/healthPlans';

// Almacenamiento temporal en memoria para términos (stub)
let termsStore: HealthPlanTerms[] = [];

/**
 * Servicio para gestión de Planes de Salud (SuperAdmin/Admin)
 * SRP: Solo maneja operaciones CRUD de planes
 *
 * NOTA: Este servicio ahora usa healthPlansApi para comunicarse con el backend.
 */
export class HealthPlanService implements IHealthPlanManager, IHealthPlanViewer {

  /**
   * Crear un nuevo plan de salud
   * TODO: Implementar endpoint de creación en el backend
   */
  async createPlan(dto: CreateHealthPlanDTO, createdBy: string): Promise<BaseHealthPlan> {
    console.warn('⚠️ HealthPlanService.createPlan: Función stub - requiere endpoint de creación en API');

    // Crear términos en memoria
    const termsId = `TERMS-${Date.now()}`;
    const terms: HealthPlanTerms = {
      id: termsId,
      version: dto.terms.version,
      content: dto.terms.content,
      effectiveDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };
    termsStore.push(terms);

    // Crear el plan (stub - devuelve objeto local)
    const plan: BaseHealthPlan = {
      id: `PLAN-${Date.now()}`,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      status: HealthPlanStatus.ACTIVE,
      price: dto.price,
      billingCycle: dto.billingCycle,
      setupFee: dto.setupFee,
      termsId,
      currentTermsVersion: dto.terms.version,
      maxSubscribers: dto.maxSubscribers,
      minAge: dto.minAge,
      maxAge: dto.maxAge,
      requiresMedicalHistory: dto.requiresMedicalHistory,
      sedeId: dto.sedeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    return plan;
  }

  /**
   * Actualizar un plan existente
   */
  async updatePlan(id: string, updates: UpdateHealthPlanDTO): Promise<BaseHealthPlan> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`ID de plan inválido: ${id}`);
    }

    // Mapear el DTO del frontend al formato del backend
    const backendData: Partial<import('@/services/api/healthPlansApi').HealthPlanData> = {};

    if (updates.name !== undefined) backendData.plan_name = updates.name;
    if (updates.description !== undefined) backendData.description = updates.description;
    if (updates.type !== undefined) backendData.plan_type = updates.type;
    if (updates.price !== undefined) backendData.monthly_fee = updates.price;
    if (updates.setupFee !== undefined) backendData.enrollment_fee = updates.setupFee;
    if (updates.maxSubscribers !== undefined) backendData.max_subscribers = updates.maxSubscribers;
    if (updates.status !== undefined) {
      backendData.status = updates.status;
      backendData.is_active = updates.status === 'active';
    }

    const response = await healthPlansApi.updateHealthPlan(numericId, backendData);

    if (response.data) {
      const plans = mapHealthPlansFromBackend([response.data]);
      return plans[0];
    }

    throw new Error('No se pudo actualizar el plan');
  }

  /**
   * Eliminar un plan (soft delete - cambiar status a INACTIVE)
   */
  async deletePlan(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`ID de plan inválido: ${id}`);
    }
    // Soft delete: desactivar el plan
    await healthPlansApi.deactivateHealthPlan(numericId);
  }

  /**
   * Activar un plan
   */
  async activatePlan(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`ID de plan inválido: ${id}`);
    }
    await healthPlansApi.activateHealthPlan(numericId);
  }

  /**
   * Desactivar un plan
   */
  async deactivatePlan(id: string): Promise<void> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`ID de plan inválido: ${id}`);
    }
    await healthPlansApi.deactivateHealthPlan(numericId);
  }

  /**
   * Obtener planes disponibles (solo activos)
   */
  async getAvailablePlans(): Promise<BaseHealthPlan[]> {
    try {
      const backendPlans = await healthPlansApi.getActivePlans();
      return mapHealthPlansFromBackend(backendPlans);
    } catch (error) {
      console.error('Error obteniendo planes activos:', error);
      return [];
    }
  }

  /**
   * Obtener plan por ID
   */
  async getPlanById(id: string): Promise<BaseHealthPlan | null> {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return null;

      const response = await healthPlansApi.getHealthPlanById(numericId);
      if (response.data) {
        const plans = mapHealthPlansFromBackend([response.data]);
        return plans[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo plan por ID:', error);
      return null;
    }
  }

  /**
   * Obtener términos de un plan
   */
  async getPlanTerms(termsId: string): Promise<HealthPlanTerms | null> {
    // Buscar en el almacenamiento en memoria
    return termsStore.find(t => t.id === termsId) || null;
  }

  /**
   * Comparar múltiples planes
   */
  async comparePlans(planIds: string[]): Promise<BaseHealthPlan[]> {
    const plans = await Promise.all(
      planIds.map(id => this.getPlanById(id))
    );
    return plans.filter((p): p is BaseHealthPlan => p !== null);
  }

  /**
   * Obtener todos los planes (para admin)
   */
  async getAllPlans(): Promise<BaseHealthPlan[]> {
    try {
      const response = await healthPlansApi.getHealthPlans({ limit: 1000 });
      return mapHealthPlansFromBackend(response.data);
    } catch (error) {
      console.error('Error obteniendo todos los planes:', error);
      return [];
    }
  }

  /**
   * Obtener planes por sede
   */
  async getPlansBySede(sedeId: string): Promise<BaseHealthPlan[]> {
    // TODO: Agregar filtro por sede en la API
    const allPlans = await this.getAllPlans();
    return allPlans.filter(p => p.sedeId === sedeId);
  }

  /**
   * Obtener planes por tipo
   */
  async getPlansByType(type: HealthPlanType): Promise<BaseHealthPlan[]> {
    try {
      const response = await healthPlansApi.getHealthPlans({ plan_type: type });
      return mapHealthPlansFromBackend(response.data);
    } catch (error) {
      console.error('Error obteniendo planes por tipo:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const healthPlanService = new HealthPlanService();
