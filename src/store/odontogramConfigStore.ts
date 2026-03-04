import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OFFICIAL_COLORS } from '@/constants/dentalConditions';
import catalogsApi, { DentalConditionData, ConditionProcedureData } from '@/services/api/catalogsApi';

export interface PaymentPlanSettings {
  enabled: boolean; // ¿Permite plan de pago?
  allowMonthly: boolean; // Permite pago mensual
  allowInstallments: boolean; // Permite pago por cuotas
  allowSingle: boolean; // Permite pago único

  // Configuración para pago mensual
  monthlyConfig?: {
    minMonths: number; // Mínimo de meses (ej: 3)
    maxMonths: number; // Máximo de meses (ej: 24)
    interestRate: number; // Tasa de interés mensual (%)
    defaultMonths: number; // Duración por defecto
  };

  // Configuración para cuotas
  installmentsConfig?: {
    minInstallments: number; // Mínimo de cuotas (ej: 2)
    maxInstallments: number; // Máximo de cuotas (ej: 12)
    allowFlexibleAmounts: boolean; // ¿Permite montos diferentes por cuota?
    defaultInstallments: number; // Número de cuotas por defecto
  };

  // Configuración para pago único
  singlePaymentConfig?: {
    discountPercentage: number; // Descuento por pago único (%)
    earlyPaymentBonus: number; // Bonificación adicional (%)
  };

  // Configuración general
  requireDownPayment: boolean; // ¿Requiere anticipo?
  defaultDownPaymentPercentage: number; // Porcentaje de anticipo por defecto (%)
  minDownPaymentPercentage: number; // Porcentaje mínimo de anticipo (%)
}

export interface DentalCondition {
  id: string;
  label: string;
  code?: string;
  color: string;
  category: string;
  active: boolean;
  description?: string;
  procedureCode?: string;
  transparency?: number;
  icon?: string;
  applicableSections?: string[];
  // NOTA: Los precios NO se guardan en diagnosis_options (solo diagnósticos)
  // Los precios están en dental_procedures y se usan en treatment_plans/budgets
  treatmentPlanNames?: string[]; // Nombres de planes de tratamiento configurables
  paymentPlanSettings?: PaymentPlanSettings; // Configuración de planes de pago
  // Nuevos campos de la BD
  condition_id?: number;
  condition_code?: string;
  cie10_code?: string;
  abbreviations?: Record<string, string>;
  specifications?: string;
  // Precios - Columnas separadas en BD
  price_base?: number;
  price_state_good?: number;
  price_state_bad?: number;
  // Campos legacy
  default_price?: number;
  prices?: Record<string, number>;
  symbol_type?: string;
  color_type?: string;
  fill_surfaces?: boolean;
  between_teeth?: boolean;
  color_conditional?: Record<string, string>;
  // Procedimientos asociados a esta condición
  procedures?: ConditionProcedureData[];
}

export interface ToothSection {
  id: string;
  label: string;
  active: boolean;
  visible: boolean;
}

// Posición dental (desde tabla tooth_positions)
export interface ToothPositionDB {
  tooth_position_id: number;
  tooth_number: string;
  tooth_name: string;
  quadrant: number;
  tooth_type: string;
  is_adult: boolean;
  status: string;
}

// Superficie dental (desde tabla tooth_surfaces)
export interface ToothSurfaceDB {
  tooth_surface_id: number;
  surface_code: string;
  surface_name: string;
  description: string;
  status: string;
}

export interface NotationSystem {
  id: 'FDI' | 'Universal' | 'Palmer';
  name: string;
  active: boolean;
}

export interface DentitionType {
  id: 'adult' | 'child' | 'mixed';
  name: string;
  toothCount: number;
  description: string;
  active: boolean;
}

export interface ChartingMode {
  id: string;
  name: string;
  description: string;
  active: boolean;
  features: string[];
}

export interface OdontogramConfig {
  // Condiciones dentales
  dentalConditions: DentalCondition[];
  customConditions: DentalCondition[];

  // Posiciones y superficies dentales (desde BD)
  toothPositions: ToothPositionDB[];
  toothSurfaces: ToothSurfaceDB[];

