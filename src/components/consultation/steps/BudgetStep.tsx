/**
 * Step 9: Presupuesto Consolidado
 *
 * Componente para mostrar el presupuesto consolidado del tratamiento.
 * Integrado con el backend - NO contiene datos hardcodeados.
 *
 * Secciones:
 * - Header con total general
 * - Informacion del paciente
 * - Diagnostico Definitivo (PROCEDIMIENTOS del paso 7)
 * - Tratamientos Aplicados (desde consultation_treatment_items)
 * - Servicios Adicionales (Ortodoncia/Implantes/Protesis)
 * - Examenes de Diagnostico
 * - Calculos Financieros (adelanto y saldo)
 * - Observaciones del presupuesto
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import {
  User,
  CreditCard,
  TestTube,
  Layers,
  ChevronLeft,
  Save,
  ChevronRight,
  Loader2,
  AlertCircle,
  Stethoscope,
  Package
} from 'lucide-react';
import {
  consultationsApi,
  consultationBudgetsApi,
  type ConsultationTreatmentPlanFullData,
  type DefinitiveDiagnosisConditionData,
  type ConsultationBudgetData
} from '@/services/api/consultationsApi';
import { radiographyRequestsApi, type RadiographyRequestData } from '@/services/api/radiographyRequestsApi';
import { promotionsApi, type PromotionData } from '@/services/api/promotionsApi';
import { CheckCircle2, Scan, Radio, RefreshCw, Tag, Percent } from 'lucide-react';
import { formatCurrency } from '../utils/treatmentPlanHelpers';

interface BudgetStepProps {
  // Paciente seleccionado
  selectedPatient: any;

  // Datos del presupuesto
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;
  handleSaveProgress: () => Promise<void>;
  markStepCompleted: (step: number) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegacion
  onBack: () => void;
}

// Interfaces para los datos del backend
interface TreatmentCondition {
  condition_id?: number;
  label: string;
  price: number;
  quantity: number;
  subtotal?: number;
  display_order?: number;
}

interface TreatmentItem {
  consultation_treatment_item_id?: number;
  treatment_id?: number;
  treatment_name: string;
  total_amount: number;
  display_order?: number;
  conditions: TreatmentCondition[];
}

interface AdditionalService {
  consultation_additional_service_id?: number;
  service_type: string;
  service_name: string;
  modality?: string;
  description?: string;
  original_monto_total: number;
  original_inicial: number;
  original_mensual: number;
  edited_monto_total: number;
  edited_inicial: number;
  edited_mensual: number;
  display_order?: number;
}

interface BudgetData {
  // Presupuesto guardado en consultation_budgets (Paso 9)
  savedBudget: ConsultationBudgetData | null;
  // Plan de tratamiento del paso 8
  treatmentPlan: ConsultationTreatmentPlanFullData | null;
  // Diagnostico definitivo con procedimientos
  definitiveDiagnosis: {
    conditions: DefinitiveDiagnosisConditionData[];
    summary: {
      total_conditions: number;
      total_price: number;
      modified_count: number;
    };
  } | null;
  // Solicitud de radiografia del paso 4
  radiographyRequest: RadiographyRequestData | null;
  // Estado de carga
  loading: boolean;
  error: string | null;
  // Estado de guardado
  saving: boolean;
}

// ============================================================================
// CONFIGURACIÓN DE CATEGORÍAS PARA EXÁMENES (mismo formato que técnico)
// ============================================================================

const TOMO_CATEGORIES_CONFIG: Record<string, { title: string; bgColor: string; borderColor: string; textColor: string; chipBg: string }> = {
  tipoEntrega: { title: 'TIPO DE ENTREGA', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', chipBg: 'bg-purple-100' },
  campoPequeno: { title: 'CAMPO PEQUEÑO', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', chipBg: 'bg-green-100' },
  campoMediano: { title: 'CAMPO MEDIANO', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700', chipBg: 'bg-yellow-100' },
  campoGrande: { title: 'CAMPO MEDIANO/GRANDE', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', chipBg: 'bg-orange-100' },
  ortodoncia: { title: 'ORTODONCIA', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', textColor: 'text-indigo-700', chipBg: 'bg-indigo-100' },
  otrasOpciones: { title: 'OTRAS OPCIONES', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', chipBg: 'bg-blue-100' },
};

const RADIO_CATEGORIES_CONFIG: Record<string, { title: string; bgColor: string; borderColor: string; textColor: string; chipBg: string }> = {
  periapical: { title: 'PERIAPICAL', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700', chipBg: 'bg-pink-100' },
  bitewing: { title: 'BITEWING', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', chipBg: 'bg-blue-100' },
  oclusal: { title: 'OCLUSAL', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', chipBg: 'bg-purple-100' },
  otrasIntraorales: { title: 'OTRAS INTRAORALES', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', textColor: 'text-cyan-700', chipBg: 'bg-cyan-100' },
  extraorales: { title: 'EXTRAORALES', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', chipBg: 'bg-green-100' },
  asesoriaOrtodoncia: { title: 'ORTODONCIA', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'text-violet-700', chipBg: 'bg-violet-100' },
  serviciosAdicionales: { title: 'SERVICIOS ADICIONALES', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', chipBg: 'bg-amber-100' },
  analisisCefalometricos: { title: 'ANÁLISIS CEFALOMÉTRICOS', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-700', chipBg: 'bg-rose-100' },
};

// Procesador de Tomografía 3D
const processTomografia = (tomografia3D: any) => {
  if (!tomografia3D) return {};
  const grouped: Record<string, Array<{ label: string; details?: string[] }>> = {};

  // TIPO DE ENTREGA
  const tipoEntrega: Array<{ label: string }> = [];
  if (tomografia3D.conInforme) tipoEntrega.push({ label: 'Con Informe' });
  if (tomografia3D.sinInforme) tipoEntrega.push({ label: 'Sin Informe' });
  if (tomografia3D.dicom) tipoEntrega.push({ label: 'DICOM' });
  if (tomografia3D.soloUsb) tipoEntrega.push({ label: 'Solo USB' });
  if (tipoEntrega.length) grouped['tipoEntrega'] = tipoEntrega;

  // CAMPO PEQUEÑO
  const campoPequeno: Array<{ label: string; details?: string[] }> = [];
  if (tomografia3D.endodoncia) campoPequeno.push({ label: 'Endodoncia', details: tomografia3D.numeroPiezasEndo ? [`${tomografia3D.numeroPiezasEndo} piezas`] : undefined });
  if (tomografia3D.fracturaRadicular) campoPequeno.push({ label: 'Fractura Radicular' });
  if (tomografia3D.anatomiaEndodontica) campoPequeno.push({ label: 'Anatomía Endodóntica' });
  if (campoPequeno.length) grouped['campoPequeno'] = campoPequeno;

  // CAMPO MEDIANO
  const campoMediano: Array<{ label: string; details?: string[] }> = [];
  if (tomografia3D.localizacionDiente) campoMediano.push({ label: 'Localización de Diente Incluido' });
  if (tomografia3D.implantes) {
    const details: string[] = [];
    if (tomografia3D.numeroCortes) details.push(`${tomografia3D.numeroCortes} cortes`);
    if (tomografia3D.conGuiaQx) details.push('Con Guía QX');
    campoMediano.push({ label: 'Implantes', details: details.length ? details : undefined });
  }
  if (tomografia3D.maxilarSuperior) campoMediano.push({ label: 'Maxilar Superior/Inferior' });
  if (campoMediano.length) grouped['campoMediano'] = campoMediano;

  // CAMPO GRANDE
  const campoGrande: Array<{ label: string }> = [];
  if (tomografia3D.viaAerea) campoGrande.push({ label: 'Vía Aérea' });
  if (tomografia3D.ortognatica) campoGrande.push({ label: 'Ortognática' });
  if (campoGrande.length) grouped['campoGrande'] = campoGrande;

  // ORTODONCIA
  const ortodoncia: Array<{ label: string; details?: string[] }> = [];
  if (tomografia3D.marpe) ortodoncia.push({ label: 'MARPE' });
  if (tomografia3D.miniImplantes) {
    const details: string[] = [];
    if (tomografia3D.intraAlveolares) details.push('Intra-alveolares');
    if (tomografia3D.extraAlveolares) details.push('Extra-alveolares');
    if (tomografia3D.infracigomatico) details.push('Infracigomático');
    if (tomografia3D.buccalShelf) details.push('Buccal Shelf');
    ortodoncia.push({ label: 'Mini-implantes', details: details.length ? details : undefined });
  }
  if (ortodoncia.length) grouped['ortodoncia'] = ortodoncia;

  // OTRAS OPCIONES
  const otrasOpciones: Array<{ label: string }> = [];
  if (tomografia3D.atm) otrasOpciones.push({ label: 'ATM' });
  if (tomografia3D.macizoFacial) otrasOpciones.push({ label: 'Macizo Facial' });
  if (otrasOpciones.length) grouped['otrasOpciones'] = otrasOpciones;

  return grouped;
};

// Procesador de Radiografías
const processRadiografias = (radiografias: any) => {
  if (!radiografias) return {};
  const grouped: Record<string, Array<{ label: string; details?: string[]; teeth?: { fisico?: number[]; digital?: number[] } }>> = {};

  // PERIAPICAL
  const fisicoTeeth: number[] = [];
  if (Array.isArray(radiografias.dientesSuperioresFisico)) fisicoTeeth.push(...radiografias.dientesSuperioresFisico);
  if (Array.isArray(radiografias.dientesInferioresFisico)) fisicoTeeth.push(...radiografias.dientesInferioresFisico);
  if (Array.isArray(radiografias.dientesTemporalesFisico)) fisicoTeeth.push(...radiografias.dientesTemporalesFisico);

  const digitalTeeth: number[] = [];
  if (Array.isArray(radiografias.dientesSuperioresDigital)) digitalTeeth.push(...radiografias.dientesSuperioresDigital);
  if (Array.isArray(radiografias.dientesInferioresDigital)) digitalTeeth.push(...radiografias.dientesInferioresDigital);
  if (Array.isArray(radiografias.dientesTemporalesDigital)) digitalTeeth.push(...radiografias.dientesTemporalesDigital);

  if (fisicoTeeth.length > 0 || digitalTeeth.length > 0) {
    grouped['periapical'] = [{
      label: 'Periapical',
      teeth: {
        fisico: fisicoTeeth.length > 0 ? [...new Set(fisicoTeeth)].sort((a, b) => a - b) : undefined,
        digital: digitalTeeth.length > 0 ? [...new Set(digitalTeeth)].sort((a, b) => a - b) : undefined
      }
    }];
  }

  // BITEWING
  const bitewing: Array<{ label: string; details?: string[] }> = [];
  const bitewingMolares: string[] = [];
  if (radiografias.bitewingMolaresDerecha) bitewingMolares.push('Derecha');
  if (radiografias.bitewingMolaresIzquierda) bitewingMolares.push('Izquierda');
  if (bitewingMolares.length) bitewing.push({ label: 'Molares', details: bitewingMolares });
  const bitewingPremolares: string[] = [];
  if (radiografias.bitewingPremolaresDerecha) bitewingPremolares.push('Derecha');
  if (radiografias.bitewingPremolaresIzquierda) bitewingPremolares.push('Izquierda');
  if (bitewingPremolares.length) bitewing.push({ label: 'Premolares', details: bitewingPremolares });
  if (bitewing.length) grouped['bitewing'] = bitewing;

  // OCLUSAL
  const oclusal: Array<{ label: string }> = [];
  if (radiografias.oclusalSuperiores) oclusal.push({ label: 'Superiores' });
  if (radiografias.oclusalInferiores) oclusal.push({ label: 'Inferiores' });
  if (oclusal.length) grouped['oclusal'] = oclusal;

  // OTRAS INTRAORALES
  const otrasIntraorales: Array<{ label: string }> = [];
  if (radiografias.seriada) otrasIntraorales.push({ label: 'Seriada' });
  if (radiografias.fotografias || radiografias.fotografiaIntraoral || radiografias.fotografiaExtraoral) {
    otrasIntraorales.push({ label: 'Fotografías' });
  }
  if (otrasIntraorales.length) grouped['otrasIntraorales'] = otrasIntraorales;

  // EXTRAORALES
  const extraorales: Array<{ label: string }> = [];
  if (radiografias.extraoralPanoramica) extraorales.push({ label: 'Panorámica' });
  if (radiografias.extraoralCefalometrica) extraorales.push({ label: 'Cefalométrica' });
  if (radiografias.extraoralCarpal) extraorales.push({ label: 'Carpal (Edad Ósea)' });
  if (radiografias.extraoralPosteriorAnterior) extraorales.push({ label: 'Posterior Anterior' });
  if (radiografias.extraoralAtmAbierta) extraorales.push({ label: 'ATM (Abierta)' });
  if (radiografias.extraoralAtmCerrada) extraorales.push({ label: 'ATM (Cerrada)' });
  if (extraorales.length) grouped['extraorales'] = extraorales;

  // ASESORÍA ORTODONCIA
  const asesoriaOrtodoncia: Array<{ label: string; details?: string[] }> = [];
  if (radiografias.ortodonciaPaquete) {
    asesoriaOrtodoncia.push({
      label: `Paquete ${radiografias.ortodonciaPaquete}`,
      details: radiografias.ortodonciaPlanTratamiento === 'con' ? ['Con plan de tratamiento'] : ['Sin plan de tratamiento']
    });
  }
  if (asesoriaOrtodoncia.length) grouped['asesoriaOrtodoncia'] = asesoriaOrtodoncia;

  // SERVICIOS ADICIONALES
  const serviciosAdicionales: Array<{ label: string }> = [];
  if (radiografias.ortodonciaAlineadores) serviciosAdicionales.push({ label: 'Alineadores Invisibles' });
  if (radiografias.ortodonciaEscaneo) serviciosAdicionales.push({ label: 'Escaneo Intraoral Digital' });
  if (radiografias.ortodonciaImpresion) serviciosAdicionales.push({ label: 'Modelos de Estudio 3D' });
  if (serviciosAdicionales.length) grouped['serviciosAdicionales'] = serviciosAdicionales;

  // ANÁLISIS CEFALOMÉTRICOS
  const analisisCefalometricos: Array<{ label: string }> = [];
  if (radiografias.analisisRicketts) analisisCefalometricos.push({ label: 'Ricketts' });
  if (radiografias.analisisSteiner) analisisCefalometricos.push({ label: 'Steiner' });
  if (radiografias.analisisMcNamara) analisisCefalometricos.push({ label: 'Mc Namara' });
  if (radiografias.analisisBjorks) analisisCefalometricos.push({ label: 'Bjorks' });
  if (radiografias.analisisUSP) analisisCefalometricos.push({ label: 'U.S.P' });
  if (radiografias.analisisTejidosBlancos) analisisCefalometricos.push({ label: 'Tejidos Blancos' });
  if (analisisCefalometricos.length) grouped['analisisCefalometricos'] = analisisCefalometricos;

  return grouped;
};

/**
 * Componente del Step 9: Presupuesto Consolidado
 * Integrado completamente con el backend
 */
