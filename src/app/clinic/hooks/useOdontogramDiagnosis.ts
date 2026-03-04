import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {
  extractDiagnosisFromOdontogram,
  generateDiagnosisText
} from '@/utils/odontogramDiagnosisExtractor';

/**
 * Hook para manejar el mapeo automático de condiciones del odontograma
 * a texto descriptivo para el diagnóstico presuntivo
 *
 * Genera automáticamente un texto descriptivo con las condiciones
 * detectadas cuando el campo de observaciones está vacío
 *
 * OPTIMIZACIÓN: Usa useRef para evitar re-renders innecesarios
 */

interface OdontogramDiagnosisProps {
  selectedPatient: any;
  currentOdontogram: any[];
  setCurrentRecord: Dispatch<SetStateAction<any>>;
}

export const useOdontogramDiagnosis = (props: OdontogramDiagnosisProps) => {
  const { selectedPatient, currentOdontogram, setCurrentRecord } = props;

  // OPTIMIZACIÓN: Usar ref para evitar ejecutar el efecto múltiples veces
  const lastOdontogramLength = useRef(0);
  const hasInitialized = useRef(false);

  // Generar texto descriptivo cuando cambia el odontograma
  useEffect(() => {
    if (!selectedPatient || currentOdontogram.length === 0) {
      return;
    }

    // OPTIMIZACIÓN: Solo ejecutar si realmente cambió la cantidad de condiciones
    if (hasInitialized.current && lastOdontogramLength.current === currentOdontogram.length) {
      return;
    }

    // Extraer diagnósticos del odontograma usando la utilidad
    const extractedDiagnoses = extractDiagnosisFromOdontogram(currentOdontogram);

    if (extractedDiagnoses.length === 0) {
      return;
    }

    // Generar texto descriptivo para observaciones
    const diagnosisText = generateDiagnosisText(extractedDiagnoses);

    // Actualizar automáticamente el diagnóstico presuntivo solo si está vacío
    setCurrentRecord((prev: any) => {
      // OPTIMIZACIÓN: Solo actualizar si realmente está vacío
      if (prev.presumptiveDiagnosis?.observacionesDiagnostico) {
        return prev;
      }

      return {
        ...prev,
        presumptiveDiagnosis: {
          ...prev.presumptiveDiagnosis,
          observacionesDiagnostico: diagnosisText
        }
      };
    });

    // Actualizar referencias
    lastOdontogramLength.current = currentOdontogram.length;
    hasInitialized.current = true;
  }, [currentOdontogram.length, selectedPatient?.id]); // OPTIMIZACIÓN: Solo depender del length y patient id
};
