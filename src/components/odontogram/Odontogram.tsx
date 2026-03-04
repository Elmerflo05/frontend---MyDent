/**
 * ODONTOGRAMA OFICIAL - COLEGIO ODONTOLÓGICO DEL PERÚ
 * Cumple con todas las disposiciones específicas oficiales
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, Info, AlertCircle, FileText, DollarSign, Settings, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import type { DentalCondition, ColorType } from '@/constants/dentalConditions';
import { OFFICIAL_COLORS } from '@/constants/dentalConditions';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import {
  TOOTH_DIMENSIONS,
  TOOTH_SPACING,
  QUADRANT_POSITIONS,
  VERTICAL_OFFSETS,
  ODONTOGRAM_VIEWBOX,
  getToothDimensions,
  getToothType,
  getToothXPosition,
  getToothCrownCenterY,
  getAlignedToothY,
  getAlignedToothX
} from '@/constants/toothDimensions';
import {
  FDI_ADULT_QUADRANT_1,
  FDI_ADULT_QUADRANT_2,
  FDI_ADULT_QUADRANT_3,
  FDI_ADULT_QUADRANT_4,
  FDI_CHILD_QUADRANT_1,
  FDI_CHILD_QUADRANT_2,
  FDI_CHILD_QUADRANT_3,
  FDI_CHILD_QUADRANT_4
} from '@/constants/fdiNumbering';
import {
  calculateOptimalMenuPosition,
  areTeethInSameArcade,
  getTeethInRange,
  isRightSide
} from '@/lib/utils/odontogramUtils';
import { handleMultiToothSelection } from '@/lib/utils/multiToothSelectionHandler';
import { CONDITION_SUBMENU_CONFIG } from '@/constants/conditionSubmenuConfig';
import { getAnnotationColor } from '@/lib/utils/annotationColorHelper';
import { OfficialConditionsMenu } from './OfficialConditionsMenu';
import { TreatmentModeMenu } from './TreatmentModeMenu';
import { AnnotationBox } from './AnnotationBox';
import { ToothConditionRenderer, AppliedCondition } from './ToothConditionRenderer';
import { ConditionSubmenu } from './ConditionSubmenu';
import { TreatmentCostSummary } from './TreatmentCostSummary';
import { ToothPriceModal } from './ToothPriceModal';
import { ToothSVG } from './ToothSVG';
import { SelectionIndicator } from './components/SelectionIndicator';
import { OdontogramHeader } from './components/OdontogramHeader';
import { InstructionsBanner } from './components/InstructionsBanner';
import { ZoomControls } from './components/ZoomControls';
import { FullscreenControls } from './components/FullscreenControls';
import { EdentuloGroupsRenderer } from './components/EdentuloGroupsRenderer';
import { QuadrantRenderer } from './components/QuadrantRenderer';
import { OdontogramMenus } from './components/OdontogramMenus';
import { calculateEdentuloGroups } from '@/lib/utils/edentuloGroupCalculator';
import { QUADRANT_CONFIGS } from '@/constants/quadrantConfigs';
import {
  useOdontogramZoom,
  useOdontogramFullscreen,
  useContextMenus,
  useMultiToothSelection,
  useToothConditions,
  useMarkAsTreated
} from './hooks';
import { createSubmenuHandler } from '@/lib/factories/submenuHandlerFactory';

interface ToothCondition {
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
  // Campos visuales desde la BD (para renderizado correcto)
  symbol_type?: string;
  fill_surfaces?: boolean;
  color?: string;
  dental_condition_id?: number;
  price?: number;
  // Precio personalizado del diente (cuando hay múltiples condiciones)
  custom_tooth_price?: number;
}

interface OdontogramProps {
  patient?: any;
  patientId?: string;
  onConditionsChange?: (conditions: ToothCondition[]) => void;
  onToothUpdate?: (toothData: any) => void;
  hideStatsCards?: boolean;
  className?: string;
  treatmentMode?: boolean; // Modo de tratamiento: permite cambiar rojo → azul
  initialConditions?: ToothCondition[]; // Condiciones iniciales para cargar
  readOnly?: boolean; // Modo solo lectura: no permite interacción
}

const Odontogram = ({
  patient,
  patientId,
  onConditionsChange,
  onToothUpdate,
  hideStatsCards,
  className,
  treatmentMode = false,
  initialConditions = [],
  readOnly = false
}: OdontogramProps = {}) => {
  // Ref para el contenedor del odontogram (necesario para fullscreen)
  const odontogramContainerRef = useRef<HTMLDivElement>(null);

  // Obtener condiciones desde el store (base de datos)
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  // Hooks de UI
  const { zoomLevel, handleZoomIn, handleZoomOut, handleZoomReset, handleZoomChange } =
    useOdontogramZoom();

  const { isFullscreen, toggleFullscreen, setIsFullscreen } =
    useOdontogramFullscreen(odontogramContainerRef);

  // Hook de menús contextuales
  const {
    contextMenu,
    setContextMenu,
    fractureSubmenu,
    setFractureSubmenu,
    supernumerarySubmenu,
    setSupernumerarySubmenu,
    diastemaSubmenu,
    setDiastemaSubmenu,
    giroversionSubmenu,
    setGiroversionSubmenu,
    fusionSubmenu,
    setFusionSubmenu,
    migracionSubmenu,
    setMigracionSubmenu,
    tratamientoPulparSubmenu,
    setTratamientoPulparSubmenu,
    closeAllMenus,
    hasAnyMenuOpen
  } = useContextMenus();

  // Hook de selecciones multi-diente
  const {
    aparatoFijoSelection,
    aparatoRemovibleSelection,
    transposicionSelection,
    protesisFijaSelection,
    protesisTotalSelection,
    protesisRemovibleSelection,
    edentuloTotalSelection,
    startAparatoFijo,
    startAparatoRemovible,
    startTransposicion,
    startProtesisFija,
    startProtesisTotal,
    startProtesisRemovible,
    startEdentuloTotal,
    completeAparatoFijo,
    completeAparatoRemovible,
    completeTransposicion,
    completeProtesisFija,
    completeProtesisTotal,
    completeProtesisRemovible,
    completeEdentuloTotal,
    resetAllSelections,
    hasActiveSelection,
    getActiveSelectionType
  } = useMultiToothSelection();

  // Hook de condiciones dentales (estado principal)
  const {
    toothConditions,
    annotationsTop,
    hoveredTooth,
    setToothConditions,
    setAnnotationsTop,
    setHoveredTooth,
    addCondition,
    markAsTreated,
    handleReset,
    getAppliedConditions,
    getConditionsForTooth,
    hasConditions
  } = useToothConditions(initialConditions, onConditionsChange);

  // Estados locales del componente (no movidos a hooks)
  const [hoveredToothInTreatment, setHoveredToothInTreatment] = useState<string | null>(null);

  // Estado para el modal de precio del diente (múltiples condiciones)
  const [toothPriceModal, setToothPriceModal] = useState<{
    isOpen: boolean;
    toothNumber: string;
    pendingCondition: ToothCondition | null;
    toothRect: { top: number; left: number; right: number; bottom: number; width: number; height: number; x: number; y: number } | null;
  }>({
    isOpen: false,
    toothNumber: '',
    pendingCondition: null,
    toothRect: null
  });

  // Hook para manejar el marcado de dientes como tratados
  const { handleMarkAsTreated } = useMarkAsTreated({
    toothConditions,
    setToothConditions,
    annotationsTop,
    setAnnotationsTop,
    onConditionsChange
  });

  // Carga inicial y notificación de cambios ahora manejados por useToothConditions hook

  // Estados de menús contextuales ahora manejados por useContextMenus hook
  // Estados de selecciones multi-diente ahora manejados por useMultiToothSelection hook

  // Sistema de numeración FDI - Importado de @/constants/fdiNumbering
  const adultQuadrant1 = FDI_ADULT_QUADRANT_1; // Superior derecho
  const adultQuadrant2 = FDI_ADULT_QUADRANT_2; // Superior izquierdo
  const adultQuadrant3 = FDI_ADULT_QUADRANT_3; // Inferior izquierdo
  const adultQuadrant4 = FDI_ADULT_QUADRANT_4; // Inferior derecho

  const childQuadrant1 = FDI_CHILD_QUADRANT_1; // Superior derecho
  const childQuadrant2 = FDI_CHILD_QUADRANT_2; // Superior izquierdo
  const childQuadrant3 = FDI_CHILD_QUADRANT_3; // Inferior izquierdo
  const childQuadrant4 = FDI_CHILD_QUADRANT_4; // Inferior derecho

  // Efecto para notificar cambios al padre ahora manejado por useToothConditions hook
  // Efecto para cerrar menú con ESC o click fuera ahora manejado por useContextMenus hook

  // getToothType ahora se importa de @/constants/toothDimensions
  // calculateOptimalMenuPosition, areTeethInSameArcade, getTeethInRange
  // ahora se importan de @/lib/utils/odontogramUtils
  // Funciones de Zoom y Fullscreen ahora provistas por hooks useOdontogramZoom y useOdontogramFullscreen

  // Handlers
  const handleToothClick = (event: React.MouseEvent<SVGElement>, toothNumber: string, sectionId?: string) => {
    event.stopPropagation();

    // MODO SOLO LECTURA: No permitir interacción
    if (readOnly) {
      return;
    }

    // MODO TRATAMIENTO: Mostrar menú contextual simplificado
    if (treatmentMode) {

      // Buscar condiciones del diente clickeado
      const toothConditionsForThisTooth = toothConditions.filter(c => c.toothNumber === toothNumber);

      // Si el diente no tiene condiciones, no hacer nada
      if (toothConditionsForThisTooth.length === 0) {
        return;
      }

      // Mostrar menú contextual en la posición del click
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        toothNumber: toothNumber,
        sectionId: undefined,
        type: 'tooth'
      });

      return; // Salir temprano
    }

    // MANEJO DE SELECCIONES MULTI-DIENTE
    // Utiliza la función helper unificada para todas las condiciones que requieren múltiples dientes

    // Aparato Ortodóntico Fijo (todos los dientes del rango, cross-cuadrante permitido)
    if (handleMultiToothSelection({
      selection: aparatoFijoSelection,
      toothNumber,
      conditionId: 'aparato-fijo',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      createConditionsForRange: true
    })) return;

    // Aparato Ortodóntico Removible (todos los dientes del rango, cross-cuadrante permitido)
    if (handleMultiToothSelection({
      selection: aparatoRemovibleSelection,
      toothNumber,
      conditionId: 'aparato-removible',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      createConditionsForRange: true
    })) return;

    // Transposición (requiere dientes adyacentes, siempre exactamente 2)
    if (handleMultiToothSelection({
      selection: transposicionSelection,
      toothNumber,
      conditionId: 'transposicion',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      requireAdjacent: true
    })) return;

    // Prótesis Fija (todos los dientes del rango, mismo cuadrante)
    if (handleMultiToothSelection({
      selection: protesisFijaSelection,
      toothNumber,
      conditionId: 'protesis-fija',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      requireSameQuadrant: true,
      createConditionsForRange: true
    })) return;

    // Prótesis Total (todos los dientes del rango, cross-cuadrante permitido)
    if (handleMultiToothSelection({
      selection: protesisTotalSelection,
      toothNumber,
      conditionId: 'protesis-total',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      createConditionsForRange: true
    })) return;

    // Prótesis Removible (todos los dientes del rango, mismo cuadrante)
    if (handleMultiToothSelection({
      selection: protesisRemovibleSelection,
      toothNumber,
      conditionId: 'protesis-removible',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      requireSameQuadrant: true,
      createConditionsForRange: true
    })) return;

    // Edéntulo Total (todos los dientes del rango, mismo cuadrante)
    if (handleMultiToothSelection({
      selection: edentuloTotalSelection,
      toothNumber,
      conditionId: 'edentulo-total',
      toothConditions,
      setToothConditions,
      resetSelection: resetAllSelections,
      allConditions: OFFICIAL_DENTAL_CONDITIONS,
      rangeSelector: true,
      requireSameQuadrant: true,
      createConditionsForRange: true
    })) return;

    // Obtener el elemento del grupo del diente (el <g> que contiene el diente)
    const toothGroup = event.currentTarget.closest('.tooth-group') as SVGGElement;
    if (!toothGroup) {
      return;
    }

    // Obtener el bounding box del grupo del diente en coordenadas de viewport
    const toothRect = toothGroup.getBoundingClientRect();

    // Calcular posición relativa del click dentro del elemento clickeado (para fracturas, etc.)
    const rect = event.currentTarget.getBoundingClientRect();
    const clickPosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // POSICIONAR MENÚ AL LADO DEL CLICK
    const menuWidth = 280;
    const menuHeight = 400;
    const gap = 15;

    // DEBUG: Ver coordenadas
    console.log('[handleToothClick] event.clientX:', event.clientX, 'event.clientY:', event.clientY);
    console.log('[handleToothClick] window.innerWidth:', window.innerWidth, 'window.innerHeight:', window.innerHeight);

    const spaceRight = window.innerWidth - event.clientX;
    const spaceLeft = event.clientX;

    let menuX: number;
    if (spaceRight >= menuWidth + gap) {
      menuX = event.clientX + gap;
    } else if (spaceLeft >= menuWidth + gap) {
      menuX = event.clientX - menuWidth - gap;
    } else {
      menuX = spaceRight >= spaceLeft
        ? Math.min(event.clientX + gap, window.innerWidth - menuWidth - 10)
        : Math.max(10, event.clientX - menuWidth - gap);
    }

    let menuY = event.clientY - 60;
    if (menuY + menuHeight > window.innerHeight - 10) {
      menuY = window.innerHeight - menuHeight - 10;
    }
    if (menuY < 10) {
      menuY = 10;
    }

    console.log('[handleToothClick] Calculated menuX:', menuX, 'menuY:', menuY);

    // Convertir DOMRect a objeto plano (serializable en React state)
    const toothRectData = {
      top: toothRect.top,
      left: toothRect.left,
      right: toothRect.right,
      bottom: toothRect.bottom,
      width: toothRect.width,
      height: toothRect.height,
      x: toothRect.x,
      y: toothRect.y
    };

    setContextMenu({
      visible: true,
      x: menuX,
      y: menuY,
      toothNumber,
      sectionId,
      type: 'tooth',
      clickPosition,
      toothRect: toothRectData // Guardar como objeto plano para el popover de precio
    });
  };

  const handleAnnotationClick = (
    event: React.MouseEvent,
    toothNumber: string
  ) => {
    event.stopPropagation();

    // Obtener el bounding box de la caja de anotación
    const annotationBox = event.currentTarget.getBoundingClientRect();

    // Calcular la posición ÓPTIMA del menú según el espacio disponible
    const optimalPosition = calculateOptimalMenuPosition(annotationBox);
    const menuX = optimalPosition.x;
    const menuY = optimalPosition.y;

    setContextMenu({
      visible: true,
      x: menuX,
      y: menuY,
      toothNumber,
      type: 'annotation-top'
    });
  };

  const handleConditionSelect = (condition: DentalCondition, abbreviation?: string, state?: 'good' | 'bad') => {
    if (!contextMenu) return;

    // Mapa de setters de submenú para evitar código repetitivo
    const submenuSetters = {
      fracture: setFractureSubmenu,
      supernumerary: setSupernumerarySubmenu,
      diastema: setDiastemaSubmenu,
      giroversion: setGiroversionSubmenu,
      fusion: setFusionSubmenu,
      migracion: setMigracionSubmenu,
      tratamientoPulpar: setTratamientoPulparSubmenu
    };

    // Mapa de funciones start para selecciones multi-diente
    const multiToothStarters = {
      aparatoFijo: startAparatoFijo,
      aparatoRemovible: startAparatoRemovible,
      transposicion: startTransposicion,
      protesisFija: startProtesisFija,
      protesisTotal: startProtesisTotal,
      protesisRemovible: startProtesisRemovible,
      edentuloTotal: startEdentuloTotal
    };

    // Verificar si la condición requiere un submenú o selección multi-diente
    const config = CONDITION_SUBMENU_CONFIG[condition.id];

    if (config) {
      if (config.requiresSubmenu) {
        // Abrir submenú correspondiente
        const setter = submenuSetters[config.submenuType as keyof typeof submenuSetters];
        if (setter) {
          setter({
            visible: true,
            x: contextMenu.x,
            y: contextMenu.y,
            toothNumber: contextMenu.toothNumber,
            sectionId: contextMenu.sectionId,
            clickPosition: contextMenu.clickPosition || { x: 0, y: 0 },
            state: state || 'good'
          } as any);
          setContextMenu(null);
          return;
        }
      } else if (config.requiresMultiToothSelection) {
        // Iniciar selección multi-diente
        const starter = multiToothStarters[config.submenuType as keyof typeof multiToothStarters];
        if (starter) {
          const finalState = state || (condition.id === 'edentulo-total' ? 'bad' : 'good');
          starter(contextMenu.toothNumber, finalState, abbreviation);
          setContextMenu(null);
          return;
        }
      }
    }

    const finalAbbreviation = abbreviation || condition.abbreviation;
    // Si no se especifica estado, usar el color de la condición para determinar el estado inicial
    // Rojo = 'bad' (patología sin tratar), Azul = 'good' (tratamiento/sano)
    let finalState = state;
    if (!finalState) {
      if (condition.colorConditional) {
        finalState = 'good'; // Condiciones con colorConditional por defecto en 'good'
      } else {
        // Para condiciones sin colorConditional, usar el color base
        finalState = condition.color === 'red' ? 'bad' : 'good';
      }
    }

    const newCondition: ToothCondition = {
      toothNumber: contextMenu.toothNumber,
      sectionId: contextMenu.sectionId,
      conditionId: condition.id,
      abbreviation: finalAbbreviation,
      state: finalState,
      color: condition.color, // Guardar el color original
      clickPosition: contextMenu.clickPosition,
      // Agregar precio base de la condición
      price: condition.price_base || condition.default_price || 0
    };

    // Si tiene abreviatura, actualizar recuadro de anotaciones superiores
    // Incluye: caries (MB, CE, CD, CDP), condiciones con symbolType 'text', etc.
    if (finalAbbreviation) {
      // Determinar color según estado usando helper
      const annotationColor = getAnnotationColor(condition, finalState, finalAbbreviation);

      const newAnnotations = new Map(annotationsTop);
      newAnnotations.set(contextMenu.toothNumber, {
        text: finalAbbreviation,
        color: annotationColor
      });
      setAnnotationsTop(newAnnotations);
    }

    // Verificar si ya hay condiciones en este diente
    const existingConditionsForTooth = toothConditions.filter(
      c => c.toothNumber === contextMenu.toothNumber
    );

    // Si ya hay al menos una condición, mostrar el modal de precio
    if (existingConditionsForTooth.length >= 1) {
      console.log('[Odontogram] Opening ToothPriceModal with toothRect:', contextMenu.toothRect);
      setToothPriceModal({
        isOpen: true,
        toothNumber: contextMenu.toothNumber,
        pendingCondition: newCondition,
        toothRect: contextMenu.toothRect || null
      });
      setContextMenu(null);
      return;
    }

    // Si es la primera condición, agregar normalmente
    setToothConditions([...toothConditions, newCondition]);
    setContextMenu(null);
  };

  // Handler para confirmar el precio del diente desde el modal
  const handleToothPriceConfirm = (toothNumber: string, finalPrice: number) => {
    if (!toothPriceModal.pendingCondition) return;

    // Agregar la nueva condición
    const newCondition = {
      ...toothPriceModal.pendingCondition
    };

    // Actualizar TODAS las condiciones del diente con el custom_tooth_price
    // Esto incluye las condiciones existentes y la nueva
    const updatedConditions = toothConditions.map(cond => {
      if (cond.toothNumber === toothNumber) {
        return {
          ...cond,
          custom_tooth_price: finalPrice
        };
      }
      return cond;
    });

    // Agregar la nueva condición también con el custom_tooth_price
    const newConditionWithPrice = {
      ...newCondition,
      custom_tooth_price: finalPrice
    };

    setToothConditions([...updatedConditions, newConditionWithPrice]);

    // Resetear el modal
    setToothPriceModal({
      isOpen: false,
      toothNumber: '',
      pendingCondition: null,
      toothRect: null
    });
  };

  // Handlers de submenús usando factory - Configuración unificada
  const submenuHandlerConfigs = [
    { conditionId: 'fractura', propertyName: 'fractureLocation', needsAnnotation: false, submenuState: fractureSubmenu, setSubmenuState: setFractureSubmenu },
    { conditionId: 'supernumerario', propertyName: 'supernumeraryPosition', needsAnnotation: false, submenuState: supernumerarySubmenu, setSubmenuState: setSupernumerarySubmenu },
    { conditionId: 'diastema', propertyName: 'diastemaPosition', needsAnnotation: false, submenuState: diastemaSubmenu, setSubmenuState: setDiastemaSubmenu },
    { conditionId: 'giroversion', propertyName: 'giroversionDirection', needsAnnotation: false, submenuState: giroversionSubmenu, setSubmenuState: setGiroversionSubmenu },
    { conditionId: 'fusion', propertyName: 'fusionPosition', needsAnnotation: false, submenuState: fusionSubmenu, setSubmenuState: setFusionSubmenu },
    {
      conditionId: 'migracion',
      propertyName: 'migracionDirection',
      needsAnnotation: true,
      mapValueToAbbreviation: (value: string) => value === 'mesial' ? 'M' : 'D',
      getAnnotationColor: () => 'blue',
      submenuState: migracionSubmenu,
      setSubmenuState: setMigracionSubmenu
    },
    {
      conditionId: 'tratamiento-pulpar',
      propertyName: 'tratamientoPulparType',
      needsAnnotation: true,
      mapValueToAbbreviation: (value: string) => value.toUpperCase(),
      getAnnotationColor: (state?: 'good' | 'bad') => {
        const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === 'tratamiento-pulpar');
        if (condition?.colorConditional && state) {
          return state === 'good' ? condition.colorConditional.goodState : condition.colorConditional.badState;
        }
        return 'blue';
      },
      submenuState: tratamientoPulparSubmenu,
      setSubmenuState: setTratamientoPulparSubmenu
    }
  ];

  // Crear handlers dinámicamente desde la configuración
  const submenuHandlers = submenuHandlerConfigs.reduce((handlers, config) => {
    const { submenuState, setSubmenuState, ...handlerConfig } = config;
    handlers[config.conditionId] = createSubmenuHandler(
      handlerConfig,
      { submenuState, toothConditions, setToothConditions, annotationsTop, setAnnotationsTop, setSubmenuState, OFFICIAL_DENTAL_CONDITIONS, setToothPriceModal }
    );
    return handlers;
  }, {} as Record<string, any>);

  const handleFractureLocationSelect = submenuHandlers['fractura'];
  const handleSupernumeraryPositionSelect = submenuHandlers['supernumerario'];
  const handleDiastemaPositionSelect = submenuHandlers['diastema'];
  const handleGiroversionDirectionSelect = submenuHandlers['giroversion'];
  const handleFusionPositionSelect = submenuHandlers['fusion'];
  const handleMigracionDirectionSelect = submenuHandlers['migracion'];
  const handleTratamientoPulparTypeSelect = submenuHandlers['tratamiento-pulpar'];

  // handleReset y getAppliedConditions ahora provistas por useToothConditions hook

  // isRightSide ahora se importa de @/lib/utils/odontogramUtils

  // Renderizar diente individual
  // ToothSVG ahora es un componente importado desde ./ToothSVG.tsx

  const appliedConditions = getAppliedConditions();

  // renderEdentuloTotalGroups ahora es calculateEdentuloGroups en utils/edentuloGroupCalculator.ts
  // y se renderiza con EdentuloGroupsRenderer componente


  return (
    <div className="odontogram-wrapper">
      <div
        ref={odontogramContainerRef}
        className={`bg-white shadow-sm border border-gray-200 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] rounded-none overflow-hidden flex flex-col'
          : 'rounded-xl p-2 sm:p-4 lg:p-6'
      }`}>
      {/* Header - Oculto en fullscreen */}
      {!isFullscreen && (
      <>
        <OdontogramHeader readOnly={readOnly} />
        <ZoomControls
          zoomLevel={zoomLevel}
          isFullscreen={isFullscreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomChange={handleZoomChange}
          onZoomReset={handleZoomReset}
          onToggleFullscreen={toggleFullscreen}
        />
      </>
      )}

      {/* Instrucciones - Ocultas en móvil y fullscreen */}
      {!isFullscreen && (
      <InstructionsBanner />
      )}

      {/* Controles flotantes - Solo en fullscreen */}
      {isFullscreen && (
        <FullscreenControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* Odontograma SVG - Ocupa todo el espacio en fullscreen */}
      <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto flex justify-center items-center ${
        isFullscreen
          ? 'flex-1 p-4 rounded-none'
          : 'p-1 sm:p-4 md:p-6 rounded-xl'
      }`}>
        <div
          className="odontogram-svg-container transition-transform duration-200 ease-out w-full min-w-[800px] md:min-w-[1200px] lg:min-w-[1400px] max-w-[1800px]"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <svg viewBox={`${ODONTOGRAM_VIEWBOX.x} ${ODONTOGRAM_VIEWBOX.y} ${ODONTOGRAM_VIEWBOX.width} ${ODONTOGRAM_VIEWBOX.height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* ==================== SUPERIORES ==================== */}

          {/* Render cuadrantes superiores (adultos + niños) */}
          {QUADRANT_CONFIGS.filter(c => c.isUpper).map(config => (
            <QuadrantRenderer
              key={config.key}
              config={config}
              annotationsTop={annotationsTop}
              appliedConditions={appliedConditions}
              hoveredTooth={hoveredTooth}
              setHoveredTooth={setHoveredTooth}
              treatmentMode={treatmentMode}
              toothConditions={toothConditions}
              setHoveredToothInTreatment={setHoveredToothInTreatment}
              edentuloTotalSelection={edentuloTotalSelection}
              protesisRemovibleSelection={protesisRemovibleSelection}
              handleToothClick={handleToothClick}
              handleAnnotationClick={handleAnnotationClick}
            />
          ))}

          {/* Línea vertical */}
          <line x1="980" y1="-21" x2="980" y2="1120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />

          {/* Línea horizontal */}
          <line x1="70" y1="483" x2="1890" y2="483" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />

          {/* ==================== INFERIORES ==================== */}

          {/* Render cuadrantes inferiores (adultos + niños) */}
          {QUADRANT_CONFIGS.filter(c => !c.isUpper).map(config => (
            <QuadrantRenderer
              key={config.key}
              config={config}
              annotationsTop={annotationsTop}
              appliedConditions={appliedConditions}
              hoveredTooth={hoveredTooth}
              setHoveredTooth={setHoveredTooth}
              treatmentMode={treatmentMode}
              toothConditions={toothConditions}
              setHoveredToothInTreatment={setHoveredToothInTreatment}
              edentuloTotalSelection={edentuloTotalSelection}
              protesisRemovibleSelection={protesisRemovibleSelection}
              handleToothClick={handleToothClick}
              handleAnnotationClick={handleAnnotationClick}
            />
          ))}
        </svg>
        </div>

        {/* Indicadores de selección multi-diente */}
        {[
          { type: 'aparato-fijo' as const, selection: aparatoFijoSelection, onCancel: resetAllSelections },
          { type: 'aparato-removible' as const, selection: aparatoRemovibleSelection, onCancel: resetAllSelections },
          { type: 'transposicion' as const, selection: transposicionSelection, onCancel: resetAllSelections },
          { type: 'protesis-fija' as const, selection: protesisFijaSelection, onCancel: resetAllSelections },
          { type: 'protesis-total' as const, selection: protesisTotalSelection, onCancel: resetAllSelections },
          { type: 'protesis-removible' as const, selection: protesisRemovibleSelection, onCancel: resetAllSelections },
          { type: 'edentulo-total' as const, selection: edentuloTotalSelection, onCancel: resetAllSelections }
        ].map(({ type, selection, onCancel }) => (
          <SelectionIndicator
            key={type}
            type={type}
            firstTooth={selection?.firstTooth || ''}
            onCancel={onCancel}
            isVisible={!!selection?.waitingForSecond}
          />
        ))}
      </div>

      {/* Controles - Ocultos en fullscreen */}
      {!isFullscreen && (
      <div className="mt-2 sm:mt-3 lg:mt-4 xl:mt-6 flex items-center justify-end">
        <div className="flex gap-2 sm:gap-2.5 lg:gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset} className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-2.5 lg:px-3 xl:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm">
            <RotateCcw className="w-3 h-3 sm:w-3.5 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Limpiar Todo</span>
            <span className="sm:hidden">Limpiar</span>
          </motion.button>
        </div>
      </div>
      )}

      {/* Resumen - Oculto en fullscreen */}
      {!isFullscreen && toothConditions.length > 0 && (
        <div className="mt-2 sm:mt-3 lg:mt-4 xl:mt-6 p-2 sm:p-2.5 lg:p-3 xl:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <AlertCircle className="w-3 h-3 sm:w-3.5 lg:w-4 xl:h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[10px] sm:text-xs lg:text-sm font-semibold text-yellow-800 mb-0.5 sm:mb-1">
                Condiciones Aplicadas ({toothConditions.length})
              </h4>
              <div className="text-[9px] sm:text-[10px] lg:text-xs text-yellow-700 space-y-0.5 sm:space-y-1">
                {toothConditions.slice(0, 5).map((tc, idx) => {
                  const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === tc.conditionId);
                  return (
                    <div key={idx}>
                      Diente {tc.toothNumber} {tc.sectionId ? `- ${tc.sectionId}` : ''}: {condition?.label} {tc.abbreviation ? `(${tc.abbreviation})` : ''}
                    </div>
                  );
                })}
                {toothConditions.length > 5 && (
                  <div className="font-medium">... y {toothConditions.length - 5} más</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menús contextuales y submenús */}
      <OdontogramMenus
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        treatmentMode={treatmentMode}
        toothConditions={toothConditions}
        handleMarkAsTreated={handleMarkAsTreated}
        handleConditionSelect={handleConditionSelect}
        readOnly={readOnly}
        fractureSubmenu={fractureSubmenu}
        setFractureSubmenu={setFractureSubmenu}
        supernumerarySubmenu={supernumerarySubmenu}
        setSupernumerarySubmenu={setSupernumerarySubmenu}
        diastemaSubmenu={diastemaSubmenu}
        setDiastemaSubmenu={setDiastemaSubmenu}
        giroversionSubmenu={giroversionSubmenu}
        setGiroversionSubmenu={setGiroversionSubmenu}
        fusionSubmenu={fusionSubmenu}
        setFusionSubmenu={setFusionSubmenu}
        migracionSubmenu={migracionSubmenu}
        setMigracionSubmenu={setMigracionSubmenu}
        tratamientoPulparSubmenu={tratamientoPulparSubmenu}
        setTratamientoPulparSubmenu={setTratamientoPulparSubmenu}
        handleFractureLocationSelect={handleFractureLocationSelect}
        handleSupernumeraryPositionSelect={handleSupernumeraryPositionSelect}
        handleDiastemaPositionSelect={handleDiastemaPositionSelect}
        handleGiroversionDirectionSelect={handleGiroversionDirectionSelect}
        handleFusionPositionSelect={handleFusionPositionSelect}
        handleMigracionDirectionSelect={handleMigracionDirectionSelect}
        handleTratamientoPulparTypeSelect={handleTratamientoPulparTypeSelect}
        odontogramContainerRef={odontogramContainerRef}
        isFullscreen={isFullscreen}
      />

      {/* Modal para definir precio del diente (múltiples condiciones) */}
      <ToothPriceModal
        isOpen={toothPriceModal.isOpen}
        onClose={() => setToothPriceModal({ isOpen: false, toothNumber: '', pendingCondition: null, toothRect: null })}
        toothNumber={toothPriceModal.toothNumber}
        conditions={[
          ...toothConditions.filter(c => c.toothNumber === toothPriceModal.toothNumber),
          ...(toothPriceModal.pendingCondition ? [toothPriceModal.pendingCondition] : [])
        ]}
        onConfirm={handleToothPriceConfirm}
        toothRect={toothPriceModal.toothRect}
      />
      </div>

      {/* Resumen de costos - Solo visible cuando NO está en fullscreen */}
      {!isFullscreen && toothConditions.length > 0 && (
        <div className="mt-2 sm:mt-3 lg:mt-4 xl:mt-6">
          <TreatmentCostSummary conditions={toothConditions} />
        </div>
      )}
    </div>
  );
};

export default Odontogram;
