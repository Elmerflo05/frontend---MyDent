/**
 * TIPOS Y CONSTANTES DEL ODONTOGRAMA
 *
 * ⚠️ IMPORTANTE: Este archivo contiene SOLO tipos TypeScript y constantes de utilidad.
 *
 * 📊 DATOS REALES (condiciones dentales):
 *   - Se cargan AUTOMÁTICAMENTE desde la base de datos PostgreSQL
 *   - Ver: odontogramConfigStore.ts -> loadCatalogsFromDB()
 *   - Los componentes SIEMPRE deben usar el store de Zustand
 *
 * ✅ CONTENIDO DE ESTE ARCHIVO:
 *   - Tipos TypeScript para condiciones dentales
 *   - Constantes de colores oficiales
 *   - Categorías de condiciones
 *   - NO contiene datos hardcodeados
 *
 * Normas oficiales del Colegio Odontológico del Perú
 */

export type SymbolType =
  | 'aspa'
  | 'line'
  | 'arrow'
  | 'arrow-zigzag'  // Flecha en zigzag ⚡ (pieza en erupción)
  | 'circle'
  | 'square'        // Cuadrado alrededor de corona (coronas, espigo-muñón)
  | 'double-line'
  | 'zigzag'        // Línea zigzag ondulada ~~~~ (aparato removible)
  | 'parenthesis'
  | 'triangle'
  | 'curve-arrow'
  | 'crossed-arrows' // Dos flechas curvas cruzadas (transposición)
  | 'cross-square'
  | 'horizontal-with-verticals'  // Línea horizontal + verticales (prótesis fija)
  | 'single-horizontal'  // Línea horizontal simple (prótesis removible)
  | 'double-circle'
  | 'fill'
  | 'outline'       // Contorno sin relleno (restauración temporal)
  | 'horizontal-line-top'     // Línea horizontal arriba de la corona (gingivitis)
  | 'horizontal-line-bottom'  // Línea horizontal abajo de la raíz (periodontitis)
  | 'text';

export type ColorType = 'blue' | 'red';

export interface DentalCondition {
  id: string;
  label: string;
  category: 'patologia' | 'tratamiento' | 'protesis' | 'anomalia' | 'ortodoncia';
  symbolType: SymbolType;
  color: ColorType;
  colorConditional?: { // Color condicional según estado
    goodState: ColorType;
    badState: ColorType;
    onlyForAbbreviations?: string[]; // Si está definido, solo estas abreviaturas tendrán estado
  };
  abbreviation?: string; // Abreviatura para recuadro
  abbreviations?: Record<string, string>; // Múltiples opciones de abreviatura
  fillSurfaces?: boolean; // Si debe pintar superficies completas
  betweenTeeth?: boolean; // Si el símbolo se dibuja ENTRE dos dientes (ej. diastema)
  description: string;
  specifications?: string; // Especificaciones adicionales
  price?: number; // Precio base del tratamiento/condición (configurable por administrador)
  prices?: Record<string, number>; // Precios según abreviatura (para condiciones con múltiples opciones)
  cie10?: string; // Código CIE-10 (Clasificación Internacional de Enfermedades)
}

/**
 * ⚠️ NOTA IMPORTANTE:
 * El array OFFICIAL_DENTAL_CONDITIONS ha sido movido a la base de datos.
 * Para acceder a las condiciones dentales, usar el store de Zustand:
 *
 * import useOdontogramConfigStore from '@/store/odontogramConfigStore';
 *
 * const { dentalConditions, customConditions } = useOdontogramConfigStore();
 * const allConditions = [...dentalConditions, ...customConditions];
 */

/**
 * @deprecated ESTE EXPORT ESTÁ DEPRECADO Y SERÁ ELIMINADO
 * Array vacío mantenido temporalmente para compatibilidad con código legacy.
 * NO USAR - Las condiciones ahora se cargan desde la base de datos vía useOdontogramConfigStore.
 */
export const OFFICIAL_DENTAL_CONDITIONS: DentalCondition[] = [];

/**
 * Categorías de condiciones para el menú
 * IMPORTANTE: Los IDs deben coincidir exactamente con las categorías de la BD
 */
export const CONDITION_CATEGORIES = [
  { id: 'Patología', label: 'Patologías', icon: '🦷' },
  { id: 'Tratamiento', label: 'Tratamientos', icon: '⚕️' },
  { id: 'Prótesis', label: 'Prótesis', icon: '🔧' },
  { id: 'Anomalía', label: 'Anomalías', icon: '⚠️' },
  { id: 'Ortodoncia', label: 'Ortodoncia', icon: '🔩' }
];

/**
 * Colores oficiales
 */
export const OFFICIAL_COLORS = {
  blue: '#1e40af', // Azul oscuro profesional
  red: '#dc2626'   // Rojo profesional
};
