import type { Patient } from '@/types';
import {
  User,
  Stethoscope,
  Grid3x3,
  AlertCircle,
  Clipboard,
  Pill,
  TestTube,
  CheckCircle,
  Layers,
  CreditCard,
  Activity
} from 'lucide-react';

/**
 * Utilidades y helpers para la consulta de pacientes
 */

export interface ConsultationStep {
  id: number;
  label: string;
  icon: any;
  completed: boolean;
}

/**
 * Definición de los pasos del wizard de consulta
 */
export const consultationSteps: ConsultationStep[] = [
  { id: 0, label: 'Paciente', icon: User, completed: false },
  { id: 1, label: 'Examen clínico', icon: Stethoscope, completed: false },
  { id: 2, label: 'Odontograma', icon: Grid3x3, completed: false },
  { id: 3, label: 'Diagnóstico Presuntivo', icon: AlertCircle, completed: false },
  { id: 4, label: 'Plan Diagnóstico', icon: Clipboard, completed: false },
  { id: 5, label: 'Receta Médica', icon: Pill, completed: false },
  { id: 6, label: 'Resultados Auxiliares', icon: TestTube, completed: false },
  { id: 7, label: 'Diagnóstico Definitivo', icon: CheckCircle, completed: false },
  { id: 8, label: 'Plan de Tratamiento', icon: Layers, completed: false },
  { id: 9, label: 'Presupuesto', icon: CreditCard, completed: false },
  { id: 10, label: 'Tratamiento Realizado', icon: Activity, completed: false },
  { id: 11, label: 'Laboratorio de Prótesis', icon: TestTube, completed: false }
];

/**
 * Formatea la lista de pacientes para el componente Combobox
 */
export const formatPatientOptions = (patients: Patient[]) => {
  return patients.map(patient => ({
    value: patient.id,
    label: `${patient.firstName} ${patient.lastName}`,
    sublabel: `${patient.documentType}: ${patient.documentNumber}`,
    description: `Tel: ${patient.phone} | Email: ${patient.email}`,
    data: patient
  }));
};

/**
 * Valida si un paso de consulta puede ser marcado como completado
 */
export const validateStepCompletion = (
  stepId: number,
  selectedPatient: any,
  currentRecord: any,
  currentOdontogram: any[]
): boolean => {
  switch (stepId) {
    case 0: // Paciente
      return selectedPatient !== null;

    case 1: // Examen clínico
      return !!(
        currentRecord.consultationReason ||
        currentRecord.bloodPressure ||
        currentRecord.heartRate
      );

    case 2: // Odontograma
      return currentOdontogram.length > 0;

    case 3: // Diagnóstico Presuntivo - se considera completo si hay condiciones en el odontograma
      return currentOdontogram.length > 0 || !!currentRecord.presumptiveDiagnosis?.observacionesDiagnostico;

    default:
      return true;
  }
};

/**
 * Determina si un paso está accesible basado en el estado actual
 */
export const isStepAccessible = (stepId: number, selectedPatient: any): boolean => {
  // Paso 0 siempre accesible, los demás requieren paciente seleccionado
  return stepId === 0 || selectedPatient !== null;
};

/**
 * Calcula el progreso total de la consulta
 */
export const calculateConsultationProgress = (completedSteps: Set<number>): number => {
  const totalSteps = consultationSteps.length;
  const completed = completedSteps.size;
  return Math.round((completed / totalSteps) * 100);
};
