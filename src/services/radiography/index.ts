/**
 * Barrel export para servicios de radiografía
 *
 * MIGRADO A TIPOS UNIFICADOS:
 * - Todos los tipos ahora provienen de @/components/laboratory-form/types
 * - Las funciones aceptan tipos separados (PatientData, DoctorData, Tomografia3DFormData)
 *
 * Permite importar todos los servicios desde un solo punto:
 * import { validateTomografiaStep1, transformToSubmission, ValidationResult } from '@/services/radiography';
 */

export * from './validation';
export * from './transformation';
export * from './helpers';
