// Helper: Determinar tipo de diente según numeración FDI
export const getToothType = (tooth: string): 'molar' | 'premolar' | 'canine' | 'incisor' => {
  const quadrant = parseInt(tooth.split('.')[0]);
  const num = parseInt(tooth.split('.')[1]);

  if (quadrant >= 5) {
    if (num >= 4 && num <= 5) return 'molar';
    if (num === 3) return 'canine';
    return 'incisor';
  }

  if (num >= 6 && num <= 8) return 'molar';
  if (num >= 4 && num <= 5) return 'premolar';
  if (num === 3) return 'canine';
  return 'incisor';
};

// Helper: Determinar si el diente está en el lado derecho (cuadrantes 1,4,5,8) o izquierdo (cuadrantes 2,3,6,7)
export const isRightSide = (toothNumber: string): boolean => {
  const quadrant = parseInt(toothNumber.split('.')[0]);
  return quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;
};

// Helper: Calcular el número de diente adyacente según FDI
export const getAdjacentToothNumber = (toothNumber: string, direction: 'left' | 'right'): string | null => {
  const parts = toothNumber.split('.');
  const quadrant = parseInt(parts[0]);
  const position = parseInt(parts[1]);

  // En cuadrantes 1 y 5 (derecha superior): los números aumentan de derecha a izquierda
  // En cuadrantes 2 y 6 (izquierda superior): los números disminuyen de derecha a izquierda
  // En cuadrantes 3 y 7 (izquierda inferior): los números aumentan de izquierda a derecha
  // En cuadrantes 4 y 8 (derecha inferior): los números disminuyen de izquierda a derecha

  let adjacentPosition: number;

  if (quadrant === 1 || quadrant === 5) {
    // Derecha superior: left = menor número, right = mayor número
    adjacentPosition = direction === 'left' ? position - 1 : position + 1;
  } else if (quadrant === 2 || quadrant === 6) {
    // Izquierda superior: left = mayor número, right = menor número
    adjacentPosition = direction === 'left' ? position + 1 : position - 1;
  } else if (quadrant === 3 || quadrant === 7) {
    // Izquierda inferior: left = menor número, right = mayor número
    adjacentPosition = direction === 'left' ? position - 1 : position + 1;
  } else {
    // Derecha inferior (4, 8): left = mayor número, right = menor número
    adjacentPosition = direction === 'left' ? position + 1 : position - 1;
  }

  // Validar que el número adyacente esté en el rango válido
  const maxPosition = quadrant >= 5 ? 5 : 8; // Niños: 1-5, Adultos: 1-8
  if (adjacentPosition < 1 || adjacentPosition > maxPosition) {
    return null;
  }

  return `${quadrant}.${adjacentPosition}`;
};

// Helper: Determinar dirección de flecha según condición
export const determineArrowDirection = (
  conditionId: string,
  isUpper: boolean
): 'up' | 'down' | 'left' | 'right' => {
  if (conditionId === 'diente-extruido') {
    return isUpper ? 'down' : 'up'; // Hacia el plano oclusal
  }
  if (conditionId === 'diente-intruido') {
    return isUpper ? 'up' : 'down'; // Hacia el ápice
  }
  if (conditionId === 'migracion') {
    return 'right'; // Por defecto, puede ser configurable
  }
  return 'down';
};
