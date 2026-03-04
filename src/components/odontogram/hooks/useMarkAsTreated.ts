/**
 * Hook para manejar el marcado de dientes como tratados
 * Encapsula la lógica de cambiar condiciones rojas (patología) a azules (tratadas)
 */

import { useCallback } from 'react';
import { DentalCondition } from '@/constants/dentalConditions';

interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  color?: string;
  [key: string]: any;
}

interface UseMarkAsTreatedProps {
  toothConditions: ToothCondition[];
  setToothConditions: (conditions: ToothCondition[]) => void;
  annotationsTop: Map<string, { text: string; color: 'red' | 'blue' }>;
  setAnnotationsTop: (annotations: Map<string, { text: string; color: 'red' | 'blue' }>) => void;
  onConditionsChange?: (conditions: ToothCondition[]) => void;
}

export function useMarkAsTreated({
  toothConditions,
  setToothConditions,
  annotationsTop,
  setAnnotationsTop,
  onConditionsChange
}: UseMarkAsTreatedProps) {
  const handleMarkAsTreated = useCallback(
    (toothNumber: string) => {

      // Buscar TODAS las condiciones del diente
      const toothConditionsForThisTooth = toothConditions.filter(
        c => c.toothNumber === toothNumber
      );

      // Verificar si hay condiciones rojas (sin tratar)
      const hasRedConditions = toothConditionsForThisTooth.some(
        c => c.state === 'bad' || c.color === 'red'
      );

      if (!hasRedConditions) {
        return;
      }

      // Cambiar TODAS las condiciones del diente a azul (tratadas)
      const updatedConditions = toothConditions.map(condition => {
        if (condition.toothNumber === toothNumber) {
          return {
            ...condition,
            state: 'good' as const,
            color: 'blue',
            finalState: 'good' as const,
            treatmentCompleted: true
          };
        }
        return condition;
      });

      // Actualizar TODAS las anotaciones del diente
      const newAnnotations = new Map(annotationsTop);
      toothConditionsForThisTooth.forEach(condition => {
        if (condition.abbreviation) {
          newAnnotations.set(toothNumber, {
            text: condition.abbreviation,
            color: 'blue' as 'red' | 'blue'
          });
        }
      });
      setAnnotationsTop(newAnnotations);

      setToothConditions(updatedConditions);
      onConditionsChange?.(updatedConditions);
    },
    [toothConditions, setToothConditions, annotationsTop, setAnnotationsTop, onConditionsChange]
  );

  return { handleMarkAsTreated };
}
