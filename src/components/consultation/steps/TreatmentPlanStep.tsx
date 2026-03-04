/**
 * Step 7: Plan de Tratamiento
 *
 * Componente para describir el plan de tratamiento a realizar.
 * Rediseñado con layout optimizado y mejor uso del espacio.
 */

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, User, ChevronLeft, ChevronRight, Save, Edit3, CheckCircle,
  ChevronDown, ChevronUp, CreditCard, DollarSign, Package
} from 'lucide-react';
import { consultationsApi } from '@/services/api/consultationsApi';
// StepHeader y SectionCard no se usan actualmente - dejamos el import comentado
// import { StepHeader, SectionCard } from '@/components/consultation/shared';
import { useTreatmentManagement } from '@/components/consultation/hooks/useTreatmentManagement';
import { usePaymentPlans } from '@/components/consultation/hooks/usePaymentPlans';
import { useAdditionalServices } from '@/components/consultation/hooks/useAdditionalServices';
import { groupConditionsByTooth, formatCurrency } from '@/components/consultation/utils/treatmentPlanHelpers';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { TreatmentSummary } from './treatment-plan/TreatmentSummary';
import { TreatmentForm } from './treatment-plan/TreatmentForm';
import { TreatmentTable } from './treatment-plan/TreatmentTable';
import { SubProcedureSelector } from './treatment-plan/SubProcedureSelector';
import { PaymentPlansSection } from './treatment-plan/PaymentPlansSection';
import { TreatmentPricingSection } from './treatment-plan/TreatmentPricingSection';
import { PaymentModal } from './treatment-plan/PaymentModal';
import { DeleteConfirmationModal } from './treatment-plan/DeleteConfirmationModal';
import type { SubProcedureWithPrice } from '@/services/api/subProceduresApi';

interface TreatmentPlanStepProps {
  // Datos del paciente
  selectedPatient: any;

  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Servicios adicionales (no usados en esta refactorización)
  additionalServices: string[];
  addAdditionalService: () => void;
  updateAdditionalService: (index: number, value: string) => void;
  removeAdditionalService: (index: number) => void;

  // Observaciones
  treatmentObservations: string;
  setTreatmentObservations: (value: string) => void;

