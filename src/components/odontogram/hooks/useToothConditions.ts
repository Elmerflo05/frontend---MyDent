/**
 * HOOK: useToothConditions
 *
 * Gestiona el estado principal de condiciones dentales y anotaciones
 *
 * Características:
 * - Estado de toothConditions (array de condiciones)
 * - Estado de annotationsTop (mapa de anotaciones)
 * - Sincronización con props.initialConditions
 * - Notificación automática al padre
 * - Handlers para agregar, marcar como tratado, reset
 * - Usa ToothConditionService y AnnotationService
 */

import { useState, useEffect, useRef } from 'react';
import { ToothConditionService, AnnotationService, type ToothCondition } from '@/services/tooth';
import { type DentalCondition } from '@/constants/dentalConditions';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { logger } from '@/lib/logger';

// Helper para comparar arrays de condiciones por contenido (no referencia)
// IMPORTANTE: Compara específicamente los campos que afectan el render visual
const areConditionsEqual = (a: ToothCondition[], b: ToothCondition[]): boolean => {
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;

  // Comparar campo por campo los valores importantes para el render
  for (let i = 0; i < a.length; i++) {
    const condA = a[i];
    const condB = b[i];

    // Comparar campos esenciales
    if (condA.toothNumber !== condB.toothNumber) return false;
    if (condA.sectionId !== condB.sectionId) return false;
    if (condA.conditionId !== condB.conditionId) return false;

    // IMPORTANTE: Comparar state y color (para sincronización Checklist -> Odontograma)
    if (condA.state !== condB.state) {
      return false;
    }
    if (condA.color !== condB.color) {
      return false;
    }
  }

  return true;
};

// ============================================================================
// TYPES
// ============================================================================

export interface AppliedCondition {
  condition: DentalCondition;
  toothNumber: string;
  sectionId?: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  supernumeraryPosition?: 'left' | 'right';
  diastemaPosition?: 'left' | 'right';
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  fusionPosition?: 'left' | 'right';
  migracionDirection?: 'mesial' | 'distal';
  connectedToothNumber?: string;
}

export interface UseToothConditionsReturn {
  // Estados
  toothConditions: ToothCondition[];
  annotationsTop: Map<string, { text: string; color: 'red' | 'blue' }>;
  hoveredTooth: string | null;

  // Setters directos
  setToothConditions: (conditions: ToothCondition[]) => void;
  setAnnotationsTop: (annotations: Map<string, { text: string; color: 'red' | 'blue' }>) => void;
  setHoveredTooth: (tooth: string | null) => void;

  // Handlers
  addCondition: (
    condition: ToothCondition,
    abbreviation?: string,
    state?: 'good' | 'bad'
  ) => void;
  markAsTreated: (toothNumber: string) => void;
  handleReset: () => void;
  getAppliedConditions: () => AppliedCondition[];

  // Utilidades
  getConditionsForTooth: (toothNumber: string) => ToothCondition[];
  hasConditions: () => boolean;
}

/**
 * Hook para gestión del estado principal de condiciones dentales
 *
 * Maneja:
 * - Array de condiciones (toothConditions)
 * - Mapa de anotaciones superiores (annotationsTop)
 * - Sincronización con initialConditions desde props
 * - Notificación automática al padre cuando hay cambios
 * - Transformación de condiciones del store al formato del componente
 *
 * @param initialConditions - Condiciones iniciales desde props (opcional)
 * @param onConditionsChange - Callback para notificar cambios al padre (opcional)
 * @returns Estados y handlers para manejar condiciones
 *
 * @example
 * ```tsx
 * const {
 *   toothConditions,
 *   annotationsTop,
 *   addCondition,
 *   markAsTreated,
 *   getAppliedConditions
 * } = useToothConditions(initialConditions, onConditionsChange);
 *
 * // Agregar una condición simple
 * addCondition({
 *   toothNumber: '1.6',
 *   conditionId: 'caries',
 *   abbreviation: 'C',
 *   state: 'bad'
 * });
 *
 * // Marcar diente como tratado (modo tratamiento)
 * markAsTreated('1.6');
 *
 * // Obtener condiciones para renderizado
 * const applied = getAppliedConditions();
 * ```
 */
