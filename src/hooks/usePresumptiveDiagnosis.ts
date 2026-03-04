/**
 * usePresumptiveDiagnosis Hook
 *
 * Maneja el estado y lógica del diagnóstico presuntivo (columna izquierda - solo lectura)
 * Extrae datos del odontograma y los transforma en condiciones diagnósticas
 */

import { useState, useEffect } from 'react';
import { DiagnosisService } from '@/services/diagnosis';
import type { DiagnosticCondition } from '@/services/diagnosis';

interface UsePresumptiveDiagnosisProps {
  selectedPatient: any;
  getPatientOdontogram: (patientId: string) => any[];
  currentOdontogram?: any[];
}

interface UsePresumptiveDiagnosisReturn {
  presumptiveConditions: DiagnosticCondition[];
  presumptiveTotal: number;
  loadOdontogramConditions: () => void;
}

/**
 * Hook para manejar el diagnóstico presuntivo
 */
export const usePresumptiveDiagnosis = ({
  selectedPatient,
  getPatientOdontogram,
  currentOdontogram
}: UsePresumptiveDiagnosisProps): UsePresumptiveDiagnosisReturn => {
  const [presumptiveConditions, setPresumptiveConditions] = useState<DiagnosticCondition[]>([]);

  /**
   * Carga y mapea las condiciones del odontograma
   */
  const loadOdontogramConditions = () => {
    if (!selectedPatient) {
      return;
    }


    // Priorizar currentOdontogram (estado local) sobre getPatientOdontogram (store)
    const odontogramConditions = currentOdontogram && currentOdontogram.length > 0
      ? currentOdontogram
      : getPatientOdontogram(selectedPatient.id);


    if (odontogramConditions && odontogramConditions.length > 0) {
      const mappedConditions = DiagnosisService.mapOdontogramToConditions(odontogramConditions);
      setPresumptiveConditions(mappedConditions);
    } else {
      setPresumptiveConditions([]);
    }
  };

  // Auto-cargar cuando cambia el odontograma
  useEffect(() => {
    loadOdontogramConditions();
  }, [currentOdontogram, selectedPatient]);

  // Calcular total usando el servicio
  const presumptiveTotal = DiagnosisService.calculateTotal(presumptiveConditions);

  return {
    presumptiveConditions,
    presumptiveTotal,
    loadOdontogramConditions
  };
};
