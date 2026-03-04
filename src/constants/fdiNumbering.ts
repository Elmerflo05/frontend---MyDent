/**
 * FDI TOOTH NUMBERING SYSTEM
 * Sistema de numeración dental FDI (Fédération Dentaire Internationale)
 *
 * Utilizado en el odontograma oficial del Colegio Odontológico del Perú
 */

// ==================== ADULTOS (32 dientes) ====================

/**
 * Cuadrante 1: Superior Derecha (Adultos)
 * Dientes permanentes del lado derecho superior
 * Orden visual: de afuera (1.8) hacia centro (1.1)
 */
export const FDI_ADULT_QUADRANT_1 = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1'] as const

/**
 * Cuadrante 2: Superior Izquierda (Adultos)
 * Dientes permanentes del lado izquierdo superior
 * Orden visual: de centro (2.1) hacia afuera (2.8)
 */
export const FDI_ADULT_QUADRANT_2 = ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'] as const

/**
 * Cuadrante 3: Inferior Izquierda (Adultos)
 * Dientes permanentes del lado izquierdo inferior
 * Orden visual: de centro (3.1) hacia afuera (3.8)
 */
export const FDI_ADULT_QUADRANT_3 = ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'] as const

/**
 * Cuadrante 4: Inferior Derecha (Adultos)
 * Dientes permanentes del lado derecho inferior
 * Orden visual: de afuera (4.8) hacia centro (4.1)
 */
export const FDI_ADULT_QUADRANT_4 = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1'] as const

// ==================== NIÑOS (20 dientes) ====================

/**
 * Cuadrante 5: Superior Derecha (Niños)
 * Dientes temporales del lado derecho superior
 * Orden visual: de afuera (5.5) hacia centro (5.1)
 */
export const FDI_CHILD_QUADRANT_1 = ['5.5', '5.4', '5.3', '5.2', '5.1'] as const

/**
 * Cuadrante 6: Superior Izquierda (Niños)
 * Dientes temporales del lado izquierdo superior
 * Orden visual: de centro (6.1) hacia afuera (6.5)
 */
export const FDI_CHILD_QUADRANT_2 = ['6.1', '6.2', '6.3', '6.4', '6.5'] as const

/**
 * Cuadrante 7: Inferior Izquierda (Niños)
 * Dientes temporales del lado izquierdo inferior
 * Orden visual: de centro (7.1) hacia afuera (7.5)
 */
export const FDI_CHILD_QUADRANT_3 = ['7.1', '7.2', '7.3', '7.4', '7.5'] as const

/**
 * Cuadrante 8: Inferior Derecha (Niños)
 * Dientes temporales del lado derecho inferior
 * Orden visual: de afuera (8.5) hacia centro (8.1)
 */
export const FDI_CHILD_QUADRANT_4 = ['8.5', '8.4', '8.3', '8.2', '8.1'] as const

// ==================== AGRUPACIONES ÚTILES ====================

/**
 * Todos los dientes adultos (32 permanentes)
 */
export const FDI_ALL_ADULT_TEETH = [
  ...FDI_ADULT_QUADRANT_1,
  ...FDI_ADULT_QUADRANT_2,
  ...FDI_ADULT_QUADRANT_3,
  ...FDI_ADULT_QUADRANT_4
] as const

/**
 * Todos los dientes de niños (20 temporales)
 */
export const FDI_ALL_CHILD_TEETH = [
  ...FDI_CHILD_QUADRANT_1,
  ...FDI_CHILD_QUADRANT_2,
  ...FDI_CHILD_QUADRANT_3,
  ...FDI_CHILD_QUADRANT_4
] as const

/**
 * Todos los dientes (52 total: 32 adultos + 20 niños)
 */
export const FDI_ALL_TEETH = [
  ...FDI_ALL_ADULT_TEETH,
  ...FDI_ALL_CHILD_TEETH
] as const

// ==================== TIPOS ====================

export type AdultToothNumber = typeof FDI_ALL_ADULT_TEETH[number]
export type ChildToothNumber = typeof FDI_ALL_CHILD_TEETH[number]
export type ToothNumber = AdultToothNumber | ChildToothNumber
