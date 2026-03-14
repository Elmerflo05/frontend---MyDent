/**
 * Step 6: Diagnóstico Definitivo
 *
 * DISEÑO DE 2 COLUMNAS:
 * - Columna 1 (Izquierda): Diagnóstico Presuntivo (SOLO LECTURA)
 *   Jala datos del odontograma + diagnóstico presuntivo
 * - Columna 2 (Derecha): Diagnóstico Definitivo (EDITABLE)
 *   Inicialmente copia columna 1, pero el doctor puede modificar
 *
 * El doctor puede:
 * ✏️ Modificar condiciones existentes
 * ➕ Agregar nuevas condiciones
 * 🗑️ Eliminar condiciones
 * 💰 Ajustar precios
 */

import { motion } from 'framer-motion';
import {
  CheckCircle,
  User,
  FileText,
  Plus,
  DollarSign,
  ArrowRight,
  Copy,
  Info,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react';
import { formatDateToYMD } from '@/utils/dateUtils';
import { StepHeader, StepNavigationButtons, SectionCard } from '@/components/consultation/shared';
import {
  calculateTotalPrice,
  createInitialDefinitiveConditions,
  generateConditionId,
  PresumptiveConditionsList,
  ConditionFormFields,
  DefinitiveConditionCard,
  DeleteConditionModal,
  CopyFromPresumptiveModal,
  DiagnosisSummaryTextarea
} from '@/components/consultation/final-diagnosis';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { getPriceForPlan } from '@/constants/healthPlanCodes';
import {
  getConditionProcedurePriceForPatient,
  clearPricingCache,
  type ResolvedPrice
} from '@/services/pricing/consultationPricingService';
import { consultationsApi, PresumptiveConditionData } from '@/services/api/consultationsApi';
import { evolutionOdontogramApi } from '@/services/api/evolutionOdontogramApi';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { formatCurrency } from '../utils/treatmentPlanHelpers';

interface FinalDiagnosisStepProps {
  selectedPatient: any;
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  getPatientOdontogram: (patientId: string) => any[];
  currentOdontogram?: any[];
  /** Setter para sincronización bidireccional: actualiza el odontograma cuando cambian las condiciones definitivas */
  setCurrentOdontogram?: (data: any[]) => void;
  setUnsavedChanges: (val: boolean) => void;
  readOnly?: boolean;
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

interface DiagnosticCondition {
  id: string;
  toothNumber: string;
  toothPositionId: number;
  toothSurfaceId?: number | null;
  odontogramConditionId?: number | null;
  conditionId: string;
  dentalConditionId?: number | null;
  conditionLabel: string;
  cie10?: string;
  price: number;
  notes?: string;
  surfaces?: string[];
  surfaceCode?: string;
  surfaceName?: string;
  procedures?: ConditionProcedure[];
}

interface ConditionProcedure {
  procedure_id: number;
  procedure_name: string;
  procedure_code?: string;
  price_base?: number;
  estimated_duration?: number;
  requires_anesthesia?: boolean;
  display_order?: number;
}

interface DefinitiveDiagnosticCondition {
  id: string;
  toothNumber: string;
  toothPositionId: number;
  toothSurfaceId?: number | null;
  odontogramConditionId?: number | null;
  surfaces?: string[];
  presumptive: {
    conditionId: string;
    dentalConditionId?: number | null;
    conditionLabel: string;
    cie10?: string;
    price: number;
    notes?: string;
    surfaces?: string[];
    toothSurfaceId?: number | null;
  };
  definitive: {
    conditionId: string;
    dentalConditionId?: number | null;
    conditionLabel: string;
    cie10?: string;
    price: number;
    notes?: string;
    surfaces?: string[];
    procedures?: ConditionProcedure[];
  };
  modified: boolean;
  // Datos adicionales para guardar en BD
  _toothPositionId?: number;
  _dentalConditionId?: number;
  // Datos adicionales del JOIN para mostrar en TreatmentPlanStep
  _conditionName?: string;
  _conditionCategory?: string;
  _conditionCode?: string;
  _surfaceCode?: string;
  _surfaceName?: string;
  _procedures?: ConditionProcedure[];
}

const FinalDiagnosisStepComponent = ({
  selectedPatient,
  currentRecord,
  setCurrentRecord,
  getPatientOdontogram,
  currentOdontogram,
  setCurrentOdontogram,
  setUnsavedChanges,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: FinalDiagnosisStepProps) => {
  // OPTIMIZACIÓN: Debounce para textarea de diagnóstico final
  const debouncedUpdateFinalDiagnosis = useDebouncedCallback((value: string) => {
    setCurrentRecord({ ...currentRecord, finalDiagnosis: value });
    setUnsavedChanges(true);
  }, 300);

  // Obtener condiciones dentales desde el store (base de datos)
  const { dentalConditions, customConditions, toothPositions } = useOdontogramConfigStore();
  // Memoizar para evitar recrear el array en cada render
  const OFFICIAL_DENTAL_CONDITIONS = useMemo(
    () => [...dentalConditions, ...customConditions],
    [dentalConditions, customConditions]
  );

  // Plan de salud del paciente (para calcular precios ajustados - fallback local)
  const patientPlanCode = selectedPatient?.health_plan_code
    || selectedPatient?.healthPlanCode
    || selectedPatient?.health_plan
    || selectedPatient?.healthPlan
    || null;

  // ID numérico del paciente (para API de pricing del backend)
  const numericPatientId = selectedPatient?.patient_id
    || parseInt(selectedPatient?.id)
    || null;

  // Caché local de precios resueltos por API (procedureId → precio)
  const resolvedPricesRef = useRef<Map<number, ResolvedPrice>>(new Map());

  /**
   * Obtener precio de un procedimiento vía API (async, con caché y fallback).
   * Considera: empresa corporativa > plan de salud > precio regular.
   */
  const getResolvedPriceForProcedure = useCallback(async (
    procedureId: number,
    procedureData?: any
  ): Promise<number> => {
    if (!numericPatientId || !procedureId) {
      return getPriceForPlan(procedureData || {}, patientPlanCode);
    }

    // Revisar caché local del ref
    const cached = resolvedPricesRef.current.get(procedureId);
    if (cached) return cached.price;

    try {
      const resolved = await getConditionProcedurePriceForPatient(
        procedureId,
        numericPatientId,
        procedureData
      );
      resolvedPricesRef.current.set(procedureId, resolved);
      return resolved.price;
    } catch {
      return getPriceForPlan(procedureData || {}, patientPlanCode);
    }
  }, [numericPatientId, patientPlanCode]);

  /**
   * Calcula el precio ajustado al plan del paciente (versión SÍNCRONA - fallback).
   * Usado donde no se puede hacer async (renders, initializers).
   * Para flujo async, usar getResolvedPriceForProcedure().
   */
  const getPlanAdjustedPrice = useCallback((officialCondition: any): number => {
    const procedures = officialCondition?.procedures || [];
    if (procedures.length > 0 && procedures[0]?.price_without_plan !== undefined) {
      // Primero revisar si hay precio resuelto por API en caché
      const procId = procedures[0].procedure_id || procedures[0].condition_procedure_id;
      const cached = resolvedPricesRef.current.get(procId);
      if (cached) return cached.price;
      // Fallback local
      return getPriceForPlan(procedures[0], patientPlanCode);
    }
    return Number(officialCondition?.price_base || officialCondition?.default_price || officialCondition?.price || 0);
  }, [patientPlanCode]);

  // Estado: Condiciones presuntivas (columna izquierda, read-only)
  const [presumptiveConditions, setPresumptiveConditions] = useState<DiagnosticCondition[]>([]);

  // Estado: Condiciones definitivas (columna derecha, editable)
  const [definitiveConditions, setDefinitiveConditions] = useState<DefinitiveDiagnosticCondition[]>([]);

  // Estados para persistencia en BD
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dbCheckComplete, setDbCheckComplete] = useState(false); // Para saber si ya se verificó la BD

  // Obtener consultationId del currentRecord (puede estar como consultationId o lastConsultationId)
  const consultationId = currentRecord?.consultationId || currentRecord?.lastConsultationId || currentRecord?.consultation_id;

  // Estado del formulario (agregar/editar)
  const [newToothNumber, setNewToothNumber] = useState<string>('');
  const [newConditionId, setNewConditionId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newSurfaces, setNewSurfaces] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal de eliminación
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: '',
    toothNumber: '',
    conditionLabel: ''
  });

  // Modal de copiar
  const [showCopyModal, setShowCopyModal] = useState(false);

  /**
   * Carga las condiciones definitivas desde la base de datos
   */
  const loadFromDatabase = useCallback(async () => {
    if (!consultationId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await consultationsApi.getDefinitiveDiagnosis(consultationId);

      if (response.success && response.data.conditions.length > 0) {
        // Mapear datos de la API al formato del componente
        // IMPORTANTE: Usar condition_name del JOIN (fuente de verdad desde BD)
        const mappedConditions: DefinitiveDiagnosticCondition[] = response.data.conditions.map((apiCond) => ({
          id: `definitive-${apiCond.definitive_condition_id}`,
          // Normalizar tooth_number: "2.2" -> "22", "1.1" -> "11"
          toothNumber: String(apiCond.tooth_number).replace('.', ''),
          toothPositionId: apiCond.tooth_position_id,
          toothSurfaceId: apiCond.tooth_surface_id || null,
          odontogramConditionId: apiCond.odontogram_condition_id || null,
          // Usar surfaces_array (de la tabla intermedia) si existe, sino surfaces (JSONB legacy)
          surfaces: apiCond.surfaces_array && apiCond.surfaces_array.length > 0
            ? apiCond.surfaces_array
            : (apiCond.surfaces || []),
          presumptive: {
            conditionId: apiCond.condition_code || (apiCond.presumptive_dental_condition_id ? String(apiCond.presumptive_dental_condition_id) : ''),
            dentalConditionId: apiCond.presumptive_dental_condition_id || null,
            conditionLabel: apiCond.is_modified_from_presumptive ? 'Original (modificado)' : apiCond.condition_label,
            cie10: '',
            price: apiCond.presumptive_price || 0,
            notes: apiCond.presumptive_description || '',
            surfaces: [],
            toothSurfaceId: apiCond.presumptive_tooth_surface_id || null
          },
          definitive: {
            conditionId: apiCond.condition_code || String(apiCond.dental_condition_id),
            dentalConditionId: apiCond.dental_condition_id,
            // Priorizar condition_name del JOIN (desde odontogram_dental_conditions)
            conditionLabel: apiCond.condition_name || apiCond.condition_label,
            cie10: apiCond.condition_cie10_code || apiCond.cie10_code || '',
            price: Number(apiCond.price) || 0,
            notes: apiCond.notes || '',
            surfaces: apiCond.surfaces_array && apiCond.surfaces_array.length > 0
              ? apiCond.surfaces_array
              : (apiCond.surfaces || []),
            // Incluir procedimientos desde la API
            procedures: apiCond.procedures || []
          },
          modified: apiCond.is_modified_from_presumptive || false,
          // Datos adicionales para guardar
          _toothPositionId: apiCond.tooth_position_id,
          _dentalConditionId: apiCond.dental_condition_id,
          // Datos adicionales del JOIN para mostrar en TreatmentPlanStep
          _conditionName: apiCond.condition_name,
          _conditionCategory: apiCond.condition_category,
          _conditionCode: apiCond.condition_code,
          _surfaceCode: apiCond.surface_code,
          _surfaceName: apiCond.surface_name,
          _procedures: apiCond.procedures || [],
          // Procedimiento seleccionado (desde BD) - usar ?? para preservar valores 0
          // Si no tiene procedimiento seleccionado, auto-seleccionar el primero registrado
          selected_procedure_id: apiCond.selected_procedure_id ?? ((apiCond.procedures || [])[0]?.procedure_id ?? null),
          selectedProcedureId: apiCond.selected_procedure_id ?? ((apiCond.procedures || [])[0]?.procedure_id ?? null),
          selected_procedure_name: apiCond.selected_procedure_name ?? ((apiCond.procedures || [])[0]?.procedure_name ?? null),
          _selected_procedure_name: apiCond.selected_procedure_name ?? ((apiCond.procedures || [])[0]?.procedure_name ?? null),
          procedure_price: apiCond.procedure_price ?? (() => {
            const fp = (apiCond.procedures || [])[0];
            if (!fp) return null;
            const fpId = fp.procedure_id || fp.condition_procedure_id;
            const cached = fpId ? resolvedPricesRef.current.get(fpId) : null;
            return cached ? cached.price : getPriceForPlan(fp, patientPlanCode);
          })(),
          // ID de la condición en BD (para actualizar procedimientos)
          definitive_condition_id: apiCond.definitive_condition_id,
          definitiveConditionId: apiCond.definitive_condition_id,
          _definitiveConditionId: apiCond.definitive_condition_id
        } as any));

        setDefinitiveConditions(mappedConditions);
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error al cargar diagnostico definitivo:', error);
    } finally {
      setIsLoading(false);
      setDbCheckComplete(true);
    }
  }, [consultationId, patientPlanCode]);

  /**
   * Guarda las condiciones definitivas en la base de datos
   * Ahora incluye las nuevas columnas: odontogram_condition_id, tooth_surface_id
   * Y crea registros en evolution_odontogram con estado 'pending'
   */
  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    if (!consultationId) {
      return false;
    }

    const patientId = selectedPatient?.patient_id || selectedPatient?.id;
    const dentistId = currentRecord?.dentist_id || currentRecord?.dentistId;

    setIsSaving(true);
    try {
      // Mapear condiciones del frontend al formato de la API
      const conditionsToSave = definitiveConditions.map(cond => {
        // Buscar tooth_position_id desde el store si no existe
        let toothPositionId = cond._toothPositionId || cond.toothPositionId;
        if (!toothPositionId) {
          const toothPosition = toothPositions.find(
            tp => tp.tooth_number === cond.toothNumber
          );
          toothPositionId = toothPosition?.tooth_position_id || 1;
        }

        // Buscar dental_condition_id desde el store o usar el existente
        // Prioridad: _dentalConditionId > definitive.dentalConditionId > búsqueda en catálogo
        let dentalConditionId = cond._dentalConditionId || cond.definitive?.dentalConditionId;
        if (!dentalConditionId) {
          // Buscar en el catálogo por múltiples criterios
          const dentalCondition = dentalConditions.find(
            dc => dc.condition_id === Number(cond.definitive?.conditionId) ||
                  (dc as any).condition_code === cond.definitive?.conditionId ||
                  dc.id === cond.definitive?.conditionId
          );
          // Usar condition_id del catálogo. Si no se encuentra, intentar parsear como número.
          // NUNCA usar fallback a 1, ya que guardaría un dental_condition_id incorrecto.
          const parsedId = Number(cond.definitive?.conditionId);
          dentalConditionId = dentalCondition?.condition_id || (Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null);
        }

        // Obtener procedimiento seleccionado con verificación explícita (evitar || que falla con 0)
        const procId = (cond as any).selected_procedure_id ?? (cond as any).selectedProcedureId ?? null;
        const procPrice = (cond as any).procedure_price;
        const finalProcPrice = procPrice !== null && procPrice !== undefined ? procPrice : null;

        return {
          presumptive_condition_id: null,
          odontogram_condition_id: cond.odontogramConditionId || null,
          tooth_position_id: toothPositionId,
          // Normalizar tooth_number: asegurar formato FDI sin punto ("22" no "2.2")
          tooth_number: String(cond.toothNumber).replace('.', ''),
          tooth_surface_id: cond.toothSurfaceId || null,
          dental_condition_id: dentalConditionId,
          condition_label: cond.definitive.conditionLabel,
          cie10_code: cond.definitive.cie10 || null,
          surfaces: cond.surfaces || cond.definitive.surfaces || [],
          price: cond.definitive.price,
          notes: cond.definitive.notes || null,
          is_modified_from_presumptive: cond.modified,
          modification_reason: cond.modified ? 'Modificado por el doctor' : null,
          // Procedimiento seleccionado (preservar al guardar) - usar ?? para preservar 0
          selected_procedure_id: procId,
          procedure_price: finalProcPrice
        };
      });

      const response = await consultationsApi.saveDefinitiveDiagnosisBulk(
        consultationId,
        conditionsToSave
      );

      if (response.success) {
        // CRÍTICO: Recargar datos desde BD para obtener los IDs reales
        // Esto reemplaza los IDs temporales (timestamps) con los IDs de la BD
        // permitiendo que actualizaciones posteriores (procedimientos, etc.) se persistan
        await loadFromDatabase();

        // NUEVO: Crear registros en evolution_odontogram con estado 'pending' (rojo = planificado)
        if (patientId && dentistId) {
          const today = formatDateToYMD(new Date());

          for (const cond of definitiveConditions) {
            const toothPositionId = cond._toothPositionId || cond.toothPositionId;

            if (toothPositionId) {
              try {
                await evolutionOdontogramApi.upsertEvolutionOdontogram({
                  patient_id: typeof patientId === 'string' ? parseInt(patientId) : patientId,
                  consultation_id: consultationId,
                  tooth_position_id: toothPositionId,
                  tooth_surface_id: cond.toothSurfaceId || null,
                  condition_status: 'pending', // Estado inicial: pendiente (rojo)
                  original_condition_id: cond._dentalConditionId || cond.definitive.dentalConditionId || null,
                  original_condition_name: cond.definitive.conditionLabel,
                  registered_by_dentist_id: typeof dentistId === 'string' ? parseInt(dentistId) : dentistId,
                  registered_date: today,
                  clinical_observation: cond.definitive.notes || `Diagnóstico: ${cond.definitive.conditionLabel}`
                });
              } catch (evoError) {
                console.warn('Error al crear registro de evolución:', evoError);
                // Continuar con los demás registros aunque falle uno
              }
            }
          }
        }

        setUnsavedChanges(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al guardar diagnostico definitivo:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [consultationId, definitiveConditions, toothPositions, dentalConditions, setUnsavedChanges, selectedPatient, currentRecord, loadFromDatabase]);

  // Cargar desde BD al montar si hay consultationId (PRIORIDAD: BD primero)
  // IMPORTANTE: Se ejecuta cada vez que consultationId cambia o el componente se monta
  useEffect(() => {
    const loadData = async () => {
      if (consultationId && !isLoading) {
        await loadFromDatabase();
      } else if (!consultationId) {
        setDbCheckComplete(true);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // Ref para guardar la versión anterior de definitiveConditions (para comparación)
  const prevDefinitiveConditionsRef = useRef<string>('');

  // === SINCRONIZACIÓN: Actualizar currentRecord cuando cambian las condiciones definitivas ===
  // Esto asegura que los datos estén disponibles en el paso 8 (TreatmentPlanStep)
  useEffect(() => {
    if (definitiveConditions.length > 0) {
      // Serializar para comparar si realmente cambió
      // IMPORTANTE: Incluir campos de procedimiento para detectar cambios
      const serialized = JSON.stringify(definitiveConditions.map(c => ({
        id: c.id,
        toothNumber: c.toothNumber,
        definitive: c.definitive,
        modified: c.modified,
        // Campos de procedimiento
        selected_procedure_id: (c as any).selected_procedure_id,
        procedure_price: (c as any).procedure_price,
        selected_procedure_name: (c as any).selected_procedure_name
      })));

      // Solo actualizar si realmente cambió el contenido
      if (serialized === prevDefinitiveConditionsRef.current) {
        return;
      }
      prevDefinitiveConditionsRef.current = serialized;

      // Agregar campos adicionales para TreatmentPlanStep
      const enrichedConditions = definitiveConditions.map(cond => {
        // Buscar en el catálogo para obtener más información
        const catalogCondition = OFFICIAL_DENTAL_CONDITIONS.find(
          dc => dc.condition_id === cond._dentalConditionId ||
                dc.condition_id === cond.definitive.dentalConditionId ||
                dc.id === cond.definitive.conditionId
        );

        return {
          ...cond,
          // Asegurar que estos campos estén disponibles para TreatmentPlanStep
          conditionName: cond._conditionName || cond.definitive.conditionLabel || catalogCondition?.label,
          conditionLabel: cond.definitive.conditionLabel,
          price: cond.definitive.price,
          surfaces: cond.surfaces || cond.definitive.surfaces || [],
          procedures: cond._procedures || cond.definitive.procedures || [],
          category: cond._conditionCategory || (catalogCondition as any)?.category || '',
          cie10: cond.definitive.cie10 || (catalogCondition as any)?.cie10_code || '',
          // Asegurar que modified se propague correctamente
          modified: cond.modified,
          // Campos de procedimiento asignado (Paso 6) - usar ?? para preservar valores 0
          selected_procedure_id: (cond as any).selected_procedure_id ?? null,
          selectedProcedureId: (cond as any).selectedProcedureId ?? (cond as any).selected_procedure_id ?? null,
          procedure_price: (cond as any).procedure_price ?? null,
          selected_procedure_name: (cond as any).selected_procedure_name ?? null,
          _selected_procedure_name: (cond as any)._selected_procedure_name ?? (cond as any).selected_procedure_name ?? null
        };
      });

      // Usar función de actualización para evitar dependencia de currentRecord
      setCurrentRecord((prev: any) => ({
        ...prev,
        definitiveConditions: enrichedConditions
      }));
    }
  }, [definitiveConditions, OFFICIAL_DENTAL_CONDITIONS, setCurrentRecord]);

  /**
   * SINCRONIZACIÓN BIDIRECCIONAL: Diagnóstico Definitivo → Odontograma
   * Cuando cambian las condiciones definitivas, actualizar el odontograma
   */
  useEffect(() => {
    // Solo sincronizar si tenemos el setter y hay condiciones
    if (!setCurrentOdontogram || definitiveConditions.length === 0) {
      return;
    }

    // Convertir condiciones definitivas al formato del odontograma
    const odontogramConditions = definitiveConditions.map(cond => {
      // Buscar la condición oficial para obtener más datos
      const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
        dc => dc.condition_id === cond._dentalConditionId ||
              dc.condition_id === cond.definitive.dentalConditionId ||
              dc.id === cond.definitive.conditionId
      );

      // Normalizar el número de diente al formato del odontograma (ej: "11" -> "1.1")
      const toothNumber = cond.toothNumber.length === 2 && !cond.toothNumber.includes('.')
        ? `${cond.toothNumber[0]}.${cond.toothNumber[1]}`
        : cond.toothNumber;

      return {
        toothNumber,
        sectionId: cond.surfaces?.[0] || 'general',
        condition: cond.definitive.conditionId,
        conditionId: cond.definitive.conditionId,
        color: (officialCondition as any)?.color || 'gray',
        notes: cond.definitive.notes || '',
        date: new Date(),
        patientId: selectedPatient?.id,
        price: cond.definitive.price || 0,
        dental_condition_id: cond.definitive.dentalConditionId || cond._dentalConditionId,
        tooth_position_id: cond.toothPositionId || cond._toothPositionId,
        tooth_surface_id: cond.toothSurfaceId,
        condition_name: cond.definitive.conditionLabel,
        surfaces: cond.surfaces || cond.definitive.surfaces || []
      };
    });

    setCurrentOdontogram(odontogramConditions);
  }, [definitiveConditions, OFFICIAL_DENTAL_CONDITIONS, setCurrentOdontogram, selectedPatient?.id]);

  // Resolver precios via API para un array de condiciones con procedimientos
  const resolveApiPrices = useCallback(async (
    conditions: DiagnosticCondition[]
  ): Promise<DiagnosticCondition[]> => {
    if (!numericPatientId) return conditions;

    // Recolectar procedureIds que necesitan resolución
    const toResolve: { index: number; procId: number; procData: any }[] = [];
    conditions.forEach((cond, idx) => {
      const procs = cond.procedures || [];
      if (procs.length > 0) {
        const firstProc = procs[0];
        const procId = (firstProc as any).procedure_id || (firstProc as any).condition_procedure_id;
        if (procId) {
          toResolve.push({ index: idx, procId, procData: firstProc });
        }
      }
    });

    if (toResolve.length === 0) return conditions;

    // Resolver precios en paralelo via API
    const priceResults = await Promise.allSettled(
      toResolve.map(item =>
        getResolvedPriceForProcedure(item.procId, item.procData)
      )
    );

    // Actualizar precios en las condiciones
    const updated = [...conditions];
    priceResults.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        updated[toResolve[i].index] = {
          ...updated[toResolve[i].index],
          price: result.value
        };
      }
    });

    return updated;
  }, [numericPatientId, getResolvedPriceForProcedure]);

  // Cargar SOLO condiciones presuntivas (columna izquierda)
  const loadPresumptiveOnly = useCallback(async () => {
    if (consultationId) {
      try {
        const response = await consultationsApi.getPresumptiveConditions(consultationId);
        if (response.success && response.data.conditions.length > 0) {
          const mappedConditions: DiagnosticCondition[] = response.data.conditions.map((cond: PresumptiveConditionData) => {
            // Determinar superficies:
            // 1. Usar surface_code del JOIN (ej: "C", "D", "M")
            // 2. Si no existe, usar surface_section como valor único (ej: "corona", "distal")
            let surfaces: string[] = [];
            if (cond.surface_code) {
              surfaces = [cond.surface_code];
            } else if (cond.surface_section) {
              // Si contiene coma, es lista separada por comas
              if (cond.surface_section.includes(',')) {
                surfaces = cond.surface_section.split(',').map((s: string) => s.trim());
              } else {
                // Es un valor único, no dividir en caracteres
                surfaces = [cond.surface_section];
              }
            }

            // Precio inicial con fallback local (se resolverá vía API abajo)
            const procs = cond.procedures || [];
            const planAdjustedPrice = (procs.length > 0 && procs[0]?.price_without_plan !== undefined)
              ? getPriceForPlan(procs[0], patientPlanCode)
              : (cond.price || cond.price_base || 0);

            return {
              id: `presumptive-${cond.odontogram_condition_id}`,
              toothNumber: String(cond.tooth_number).replace('.', ''),
              toothPositionId: cond.tooth_position_id,
              toothSurfaceId: cond.tooth_surface_id || null,
              odontogramConditionId: cond.odontogram_condition_id,
              conditionId: cond.condition_code || String(cond.dental_condition_id || ''),
              dentalConditionId: cond.dental_condition_id || null,
              conditionLabel: cond.condition_name || cond.description || 'Condicion desconocida',
              cie10: cond.cie10_code || '',
              price: planAdjustedPrice,
              notes: cond.notes || '',
              surfaces,
              surfaceCode: cond.surface_code,
              surfaceName: cond.surface_name,
              procedures: cond.procedures || []
            };
          });

          // Resolver precios reales vía API (considera empresa corporativa)
          const withApiPrices = await resolveApiPrices(mappedConditions);
          setPresumptiveConditions(withApiPrices);
          return;
        }
      } catch (error) {
        console.error('Error al cargar condiciones presuntivas:', error);
      }
    }

    // Fallback: datos locales del odontograma
    const odontogramConditions = currentOdontogram?.length > 0
      ? currentOdontogram
      : getPatientOdontogram(selectedPatient?.id);

    if (odontogramConditions && odontogramConditions.length > 0) {
      const mappedConditions: DiagnosticCondition[] = odontogramConditions.map((cond: any) => {
        const conditionId = cond.condition || cond.conditionId;
        const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
          (official) => official.id === conditionId
        );
        const normalizedToothNumber = String(cond.toothNumber).replace('.', '');
        const toothPosition = toothPositions.find(
          tp => tp.tooth_number === normalizedToothNumber
        );
        // Precio ajustado al plan del paciente (usa procedimientos si disponibles)
        const officialPrice = getPlanAdjustedPrice(officialCondition);

        return {
          id: `presumptive-${normalizedToothNumber}-${conditionId}`,
          toothNumber: normalizedToothNumber,
          toothPositionId: toothPosition?.tooth_position_id || 1,
          toothSurfaceId: null,
          odontogramConditionId: cond.condition_id || null,
          conditionId: conditionId,
          dentalConditionId: officialCondition?.condition_id || null,
          conditionLabel: officialCondition?.label || 'Condicion desconocida',
          cie10: (officialCondition as any)?.cie10 || (officialCondition as any)?.cie10_code || '',
          price: officialPrice,
          notes: cond.notes || '',
          // Incluir superficies del odontograma
          surfaces: cond.surfaces || cond.selectedSurfaces || cond.affectedSurfaces || [],
          // Incluir procedimientos desde el store (catálogo de condiciones)
          procedures: ((officialCondition as any)?.procedures || []).map((p: any) => ({
            procedure_id: p.procedure_id || p.condition_procedure_id,
            procedure_name: p.procedure_name,
            procedure_code: p.procedure_code,
            price_without_plan: p.price_without_plan,
            price_plan_personal: p.price_plan_personal,
            price_plan_familiar: p.price_plan_familiar,
            price_plan_platinium: p.price_plan_platinium,
            price_plan_oro: p.price_plan_oro,
            applies_to_state: p.applies_to_state,
            display_order: p.display_order
          }))
        };
      });
      // Resolver precios reales vía API (considera empresa corporativa)
      const withApiPrices = await resolveApiPrices(mappedConditions);
      setPresumptiveConditions(withApiPrices);
    }
  }, [consultationId, currentOdontogram, selectedPatient, getPatientOdontogram, OFFICIAL_DENTAL_CONDITIONS, toothPositions, getPlanAdjustedPrice, patientPlanCode, resolveApiPrices]);

  // Cargar condiciones presuntivas SIEMPRE (para mostrar en columna izquierda)
  useEffect(() => {
    if (dbCheckComplete || !consultationId) {
      loadPresumptiveOnly();
    }
  }, [dbCheckComplete, consultationId, loadPresumptiveOnly]);

  // Cargar condiciones DEFINITIVAS del odontograma SOLO si no hay datos en BD
  // IMPORTANTE: Solo ejecutar cuando la verificación de BD está completa Y no hay datos guardados
  useEffect(() => {
    // CONDICIÓN MÁS ESTRICTA:
    // - dbCheckComplete debe ser true (ya verificamos BD)
    // - NO debe estar cargando
    // - dataLoaded debe ser false (no hay datos de BD)
    // - No hay condiciones definitivas locales
    // - Hay condiciones presuntivas disponibles
    if (dbCheckComplete && !isLoading && !dataLoaded && definitiveConditions.length === 0 && presumptiveConditions.length > 0) {
      const initialDefinitiveConditions = createInitialDefinitiveConditionsFromAPI(presumptiveConditions);
      setDefinitiveConditions(initialDefinitiveConditions);
    }
  }, [dbCheckComplete, consultationId, dataLoaded, isLoading, definitiveConditions.length, presumptiveConditions]);

  // Cargar condiciones desde el odontograma usando la nueva API (legacy - mantener por compatibilidad)
  const loadOdontogramConditions = useCallback(async () => {
    // Intentar cargar desde la API primero (fuente de verdad: BD)
    if (consultationId) {
      try {
        const response = await consultationsApi.getPresumptiveConditions(consultationId);
        if (response.success && response.data.conditions.length > 0) {
          const mappedConditions: DiagnosticCondition[] = response.data.conditions.map((cond: PresumptiveConditionData) => {
            // Determinar superficies:
            // 1. Usar surface_code del JOIN (ej: "C", "D", "M")
            // 2. Si no existe, usar surface_section como valor único (ej: "corona", "distal")
            let surfaces: string[] = [];
            if (cond.surface_code) {
              surfaces = [cond.surface_code];
            } else if (cond.surface_section) {
              if (cond.surface_section.includes(',')) {
                surfaces = cond.surface_section.split(',').map((s: string) => s.trim());
              } else {
                surfaces = [cond.surface_section];
              }
            }

            // Recalcular precio desde procedimientos según plan del paciente
            const procs = cond.procedures || [];
            const planAdjustedPrice = (procs.length > 0 && procs[0]?.price_without_plan !== undefined)
              ? getPriceForPlan(procs[0], patientPlanCode)
              : (cond.price || cond.price_base || 0);

            return {
              id: `presumptive-${cond.odontogram_condition_id}`,
              // Normalizar tooth_number: "2.2" -> "22" (formato FDI estándar)
              toothNumber: String(cond.tooth_number).replace('.', ''),
              toothPositionId: cond.tooth_position_id,
              toothSurfaceId: cond.tooth_surface_id || null,
              odontogramConditionId: cond.odontogram_condition_id,
              conditionId: cond.condition_code || String(cond.dental_condition_id || ''),
              dentalConditionId: cond.dental_condition_id || null,
              conditionLabel: cond.condition_name || cond.description || 'Condicion desconocida',
              cie10: cond.cie10_code || '',
              price: planAdjustedPrice,
              notes: cond.notes || '',
              surfaces,
              surfaceCode: cond.surface_code,
              surfaceName: cond.surface_name,
              procedures: cond.procedures || []
            };
          });

          // Resolver precios reales vía API (considera empresa corporativa)
          const withApiPrices = await resolveApiPrices(mappedConditions);
          setPresumptiveConditions(withApiPrices);

          // Auto-copiar al definitivo si esta vacio Y no se han cargado datos de BD
          if (definitiveConditions.length === 0 && withApiPrices.length > 0 && !dataLoaded && !isLoading) {
            const initialDefinitiveConditions = createInitialDefinitiveConditionsFromAPI(withApiPrices);
            setDefinitiveConditions(initialDefinitiveConditions);
          }
          return;
        }
      } catch (error) {
        console.error('Error al cargar condiciones presuntivas desde API:', error);
      }
    }

    // Fallback: usar datos del store local (odontograma en memoria)
    const odontogramConditions = currentOdontogram?.length > 0
      ? currentOdontogram
      : getPatientOdontogram(selectedPatient.id);

    const mappedConditions: DiagnosticCondition[] = [];

    odontogramConditions.forEach((cond: any) => {
      const conditionId = cond.condition || cond.conditionId;
      const officialCondition = OFFICIAL_DENTAL_CONDITIONS.find(
        (official) => official.id === conditionId
      );

      // Normalizar tooth_number: "2.2" -> "22" (formato FDI estándar)
      const normalizedToothNumber = String(cond.toothNumber).replace('.', '');

      // Buscar tooth_position_id desde el store usando el formato normalizado
      const toothPosition = toothPositions.find(
        tp => tp.tooth_number === normalizedToothNumber
      );

      // Precio ajustado al plan del paciente (usa procedimientos si disponibles)
      const officialPrice = getPlanAdjustedPrice(officialCondition);

      mappedConditions.push({
        id: `presumptive-${normalizedToothNumber}-${conditionId}`,
        toothNumber: normalizedToothNumber,
        toothPositionId: toothPosition?.tooth_position_id || 1,
        toothSurfaceId: null,
        odontogramConditionId: cond.condition_id || null,
        conditionId: conditionId,
        dentalConditionId: officialCondition?.condition_id || null,
        conditionLabel: officialCondition?.label || 'Condicion desconocida',
        cie10: (officialCondition as any)?.cie10 || (officialCondition as any)?.cie10_code || '',
        price: officialPrice,
        notes: cond.notes || '',
        // Incluir procedimientos desde el store (catálogo de condiciones)
        procedures: ((officialCondition as any)?.procedures || []).map((p: any) => ({
          procedure_id: p.procedure_id || p.condition_procedure_id,
          procedure_name: p.procedure_name,
          procedure_code: p.procedure_code,
          price_without_plan: p.price_without_plan,
          price_plan_personal: p.price_plan_personal,
          price_plan_familiar: p.price_plan_familiar,
          price_plan_platinium: p.price_plan_platinium,
          price_plan_oro: p.price_plan_oro,
          applies_to_state: p.applies_to_state,
          display_order: p.display_order
        }))
      });
    });

    // Resolver precios reales vía API (considera empresa corporativa)
    const withApiPrices = await resolveApiPrices(mappedConditions);
    setPresumptiveConditions(withApiPrices);

    // Auto-copiar al definitivo si esta vacio Y no se han cargado datos de BD
    if (definitiveConditions.length === 0 && withApiPrices.length > 0 && !dataLoaded && !isLoading) {
      const initialDefinitiveConditions = createInitialDefinitiveConditionsFromAPI(withApiPrices);
      setDefinitiveConditions(initialDefinitiveConditions);
    }
  }, [consultationId, currentOdontogram, selectedPatient, getPatientOdontogram, OFFICIAL_DENTAL_CONDITIONS, toothPositions, definitiveConditions.length, dataLoaded, isLoading, getPlanAdjustedPrice, patientPlanCode, resolveApiPrices]);

  /**
   * Crea condiciones definitivas iniciales a partir de las condiciones presuntivas de la API
   */
  const createInitialDefinitiveConditionsFromAPI = (presumptiveConditions: DiagnosticCondition[]): DefinitiveDiagnosticCondition[] => {
    return presumptiveConditions.map(cond => {
      const procedures = cond.procedures || [];
      // Auto-seleccionar el primer procedimiento registrado
      const firstProc = procedures.length > 0 ? procedures[0] : null;
      // Usar el precio ya resuelto de la condición (viene de la API o fallback)
      const firstProcId = firstProc ? ((firstProc as any).procedure_id || (firstProc as any).condition_procedure_id) : null;
      const cachedResolved = firstProcId ? resolvedPricesRef.current.get(firstProcId) : null;
      const firstProcPrice = cachedResolved
        ? cachedResolved.price
        : (firstProc ? getPriceForPlan(firstProc, patientPlanCode) : null);

      return {
        id: generateConditionId('definitive'),
        toothNumber: cond.toothNumber,
        toothPositionId: cond.toothPositionId,
        toothSurfaceId: cond.toothSurfaceId,
        odontogramConditionId: cond.odontogramConditionId,
        surfaces: cond.surfaces || [],
        presumptive: {
          conditionId: cond.conditionId,
          dentalConditionId: cond.dentalConditionId,
          conditionLabel: cond.conditionLabel,
          cie10: cond.cie10,
          price: cond.price,
          notes: cond.notes,
          surfaces: cond.surfaces || [],
          toothSurfaceId: cond.toothSurfaceId
        },
        definitive: {
          conditionId: cond.conditionId,
          dentalConditionId: cond.dentalConditionId,
          conditionLabel: cond.conditionLabel,
          cie10: cond.cie10,
          price: cond.price,
          notes: cond.notes,
          surfaces: cond.surfaces || [],
          procedures
        },
        modified: false,
        _toothPositionId: cond.toothPositionId,
        _dentalConditionId: cond.dentalConditionId || undefined,
        _procedures: procedures,
        // Auto-seleccionar primer procedimiento
        selected_procedure_id: firstProc?.procedure_id ?? null,
        selectedProcedureId: firstProc?.procedure_id ?? null,
        selected_procedure_name: firstProc?.procedure_name ?? null,
        _selected_procedure_name: firstProc?.procedure_name ?? null,
        procedure_price: firstProcPrice
      } as any;
    });
  };

  // Calcular totales
  const presumptiveTotal = calculateTotalPrice(presumptiveConditions);
  const definitiveTotal = calculateTotalPrice(definitiveConditions);

  // Handlers para el formulario
  const handleAddCondition = () => {
    if (!newToothNumber || !newConditionId || !newPrice) {
      return;
    }

    const selectedCondition = OFFICIAL_DENTAL_CONDITIONS.find(
      (c) => c.id === newConditionId
    );
    if (!selectedCondition) {
      return;
    }

    // Buscar tooth_position_id desde el store
    const toothPosition = toothPositions.find(
      tp => tp.tooth_number === newToothNumber
    );

    // Preparar procedimientos y auto-seleccionar el primero
    const conditionProcedures = ((selectedCondition as any)?.procedures || []).map((p: any) => ({
      procedure_id: p.procedure_id || p.condition_procedure_id,
      procedure_name: p.procedure_name,
      procedure_code: p.procedure_code,
      price_without_plan: p.price_without_plan,
      price_plan_personal: p.price_plan_personal,
      price_plan_familiar: p.price_plan_familiar,
      price_plan_platinium: p.price_plan_platinium,
      price_plan_oro: p.price_plan_oro,
      applies_to_state: p.applies_to_state,
      display_order: p.display_order
    }));
    const firstProc = conditionProcedures.length > 0 ? conditionProcedures[0] : null;
    // Intentar obtener precio vía API (considera empresa); fallback a local
    const firstProcId = firstProc?.procedure_id;
    const cachedResolved = firstProcId ? resolvedPricesRef.current.get(firstProcId) : null;
    const firstProcPrice = cachedResolved
      ? cachedResolved.price
      : (firstProc ? getPriceForPlan(firstProc, patientPlanCode) : null);

    // Lanzar resolución async para este procedimiento (actualiza caché para uso futuro)
    if (firstProcId && numericPatientId && !cachedResolved) {
      getResolvedPriceForProcedure(firstProcId, firstProc).catch(() => {});
    }

    const newCondition: DefinitiveDiagnosticCondition = {
      id: generateConditionId('definitive'),
      toothNumber: newToothNumber,
      toothPositionId: toothPosition?.tooth_position_id || 1,
      toothSurfaceId: null,
      odontogramConditionId: null,
      surfaces: newSurfaces,
      presumptive: {
        conditionId: '',
        dentalConditionId: null,
        conditionLabel: '',
        cie10: '',
        price: 0,
        notes: '',
        surfaces: [],
        toothSurfaceId: null
      },
      definitive: {
        conditionId: newConditionId,
        dentalConditionId: selectedCondition.condition_id || null,
        conditionLabel: selectedCondition.label,
        cie10: (selectedCondition as any).cie10 || (selectedCondition as any).cie10_code || '',
        price: parseFloat(newPrice),
        notes: newNotes,
        surfaces: newSurfaces,
        procedures: conditionProcedures
      },
      modified: true,
      _toothPositionId: toothPosition?.tooth_position_id || 1,
      _dentalConditionId: selectedCondition.condition_id,
      // Auto-seleccionar primer procedimiento
      selected_procedure_id: firstProc?.procedure_id ?? null,
      selectedProcedureId: firstProc?.procedure_id ?? null,
      selected_procedure_name: firstProc?.procedure_name ?? null,
      _selected_procedure_name: firstProc?.procedure_name ?? null,
      procedure_price: firstProcPrice,
      _procedures: conditionProcedures
    };

    setDefinitiveConditions([...definitiveConditions, newCondition]);
    resetForm();
    setUnsavedChanges(true);
  };

  const handleEditCondition = (condition: DefinitiveDiagnosticCondition) => {
    setIsEditing(true);
    setEditingId(condition.id);
    setNewToothNumber(condition.toothNumber);
    setNewConditionId(condition.definitive.conditionId);
    setNewPrice(condition.definitive.price.toString());
    setNewNotes(condition.definitive.notes || '');
    setNewSurfaces(condition.surfaces || condition.definitive.surfaces || []);
  };

  const handleSaveEdit = () => {
    if (!editingId || !newToothNumber || !newConditionId || !newPrice) return;

    const selectedCondition = OFFICIAL_DENTAL_CONDITIONS.find(
      (c) => c.id === newConditionId
    );
    if (!selectedCondition) return;

    // Buscar tooth_position_id desde el store si cambio el diente
    const toothPosition = toothPositions.find(
      tp => tp.tooth_number === newToothNumber
    );

    setDefinitiveConditions(
      definitiveConditions.map((cond) => {
        if (cond.id === editingId) {
          // Obtener procedimientos actualizados si la condición cambió
          const conditionChanged = cond.definitive.conditionId !== newConditionId;
          const updatedProcedures = conditionChanged
            ? ((selectedCondition as any)?.procedures || []).map((p: any) => ({
                procedure_id: p.procedure_id || p.condition_procedure_id,
                procedure_name: p.procedure_name,
                procedure_code: p.procedure_code,
                price_without_plan: p.price_without_plan,
                price_plan_personal: p.price_plan_personal,
                price_plan_familiar: p.price_plan_familiar,
                price_plan_platinium: p.price_plan_platinium,
                price_plan_oro: p.price_plan_oro,
                applies_to_state: p.applies_to_state,
                display_order: p.display_order
              }))
            : (cond._procedures || cond.definitive.procedures || []);

          const updated: DefinitiveDiagnosticCondition = {
            ...cond,
            toothNumber: newToothNumber,
            toothPositionId: toothPosition?.tooth_position_id || cond.toothPositionId,
            surfaces: newSurfaces,
            definitive: {
              conditionId: newConditionId,
              dentalConditionId: selectedCondition.condition_id || null,
              conditionLabel: selectedCondition.label,
              cie10: (selectedCondition as any).cie10 || (selectedCondition as any).cie10_code || '',
              price: parseFloat(newPrice),
              notes: newNotes,
              surfaces: newSurfaces,
              procedures: updatedProcedures
            },
            modified: false,
            _toothPositionId: toothPosition?.tooth_position_id || cond._toothPositionId,
            _dentalConditionId: selectedCondition.condition_id || cond._dentalConditionId,
            _procedures: updatedProcedures,
            // Si la condición cambió, auto-seleccionar el primer procedimiento de la nueva condición
            ...(conditionChanged ? (() => {
              const firstProc = updatedProcedures.length > 0 ? updatedProcedures[0] : null;
              const firstProcId = firstProc?.procedure_id;
              const cachedPrice = firstProcId ? resolvedPricesRef.current.get(firstProcId) : null;
              const firstProcPrice = cachedPrice
                ? cachedPrice.price
                : (firstProc ? getPriceForPlan(firstProc, patientPlanCode) : null);
              // Lanzar resolución async para actualizar caché
              if (firstProcId && numericPatientId && !cachedPrice) {
                getResolvedPriceForProcedure(firstProcId, firstProc).catch(() => {});
              }
              return {
                selected_procedure_id: firstProc?.procedure_id ?? null,
                selectedProcedureId: firstProc?.procedure_id ?? null,
                selected_procedure_name: firstProc?.procedure_name ?? null,
                _selected_procedure_name: firstProc?.procedure_name ?? null,
                procedure_price: firstProcPrice
              };
            })() : {})
          };

          // Marcar como modificado si cambio respecto al presuntivo
          updated.modified =
            updated.definitive.conditionId !== updated.presumptive.conditionId ||
            updated.definitive.price !== updated.presumptive.price ||
            updated.toothNumber !== cond.toothNumber;

          return updated;
        }
        return cond;
      })
    );

    resetForm();
    setUnsavedChanges(true);
  };

  const handleRemoveCondition = (condition: DefinitiveDiagnosticCondition) => {
    setDeleteModal({
      show: true,
      id: condition.id,
      toothNumber: condition.toothNumber,
      conditionLabel: condition.definitive.conditionLabel
    });
  };

  const confirmDelete = () => {
    setDefinitiveConditions(
      definitiveConditions.filter((cond) => cond.id !== deleteModal.id)
    );
    setDeleteModal({ show: false, id: '', toothNumber: '', conditionLabel: '' });
    setUnsavedChanges(true);
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, id: '', toothNumber: '', conditionLabel: '' });
  };

  const handleCopyFromPresumptive = () => {
    setShowCopyModal(true);
  };

  const confirmCopy = () => {
    // Usar la nueva funcion que mantiene los IDs correctos
    const newDefinitiveConditions = createInitialDefinitiveConditionsFromAPI(presumptiveConditions);
    setDefinitiveConditions(newDefinitiveConditions);
    setShowCopyModal(false);
    setUnsavedChanges(true);
  };

  const resetForm = () => {
    setNewToothNumber('');
    setNewConditionId('');
    setNewPrice('');
    setNewNotes('');
    setNewSurfaces([]);
    setIsEditing(false);
    setEditingId(null);
  };

  /**
   * Handler para guardar: guarda en BD y luego ejecuta onSave del padre
   * NOTA: No se actualiza currentRecord manualmente aquí porque:
   * 1. saveToDatabase() llama a loadFromDatabase() que actualiza definitiveConditions
   * 2. El useEffect de sincronización se encarga de propagar los cambios a currentRecord
   * Esto evita problemas de sincronización con datos obsoletos.
   */
  const handleSaveWithDatabase = async () => {
    // Guardar en la base de datos (esto también recarga los datos con IDs reales)
    const saved = await saveToDatabase();
    if (saved) {
      // Ejecutar el onSave del padre (si hace algo adicional)
      // La sincronización a currentRecord la hace el useEffect automáticamente
      onSave();
    }
  };

  /**
   * Handler para continuar: GUARDA AUTOMÁTICAMENTE antes de pasar al siguiente paso
   * Esto asegura que los datos siempre se persistan antes de navegar
   */
  const handleContinueWithSave = async () => {
    // Si hay condiciones definitivas, guardar primero
    if (definitiveConditions.length > 0) {
      const saved = await saveToDatabase();
      if (saved) {
        onContinue();
      }
    } else {
      onContinue();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <StepHeader
        icon={CheckCircle}
        title="Diagnóstico Definitivo"
        subtitle="Revise y confirme el diagnóstico final del paciente"
      />

      {/* Loading indicator cuando se carga desde BD */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-lg font-medium text-gray-700">Cargando diagnóstico...</span>
          </div>
        </motion.div>
      )}

      {/* Saving indicator cuando se guarda en BD */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-lg font-medium text-gray-700">Guardando diagnóstico...</span>
          </div>
        </motion.div>
      )}

      {/* Patient Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {selectedPatient?.firstName && selectedPatient?.lastName
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : selectedPatient?.name || 'Paciente'}
              </h3>
              <p className="text-blue-100">
                {selectedPatient?.documentType || 'DNI'}: {selectedPatient?.documentNumber || selectedPatient?.dni || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              Compare el diagnóstico presuntivo (izquierda) con el definitivo (derecha)
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Las condiciones marcadas como "Modificado" son diferentes al presuntivo.
            </p>
          </div>
          <button
            onClick={loadOdontogramConditions}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Recargar desde odontograma"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </motion.div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Presumptive (Read-only) */}
        <SectionCard
          icon={FileText}
          title="Diagnóstico Presuntivo"
          subtitle="Desde odontograma (Solo lectura)"
          colorScheme="blue"
          gradientTo="indigo"
          animationDelay={0.1}
        >
          <PresumptiveConditionsList
            conditions={presumptiveConditions}
            total={presumptiveTotal}
          />
        </SectionCard>

        {/* Right Column: Definitive (Editable) */}
        <SectionCard
          icon={ArrowRight}
          title="Diagnóstico Definitivo"
          subtitle="Edite, agregue o elimine condiciones"
          colorScheme="emerald"
          gradientTo="teal"
          animationDelay={0.15}
        >
          {!readOnly && (
            <>
              <button
                onClick={handleCopyFromPresumptive}
                className="w-full mb-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-blue-200"
              >
                <Copy className="w-4 h-4" />
                Copiar del Presuntivo
              </button>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mb-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Condición
                </button>
              )}

              {isEditing && (
                <ConditionFormFields
                  isEditing={!!editingId}
                  toothNumber={newToothNumber}
                  conditionId={newConditionId}
                  price={newPrice}
                  notes={newNotes}
                  surfaces={newSurfaces}
                  availableConditions={OFFICIAL_DENTAL_CONDITIONS}
                  patientHealthPlan={selectedPatient?.health_plan_code || selectedPatient?.healthPlanCode || selectedPatient?.health_plan || selectedPatient?.healthPlan}
                  patientId={numericPatientId}
                  onToothNumberChange={setNewToothNumber}
                  onConditionIdChange={setNewConditionId}
                  onPriceChange={setNewPrice}
                  onNotesChange={setNewNotes}
                  onSurfacesChange={setNewSurfaces}
                  onSubmit={editingId ? handleSaveEdit : handleAddCondition}
                  onCancel={resetForm}
                />
              )}
            </>
          )}

          {definitiveConditions.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-gray-800">
                  Condiciones Definitivas ({definitiveConditions.length})
                </h5>
                <div className="flex items-center gap-2 text-lg font-bold text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                  {formatCurrency(definitiveTotal)}
                </div>
              </div>

              <div className="space-y-2">
                {definitiveConditions.map((condition, index) => (
                  <DefinitiveConditionCard
                    key={condition.id}
                    condition={condition}
                    index={index}
                    readOnly={readOnly}
                    patientHealthPlan={selectedPatient?.health_plan_code || selectedPatient?.healthPlanCode || selectedPatient?.health_plan || selectedPatient?.healthPlan}
                    patientId={numericPatientId}
                    onEdit={handleEditCondition}
                    onDelete={handleRemoveCondition}
                    onProcedureChange={(conditionId, procedureId, procedurePrice, procedureName) => {
                      // Actualizar la condición con el procedimiento seleccionado
                      setDefinitiveConditions(prev => {
                        const updated = prev.map(cond => {
                          if (cond.id === conditionId) {
                            return {
                              ...cond,
                              selected_procedure_id: procedureId,
                              selectedProcedureId: procedureId,
                              selected_procedure_name: procedureName,
                              _selected_procedure_name: procedureName,
                              procedure_price: procedurePrice
                            } as any;
                          }
                          return cond;
                        });
                        return updated;
                      });
                      setUnsavedChanges(true);
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay condiciones en el diagnóstico definitivo.</p>
              <p className="text-sm mt-1">
                {readOnly
                  ? 'No hay información disponible.'
                  : 'Las condiciones se copiarán automáticamente del presuntivo, o puede agregar manualmente.'
                }
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Resumen Textual */}
      <DiagnosisSummaryTextarea
        value={currentRecord.finalDiagnosis || ''}
        onChange={debouncedUpdateFinalDiagnosis}
        readOnly={readOnly}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4"
      >
        <StepNavigationButtons
          onBack={onBack}
          onSave={handleSaveWithDatabase}
          onContinue={handleContinueWithSave}
          continueLabel="Continuar a Plan de Tratamiento"
          isSaving={isSaving}
        />
      </motion.div>

      {/* Modal: Delete Confirmation */}
      <DeleteConditionModal
        isOpen={deleteModal.show}
        toothNumber={deleteModal.toothNumber}
        conditionLabel={deleteModal.conditionLabel}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Modal: Copy from Presumptive */}
      <CopyFromPresumptiveModal
        isOpen={showCopyModal}
        presumptiveCount={presumptiveConditions.length}
        onConfirm={confirmCopy}
        onCancel={() => setShowCopyModal(false)}
      />
    </motion.div>
  );
};

// Exportar el componente memoizado
export const FinalDiagnosisStep = memo(FinalDiagnosisStepComponent);