export const useToothConditions = (
  initialConditions: ToothCondition[] = [],
  onConditionsChange?: (conditions: ToothCondition[]) => void
): UseToothConditionsReturn => {
  // ============================================================================
  // ESTADOS
  // ============================================================================

  // Obtener condiciones desde el store (base de datos)
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  const [toothConditions, setToothConditions] = useState<ToothCondition[]>([]);

  const [annotationsTop, setAnnotationsTop] = useState<
    Map<string, { text: string; color: 'red' | 'blue' }>
  >(new Map());

  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);

  // Ref para evitar notificar al padre durante la carga inicial
  const isLoadingInitialRef = useRef(false);

  // Ref para guardar el valor anterior de initialConditions (para comparación por contenido)
  const prevInitialConditionsRef = useRef<ToothCondition[]>([]);

  // ============================================================================
  // EFFECT: Cargar condiciones iniciales
  // ============================================================================

  useEffect(() => {
    const currentCount = initialConditions?.length || 0;

    // Si no hay initialConditions, el componente funciona en modo independiente
    if (currentCount === 0 || !initialConditions) {
      return;
    }

    // Comparar con el valor anterior por CONTENIDO, no por referencia
    // Esto evita re-renders innecesarios cuando el padre pasa un nuevo array con el mismo contenido
    if (areConditionsEqual(initialConditions, prevInitialConditionsRef.current)) {
      return; // El contenido es igual, no necesitamos actualizar
    }

    // Guardar una COPIA del valor para futuras comparaciones (evitar mutaciones)
    prevInitialConditionsRef.current = initialConditions.map(c => ({ ...c }));

    logger.db('Cargando condiciones iniciales', 'data', { count: currentCount });

    // Marcar que estamos cargando
    isLoadingInitialRef.current = true;

    // Detectar si viene del store (tiene 'condition') o del componente (tiene 'conditionId')
    const needsTransformation = initialConditions[0]?.hasOwnProperty('condition');

    if (needsTransformation) {
      // Transformar desde store - USAR SPREAD para preservar TODOS los campos (incluyendo custom_tooth_price)
      const transformedConditions = initialConditions.map((storeCondition: any) => ({
        ...storeCondition,  // Preserva TODOS los campos originales (custom_tooth_price, price, config_price_base, etc.)
        // Campos que necesitan transformación específica
        toothNumber: storeCondition.toothNumber,
        sectionId: storeCondition.sectionId,
        // IMPORTANTE: Mantener AMBOS campos para compatibilidad entre componentes
        conditionId: storeCondition.condition || storeCondition.conditionId,
        condition: storeCondition.condition || storeCondition.conditionId,  // Preservar para DetailedReportPanel
        abbreviation: storeCondition.abbreviation,
        state: storeCondition.state || storeCondition.initialState || (storeCondition.color === 'red' ? 'bad' : 'good'),
        initialState: storeCondition.initialState || storeCondition.state || (storeCondition.color === 'red' ? 'bad' : 'good'),
        notes: storeCondition.notes,
        color: storeCondition.color,
        fractureLocation: storeCondition.fractureLocation,
        clickPosition: storeCondition.clickPosition,
        supernumeraryPosition: storeCondition.supernumeraryPosition,
        diastemaPosition: storeCondition.diastemaPosition,
        giroversionDirection: storeCondition.giroversionDirection,
        fusionPosition: storeCondition.fusionPosition,
        migracionDirection: storeCondition.migracionDirection,
        connectedToothNumber: storeCondition.connectedToothNumber || storeCondition.connected_tooth_number,
        finalState: storeCondition.finalState,
        treatmentCompleted: storeCondition.treatmentCompleted,
        // Campos visuales desde BD o catálogo (importantes para renderizado correcto)
        // NOTA: El catálogo usa camelCase (symbolType), la BD usa snake_case (symbol_type)
        symbol_type: storeCondition.symbol_type || storeCondition.symbolType,
        color_type: storeCondition.color_type || storeCondition.color,
        fill_surfaces: storeCondition.fill_surfaces ?? storeCondition.fillSurfaces,
        dental_condition_id: storeCondition.dental_condition_id || storeCondition.condition_id,
        price: storeCondition.price,
        // CRÍTICO: Preservar precio personalizado para sincronización de totales
        custom_tooth_price: storeCondition.custom_tooth_price
      }));

      setToothConditions(transformedConditions);

      // Reconstruir anotaciones usando AnnotationService
      const newAnnotations = AnnotationService.createAnnotationsMap(
        transformedConditions,
        OFFICIAL_DENTAL_CONDITIONS
      );
      setAnnotationsTop(newAnnotations);
    } else {
      // Ya tienen conditionId, cargar directamente
      setToothConditions(initialConditions);

      // Crear anotaciones usando AnnotationService
      const newAnnotations = AnnotationService.createAnnotationsMap(
        initialConditions,
        OFFICIAL_DENTAL_CONDITIONS
      );
      setAnnotationsTop(newAnnotations);
    }

    // Terminar carga después de un pequeño delay
    setTimeout(() => {
      isLoadingInitialRef.current = false;
    }, 100);
  }, [initialConditions]);

  // ============================================================================
  // EFFECT: Notificar cambios al padre (DIFERIDO para evitar setState durante render)
  // ============================================================================

  useEffect(() => {
    // NO notificar durante la carga inicial para evitar loops
    // NO notificar si está vacío (evitar sobrescribir initialConditions con array vacío)
    // Notificar en TODOS los demás casos (usuario agregando/editando condiciones)
    if (onConditionsChange && !isLoadingInitialRef.current && toothConditions.length > 0) {
      // DIFERIR la notificación para evitar "Cannot update component while rendering"
      const timeoutId = setTimeout(() => {
        onConditionsChange(toothConditions);
        logger.db('Notificando cambios de condiciones al padre', 'data', {
          count: toothConditions.length
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [toothConditions, onConditionsChange]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Agrega una nueva condición y actualiza las anotaciones si corresponde
   */
  const addCondition = (
    condition: ToothCondition,
    abbreviation?: string,
    state?: 'good' | 'bad'
  ): void => {
    const newCondition: ToothCondition = {
      ...condition,
      abbreviation: abbreviation || condition.abbreviation,
      state: state || condition.state
    };

    // Agregar la condición
    setToothConditions(prev => [...prev, newCondition]);

    // Si tiene abreviatura, actualizar anotación usando AnnotationService
    if (newCondition.abbreviation) {
      const dentalCondition = OFFICIAL_DENTAL_CONDITIONS.find(
        c => c.id === newCondition.conditionId
      );

      if (dentalCondition) {
        const annotationColor = ToothConditionService.getAnnotationColor(
          dentalCondition,
          newCondition.state || 'good'
        );

        const updatedAnnotations = AnnotationService.updateAnnotation(
          annotationsTop,
          newCondition.toothNumber,
          {
            text: newCondition.abbreviation,
            color: annotationColor
          }
        );

        setAnnotationsTop(updatedAnnotations);
      }
    }

    logger.db('Condición agregada', 'data', {
      toothNumber: newCondition.toothNumber,
      conditionId: newCondition.conditionId
    });
  };

  /**
   * Marca todas las condiciones de un diente como tratadas
   * (cambia de rojo a azul en modo tratamiento)
   */
  const markAsTreated = (toothNumber: string): void => {
    const toothConditionsForThisTooth = toothConditions.filter(
      c => c.toothNumber === toothNumber
    );

    if (toothConditionsForThisTooth.length === 0) {
      logger.warn('No hay condiciones para este diente', { toothNumber });
      return;
    }

    // Verificar que tenga al menos una condición roja (no tratada)
    const hasRedConditions = toothConditionsForThisTooth.some(
      c => c.state === 'bad' || c.color === 'red'
    );

    if (!hasRedConditions) {
      logger.warn('No hay condiciones rojas para tratar', { toothNumber });
      return;
    }

    // Usar ToothConditionService para marcar como tratado
    const updatedConditions = ToothConditionService.markToothAsTreated(
      toothNumber,
      toothConditions
    );

    setToothConditions(updatedConditions);

    // Actualizar anotaciones a azul usando AnnotationService
    toothConditionsForThisTooth.forEach(condition => {
      if (condition.abbreviation) {
        const updatedAnnotations = AnnotationService.updateAnnotationColor(
          annotationsTop,
          toothNumber,
          'blue'
        );
        setAnnotationsTop(updatedAnnotations);
      }
    });

    logger.db('Diente marcado como tratado', 'data', { toothNumber });
  };

  /**
   * Resetea todas las condiciones y anotaciones
   */
  const handleReset = (): void => {
    setToothConditions([]);
    setAnnotationsTop(new Map());
    logger.db('Condiciones reseteadas', 'data', {});
  };

  /**
   * Convierte las condiciones al formato AppliedCondition para el renderizador
   *
   * IMPORTANTE: Soporta condiciones que vienen del diagnostico definitivo
   * que pueden no existir en OFFICIAL_DENTAL_CONDITIONS. En ese caso,
   * crea una condicion virtual usando los datos disponibles en la condicion.
   */
  const getAppliedConditions = (): AppliedCondition[] => {
    return toothConditions
      .map((tc) => {
        // Buscar la condicion en el store
        let condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === tc.conditionId);

        // Si no se encuentra, intentar buscar por condition_id numerico
        if (!condition && tc.dental_condition_id) {
          condition = OFFICIAL_DENTAL_CONDITIONS.find(
            c => c.condition_id === tc.dental_condition_id
          );
        }

        // Si aun no se encuentra, crear una condicion virtual para el renderizado
        // Esto es necesario para condiciones del diagnostico definitivo
        if (!condition) {
          // Determinar el color segun el estado
          // NOTA: El catálogo usa 'color', la BD usa 'color_type'
          const color = tc.state === 'good' ? 'blue' : (tc.color || tc.color_type || 'red');

          // PRIORIDAD 1: Usar symbol_type/symbolType de la BD o catálogo si está disponible
          // NOTA: El catálogo usa camelCase (symbolType), la BD usa snake_case (symbol_type)
          let symbolType = tc.symbol_type || tc.symbolType;
          let fillSurfaces = tc.fill_surfaces ?? tc.fillSurfaces;

          // PRIORIDAD 2: Solo si NO viene de ninguna fuente, usar lógica de fallback
          if (!symbolType) {
            // Lista de secciones válidas para 'fill' - INCLUYE 'corona' que viene de la BD
            const validSurfaceSections = [
              'm', 'o', 'd', 'v', 'l', 'c',
              'mesial', 'oclusal', 'distal', 'vestibular', 'lingual', 'palatino',
              'corona' // Superficie central del diente (C en BD se convierte a 'corona')
            ];

            const hasSurfaceSection = tc.sectionId &&
              tc.sectionId !== 'full' &&
              validSurfaceSections.includes(tc.sectionId.toLowerCase());

            symbolType = hasSurfaceSection ? 'fill' : 'aspa';
            fillSurfaces = hasSurfaceSection;
          }

          // Crear condicion virtual usando los datos disponibles
          condition = {
            id: tc.conditionId,
            label: tc.label || tc.conditionId,
            code: tc.abbreviation,
            color: color as 'red' | 'blue',
            category: 'Tratamiento',
            active: true,
            symbolType: symbolType,
            fillSurfaces: fillSurfaces ?? false,
            // Campos adicionales para compatibilidad
            condition_id: tc.dental_condition_id,
            price_base: tc.price
          } as DentalCondition;

          logger.db('Creando condicion virtual para renderizado', 'data', {
            conditionId: tc.conditionId,
            toothNumber: tc.toothNumber,
            sectionId: tc.sectionId,
            resolvedSymbolType: condition.symbolType,
            symbol_type_BD: tc.symbol_type,
            symbolType_catalog: tc.symbolType,
            state: tc.state
          });
        }

        const result = {
          condition,
          toothNumber: tc.toothNumber,
          sectionId: tc.sectionId,
          abbreviation: tc.abbreviation,
          state: tc.state,
          fractureLocation: tc.fractureLocation,
          clickPosition: tc.clickPosition,
          supernumeraryPosition: tc.supernumeraryPosition,
          diastemaPosition: tc.diastemaPosition,
          giroversionDirection: tc.giroversionDirection,
          fusionPosition: tc.fusionPosition,
          migracionDirection: tc.migracionDirection,
          connectedToothNumber: tc.connectedToothNumber
        };

        return result;
      })
      .filter(Boolean) as AppliedCondition[];
  };

  /**
   * Obtiene todas las condiciones de un diente específico
   */
  const getConditionsForTooth = (toothNumber: string): ToothCondition[] => {
    return toothConditions.filter(c => c.toothNumber === toothNumber);
  };

  /**
   * Verifica si hay condiciones aplicadas
   */
  const hasConditions = (): boolean => {
    return toothConditions.length > 0;
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Estados
    toothConditions,
    annotationsTop,
    hoveredTooth,

    // Setters directos
    setToothConditions,
    setAnnotationsTop,
    setHoveredTooth,

    // Handlers
    addCondition,
    markAsTreated,
    handleReset,
    getAppliedConditions,

    // Utilidades
    getConditionsForTooth,
    hasConditions
  };
};
