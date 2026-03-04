// ============================================================================
// HEALTH PLANS - Types & Interfaces siguiendo principios SOLID
// ============================================================================

// ----------------------------------------------------------------------------
// Enums y tipos base
// ----------------------------------------------------------------------------

export enum HealthPlanType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  FAMILY = 'family'
}

export enum HealthPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  PENDING_PAYMENT = 'pending_payment', // Esperando validación de voucher
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

export enum VoucherStatus {
  PENDING = 'pending',      // Subido por paciente, esperando revisión
  APPROVED = 'approved',    // Aprobado por superadmin
  REJECTED = 'rejected'     // Rechazado por superadmin
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual'
}

// ----------------------------------------------------------------------------
// Interfaces principales
// ----------------------------------------------------------------------------

/**
 * Tipo de plan (plan_type del backend: personal, familiar, oro, platinium)
 */
export type PlanCode = 'personal' | 'familiar' | 'oro' | 'platinium';

/**
 * Textos descriptivos por tipo de plan (neuromarketing)
 */
export const PLAN_DESCRIPTION_TEXTS: Record<PlanCode, string> = {
  personal: 'Accede a precios preferenciales en procedimientos dentales, sub-procedimientos y servicios adicionales. Tu salud dental con tarifas accesibles.',
  familiar: 'Precios preferenciales mejorados en procedimientos dentales, sub-procedimientos y servicios adicionales. Mejores tarifas para el cuidado de tu salud dental.',
  oro: 'Precios preferenciales destacados en procedimientos dentales, sub-procedimientos y servicios adicionales. Tarifas exclusivas para quienes priorizan su salud dental.',
  platinium: 'Los mejores precios preferenciales en procedimientos dentales, sub-procedimientos y servicios adicionales. La tarifa más conveniente en todos nuestros servicios.'
};

/**
 * Obtener texto descriptivo del plan según su planCode
 */
export function getPlanBenefitText(planCode?: string): string {
  if (planCode && planCode in PLAN_DESCRIPTION_TEXTS) {
    return PLAN_DESCRIPTION_TEXTS[planCode as PlanCode];
  }
  return 'Accede a precios preferenciales en procedimientos dentales, sub-procedimientos y servicios adicionales.';
}

/**
 * Términos y condiciones del plan
 */
export interface HealthPlanTerms {
  id: string;
  healthPlanId?: number;
  planName?: string;
  termType?: string;
  version: string;         // maps to term_value in DB
  content: string;         // maps to term_description in DB
  effectiveDate: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Plan de salud base (Base para todos los planes)
 */
export interface BaseHealthPlan {
  id: string;
  name: string;
  description: string;
  type: HealthPlanType;
  status: HealthPlanStatus;

  // Precios
  price: number;
  billingCycle: BillingCycle;
  setupFee?: number; // Costo de inscripción inicial

  // Código del plan (personal, familiar, oro, platinium)
  planCode?: string;

  // Términos y condiciones
  termsId: string; // Referencia a HealthPlanTerms
  currentTermsVersion: string;

  // Restricciones
  maxSubscribers?: number; // Límite de suscriptores
  minAge?: number;
  maxAge?: number;
  requiresMedicalHistory: boolean;

  // Metadata
  sedeId?: string; // Si es específico de una sede
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Suscripción de un paciente a un plan
 */
export interface HealthPlanSubscription {
  id: string;
  planId: string;
  patientId: string;

  // Estado
  status: SubscriptionStatus;
  statusReason?: string; // Razón del estado (ej: cancelado por falta de pago)

  // Fechas
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  cancelledAt?: Date;

  // Términos aceptados
  acceptedTermsId: string;
  acceptedTermsVersion: string;
  acceptedAt: Date;

  // Pagos
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  paymentDay: number; // Día del mes en que se corta el pago (1-31)
  totalPaid: number;

  // Uso
  benefitsUsed: Array<{
    benefitId: string;
    usedAt: Date;
    serviceId?: string;
    amount?: number;
  }>;

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Voucher de pago subido por el paciente
 */
export interface PaymentVoucher {
  id: string;
  subscriptionId: string;
  patientId: string;
  planId: string;

  // Datos del voucher
  voucherImage: string; // Base64 o URL de la imagen
  amount: number; // Monto que aparece en el voucher
  paymentDate: Date; // Fecha que indica el voucher
  uploadDate: Date; // Cuándo lo subió el paciente
  paymentPeriod: string; // Ej: "Enero 2025", "Mes 1", etc.

