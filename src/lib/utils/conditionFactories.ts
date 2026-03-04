/**
 * FACTORIES DE CONDICIONES DENTALES
 * Funciones para crear condiciones de forma consistente
 */

// Importar el tipo desde Odontogram.tsx (se exportará más adelante)
export interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  notes?: string;
  // Para Fractura: ubicación y posición del click
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  // Para Supernumerario: posición relativa al diente
  supernumeraryPosition?: 'left' | 'right';
  // Para Diastema: posición relativa al diente (entre qué dientes)
  diastemaPosition?: 'left' | 'right';
  // Para Giroversión: dirección del giro
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  // Para Fusión: con qué diente adyacente se fusiona
  fusionPosition?: 'left' | 'right';
  // Para Migración: dirección del desplazamiento
  migracionDirection?: 'mesial' | 'distal';
  // Para Aparato Ortodóntico Fijo: número del diente conectado (par)
  connectedToothNumber?: string;
}

/**
 * Crea una condición dental básica
 */
export const createBasicCondition = (
  toothNumber: string,
  conditionId: string,
  abbreviation?: string,
  state?: 'good' | 'bad',
  sectionId?: string
): ToothCondition => ({
  toothNumber,
  conditionId,
  abbreviation,
  state,
  sectionId
});

/**
 * Crea condiciones para Aparato Ortodóntico Fijo (2 dientes conectados)
 */
export const createAparatoFijoConditions = (
  tooth1: string,
  tooth2: string,
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition[] => {
  return [
    {
      toothNumber: tooth1,
      conditionId: 'aparato-fijo',
      abbreviation,
      state,
      connectedToothNumber: tooth2
    },
    {
      toothNumber: tooth2,
      conditionId: 'aparato-fijo',
      abbreviation,
      state,
      connectedToothNumber: tooth1
    }
  ];
};

/**
 * Crea condiciones para un rango de dientes (Aparato Removible, Prótesis, Edéntulo)
 * Endpoints llevan connectedToothNumber para el renderizado visual SVG
 */
export const createRangeConditions = (
  teeth: string[],
  conditionId: string,
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition[] => {
  if (teeth.length === 0) return [];
  const firstTooth = teeth[0];
  const lastTooth = teeth[teeth.length - 1];
  return teeth.map(tooth => ({
    toothNumber: tooth,
    conditionId,
    abbreviation,
    state,
    connectedToothNumber:
      tooth === firstTooth ? lastTooth :
      tooth === lastTooth ? firstTooth :
      undefined
  }));
};

/**
 * Crea condiciones para Transposición (2 dientes transpuestos)
 */
export const createTransposicionConditions = (
  tooth1: string,
  tooth2: string,
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition[] => {
  return [
    {
      toothNumber: tooth1,
      conditionId: 'transposicion',
      abbreviation,
      state,
      connectedToothNumber: tooth2
    },
    {
      toothNumber: tooth2,
      conditionId: 'transposicion',
      abbreviation,
      state,
      connectedToothNumber: tooth1
    }
  ];
};

/**
 * Crea condición con ubicación de fractura
 */
export const createFractureCondition = (
  toothNumber: string,
  location: 'corona' | 'raiz' | 'ambos',
  clickPosition: { x: number; y: number },
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition => ({
  toothNumber,
  conditionId: 'fractura',
  fractureLocation: location,
  clickPosition,
  abbreviation,
  state
});

/**
 * Crea condición de supernumerario con posición
 */
export const createSupernumeraryCondition = (
  toothNumber: string,
  position: 'left' | 'right',
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition => ({
  toothNumber,
  conditionId: 'supernumerario',
  supernumeraryPosition: position,
  abbreviation,
  state
});

/**
 * Crea condición de diastema con posición
 */
export const createDiastemaCondition = (
  toothNumber: string,
  position: 'left' | 'right',
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition => ({
  toothNumber,
  conditionId: 'diastema',
  diastemaPosition: position,
  abbreviation,
  state
});

/**
 * Crea condición de giroversión con dirección
 */
export const createGiroversionCondition = (
  toothNumber: string,
  direction: 'clockwise' | 'counterclockwise',
  abbreviation?: string,
  state?: 'good' | 'bad'
): ToothCondition => ({
  toothNumber,
  conditionId: 'giroversion',
  giroversionDirection: direction,
  abbreviation,
  state
});
