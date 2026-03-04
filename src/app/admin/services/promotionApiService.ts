/**
 * Servicio de integración con API real para Promociones
 * Reemplaza el uso de Zustand store por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Promociones del admin.
 */

import { promotionsApi, type PromotionData } from '@/services/api/promotionsApi';
import { branchesApi } from '@/services/api/branchesApi';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Interface para Promotion del frontend (basada en el store de Zustand)
 */
export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number; // Monto mínimo de compra
  maxDiscountAmount?: number; // Descuento máximo aplicable
  services: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  isStackable?: boolean; // Puede combinarse con otras promociones
  usageCount?: number;
  usageLimit?: number;
  usageLimitPerPatient?: number; // Límite de usos por paciente
  conditions: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sedeId?: string;
  targetAudience?: 'all' | 'new_clients' | 'continuing_clients';
}

/**
 * Mapea una promoción del backend al formato del frontend
 */
const mapBackendPromotionToFrontend = (backendPromotion: PromotionData): Promotion => {
  // Usar el código del backend si existe, sino generar uno temporal
  const code = backendPromotion.promotion_code ||
    `PROMO-${backendPromotion.promotion_id || Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Map discount type (consistente con constantes: 'percentage' | 'fixed')
  let discountType: 'percentage' | 'fixed' = 'percentage';
  if (backendPromotion.discount_type === 'percentage') discountType = 'percentage';
  else if (backendPromotion.discount_type === 'fixed' || backendPromotion.discount_type === 'fixed_amount') {
    discountType = 'fixed';
  }

  // Parse services from JSON if needed (campo applicable_procedures en BD)
  let services: string[] = [];
  if (backendPromotion.applicable_procedures) {
    try {
      const parsed = typeof backendPromotion.applicable_procedures === 'string'
        ? JSON.parse(backendPromotion.applicable_procedures)
        : backendPromotion.applicable_procedures;
      services = Array.isArray(parsed) ? parsed : [];
    } catch {
      services = [];
    }
  }

  // Parse conditions from JSON if needed
  let conditions: string[] = [];
  if (backendPromotion.terms_and_conditions) {
    try {
      const parsed = typeof backendPromotion.terms_and_conditions === 'string'
        ? JSON.parse(backendPromotion.terms_and_conditions)
        : backendPromotion.terms_and_conditions;
      conditions = Array.isArray(parsed) ? parsed : [backendPromotion.terms_and_conditions];
    } catch {
      conditions = backendPromotion.terms_and_conditions ? [backendPromotion.terms_and_conditions] : [];
    }
  }

  return {
    id: backendPromotion.promotion_id?.toString() || '',
    title: backendPromotion.promotion_name || '',
    description: backendPromotion.description || '',
    code: code,
    discountType: discountType,
    discountValue: backendPromotion.discount_value || 0,
    minPurchaseAmount: backendPromotion.min_purchase_amount,
    maxDiscountAmount: backendPromotion.max_discount_amount,
    services: services,
    startDate: backendPromotion.start_date || formatDateToYMD(new Date()),
    endDate: backendPromotion.end_date || formatDateToYMD(new Date()),
    isActive: backendPromotion.is_active !== false,
    isStackable: backendPromotion.is_stackable || false,
    usageCount: backendPromotion.current_uses || 0,
    usageLimit: backendPromotion.max_uses,
    usageLimitPerPatient: backendPromotion.max_uses_per_patient,
    conditions: conditions,
    createdBy: 'admin', // Could be mapped from user data
    createdAt: new Date(backendPromotion.created_at || new Date()),
    updatedAt: new Date(backendPromotion.updated_at || new Date()),
    sedeId: backendPromotion.branch_id?.toString(),
    targetAudience: (backendPromotion.target_audience as 'all' | 'new_clients' | 'continuing_clients') || 'all'
  };
};

/**
 * Mapea una promoción del frontend al formato del backend
 */
const mapFrontendPromotionToBackend = (
  frontendPromotion: Partial<Promotion>,
  branchId: number = 1
): Partial<PromotionData> => {
  const data: Partial<PromotionData> = {};

  data.branch_id = branchId;
  data.promotion_type = 'clinic'; // Tipo por defecto para clínica dental

  if (frontendPromotion.title) data.promotion_name = frontendPromotion.title;
  if (frontendPromotion.code) data.promotion_code = frontendPromotion.code;
  if (frontendPromotion.description) data.description = frontendPromotion.description;

  // Map discount type
  if (frontendPromotion.discountType) {
    data.discount_type = frontendPromotion.discountType;
  }

  if (frontendPromotion.discountValue !== undefined) {
    data.discount_value = frontendPromotion.discountValue;
  }

  // Montos adicionales
  if (frontendPromotion.minPurchaseAmount !== undefined) {
    data.min_purchase_amount = frontendPromotion.minPurchaseAmount;
  }

  if (frontendPromotion.maxDiscountAmount !== undefined) {
    data.max_discount_amount = frontendPromotion.maxDiscountAmount;
  }

  if (frontendPromotion.startDate) {
    data.start_date = frontendPromotion.startDate;
  }

  if (frontendPromotion.endDate) {
    data.end_date = frontendPromotion.endDate;
  }

  if (frontendPromotion.isActive !== undefined) {
    data.is_active = frontendPromotion.isActive;
  }

  // Convert services to JSON (campo applicable_procedures en BD)
  if (frontendPromotion.services) {
    data.applicable_procedures = JSON.stringify(frontendPromotion.services);
  }

  // Convert conditions to JSON
  if (frontendPromotion.conditions) {
    data.terms_and_conditions = JSON.stringify(frontendPromotion.conditions);
  }

  if (frontendPromotion.usageLimit) {
    data.max_uses = frontendPromotion.usageLimit;
  }

  if (frontendPromotion.usageCount !== undefined) {
    data.current_uses = frontendPromotion.usageCount;
  }

  if (frontendPromotion.isStackable !== undefined) {
    data.is_stackable = frontendPromotion.isStackable;
  }

  if (frontendPromotion.usageLimitPerPatient) {
    data.max_uses_per_patient = frontendPromotion.usageLimitPerPatient;
  }

  // Audiencia objetivo (segmentación por tipo de cliente)
  if (frontendPromotion.targetAudience) {
    data.target_audience = frontendPromotion.targetAudience;
  }

  return data;
};

export const PromotionApiService = {
  /**
   * Carga todas las promociones desde el backend
   */
  async loadPromotions(filters?: { branchId?: number; isActive?: boolean }): Promise<Promotion[]> {
    try {
      const response = await promotionsApi.getPromotions({
        branch_id: filters?.branchId,
        is_active: filters?.isActive,
        limit: 1000
      });

      return response.data.map(mapBackendPromotionToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene una promoción por su ID
   */
  async getPromotionById(promotionId: string): Promise<Promotion> {
    try {
      const response = await promotionsApi.getPromotionById(parseInt(promotionId));
      return mapBackendPromotionToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea una nueva promoción
   */
  async createPromotion(promotion: Partial<Promotion>, branchId: number = 1): Promise<Promotion> {
    try {
      const backendData = mapFrontendPromotionToBackend(promotion, branchId) as PromotionData;

      // Validate required fields
      if (!backendData.promotion_name || !backendData.branch_id) {
        throw new Error('Faltan campos requeridos para crear la promoción');
      }

      const response = await promotionsApi.createPromotion(backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPromotionToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza una promoción existente
   */
  async updatePromotion(promotionId: string, promotionData: Partial<Promotion>): Promise<Promotion> {
    try {
      const branchId = promotionData.sedeId ? parseInt(promotionData.sedeId) : 1;
      const backendData = mapFrontendPromotionToBackend(promotionData, branchId);

      const response = await promotionsApi.updatePromotion(parseInt(promotionId), backendData);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return mapBackendPromotionToFrontend(response.data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Elimina una promoción
   */
  async deletePromotion(promotionId: string): Promise<void> {
    try {
      await promotionsApi.deletePromotion(parseInt(promotionId));
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene promociones activas
   */
  async getActivePromotions(branchId?: number): Promise<Promotion[]> {
    try {
      const data = await promotionsApi.getActivePromotions(branchId);
      return data.map(mapBackendPromotionToFrontend);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene promociones por sede
   */
  async getPromotionsBySede(sedeId: string): Promise<Promotion[]> {
    try {
      const response = await promotionsApi.getPromotions({
        branch_id: parseInt(sedeId),
        limit: 1000
      });

      return response.data.map(mapBackendPromotionToFrontend);
    } catch (error) {
      throw error;
    }
  }
};