  // Odontograma
  getPatientOdontogram: (patientId: string) => any[];
  currentOdontogram?: any[];
  setCurrentOdontogram?: (data: any[]) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegación
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

// Tipos para las secciones colapsables
type SectionId = 'odontogram' | 'treatments' | 'payments' | 'pricing';

/**
 * Componente del Step 7: Plan de Tratamiento
 * Rediseñado con layout de 2 columnas y secciones colapsables
 */
const TreatmentPlanStepComponent = ({
  selectedPatient,
  currentRecord,
  setCurrentRecord,
  treatmentObservations,
  setTreatmentObservations,
  getPatientOdontogram,
  currentOdontogram,
  setUnsavedChanges,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: TreatmentPlanStepProps) => {
  // Estado local para observaciones - permite escritura fluida
  const [localObservations, setLocalObservations] = useState(treatmentObservations || '');

  // Sincronizar estado local cuando cambie el valor del padre (ej: al cargar datos)
  useEffect(() => {
    if (treatmentObservations !== localObservations && treatmentObservations !== '') {
      setLocalObservations(treatmentObservations);
    }
  }, [treatmentObservations]);

  // Debounce para sincronizar con el estado padre
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localObservations !== treatmentObservations) {
        setTreatmentObservations(localObservations);
        setUnsavedChanges(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localObservations]);

  // Estado para secciones colapsables
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    odontogram: true,
    treatments: true,
    payments: false,
    pricing: true
  });

  // Estado para el selector de sub-procedimientos independiente
  const [showStandaloneSubProcedureSelector, setShowStandaloneSubProcedureSelector] = useState(false);

  const toggleSection = (section: SectionId) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ===== HOOKS =====
  const treatmentManagement = useTreatmentManagement({
    currentRecord,
    setCurrentRecord,
    setUnsavedChanges
  });

  const paymentPlans = usePaymentPlans({
    currentRecord,
    setCurrentRecord,
    setUnsavedChanges
  });


  const additionalServices = useAdditionalServices({
    currentRecord,
    setCurrentRecord,
    setUnsavedChanges
  });

  // ===== CATÁLOGO DE CONDICIONES DENTALES =====
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const allDentalConditions = useMemo(() => [...dentalConditions, ...customConditions], [dentalConditions, customConditions]);

  // ===== ESTADO DE CARGA =====
  const [isLoadingDefinitive, setIsLoadingDefinitive] = useState(false);
  const [dataLoadedFromDB, setDataLoadedFromDB] = useState(false);

  // Obtener consultationId del currentRecord
  const consultationId = currentRecord?.consultationId || currentRecord?.lastConsultationId || currentRecord?.consultation_id;

  // ===== CARGAR DATOS DESDE BD =====
  // Si no hay definitiveConditions en currentRecord, cargarlos desde la API
  const loadDefinitiveFromDatabase = useCallback(async () => {
    if (!consultationId || dataLoadedFromDB) {
      return;
    }

    setIsLoadingDefinitive(true);

    try {
      const response = await consultationsApi.getDefinitiveDiagnosis(consultationId);

      if (response.success && response.data.conditions.length > 0) {
        // Mapear datos de la API al formato esperado por el componente
        const mappedConditions = response.data.conditions.map((apiCond: any) => {
          // Buscar en el catálogo para enriquecer datos
          const catalogCondition = allDentalConditions.find(
            dc => dc.condition_id === apiCond.dental_condition_id
          );

          return {
            id: `definitive-${apiCond.definitive_condition_id}`,
            toothNumber: String(apiCond.tooth_number).replace('.', ''),
            toothPositionId: apiCond.tooth_position_id,
            toothSurfaceId: apiCond.tooth_surface_id || null,
            odontogramConditionId: apiCond.odontogram_condition_id || null,
            surfaces: apiCond.surfaces_array?.length > 0
              ? apiCond.surfaces_array
              : (apiCond.surfaces || []),
            presumptive: {
              conditionId: apiCond.condition_code || '',
              dentalConditionId: apiCond.presumptive_dental_condition_id || null,
              conditionLabel: apiCond.is_modified_from_presumptive ? 'Original' : apiCond.condition_label,
              cie10: '',
              price: apiCond.presumptive_price || 0,
              notes: apiCond.presumptive_description || '',
              surfaces: []
            },
            definitive: {
              conditionId: apiCond.condition_code || String(apiCond.dental_condition_id),
              dentalConditionId: apiCond.dental_condition_id,
              conditionLabel: apiCond.condition_name || apiCond.condition_label,
              cie10: apiCond.condition_cie10_code || apiCond.cie10_code || '',
              price: Number(apiCond.price) || 0,
              notes: apiCond.notes || '',
              surfaces: apiCond.surfaces_array?.length > 0
                ? apiCond.surfaces_array
                : (apiCond.surfaces || []),
              procedures: apiCond.procedures || []
            },
            modified: apiCond.is_modified_from_presumptive || false,
            // Datos adicionales
            _toothPositionId: apiCond.tooth_position_id,
            _dentalConditionId: apiCond.dental_condition_id,
            _conditionName: apiCond.condition_name,
            _conditionCategory: apiCond.condition_category,
            _conditionCode: apiCond.condition_code,
            _surfaceCode: apiCond.surface_code,
            _surfaceName: apiCond.surface_name,
            _procedures: apiCond.procedures || [],
            // Campos normalizados para TreatmentSummary
            conditionName: apiCond.condition_name || apiCond.condition_label || catalogCondition?.label,
            conditionLabel: apiCond.condition_label,
            price: Number(apiCond.price) || 0,
            category: apiCond.condition_category || (catalogCondition as any)?.category || '',
            cie10: apiCond.condition_cie10_code || apiCond.cie10_code || '',
            procedures: apiCond.procedures || [],
            // Procedimiento seleccionado
            selected_procedure_id: apiCond.selected_procedure_id || null,
            selectedProcedureId: apiCond.selected_procedure_id || null,
            procedure_price: apiCond.procedure_price || null,
            selected_procedure_name: apiCond.selected_procedure_name || null,
            _selected_procedure_name: apiCond.selected_procedure_name || null
          };
        });

        // Actualizar currentRecord con los datos cargados
        setCurrentRecord((prev: any) => ({
          ...prev,
          definitiveConditions: mappedConditions
        }));

        setDataLoadedFromDB(true);
      } else {
        setDataLoadedFromDB(true);
      }
    } catch (error) {
      setDataLoadedFromDB(true);
    } finally {
      setIsLoadingDefinitive(false);
    }
  }, [consultationId, dataLoadedFromDB, allDentalConditions, setCurrentRecord]);

  // Cargar datos desde BD al montar
  // IMPORTANTE: Siempre recargar desde la API para obtener los procedimientos,
  // ya que los datos que vienen del paso 6 no incluyen los procedimientos
  useEffect(() => {
    const definitiveConditionsFromRecord = currentRecord?.definitiveConditions || [];

    // Si hay consultationId y no hemos cargado datos de la BD, cargar
    // Incluso si hay datos en currentRecord, recargamos para obtener los procedimientos
    if (consultationId && !dataLoadedFromDB && !isLoadingDefinitive) {
      loadDefinitiveFromDatabase();
    } else if (!consultationId && definitiveConditionsFromRecord.length > 0) {
      // Si no hay consultationId pero hay datos en currentRecord (de paso 6),
      // marcar como cargado para usar esos datos
      setDataLoadedFromDB(true);
    }
  }, [consultationId, dataLoadedFromDB, isLoadingDefinitive, loadDefinitiveFromDatabase, currentRecord?.definitiveConditions?.length]);

  // ===== DATOS DEL DIAGNÓSTICO DEFINITIVO =====
  // Prioridad: definitiveConditions > odontograma
  // Los datos vienen desde la API con JOINs a las tablas relacionadas:
  // - tooth_positions (tooth_number, tooth_name)
  // - tooth_surfaces (surface_code, surface_name)
  // - odontogram_dental_conditions (condition_name, category, price_base)
  // - odontogram_condition_procedures (procedure_name, etc.)
  const definitiveConditions = currentRecord?.definitiveConditions || [];

  // Función para limpiar número de diente (sin puntos ni comas)
  const formatToothNumber = (num: string): string => {
    // Eliminar puntos y comas, retornar número limpio
    return String(num).replace(/[.,]/g, '');
  };

  // Función para buscar condición en el catálogo por múltiples identificadores
  const findCatalogCondition = (cond: any) => {
    // Extraer todos los posibles IDs
    const dentalConditionId = cond._dentalConditionId || cond.definitive?.dentalConditionId;
    const conditionId = cond.definitive?.conditionId || cond.conditionId || '';

    // Buscar por dental_condition_id (número) - más confiable
    if (dentalConditionId) {
      const byDentalId = allDentalConditions.find(
        dc => dc.condition_id === dentalConditionId ||
              dc.condition_id === Number(dentalConditionId)
      );
      if (byDentalId) return byDentalId;
    }

    // Buscar por condition_code (string)
    if (conditionId) {
      const byCode = allDentalConditions.find(
        dc => dc.condition_code === conditionId ||
              dc.id === conditionId ||
              dc.code === conditionId
      );
      if (byCode) return byCode;
    }

    return null;
  };

  // Agrupar condiciones del diagnóstico definitivo por diente
  // PRIORIDAD: Datos de la API (BD) > Catálogo local > Fallback odontograma
  const groupedConditionsByTooth = useMemo(() => {
    if (definitiveConditions.length > 0) {
      // Usar condiciones del diagnóstico definitivo
      const grouped: Record<string, any[]> = {};

      definitiveConditions.forEach((cond: any) => {
        // Formatear número de diente (sin puntos ni comas)
        const rawToothNum = cond.toothNumber || cond.tooth_number || 'General';
        const toothNum = formatToothNumber(rawToothNum);

        if (!grouped[toothNum]) {
          grouped[toothNum] = [];
        }

        // Extraer nombre de condición:
        // 1. _conditionName (del JOIN con odontogram_dental_conditions.condition_name)
        // 2. definitive.conditionLabel (guardado en la tabla definitiva)
        // 3. Buscar en catálogo local como fallback
        let conditionName = cond._conditionName ||
                           cond.conditionName ||
                           cond.condition_name ||
                           cond.definitive?.conditionLabel ||
                           cond.conditionLabel;

        // Si aún no tenemos nombre, buscar en el catálogo local
        if (!conditionName || conditionName === 'Sin nombre') {
          const catalogCondition = findCatalogCondition(cond) as any;
          conditionName = catalogCondition?.label ||
                         catalogCondition?.condition_name ||
                         'Condicion sin nombre';
        }

        // Extraer procedimientos:
        // 1. _procedures (del JOIN con odontogram_condition_procedures)
        // 2. definitive.procedures (guardados durante el mapeo)
        // 3. Buscar en catálogo local como fallback
        let procedures: any[] = cond._procedures || cond.procedures || cond.definitive?.procedures || [];

        // Si no hay procedimientos desde la API, intentar buscar en el catálogo local
        if (procedures.length === 0) {
          const catalogCondition = findCatalogCondition(cond);
          if (catalogCondition?.procedures) {
            procedures = catalogCondition.procedures;
          }
        }

        // Extraer nombres de procedimientos para mostrar
        const procedureNames = procedures
          .map((p: any) => p.procedure_name)
          .filter(Boolean);

        // Buscar una sola vez en el catálogo para extraer varios campos
        const catalogCond = findCatalogCondition(cond) as any;

        // Extraer categoría
        const category = cond._conditionCategory ||
                        cond.definitive?.category ||
                        catalogCond?.category ||
                        '';

        // Extraer código de condición
        const conditionCode = cond._conditionCode ||
                             cond.definitive?.conditionId ||
                             catalogCond?.condition_code ||
                             '';

        // Extraer superficies - pueden venir de varios lugares
        // Priorizar surfaces_array (de la tabla intermedia), luego surfaces del definitive
        const surfaces = cond.surfaces ||
                         cond.definitive?.surfaces ||
                         cond.presumptive?.surfaces ||
                         [];

        // Extraer información de superficie
        const surfaceCode = cond._surfaceCode || '';
        const surfaceName = cond._surfaceName || '';

        // Extraer CIE-10
        const cie10 = cond.definitive?.cie10 ||
                      cond._cie10Code ||
                      catalogCond?.cie10_code ||
                      '';

        // Extraer abbreviation (código corto)
        const abbreviation = catalogCond?.abbreviation ||
                            catalogCond?.abbreviations ||
                            conditionCode ||
                            '';

        const mappedCondition = {
          // Identificadores
          id: cond.id,
          definitive_condition_id: cond.id?.replace('definitive-', '') || cond.definitive_condition_id,
          conditionId: cond.definitive?.conditionId || cond.conditionId || '',
          dentalConditionId: cond._dentalConditionId || cond.definitive?.dentalConditionId,

          // Número de diente
          toothNumber: toothNum,
          tooth_number: toothNum,

          // Datos de la condicion (desde API/BD)
          conditionName: conditionName,
          conditionCode: conditionCode,
          abbreviation: abbreviation,
          category: category,

          // Precio
          price: Number(cond.definitive?.price) || Number(cond.price) || 0,

          // Superficies
          surfaces: Array.isArray(surfaces) ? surfaces : [],
          surfaceCode: surfaceCode,
          surfaceName: surfaceName,

          // Informacion adicional
          cie10: cie10,
          notes: cond.definitive?.notes || cond.notes || '',

          // Procedimientos sugeridos (desde API/BD)
          procedures: procedureNames,
          proceduresData: procedures, // Datos completos para uso avanzado

          // Procedimiento seleccionado
          selected_procedure_id: cond.selected_procedure_id || cond.selectedProcedureId || null,
          selectedProcedureId: cond.selected_procedure_id || cond.selectedProcedureId || null,
          procedure_price: cond.procedure_price || null,
          selected_procedure_name: cond.selected_procedure_name || cond._selected_procedure_name || null,

          // Estado de modificacion
          modified: cond.modified || false,

          // Datos presuntivos para comparacion
          presumptive: cond.presumptive
        };

        grouped[toothNum].push(mappedCondition);
      });

      return grouped;
    }

    // Fallback: usar datos del odontograma si no hay diagnóstico definitivo
    const storedConditions = selectedPatient ? getPatientOdontogram(selectedPatient.id) : [];
    const odontogramConditions = storedConditions.length > 0
      ? storedConditions
      : currentOdontogram || [];
    return groupConditionsByTooth(odontogramConditions);
  }, [definitiveConditions, selectedPatient, getPatientOdontogram, currentOdontogram, allDentalConditions]);

  const totalConditions = Object.values(groupedConditionsByTooth).reduce((sum, c) => sum + c.length, 0);
  const totalTeeth = Object.keys(groupedConditionsByTooth).length;

  // ===== CÁLCULO DE TOTALES =====
  // Total del diagnóstico definitivo (suma de procedure_price cuando existe, sino price)
  const definitiveConditionsTotal = useMemo(() => {
    return Object.values(groupedConditionsByTooth).reduce((total, conditions) => {
      return total + conditions.reduce((sum, cond) => {
        // Priorizar procedure_price (precio del procedimiento asignado)
        const price = Number(cond.procedure_price) || Number(cond.price) || 0;
        return sum + price;
      }, 0);
    }, 0);
  }, [groupedConditionsByTooth]);

  // Total de tratamientos aplicados
  const treatmentsTotal = treatmentManagement.grandTotal;

  // ===== HANDLERS PARA MODALES =====
  const handleDeleteConfirm = () => {
    if (treatmentManagement.deleteModal.type === 'treatment' && treatmentManagement.deleteModal.treatmentId) {
      treatmentManagement.handleRemoveTreatment(treatmentManagement.deleteModal.treatmentId);
    } else if (
      treatmentManagement.deleteModal.type === 'condition' &&
      treatmentManagement.deleteModal.treatmentId &&
      treatmentManagement.deleteModal.conditionId
    ) {
      treatmentManagement.handleRemoveCondition(
        treatmentManagement.deleteModal.treatmentId,
        treatmentManagement.deleteModal.conditionId
      );
    }
  };

  // Handler para seleccionar sub-procedimiento independiente
  const handleSelectStandaloneSubProcedure = (subProcedure: SubProcedureWithPrice) => {
    treatmentManagement.handleAddStandaloneSubProcedure(
      subProcedure.sub_procedure_name,
      subProcedure.price_with_plan || subProcedure.price_without_plan,
      subProcedure.sub_procedure_id,
      subProcedure.sub_procedure_code,
      subProcedure.specialty
    );
    setShowStandaloneSubProcedureSelector(false);
  };

  // Componente de cabecera de sección colapsable
  const CollapsibleHeader = ({
    section,
    icon: Icon,
    title,
    badge,
    color
  }: {
    section: SectionId;
    icon: any;
    title: string;
    badge?: string | number;
    color: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
        expandedSections[section]
          ? `bg-${color}-50 border border-${color}-200`
          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${expandedSections[section] ? `text-${color}-600` : 'text-gray-500'}`} />
        <span className={`font-medium text-sm ${expandedSections[section] ? `text-${color}-700` : 'text-gray-700'}`}>
          {title}
        </span>
        {badge !== undefined && (
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
            expandedSections[section]
              ? `bg-${color}-100 text-${color}-700`
              : 'bg-gray-200 text-gray-600'
          }`}>
            {badge}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200"
    >
      {/* Header compacto con info del paciente integrada */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Plan de Tratamiento</h2>
              <p className="text-xs text-gray-600">Descripción del tratamiento a realizar</p>
            </div>
          </div>

          {/* Info paciente inline */}
          {selectedPatient && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <User className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-gray-800">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{selectedPatient.documentNumber}</span>
              </div>
              {selectedPatient.medicalHistory?.allergies?.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Alergias
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">Piezas: <strong>{totalTeeth}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Condiciones: <strong>{totalConditions}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-gray-600">
              Tratamientos: <strong>{treatmentManagement.appliedTreatments.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-gray-600">
              Total: <strong className="text-emerald-600">{formatCurrency(treatmentManagement.grandTotal)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Contenido principal - Grid de 2 columnas */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Columna izquierda - Odontograma y Tratamientos */}
          <div className="lg:col-span-7 space-y-3">

            {/* Diagnóstico Definitivo - Colapsable */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleHeader
                section="odontogram"
                icon={CheckCircle}
                title="Diagnóstico Definitivo"
                badge={totalTeeth > 0 ? `${totalTeeth} piezas` : undefined}
                color="emerald"
              />
              <AnimatePresence>
                {expandedSections.odontogram && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TreatmentSummary
                      groupedConditionsByTooth={groupedConditionsByTooth}
                      readOnly={true}
                      patientHealthPlan={selectedPatient?.health_plan_code || selectedPatient?.healthPlanCode || selectedPatient?.healthPlan || selectedPatient?.health_plan || null}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Formulario y Tabla de Tratamientos - Colapsable */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleHeader
                section="treatments"
                icon={Layers}
                title="Tratamientos del Plan"
                badge={treatmentManagement.appliedTreatments.length || undefined}
                color="green"
              />
              <AnimatePresence>
                {expandedSections.treatments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 space-y-3"
                  >
                    <TreatmentForm
                      availableTreatments={treatmentManagement.availableTreatments}
                      selectedTreatmentId={treatmentManagement.selectedTreatmentId}
                      setSelectedTreatmentId={treatmentManagement.setSelectedTreatmentId}
                      handleAddTreatment={treatmentManagement.handleAddTreatment}
                      readOnly={readOnly}
                      isLoading={treatmentManagement.isLoadingTreatments}
                    />

                    {/* Sección para agregar sub-procedimientos independientes */}
                    {!readOnly && (
                      <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">
                              Agregar Sub-procedimiento
                            </span>
                          </div>
                          {!showStandaloneSubProcedureSelector && (
                            <button
                              onClick={() => setShowStandaloneSubProcedureSelector(true)}
                              className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              Buscar en catálogo
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mb-2">
                          Agrega procedimientos del catálogo sin necesidad de crear un tratamiento primero
                        </p>

                        {showStandaloneSubProcedureSelector && (
                          <SubProcedureSelector
                            patientId={selectedPatient?.patient_id}
                            patientHealthPlan={selectedPatient?.health_plan_code || selectedPatient?.healthPlanCode || null}
                            onSelect={handleSelectStandaloneSubProcedure}
                            onCancel={() => setShowStandaloneSubProcedureSelector(false)}
                            onManualMode={() => setShowStandaloneSubProcedureSelector(false)}
                          />
                        )}
                      </div>
                    )}

                    <TreatmentTable
                      appliedTreatments={treatmentManagement.appliedTreatments}
                      grandTotal={treatmentManagement.grandTotal}
                      readOnly={readOnly}
                      patientId={selectedPatient?.patient_id}
                      patientHealthPlan={selectedPatient?.health_plan_code || selectedPatient?.healthPlanCode || null}
                      handleEditTreatmentName={treatmentManagement.handleEditTreatmentName}
                      handleEditConditionLabel={treatmentManagement.handleEditConditionLabel}
                      handleEditConditionPrice={treatmentManagement.handleEditConditionPrice}
                      handleEditConditionQuantity={treatmentManagement.handleEditConditionQuantity}
                      handleAddConditionToTreatment={treatmentManagement.handleAddConditionToTreatment}
                      setDeleteModal={treatmentManagement.setDeleteModal}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Columna derecha - Pagos, Precios y Observaciones */}
          <div className="lg:col-span-5 space-y-3">

            {/* Información de Precios - Colapsable */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleHeader
                section="pricing"
                icon={DollarSign}
                title="Información de Precios"
                color="emerald"
              />
              <AnimatePresence>
                {expandedSections.pricing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TreatmentPricingSection
                      definitiveConditionsTotal={definitiveConditionsTotal}
                      treatmentsTotal={treatmentsTotal}
                      additionalServicesTotal={additionalServices.additionalServicesTotal}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Planes de Pago - Colapsable */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <CollapsibleHeader
                section="payments"
                icon={CreditCard}
                title="Servicios Adicionales"
                color="purple"
              />
              <AnimatePresence>
                {expandedSections.payments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PaymentPlansSection
                      // Datos de la API
                      orthodonticPlans={additionalServices.orthodonticPlans}
                      implantPlans={additionalServices.implantPlans}
                      prosthesisItems={additionalServices.prosthesisItems}
                      isLoading={additionalServices.isLoading}
                      // Servicios seleccionados
                      selectedServices={additionalServices.selectedServices}
                      // Helpers
                      isServiceSelected={additionalServices.isServiceSelected}
                      getOrthodonticPlanName={additionalServices.getOrthodonticPlanName}
                      getImplantPlanName={additionalServices.getImplantPlanName}
                      // Acciones
                      toggleOrthodonticPlan={additionalServices.toggleOrthodonticPlan}
                      toggleImplantPlan={additionalServices.toggleImplantPlan}
                      toggleProsthesisItem={additionalServices.toggleProsthesisItem}
                      updateServiceField={additionalServices.updateServiceField}
                      removeService={additionalServices.removeService}
                      // Total
                      additionalServicesTotal={additionalServices.additionalServicesTotal}
                      readOnly={readOnly}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Observaciones - Compacto */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-sm text-gray-700">Observaciones</span>
              </div>
              <textarea
                value={localObservations}
                onChange={(e) => setLocalObservations(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder-gray-400 resize-none"
                placeholder="Observaciones importantes, consideraciones especiales..."
                disabled={readOnly}
              />
            </div>

            {/* Referencia del Diagnóstico - Solo si existe */}
            {currentRecord.finalDiagnosis && (
              <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm text-green-700">Diagnóstico Definitivo</span>
                </div>
                <p className="text-xs text-gray-700 line-clamp-3">{currentRecord.finalDiagnosis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Navegación - Fijos en la parte inferior */}
        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={onContinue}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pago a Cuenta */}
      <PaymentModal
        show={paymentPlans.showPaymentModal}
        paymentType={paymentPlans.paymentType}
        paymentForm={paymentPlans.paymentForm}
        setPaymentForm={paymentPlans.setPaymentForm}
        handleSubmit={paymentPlans.handleSubmitPayment}
        onClose={paymentPlans.closePaymentModal}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmationModal
        show={treatmentManagement.deleteModal.show}
        type={treatmentManagement.deleteModal.type}
        label={treatmentManagement.deleteModal.label}
        onConfirm={handleDeleteConfirm}
        onCancel={() => treatmentManagement.setDeleteModal({ show: false, type: 'treatment', label: '' })}
      />
    </motion.div>
  );
};

// Exportar el componente memoizado
export const TreatmentPlanStep = memo(TreatmentPlanStepComponent);