  // Secciones del diente
  toothSections: ToothSection[];
  
  // Sistemas de numeración
  notationSystems: NotationSystem[];
  activeNotation: 'FDI' | 'Universal' | 'Palmer';
  
  // Tipos de dentición
  dentitionTypes: DentitionType[];
  defaultDentition: 'adult' | 'child' | 'mixed';
  
  // Modos de charteo
  chartingModes: ChartingMode[];
  
  // Configuraciones visuales
  visualSettings: {
    showToothNumbers: boolean;
    showToothNames: boolean;
    showRoots: boolean;
    enableAnimations: boolean;
    enableTransparency: boolean;
    highlightHover: boolean;
    showLegend: boolean;
    showHistory: boolean;
    gridView: boolean;
  };
  
  // Configuraciones clínicas
  clinicalSettings: {
    autoSave: boolean;
    requireNotes: boolean;
    allowMultipleConditions: boolean;
    trackHistory: boolean;
    enableOrthoCharting: boolean;
    enablePerioCharting: boolean;
    enableEndoCharting: boolean;
    showUneruptedTeeth: boolean;
    showMissingTeeth: boolean;
  };
  
  // Permisos por rol
  permissions: {
    [role: string]: {
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canExport: boolean;
      canConfigure: boolean;
    };
  };

  // Configuración de planes de pago por categoría
  paymentPlansConfig: {
    ortodoncia: CategoryPaymentConfig;
    protesis: CategoryPaymentConfig;
    implantes: CategoryPaymentConfig;
  };
}

// Configuración de pago por categoría (Ortodoncia, Prótesis, Implantes)
export interface CategoryPaymentConfig {
  basePrice: number; // Precio base del servicio
  paymentMode: 'plans' | 'account'; // Modalidad de pago

  // Pago inicial
  pagoInicial: {
    enabled: boolean;
    porcentaje: number; // Porcentaje del total (0-100)
  };

  // Pago mensual
  pagoMensual: {
    enabled: boolean;
    maximoMeses: number; // Máximo de meses permitido
    precioMensualFijo: number; // Precio fijo mensual (en soles)
  };

  // Pago fraccionado
  pagoFraccionado: {
    enabled: boolean;
    numeroCuotas: number; // Número de cuotas
    precioPorCuota: number; // Precio fijo por cuota (en soles)
  };

  // Datos personalizados para las tablas editables
  customData?: any;
}

interface OdontogramConfigStore extends OdontogramConfig {
  // Estado de carga
  isLoadingConditions: boolean;
  conditionsLoaded: boolean;

  // Acciones para condiciones
  addCondition: (condition: DentalCondition) => void;
  updateCondition: (id: string, updates: Partial<DentalCondition>) => void;
  removeCondition: (id: string) => void;
  toggleCondition: (id: string) => void;
  importConditions: (conditions: DentalCondition[]) => void;
  loadCatalogsFromDB: () => Promise<void>; // Nueva acción para cargar desde BD

  // Acciones para secciones
  toggleSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<ToothSection>) => void;

  // Acciones para sistemas de notación
  setActiveNotation: (system: 'FDI' | 'Universal' | 'Palmer') => void;

  // Acciones para dentición
  setDefaultDentition: (type: 'adult' | 'child' | 'mixed') => void;

  // Acciones para configuraciones visuales
  updateVisualSettings: (settings: Partial<OdontogramConfig['visualSettings']>) => void;

  // Acciones para configuraciones clínicas
  updateClinicalSettings: (settings: Partial<OdontogramConfig['clinicalSettings']>) => void;

  // Acciones para permisos
  updatePermissions: (role: string, permissions: Partial<OdontogramConfig['permissions'][string]>) => void;

  // Acciones para configuración de planes de pago
  updatePaymentPlanConfig: (category: 'ortodoncia' | 'protesis' | 'implantes', config: Partial<CategoryPaymentConfig>) => void;

  // Acciones generales
  exportConfig: () => string;
  importConfig: (configJson: string) => boolean;
  resetToDefaults: () => void;
  saveConfig: () => void;
}

