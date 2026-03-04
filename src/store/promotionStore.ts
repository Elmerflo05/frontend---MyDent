import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Función para generar código de promoción único
const generatePromoCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1 para evitar confusión
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'service';
  discountValue: number;
  services: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  minimumAmount?: number;
  image?: string;
  conditions: string[];
  targetAudience: 'all' | 'patients' | 'external_clients';
  applicableScope: 'clinic' | 'imaging'; // 'clinic' = SOLO clínica odontológica, 'imaging' = SOLO centro de imágenes
  serviceType?: 'clinic' | 'all'; // DEPRECATED: Mantener por compatibilidad, usar applicableScope
  code?: string;
  createdBy: string;
  sedeId?: string; // ID de la sede (null para super_admin = todas las sedes)
  createdAt: Date;
  updatedAt: Date;
}

interface PromotionStore {
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  getActivePromotions: () => Promotion[];
  getActiveClinicPromotions: () => Promotion[]; // SOLO promociones de la clínica odontológica
  getActiveImagingPromotions: () => Promotion[]; // SOLO promociones del centro de imágenes
  getPromotionById: (id: string) => Promotion | undefined;
  getPromotionsBySede: (sedeId: string | null) => Promotion[];
  applyPromotion: (code: string, amount: number, services?: string[], appointmentType?: 'consultation' | 'imaging_study') => { valid: boolean; discount: number; message: string };
  incrementUsageCount: (id: string) => void;
  migratePromotionsWithoutCodes: () => void; // Función de migración
}

export const usePromotionStore = create<PromotionStore>()(
  persist(
    (set, get) => ({
      promotions: [],

      addPromotion: (promotion) => {
        // Generar código único si no se proporciona
        let promoCode = promotion.code;
        if (!promoCode) {
          // Generar código y verificar que sea único
          const existingCodes = get().promotions.map(p => p.code);
          do {
            promoCode = generatePromoCode();
          } while (existingCodes.includes(promoCode));
        }

        // Generar ID único combinando timestamp con número aleatorio
        // Esto evita duplicados incluso en ejecuciones rápidas (React Strict Mode)
        const generateUniqueId = () => {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 10000);
          return `${timestamp}-${random}`;
        };

        // Verificar que el ID sea único
        let newId;
        const existingIds = get().promotions.map(p => p.id);
        do {
          newId = generateUniqueId();
        } while (existingIds.includes(newId));

        const newPromotion: Promotion = {
          ...promotion,
          id: newId,
          code: promoCode,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          // Por defecto, todas las promociones son SOLO para la clínica odontológica
          applicableScope: promotion.applicableScope || 'clinic'
        };

        set((state) => ({
          promotions: [...state.promotions, newPromotion]
        }));
      },

      updatePromotion: (id, promotion) => {
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id
              ? { ...p, ...promotion, updatedAt: new Date() }
              : p
          )
        }));
      },

      deletePromotion: (id) => {
        set((state) => ({
          promotions: state.promotions.filter((p) => p.id !== id)
        }));
      },

      getActivePromotions: () => {
        const now = new Date();
        return get().promotions.filter(
          (p) => p.isActive &&
          new Date(p.startDate) <= now &&
          new Date(p.endDate) >= now &&
          (!p.usageLimit || p.usageCount < p.usageLimit)
        );
      },

      getActiveClinicPromotions: () => {
        const now = new Date();
        return get().promotions.filter(
          (p) => {
            const scope = p.applicableScope || p.serviceType || 'clinic';
            return p.isActive &&
              scope === 'clinic' &&
              new Date(p.startDate) <= now &&
              new Date(p.endDate) >= now &&
              (!p.usageLimit || p.usageCount < p.usageLimit);
          }
        );
      },

      getActiveImagingPromotions: () => {
        const now = new Date();
        return get().promotions.filter(
          (p) => {
            const scope = p.applicableScope || p.serviceType || 'clinic';
            return p.isActive &&
              scope === 'imaging' &&
              new Date(p.startDate) <= now &&
              new Date(p.endDate) >= now &&
              (!p.usageLimit || p.usageCount < p.usageLimit);
          }
        );
      },

      getPromotionById: (id) => {
        return get().promotions.find((p) => p.id === id);
      },

      getPromotionsBySede: (sedeId) => {
        return get().promotions.filter((p) =>
          sedeId === null ? p.sedeId === null || p.sedeId === undefined : p.sedeId === sedeId
        );
      },

      applyPromotion: (code, amount, services = [], appointmentType = 'consultation') => {
        const promotion = get().promotions.find(p => p.code === code && p.isActive);

        if (!promotion) {
          return { valid: false, discount: 0, message: 'Código de promoción inválido' };
        }

        // REGLA CRÍTICA: Las promociones de la clínica SOLO aplican para consultas odontológicas
        // NO se aplican para estudios de imágenes (Centro de Imágenes/PanoCef)
        const scope = promotion.applicableScope || promotion.serviceType || 'clinic';

        if (appointmentType === 'imaging_study' && scope === 'clinic') {
          return { valid: false, discount: 0, message: 'Las promociones de la clínica no aplican para estudios de imágenes' };
        }

        if (appointmentType === 'consultation' && scope === 'imaging') {
          return { valid: false, discount: 0, message: 'Esta promoción es solo para el centro de imágenes' };
        }

        // Verificar que la promoción sea del alcance correcto
        if (scope !== 'clinic' && appointmentType === 'consultation') {
          return { valid: false, discount: 0, message: 'Promoción no válida para servicios de clínica' };
        }

        const now = new Date();
        if (new Date(promotion.startDate) > now || new Date(promotion.endDate) < now) {
          return { valid: false, discount: 0, message: 'Promoción fuera de período válido' };
        }

        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
          return { valid: false, discount: 0, message: 'Promoción agotada' };
        }

        if (promotion.minimumAmount && amount < promotion.minimumAmount) {
          return { valid: false, discount: 0, message: `Monto mínimo requerido: S/ ${promotion.minimumAmount}` };
        }

        if (promotion.services.length > 0 && services.length > 0) {
          const hasRequiredService = promotion.services.some(s => services.includes(s));
          if (!hasRequiredService) {
            return { valid: false, discount: 0, message: 'Promoción no válida para estos servicios' };
          }
        }

        let discount = 0;
        if (promotion.discountType === 'percentage') {
          discount = amount * (promotion.discountValue / 100);
        } else if (promotion.discountType === 'fixed') {
          discount = Math.min(promotion.discountValue, amount);
        }

        return { valid: true, discount, message: 'Promoción aplicada correctamente' };
      },

      incrementUsageCount: (id) => {
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id
              ? { ...p, usageCount: p.usageCount + 1 }
              : p
          )
        }));
      },

      migratePromotionsWithoutCodes: () => {
        const existingCodes = get().promotions.map(p => p.code).filter(Boolean);

        set((state) => ({
          promotions: state.promotions.map((p) => {
            // Si la promoción ya tiene código, no hacer nada
            if (p.code) return p;

            // Generar código único para esta promoción
            let newCode: string;
            do {
              newCode = generatePromoCode();
            } while (existingCodes.includes(newCode));

            existingCodes.push(newCode);

            return {
              ...p,
              code: newCode,
              updatedAt: new Date()
            };
          })
        }));
      }
    }),
    {
      name: 'promotion-store',
    }
  )
);