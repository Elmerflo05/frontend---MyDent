/**
 * TOOTH SERVICES - Centralized Exports
 *
 * Exporta todos los servicios relacionados con el odontograma
 * para facilitar imports desde otros módulos
 */

// Services
export { ToothConditionService } from './ToothConditionService';
export { AnnotationService } from './AnnotationService';

// Types
export type {
  ToothCondition,
  ValidationResult,
  MultiToothValidationResult,
  RangeCalculationResult
} from './ToothConditionService';

export type {
  Annotation,
  AnnotationsMap
} from './AnnotationService';
