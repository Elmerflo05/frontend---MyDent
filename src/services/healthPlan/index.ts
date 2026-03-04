// ============================================================================
// HEALTH PLAN SERVICES - Barrel Export
// ============================================================================

export { HealthPlanService, healthPlanService } from './HealthPlanService';
export { SubscriptionService, subscriptionService } from './SubscriptionService';
export { TermsService, termsService } from './TermsService';

// Re-export types for convenience
export type {
  BaseHealthPlan,
  HealthPlanSubscription,
  HealthPlanTerms,
  CreateHealthPlanDTO,
  UpdateHealthPlanDTO,
  SubscribeToHealthPlanDTO,
  IHealthPlanManager,
  IHealthPlanViewer,
  ISubscriptionManager,
  ITermsManager
} from '@/types/healthPlans';
