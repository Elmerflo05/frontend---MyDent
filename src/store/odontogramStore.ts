import { create } from 'zustand';
import { odontogramsApi, OdontogramConditionData } from '@/services/api/odontogramsApi';
import { logger } from '@/lib/logger';

export interface ToothCondition {
  toothNumber: string;
  sectionId: string;
  condition: string;
  color: string;
  notes?: string;
  date: Date;
  doctorId?: string;
  patientId: string;
  price?: number;
  initialState?: 'good' | 'bad'; // Estado inicial (diagnóstico)
  finalState?: 'good' | 'bad'; // Estado final (post-tratamiento)
  treatmentCompleted?: boolean; // Si el tratamiento se completó
  // Campos adicionales para integración con BD
  dental_condition_id?: number;
  tooth_position_id?: number;
  tooth_surface_id?: number;
  condition_name?: string;
  abbreviation?: string; // Abreviatura de la condición (ej: "MB", "CE", "CDP")
  // Campos visuales desde el JOIN con odontogram_dental_conditions
  symbol_type?: string; // Tipo de símbolo: 'fill', 'aspa', 'circle', etc.
  fill_surfaces?: boolean; // Si la condición debe pintar superficies
  // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
  connectedToothNumber?: string;
}

export interface OdontogramTemplate {
  id: string;
  name: string;
  description: string;
  conditions: ToothCondition[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Estado de carga para cada paciente
interface LoadingState {
  [patientId: string]: boolean;
}

interface OdontogramStore {
  // Estado
  patientOdontograms: Map<string, ToothCondition[]>;
  templates: OdontogramTemplate[];
  currentPatientId: string | null;
  loadingStates: LoadingState;
  currentOdontogramId: number | null; // ID del odontograma en BD

  // Acciones para odontogramas de pacientes
  setPatientOdontogram: (patientId: string, conditions: ToothCondition[]) => void;
  getPatientOdontogram: (patientId: string) => ToothCondition[];
  clearPatientOdontogram: (patientId: string) => void;
  addConditionToPatient: (patientId: string, condition: ToothCondition) => void;
  removeConditionFromPatient: (patientId: string, toothNumber: string, sectionId: string) => void;
  updateConditionPrice: (patientId: string, toothNumber: string, sectionId: string, price: number) => void;

  // Acciones para templates
  createTemplate: (template: Omit<OdontogramTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, template: Partial<OdontogramTemplate>) => void;
  deleteTemplate: (id: string) => void;
  applyTemplateToPatient: (templateId: string, patientId: string) => void;

  // Acciones generales
  setCurrentPatient: (patientId: string | null) => void;
  exportOdontogram: (patientId: string) => string;
  importOdontogram: (patientId: string, data: string) => boolean;

  // Estadísticas
  getPatientStatistics: (patientId: string) => {
    totalTeeth: number;
    healthyTeeth: number;
    treatedTeeth: number;
    missingTeeth: number;
    conditionsSummary: Map<string, number>;
  };

  // Métodos específicos para flujo de tratamiento
  initializeTreatmentOdontogram: (patientId: string, diagnosticConditions: ToothCondition[]) => ToothCondition[];
  updateTreatmentState: (patientId: string, toothNumber: string, sectionId: string, newState: 'good' | 'bad') => void;
  markTreatmentCompleted: (patientId: string, toothNumber: string, sectionId: string) => void;
  getTreatmentProgress: (patientId: string) => {
    totalPatologies: number;
    treatedPatologies: number;
    progressPercentage: number;
  };

  // ============================================================
  // NUEVOS MÉTODOS PARA INTEGRACIÓN CON BASE DE DATOS
  // ============================================================

  // Cargar odontograma desde la BD
  loadPatientOdontogramFromDB: (patientId: number) => Promise<ToothCondition[]>;

  // Guardar odontograma en la BD
  savePatientOdontogramToDB: (
    patientId: number,
    dentistId: number,
    branchId: number,
    appointmentId?: number,
    consultationId?: number
  ) => Promise<void>;

  // Setear el ID del odontograma actual
  setCurrentOdontogramId: (id: number | null) => void;

  // Verificar si está cargando
  isLoading: (patientId: string) => boolean;
}

// ============================================================
// MAPEOS DE HOMOLOGACIÓN FRONTEND <-> BD
// ============================================================

/**
 * Mapeo de sectionId del frontend a surface_code de la BD
 * Las secciones de la corona (vestibular, lingual, mesial, distal, oclusal)
 * se mapean a las superficies anatómicas de la BD (V, L, M, D, O, I)
 */
const FRONTEND_TO_DB_SURFACE: Record<string, string> = {
  'vestibular': 'V',
  'lingual': 'L',
  'mesial': 'M',
  'distal': 'D',
  'corona': 'C',      // Superficie central del diente
  'oclusal': 'C',     // Alias legacy
  'incisal': 'C',     // Alias legacy
  // Variantes alternativas (códigos directos)
  'V': 'V',
  'L': 'L',
  'M': 'M',
  'D': 'D',
  'C': 'C',
  'O': 'C',           // Mapear O legacy a C
  'I': 'C'            // Mapear I legacy a C
};

/**
 * Mapeo inverso de surface_code de la BD a sectionId del frontend
 */
const DB_TO_FRONTEND_SURFACE: Record<string, string> = {
  'V': 'vestibular',
  'L': 'lingual',
  'M': 'mesial',
  'D': 'distal',
  'C': 'corona',
  'O': 'corona',  // Legacy: mapear a corona
  'I': 'corona'   // Legacy: mapear a corona
};

/**
 * Secciones que NO son superficies anatómicas (se guardan en surface_section)
 * Estas incluyen las raíces y otras áreas del diente
 */
const ROOT_SECTIONS = [
  'raiz', 'raiz-mv', 'raiz-dv', 'raiz-distal', 'raiz-palatina',
  'corona', 'cervical', 'furcation', 'apex', 'general'
];

/**
 * Mapeo de IDs de superficie de la BD
 * Las 5 superficies del diente según el frontend:
 * V=Vestibular, L=Lingual, M=Mesial, D=Distal, C=Corona
 */
const SURFACE_CODE_TO_ID: Record<string, number> = {
  'V': 1,
  'L': 2,
  'M': 3,
  'D': 4,
  'C': 5,
  // Legacy mappings
  'O': 5,  // Oclusal -> Corona
  'I': 5   // Incisal -> Corona
};

const SURFACE_ID_TO_CODE: Record<number, string> = {
  1: 'V',
  2: 'L',
  3: 'M',
  4: 'D',
  5: 'C'
};

/**
 * Determina si un sectionId corresponde a una superficie anatómica
 */
function isSurfaceSection(sectionId: string): boolean {
  return sectionId in FRONTEND_TO_DB_SURFACE;
}

/**
 * Determina si un sectionId corresponde a una sección de raíz/estructura
 */
function isRootSection(sectionId: string): boolean {
  return ROOT_SECTIONS.includes(sectionId);
}

/**
 * Convierte condiciones del formato del backend al formato del frontend
 */
function convertDBConditionToFrontend(dbCondition: OdontogramConditionData, patientId: string): ToothCondition {
  // Determinar el sectionId correcto
  let sectionId = 'general';

  // Prioridad: surface_section > surface_code > tooth_surface_id
  if (dbCondition.surface_section) {
    // Intentar mapear primero, si no existe en el mapeo usar directamente
    sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_section]
              || dbCondition.surface_section;
  } else if (dbCondition.surface_code) {
    // Convertir código de superficie de BD a ID del frontend
    sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_code] || dbCondition.surface_code;
  } else if (dbCondition.tooth_surface_id) {
    // Convertir ID de superficie a sectionId
    const surfaceCode = SURFACE_ID_TO_CODE[dbCondition.tooth_surface_id];
    if (surfaceCode) {
      sectionId = DB_TO_FRONTEND_SURFACE[surfaceCode] || surfaceCode;
    }
  }

