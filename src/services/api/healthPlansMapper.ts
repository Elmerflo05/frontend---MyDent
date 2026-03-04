/**
 * Mapper para convertir datos de health plans entre backend (snake_case) y frontend (camelCase)
 */

import { type BaseHealthPlan, HealthPlanType, HealthPlanStatus, BillingCycle } from '@/types/healthPlans';
import { type HealthPlanData } from './healthPlansApi';

/**
 * Convierte plan de salud del backend al formato del frontend
 */
export function mapHealthPlanFromBackend(backendPlan: HealthPlanData): BaseHealthPlan {
  // Mapear tipo de plan
  const typeMap: Record<string, HealthPlanType> = {
    'personal': HealthPlanType.BASIC,
    'familiar': HealthPlanType.FAMILY,
    'planitium': HealthPlanType.PREMIUM,
    'gold': HealthPlanType.PREMIUM
  };

  return {
    id: backendPlan.health_plan_id?.toString() || '',
    name: backendPlan.plan_name,
    description: backendPlan.description || '',
    type: typeMap[backendPlan.plan_type] || HealthPlanType.BASIC,
    status: backendPlan.is_active ? HealthPlanStatus.ACTIVE : HealthPlanStatus.INACTIVE,

    // Precios (convertir de string a número - PostgreSQL numeric retorna string en JSON)
    price: parseFloat(String(backendPlan.monthly_fee || 0)),
    billingCycle: BillingCycle.MONTHLY,
    setupFee: parseFloat(String(backendPlan.enrollment_fee || 0)),

    // Código del plan (personal, familiar, oro, platinium)
    planCode: backendPlan.plan_code || backendPlan.plan_type || undefined,

    // Términos (generar IDs basados en el plan)
    termsId: `TERMS-${backendPlan.plan_code || backendPlan.health_plan_id}`,
    currentTermsVersion: '1.0',

    // Restricciones
    maxSubscribers: backendPlan.max_subscribers || undefined,
    minAge: 0,
    maxAge: 100,
    requiresMedicalHistory: false,

    // Metadata
    sedeId: undefined, // Los planes son globales
    createdAt: backendPlan.date_time_registration ? new Date(backendPlan.date_time_registration) : new Date(),
    updatedAt: backendPlan.date_time_modification ? new Date(backendPlan.date_time_modification) : new Date(),
    createdBy: backendPlan.user_id_registration?.toString() || 'system',
    updatedBy: backendPlan.user_id_modification?.toString() || undefined
  };
}

/**
 * Convierte m�ltiples planes del backend al formato del frontend
 */
export function mapHealthPlansFromBackend(backendPlans: HealthPlanData[]): BaseHealthPlan[] {
  return backendPlans.map(mapHealthPlanFromBackend);
}

/**
 * Convierte plan de salud del frontend al formato del backend (para crear/actualizar)
 */
export function mapHealthPlanToBackend(frontendPlan: Omit<BaseHealthPlan, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Partial<HealthPlanData> {
  // Mapear tipo de plan al formato backend
  const typeMapReverse: Record<string, string> = {
    [HealthPlanType.BASIC]: 'personal',
    [HealthPlanType.FAMILY]: 'familiar',
    [HealthPlanType.PREMIUM]: 'planitium'
  };

  return {
    plan_name: frontendPlan.name,
    plan_code: typeMapReverse[frontendPlan.type] || 'personal',
    plan_type: typeMapReverse[frontendPlan.type] || 'personal',
    description: frontendPlan.description,
    monthly_fee: frontendPlan.price,
    enrollment_fee: frontendPlan.setupFee || 0,
    max_subscribers: frontendPlan.maxSubscribers,
    is_active: frontendPlan.status === HealthPlanStatus.ACTIVE
  };
}