// Mapeo de categorías oficiales a categorías del store
const categoryMap: Record<string, string> = {
  'patologia': 'Patología',
  'tratamiento': 'Tratamiento',
  'protesis': 'Prótesis',
  'anomalia': 'Anomalía',
  'ortodoncia': 'Ortodoncia'
};

// Las condiciones dentales ahora se cargan desde la base de datos
// mediante loadCatalogsFromDB() al iniciar la aplicación
const defaultDentalConditions: DentalCondition[] = [];

const defaultToothSections: ToothSection[] = [
  { id: 'mesial', label: 'Mesial', active: true, visible: true },
  { id: 'distal', label: 'Distal', active: true, visible: true },
  { id: 'oclusal', label: 'Oclusal/Incisal', active: true, visible: true },
  { id: 'vestibular', label: 'Vestibular', active: true, visible: true },
  { id: 'palatino', label: 'Palatino/Lingual', active: true, visible: true },
  { id: 'raiz', label: 'Raíz', active: true, visible: true },
  { id: 'cervical', label: 'Cervical', active: false, visible: false }
];

const useOdontogramConfigStore = create<OdontogramConfigStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isLoadingConditions: false,
      conditionsLoaded: false,
      dentalConditions: defaultDentalConditions,
      customConditions: [],
      toothPositions: [],
      toothSurfaces: [],
      toothSections: defaultToothSections,
      notationSystems: [
        { id: 'FDI', name: 'FDI (Internacional)', active: true },
        { id: 'Universal', name: 'Universal (USA)', active: false },
        { id: 'Palmer', name: 'Palmer', active: false }
      ],
      activeNotation: 'FDI',
      dentitionTypes: [
        { id: 'adult', name: 'Adulto', toothCount: 32, description: 'Dentición permanente completa', active: true },
        { id: 'child', name: 'Infantil', toothCount: 20, description: 'Dentición temporal', active: true },
        { id: 'mixed', name: 'Mixta', toothCount: 0, description: 'Transición dental', active: true }
      ],
      defaultDentition: 'adult',
      chartingModes: [
        { 
          id: 'standard', 
          name: 'Estándar', 
          description: 'Charteo dental básico',
          active: true,
          features: ['conditions', 'notes']
        },
        { 
          id: 'ortho', 
          name: 'Ortodoncia', 
          description: 'Charteo especializado en ortodoncia',
          active: false,
          features: ['brackets', 'wires', 'elastics', 'measurements']
        },
        { 
          id: 'perio', 
          name: 'Periodoncia', 
          description: 'Charteo periodontal completo',
          active: false,
          features: ['pockets', 'bleeding', 'mobility', 'furcation']
        },
        { 
          id: 'endo', 
          name: 'Endodoncia', 
          description: 'Charteo endodóntico',
          active: false,
          features: ['canals', 'apex', 'obturation']
        }
      ],
      visualSettings: {
        showToothNumbers: true,
        showToothNames: false,
        showRoots: true,
        enableAnimations: true,
        enableTransparency: true,
        highlightHover: true,
        showLegend: true,
        showHistory: true,
        gridView: false
      },
      clinicalSettings: {
        autoSave: true,
        requireNotes: false,
        allowMultipleConditions: true,
        trackHistory: true,
        enableOrthoCharting: false,
        enablePerioCharting: false,
        enableEndoCharting: false,
        showUneruptedTeeth: true,
        showMissingTeeth: true
      },
      permissions: {
        admin: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          canConfigure: true
        },
        doctor: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canExport: true,
          canConfigure: false
        },
        assistant: {
          canView: true,
          canCreate: false,
          canEdit: true,
          canDelete: false,
          canExport: false,
          canConfigure: false
        },
        receptionist: {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          canConfigure: false
        },
        patient: {
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          canConfigure: false
        }
      },

      // Configuración de servicios adicionales (simplificado)
      paymentPlansConfig: {
        ortodoncia: {
          basePrice: 5000, // Precio base del servicio
          paymentMode: 'plans' as 'plans' | 'account', // 'plans' = Planes de pago, 'account' = Pago a cuenta
          pagoInicial: {
            enabled: true,
            porcentaje: 30
          },
          pagoMensual: {
            enabled: true,
            maximoMeses: 18,
            precioMensualFijo: 350 // Precio fijo mensual en soles
          },
          pagoFraccionado: {
            enabled: true,
            numeroCuotas: 3,
            precioPorCuota: 1700 // Precio por cuota en soles
          }
        },
        protesis: {
          basePrice: 3500,
          paymentMode: 'account' as 'plans' | 'account',
          pagoInicial: {
            enabled: true,
            porcentaje: 40
          },
          pagoMensual: {
            enabled: true,
            maximoMeses: 12,
            precioMensualFijo: 400
          },
          pagoFraccionado: {
            enabled: true,
            numeroCuotas: 4,
            precioPorCuota: 900
          }
        },
        implantes: {
          basePrice: 8000,
          paymentMode: 'account' as 'plans' | 'account',
          pagoInicial: {
            enabled: true,
            porcentaje: 50
          },
          pagoMensual: {
            enabled: true,
            maximoMeses: 24,
            precioMensualFijo: 500
          },
          pagoFraccionado: {
            enabled: true,
            numeroCuotas: 6,
            precioPorCuota: 1400
          }
        }
      },

      // Acciones
      addCondition: (condition) => set((state) => ({
        customConditions: [...state.customConditions, condition]
      })),

      updateCondition: (id, updates) => set((state) => ({
        dentalConditions: state.dentalConditions.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
        customConditions: state.customConditions.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      removeCondition: (id) => set((state) => ({
        customConditions: state.customConditions.filter(c => c.id !== id),
        dentalConditions: state.dentalConditions.filter(c => c.id !== id)
      })),

      toggleCondition: (id) => set((state) => ({
        dentalConditions: state.dentalConditions.map(c => 
          c.id === id ? { ...c, active: !c.active } : c
        ),
        customConditions: state.customConditions.map(c => 
          c.id === id ? { ...c, active: !c.active } : c
        )
      })),

      importConditions: (conditions) => set(() => ({
        dentalConditions: conditions
      })),

      loadCatalogsFromDB: async () => {
        // Marcar que estamos cargando
        set({ isLoadingConditions: true, conditionsLoaded: false });

        try {
          // 1. Cargar condiciones dentales, posiciones y superficies en paralelo
          const [conditionsResponse, positionsResponse, surfacesResponse] = await Promise.all([
            catalogsApi.getDentalConditions(),
            catalogsApi.getToothPositions(),
            catalogsApi.getToothSurfaces()
          ]);

          // Procesar posiciones dentales
          let toothPositionsData: ToothPositionDB[] = [];
          if (positionsResponse?.success && positionsResponse?.data) {
            toothPositionsData = positionsResponse.data.map((pos: any) => ({
              tooth_position_id: pos.id || pos.tooth_position_id,
              tooth_number: pos.tooth_number || pos.code || '',
              tooth_name: pos.tooth_name || pos.name || '',
              quadrant: pos.quadrant || 0,
              tooth_type: pos.tooth_type || '',
              is_adult: pos.is_adult ?? true,
              status: pos.status || 'active'
            }));
          }

          // Procesar superficies dentales
          let toothSurfacesData: ToothSurfaceDB[] = [];
          if (surfacesResponse?.success && surfacesResponse?.data) {
            toothSurfacesData = surfacesResponse.data.map((surf: any) => ({
              tooth_surface_id: surf.id || surf.tooth_surface_id,
              surface_code: surf.surface_code || surf.code || '',
              surface_name: surf.surface_name || surf.name || '',
              description: surf.description || '',
              status: surf.status || 'active'
            }));
          }

          if (!conditionsResponse?.success || !conditionsResponse?.data) {
            // Aun sin condiciones, guardar posiciones y superficies
            set({
              isLoadingConditions: false,
              toothPositions: toothPositionsData,
              toothSurfaces: toothSurfacesData
            });
            return;
          }

          const dbConditions: DentalConditionData[] = conditionsResponse.data;

          // 2. Convertir condiciones de BD al formato del store
          const convertedConditions: DentalCondition[] = await Promise.all(
            dbConditions.map(async (dbCondition) => {
              // Cargar procedimientos asociados a esta condición
              let procedures: ConditionProcedureData[] = [];
              if (dbCondition.condition_id) {
                try {
                  const proceduresResponse = await catalogsApi.getConditionProcedures(dbCondition.condition_id);
                  if (proceduresResponse?.success && proceduresResponse?.data) {
                    procedures = proceduresResponse.data;
                  }
                } catch (error) {
                  console.warn(`⚠️  Error al cargar procedimientos para condición ${dbCondition.condition_code}:`, error);
                }
              }

              // Determinar el color según color_type y color_conditional
              let displayColor = OFFICIAL_COLORS.blue; // Color por defecto
              if (dbCondition.color_type === 'red') {
                displayColor = OFFICIAL_COLORS.red;
              } else if (dbCondition.color_type === 'blue') {
                displayColor = OFFICIAL_COLORS.blue;
              } else if (dbCondition.color_conditional) {
                // Si tiene color condicional, usar el color de buen estado por defecto
                displayColor = dbCondition.color_conditional.goodState === 'blue'
                  ? OFFICIAL_COLORS.blue
                  : OFFICIAL_COLORS.red;
              }

              return {
                // Identificadores
                id: dbCondition.condition_code,
                condition_id: dbCondition.condition_id,

                // Información básica (camelCase para compatibilidad con componentes)
                label: dbCondition.condition_name,
                code: dbCondition.abbreviation || undefined,
                abbreviation: dbCondition.abbreviation || undefined,
                abbreviations: dbCondition.abbreviations as Record<string, string> | undefined,
                category: categoryMap[dbCondition.category] || dbCondition.category,
                description: dbCondition.description || undefined,
                specifications: dbCondition.specifications || undefined,
                cie10: dbCondition.cie10_code || undefined,
                active: dbCondition.status === 'active',

                // Configuración visual
                symbolType: dbCondition.symbol_type as any,
                color: dbCondition.color_type as 'blue' | 'red',
                colorConditional: dbCondition.color_conditional as any,
                fillSurfaces: dbCondition.fill_surfaces || false,
                betweenTeeth: dbCondition.between_teeth || false,

                // Precios - Nueva estructura con columnas separadas
                price_base: dbCondition.price_base ? Number(dbCondition.price_base) : undefined,
                price_state_good: dbCondition.price_state_good ? Number(dbCondition.price_state_good) : undefined,
                price_state_bad: dbCondition.price_state_bad ? Number(dbCondition.price_state_bad) : undefined,

                // Procedimientos
                treatmentPlanNames: procedures.map(p => p.procedure_name),
                procedures: procedures
              };
            })
          );

          // 3. Actualizar el store con las condiciones, posiciones y superficies desde la BD
          set(() => ({
            dentalConditions: convertedConditions,
            toothPositions: toothPositionsData,
            toothSurfaces: toothSurfacesData,
            isLoadingConditions: false,
            conditionsLoaded: true
          }));

        } catch (error) {
          // En caso de error, mantener las condiciones por defecto del frontend
          set({ isLoadingConditions: false, conditionsLoaded: true });
        }
      },

      toggleSection: (id) => set((state) => ({
        toothSections: state.toothSections.map(s => 
          s.id === id ? { ...s, active: !s.active } : s
        )
      })),

      updateSection: (id, updates) => set((state) => ({
        toothSections: state.toothSections.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      })),

      setActiveNotation: (system) => set(() => ({
        activeNotation: system,
        notationSystems: get().notationSystems.map(n => ({
          ...n,
          active: n.id === system
        }))
      })),

      setDefaultDentition: (type) => set(() => ({
        defaultDentition: type
      })),

      updateVisualSettings: (settings) => set((state) => ({
        visualSettings: { ...state.visualSettings, ...settings }
      })),

      updateClinicalSettings: (settings) => set((state) => ({
        clinicalSettings: { ...state.clinicalSettings, ...settings }
      })),

      updatePermissions: (role, permissions) => set((state) => ({
        permissions: {
          ...state.permissions,
          [role]: { ...state.permissions[role], ...permissions }
        }
      })),

      updatePaymentPlanConfig: (category, config) => set((state) => ({
        paymentPlansConfig: {
          ...state.paymentPlansConfig,
          [category]: {
            ...state.paymentPlansConfig[category],
            ...config,
            pagoInicial: config.pagoInicial
              ? { ...state.paymentPlansConfig[category].pagoInicial, ...config.pagoInicial }
              : state.paymentPlansConfig[category].pagoInicial,
            pagoMensual: config.pagoMensual
              ? { ...state.paymentPlansConfig[category].pagoMensual, ...config.pagoMensual }
              : state.paymentPlansConfig[category].pagoMensual,
            pagoFraccionado: config.pagoFraccionado
              ? { ...state.paymentPlansConfig[category].pagoFraccionado, ...config.pagoFraccionado }
              : state.paymentPlansConfig[category].pagoFraccionado
          }
        }
      })),

      exportConfig: () => {
        const state = get();
        const config = {
          dentalConditions: state.dentalConditions,
          customConditions: state.customConditions,
          toothSections: state.toothSections,
          notationSystems: state.notationSystems,
          activeNotation: state.activeNotation,
          dentitionTypes: state.dentitionTypes,
          defaultDentition: state.defaultDentition,
          chartingModes: state.chartingModes,
          visualSettings: state.visualSettings,
          clinicalSettings: state.clinicalSettings,
          permissions: state.permissions,
          version: '2.0.0',
          exportDate: new Date().toISOString()
        };
        return JSON.stringify(config, null, 2);
      },

      importConfig: (configJson) => {
        try {
          const config = JSON.parse(configJson);
          set({
            dentalConditions: config.dentalConditions || defaultDentalConditions,
            customConditions: config.customConditions || [],
            toothSections: config.toothSections || defaultToothSections,
            notationSystems: config.notationSystems || get().notationSystems,
            activeNotation: config.activeNotation || 'FDI',
            dentitionTypes: config.dentitionTypes || get().dentitionTypes,
            defaultDentition: config.defaultDentition || 'adult',
            chartingModes: config.chartingModes || get().chartingModes,
            visualSettings: config.visualSettings || get().visualSettings,
            clinicalSettings: config.clinicalSettings || get().clinicalSettings,
            permissions: config.permissions || get().permissions
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      resetToDefaults: () => set({
        dentalConditions: defaultDentalConditions,
        customConditions: [],
        toothSections: defaultToothSections,
        activeNotation: 'FDI',
        defaultDentition: 'adult',
        visualSettings: {
          showToothNumbers: true,
          showToothNames: false,
          showRoots: true,
          enableAnimations: true,
          enableTransparency: true,
          highlightHover: true,
          showLegend: true,
          showHistory: true,
          gridView: false
        },
        clinicalSettings: {
          autoSave: true,
          requireNotes: false,
          allowMultipleConditions: true,
          trackHistory: true,
          enableOrthoCharting: false,
          enablePerioCharting: false,
          enableEndoCharting: false,
          showUneruptedTeeth: true,
          showMissingTeeth: true
        }
      }),

      saveConfig: () => {
        // Esta función simularía guardar en el backend
      }
    }),
    {
      name: 'odontogram-config',
      version: 5, // Incrementado para forzar recarga con procedimientos
      migrate: (persistedState: any, version: number) => {
        // Forzar recarga desde BD si las condiciones no tienen procedimientos
        if (persistedState && persistedState.dentalConditions) {
          const hasConditionsWithProcedures = persistedState.dentalConditions.some(
            (c: any) => c.procedures && c.procedures.length > 0
          );
          // Si no hay condiciones con procedimientos, limpiar para forzar recarga desde BD
          if (!hasConditionsWithProcedures) {
            persistedState.dentalConditions = [];
            persistedState.conditionsLoaded = false;
          }
        }
        return persistedState;
      }
    }
  )
);

export default useOdontogramConfigStore;