  // IMPORTANTE: Convertir tooth_number de formato BD ("11") a formato frontend ("1.1")
  // La BD guarda "11", "21", "18", etc., pero el componente espera "1.1", "2.1", "1.8"
  let toothNumber = dbCondition.tooth_number;
  if (toothNumber && !toothNumber.includes('.') && toothNumber.length === 2) {
    toothNumber = `${toothNumber[0]}.${toothNumber[1]}`;
  }

  // IMPORTANTE: condition debe ser el dental_condition_code (ej: "caries-mb", "caries-ce")
  // porque el store de configuración usa condition_code como 'id' para identificar condiciones
  // dental_condition_code tiene prioridad sobre condition_name
  const conditionCode = dbCondition.dental_condition_code || dbCondition.condition_name || 'unknown';

  return {
    toothNumber: toothNumber,
    sectionId: sectionId,
    condition: conditionCode,
    color: dbCondition.color_type || 'gray', // color_type viene del JOIN con odontogram_dental_conditions
    notes: dbCondition.notes || dbCondition.description,
    date: dbCondition.created_at ? new Date(dbCondition.created_at) : new Date(),
    patientId: patientId,
    price: dbCondition.price || dbCondition.config_price_base || 0,
    dental_condition_id: dbCondition.dental_condition_id,
    tooth_position_id: dbCondition.tooth_position_id,
    tooth_surface_id: dbCondition.tooth_surface_id,
    condition_name: dbCondition.condition_name,
    abbreviation: dbCondition.abbreviation,
    initialState: 'bad', // Por defecto las patologías empiezan mal
    finalState: 'bad',
    treatmentCompleted: false,
    // Campos visuales desde el JOIN con odontogram_dental_conditions
    symbol_type: dbCondition.symbol_type,
    fill_surfaces: dbCondition.fill_surfaces,
    // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
    connectedToothNumber: dbCondition.connected_tooth_number
  };
}

