/**
 * DIMENSIONES OFICIALES DE DIENTES PARA ODONTOGRAMA SVG
 *
 * Este archivo centraliza todas las dimensiones y constantes de renderizado
 * para garantizar consistencia entre Odontogram.tsx y ToothConditionRenderer.tsx
 */

export type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

export interface ToothDimensions {
  width: number;
  crownHeight: number;
  rootHeight: number;
}

/**
 * Dimensiones base de cada tipo de diente
 * TODOS LOS DIENTES CON EL MISMO TAMAÑO
 */
export const TOOTH_DIMENSIONS: Record<ToothType, ToothDimensions> = {
  molar: {
    width: 50,        // Ancho uniforme para todos los dientes
    crownHeight: 45,  // Altura uniforme de corona
    rootHeight: 40    // Altura uniforme de raíz
  },
  premolar: {
    width: 50,        // Mismo tamaño que molares
    crownHeight: 45,
    rootHeight: 40
  },
  canine: {
    width: 50,        // Mismo tamaño que molares
    crownHeight: 45,
    rootHeight: 40
  },
  incisor: {
    width: 50,        // Mismo tamaño que molares
    crownHeight: 45,
    rootHeight: 40
  }
};

/**
 * Espaciado horizontal entre dientes adyacentes
 * Unificado para evitar inconsistencias
 */
export const TOOTH_SPACING = 70; // px (antes era 98px, reducido para mejor visualización)

/**
 * Posiciones base de cuadrantes en el canvas SVG
 */
export const QUADRANT_POSITIONS = {
  // Adultos
  adultos: {
    superior: {
      cuadrante1: { x: 120, y: 49 },   // Superior derecho
      cuadrante2: { x: 1040, y: 49 }   // Superior izquierdo
    },
    inferior: {
      cuadrante4: { x: 120, y: 850 },  // Inferior derecho
      cuadrante3: { x: 1040, y: 850 }  // Inferior izquierdo
    }
  },
  // Niños (deciduos)
  ninos: {
    superior: {
      cuadrante5: { x: 434, y: 385 },  // Superior derecho
      cuadrante6: { x: 1040, y: 385 }  // Superior izquierdo
    },
    inferior: {
      cuadrante8: { x: 434, y: 525 },  // Inferior derecho
      cuadrante7: { x: 1040, y: 525 }  // Inferior izquierdo
    }
  }
};

/**
 * Coordenadas Y absolutas para anotaciones y labels
 */
export const VERTICAL_OFFSETS = {
  adultos: {
    superior: {
      annotations: -133,  // Arriba de los dientes
      labels: -73,        // Entre anotaciones y dientes
    },
    inferior: {
      annotations: 1053,  // Debajo de los dientes inferiores
      labels: 1113,       // Más abajo que annotations
    }
  },
  ninos: {
    superior: {
      annotations: 175,   // Arriba de dientes de niños superiores
      labels: 235,        // Más abajo que annotations
    },
    inferior: {
      annotations: 735,   // Debajo de dientes de niños inferiores
      labels: 795,        // Más abajo que annotations
    }
  }
};

/**
 * Dimensiones del ViewBox principal del odontograma
 * Calculadas para contener todo el contenido sin deformación
 */
export const ODONTOGRAM_VIEWBOX = {
  x: 0,
  y: -200,       // Incluye espacio para anotaciones superiores (y=-133)
  width: 1850,   // Reducido de 1960
  height: 1400   // Aumentado para incluir rango completo desde -200 hasta 1200
};

/**
 * Altura máxima de corona entre todos los tipos de dientes
 * Usada para normalizar la alineación vertical
 */
export const MAX_CROWN_HEIGHT = Math.max(
  TOOTH_DIMENSIONS.molar.crownHeight,
  TOOTH_DIMENSIONS.premolar.crownHeight,
  TOOTH_DIMENSIONS.canine.crownHeight,
  TOOTH_DIMENSIONS.incisor.crownHeight
);

/**
 * Helper: Obtener dimensiones de un diente según su número
 */
export function getToothDimensions(toothNumber: string): ToothDimensions {
  // Formato FDI: "cuadrante.posición" (ej: "1.8")
  // Extraer el dígito de posición (después del punto)
  const parts = toothNumber.split('.');
  const position = parseInt(parts[1] || parts[0]);

  // Molares: 6, 7, 8
  if (position >= 6 && position <= 8) {
    return TOOTH_DIMENSIONS.molar;
  }

  // Premolares: 4, 5
  if (position === 4 || position === 5) {
    return TOOTH_DIMENSIONS.premolar;
  }

  // Caninos: 3
  if (position === 3) {
    return TOOTH_DIMENSIONS.canine;
  }

  // Incisivos: 1, 2
  return TOOTH_DIMENSIONS.incisor;
}

/**
 * Helper: Obtener tipo de diente según su número
 */
export function getToothType(toothNumber: string): ToothType {
  // Formato FDI: "cuadrante.posición" (ej: "1.8")
  // Extraer el dígito de posición (después del punto)
  const parts = toothNumber.split('.');
  const position = parseInt(parts[1] || parts[0]);

  if (position >= 6 && position <= 8) return 'molar';
  if (position === 4 || position === 5) return 'premolar';
  if (position === 3) return 'canine';
  return 'incisor';
}