const BudgetStepComponent = ({
  selectedPatient,
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges,
  handleSaveProgress,
  markStepCompleted,
  readOnly = false,
  onBack
}: BudgetStepProps) => {
  // Estado para datos del backend
  const [budgetData, setBudgetData] = useState<BudgetData>({
    savedBudget: null,
    treatmentPlan: null,
    definitiveDiagnosis: null,
    radiographyRequest: null,
    loading: true,
    error: null,
    saving: false
  });

  // Estado local para adelanto y observaciones (edicion en tiempo real)
  const [localAdvance, setLocalAdvance] = useState<number>(0);
  const [localObservations, setLocalObservations] = useState<string>('');

  // Estado para promociones
  const [availablePromotions, setAvailablePromotions] = useState<PromotionData[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  // Obtener consultationId desde currentRecord
  const consultationId = currentRecord?.consultationId ||
    currentRecord?.consultation_id ||
    currentRecord?.lastConsultationId;

  /**
   * Carga los datos del presupuesto desde el backend
   */
  const loadBudgetData = useCallback(async () => {
    if (!consultationId) {
      setBudgetData(prev => ({
        ...prev,
        loading: false,
        error: 'No se encontro ID de consulta para cargar el presupuesto'
      }));
      return;
    }

    setBudgetData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Cargar en paralelo: Presupuesto guardado, Plan de tratamiento, Diagnostico Definitivo y Radiografia
      const [budgetResponse, treatmentPlanResponse, definitiveDiagnosisResponse, radiographyResponse] = await Promise.all([
        consultationBudgetsApi.getBudget(consultationId).catch(() => null),
        consultationsApi.getConsultationTreatmentPlan(consultationId).catch(() => null),
        consultationsApi.getDefinitiveDiagnosis(consultationId).catch(() => null),
        radiographyRequestsApi.getRequestByConsultation(consultationId).catch(() => null)
      ]);

      const savedBudget = budgetResponse?.data || null;

      // Log para debugging del presupuesto consolidado
      console.log('[BudgetStep] === DATOS CARGADOS PARA PRESUPUESTO ===');
      console.log('[BudgetStep] consultationId:', consultationId);
      console.log('[BudgetStep] savedBudget:', savedBudget);
      console.log('[BudgetStep] treatmentPlanResponse:', treatmentPlanResponse);
      console.log('[BudgetStep] definitiveDiagnosisResponse:', definitiveDiagnosisResponse);
      console.log('[BudgetStep] definitiveDiagnosis conditions:', definitiveDiagnosisResponse?.data?.conditions?.length || 0);

      // Log detallado de las condiciones si existen
      if (definitiveDiagnosisResponse?.data?.conditions?.length > 0) {
        console.log('[BudgetStep] Primera condición (ejemplo):', definitiveDiagnosisResponse.data.conditions[0]);
        definitiveDiagnosisResponse.data.conditions.forEach((cond: any, idx: number) => {
          console.log(`[BudgetStep] Condición ${idx + 1}:`, {
            tooth: cond.tooth_number,
            condition_label: cond.condition_label,
            selected_procedure_id: cond.selected_procedure_id,
            selected_procedure_name: cond.selected_procedure_name,
            procedure_price: cond.procedure_price,
            price: cond.price
          });
        });
      }
      console.log('[BudgetStep] Summary:', definitiveDiagnosisResponse?.data?.summary);

      // Inicializar estados locales con datos del backend
      if (savedBudget) {
        setLocalAdvance(savedBudget.advance_payment || 0);
        setLocalObservations(savedBudget.observations || '');
      }

      setBudgetData({
        savedBudget,
        treatmentPlan: treatmentPlanResponse?.data || null,
        definitiveDiagnosis: definitiveDiagnosisResponse?.data || null,
        radiographyRequest: radiographyResponse || null,
        loading: false,
        error: null,
        saving: false
      });

    } catch (error) {
      console.error('Error al cargar datos del presupuesto:', error);
      setBudgetData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos del presupuesto'
      }));
    }
  }, [consultationId]);

  /**
   * Guarda el presupuesto en la base de datos
   * Nota: Esta funcion recibe los totales calculados como parametros
   */
  const saveBudgetToBackend = useCallback(async (
    calcSubtotal?: number,
    calcDiscountAmount?: number,
    calcDiscountType?: string | null,
    calcDiscountValue?: number,
    calcGrandTotal?: number,
    calcDefinitiveDiagnosisTotal?: number,
    calcTreatmentsTotal?: number,
    calcAdditionalServicesTotal?: number,
    calcExamsTotal?: number
  ) => {
    if (!consultationId) return;

    setBudgetData(prev => ({ ...prev, saving: true }));

    try {
      const response = await consultationBudgetsApi.upsertBudget(consultationId, {
        advancePayment: localAdvance,
        observations: localObservations,
        status: 'draft',
        subtotal: calcSubtotal,
        promotionId: selectedPromotionId,
        discountType: calcDiscountType,
        discountValue: calcDiscountValue,
        discountAmount: calcDiscountAmount,
        grandTotal: calcGrandTotal,
        definitiveDiagnosisTotal: calcDefinitiveDiagnosisTotal,
        treatmentsTotal: calcTreatmentsTotal,
        additionalServicesTotal: calcAdditionalServicesTotal,
        examsTotal: calcExamsTotal
      });

      if (response.success && response.data) {
        setBudgetData(prev => ({
          ...prev,
          savedBudget: response.data,
          saving: false
        }));
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      setBudgetData(prev => ({ ...prev, saving: false }));
    }
  }, [consultationId, localAdvance, localObservations, selectedPromotionId, setUnsavedChanges]);

  /**
   * Sincroniza los totales desde las tablas relacionadas (fuerza recalculo por triggers)
   */
  const syncTotals = useCallback(async () => {
    if (!consultationId) return;

    setBudgetData(prev => ({ ...prev, saving: true }));

    try {
      const response = await consultationBudgetsApi.syncBudgetTotals(consultationId);

      if (response.success && response.data) {
        setBudgetData(prev => ({
          ...prev,
          savedBudget: response.data,
          saving: false
        }));
      }
    } catch (error) {
      console.error('Error al sincronizar totales:', error);
      setBudgetData(prev => ({ ...prev, saving: false }));
    }
  }, [consultationId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  // Cargar promociones activas
  useEffect(() => {
    const loadPromotions = async () => {
      setLoadingPromotions(true);
      try {
        const promotions = await promotionsApi.getActiveClinicPromotions();
        setAvailablePromotions(promotions);
      } catch (error) {
        console.error('Error al cargar promociones:', error);
      } finally {
        setLoadingPromotions(false);
      }
    };
    loadPromotions();
  }, []);

  // Inicializar promocion seleccionada desde datos guardados
  useEffect(() => {
    if (budgetData.savedBudget?.promotion_id) {
      setSelectedPromotionId(budgetData.savedBudget.promotion_id);
    }
  }, [budgetData.savedBudget?.promotion_id]);

  // Datos del plan de tratamiento y presupuesto guardado
  const savedBudget = budgetData.savedBudget;
  const treatmentPlan = budgetData.treatmentPlan;
  const definitiveDiagnosis = budgetData.definitiveDiagnosis;
  const radiographyRequest = budgetData.radiographyRequest;

  // Extraer datos del plan de tratamiento
  // FALLBACK: Si no hay datos de BD, usar datos locales de currentRecord
  const bdTreatments: TreatmentItem[] = treatmentPlan?.treatments || [];
  const localTreatments = currentRecord?.appliedTreatments || [];

  // Mapear tratamientos locales al formato esperado por el componente
  const mappedLocalTreatments: TreatmentItem[] = localTreatments.map((t: any) => ({
    consultation_treatment_item_id: t.id,
    treatment_id: t.treatmentId ? parseInt(t.treatmentId) : undefined,
    treatment_name: t.treatmentName || 'Tratamiento',
    total_amount: t.totalAmount || 0,
    display_order: 0,
    conditions: (t.conditions || []).map((c: any) => ({
      condition_id: c.id,
      label: c.label || '',
      price: c.price || 0,
      quantity: c.quantity || 1,
      subtotal: (c.price || 0) * (c.quantity || 1),
      display_order: 0
    }))
  }));

  // Contar total de condiciones en cada fuente
  const bdConditionsCount = bdTreatments.reduce((sum, t) => sum + (t.conditions?.length || 0), 0);
  const localConditionsCount = mappedLocalTreatments.reduce((sum, t) => sum + (t.conditions?.length || 0), 0);

  // PRIORIDAD: Usar datos LOCALES si tienen mas items (el usuario agrego algo en la sesion actual)
  // o si no hay datos de BD. Los datos locales reflejan el estado actual del paso 8.
  const treatments: TreatmentItem[] = (localConditionsCount >= bdConditionsCount && localConditionsCount > 0)
    ? mappedLocalTreatments
    : (bdTreatments.length > 0 ? bdTreatments : mappedLocalTreatments);

  // FALLBACK para servicios adicionales
  const bdAdditionalServices: AdditionalService[] = treatmentPlan?.additionalServices || [];
  const localAdditionalServices = currentRecord?.selectedAdditionalServices || [];

  // Mapear servicios adicionales locales al formato esperado
  const mappedLocalAdditionalServices: AdditionalService[] = localAdditionalServices.map((s: any) => ({
    consultation_additional_service_id: undefined,
    service_type: s.type || 'other',
    service_name: s.name || 'Servicio',
    modality: s.modality || null,
    description: s.description || null,
    original_monto_total: s.originalFields?.montoTotal || 0,
    original_inicial: s.originalFields?.inicial || 0,
    original_mensual: s.originalFields?.mensual || 0,
    edited_monto_total: s.editedFields?.montoTotal || s.originalFields?.montoTotal || 0,
    edited_inicial: s.editedFields?.inicial || s.originalFields?.inicial || 0,
    edited_mensual: s.editedFields?.mensual || s.originalFields?.mensual || 0,
    display_order: 0
  }));

  // Usar datos de BD si existen, sino usar datos locales
  const additionalServices: AdditionalService[] = bdAdditionalServices.length > 0 ? bdAdditionalServices : mappedLocalAdditionalServices;

  // Datos de examenes del paso 4 (solicitud de radiografia)
  // FALLBACK: Si no hay datos de BD, usar datos locales de currentRecord.diagnosticPlan
  const tomografia3D = radiographyRequest?.request_data?.tomografia3D || currentRecord?.diagnosticPlan?.tomografia3D;
  const radiografias = radiographyRequest?.request_data?.radiografias || currentRecord?.diagnosticPlan?.radiografias;
  const pricingBreakdown = radiographyRequest?.pricing_data?.breakdown || [];

  // Log para debugging
  console.log('[BudgetStep] Tratamientos:', {
    desdeBD: bdTreatments.length,
    bdConditionsCount,
    desdeLocal: localTreatments.length,
    localConditionsCount,
    usados: treatments.length,
    source: (localConditionsCount >= bdConditionsCount && localConditionsCount > 0) ? 'LOCAL (mas items)' : (bdTreatments.length > 0 ? 'BD' : 'LOCAL')
  });
  console.log('[BudgetStep] Servicios adicionales:', {
    desdeBD: bdAdditionalServices.length,
    desdeLocal: localAdditionalServices.length,
    usados: additionalServices.length,
    source: bdAdditionalServices.length > 0 ? 'BD' : 'LOCAL'
  });
  console.log('[BudgetStep] Exámenes:', {
    tomografia3D: !!tomografia3D,
    radiografias: !!radiografias,
    pricingBreakdown: pricingBreakdown.length,
    localDiagnosticPlan: !!currentRecord?.diagnosticPlan
  });

  // Procesar examenes para visualizacion
  const tomografiaData = processTomografia(tomografia3D);
  const radiografiasData = processRadiografias(radiografias);
  const hasTomografia = Object.keys(tomografiaData).length > 0;
  const hasRadiografias = Object.keys(radiografiasData).length > 0;
  const hasExams = hasTomografia || hasRadiografias;

  // Calcular totales - Priorizar el cálculo desde el diagnóstico definitivo si es mayor a 0
  // Los valores guardados pueden estar desactualizados si el usuario modificó procedimientos
  const definitiveDiagnosisFromSummary = Number(definitiveDiagnosis?.summary?.total_price) || 0;

  // FALLBACK: Calcular total desde datos locales si no hay datos de BD
  const localConditionsForTotal = currentRecord?.definitiveConditions || [];
  const localTotal = localConditionsForTotal.reduce((sum: number, cond: any) => {
    // Priorizar procedure_price sobre price
    const condPrice = cond.procedure_price ?? cond.definitive?.price ?? cond.price ?? 0;
    return sum + Number(condPrice);
  }, 0);

  // Prioridad: BD summary > BD guardado > Local calculado
  const definitiveDiagnosisTotal = definitiveDiagnosisFromSummary > 0
    ? definitiveDiagnosisFromSummary
    : (Number(savedBudget?.definitive_diagnosis_total) || Number(treatmentPlan?.definitive_diagnosis_total) || localTotal);

  console.log('[BudgetStep] Total diagnóstico definitivo:', {
    fromSummary: definitiveDiagnosisFromSummary,
    fromSavedBudget: savedBudget?.definitive_diagnosis_total,
    fromTreatmentPlan: treatmentPlan?.definitive_diagnosis_total,
    fromLocal: localTotal,
    final: definitiveDiagnosisTotal
  });

  // Calcular total de tratamientos desde los datos que estamos usando
  const calculatedTreatmentsTotal = treatments.reduce((sum: number, t: TreatmentItem) => {
    return sum + (t.total_amount || 0);
  }, 0);

  // Si estamos usando datos locales (porque tienen mas items), usar el total calculado
  // de lo contrario, usar el total guardado si existe
  const usingLocalTreatments = (localConditionsCount >= bdConditionsCount && localConditionsCount > 0);
  const treatmentsTotal = usingLocalTreatments
    ? calculatedTreatmentsTotal
    : (Number(savedBudget?.treatments_total) || Number(treatmentPlan?.treatments_total) || calculatedTreatmentsTotal);

  // FALLBACK: Calcular total de servicios adicionales desde datos locales
  const localAdditionalServicesTotal = additionalServices.reduce((sum: number, s: AdditionalService) => {
    return sum + (s.edited_monto_total || s.original_monto_total || 0);
  }, 0);

  const additionalServicesTotal = Number(savedBudget?.additional_services_total) ||
    Number(treatmentPlan?.additional_services_total) || localAdditionalServicesTotal;

  // FALLBACK: Calcular total de exámenes desde datos locales
  const localExamsTotal = currentRecord?.diagnosticPlan?.totalCost || 0;

  // Total de examenes desde savedBudget o radiographyRequest o local
  const examsTotal = savedBudget?.exams_total ||
    radiographyRequest?.pricing_data?.finalPrice ||
    radiographyRequest?.pricing_data?.suggestedPrice ||
    pricingBreakdown.reduce((sum: number, item: any) => sum + (item.price || 0), 0) ||
    localExamsTotal;

  console.log('[BudgetStep] Totales calculados:', {
    treatmentsTotal,
    calculatedTreatmentsTotal,
    usingLocalTreatments,
    additionalServicesTotal,
    localAdditionalServicesTotal,
    examsTotal,
    localExamsTotal
  });

  // Subtotal antes del descuento
  const subtotal = definitiveDiagnosisTotal + treatmentsTotal + additionalServicesTotal + examsTotal;

  // Obtener promocion seleccionada
  const selectedPromotion = availablePromotions.find(p => p.promotion_id === selectedPromotionId);

  // Calcular descuento basado en la promocion seleccionada
  const calculateDiscount = () => {
    if (!selectedPromotion) return { discountAmount: 0, discountType: null, discountValue: 0 };

    const discountType = selectedPromotion.discount_type;
    const discountValue = Number(selectedPromotion.discount_value) || 0;
    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
      // Aplicar tope maximo si existe
      if (selectedPromotion.max_discount_amount && discountAmount > Number(selectedPromotion.max_discount_amount)) {
        discountAmount = Number(selectedPromotion.max_discount_amount);
      }
    } else if (discountType === 'fixed_amount' || discountType === 'fixed') {
      discountAmount = discountValue;
    }

    return { discountAmount, discountType, discountValue };
  };

  const { discountAmount, discountType, discountValue } = calculateDiscount();

  // Total general con descuento aplicado
  const consolidatedTotal = subtotal - discountAmount;

  // Calculos financieros - usar estado local para edicion en tiempo real
  const balance = consolidatedTotal - localAdvance;

  // Obtener procedimientos del diagnostico definitivo
  // FALLBACK: Si no hay datos de BD, usar los datos locales de currentRecord.definitiveConditions
  const bdConditions = definitiveDiagnosis?.conditions || [];
  const localConditions = currentRecord?.definitiveConditions || [];

  // Mapear condiciones locales al formato esperado por el componente
  const mappedLocalConditions = localConditions.map((cond: any) => ({
    definitive_condition_id: cond.definitive_condition_id || cond.definitiveConditionId || cond.id,
    tooth_number: cond.toothNumber || cond.tooth_number,
    condition_label: cond.definitive?.conditionLabel || cond.condition_label || cond._conditionName || '',
    condition_name: cond._conditionName || cond.definitive?.conditionLabel || '',
    price: cond.definitive?.price || cond.price || 0,
    procedure_price: cond.procedure_price ?? null,
    selected_procedure_id: cond.selected_procedure_id || cond.selectedProcedureId || null,
    selected_procedure_name: cond.selected_procedure_name || cond._selected_procedure_name || null,
    surfaces_array: cond.surfaces || cond.definitive?.surfaces || [],
    procedures: cond._procedures || cond.definitive?.procedures || []
  }));

  // Usar datos de BD si existen, sino usar datos locales mapeados
  const definitiveDiagnosisConditions = bdConditions.length > 0 ? bdConditions : mappedLocalConditions;

  // Log para debugging
  console.log('[BudgetStep] Usando condiciones:', {
    desdeBD: bdConditions.length,
    desdeLocal: localConditions.length,
    total: definitiveDiagnosisConditions.length,
    source: bdConditions.length > 0 ? 'BD' : 'LOCAL'
  });

  // Renderizar estado de carga
  if (budgetData.loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Cargando presupuesto consolidado...</p>
        </div>
      </div>
    );
  }

  // Renderizar error
  if (budgetData.error && !treatmentPlan && !definitiveDiagnosis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-gray-700 text-lg mb-2">No hay datos de presupuesto disponibles</p>
          <p className="text-gray-500 text-sm">Complete primero el Plan de Tratamiento (Paso 8)</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al Plan de Tratamiento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Presupuesto Consolidado</h3>
              <p className="text-green-100 mt-1">Resumen completo de costos del tratamiento</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100">Total General</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(Number(consolidatedTotal || 0))}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Informacion del Paciente */}
        {selectedPatient && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Documento:</span> {selectedPatient.documentType}: {selectedPatient.documentNumber}
                  </div>
                  <div>
                    <span className="font-medium">Telefono:</span> {selectedPatient.phone}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-PE')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === GRID DE 2 COLUMNAS: Procedimientos + Tratamientos === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* COLUMNA 1: Procedimientos a Realizar */}
          <div className="bg-white rounded-lg border border-blue-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Procedimientos</span>
              </div>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {definitiveDiagnosisConditions.length}
              </span>
            </div>
            <div className="flex-1 divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {definitiveDiagnosisConditions.length === 0 ? (
                <p className="text-sm text-gray-400 p-3 text-center">Sin procedimientos</p>
              ) : (
                definitiveDiagnosisConditions.map((condition, index) => {
                  // CORREGIDO: Priorizar procedure_price (precio del procedimiento seleccionado) sobre price (precio base)
                  const price = Number(condition.procedure_price ?? condition.price ?? condition.condition_price_base ?? 0);
                  const conditionName = condition.condition_label || condition.condition_name || '';
                  const toothNumber = condition.tooth_number || '-';
                  const surfaces = condition.surfaces_array || [];
                  const procedures = condition.procedures || [];

                  // CORREGIDO: Priorizar selected_procedure_name (procedimiento SELECCIONADO por el doctor)
                  // sobre procedures[0] (procedimiento sugerido del catálogo)
                  const mainProcedure = condition.selected_procedure_name
                    || (procedures.length > 0 ? procedures[0].procedure_name : null)
                    || conditionName
                    || 'Procedimiento';

                  // Log para debugging (remover en producción)
                  console.log('[BudgetStep] Condition:', {
                    tooth: toothNumber,
                    conditionName,
                    selected_procedure_name: condition.selected_procedure_name,
                    selected_procedure_id: condition.selected_procedure_id,
                    procedure_price: condition.procedure_price,
                    price: condition.price,
                    finalPrice: price,
                    mainProcedure
                  });

                  return (
                    <div key={condition.definitive_condition_id || index} className="px-3 py-2 hover:bg-blue-50/50 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{mainProcedure}</p>
                        <div className="flex items-center gap-1.5 text-xs flex-wrap">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{toothNumber}</span>
                          {surfaces.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                              {surfaces.join('-')}
                            </span>
                          )}
                          {/* Mostrar condición base si hay procedimiento seleccionado */}
                          {condition.selected_procedure_name && conditionName && (
                            <span className="truncate text-gray-400">({conditionName})</span>
                          )}
                          {!condition.selected_procedure_name && (
                            <span className="truncate text-gray-400">{conditionName}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-blue-600 text-sm whitespace-nowrap">{formatCurrency(price)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="bg-blue-50 px-3 py-2 flex justify-between items-center border-t border-blue-200 mt-auto">
              <span className="text-xs font-medium text-gray-600">Subtotal</span>
              <span className="font-bold text-blue-600">{formatCurrency(Number(definitiveDiagnosisTotal || 0))}</span>
            </div>
          </div>

          {/* COLUMNA 2: Tratamientos Aplicados */}
          <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Tratamientos</span>
              </div>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {treatments.length}
              </span>
            </div>
            <div className="flex-1 max-h-64 overflow-y-auto">
              {treatments.length === 0 ? (
                <p className="text-sm text-gray-400 p-3 text-center">Sin tratamientos</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-1.5">Descripción</th>
                      <th className="text-center px-1 py-1.5 w-10">Cant</th>
                      <th className="text-right px-1 py-1.5 w-16">P.Unit</th>
                      <th className="text-right px-2 py-1.5 w-18">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {treatments.map((treatment, tIndex) => (
                      <React.Fragment key={`treat-group-${treatment.consultation_treatment_item_id || tIndex}`}>
                        {/* Fila del tratamiento (header) */}
                        <tr className="bg-indigo-50/70">
                          <td colSpan={3} className="px-3 py-1.5">
                            <p className="font-semibold text-indigo-800 text-sm">{treatment.treatment_name}</p>
                          </td>
                          <td className="text-right px-2 py-1.5 font-bold text-indigo-600">
                            {formatCurrency(Number(treatment.total_amount || 0))}
                          </td>
                        </tr>
                        {/* Filas de condiciones (items desglosados) */}
                        {treatment.conditions && treatment.conditions.map((cond, cIndex) => (
                          <tr key={`cond-${tIndex}-${cond.condition_id || cIndex}`} className="hover:bg-gray-50">
                            <td className="px-3 py-1 pl-6 text-gray-700 text-xs">
                              <span className="text-gray-400 mr-1">•</span>
                              {cond.label}
                            </td>
                            <td className="text-center px-1 py-1 text-gray-600 text-xs">
                              {cond.quantity || 1}
                            </td>
                            <td className="text-right px-1 py-1 text-gray-600 text-xs">
                              {formatCurrency(Number(cond.price || 0))}
                            </td>
                            <td className="text-right px-2 py-1 text-gray-700 text-xs font-medium">
                              {formatCurrency(Number(cond.subtotal || (cond.price || 0) * (cond.quantity || 1)))}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-indigo-50 px-3 py-2 flex justify-between items-center border-t border-indigo-200 mt-auto">
              <span className="text-xs font-medium text-gray-600">Subtotal</span>
              <span className="font-bold text-indigo-600">{formatCurrency(Number(treatmentsTotal || 0))}</span>
            </div>
          </div>
        </div>

        {/* === GRID DE 2 COLUMNAS: Servicios + Exámenes === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Servicios Adicionales - Tabla profesional */}
          <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Servicios Adicionales</span>
              </div>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{additionalServices.length}</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {additionalServices.length === 0 ? (
                <p className="text-sm text-gray-400 p-3 text-center">Sin servicios</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Servicios individuales (Ortodoncia e Implantes) */}
                  {additionalServices
                    .filter(s => s.service_type !== 'prosthesis')
                    .map((service, index) => {
                      const montoTotal = Number(service.edited_monto_total || service.original_monto_total || 0);
                      const inicial = Number(service.edited_inicial || service.original_inicial || 0);
                      const mensual = Number(service.edited_mensual || service.original_mensual || 0);
                      const serviceTypeIcon = service.service_type === 'orthodontic' ? '🦷' : '⚕️';
                      const serviceTypeLabel = service.service_type === 'orthodontic' ? 'Ortodoncia' : 'Implante';

                      return (
                        <div key={service.consultation_additional_service_id || index} className="p-3 hover:bg-orange-50/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">{serviceTypeIcon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{service.service_name}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">{serviceTypeLabel}</span>
                                {service.modality && (
                                  <span className="text-gray-500">{service.modality.replace(/_/g, ' ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="text-left px-2 py-1 text-gray-500 font-medium">Concepto</th>
                                  <th className="text-right px-2 py-1 text-gray-500 font-medium">Monto</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                <tr>
                                  <td className="px-2 py-1.5 text-gray-700">Monto Total</td>
                                  <td className="px-2 py-1.5 text-right font-bold text-orange-600">{formatCurrency(montoTotal)}</td>
                                </tr>
                                {inicial > 0 && (
                                  <tr>
                                    <td className="px-2 py-1.5 text-gray-600">Pago Inicial</td>
                                    <td className="px-2 py-1.5 text-right text-gray-700">{formatCurrency(inicial)}</td>
                                  </tr>
                                )}
                                {mensual > 0 && (
                                  <tr>
                                    <td className="px-2 py-1.5 text-gray-600">Cuota Mensual</td>
                                    <td className="px-2 py-1.5 text-right text-gray-700">{formatCurrency(mensual)}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}

                  {/* Prótesis agrupadas en una sola tabla */}
                  {additionalServices.filter(s => s.service_type === 'prosthesis').length > 0 && (
                    <div className="p-3 hover:bg-orange-50/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🔧</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Prótesis</p>
                          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium text-xs">
                            {additionalServices.filter(s => s.service_type === 'prosthesis').length} item(s)
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="text-left px-2 py-1 text-gray-500 font-medium">Prótesis</th>
                              <th className="text-right px-2 py-1 text-gray-500 font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {additionalServices
                              .filter(s => s.service_type === 'prosthesis')
                              .map((service, idx) => {
                                const montoTotal = Number(service.edited_monto_total || service.original_monto_total || 0);
                                return (
                                  <tr key={service.consultation_additional_service_id || idx}>
                                    <td className="px-2 py-1.5 text-gray-700">{service.service_name}</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-orange-600">{formatCurrency(montoTotal)}</td>
                                  </tr>
                                );
                              })}
                            {/* Fila de subtotal de prótesis */}
                            <tr className="bg-orange-50">
                              <td className="px-2 py-1.5 text-gray-700 font-medium">Subtotal Prótesis</td>
                              <td className="px-2 py-1.5 text-right font-bold text-orange-700">
                                {formatCurrency(additionalServices
                                  .filter(s => s.service_type === 'prosthesis')
                                  .reduce((sum, s) => sum + Number(s.edited_monto_total || s.original_monto_total || 0), 0))}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-orange-50 px-3 py-2 flex justify-between items-center border-t border-orange-200">
              <span className="text-xs font-medium text-gray-600">Subtotal Servicios</span>
              <span className="font-bold text-orange-600">{formatCurrency(Number(additionalServicesTotal || 0))}</span>
            </div>
          </div>

          {/* Exámenes del Paso 4 (Plan Diagnóstico) */}
          <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Exámenes Solicitados</span>
              </div>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {pricingBreakdown.length || (hasTomografia ? Object.values(tomografiaData).flat().length : 0) + (hasRadiografias ? Object.values(radiografiasData).flat().length : 0)}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {!hasExams ? (
                <p className="text-sm text-gray-400 p-3 text-center">Sin exámenes solicitados</p>
              ) : (
                <div className="p-2 space-y-2">
                  {/* Tomografía 3D */}
                  {hasTomografia && (
                    <div className="rounded-lg border border-cyan-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 px-2 py-1.5 flex items-center gap-2 border-b border-cyan-200">
                        <Scan className="w-3.5 h-3.5 text-cyan-600" />
                        <span className="font-semibold text-cyan-800 text-xs">Tomografía 3D</span>
                      </div>
                      <div className="p-1.5 space-y-1.5 bg-white">
                        {Object.entries(tomografiaData).map(([catKey, items]) => {
                          const config = TOMO_CATEGORIES_CONFIG[catKey];
                          if (!config || !items || items.length === 0) return null;
                          return (
                            <div key={catKey} className={`rounded p-1.5 ${config.bgColor} border ${config.borderColor}`}>
                              <h5 className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${config.textColor}`}>
                                {config.title}
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className={`flex items-center gap-1 ${config.chipBg} px-1.5 py-0.5 rounded border ${config.borderColor}`}>
                                    <CheckCircle2 className={`w-3 h-3 ${config.textColor}`} />
                                    <span className={`text-xs font-medium ${config.textColor}`}>{item.label}</span>
                                    {item.details && item.details.length > 0 && (
                                      <span className="text-[10px] text-gray-500">({item.details.join(', ')})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Radiografías */}
                  {hasRadiografias && (
                    <div className="rounded-lg border border-teal-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-2 py-1.5 flex items-center gap-2 border-b border-teal-200">
                        <Radio className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold text-teal-800 text-xs">Radiografías</span>
                      </div>
                      <div className="p-1.5 space-y-1.5 bg-white">
                        {Object.entries(radiografiasData).map(([catKey, items]) => {
                          const config = RADIO_CATEGORIES_CONFIG[catKey];
                          if (!config || !items || items.length === 0) return null;
                          return (
                            <div key={catKey} className={`rounded p-1.5 ${config.bgColor} border ${config.borderColor}`}>
                              <h5 className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${config.textColor}`}>
                                {config.title}
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-col gap-0.5">
                                    <div className={`flex items-center gap-1 ${config.chipBg} px-1.5 py-0.5 rounded border ${config.borderColor}`}>
                                      <CheckCircle2 className={`w-3 h-3 ${config.textColor}`} />
                                      <span className={`text-xs font-medium ${config.textColor}`}>{item.label}</span>
                                      {item.details && item.details.length > 0 && (
                                        <span className="text-[10px] text-gray-500">({item.details.join(', ')})</span>
                                      )}
                                    </div>
                                    {/* Mostrar dientes seleccionados */}
                                    {item.teeth && (item.teeth.fisico?.length > 0 || item.teeth.digital?.length > 0) && (
                                      <div className="ml-4 flex flex-wrap gap-1">
                                        {item.teeth.fisico && item.teeth.fisico.length > 0 && (
                                          <div className="flex items-center gap-0.5">
                                            <span className="text-[9px] text-pink-600 font-medium">Físico:</span>
                                            {item.teeth.fisico.map((t: number) => (
                                              <span key={t} className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-pink-500 text-white rounded">
                                                {t}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        {item.teeth.digital && item.teeth.digital.length > 0 && (
                                          <div className="flex items-center gap-0.5">
                                            <span className="text-[9px] text-blue-600 font-medium">Digital:</span>
                                            {item.teeth.digital.map((t: number) => (
                                              <span key={t} className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-blue-500 text-white rounded">
                                                {t}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Desglose de precios de exámenes */}
                  {pricingBreakdown.length > 0 && (
                    <div className="rounded-lg border border-emerald-200 overflow-hidden">
                      <div className="bg-emerald-50 px-2 py-1.5 border-b border-emerald-200">
                        <span className="font-semibold text-emerald-800 text-xs">Desglose de Precios</span>
                      </div>
                      <div className="bg-white divide-y divide-gray-100">
                        {pricingBreakdown.map((item: any, index: number) => (
                          <div key={index} className="px-2 py-1.5 flex justify-between items-center text-xs">
                            <span className="text-gray-700 truncate flex-1">{item.service}</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(Number(item.price || 0))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-purple-50 px-3 py-2 flex justify-between items-center border-t border-purple-200">
              <span className="text-xs font-medium text-gray-600">Subtotal Exámenes</span>
              <span className="font-bold text-purple-600">{formatCurrency(Number(examsTotal || 0))}</span>
            </div>
          </div>
        </div>

        {/* === RESUMEN FINANCIERO COMPACTO === */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-lg border border-gray-200 p-4">
          {/* Boton para sincronizar totales */}
          <div className="flex justify-end mb-3">
            <button
              onClick={syncTotals}
              disabled={budgetData.saving || readOnly}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Sincronizar totales desde pasos anteriores"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${budgetData.saving ? 'animate-spin' : ''}`} />
              Sincronizar totales
            </button>
          </div>

          {/* === SELECTOR DE PROMOCIONES === */}
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-800">Aplicar Promoción</span>
              {loadingPromotions && (
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              )}
            </div>

            {availablePromotions.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedPromotionId || ''}
                  onChange={(e) => {
                    const newId = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedPromotionId(newId);
                    setUnsavedChanges(true);
                  }}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Sin promoción</option>
                  {availablePromotions.map((promo) => (
                    <option key={promo.promotion_id} value={promo.promotion_id}>
                      {promo.promotion_name} - {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)} OFF
                      {promo.promotion_code ? ` (${promo.promotion_code})` : ''}
                    </option>
                  ))}
                </select>

                {/* Mostrar detalles de promoción seleccionada */}
                {selectedPromotion && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{selectedPromotion.promotion_name}</p>
                        {selectedPromotion.promotion_code && (
                          <p className="text-xs text-orange-600 font-mono">Código: {selectedPromotion.promotion_code}</p>
                        )}
                        {selectedPromotion.description && (
                          <p className="text-xs text-gray-500 mt-1">{selectedPromotion.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-orange-600">
                          <Percent className="w-4 h-4" />
                          <span className="text-xl font-bold">
                            {selectedPromotion.discount_type === 'percentage'
                              ? `${selectedPromotion.discount_value}%`
                              : formatCurrency(selectedPromotion.discount_value)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">de descuento</p>
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-100 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Descuento aplicado:</span>
                        <span className="text-lg font-bold text-green-600">- {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {loadingPromotions ? 'Cargando promociones...' : 'No hay promociones disponibles'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Input Adelanto */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Adelanto (S/)</label>
              <input
                type="number"
                min="0"
                max={consolidatedTotal}
                value={localAdvance}
                onChange={(e) => {
                  const newAdvance = parseFloat(e.target.value) || 0;
                  setLocalAdvance(newAdvance);
                  setUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                disabled={readOnly}
              />
            </div>
            {/* Subtotal */}
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-lg font-bold text-gray-700">{formatCurrency(subtotal)}</p>
            </div>
            {/* Descuento */}
            <div className={`bg-white rounded-lg p-3 text-center border ${discountAmount > 0 ? 'border-orange-200' : 'border-gray-200'}`}>
              <p className="text-xs text-gray-500">Descuento</p>
              <p className={`text-lg font-bold ${discountAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                - {formatCurrency(discountAmount)}
              </p>
            </div>
            {/* Total Final */}
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <p className="text-xs text-gray-500">Total Final</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(consolidatedTotal)}</p>
            </div>
            {/* Saldo */}
            <div className="bg-white rounded-lg p-3 text-center border border-red-200">
              <p className="text-xs text-gray-500">Saldo</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {/* === OBSERVACIONES COMPACTAS === */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
          <textarea
            value={localObservations}
            onChange={(e) => {
              setLocalObservations(e.target.value);
              setUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none"
            rows={2}
            placeholder="Notas adicionales..."
            disabled={readOnly}
          />
        </div>

        {/* Botones de Navegacion */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 active:scale-98 transition-all font-medium shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver a Plan de Tratamiento
          </button>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                // Guardar presupuesto en el backend con los totales calculados
                await saveBudgetToBackend(subtotal, discountAmount, discountType, discountValue, consolidatedTotal, definitiveDiagnosisTotal, treatmentsTotal, additionalServicesTotal, examsTotal);
                // Tambien ejecutar handleSaveProgress para guardar currentRecord
                await handleSaveProgress();
              }}
              disabled={budgetData.saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 active:scale-98 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {budgetData.saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {budgetData.saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={async () => {
                // Guardar presupuesto en el backend antes de continuar
                await saveBudgetToBackend(subtotal, discountAmount, discountType, discountValue, consolidatedTotal, definitiveDiagnosisTotal, treatmentsTotal, additionalServicesTotal, examsTotal);
                // Actualizar el currentRecord local para consistencia
                setCurrentRecord((prev: any) => ({
                  ...prev,
                  consolidatedBudget: {
                    ...prev.consolidatedBudget,
                    definitiveDiagnosisTotal,
                    treatmentsTotal,
                    additionalServicesTotal,
                    examsTotal,
                    subtotal,
                    discountAmount,
                    totalCost: consolidatedTotal,
                    advance: localAdvance,
                    balance: balance,
                    observations: localObservations
                  }
                }));
                markStepCompleted(9);
              }}
              disabled={budgetData.saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-green-200 disabled:opacity-50"
            >
              Continuar a Tratamiento Realizado
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exportar el componente memoizado
export const BudgetStep = memo(BudgetStepComponent);
