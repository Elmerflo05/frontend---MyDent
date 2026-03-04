/**
 * CALCULADOR DE GRUPOS EDÉNTULOS
 * Lógica para agrupar dientes edéntulos consecutivos
 */

import type { AppliedCondition } from '@/components/odontogram/ToothConditionRenderer';
import { getToothDimensions } from '@/constants/toothDimensions';

export interface EdentuloGroup {
  teeth: string[];
  startX: number;
  endX: number;
  y: number;
  strokeColor: string;
}

/**
 * Calcula grupos de dientes edéntulos consecutivos en un cuadrante
 */
export const calculateEdentuloGroups = (
  quadrantTeeth: string[],
  appliedConditions: AppliedCondition[],
  getX: (tooth: string, idx: number) => number,
  baseY: number,
  officialColors: { red: string; blue: string }
): EdentuloGroup[] => {
  // Identificar dientes con edéntulo-total
  const teethWithEdentuloTotal = quadrantTeeth.filter((tooth) => {
    return appliedConditions.some(
      (ac) => ac.toothNumber === tooth && ac.condition.id === 'edentulo-total'
    );
  });

  if (teethWithEdentuloTotal.length === 0) {
    return [];
  }

  // Agrupar dientes consecutivos
  const groups: string[][] = [];
  let currentGroup: string[] = [];

  quadrantTeeth.forEach((tooth) => {
    if (teethWithEdentuloTotal.includes(tooth)) {
      currentGroup.push(tooth);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
  });

  // No olvidar el último grupo
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Convertir grupos a objetos con coordenadas
  return groups.map((group) => {
    const firstTooth = group[0];
    const lastTooth = group[group.length - 1];

    const firstIdx = quadrantTeeth.indexOf(firstTooth);
    const lastIdx = quadrantTeeth.indexOf(lastTooth);

    const startX = getX(firstTooth, firstIdx);
    const endX = getX(lastTooth, lastIdx);

    // Calcular Y: centro de la corona
    const firstToothDims = getToothDimensions(firstTooth);
    const y = baseY + (firstToothDims.crownHeight / 2);

    // Obtener color según estado
    const conditionForTooth = appliedConditions.find(
      (ac) => ac.toothNumber === firstTooth && ac.condition.id === 'edentulo-total'
    );

    const strokeColor = conditionForTooth?.state === 'good'
      ? officialColors.blue
      : officialColors.red;

    return {
      teeth: group,
      startX,
      endX,
      y,
      strokeColor
    };
  });
};
