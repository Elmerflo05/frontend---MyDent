/**
 * Health Plan Codes - Constantes centralizadas (FALLBACK LOCAL)
 *
 * IMPORTANTE: Este archivo es un FALLBACK síncrono para cuando la API no está disponible.
 * La fuente de verdad para precios es el BACKEND (pricingService.js) que considera:
 *   1. Empresa corporativa → precios corporativos
 *   2. Plan de salud activo → precios del plan
 *   3. Sin cobertura → precio regular
 *
 * Para precios que consideren empresa corporativa, usar:
 *   - consultationPricingService.ts (servicio centralizado del frontend)
 *   - API endpoints: /pricing/calculate/:id/patient/:patientId
 *
 * getPriceForPlan() solo maneja planes de salud (personal, familiar, platinium, oro).
 * NO puede resolver precios corporativos.
 */

// Códigos canónicos de planes (lowercase)
export const PLAN_CODES = {
  PERSONAL: 'personal',
  FAMILIAR: 'familiar',
  PLATINIUM: 'platinium',
  ORO: 'oro'
} as const;

export type PlanCode = typeof PLAN_CODES[keyof typeof PLAN_CODES];

// Mapeo de códigos legacy/variantes a códigos canónicos
// Esto permite compatibilidad con datos existentes durante la migración
export const LEGACY_PLAN_CODE_MAP: Record<string, PlanCode> = {
  // Formato actual en BD (uppercase sin prefijo) - LEGACY
  'PERSONAL': PLAN_CODES.PERSONAL,
  'FAMILIAR': PLAN_CODES.FAMILIAR,
  'PLANITIUM': PLAN_CODES.PLATINIUM, // Typo en seed.js original
  'GOLD': PLAN_CODES.ORO,

  // Formato con prefijo PLAN_ (usado incorrectamente en código anterior)
  'PLAN_PERSONAL': PLAN_CODES.PERSONAL,
  'PLAN_FAMILIAR': PLAN_CODES.FAMILIAR,
  'PLAN_PLATINIUM': PLAN_CODES.PLATINIUM,
  'PLAN_ORO': PLAN_CODES.ORO,

  // Formato canónico (lowercase) - TARGET
  'personal': PLAN_CODES.PERSONAL,
  'familiar': PLAN_CODES.FAMILIAR,
  'platinium': PLAN_CODES.PLATINIUM,
  'oro': PLAN_CODES.ORO,

  // Nombres completos de planes (por si se pasa el nombre en lugar del código)
  'Plan Personal': PLAN_CODES.PERSONAL,
  'Plan Familiar': PLAN_CODES.FAMILIAR,
  'Plan Platinium': PLAN_CODES.PLATINIUM,
  'Plan Oro': PLAN_CODES.ORO,
  'plan personal': PLAN_CODES.PERSONAL,
  'plan familiar': PLAN_CODES.FAMILIAR,
  'plan platinium': PLAN_CODES.PLATINIUM,
  'plan oro': PLAN_CODES.ORO
};

// Claves de precio en los objetos de procedimiento
export type PriceKey = 'price_plan_personal' | 'price_plan_familiar' | 'price_plan_platinium' | 'price_plan_oro';

// Mapeo de código de plan a clave de precio en el objeto
export const PLAN_CODE_TO_PRICE_KEY: Record<PlanCode, PriceKey> = {
  [PLAN_CODES.PERSONAL]: 'price_plan_personal',
  [PLAN_CODES.FAMILIAR]: 'price_plan_familiar',
  [PLAN_CODES.PLATINIUM]: 'price_plan_platinium',
  [PLAN_CODES.ORO]: 'price_plan_oro'
};

/**
 * Normaliza un código de plan a su formato canónico (lowercase)
 * @param planCode - Código de plan en cualquier formato
 * @returns Código normalizado o null si no es válido
 */
export const normalizePlanCode = (planCode: string | null | undefined): PlanCode | null => {
  if (!planCode) return null;

  const code = String(planCode).trim();

  // Buscar en el mapeo de códigos legacy
  if (LEGACY_PLAN_CODE_MAP[code]) {
    return LEGACY_PLAN_CODE_MAP[code];
  }

  // Intentar con lowercase
  const lowerCode = code.toLowerCase();
  if (LEGACY_PLAN_CODE_MAP[lowerCode]) {
    return LEGACY_PLAN_CODE_MAP[lowerCode];
  }

  // Si no se encuentra, retornar null
  return null;
};

/**
 * Obtiene la clave de precio para un código de plan
 * @param planCode - Código de plan en cualquier formato
 * @returns Clave de precio o null
 */
export const getPriceKeyForPlan = (planCode: string | null | undefined): PriceKey | null => {
  const normalizedCode = normalizePlanCode(planCode);
  if (!normalizedCode) return null;

  return PLAN_CODE_TO_PRICE_KEY[normalizedCode] || null;
};

/**
 * Verifica si un código de plan es válido
 * @param planCode - Código de plan a verificar
 */
export const isValidPlanCode = (planCode: string | null | undefined): boolean => {
  return normalizePlanCode(planCode) !== null;
};

/**
 * Obtiene todos los códigos de plan válidos (canónicos)
 */
export const getAllPlanCodes = (): PlanCode[] => {
  return Object.values(PLAN_CODES);
};

// Interfaz para procedimientos con precios de plan
export interface ProcedureWithPlanPrices {
  price_without_plan?: number | null;
  price_plan_personal?: number | null;
  price_plan_familiar?: number | null;
  price_plan_platinium?: number | null;
  price_plan_oro?: number | null;
}

/**
 * Obtiene el precio de un procedimiento según el plan
 * @param procedure - Objeto con precios de plan
 * @param planCode - Código del plan (cualquier formato)
 * @returns Precio del plan o precio sin plan si no aplica
 */
export const getPriceForPlan = (
  procedure: ProcedureWithPlanPrices,
  planCode: string | null | undefined
): number => {
  // Convertir a número (manejar strings como "150.00")
  const priceWithoutPlan = Number(procedure.price_without_plan) || 0;

  if (!planCode) {
    return priceWithoutPlan;
  }

  const priceKey = getPriceKeyForPlan(planCode);
  if (!priceKey) {
    return priceWithoutPlan;
  }

  const planPrice = procedure[priceKey];

  // Si el precio del plan es NULL (N.I.), devolver precio sin plan
  // Convertir a número para manejar strings
  if (planPrice !== null && planPrice !== undefined) {
    const numericPrice = Number(planPrice);
    return !isNaN(numericPrice) ? numericPrice : priceWithoutPlan;
  }

  return priceWithoutPlan;
};
