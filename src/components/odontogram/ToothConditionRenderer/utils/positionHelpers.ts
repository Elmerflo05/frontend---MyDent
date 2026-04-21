import { TOOTH_DIMENSIONS } from '@/constants/odontogramRenderConstants';

// Helper: Calcular posición (x, y) de un diente según su número FDI
export const getToothPosition = (toothNumber: string): { x: number; y: number; isUpper: boolean } | null => {
  const [quadrantStr, positionStr] = toothNumber.split('.');
  const quadrant = parseInt(quadrantStr);
  const position = parseInt(positionStr);

  // Usar constantes de toothDimensions.ts
  const TOOTH_SPACING = TOOTH_DIMENSIONS.TOOTH_SPACING;
  const QUADRANT_POSITIONS = {
    adultos: {
      superior: {
        cuadrante1: { x: 120, y: 49 },
        cuadrante2: { x: 730, y: 49 }
      },
      inferior: {
        cuadrante4: { x: 120, y: 850 },
        cuadrante3: { x: 730, y: 850 }
      }
    },
    ninos: {
      superior: {
        cuadrante5: { x: 434, y: 385 },
        cuadrante6: { x: 730, y: 385 }
      },
      inferior: {
        cuadrante8: { x: 434, y: 525 },
        cuadrante7: { x: 730, y: 525 }
      }
    }
  };

  // Calcular índice del diente en el array del cuadrante
  let idx: number;
  let baseX: number;
  let y: number;
  let isUpper: boolean;

  switch (quadrant) {
    case 1: // Adultos superior derecho (1.8, 1.7, ..., 1.1)
      idx = 8 - position; // 1.8->0, 1.7->1, ..., 1.1->7
      baseX = QUADRANT_POSITIONS.adultos.superior.cuadrante1.x;
      y = QUADRANT_POSITIONS.adultos.superior.cuadrante1.y;
      isUpper = true;
      break;
    case 2: // Adultos superior izquierdo (2.1, 2.2, ..., 2.8)
      idx = position - 1; // 2.1->0, 2.2->1, ..., 2.8->7
      baseX = QUADRANT_POSITIONS.adultos.superior.cuadrante2.x;
      y = QUADRANT_POSITIONS.adultos.superior.cuadrante2.y;
      isUpper = true;
      break;
    case 3: // Adultos inferior izquierdo (3.1, 3.2, ..., 3.8)
      idx = position - 1; // 3.1->0, 3.2->1, ..., 3.8->7
      baseX = QUADRANT_POSITIONS.adultos.inferior.cuadrante3.x;
      y = QUADRANT_POSITIONS.adultos.inferior.cuadrante3.y;
      isUpper = false;
      break;
    case 4: // Adultos inferior derecho (4.8, 4.7, ..., 4.1)
      idx = 8 - position; // 4.8->0, 4.7->1, ..., 4.1->7
      baseX = QUADRANT_POSITIONS.adultos.inferior.cuadrante4.x;
      y = QUADRANT_POSITIONS.adultos.inferior.cuadrante4.y;
      isUpper = false;
      break;
    case 5: // Niños superior derecho (5.5, 5.4, ..., 5.1)
      idx = 5 - position; // 5.5->0, 5.4->1, ..., 5.1->4
      baseX = QUADRANT_POSITIONS.ninos.superior.cuadrante5.x;
      y = QUADRANT_POSITIONS.ninos.superior.cuadrante5.y;
      isUpper = true;
      break;
    case 6: // Niños superior izquierdo (6.1, 6.2, ..., 6.5)
      idx = position - 1; // 6.1->0, 6.2->1, ..., 6.5->4
      baseX = QUADRANT_POSITIONS.ninos.superior.cuadrante6.x;
      y = QUADRANT_POSITIONS.ninos.superior.cuadrante6.y;
      isUpper = true;
      break;
    case 7: // Niños inferior izquierdo (7.1, 7.2, ..., 7.5)
      idx = position - 1; // 7.1->0, 7.2->1, ..., 7.5->4
      baseX = QUADRANT_POSITIONS.ninos.inferior.cuadrante7.x;
      y = QUADRANT_POSITIONS.ninos.inferior.cuadrante7.y;
      isUpper = false;
      break;
    case 8: // Niños inferior derecho (8.5, 8.4, ..., 8.1)
      idx = 5 - position; // 8.5->0, 8.4->1, ..., 8.1->4
      baseX = QUADRANT_POSITIONS.ninos.inferior.cuadrante8.x;
      y = QUADRANT_POSITIONS.ninos.inferior.cuadrante8.y;
      isUpper = false;
      break;
    default:
      return null;
  }

  const x = baseX + idx * TOOTH_SPACING;
  return { x, y, isUpper };
};

// Helper: Calcular posición Y del label según cuadrante
export const getLabelYPosition = (quadrant: number, toothY: number): number => {
  if (quadrant === 1 || quadrant === 2) return toothY - 87; // Adultos superior
  if (quadrant === 5 || quadrant === 6) return toothY - 107; // Niños superior
  if (quadrant === 7 || quadrant === 8) return toothY + 150; // Niños inferior
  return toothY + 188; // Adultos inferior (3-4)
};
