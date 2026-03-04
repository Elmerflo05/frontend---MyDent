/**
 * UTILIDADES DE VALIDACIÓN DENTAL
 * Validaciones reutilizables para operaciones multi-diente
 */

/**
 * Valida que dos dientes NO sean el mismo
 */
export const validateNotSameTooth = (tooth1: string, tooth2: string): boolean => {
  return tooth1 !== tooth2;
};

/**
 * Valida que dos dientes estén en la misma arcada (superior o inferior)
 * Arcada superior: cuadrantes 1, 2, 5, 6 (primer dígito 1 o 5)
 * Arcada inferior: cuadrantes 3, 4, 7, 8 (primer dígito 3, 4, 7, 8)
 */
export const validateSameArcade = (tooth1: string, tooth2: string): boolean => {
  const quadrant1 = parseInt(tooth1[0]);
  const quadrant2 = parseInt(tooth2[0]);

  const isUpperArcade1 = quadrant1 === 1 || quadrant1 === 2 || quadrant1 === 5 || quadrant1 === 6;
  const isUpperArcade2 = quadrant2 === 1 || quadrant2 === 2 || quadrant2 === 5 || quadrant2 === 6;

  return isUpperArcade1 === isUpperArcade2;
};

/**
 * Valida que dos dientes estén en el mismo cuadrante
 */
export const validateSameQuadrant = (tooth1: string, tooth2: string): boolean => {
  return tooth1[0] === tooth2[0];
};

/**
 * Valida que dos dientes sean adyacentes (números consecutivos en el mismo cuadrante)
 */
export const validateAdjacentTeeth = (tooth1: string, tooth2: string): boolean => {
  if (!validateSameQuadrant(tooth1, tooth2)) {
    return false;
  }

  const num1 = parseInt(tooth1[1]);
  const num2 = parseInt(tooth2[1]);

  return Math.abs(num1 - num2) === 1;
};

/**
 * Valida que un conjunto de dientes forme un rango válido
 * (todos en la misma arcada, números consecutivos)
 */
export const validateToothRange = (teeth: string[]): boolean => {
  if (teeth.length < 2) return false;

  // Todos deben estar en la misma arcada
  const firstTooth = teeth[0];
  for (let i = 1; i < teeth.length; i++) {
    if (!validateSameArcade(firstTooth, teeth[i])) {
      return false;
    }
  }

  return true;
};

/**
 * Mensajes de error estándar para validaciones
 */
export const VALIDATION_MESSAGES = {
  SAME_TOOTH: 'Debe seleccionar un diente diferente',
  DIFFERENT_ARCADE: 'Ambos dientes deben estar en la misma arcada (superior o inferior)',
  DIFFERENT_QUADRANT: 'Ambos dientes deben estar en el mismo cuadrante',
  NOT_ADJACENT: 'Los dientes deben ser adyacentes (uno al lado del otro)',
  INVALID_RANGE: 'Los dientes deben formar un rango válido en la misma arcada'
} as const;
