/**
 * UTILIDADES PARA ODONTOGRAM
 * Funciones helper extraídas de Odontogram.tsx para mejorar la modularidad
 */

import {
  FDI_ADULT_QUADRANT_1,
  FDI_ADULT_QUADRANT_2,
  FDI_ADULT_QUADRANT_3,
  FDI_ADULT_QUADRANT_4,
  FDI_CHILD_QUADRANT_1,
  FDI_CHILD_QUADRANT_2,
  FDI_CHILD_QUADRANT_3,
  FDI_CHILD_QUADRANT_4
} from '@/constants/fdiNumbering'

/** Interfaz que acepta tanto DOMRect como objeto plano con las mismas propiedades */
interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Calcula la posición óptima para el menú contextual según el espacio disponible
 * alrededor del diente. Prioriza aparecer lo más cerca posible del diente.
 *
 * ESTRATEGIA:
 * 1. Siempre intentar posicionar HORIZONTALMENTE (derecha o izquierda del diente)
 * 2. Alinear verticalmente con la parte superior del diente
 * 3. Ajustar solo si se sale del viewport
 *
 * @param toothRect - Bounding box del diente (DOMRect o objeto plano con las mismas propiedades)
 * @param menuWidth - Ancho del menú contextual (default: 400px)
 * @param menuHeight - Alto del menú contextual (default: 500px)
 * @returns Coordenadas óptimas { x, y } para posicionar el menú
 */
export function calculateOptimalMenuPosition(
  toothRect: RectLike,
  menuWidth: number = 400,
  menuHeight: number = 500
): { x: number; y: number } {
  const padding = 10 // Margen de seguridad con los bordes de la pantalla
  const gap = 10 // Espacio entre el diente y el menú

  // Calcular espacio disponible en cada dirección
  const spaceRight = window.innerWidth - toothRect.right - padding
  const spaceLeft = toothRect.left - padding

  let menuX: number
  let menuY: number

  // PRIORIDAD: Siempre horizontal - DERECHA primero, luego IZQUIERDA
  if (spaceRight >= spaceLeft) {
    // Preferir derecha (incluso si no cabe completamente)
    menuX = toothRect.right + gap
  } else {
    // Preferir izquierda
    menuX = toothRect.left - menuWidth - gap
  }

  // Alinear verticalmente con la parte superior del diente
  menuY = toothRect.top

  // AJUSTES para no salirse del viewport

  // Ajuste horizontal: evitar que se salga por los lados
  if (menuX + menuWidth > window.innerWidth - padding) {
    menuX = window.innerWidth - menuWidth - padding
  }
  if (menuX < padding) {
    menuX = padding
  }

  // Ajuste vertical: evitar que se salga por arriba o abajo
  if (menuY + menuHeight > window.innerHeight - padding) {
    // Si el menú se sale por abajo, subirlo
    menuY = window.innerHeight - menuHeight - padding
  }
  if (menuY < padding) {
    // Si el menú se sale por arriba, bajarlo
    menuY = padding
  }

  return { x: menuX, y: menuY }
}

/**
 * Valida si dos dientes están en la misma arcada (superior o inferior)
 * Necesario para validaciones de aparatos ortodónticos, prótesis, etc.
 *
 * @param tooth1 - Número FDI del primer diente (ej: "1.8")
 * @param tooth2 - Número FDI del segundo diente (ej: "2.1")
 * @returns true si ambos están en la misma arcada (ambos superiores o ambos inferiores)
 */
export function areTeethInSameArcade(tooth1: string, tooth2: string): boolean {
  const quadrant1 = parseInt(tooth1.split('.')[0])
  const quadrant2 = parseInt(tooth2.split('.')[0])

  // Superiores: cuadrantes 1, 2, 5, 6
  const isUpper1 = quadrant1 === 1 || quadrant1 === 2 || quadrant1 === 5 || quadrant1 === 6
  const isUpper2 = quadrant2 === 1 || quadrant2 === 2 || quadrant2 === 5 || quadrant2 === 6

  return isUpper1 === isUpper2
}

/**
 * Calcula todos los dientes en un rango (para Edéntulo Total, Prótesis Removible)
 * Los dientes deben estar en el mismo cuadrante.
 *
 * @param firstTooth - Número FDI del primer diente del rango
 * @param lastTooth - Número FDI del último diente del rango
 * @returns Array de números FDI de todos los dientes en el rango (inclusive)
 */
