/**
 * PatientIntegralHistory - PAGINA COMPLETA (no modal)
 *
 * Vista integral (READ-ONLY) del historial de atencion de un paciente.
 * Muestra las consultas organizadas en 10 secciones expandibles que corresponden
 * a los 10 pasos clinicos que el doctor completa durante la consulta.
 *
 * URL: /admin/patients/:patientId/integral-history
 * Uso exclusivo del Super Admin (SA) para revision de historial clinico completo.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { PatientApiService } from '../services/patientApiService';
import type {
  PatientFullIntegralHistory,
  IntegralConsultation,
} from '../services/patientApiService';
import { PatientModificationHistory } from '../components/patients/PatientModificationHistory';
import Odontogram from '@/components/odontogram/Odontogram';
import {
  Tomografia3DSection,
  RadiografiasSection,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  type Tomografia3DFormData,
  type RadiografiasFormData
} from '@/components/laboratory-form';
import {
  Stethoscope,
  Activity,
  FileText,
  TestTube,
  Pill,
  ClipboardList,
  CheckCircle,
  Heart,
  Receipt,
  Syringe,
  ChevronDown,
  ChevronRight,
  Eye,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowLeft,
  Clock,
  X,
  ZoomIn,
  ExternalLink,
  FileImage,
} from 'lucide-react';

// URL base del backend para construir URLs de archivos S3
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepConfig {
  id: number;
  title: string;
  icon: React.ElementType;
  color: string;
}

// ---------------------------------------------------------------------------
// Step config with colors
// ---------------------------------------------------------------------------

const STEP_CONFIG: StepConfig[] = [
  { id: 1, title: 'Examen Clinico', icon: Stethoscope, color: 'blue' },
  { id: 2, title: 'Odontograma', icon: Activity, color: 'green' },
  { id: 3, title: 'Diagnostico Presuntivo', icon: FileText, color: 'yellow' },
  { id: 4, title: 'Plan Diagnostico', icon: TestTube, color: 'orange' },
  { id: 5, title: 'Receta Medica', icon: Pill, color: 'indigo' },
  { id: 6, title: 'Resultados Auxiliares', icon: ClipboardList, color: 'cyan' },
  { id: 7, title: 'Diagnostico Definitivo', icon: CheckCircle, color: 'purple' },
  { id: 8, title: 'Plan de Tratamiento', icon: Heart, color: 'red' },
  { id: 9, title: 'Presupuesto', icon: Receipt, color: 'amber' },
  { id: 10, title: 'Tratamiento Realizado', icon: Syringe, color: 'teal' },
];

// ---------------------------------------------------------------------------
// Color map for Tailwind classes
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, { bg: string; bgLight: string; text: string; border: string; iconBg: string; ring: string; dot: string }> = {
  blue:   { bg: 'bg-blue-600',   bgLight: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   iconBg: 'bg-blue-100',   ring: 'ring-blue-400',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-600',  bgLight: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  iconBg: 'bg-green-100',  ring: 'ring-green-400',  dot: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-600', bgLight: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', iconBg: 'bg-yellow-100', ring: 'ring-yellow-400', dot: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-600', bgLight: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100', ring: 'ring-orange-400', dot: 'bg-orange-500' },
  indigo: { bg: 'bg-indigo-600', bgLight: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-100', ring: 'ring-indigo-400', dot: 'bg-indigo-500' },
  cyan:   { bg: 'bg-cyan-600',   bgLight: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   iconBg: 'bg-cyan-100',   ring: 'ring-cyan-400',   dot: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-600', bgLight: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100', ring: 'ring-purple-400', dot: 'bg-purple-500' },
  red:    { bg: 'bg-red-600',    bgLight: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    iconBg: 'bg-red-100',    ring: 'ring-red-400',    dot: 'bg-red-500' },
  amber:  { bg: 'bg-amber-600',  bgLight: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  iconBg: 'bg-amber-100',  ring: 'ring-amber-400',  dot: 'bg-amber-500' },
  teal:   { bg: 'bg-teal-600',   bgLight: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   iconBg: 'bg-teal-100',   ring: 'ring-teal-400',   dot: 'bg-teal-500' },
};

// ---------------------------------------------------------------------------
// Odontogram condition converter
// ---------------------------------------------------------------------------

const DB_TO_FRONTEND_SURFACE: Record<string, string> = {
  'V': 'vestibular', 'L': 'lingual', 'M': 'mesial',
  'D': 'distal', 'C': 'corona', 'O': 'corona',
  'I': 'corona', 'P': 'palatino'
};

const convertDBConditionToOdontogramFormat = (dbCondition: any): any => {
  let sectionId = 'general';
  if (dbCondition.surface_section) {
    sectionId = dbCondition.surface_section;
  } else if (dbCondition.surface_code) {
    sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_code] || dbCondition.surface_code;
  }

  let toothNumber = dbCondition.tooth_number;
  if (toothNumber && !toothNumber.includes('.') && toothNumber.length === 2) {
    toothNumber = `${toothNumber[0]}.${toothNumber[1]}`;
  }

  // Priorizar condition_state (estado real del registro) sobre color_type (catálogo)
  const state: 'good' | 'bad' = dbCondition.condition_state === 'good' ? 'good'
    : dbCondition.condition_state === 'bad' ? 'bad'
    : dbCondition.color_type === 'blue' ? 'good' : 'bad';
  const conditionId = dbCondition.dental_condition_code || dbCondition.condition_name || 'unknown';

  return {
    toothNumber, sectionId, conditionId, condition: conditionId,
    abbreviation: dbCondition.abbreviation, state,
    color: state === 'bad' ? 'red' : (dbCondition.color_type || 'blue'),
    notes: dbCondition.notes || dbCondition.description,
    symbol_type: dbCondition.symbol_type,
    fill_surfaces: dbCondition.fill_surfaces,
    dental_condition_id: dbCondition.dental_condition_id,
    tooth_position_id: dbCondition.tooth_position_id,
    tooth_surface_id: dbCondition.tooth_surface_id,
    condition_name: dbCondition.condition_name,
    connectedToothNumber: dbCondition.connected_tooth_number
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'S/ 0.00';
  return `S/ ${Number(value).toFixed(2)}`;
}

function hasContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function StatusBadge({ status }: { status: string }) {
  const lower = (status || '').toLowerCase();
  let colorClasses = 'bg-gray-100 text-gray-700';
  if (lower.includes('complet') || lower === 'done' || lower === 'realizado') {
    colorClasses = 'bg-green-100 text-green-700';
  } else if (lower.includes('progres') || lower.includes('parcial') || lower === 'in_progress') {
    colorClasses = 'bg-yellow-100 text-yellow-700';
  } else if (lower.includes('pend') || lower === 'pending') {
    colorClasses = 'bg-orange-100 text-orange-700';
  } else if (lower.includes('cancel') || lower.includes('rechaz')) {
    colorClasses = 'bg-red-100 text-red-700';
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}>
      {status}
    </span>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-6 justify-center">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400 italic">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image Lightbox Component
// ---------------------------------------------------------------------------

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section content checkers
// ---------------------------------------------------------------------------

function sectionHasContent(sectionId: number, c: IntegralConsultation | null): boolean {
  if (!c) return false;
  switch (sectionId) {
    case 1:
      return !!(c.chief_complaint || c.vital_signs || c.general_condition ||
        c.extraoral_exam || c.intraoral_exam ||
        (c.extraoral_exam_images?.length) || (c.intraoral_exam_images?.length));
    case 2:
      return !!(c.odontogram?.conditions?.length);
    case 3:
      return !!(c.odontogram?.conditions?.length);
    case 4:
      return !!(c.radiography_requests?.length);
    case 5:
      return !!(c.prescriptions?.length);
    case 6: {
      const hasExam = !!(c.exam_results?.doctor_observations || c.exam_results?.external_files?.length);
      const hasRadResults = !!(c.radiography_requests?.some((r: any) => r.results?.length > 0));
      return hasExam || hasRadResults;
    }
    case 7:
      return !!(c.definitive_diagnosis?.length);
    case 8:
      return !!(c.treatment_plan?.items?.length || c.treatment_plan?.additional_services?.length);
    case 9:
      return !!(c.budget && (c.budget.grand_total != null || c.budget.balance != null));
    case 10:
      return !!(c.procedure_history?.length || c.evolution_odontogram?.length || c.completed_items?.length);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const sectionContentVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { height: { duration: 0.3, ease: 'easeOut' }, opacity: { duration: 0.25, delay: 0.05 } }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.25, ease: 'easeIn' }, opacity: { duration: 0.15 } }
  },
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

// ---------------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------------

type ActiveTab = 'integral' | 'modifications';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PatientIntegralHistory = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PatientFullIntegralHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 1: true });
  const [activeTab, setActiveTab] = useState<ActiveTab>('integral');
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [presupuestoExpanded, setPresupuestoExpanded] = useState<{ dx: boolean; tx: boolean; svc: boolean }>({
    dx: false, tx: false, svc: false
  });
  const [examModalOpen, setExamModalOpen] = useState(false);

  // ---- Data loading ----
  const loadData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await PatientApiService.loadPatientFullIntegralHistory(patientId);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al cargar historial';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Redirect if no patientId ----
  if (!patientId) {
    navigate('/admin/patients');
    return null;
  }

  // ---- Derived state ----
  const consultations = data?.consultations ?? [];
  const selectedConsultation: IntegralConsultation | null = consultations[selectedIndex] ?? null;
  const summary = data?.summary;
  const patientName = data?.patient
    ? `${data.patient.first_name} ${data.patient.last_name}`
    : 'Paciente';

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    STEP_CONFIG.forEach((s) => { all[s.id] = true; });
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // Section progress: count how many sections have data
  const sectionProgressCount = selectedConsultation
    ? STEP_CONFIG.filter((s) => sectionHasContent(s.id, selectedConsultation)).length
    : 0;

  // =========================================================================
  // SECTION RENDERERS
  // =========================================================================

  const renderExamenClinico = () => {
    const c = selectedConsultation;
    if (!c) return <EmptySection text="Sin datos de examen clinico" />;
    const vs = c.vital_signs || {};

    return (
      <div className="space-y-5">
        {c.chief_complaint && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Motivo de consulta</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.chief_complaint}</p>
          </div>
        )}
        {c.present_illness && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Enfermedad actual</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.present_illness}</p>
          </div>
        )}
        {hasContent(vs) && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2.5">Signos vitales</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {vs.presion_arterial && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 text-center border border-blue-100 shadow-sm">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Presion Arterial</p>
                  <p className="text-lg font-bold text-blue-800 mt-1">{vs.presion_arterial}</p>
                </div>
              )}
              {vs.frecuencia_cardiaca && (
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3.5 text-center border border-red-100 shadow-sm">
                  <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Frec. Cardiaca</p>
                  <p className="text-lg font-bold text-red-800 mt-1">{vs.frecuencia_cardiaca}</p>
                </div>
              )}
              {vs.frecuencia_respiratoria && (
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3.5 text-center border border-green-100 shadow-sm">
                  <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">Frec. Respiratoria</p>
                  <p className="text-lg font-bold text-green-800 mt-1">{vs.frecuencia_respiratoria}</p>
                </div>
              )}
              {vs.peso && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3.5 text-center border border-orange-100 shadow-sm">
                  <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-wider">Peso</p>
                  <p className="text-lg font-bold text-orange-800 mt-1">{vs.peso}</p>
                </div>
              )}
              {vs.talla && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3.5 text-center border border-purple-100 shadow-sm">
                  <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wider">Talla</p>
                  <p className="text-lg font-bold text-purple-800 mt-1">{vs.talla}</p>
                </div>
              )}
              {vs.temperatura && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3.5 text-center border border-amber-100 shadow-sm">
                  <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Temperatura</p>
                  <p className="text-lg font-bold text-amber-800 mt-1">{vs.temperatura}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {c.general_condition && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Estado general</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.general_condition}</p>
          </div>
        )}
        {(c.extraoral_exam || (c.extraoral_exam_images?.length ?? 0) > 0) && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Examen extraoral</h5>
            {c.extraoral_exam && <p className="text-sm text-gray-800 mb-3">{c.extraoral_exam}</p>}
            {(c.extraoral_exam_images?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-3">
                {c.extraoral_exam_images.map((url: string, i: number) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Extraoral ${i + 1}`}
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-200 group-hover:border-blue-400 group-hover:shadow-lg group-hover:scale-105"
                      onClick={() => setLightboxImage({ src: url, alt: `Extraoral ${i + 1}` })}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center pointer-events-none">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {(c.intraoral_exam || (c.intraoral_exam_images?.length ?? 0) > 0) && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Examen intraoral</h5>
            {c.intraoral_exam && <p className="text-sm text-gray-800 mb-3">{c.intraoral_exam}</p>}
            {(c.intraoral_exam_images?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-3">
                {c.intraoral_exam_images.map((url: string, i: number) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Intraoral ${i + 1}`}
                      className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-200 group-hover:border-blue-400 group-hover:shadow-lg group-hover:scale-105"
                      onClick={() => setLightboxImage({ src: url, alt: `Intraoral ${i + 1}` })}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center pointer-events-none">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {c.diagnosis && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Diagnostico</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.diagnosis}</p>
          </div>
        )}
        {c.recommendations && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Recomendaciones</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.recommendations}</p>
          </div>
        )}
        {c.notes && (
          <div>
            <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">Notas</h5>
            <p className="text-sm text-gray-800 bg-blue-50/50 rounded-lg p-3 border border-blue-100">{c.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderOdontograma = () => {
    const conditions = selectedConsultation?.odontogram?.conditions;
    if (!conditions?.length) return <EmptySection text="Sin condiciones registradas" />;

    const convertedConditions = conditions.map(convertDBConditionToOdontogramFormat);

    return (
      <div className="space-y-4">
        {/* Visual Odontogram Diagram */}
        <div className="bg-green-50/30 rounded-xl border border-green-100 overflow-hidden">
          <Odontogram
            readOnly={true}
            initialConditions={convertedConditions}
            hideStatsCards={true}
            className="p-2"
          />
        </div>

        {/* Conditions summary table below the diagram */}
        <div>
          <h5 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Resumen de condiciones ({conditions.length})</h5>
          <div className="overflow-x-auto rounded-xl border border-green-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-4 py-2.5 font-semibold text-green-700 text-left text-xs uppercase tracking-wider">Pieza</th>
                  <th className="px-4 py-2.5 font-semibold text-green-700 text-left text-xs uppercase tracking-wider">Condicion</th>
                  <th className="px-4 py-2.5 font-semibold text-green-700 text-left text-xs uppercase tracking-wider">Superficie</th>
                  <th className="px-4 py-2.5 font-semibold text-green-700 text-right text-xs uppercase tracking-wider">Precio</th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((cond: any, i: number) => (
                  <tr key={i} className={`transition-colors hover:bg-green-50/60 ${i % 2 === 0 ? 'bg-white' : 'bg-green-50/20'}`}>
                    <td className="px-4 py-2.5 font-mono text-gray-800 font-medium">{cond.tooth_number ?? '-'}</td>
                    <td className="px-4 py-2.5 text-gray-800">{cond.condition_name || cond.condition_label || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{cond.surface_name || cond.surface_code || cond.surface_section || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-800 text-right font-medium">{cond.price != null ? formatCurrency(cond.price) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDiagnosticoPresuntivo = () => {
    const conditions = selectedConsultation?.odontogram?.conditions;
    if (!conditions?.length) return <EmptySection text="Sin diagnostico presuntivo" />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {conditions.map((cond: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-800">{cond.condition_name || cond.condition_label || 'Condicion'}</span>
                {cond.tooth_number && <span className="ml-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-mono">Pieza {cond.tooth_number}</span>}
              </div>
              {cond.cie10_code && (
                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-mono font-semibold">CIE-10: {cond.cie10_code}</span>
              )}
            </div>
            {(cond.surface_name || cond.surface_code || cond.surface_section) && (
              <p className="text-xs text-yellow-700 mt-2">Superficie: {cond.surface_name || cond.surface_code || cond.surface_section}</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPlanDiagnostico = () => {
    const requests = selectedConsultation?.radiography_requests;
    if (!requests?.length) return <EmptySection text="Sin solicitudes de radiografia" />;

    return (
      <div className="space-y-4">
        {requests.map((req: any, i: number) => {
          // Parsear request_data (JSONB) que contiene la seleccion detallada del doctor
          const requestData = req.request_data || {};
          const tomografia3D: Tomografia3DFormData = {
            ...INITIAL_TOMOGRAFIA_FORM,
            ...requestData.tomografia3D
          };
          const radiografias: RadiografiasFormData = {
            ...INITIAL_RADIOGRAFIAS_FORM,
            ...requestData.radiografias
          };

          // Verificar si hay selecciones reales
          const hasTomografiaSelection = Object.values(tomografia3D).some(
            v => v === true || (typeof v === 'string' && v.trim())
          );
          const hasRadiografiasSelection = Object.values(radiografias).some(
            v => v === true || (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v.trim())
          );

          // Label legible para el tipo
          const typeLabel = req.radiography_type === 'diagnostic_plan'
            ? (hasTomografiaSelection && hasRadiografiasSelection ? 'Tomografia 3D + Radiografias'
               : hasTomografiaSelection ? 'Tomografia 3D'
               : hasRadiografiasSelection ? 'Radiografias'
               : 'Plan Diagnostico')
            : (req.radiography_type || 'Plan Diagnostico');

          // Status badge
          const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
            pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
            in_progress: { label: 'En proceso', bg: 'bg-blue-100', text: 'text-blue-800' },
            completed: { label: 'Completado', bg: 'bg-green-100', text: 'text-green-800' },
            delivered: { label: 'Entregado', bg: 'bg-emerald-100', text: 'text-emerald-800' },
            cancelled: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800' },
          };
          const sts = statusConfig[req.request_status] || statusConfig.pending;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <TestTube className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{typeLabel}</span>
                    <p className="text-xs text-orange-600">
                      Fecha: {formatTimestampToLima(req.request_date, 'date')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sts.bg} ${sts.text}`}>
                  {sts.label}
                </span>
              </div>

              {/* Indicacion clinica */}
              {req.clinical_indication && (
                <p className="text-sm text-gray-700 mb-3 bg-white/60 rounded-lg p-2.5 border border-orange-100">
                  {req.clinical_indication}
                </p>
              )}

              {/* Tomografia 3D - componente visual reutilizado del portal */}
              {hasTomografiaSelection && (
                <div className="mb-3">
                  <Tomografia3DSection
                    mode="view"
                    colorTheme="cyan"
                    showPrices={false}
                    formData={tomografia3D}
                  />
                </div>
              )}

              {/* Radiografias - componente visual reutilizado del portal */}
              {hasRadiografiasSelection && (
                <div className="mb-3">
                  <RadiografiasSection
                    mode="view"
                    colorTheme="cyan"
                    showPrices={false}
                    formData={radiografias}
                  />
                </div>
              )}

              {/* Si no hay datos parseables, mostrar fallback */}
              {!hasTomografiaSelection && !hasRadiografiasSelection && (
                <p className="text-xs text-orange-600 italic">Solicitud registrada sin detalles adicionales</p>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderRecetaMedica = () => {
    const prescriptions = selectedConsultation?.prescriptions;
    if (!prescriptions?.length) return <EmptySection text="Sin recetas medicas" />;
    return (
      <div className="space-y-4">
        {prescriptions.map((rx: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Pill className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">Receta {i + 1}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatTimestampToLima(rx.prescription_date, 'date')}</span>
                  {rx.dentist_name && <span>- Dr(a). {rx.dentist_name}</span>}
                </div>
              </div>
            </div>
            {rx.items?.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-indigo-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-100/60">
                      <th className="px-4 py-2.5 font-semibold text-indigo-700 text-left text-xs uppercase tracking-wider">Medicamento</th>
                      <th className="px-4 py-2.5 font-semibold text-indigo-700 text-left text-xs uppercase tracking-wider">Concentracion</th>
                      <th className="px-4 py-2.5 font-semibold text-indigo-700 text-center text-xs uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-2.5 font-semibold text-indigo-700 text-left text-xs uppercase tracking-wider">Indicaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.items.map((item: any, j: number) => (
                      <tr key={j} className={`transition-colors hover:bg-indigo-50/60 ${j % 2 === 0 ? 'bg-white' : 'bg-indigo-50/20'}`}>
                        <td className="px-4 py-2.5 text-gray-800 font-medium">{item.medication_name || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.concentration || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{item.quantity ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderResultadosAuxiliares = () => {
    const examResults = selectedConsultation?.exam_results;
    const radiographyRequests = selectedConsultation?.radiography_requests || [];

    // Resultados de radiografía subidos por el técnico de imágenes
    const allRadResults = radiographyRequests.flatMap((r: any) => r.results || []);
    const radImages = allRadResults.filter((r: any) => r.result_type === 'image');
    const radDocuments = allRadResults.filter((r: any) => r.result_type === 'document');
    const radLinks = allRadResults.filter((r: any) => r.result_type === 'external_link');

    const hasRadResults = allRadResults.length > 0;
    const hasObs = !!examResults?.doctor_observations;
    const hasFiles = examResults?.external_files?.length > 0;

    if (!hasRadResults && !hasObs && !hasFiles) {
      return <EmptySection text="Sin resultados auxiliares" />;
    }

    // Construir URL completa para archivos en Wasabi S3 (via proxy backend)
    const getFullUrl = (path: string | null): string => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `${BACKEND_URL}/${cleanPath}`;
    };

    const formatFileSize = (bytes: number | null): string => {
      if (!bytes) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isImageMime = (mime: string | null, name: string | null): boolean => {
      if (mime?.startsWith('image/')) return true;
      const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      return exts.some(ext => (name || '').toLowerCase().endsWith(ext));
    };

    return (
      <div className="space-y-5">
        {/* Resultados de Radiografía (subidos por técnico de imágenes) */}
        {hasRadResults && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <FileImage className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">Resultados de Radiografia</h5>
                <p className="text-xs text-gray-500">Subidos por el tecnico de imagenes</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {radImages.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {radImages.length} imagen{radImages.length !== 1 ? 'es' : ''}
                  </span>
                )}
                {radDocuments.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    {radDocuments.length} documento{radDocuments.length !== 1 ? 's' : ''}
                  </span>
                )}
                {radLinks.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {radLinks.length} enlace{radLinks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-4">
              {/* Imágenes - Preview clickeable que abre lightbox */}
              {radImages.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Imagenes ({radImages.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {radImages.map((img: any, idx: number) => {
                      const fullUrl = getFullUrl(img.file_path);
                      return (
                        <motion.div
                          key={img.result_id || idx}
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                          onClick={() => setLightboxImage({ src: fullUrl, alt: img.original_name || `Radiografia ${idx + 1}` })}
                        >
                          <div className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-purple-300 shadow-sm bg-white">
                              <img
                                src={fullUrl}
                                alt={img.original_name || `Radiografia ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                  }
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate text-center" title={img.original_name || ''}>
                            {img.original_name || `Imagen ${idx + 1}`}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documentos (PDF, etc.) - Ícono clickeable que abre en nueva pestaña */}
              {radDocuments.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Documentos ({radDocuments.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {radDocuments.map((doc: any, idx: number) => {
                      const fullUrl = getFullUrl(doc.file_path);
                      const isPdf = doc.mime_type === 'application/pdf' || (doc.original_name || '').toLowerCase().endsWith('.pdf');
                      return (
                        <a
                          key={doc.result_id || idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-100 hover:border-purple-400 transition-colors group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <FileText className={`w-5 h-5 ${isPdf ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {doc.original_name || `Documento ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(doc.file_size)}
                              {doc.uploader_name && ` · ${doc.uploader_name}`}
                            </p>
                          </div>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium group-hover:bg-purple-200">
                            Abrir
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enlaces externos */}
              {radLinks.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Enlaces externos ({radLinks.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {radLinks.map((link: any, idx: number) => (
                      <a
                        key={link.result_id || idx}
                        href={link.external_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {link.external_url || 'Enlace externo'}
                          </p>
                          {link.uploader_name && (
                            <p className="text-xs text-gray-500">Subido por {link.uploader_name}</p>
                          )}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium group-hover:bg-blue-200">
                          Visitar
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observaciones del doctor */}
        {hasObs && (
          <div>
            <h5 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1.5">Observaciones del doctor</h5>
            <p className="text-sm text-gray-800 bg-cyan-50 p-4 rounded-xl border border-cyan-100">{examResults!.doctor_observations}</p>
          </div>
        )}

        {/* Archivos de centros externos (subidos por el doctor) */}
        {hasFiles && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 text-sm">Archivos de Centros Externos</h5>
                <p className="text-xs text-gray-500">Subidos por el doctor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(examResults!.external_files || []).map((file: any, i: number) => {
                const filePath = typeof file === 'string' ? file : (file.path || file.url || file.filename || '');
                const fileName = (file && typeof file === 'object' && file.name) ? file.name : (filePath.split('/').pop() || `Archivo ${i + 1}`);
                const fullUrl = getFullUrl(filePath);
                const isImg = isImageMime(file?.type || null, fileName);

                return isImg ? (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => setLightboxImage({ src: fullUrl, alt: fileName })}
                  >
                    <div className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-cyan-200 shadow-sm bg-white">
                        <img src={fullUrl} alt={fileName} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{fileName}</p>
                  </motion.div>
                ) : (
                  <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-100 rounded-xl hover:bg-cyan-100 hover:shadow-sm transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 group-hover:bg-cyan-200 flex items-center justify-center transition-colors">
                      <FileText className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cyan-700 font-medium truncate">{fileName}</p>
                    </div>
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded font-medium group-hover:bg-cyan-200">Abrir</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDiagnosticoDefinitivo = () => {
    const dx = selectedConsultation?.definitive_diagnosis;
    if (!dx?.length) return <EmptySection text="Sin diagnostico definitivo" />;
    return (
      <div className="overflow-x-auto rounded-xl border border-purple-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50">
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-left text-xs uppercase tracking-wider">Pieza</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-left text-xs uppercase tracking-wider">Condicion</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-left text-xs uppercase tracking-wider">CIE-10</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-left text-xs uppercase tracking-wider">Superficie</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-right text-xs uppercase tracking-wider">Precio</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-left text-xs uppercase tracking-wider">Procedimiento</th>
              <th className="px-4 py-2.5 font-semibold text-purple-700 text-right text-xs uppercase tracking-wider">Precio Proc.</th>
            </tr>
          </thead>
          <tbody>
            {dx.map((item: any, i: number) => (
              <tr key={i} className={`transition-colors hover:bg-purple-50/60 ${i % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'}`}>
                <td className="px-4 py-2.5 font-mono text-gray-800 font-medium">{item.tooth_number ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-800">{item.condition_label || '-'}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-purple-600 font-semibold">{item.cie10_code || '-'}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.surfaces || '-'}</td>
                <td className="px-4 py-2.5 text-gray-800 text-right font-medium">{item.price != null ? formatCurrency(item.price) : '-'}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.selected_procedure_name || '-'}</td>
                <td className="px-4 py-2.5 text-gray-800 text-right font-medium">{item.procedure_price != null ? formatCurrency(item.procedure_price) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPlanTratamiento = () => {
    const tp = selectedConsultation?.treatment_plan;
    if (!tp) return <EmptySection text="Sin plan de tratamiento" />;
    const items = tp.items || [];
    const additionalServices = tp.additional_services || [];
    if (!items.length && !additionalServices.length) return <EmptySection text="Sin items en el plan de tratamiento" />;
    return (
      <div className="space-y-5">
        {items.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2.5">Items del plan</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{item.procedure_name || item.description || `Item ${i + 1}`}</p>
                      {item.tooth_number && <p className="text-xs text-red-700 mt-0.5 font-mono">Pieza {item.tooth_number}</p>}
                      {item.notes && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.notes}</p>}
                    </div>
                    {item.price != null && (
                      <span className="text-sm font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg whitespace-nowrap">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {additionalServices.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2.5">Servicios adicionales</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {additionalServices.map((svc: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-red-50/60 border border-red-200 rounded-xl p-4 text-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{svc.service_name || svc.description || `Servicio ${i + 1}`}</p>
                      {svc.service_type && <p className="text-xs text-red-700 mt-0.5">{svc.service_type}</p>}
                      {svc.modality && <p className="text-xs text-gray-500 mt-0.5">Modalidad: {svc.modality}</p>}
                    </div>
                    {svc.monto_total != null && (
                      <span className="text-sm font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg whitespace-nowrap">{formatCurrency(svc.monto_total)}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white border border-red-200 rounded-xl p-4 space-y-2">
          {tp.definitive_diagnosis_total != null && (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Diagnostico definitivo</span><span className="text-gray-700 font-medium">{formatCurrency(tp.definitive_diagnosis_total)}</span></div>
          )}
          {tp.treatments_total != null && (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tratamientos</span><span className="text-gray-700 font-medium">{formatCurrency(tp.treatments_total)}</span></div>
          )}
          {tp.additional_services_total != null && (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Servicios adicionales</span><span className="text-gray-700 font-medium">{formatCurrency(tp.additional_services_total)}</span></div>
          )}
          {tp.grand_total != null && (
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-red-200 mt-2">
              <span className="text-gray-800">Total general</span>
              <span className="text-red-700 text-base">{formatCurrency(tp.grand_total)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPresupuesto = () => {
    const budget = selectedConsultation?.budget;
    if (!budget) return <EmptySection text="Sin presupuesto" />;

    const dx: any[] = (selectedConsultation as any)?.definitive_diagnosis || [];
    const tpItems: any[] = (selectedConsultation as any)?.treatment_plan?.items || [];
    const tpServices: any[] = (selectedConsultation as any)?.treatment_plan?.additional_services || [];

    const showDxRow = budget.definitive_diagnosis_total != null;
    const showTxRow = budget.treatments_total != null;
    const showSvcRow = budget.additional_services_total != null;
    const showExamRow = budget.exams_total != null;

    const expandableCount = [showDxRow, showTxRow, showSvcRow].filter(Boolean).length;
    const openCount =
      (presupuestoExpanded.dx && showDxRow ? 1 : 0) +
      (presupuestoExpanded.tx && showTxRow ? 1 : 0) +
      (presupuestoExpanded.svc && showSvcRow ? 1 : 0);
    const allExpanded = expandableCount > 0 && openCount === expandableCount;

    const toggleAll = () => {
      const next = !allExpanded;
      setPresupuestoExpanded({ dx: next, tx: next, svc: next });
    };
    const toggleRow = (key: 'dx' | 'tx' | 'svc') =>
      setPresupuestoExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    const renderCategoryRow = (
      keyId: 'dx' | 'tx' | 'svc',
      label: string,
      total: any,
      items: any[],
      detail: React.ReactNode
    ) => {
      const open = presupuestoExpanded[keyId];
      return (
        <div className="border-b border-amber-200">
          <button
            onClick={() => toggleRow(keyId)}
            className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-amber-50/50 transition-colors rounded"
          >
            <div className="flex items-center gap-2">
              <ChevronRight
                className={`w-4 h-4 text-amber-700 transition-transform ${open ? 'rotate-90' : ''}`}
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">{formatCurrency(total)}</span>
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-4 pt-1 px-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-amber-700/70 italic">Sin detalle disponible para este grupo</p>
                  ) : (
                    detail
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    const dxDetail = (
      <div className="overflow-x-auto rounded-lg border border-amber-100 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-amber-50/70 text-amber-700">
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Pieza</th>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Condicion</th>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">CIE-10</th>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Sup.</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Precio</th>
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Procedimiento</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Precio Proc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {dx.map((item: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/20'}>
                <td className="px-3 py-2 font-mono text-gray-800">{item.tooth_number ?? '-'}</td>
                <td className="px-3 py-2 text-gray-800">{item.condition_label || '-'}</td>
                <td className="px-3 py-2 font-mono text-purple-600 font-semibold">{item.cie10_code || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{item.surfaces || '-'}</td>
                <td className="px-3 py-2 text-right text-gray-800 font-medium">{item.price != null ? formatCurrency(item.price) : '-'}</td>
                <td className="px-3 py-2 text-gray-600">{item.selected_procedure_name || '-'}</td>
                <td className="px-3 py-2 text-right text-gray-800 font-medium">{item.procedure_price != null ? formatCurrency(item.procedure_price) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const txDetail = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tpItems.map((item: any, i: number) => (
          <div key={i} className="bg-white border border-red-100 rounded-xl p-3 text-xs">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{item.procedure_name || item.description || `Item ${i + 1}`}</p>
                {item.tooth_number && <p className="text-[11px] text-red-700 font-mono mt-0.5">Pieza {item.tooth_number}</p>}
                {item.notes && <p className="text-[11px] text-gray-500 mt-1">{item.notes}</p>}
              </div>
              {item.price != null && (
                <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded whitespace-nowrap">{formatCurrency(item.price)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );

    const svcDetail = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {tpServices.map((svc: any, i: number) => (
          <div key={i} className="bg-white border border-red-100 rounded-xl p-3 text-xs">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{svc.service_name || svc.description || `Servicio ${i + 1}`}</p>
                {svc.service_type && <p className="text-[11px] text-red-700 mt-0.5">{svc.service_type}</p>}
                {svc.modality && <p className="text-[11px] text-gray-500 mt-0.5">Modalidad: {svc.modality}</p>}
              </div>
              {svc.monto_total != null && (
                <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded whitespace-nowrap">{formatCurrency(svc.monto_total)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="space-y-4">
        {expandableCount > 0 && (
          <div className="flex justify-end">
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
            >
              {allExpanded ? 'Colapsar todo' : 'Expandir todo'}
            </button>
          </div>
        )}

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200 rounded-xl p-5">
          {showDxRow && renderCategoryRow('dx', 'Diagnostico definitivo', budget.definitive_diagnosis_total, dx, dxDetail)}
          {showTxRow && renderCategoryRow('tx', 'Tratamientos', budget.treatments_total, tpItems, txDetail)}
          {showSvcRow && renderCategoryRow('svc', 'Servicios adicionales', budget.additional_services_total, tpServices, svcDetail)}

          {showExamRow && (
            <div className="border-b border-amber-200">
              <div className="flex items-center justify-between py-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-700">Examenes</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExamModalOpen(true)}
                    className="text-xs font-semibold text-amber-700 bg-white border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver formulario de examenes
                  </button>
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(budget.exams_total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 space-y-2">
            {budget.grand_total != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Total general</span>
                <span className="text-xl font-bold text-amber-800">{formatCurrency(budget.grand_total)}</span>
              </div>
            )}
            {budget.advance_payment != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Adelanto</span>
                <span className="text-green-700 font-semibold">{formatCurrency(budget.advance_payment)}</span>
              </div>
            )}
            {budget.balance != null && (
              <div className="flex justify-between items-center bg-red-50 -mx-5 px-5 py-2 rounded-b-xl border-t border-red-200 mt-2">
                <span className="text-sm font-bold text-gray-800">Saldo pendiente</span>
                <span className="text-lg font-bold text-red-700">{formatCurrency(budget.balance)}</span>
              </div>
            )}
          </div>
        </div>

        {budget.budget_observations && (
          <div>
            <h5 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Observaciones</h5>
            <p className="text-sm text-gray-700 bg-amber-50 rounded-xl p-4 border border-amber-100">{budget.budget_observations}</p>
          </div>
        )}
      </div>
    );
  };

  const renderExamModal = () => {
    if (!examModalOpen) return null;
    const radiographyRequests: any[] = (selectedConsultation as any)?.radiography_requests || [];
    const examResults: any = (selectedConsultation as any)?.exam_results;

    const getFullUrl = (path: string | null): string => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `${BACKEND_URL}/${cleanPath}`;
    };

    const hasObs = !!examResults?.doctor_observations;
    const hasFiles = (examResults?.external_files?.length || 0) > 0;
    const hasAny = radiographyRequests.length > 0 || hasObs || hasFiles;

    const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
      pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      in_progress: { label: 'En proceso', bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { label: 'Completado', bg: 'bg-green-100', text: 'text-green-800' },
      delivered: { label: 'Entregado', bg: 'bg-emerald-100', text: 'text-emerald-800' },
      cancelled: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800' },
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={() => setExamModalOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Formulario de examenes</h3>
                <p className="text-xs text-gray-500">Solicitud de radiografia y resultados auxiliares</p>
              </div>
            </div>
            <button
              onClick={() => setExamModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {!hasAny && (
              <p className="text-sm text-gray-500 text-center py-8">Sin datos de examenes registrados</p>
            )}

            {radiographyRequests.map((req: any, i: number) => {
              const requestData = req.request_data || {};
              const tomografia3D: Tomografia3DFormData = {
                ...INITIAL_TOMOGRAFIA_FORM,
                ...requestData.tomografia3D
              };
              const radiografias: RadiografiasFormData = {
                ...INITIAL_RADIOGRAFIAS_FORM,
                ...requestData.radiografias
              };
              const hasTomografiaSelection = Object.values(tomografia3D).some(
                v => v === true || (typeof v === 'string' && v.trim())
              );
              const hasRadiografiasSelection = Object.values(radiografias).some(
                v => v === true || (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v.trim())
              );
              const typeLabel = req.radiography_type === 'diagnostic_plan'
                ? (hasTomografiaSelection && hasRadiografiasSelection ? 'Tomografia 3D + Radiografias'
                   : hasTomografiaSelection ? 'Tomografia 3D'
                   : hasRadiografiasSelection ? 'Radiografias'
                   : 'Plan Diagnostico')
                : (req.radiography_type || 'Plan Diagnostico');
              const sts = statusConfig[req.request_status] || statusConfig.pending;

              return (
                <div key={i} className="bg-purple-50/40 border border-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Solicitud de radiografia{radiographyRequests.length > 1 ? ` #${i + 1}` : ''}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${sts.bg} ${sts.text}`}>
                      {sts.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase">Tipo</span>
                      <p className="text-gray-800 font-medium">{typeLabel}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase">Urgencia</span>
                      <p className="text-gray-800 font-medium">{req.urgency || '-'}</p>
                    </div>
                    {req.area_of_interest && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-gray-500 uppercase">Area de interes</span>
                        <p className="text-gray-800">{req.area_of_interest}</p>
                      </div>
                    )}
                    {req.clinical_indication && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-gray-500 uppercase">Indicacion clinica</span>
                        <p className="text-gray-800 leading-relaxed">{req.clinical_indication}</p>
                      </div>
                    )}
                    {req.request_date && (
                      <div>
                        <span className="text-[11px] text-gray-500 uppercase">Fecha solicitud</span>
                        <p className="text-gray-800">{formatTimestampToLima(req.request_date, 'date')}</p>
                      </div>
                    )}
                  </div>

                  {hasTomografiaSelection && (
                    <div className="mt-3">
                      <Tomografia3DSection mode="view" colorTheme="cyan" showPrices={false} formData={tomografia3D} />
                    </div>
                  )}
                  {hasRadiografiasSelection && (
                    <div className="mt-3">
                      <RadiografiasSection mode="view" colorTheme="cyan" showPrices={false} formData={radiografias} />
                    </div>
                  )}
                  {!hasTomografiaSelection && !hasRadiografiasSelection && (
                    <p className="text-xs text-purple-700/70 italic">Solicitud registrada sin detalles adicionales</p>
                  )}
                </div>
              );
            })}

            {(hasObs || hasFiles) && (
              <div className="bg-cyan-50/40 border border-cyan-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-3">
                  Resultados auxiliares
                </h4>
                {hasObs && (
                  <>
                    <h5 className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider mb-1">
                      Observaciones del doctor
                    </h5>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {examResults.doctor_observations}
                    </p>
                  </>
                )}
                {hasFiles && (
                  <>
                    <h5 className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider mb-2">
                      Archivos adjuntos
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {examResults.external_files.map((file: any, i: number) => {
                        const filePath = typeof file === 'string' ? file : (file.path || file.url || file.filename || '');
                        const fileName = (file && typeof file === 'object' && file.name) ? file.name : (filePath.split('/').pop() || `Archivo ${i + 1}`);
                        const fullUrl = getFullUrl(filePath);
                        return (
                          <a
                            key={i}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-cyan-100 rounded-lg hover:bg-cyan-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-cyan-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{fileName}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-cyan-700">Abrir</span>
                          </a>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
            <button
              onClick={() => setExamModalOpen(false)}
              className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderTratamientoRealizado = () => {
    const c = selectedConsultation;
    if (!c) return <EmptySection text="Sin tratamiento realizado" />;
    const procHistory = c.procedure_history || [];
    const evolutionOdonto = c.evolution_odontogram || [];
    const completed = c.completed_items || [];
    if (!procHistory.length && !evolutionOdonto.length && !completed.length) return <EmptySection text="Sin tratamiento realizado" />;
    return (
      <div className="space-y-5">
        {procHistory.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2.5">Historial de procedimientos</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {procHistory.map((proc: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-teal-50 border border-teal-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Syringe className="w-3.5 h-3.5 text-teal-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{proc.procedure_name || 'Procedimiento'}</span>
                    </div>
                    {proc.procedure_status && <StatusBadge status={proc.procedure_status} />}
                  </div>
                  {proc.tooth_number && <p className="text-xs text-teal-700 font-mono">Pieza {proc.tooth_number}</p>}
                  {proc.clinical_notes && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{proc.clinical_notes}</p>}
                  {proc.complications && (
                    <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded-lg px-2 py-1">Complicaciones: {proc.complications}</p>
                  )}
                  {proc.next_steps && (
                    <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded-lg px-2 py-1">Siguientes pasos: {proc.next_steps}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-teal-100 text-[11px] text-gray-400">
                    {proc.dentist_name && <span>Dr(a). {proc.dentist_name}</span>}
                    {proc.performed_date && <span>{formatTimestampToLima(proc.performed_date, 'date')}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {evolutionOdonto.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2.5">Evolucion del odontograma</h5>
            <div className="bg-teal-50/40 rounded-xl border border-teal-100 divide-y divide-teal-100">
              {evolutionOdonto.map((evo: any, i: number) => {
                const status = (evo.condition_status || '').toLowerCase();
                let dotColor = 'bg-gray-400';
                if (status.includes('complet') || status === 'done') dotColor = 'bg-green-500';
                else if (status.includes('progres')) dotColor = 'bg-yellow-500';
                else if (status.includes('pend')) dotColor = 'bg-orange-500';
                return (
                  <div key={i} className="flex items-center gap-3 text-sm px-4 py-3 hover:bg-teal-50/80 transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    <span className="font-mono text-teal-800 w-12 font-semibold">P{evo.tooth_number}</span>
                    <span className="text-gray-800 flex-1">{evo.condition_name || '-'}</span>
                    <StatusBadge status={evo.condition_status || '-'} />
                    {evo.dentist_name && <span className="text-xs text-gray-400">Dr(a). {evo.dentist_name}</span>}
                    {evo.registered_date && <span className="text-xs text-gray-400">{formatTimestampToLima(evo.registered_date, 'date')}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {completed.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2.5">Items completados</h5>
            <div className="bg-green-50/50 rounded-xl border border-green-100 divide-y divide-green-100">
              {completed.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm px-4 py-3 hover:bg-green-50/80 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-800 flex-1">{item.description || item.procedure_name || item.name || `Item ${i + 1}`}</span>
                  {item.completed_date && <span className="text-xs text-gray-400 ml-auto">{formatTimestampToLima(item.completed_date, 'date')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSectionContent = (sectionId: number) => {
    switch (sectionId) {
      case 1: return renderExamenClinico();
      case 2: return renderOdontograma();
      case 3: return renderDiagnosticoPresuntivo();
      case 4: return renderPlanDiagnostico();
      case 5: return renderRecetaMedica();
      case 6: return renderResultadosAuxiliares();
      case 7: return renderDiagnosticoDefinitivo();
      case 8: return renderPlanTratamiento();
      case 9: return renderPresupuesto();
      case 10: return renderTratamientoRealizado();
      default: return null;
    }
  };

  // =========================================================================
  // RENDER - PAGINA COMPLETA
  // =========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Lightbox Overlay */}
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal formulario de examenes (seccion Presupuesto) */}
      <AnimatePresence>
        {renderExamModal()}
      </AnimatePresence>

      {/* Header fijo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/patients')}
                className="flex items-center gap-2 text-gray-500 hover:text-cyan-700 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Volver a Pacientes</span>
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-sm">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{patientName}</h1>
                  {data?.patient?.identification_number && (
                    <p className="text-xs text-gray-500">DNI: {data.patient.identification_number}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('integral')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'integral'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Atencion Integral
              </div>
            </button>
            <button
              onClick={() => setActiveTab('modifications')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'modifications'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial de Modificaciones
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB: Atencion Integral */}
        {activeTab === 'integral' && (
          <>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">Cargando historial integral...</p>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 mb-4 text-sm">{error}</p>
                <button
                  onClick={loadData}
                  className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors shadow-sm font-medium text-sm"
                >
                  Reintentar
                </button>
              </motion.div>
            )}

            {!loading && !error && consultations.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm">Este paciente no tiene consultas de atencion integral registradas.</p>
              </motion.div>
            )}

            {!loading && !error && consultations.length > 0 && (
              <motion.div
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col lg:flex-row gap-6"
              >
                {/* ===== SIDEBAR (sticky on desktop) ===== */}
                <div className="lg:w-72 xl:w-80 flex-shrink-0">
                  <div className="lg:sticky lg:top-[calc(4rem+3.5rem)] space-y-4">
                    {/* Summary stat cards */}
                    {summary && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-2">
                            <Calendar className="w-4.5 h-4.5 text-cyan-600" />
                          </div>
                          <p className="text-2xl font-bold text-cyan-700">{summary.total_consultations}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Consultas</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                            <Syringe className="w-4.5 h-4.5 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{summary.completed_procedures}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Procedimientos</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                            <Pill className="w-4.5 h-4.5 text-indigo-600" />
                          </div>
                          <p className="text-2xl font-bold text-indigo-700">{summary.total_prescriptions}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Recetas</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-4.5 h-4.5 text-amber-600" />
                          </div>
                          <p className="text-sm font-bold text-amber-700 leading-tight">
                            {summary.last_consultation_date ? formatTimestampToLima(summary.last_consultation_date, 'date') : '-'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Ultima</p>
                        </div>
                      </div>
                    )}

                    {/* Consultation selector - Timeline style */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Consultas ({consultations.length})</h4>
                      <div className="relative">
                        {/* Vertical timeline line */}
                        {consultations.length > 1 && (
                          <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-200 z-0" />
                        )}
                        <div className="space-y-1.5 relative z-10">
                          {consultations.map((c, i) => {
                            const isSelected = i === selectedIndex;
                            return (
                              <button
                                key={c.consultation_id}
                                onClick={() => setSelectedIndex(i)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                  isSelected
                                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200/50'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                }`}
                              >
                                <div className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ring-2 ${
                                  isSelected
                                    ? 'bg-white ring-white/50'
                                    : 'bg-cyan-500 ring-white'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {formatTimestampToLima(c.consultation_date, 'date')}
                                  </p>
                                  <p className={`text-[11px] truncate ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>
                                    {c.consultation_time && `${c.consultation_time} - `}Dr(a). {c.dentist_name}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Section progress indicator */}
                    {selectedConsultation && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Progreso ({sectionProgressCount}/{STEP_CONFIG.length})
                        </h4>
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(sectionProgressCount / STEP_CONFIG.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                        {/* Section dots strip */}
                        <div className="flex flex-wrap gap-1.5">
                          {STEP_CONFIG.map((step) => {
                            const hasData = sectionHasContent(step.id, selectedConsultation);
                            const colors = COLOR_MAP[step.color];
                            return (
                              <button
                                key={step.id}
                                onClick={() => {
                                  setExpandedSections((prev) => ({ ...prev, [step.id]: true }));
                                  const el = document.getElementById(`section-${step.id}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                                  hasData
                                    ? `${colors.iconBg} ${colors.text} shadow-sm`
                                    : 'bg-gray-50 text-gray-300'
                                }`}
                                title={`${step.id}. ${step.title}${hasData ? ' (con datos)' : ' (vacio)'}`}
                              >
                                {step.id}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Selected consultation metadata bar */}
                  {selectedConsultation && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center gap-4 text-sm bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-cyan-600" />
                        </div>
                        <span className="text-gray-700 font-medium">Dr(a). {selectedConsultation.dentist_name}</span>
                      </div>
                      <div className="h-5 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-gray-600">{selectedConsultation.branch_name}</span>
                      </div>
                      <div className="h-5 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-gray-600">
                          {formatTimestampToLima(selectedConsultation.consultation_date, 'date')}
                          {selectedConsultation.consultation_time && ` - ${selectedConsultation.consultation_time}`}
                        </span>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <button
                          onClick={expandAll}
                          className="text-xs text-cyan-600 hover:text-cyan-800 font-medium px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors"
                        >
                          Expandir todo
                        </button>
                        <button
                          onClick={collapseAll}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Colapsar todo
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* 10 Expandable sections */}
                  <div className="space-y-3">
                    {STEP_CONFIG.map((step, stepIndex) => {
                      const Icon = step.icon;
                      const isExpanded = !!expandedSections[step.id];
                      const hasData = sectionHasContent(step.id, selectedConsultation);
                      const colors = COLOR_MAP[step.color];

                      return (
                        <motion.div
                          key={step.id}
                          id={`section-${step.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: stepIndex * 0.03, duration: 0.3 }}
                          className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
                            isExpanded ? colors.border : 'border-gray-200'
                          }`}
                        >
                          <button
                            onClick={() => toggleSection(step.id)}
                            className={`w-full flex items-center gap-3 px-5 py-4 transition-colors text-left ${
                              isExpanded ? `${colors.bgLight}` : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isExpanded ? `${colors.bg} shadow-sm` : colors.iconBg
                            }`}>
                              <Icon className={`w-4.5 h-4.5 ${isExpanded ? 'text-white' : colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-semibold ${isExpanded ? colors.text : 'text-gray-800'}`}>
                                {step.id}. {step.title}
                              </span>
                            </div>
                            {hasData ? (
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot} shadow-sm`} title="Tiene contenido" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-200" title="Sin contenido" />
                            )}
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.25 }}
                              className="flex-shrink-0"
                            >
                              <ChevronDown className={`w-5 h-5 ${isExpanded ? colors.text : 'text-gray-400'}`} />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                variants={sectionContentVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="exit"
                                className="overflow-hidden"
                              >
                                <div className={`px-5 py-5 border-t ${colors.border}`}>
                                  {renderSectionContent(step.id)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* TAB: Historial de Modificaciones */}
        {activeTab === 'modifications' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <PatientModificationHistory patientId={patientId} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientIntegralHistory;
