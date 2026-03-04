/**
 * Tipos centralizados para el sistema de consultas médicas
 *
 * Este archivo contiene todas las interfaces y tipos usados en el flujo
 * de consulta médica (PatientConsultation.tsx y sus componentes derivados)
 */

import { LucideIcon } from 'lucide-react';

/**
 * Representa un paso del wizard de consulta
 */
export interface ConsultationStep {
  id: number;
  label: string;
  icon: LucideIcon;
  completed: boolean;
}

/**
 * Procedimiento de tratamiento individual
 */
export interface TreatmentProcedure {
  id?: string;
  toothNumber?: string;
  procedureName: string;
  surfaces?: string[];
  price: number;
  status?: 'pending' | 'in_progress' | 'completed';
}

/**
 * Diagnóstico presuntivo (Step 3)
 */
export interface PresumptiveDiagnosis {
  cariesDental: boolean;
  calculoPlaca: boolean;
  gingivitis: boolean;
  periodontitis: boolean;
  maloclusion: boolean;
  traumatismoDental: boolean;
  lesionesOrales: boolean;
  otros: string;
  observacionesDiagnostico: string;
}

/**
 * Plan diagnóstico (Step 4)
 */
export interface DiagnosticPlan {
  selectedExams: Array<{
    id: string;
    name: string;
    price: number;
    type: 'service';
    description?: string;
    isInternal: boolean;
  }>;
  customExams: Array<{
    id: string;
    name: string;
    description?: string;
    estimatedPrice: number;
    type: 'manual';
    isInternal: boolean;
  }>;
  totalCost: number;
  observations: string;
}

/**
 * Resultados de exámenes auxiliares (Step 5)
 */
export interface ExamResults {
  laboratoryResults: any[];
  externalResults: any[];
  observations: string;
}

/**
 * Plan de tratamiento (Step 7)
 */
export interface TreatmentPlan {
  description: string;
  additionalServices: string[];
  observations: string;
}

/**
 * Presupuesto consolidado (Step 8)
 */
export interface ConsolidatedBudget {
  odontogramItems: TreatmentProcedure[];
  diagnosticTests: Array<{
    name: string;
    price: number;
    type: string;
  }>;
  additionalServices: Array<{
    name: string;
    price: number;
  }>;
  totalCost: number;
  advance: number;
  balance: number;
  observations: string;
}

/**
 * Registro completo de consulta médica
 *
 * Este es el objeto principal que contiene toda la información
 * recopilada durante los 10 pasos del wizard
 */
export interface ConsultationRecord {
  // Información básica
  patientId: string;
  doctorId: string;
  date: Date;
  consultationReason: string;
  currentSymptoms: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  habits: string;
  diagnosis: string;
  prescriptions: any[];
  notes: string;

  // Step 1: Examen clínico - Anamnesis
  consultationReason: string;
  pathologicalHistory: string[];
  previousDiseases: string[];
  previousOperations: string[];
  allergiesList: string[];
  stomatologicalHistory: string;

  // Step 1: Examen clínico - Funciones vitales
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
  height: string;

  // Step 1: Examen clínico - Evaluaciones (campos separados)
  generalCondition: string;
  extraoralExam: string;
  extraoralExamImages: string[];
  intraoralExam: string;
  intraoralExamImages: string[];

  // Step 3: Diagnóstico Presuntivo
  presumptiveDiagnosis: PresumptiveDiagnosis;

  // Step 4: Plan para el diagnóstico definitivo
  diagnosticPlan: DiagnosticPlan;

  // Step 5: Resultados de exámenes auxiliares
  examResults: ExamResults;

  // Step 6: Diagnóstico definitivo
  finalDiagnosis: string;

  // Step 7: Plan de tratamiento
  treatmentPlan: TreatmentPlan;

  // Step 8: Presupuesto consolidado
  consolidatedBudget: ConsolidatedBudget;

  // Step 9: Tratamiento realizado
  treatmentPerformed: string;
}

/**
 * Información de tratamiento (usado para crear/actualizar treatments)
 */
export interface TreatmentInfo {
  patientId: string;
  doctorId: string;
  diagnosis: string;
  procedures: TreatmentProcedure[];
  estimatedDuration: string;
  priority: 'low' | 'normal' | 'high';
  notes: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  totalCost: number;
  paidAmount: number;
  startDate: Date;
}

/**
 * Props comunes para componentes de steps
 */
export interface BaseStepProps {
  selectedPatient: any;
  currentRecord: ConsultationRecord;
  updateRecord: (updates: Partial<ConsultationRecord>) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
  onContinue: () => void;
  isSaving: boolean;
}