/**
 * Convierte condiciones del formato del frontend al formato del backend
 */
function convertFrontendConditionToDB(condition: ToothCondition): OdontogramConditionData {
  const sectionId = condition.sectionId || 'general';

  // Determinar si es una superficie anatómica o una sección estructural
  let surfaceCode: string | undefined;
  let surfaceSection: string | undefined;
  let toothSurfaceId: number | undefined;

  if (isSurfaceSection(sectionId)) {
    // Es una superficie anatómica (V, L, M, D, O, I)
    surfaceCode = FRONTEND_TO_DB_SURFACE[sectionId];
    toothSurfaceId = surfaceCode ? SURFACE_CODE_TO_ID[surfaceCode] : undefined;
    surfaceSection = sectionId; // También guardamos el nombre completo
  } else {
    // Es una sección estructural (raiz, corona, cervical, etc.)
    surfaceSection = sectionId;
    // No tiene tooth_surface_id porque no es una superficie anatómica
  }

  return {
    tooth_number: condition.toothNumber,
    tooth_position_id: condition.tooth_position_id,
    tooth_surface_id: toothSurfaceId || condition.tooth_surface_id,
    surface_code: surfaceCode,
    surface_section: surfaceSection,
    // dental_condition_id es la FK al catálogo de condiciones
    dental_condition_id: condition.dental_condition_id,
    condition_name: condition.condition_name || condition.condition,
    price: condition.price || 0,
    notes: condition.notes,
    description: condition.notes,
    // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
    connected_tooth_number: condition.connectedToothNumber
  };
}