export function getTeethInRange(firstTooth: string, lastTooth: string): string[] {
  const quadrant1 = parseInt(firstTooth.split('.')[0])
  const quadrant2 = lastTooth.split('.')[0]

  // Validar que ambos dientes estén en el mismo cuadrante
  if (quadrant1.toString() !== quadrant2) {
    return []
  }

  // Obtener el array de dientes del cuadrante correspondiente
  let quadrantArray: readonly string[] = []
  switch (quadrant1) {
    case 1:
      quadrantArray = FDI_ADULT_QUADRANT_1
      break
    case 2:
      quadrantArray = FDI_ADULT_QUADRANT_2
      break
    case 3:
      quadrantArray = FDI_ADULT_QUADRANT_3
      break
    case 4:
      quadrantArray = FDI_ADULT_QUADRANT_4
      break
    case 5:
      quadrantArray = FDI_CHILD_QUADRANT_1
      break
    case 6:
      quadrantArray = FDI_CHILD_QUADRANT_2
      break
    case 7:
      quadrantArray = FDI_CHILD_QUADRANT_3
      break
    case 8:
      quadrantArray = FDI_CHILD_QUADRANT_4
      break
    default:
      return []
  }

  // Encontrar índices de los dientes en el array
  const idx1 = quadrantArray.indexOf(firstTooth)
  const idx2 = quadrantArray.indexOf(lastTooth)

  if (idx1 === -1 || idx2 === -1) {
    return []
  }

  // Obtener todos los dientes entre los dos índices (inclusive)
  const startIdx = Math.min(idx1, idx2)
  const endIdx = Math.max(idx1, idx2)

  return Array.from(quadrantArray.slice(startIdx, endIdx + 1))
}

/**
 * Calcula todos los dientes en un rango dentro de la misma arcada.
 * A diferencia de getTeethInRange, esta función soporta rangos que cruzan
 * la línea media (distintos cuadrantes dentro de la misma arcada).
 *
 * Ejemplos:
 * - Mismo cuadrante: getTeethInArcadeRange('1.7', '1.2') → ['1.7','1.6','1.5','1.4','1.3','1.2']
 * - Cross-cuadrante: getTeethInArcadeRange('1.3', '2.3') → ['1.3','1.2','1.1','2.1','2.2','2.3']
 *
 * @param firstTooth - Número FDI del primer diente
 * @param secondTooth - Número FDI del segundo diente
 * @returns Array de números FDI de todos los dientes en el rango (inclusive)
 */
export function getTeethInArcadeRange(firstTooth: string, secondTooth: string): string[] {
  const q1 = parseInt(firstTooth.split('.')[0])
  const q2 = parseInt(secondTooth.split('.')[0])

  // Si están en el mismo cuadrante, usar la función existente
  if (q1 === q2) {
    return getTeethInRange(firstTooth, secondTooth)
  }

  // Verificar que están en la misma arcada
  if (!areTeethInSameArcade(firstTooth, secondTooth)) {
    return []
  }

  // Determinar si es arcada superior o inferior (adultos o niños)
  const isUpper = [1, 2, 5, 6].includes(q1)
  const isChild = [5, 6, 7, 8].includes(q1)

  // Construir el orden completo de la arcada (de derecha a izquierda anatómicamente)
  let arcadeOrder: string[]
  if (isChild) {
    if (isUpper) {
      // Superior niños: Q5 (derecha→centro) + Q6 (centro→izquierda)
      arcadeOrder = [...FDI_CHILD_QUADRANT_1, ...FDI_CHILD_QUADRANT_2]
    } else {
      // Inferior niños: Q8 (derecha→centro) + Q7 (centro→izquierda)
      arcadeOrder = [...FDI_CHILD_QUADRANT_4, ...FDI_CHILD_QUADRANT_3]
    }
  } else {
    if (isUpper) {
      // Superior adultos: Q1 (derecha→centro) + Q2 (centro→izquierda)
      arcadeOrder = [...FDI_ADULT_QUADRANT_1, ...FDI_ADULT_QUADRANT_2]
    } else {
      // Inferior adultos: Q4 (derecha→centro) + Q3 (centro→izquierda)
      arcadeOrder = [...FDI_ADULT_QUADRANT_4, ...FDI_ADULT_QUADRANT_3]
    }
  }

  const idx1 = arcadeOrder.indexOf(firstTooth)
  const idx2 = arcadeOrder.indexOf(secondTooth)

  if (idx1 === -1 || idx2 === -1) {
    return []
  }

  const startIdx = Math.min(idx1, idx2)
  const endIdx = Math.max(idx1, idx2)

  return arcadeOrder.slice(startIdx, endIdx + 1)
}

/**
 * Determina si el diente está en el lado derecho o izquierdo de la boca
 * Útil para determinar la orientación de secciones mesial/distal
 *
 * @param toothNumber - Número FDI del diente (ej: "1.8")
 * @returns true si el diente está en cuadrantes derechos (1, 4, 5, 8)
 */
export function isRightSide(toothNumber: string): boolean {
  const quadrant = parseInt(toothNumber.split('.')[0])
  return quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8
}