/**
 * Helper: Calcular posición X de un diente en su cuadrante
 */
export function getToothXPosition(toothIndex: number, baseX: number): number {
  return baseX + (toothIndex * TOOTH_SPACING);
}

/**
 * Helper: Calcular el centro Y de la corona de un diente
 */
export function getToothCrownCenterY(baseY: number, toothType: ToothType): number {
  const dims = TOOTH_DIMENSIONS[toothType];
  return baseY + (dims.crownHeight / 2);
}

/**
 * Helper: Calcular el punto superior de la raíz de un diente
 */
export function getToothRootTopY(baseY: number, toothType: ToothType): number {
  const dims = TOOTH_DIMENSIONS[toothType];
  return baseY + dims.crownHeight;
}

/**
 * Helper: Calcular el punto inferior de la raíz de un diente
 */
export function getToothRootBottomY(baseY: number, toothType: ToothType, isUpper: boolean): number {
  const dims = TOOTH_DIMENSIONS[toothType];
  const crownBase = baseY + dims.crownHeight;

  if (isUpper) {
    // Dientes superiores: raíces van hacia arriba (valores negativos)
    return crownBase - dims.rootHeight;
  } else {
    // Dientes inferiores: raíces van hacia abajo (valores positivos)
    return crownBase + dims.rootHeight;
  }
}

/**
 * Helper: Calcular Y ajustada para alinear dientes horizontalmente
 * Normaliza la posición vertical para que todos los dientes tengan
 * su línea de unión corona-raíz en la misma altura
 */
export function getAlignedToothY(baseY: number, toothNumber: string): number {
  const dimensions = getToothDimensions(toothNumber);
  // Ajustar hacia abajo según la diferencia con la corona más alta
  return baseY + (MAX_CROWN_HEIGHT - dimensions.crownHeight);
}

/**
 * Helper: Convertir número de diente deciduo a su equivalente permanente
 * Para alinear verticalmente dientes de niños con adultos
 */
export function getAdultEquivalent(toothNumber: string): string {
  const parts = toothNumber.split('.');
  const quadrant = parseInt(parts[0]);
  const position = parseInt(parts[1]);

  // Solo convertir si es diente deciduo (cuadrantes 5-8)
  if (quadrant < 5) {
    return toothNumber; // Ya es diente permanente
  }

  // Mapeo de cuadrantes deciduos a permanentes
  const quadrantMap: Record<number, number> = {
    5: 1, // Superior derecho
    6: 2, // Superior izquierdo
    7: 3, // Inferior izquierdo
    8: 4  // Inferior derecho
  };

  // Mapeo de posiciones deciduas a permanentes
  // Los dientes deciduos (5 piezas) se alinean con las primeras 5 posiciones permanentes
  // 5.5 → 1.5, 5.4 → 1.4, 5.3 → 1.3, 5.2 → 1.2, 5.1 → 1.1
  const positionMap: Record<number, number> = {
    5: 5, // Segundo molar deciduo → Segundo premolar permanente
    4: 4, // Primer molar deciduo → Primer premolar permanente
    3: 3, // Canino
    2: 2, // Incisivo lateral
    1: 1  // Incisivo central
  };

  const adultQuadrant = quadrantMap[quadrant];
  const adultPosition = positionMap[position];

  return `${adultQuadrant}.${adultPosition}`;
}

/**
 * Helper: Calcular coordenada X de un diente alineado verticalmente
 * Los dientes deciduos se alinean con sus equivalentes permanentes
 */
export function getAlignedToothX(toothNumber: string, quadrantArray: string[]): number {
  const parts = toothNumber.split('.');
  const quadrant = parseInt(parts[0]);

  // Determinar base X según cuadrante
  let baseX: number;

  if (quadrant === 1 || quadrant === 4) {
    baseX = 120; // Adultos derecho
  } else if (quadrant === 2 || quadrant === 3) {
    baseX = 1040; // Adultos izquierdo
  } else {
    // Dientes deciduos: usar equivalente adulto para calcular X
    const adultEquiv = getAdultEquivalent(toothNumber);
    const adultParts = adultEquiv.split('.');
    const adultQuadrant = parseInt(adultParts[0]);
    const adultPosition = parseInt(adultParts[1]);

    // Base X del cuadrante adulto equivalente
    baseX = (adultQuadrant === 1 || adultQuadrant === 4) ? 120 : 1040;

    // Calcular índice en el array adulto (1.8→0, 1.7→1, ..., 1.1→7)
    const adultIdx = (adultQuadrant === 1 || adultQuadrant === 4)
      ? (8 - adultPosition)  // Cuadrantes derechos: orden inverso
      : (adultPosition - 1); // Cuadrantes izquierdos: orden normal

    return baseX + (adultIdx * TOOTH_SPACING);
  }

  // Dientes adultos: calcular normalmente
  const idx = quadrantArray.indexOf(toothNumber);
  return baseX + (idx * TOOTH_SPACING);
}
