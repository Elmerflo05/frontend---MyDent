/**
 * Mapper para convertir datos de promociones entre backend (snake_case) y frontend (camelCase)
 */

import { type Promotion } from '@/store/promotionStore';
import { type PromotionData } from './promotionsApi';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Convierte datos de promoción del backend al formato del frontend
 */
export function mapPromotionFromBackend(backendPromo: PromotionData): Promotion {
  // Parsear términos y condiciones
  let conditions: string[] = [];
  if (backendPromo.terms_and_conditions) {
    try {
      // Intentar parsear como JSON primero
      const parsed = JSON.parse(backendPromo.terms_and_conditions);
      conditions = Array.isArray(parsed) ? parsed : [backendPromo.terms_and_conditions];
    } catch {
      // Si no es JSON, separar por puntos
      conditions = backendPromo.terms_and_conditions.split('.').filter(c => c.trim()).map(c => c.trim());
    }
  }

  // Parsear procedimientos aplicables
  let services: string[] = [];
  if (backendPromo.applicable_procedures) {
    try {
      const parsed = typeof backendPromo.applicable_procedures === 'string'
        ? JSON.parse(backendPromo.applicable_procedures)
        : backendPromo.applicable_procedures;
      services = Array.isArray(parsed) ? parsed : [];
    } catch {
      services = [];
    }
  }

  return {
    id: backendPromo.promotion_id?.toString() || '',
    title: backendPromo.promotion_name,
    description: backendPromo.description || '',
    discountType: (backendPromo.discount_type as 'percentage' | 'fixed' | 'service') || 'percentage',
    discountValue: backendPromo.discount_value || 0,
    services: services,
    startDate: backendPromo.start_date ? new Date(backendPromo.start_date) : new Date(),
    endDate: backendPromo.end_date ? new Date(backendPromo.end_date) : new Date(),
    isActive: backendPromo.is_active !== undefined ? backendPromo.is_active : true,
    usageLimit: backendPromo.max_uses || undefined,
    usageCount: backendPromo.current_uses || 0,
    minimumAmount: backendPromo.min_purchase_amount ? Number(backendPromo.min_purchase_amount) : undefined,
    image: undefined, // No existe en backend actualmente
    conditions,
    targetAudience: (backendPromo.target_audience as 'all' | 'new_clients' | 'continuing_clients') || 'all',
    applicableScope: 'clinic' as const, // Por defecto clínica (viene del filtro)
    code: backendPromo.promotion_code || undefined,
    createdBy: backendPromo.user_id_registration?.toString() || 'system',
    sedeId: backendPromo.branch_id?.toString() || undefined,
    createdAt: backendPromo.created_at ? new Date(backendPromo.created_at) : new Date(),
    updatedAt: backendPromo.updated_at ? new Date(backendPromo.updated_at) : new Date()
  };
}

/**
 * Convierte múltiples promociones del backend al formato del frontend
 */
export function mapPromotionsFromBackend(backendPromos: PromotionData[]): Promotion[] {
  return backendPromos.map(mapPromotionFromBackend);
}

/**
 * Convierte datos de promoción del frontend al formato del backend
 */
export function mapPromotionToBackend(frontendPromo: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Partial<PromotionData> {
  return {
    branch_id: frontendPromo.sedeId ? parseInt(frontendPromo.sedeId) : undefined,
    promotion_name: frontendPromo.title,
    promotion_code: frontendPromo.code,
    promotion_type: frontendPromo.applicableScope, // 'clinic' | 'imaging'
    description: frontendPromo.description,
    discount_type: frontendPromo.discountType,
    discount_value: frontendPromo.discountValue,
    min_purchase_amount: frontendPromo.minimumAmount,
    start_date: formatDateToYMD(frontendPromo.startDate), // YYYY-MM-DD
    end_date: formatDateToYMD(frontendPromo.endDate),
    max_uses: frontendPromo.usageLimit,
    applicable_procedures: frontendPromo.services?.length > 0
      ? JSON.stringify(frontendPromo.services)
      : undefined,
    terms_and_conditions: frontendPromo.conditions?.length > 0
      ? JSON.stringify(frontendPromo.conditions)
      : undefined,
    is_active: frontendPromo.isActive,
    target_audience: frontendPromo.targetAudience || 'all'
    // user_id_registration se maneja en el backend automáticamente
  };
}
