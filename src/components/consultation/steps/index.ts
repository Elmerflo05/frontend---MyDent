/**
 * Barrel export para los componentes de steps de consulta
 *
 * Permite importar múltiples steps desde un solo lugar:
 * import { OdontogramStep, ClinicalExamStep } from '@/components/consultation/steps';
 */

// Steps refactorizados
export { PatientSelectionStep } from './PatientSelectionStep';
export { ClinicalExamStep } from './ClinicalExamStep';
export { OdontogramStep } from './OdontogramStep';
export { PresumptiveDiagnosisStep } from './PresumptiveDiagnosisStep';
export { DiagnosticPlanStep } from './DiagnosticPlanStep';
export { PrescriptionStep } from './PrescriptionStep';
export { AuxiliaryResultsStep } from './AuxiliaryResultsStep';
export { FinalDiagnosisStep } from './FinalDiagnosisStep';
export { ProsthesisLabStep } from './ProsthesisLabStep';
export { TreatmentPlanStep } from './TreatmentPlanStep';
export { BudgetStep } from './BudgetStep';
export { TreatmentPerformedStep } from './TreatmentPerformedStep';
