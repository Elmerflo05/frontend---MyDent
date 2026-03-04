import { DentalCondition } from '@/constants/dentalConditions';

export interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  notes?: string;
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  supernumeraryPosition?: 'left' | 'right';
  diastemaPosition?: 'left' | 'right';
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  fusionPosition?: 'left' | 'right';
  migracionDirection?: 'mesial' | 'distal';
  tratamientoPulparType?: string;
  connectedToothNumber?: string;
  custom_tooth_price?: number;
}

interface SubmenuState {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId?: string;
  clickPosition?: { x: number; y: number };
  state?: 'good' | 'bad';
}

interface ToothPriceModalState {
  isOpen: boolean;
  toothNumber: string;
  pendingCondition: ToothCondition | null;
  toothRect: { top: number; left: number; right: number; bottom: number; width: number; height: number; x: number; y: number } | null;
}

interface SubmenuHandlerConfig {
  conditionId: string;
  propertyName: 'fractureLocation' | 'supernumeraryPosition' | 'diastemaPosition' | 'giroversionDirection' | 'fusionPosition' | 'migracionDirection' | 'tratamientoPulparType';
  needsAnnotation?: boolean;
  mapValueToAbbreviation?: (value: string) => string;
  getAnnotationColor?: (state?: 'good' | 'bad') => 'red' | 'blue';
}

interface HandlerDependencies {
  submenuState: SubmenuState | null;
  toothConditions: ToothCondition[];
  setToothConditions: (conditions: ToothCondition[]) => void;
  annotationsTop: Map<string, { text: string; color: 'red' | 'blue' }>;
  setAnnotationsTop: (annotations: Map<string, { text: string; color: 'red' | 'blue' }>) => void;
  setSubmenuState: (state: SubmenuState | null) => void;
  OFFICIAL_DENTAL_CONDITIONS: DentalCondition[];
  // Nuevas dependencias para el modal de precio
  setToothPriceModal?: (state: ToothPriceModalState) => void;
}

export function createSubmenuHandler(
  config: SubmenuHandlerConfig,
  deps: HandlerDependencies
) {
  return (value: string) => {
    const { submenuState, toothConditions, setToothConditions, annotationsTop, setAnnotationsTop, setSubmenuState, OFFICIAL_DENTAL_CONDITIONS, setToothPriceModal } = deps;

    if (!submenuState) return;

    const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === config.conditionId);
    if (!condition) return;

    const abbreviation = config.mapValueToAbbreviation?.(value);

    const newCondition: ToothCondition = {
      toothNumber: submenuState.toothNumber,
      sectionId: submenuState.sectionId,
      conditionId: config.conditionId,
      abbreviation,
      [config.propertyName]: value,
      ...(submenuState.clickPosition && { clickPosition: submenuState.clickPosition }),
      ...(submenuState.state && { state: submenuState.state })
    };

    // Actualizar anotaciones si es necesario
    if (config.needsAnnotation && abbreviation) {
      const newAnnotations = new Map(annotationsTop);
      const color = config.getAnnotationColor?.(submenuState.state) || 'blue';
      newAnnotations.set(submenuState.toothNumber, {
        text: abbreviation,
        color
      });
      setAnnotationsTop(newAnnotations);
    }

    // Verificar si ya hay condiciones en este diente
    const existingConditionsForTooth = toothConditions.filter(
      c => c.toothNumber === submenuState.toothNumber
    );

    // Si ya hay al menos una condición y tenemos el setter del modal, mostrar el modal de precio
    if (existingConditionsForTooth.length >= 1 && setToothPriceModal) {
      setToothPriceModal({
        isOpen: true,
        toothNumber: submenuState.toothNumber,
        pendingCondition: newCondition,
        toothRect: null // Los submenús no tienen acceso al rect del diente
      });
      setSubmenuState(null);
      return;
    }

    // Si es la primera condición, agregar normalmente
    setToothConditions([...toothConditions, newCondition]);
    setSubmenuState(null);
  };
}