export const useOdontogramStore = create<OdontogramStore>()(
  (set, get) => ({
    // Estado inicial
    patientOdontograms: new Map(),
    templates: [
      {
        id: 'default-adult',
        name: 'Adulto Sano',
        description: 'Odontograma de adulto con todos los dientes sanos',
        conditions: [],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'default-child',
        name: 'Niño (Dentición Temporal)',
        description: 'Odontograma de dentición temporal (20 dientes)',
        conditions: [],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    currentPatientId: null,
    loadingStates: {},
    currentOdontogramId: null,

    // Implementación de acciones
    setPatientOdontogram: (patientId, conditions) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        newMap.set(patientId, conditions);
        return { patientOdontograms: newMap };
      });
    },

    getPatientOdontogram: (patientId) => {
      const state = get();
      return state.patientOdontograms.get(patientId) || [];
    },

    clearPatientOdontogram: (patientId) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        newMap.delete(patientId);
        return { patientOdontograms: newMap };
      });
    },

    addConditionToPatient: (patientId, condition) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        const existing = newMap.get(patientId) || [];

        // Remover condición existente para el mismo diente/sección
        const filtered = existing.filter(
          c => !(c.toothNumber === condition.toothNumber && c.sectionId === condition.sectionId)
        );

        // Agregar nueva condición
        filtered.push({ ...condition, date: new Date(), patientId });
        newMap.set(patientId, filtered);

        return { patientOdontograms: newMap };
      });
    },

    removeConditionFromPatient: (patientId, toothNumber, sectionId) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        const existing = newMap.get(patientId) || [];

        const filtered = existing.filter(
          c => !(c.toothNumber === toothNumber && c.sectionId === sectionId)
        );

        newMap.set(patientId, filtered);
        return { patientOdontograms: newMap };
      });
    },

    updateConditionPrice: (patientId, toothNumber, sectionId, price) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        const existing = newMap.get(patientId) || [];

        const updated = existing.map(condition => {
          if (condition.toothNumber === toothNumber && condition.sectionId === sectionId) {
            return { ...condition, price };
          }
          return condition;
        });

        newMap.set(patientId, updated);
        return { patientOdontograms: newMap };
      });
    },

    createTemplate: (template) => {
      set((state) => ({
        templates: [
          ...state.templates,
          {
            ...template,
            id: `template-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }));
    },

    updateTemplate: (id, updates) => {
      set((state) => ({
        templates: state.templates.map(t =>
          t.id === id
            ? { ...t, ...updates, updatedAt: new Date() }
            : t
        )
      }));
    },

    deleteTemplate: (id) => {
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id && !t.isDefault)
      }));
    },

    applyTemplateToPatient: (templateId, patientId) => {
      const state = get();
      const template = state.templates.find(t => t.id === templateId);

      if (template) {
        const conditions = template.conditions.map(c => ({
          ...c,
          patientId,
          date: new Date()
        }));

        state.setPatientOdontogram(patientId, conditions);
      }
    },

    setCurrentPatient: (patientId) => {
      set({ currentPatientId: patientId });
    },

    exportOdontogram: (patientId) => {
      const state = get();
      const conditions = state.patientOdontograms.get(patientId) || [];
      return JSON.stringify({
        patientId,
        exportDate: new Date().toISOString(),
        conditions,
        version: '1.0'
      });
    },

    importOdontogram: (patientId, data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.conditions && Array.isArray(parsed.conditions)) {
          const state = get();
          state.setPatientOdontogram(patientId, parsed.conditions);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    getPatientStatistics: (patientId) => {
      const state = get();
      const conditions = state.patientOdontograms.get(patientId) || [];

      const stats = {
        totalTeeth: 32, // Adulto por defecto
        healthyTeeth: 32,
        treatedTeeth: 0,
        missingTeeth: 0,
        conditionsSummary: new Map<string, number>()
      };

      // Contar dientes únicos con condiciones
      const affectedTeeth = new Set<string>();
      const missingTeeth = new Set<string>();

      conditions.forEach(condition => {
        affectedTeeth.add(condition.toothNumber);

        // Actualizar resumen de condiciones
        const count = stats.conditionsSummary.get(condition.condition) || 0;
        stats.conditionsSummary.set(condition.condition, count + 1);

        // Contar dientes ausentes
        if (condition.condition === 'missing') {
          missingTeeth.add(condition.toothNumber);
        }
      });

      stats.treatedTeeth = affectedTeeth.size - missingTeeth.size;
      stats.missingTeeth = missingTeeth.size;
      stats.healthyTeeth = stats.totalTeeth - affectedTeeth.size;

      return stats;
    },

    // Implementación de métodos para flujo de tratamiento
    initializeTreatmentOdontogram: (patientId, diagnosticConditions) => {
      // Inicializar condiciones de tratamiento basadas en el diagnóstico
      const treatmentConditions = diagnosticConditions.map(condition => ({
        ...condition,
        initialState: condition.color === 'red' ? 'bad' as const : 'good' as const,
        finalState: condition.color === 'red' ? 'bad' as const : 'good' as const,
        treatmentCompleted: false
      }));

      // Guardar en el store
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        newMap.set(`${patientId}-treatment`, treatmentConditions);
        return { patientOdontograms: newMap };
      });

      return treatmentConditions;
    },

    updateTreatmentState: (patientId, toothNumber, sectionId, newState) => {
      set((state) => {
        const newMap = new Map(state.patientOdontograms);
        const treatmentKey = `${patientId}-treatment`;
        const conditions = newMap.get(treatmentKey) || [];

        const updatedConditions = conditions.map(condition => {
          if (condition.toothNumber === toothNumber &&
              (condition.sectionId || '') === sectionId) {
            return {
              ...condition,
              finalState: newState,
              color: newState === 'good' ? 'blue' : 'red',
              treatmentCompleted: newState === 'good' && condition.initialState === 'bad'
            };
          }
          return condition;
        });

        newMap.set(treatmentKey, updatedConditions);
        return { patientOdontograms: newMap };
      });
    },

    markTreatmentCompleted: (patientId, toothNumber, sectionId) => {
      const state = get();
      state.updateTreatmentState(patientId, toothNumber, sectionId, 'good');
    },

    getTreatmentProgress: (patientId) => {
      const state = get();
      const treatmentKey = `${patientId}-treatment`;
      const conditions = state.patientOdontograms.get(treatmentKey) || [];

      const patologies = conditions.filter(c => c.initialState === 'bad');
      const treatedPatologies = patologies.filter(c => c.treatmentCompleted === true);

      return {
        totalPatologies: patologies.length,
        treatedPatologies: treatedPatologies.length,
        progressPercentage: patologies.length > 0
          ? Math.round((treatedPatologies.length / patologies.length) * 100)
          : 100
      };
    },

    // ============================================================
    // NUEVOS MÉTODOS PARA INTEGRACIÓN CON BASE DE DATOS
    // ============================================================

    setCurrentOdontogramId: (id) => {
      set({ currentOdontogramId: id });
    },

    isLoading: (patientId) => {
      const state = get();
      return state.loadingStates[patientId] || false;
    },

    /**
     * Carga el odontograma actual de un paciente desde la BD
     * y lo almacena en el store local
     */
    loadPatientOdontogramFromDB: async (patientId: number) => {
      const patientIdStr = patientId.toString();

      // Marcar como cargando
      set((state) => ({
        loadingStates: { ...state.loadingStates, [patientIdStr]: true }
      }));

      try {
        logger.info(`[OdontogramStore] Cargando odontograma del paciente ${patientId} desde BD...`);

        const odontogramData = await odontogramsApi.getCurrentPatientOdontogram(patientId);

        if (odontogramData && odontogramData.conditions) {
          // Guardar el ID del odontograma
          set({ currentOdontogramId: odontogramData.odontogram_id || null });

          // Convertir condiciones del formato BD al formato frontend
          const conditions: ToothCondition[] = odontogramData.conditions.map(
            (dbCond: OdontogramConditionData) => convertDBConditionToFrontend(dbCond, patientIdStr)
          );

          // Guardar en el store
          set((state) => {
            const newMap = new Map(state.patientOdontograms);
            newMap.set(patientIdStr, conditions);
            return {
              patientOdontograms: newMap,
              loadingStates: { ...state.loadingStates, [patientIdStr]: false }
            };
          });

          logger.info(`[OdontogramStore] ✅ Cargadas ${conditions.length} condiciones desde BD`);
          return conditions;
        } else {
          // No hay odontograma para este paciente, inicializar vacío
          logger.info(`[OdontogramStore] No existe odontograma para paciente ${patientId}, inicializando vacío`);

          set((state) => {
            const newMap = new Map(state.patientOdontograms);
            newMap.set(patientIdStr, []);
            return {
              patientOdontograms: newMap,
              currentOdontogramId: null,
              loadingStates: { ...state.loadingStates, [patientIdStr]: false }
            };
          });

          return [];
        }
      } catch (error) {
        logger.error('[OdontogramStore] Error al cargar odontograma desde BD:', error);

        set((state) => ({
          loadingStates: { ...state.loadingStates, [patientIdStr]: false }
        }));

        throw error;
      }
    },

    /**
     * Guarda el odontograma del paciente actual en la BD
     */
    savePatientOdontogramToDB: async (
      patientId: number,
      dentistId: number,
      branchId: number,
      appointmentId?: number,
      consultationId?: number
    ) => {
      const patientIdStr = patientId.toString();
      const state = get();
      const conditions = state.patientOdontograms.get(patientIdStr) || [];

      try {
        logger.info(`[OdontogramStore] Guardando ${conditions.length} condiciones en BD para paciente ${patientId}...`);

        // Convertir condiciones al formato del backend
        const dbConditions = conditions.map(convertFrontendConditionToDB);

        // Usar upsert para crear o actualizar el odontograma
        const result = await odontogramsApi.upsertPatientOdontogram(patientId, {
          dentist_id: dentistId,
          branch_id: branchId,
          appointment_id: appointmentId,
          consultation_id: consultationId,
          conditions: dbConditions
        });

        // Actualizar el ID del odontograma en el store
        if (result && result.odontogram_id) {
          set({ currentOdontogramId: result.odontogram_id });
        }

        logger.info(`[OdontogramStore] ✅ Odontograma guardado exitosamente en BD`);
      } catch (error) {
        logger.error('[OdontogramStore] Error al guardar odontograma en BD:', error);
        throw error;
      }
    }
  })
);

export default useOdontogramStore;