  // Estado de revisión
  status: VoucherStatus;
  reviewedBy?: string; // ID del superadmin que lo revisó
  reviewedAt?: Date;
  rejectionReason?: string; // Razón si fue rechazado

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuración global del sistema de planes de salud
 */
export interface HealthPlanSettings {
  id: string; // Siempre '1' - registro único

  // Días de gracia
  graceDays: number; // Días después del corte antes de suspender

  // Recordatorios de pago
  reminderDaysBefore: number[]; // Ej: [7, 3, 1] = recordar 7, 3 y 1 días antes

  // Notificaciones
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;

  // Configuración de vouchers
  voucherRequired: boolean; // Si requiere voucher para todos los pagos
  autoApproveVouchers: boolean; // Si se aprueban automáticamente (futuro)

  // Metadata
  updatedAt: Date;
  updatedBy: string; // ID del superadmin que actualizó
}

// ----------------------------------------------------------------------------
// Interfaces para servicios (ISP - Interface Segregation Principle)
// ----------------------------------------------------------------------------

/**
 * Interface para gestión de planes (SuperAdmin/Admin)
 */
export interface IHealthPlanManager {
  createPlan(plan: Omit<BaseHealthPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<BaseHealthPlan>;
  updatePlan(id: string, updates: Partial<BaseHealthPlan>): Promise<BaseHealthPlan>;
  deletePlan(id: string): Promise<void>;
  activatePlan(id: string): Promise<void>;
  deactivatePlan(id: string): Promise<void>;
}

/**
 * Interface para visualización de planes (Paciente)
 */
export interface IHealthPlanViewer {
  getAvailablePlans(): Promise<BaseHealthPlan[]>;
  getPlanById(id: string): Promise<BaseHealthPlan | null>;
  getPlanTerms(termsId: string): Promise<HealthPlanTerms | null>;
  comparePlans(planIds: string[]): Promise<BaseHealthPlan[]>;
}

/**
 * Interface para gestión de suscripciones
 */
export interface ISubscriptionManager {
  subscribe(
    patientId: string,
    planId: string,
    termsId: string,
    createdBy: string,
    paymentMethod?: string
  ): Promise<HealthPlanSubscription>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<void>;
  renewSubscription(subscriptionId: string): Promise<void>;
  getPatientSubscription(patientId: string): Promise<HealthPlanSubscription | null>;
  getSubscriptionsByPlan(planId: string): Promise<HealthPlanSubscription[]>;
  processVoucherApproval(subscriptionId: string, amount: number, paymentDate: Date): Promise<void>;
}

/**
 * Interface para gestión de términos y condiciones
 */
export interface ITermsManager {
  createTerms(terms: Omit<HealthPlanTerms, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthPlanTerms>;
  updateTerms(id: string, updates: Partial<HealthPlanTerms>): Promise<HealthPlanTerms>;
  getTermsHistory(planId: string): Promise<HealthPlanTerms[]>;
  getCurrentTerms(planId: string): Promise<HealthPlanTerms | null>;
}

// ----------------------------------------------------------------------------
// DTOs (Data Transfer Objects)
// ----------------------------------------------------------------------------

export interface CreateHealthPlanDTO {
  name: string;
  description: string;
  type: HealthPlanType;
  price: number;
  billingCycle: BillingCycle;
  setupFee?: number;
  terms: {
    content: string;
    version: string;
  };
  requiresMedicalHistory: boolean;
  maxSubscribers?: number;
  minAge?: number;
  maxAge?: number;
  sedeId?: string;
}

export interface SubscribeToHealthPlanDTO {
  patientId: string;
  planId: string;
  paymentMethod?: string;
  acceptTerms: boolean;
}

export interface UpdateHealthPlanDTO {
  name?: string;
  description?: string;
  price?: number;
  billingCycle?: BillingCycle;
  setupFee?: number;
  maxSubscribers?: number;
  status?: HealthPlanStatus;
}

// ----------------------------------------------------------------------------
// Tipos de respuesta
// ----------------------------------------------------------------------------

export interface HealthPlanStats {
  planId: string;
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  averageSubscriptionLength: number; // en meses
}

export interface PatientSubscriptionSummary {
  subscription: HealthPlanSubscription;
  plan: BaseHealthPlan;
  nextPaymentAmount: number;
  daysUntilRenewal: number;
}
