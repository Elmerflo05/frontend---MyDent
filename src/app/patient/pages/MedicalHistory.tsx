import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Pill,
  Heart,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  TestTube,
  Stethoscope,
  Activity,
  ClipboardList,
  Syringe,
  Receipt,
  Clock,
  Image,
  X,
  ZoomIn,
  FileImage,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatTimestampToLima, formatDateLong } from '@/utils/dateUtils';
import RequestAppointmentModal from '@/components/patient/RequestAppointmentModal';
import { patientPortalApi, type IntegralConsultation, type MedicalSummary, type MedicalBackground } from '@/services/api/patientPortalApi';

// URL base del backend para cargar imagenes
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

// Componentes unificados para mostrar plan diagnostico
import {
  Tomografia3DSection,
  RadiografiasSection,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  type Tomografia3DFormData,
  type RadiografiasFormData
} from '@/components/laboratory-form';

// Configuracion de pasos de la Atencion Integral - MISMO ORDEN que el dentista
// El dentista tiene 12 pasos, el paciente ve los 11 pasos relevantes (sin Seleccion de Paciente)
const STEP_CONFIG = [
  { number: 1, title: 'Examen Clinico', icon: Stethoscope, color: 'blue' },
  { number: 2, title: 'Odontograma', icon: Activity, color: 'green' },
  { number: 3, title: 'Diagnostico Presuntivo', icon: FileText, color: 'yellow' },
  { number: 4, title: 'Plan Diagnostico', icon: TestTube, color: 'orange' },
  { number: 5, title: 'Receta Medica', icon: Pill, color: 'indigo' },
  { number: 6, title: 'Resultados Auxiliares', icon: ClipboardList, color: 'cyan' },
  { number: 7, title: 'Diagnostico Definitivo', icon: CheckCircle, color: 'purple' },
  { number: 8, title: 'Plan de Tratamiento', icon: Heart, color: 'red' },
  { number: 9, title: 'Presupuesto', icon: Receipt, color: 'amber' },
  { number: 10, title: 'Tratamiento Realizado', icon: Syringe, color: 'teal' }
];

// Portal de paciente siempre usa tema cyan
const USE_CYAN_THEME = true;

const PatientMedicalHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<IntegralConsultation[]>([]);
  const [summary, setSummary] = useState<MedicalSummary | null>(null);
  const [medicalBackground, setMedicalBackground] = useState<MedicalBackground | null>(null);
  const [laboratoryRadiographyRequests, setLaboratoryRadiographyRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<IntegralConsultation | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false
  });
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadMedicalHistory();
  }, [user]);

  const loadMedicalHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Obtener historial medico completo desde la nueva API
      const response = await patientPortalApi.getMyMedicalHistory();

      if (response.success && response.data) {
        setConsultations(response.data.consultations || []);
        setSummary(response.data.summary || null);
        setMedicalBackground(response.data.medical_background || null);
        setLaboratoryRadiographyRequests(response.data.laboratory_radiography_requests || []);
      }
    } catch (error) {
      console.error('Error al cargar historial medico:', error);
      toast.error('Error al cargar el historial medico');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const handleSelectConsultation = (consultation: IntegralConsultation) => {
    setSelectedConsultation(consultation);
    // Expandir el primer paso por defecto
    setExpandedSteps({
      1: true,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false,
      9: false,
      10: false
    });
  };

  // ========================= RENDER FUNCTIONS =========================

  const renderStep = (stepNumber: number) => {
    if (!selectedConsultation) return null;

    const step = STEP_CONFIG[stepNumber - 1];
    const isExpanded = expandedSteps[stepNumber];
    const Icon = step.icon;

    // Verificar si el paso tiene contenido
    const hasContent = checkStepHasContent(stepNumber);

    // Paso 2 (Odontograma) redirige a la pagina de Mi Odontograma
    const isOdontogramStep = stepNumber === 2;

    const handleStepClick = () => {
      if (isOdontogramStep) {
        navigate('/patient/odontogram');
      } else {
        toggleStep(stepNumber);
      }
    };

    return (
      <motion.div
        key={stepNumber}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <button
          onClick={handleStepClick}
          className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-${step.color}-100 rounded-lg flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${step.color}-600`} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">
                Paso {stepNumber}: {step.title}
              </h3>
              {isOdontogramStep ? (
                <span className="text-xs text-green-600">Click para ver Mi Odontograma</span>
              ) : !hasContent ? (
                <span className="text-xs text-gray-400">Sin informacion registrada</span>
              ) : null}
            </div>
          </div>
          {isOdontogramStep ? (
            <ChevronRight className="w-5 h-5 text-green-500" />
          ) : isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && !isOdontogramStep && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200"
            >
              <div className="p-6">
                {stepNumber === 1 && renderExamenClinico()}
                {stepNumber === 3 && renderDiagnosticoPresuntivo()}
                {stepNumber === 4 && renderPlanDiagnostico()}
                {stepNumber === 5 && renderRecetasMedicas()}
                {stepNumber === 6 && renderResultadosAuxiliares()}
                {stepNumber === 7 && renderDiagnosticoDefinitivo()}
                {stepNumber === 8 && renderPlanTratamiento()}
                {stepNumber === 9 && renderPresupuesto()}
                {stepNumber === 10 && renderTratamientoRealizado()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const checkStepHasContent = (stepNumber: number): boolean => {
    if (!selectedConsultation) return false;

    switch (stepNumber) {
      case 1: // Examen Clinico
        return !!(selectedConsultation.chief_complaint || medicalBackground || selectedConsultation.vital_signs);
      case 2: // Odontograma
        return !!(selectedConsultation.odontogram && selectedConsultation.odontogram.conditions?.length > 0);
      case 3: // Diagnostico Presuntivo (condiciones del odontograma)
        return !!(selectedConsultation.odontogram && selectedConsultation.odontogram.conditions?.length > 0);
      case 4: // Plan Diagnostico (solicitudes de examenes)
        return !!(selectedConsultation.radiography_requests && selectedConsultation.radiography_requests.length > 0);
      case 5: // Recetas Medicas
        return !!(selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0);
      case 6: // Resultados Auxiliares
        return !!(selectedConsultation.exam_results && selectedConsultation.exam_results.length > 0);
      case 7: // Diagnostico Definitivo
        return !!(selectedConsultation.definitive_diagnosis && selectedConsultation.definitive_diagnosis.length > 0);
      case 8: // Plan de Tratamiento (incluye diagnostico definitivo + tratamientos)
        return !!(
          (selectedConsultation.treatment_plan && selectedConsultation.treatment_plan.items?.length > 0) ||
          (selectedConsultation.definitive_diagnosis && selectedConsultation.definitive_diagnosis.length > 0)
        );
      case 9: // Presupuesto
        return !!(selectedConsultation.budget);
      case 10: // Tratamiento Realizado
        return !!(selectedConsultation.procedure_history && selectedConsultation.procedure_history.length > 0);
      default:
        return false;
    }
  };

  // Paso 1: Examen Clinico (antes Motivo de Consulta)
  const renderExamenClinico = () => {
    if (!selectedConsultation) return null;

    const hasContent = selectedConsultation.chief_complaint ||
      medicalBackground ||
      selectedConsultation.vital_signs ||
      selectedConsultation.extraoral_exam ||
      selectedConsultation.intraoral_exam ||
      (selectedConsultation.extraoral_exam_images && selectedConsultation.extraoral_exam_images.length > 0) ||
      (selectedConsultation.intraoral_exam_images && selectedConsultation.intraoral_exam_images.length > 0);

    if (!hasContent) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Stethoscope className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay informacion del examen clinico registrada</p>
        </div>
      );
    }

    // Funcion para construir URL completa de imagen
    const getFullImageUrl = (imageUrl: string): string => {
      if (!imageUrl) return '';
      // Si ya es una URL completa, retornarla
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      // Si es una ruta relativa, agregar el prefijo del backend
      return `${BACKEND_URL}/${imageUrl}`;
    };

    // Funcion para renderizar galeria de imagenes
    const renderImageGallery = (images: string[] | undefined, title: string, bgColor: string, textColor: string) => {
      if (!images || images.length === 0) return null;

      return (
        <div className={`${bgColor} p-4 rounded-lg`}>
          <div className="flex items-center gap-2 mb-3">
            <Image className={`w-5 h-5 ${textColor}`} />
            <h4 className={`font-medium ${textColor}`}>{title}</h4>
            <span className={`text-xs ${textColor} opacity-70`}>({images.length} {images.length === 1 ? 'imagen' : 'imagenes'})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((imageUrl, idx) => {
              const fullUrl = getFullImageUrl(imageUrl);
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedImage(fullUrl)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                    <img
                      src={fullUrl}
                      alt={`${title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {selectedConsultation.chief_complaint && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Motivo de la consulta</h4>
            <p className="text-blue-800">{selectedConsultation.chief_complaint}</p>
          </div>
        )}

        {/* Antecedentes Medicos del Paciente */}
        {medicalBackground && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-3">Antecedentes Medicos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* 1. Antecedentes Patologicos */}
              {medicalBackground.pathological_background && medicalBackground.pathological_background.length > 0 && (
                <div className="bg-orange-100 p-3 rounded-lg">
                  <span className="font-medium text-orange-800">Antecedentes Patologicos:</span>
                  <div className="mt-2 space-y-1">
                    {medicalBackground.pathological_background.map((item: any, index: number) => (
                      <div key={index} className="text-orange-700">
                        {typeof item === 'string' ? item : (item.name || item.description || JSON.stringify(item))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Enfermedades Anteriores (TBC, Diabetes, Hipertension, etc.) */}
              {medicalBackground.has_chronic_diseases && medicalBackground.chronic_diseases_description && (
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="font-medium text-yellow-800">Enfermedades Anteriores:</span>
                  <p className="text-yellow-700 mt-1">{medicalBackground.chronic_diseases_description}</p>
                </div>
              )}

              {/* 3. Historial de Operaciones */}
              {medicalBackground.has_surgeries && medicalBackground.surgeries_description && (
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="font-medium text-purple-800">Historial de Operaciones:</span>
                  <p className="text-purple-700 mt-1">{medicalBackground.surgeries_description}</p>
                </div>
              )}

              {/* 4. Alergias */}
              {medicalBackground.has_allergies && medicalBackground.allergies_description && (
                <div className="bg-red-100 p-3 rounded-lg">
                  <span className="font-medium text-red-800">Alergias:</span>
                  <p className="text-red-700 mt-1">{medicalBackground.allergies_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedConsultation.vital_signs && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Signos Vitales</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {selectedConsultation.vital_signs.blood_pressure && (
                <div>
                  <span className="text-green-600">Presion Arterial:</span>
                  <span className="ml-2 text-green-900 font-medium">{selectedConsultation.vital_signs.blood_pressure}</span>
                </div>
              )}
              {selectedConsultation.vital_signs.heart_rate && (
                <div>
                  <span className="text-green-600">Frecuencia Cardiaca:</span>
                  <span className="ml-2 text-green-900 font-medium">{selectedConsultation.vital_signs.heart_rate} lpm</span>
                </div>
              )}
              {selectedConsultation.vital_signs.temperature && (
                <div>
                  <span className="text-green-600">Temperatura:</span>
                  <span className="ml-2 text-green-900 font-medium">{selectedConsultation.vital_signs.temperature} C</span>
                </div>
              )}
              {selectedConsultation.vital_signs.weight && (
                <div>
                  <span className="text-green-600">Peso:</span>
                  <span className="ml-2 text-green-900 font-medium">{selectedConsultation.vital_signs.weight} kg</span>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedConsultation.general_condition && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Estado General</h4>
            <p className="text-gray-700">{selectedConsultation.general_condition}</p>
          </div>
        )}

        {/* Examen Extraoral - Texto */}
        {selectedConsultation.extraoral_exam && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Examen Extraoral</h4>
            <p className="text-purple-800">{selectedConsultation.extraoral_exam}</p>
          </div>
        )}

        {/* Examen Extraoral - Imagenes */}
        {renderImageGallery(
          selectedConsultation.extraoral_exam_images,
          'Imagenes Extraorales',
          'bg-purple-50',
          'text-purple-900'
        )}

        {/* Examen Intraoral - Texto */}
        {selectedConsultation.intraoral_exam && (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2">Examen Intraoral</h4>
            <p className="text-indigo-800">{selectedConsultation.intraoral_exam}</p>
          </div>
        )}

        {/* Examen Intraoral - Imagenes */}
        {renderImageGallery(
          selectedConsultation.intraoral_exam_images,
          'Imagenes Intraorales',
          'bg-indigo-50',
          'text-indigo-900'
        )}
      </div>
    );
  };

  // Paso 3: Diagnostico Presuntivo (basado en condiciones del odontograma)
  const renderDiagnosticoPresuntivo = () => {
    if (!selectedConsultation) return null;

    const conditions = selectedConsultation.odontogram?.conditions || [];

    if (conditions.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay diagnostico presuntivo registrado</p>
        </div>
      );
    }

    // Agrupar condiciones por pieza dental para una vista mas organizada
    const groupedByTooth = conditions.reduce((acc, cond) => {
      const tooth = cond.tooth_number || 'Sin pieza';
      if (!acc[tooth]) acc[tooth] = [];
      acc[tooth].push(cond);
      return acc;
    }, {} as Record<string, typeof conditions>);

    return (
      <div>
        {/* Header con contador */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            Hallazgos identificados en el examen odontologico
          </p>
          <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
            {conditions.length} hallazgo{conditions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla compacta de hallazgos */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header de tabla */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="col-span-2">Pieza</div>
            <div className="col-span-4">Condicion</div>
            <div className="col-span-3">Superficie</div>
            <div className="col-span-3">Severidad</div>
          </div>

          {/* Filas de datos */}
          <div className="divide-y divide-gray-100">
            {conditions.map((cond, index) => (
              <div
                key={index}
                className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm items-center ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                } hover:bg-amber-50/50 transition-colors`}
              >
                {/* Pieza dental */}
                <div className="col-span-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm">
                    {cond.tooth_number || '-'}
                  </span>
                </div>

                {/* Condicion */}
                <div className="col-span-4">
                  <span className="font-medium text-gray-900">
                    {cond.condition_name || 'Hallazgo clinico'}
                  </span>
                  {(cond.notes || cond.description) && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {cond.notes || cond.description}
                    </p>
                  )}
                </div>

                {/* Superficie */}
                <div className="col-span-3">
                  {cond.surface_name ? (
                    <span className="text-gray-700">{cond.surface_name}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>

                {/* Severidad */}
                <div className="col-span-3">
                  {cond.severity ? (
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      cond.severity === 'alta' || cond.severity === 'severe'
                        ? 'bg-red-100 text-red-700'
                        : cond.severity === 'media' || cond.severity === 'moderate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {cond.severity}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen por pieza (compacto) */}
        {Object.keys(groupedByTooth).length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(groupedByTooth).map(([tooth, toothConditions]) => (
              <span
                key={tooth}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
              >
                <span className="font-semibold text-gray-800">#{tooth}</span>
                <span className="text-gray-400">|</span>
                <span>{toothConditions.length}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Paso 7: Diagnostico Definitivo
  const renderDiagnosticoDefinitivo = () => {
    if (!selectedConsultation) return null;

    const diagnoses = selectedConsultation.definitive_diagnosis || [];

    if (diagnoses.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay diagnostico definitivo registrado</p>
        </div>
      );
    }

    return (
      <div>
        {/* Header con contador */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">Condiciones diagnosticadas</p>
          <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {diagnoses.length} diagnostico{diagnoses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid de diagnosticos - 3 columnas compactas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {diagnoses.map((diag, index) => (
            <div
              key={index}
              className="bg-white border border-purple-200 rounded-md overflow-hidden hover:shadow-sm transition-shadow"
            >
              {/* Header compacto */}
              <div className="px-2.5 py-1.5 bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">#{index + 1}</span>
                {diag.cie10_code && (
                  <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded font-mono">
                    {diag.cie10_code}
                  </span>
                )}
              </div>

              {/* Contenido compacto */}
              <div className="p-2.5">
                {/* Nombre de la condicion */}
                <h5 className="font-semibold text-gray-900 text-base leading-tight mb-1.5 line-clamp-2">
                  {diag.condition_label || diag.condition_name}
                </h5>

                {/* Info compacta */}
                {diag.tooth_number && (
                  <p className="text-sm text-purple-700 font-medium mb-1">
                    Pieza {diag.tooth_number} {diag.tooth_name && `• ${diag.tooth_name}`}
                  </p>
                )}
                {diag.surfaces && diag.surfaces.length > 0 && (
                  <p className="text-xs text-violet-600">
                    Sup: {diag.surfaces.join(', ')}
                  </p>
                )}

                {/* Notas si existen */}
                {diag.notes && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2" title={diag.notes}>
                    {diag.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlanDiagnostico = () => {
    if (!selectedConsultation) return null;

    const radiographyRequests = selectedConsultation.radiography_requests || [];

    if (radiographyRequests.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay examenes indicados para esta consulta</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-medium text-gray-900">Examenes indicados por el doctor</h4>

        {radiographyRequests.map((request, index) => {
          // Parsear request_data si existe
          const requestData = request.request_data || {};
          const tomografia3D: Tomografia3DFormData = {
            ...INITIAL_TOMOGRAFIA_FORM,
            ...requestData.tomografia3D
          };
          const radiografias: RadiografiasFormData = {
            ...INITIAL_RADIOGRAFIAS_FORM,
            ...requestData.radiografias
          };

          // Verificar si hay selecciones
          const hasTomografiaSelection = Object.values(tomografia3D).some(v => v === true || (typeof v === 'string' && v.trim()));
          const hasRadiografiasSelection = Object.values(radiografias).some(v =>
            v === true ||
            (Array.isArray(v) && v.length > 0) ||
            (typeof v === 'string' && v.trim())
          );

          // Estado de la solicitud
          const getStatusBadge = () => {
            const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
              pending: { label: 'Pendiente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
              in_progress: { label: 'En proceso', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
              completed: { label: 'Completado', bgColor: 'bg-green-100', textColor: 'text-green-800' },
              cancelled: { label: 'Cancelado', bgColor: 'bg-red-100', textColor: 'text-red-800' }
            };
            const config = statusConfig[request.request_status] || statusConfig.pending;
            return (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
            );
          };

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">{request.radiography_type}</span>
                </div>
                {getStatusBadge()}
              </div>

              {request.clinical_indication && (
                <p className="text-sm text-gray-600 mb-3">{request.clinical_indication}</p>
              )}

              {/* Mostrar componentes de Tomografia y Radiografias si hay datos */}
              {hasTomografiaSelection && (
                <Tomografia3DSection
                  mode="view"
                  colorTheme="cyan"
                  showPrices={false}
                  formData={tomografia3D}
                />
              )}

              {hasRadiografiasSelection && (
                <RadiografiasSection
                  mode="view"
                  colorTheme="cyan"
                  showPrices={false}
                  formData={radiografias}
                />
              )}
            </div>
          );
        })}

        {/* Boton de Agendar Cita */}
        <div className="mt-6 bg-teal-50 border-2 border-teal-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-teal-900 mb-1">Listo para realizar los examenes?</h5>
              <p className="text-sm text-teal-700 mb-3">
                Agenda tu cita para realizar los examenes indicados por tu doctor.
              </p>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanTratamiento = () => {
    if (!selectedConsultation) return null;

    const treatmentPlan = selectedConsultation.treatment_plan;
    const definitiveDiagnosis = selectedConsultation.definitive_diagnosis || [];

    // Si no hay plan de tratamiento ni diagnóstico definitivo
    if ((!treatmentPlan || !treatmentPlan.items || treatmentPlan.items.length === 0) && definitiveDiagnosis.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <Heart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay plan de tratamiento registrado</p>
        </div>
      );
    }

    // Calcular total del diagnóstico definitivo
    const diagnosisTotal = definitiveDiagnosis.reduce((acc, d) => acc + (Number(d.price) || 0), 0);

    // Obtener items de tratamiento (todos los items)
    const treatmentItems = treatmentPlan?.items || [];

    // Obtener servicios adicionales (ortodoncia, implantes, prótesis)
    const additionalServices = treatmentPlan?.additional_services || [];

    return (
      <div className="space-y-4">
        {/* Nombre del plan si existe */}
        {treatmentPlan?.plan_name && (
          <h4 className="font-semibold text-gray-900 text-base">{treatmentPlan.plan_name}</h4>
        )}

        {/* 1. DIAGNÓSTICO DEFINITIVO - con datos completos de dientes y superficies */}
        {definitiveDiagnosis.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Diagnóstico Definitivo</span>
              <span className="text-white font-bold text-sm">
                S/ {diagnosisTotal.toFixed(2)}
              </span>
            </div>
            <div className="p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-purple-700 uppercase">
                    <th className="text-left py-1 px-2 font-semibold">Pieza</th>
                    <th className="text-left py-1 px-2 font-semibold">Procedimiento</th>
                    <th className="text-left py-1 px-1 font-semibold">Superficies</th>
                    <th className="text-right py-1 px-2 font-semibold w-24">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {definitiveDiagnosis.map((diag, idx) => (
                    <tr key={idx} className="border-t border-purple-100">
                      <td className="py-1.5 px-2 text-gray-800 font-medium">
                        {diag.tooth_number || '-'}
                        {diag.tooth_name && <span className="text-purple-500 text-xs ml-1">({diag.tooth_name})</span>}
                      </td>
                      <td className="py-1.5 px-2 text-gray-800">
                        {diag.condition_label || diag.condition_name || '-'}
                      </td>
                      <td className="py-1.5 px-1 text-gray-600 text-xs">
                        {diag.surfaces && diag.surfaces.length > 0 ? diag.surfaces.join(', ') : '-'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium text-purple-700">
                        S/ {Number(diag.price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TRATAMIENTOS */}
        {treatmentItems.map((item, index) => {
          const hasConditions = item.conditions && item.conditions.length > 0;
          return (
            <div key={`treat-${index}`} className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">{item.treatment_name}</span>
                <span className="text-white font-bold text-sm">
                  S/ {Number(item.total_amount).toFixed(2)}
                </span>
              </div>
              {hasConditions && (
                <div className="p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-emerald-700 uppercase">
                        <th className="text-left py-1 px-2 font-semibold">Descripción</th>
                        <th className="text-center py-1 px-1 font-semibold w-12">Cant.</th>
                        <th className="text-right py-1 px-1 font-semibold w-20">Precio</th>
                        <th className="text-right py-1 px-2 font-semibold w-24">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.conditions.map((cond, cIdx) => (
                        <tr key={cIdx} className="border-t border-emerald-100">
                          <td className="py-1.5 px-2 text-gray-800">{cond.label}</td>
                          <td className="py-1.5 px-1 text-center text-gray-600">{cond.quantity}</td>
                          <td className="py-1.5 px-1 text-right text-gray-600">S/ {Number(cond.price).toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-emerald-700">
                            S/ {Number(cond.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!hasConditions && (
                <div className="p-2 text-center text-sm text-gray-500 italic">Sin detalles</div>
              )}
            </div>
          );
        })}

        {/* 3. SERVICIOS ADICIONALES (Ortodoncia, Implantes, Prótesis) */}
        {additionalServices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Servicios Adicionales</span>
              <span className="text-white font-bold text-sm">
                S/ {additionalServices.reduce((acc, s) => acc + (Number(s.monto_total) || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-amber-700 uppercase">
                    <th className="text-left py-1 px-2 font-semibold">Servicio</th>
                    <th className="text-left py-1 px-1 font-semibold">Tipo</th>
                    <th className="text-right py-1 px-1 font-semibold w-20">Inicial</th>
                    <th className="text-right py-1 px-1 font-semibold w-20">Mensual</th>
                    <th className="text-right py-1 px-2 font-semibold w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalServices.map((service, idx) => {
                    const serviceTypeLabels: Record<string, string> = {
                      orthodontic: 'Ortodoncia',
                      implant: 'Implante',
                      prosthesis: 'Prótesis'
                    };
                    return (
                      <tr key={idx} className="border-t border-amber-100">
                        <td className="py-1.5 px-2 text-gray-800">
                          {service.service_name}
                          {service.modality && (
                            <span className="text-amber-600 text-xs ml-1">({service.modality})</span>
                          )}
                        </td>
                        <td className="py-1.5 px-1 text-gray-600 text-xs">
                          {serviceTypeLabels[service.service_type] || service.service_type}
                        </td>
                        <td className="py-1.5 px-1 text-right text-gray-600">
                          S/ {Number(service.inicial || 0).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-1 text-right text-gray-600">
                          S/ {Number(service.mensual || 0).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-medium text-amber-700">
                          S/ {Number(service.monto_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen de costos */}
        {treatmentPlan && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-lg">
            <h5 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Resumen del Plan</h5>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Diagnóstico Definitivo:</span>
                <span className="font-medium">S/ {Number(treatmentPlan.definitive_diagnosis_total || diagnosisTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tratamientos:</span>
                <span className="font-medium">S/ {Number(treatmentPlan.treatments_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Servicios Adicionales:</span>
                <span className="font-medium">S/ {Number(treatmentPlan.additional_services_total || 0).toFixed(2)}</span>
              </div>
              <hr className="my-2 border-gray-600" />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL GENERAL:</span>
                <span className="text-emerald-400">S/ {Number(treatmentPlan.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Pagos si existen */}
            {treatmentPlan.has_initial_payment && (
              <div className="mt-3 pt-3 border-t border-gray-600 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Pago inicial:</span>
                  <span className="font-medium text-amber-400">S/ {Number(treatmentPlan.initial_payment || 0).toFixed(2)}</span>
                </div>
                {treatmentPlan.monthly_payment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cuota mensual:</span>
                    <span className="font-medium">S/ {Number(treatmentPlan.monthly_payment || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Observaciones */}
        {treatmentPlan?.observations && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-1 text-sm">Observaciones</h5>
            <p className="text-sm text-blue-800">{treatmentPlan.observations}</p>
          </div>
        )}
      </div>
    );
  };

  // Paso 6: Resultados Auxiliares (resultados de examenes y radiografias)
  const renderResultadosAuxiliares = () => {
    if (!selectedConsultation) return null;

    const examResults = selectedConsultation.exam_results || [];
    const radiographyRequests = selectedConsultation.radiography_requests || [];

    // Obtener todos los resultados de radiografia del tecnico de imagenes
    const allRadiographyResults = radiographyRequests.flatMap(req => req.results || []);
    const radiographyImages = allRadiographyResults.filter(r => r.result_type === 'image');
    const radiographyDocuments = allRadiographyResults.filter(r => r.result_type === 'document');
    const radiographyLinks = allRadiographyResults.filter(r => r.result_type === 'external_link');

    // Verificar si hay contenido
    const hasRadiographyResults = allRadiographyResults.length > 0;
    const hasExamResults = examResults.length > 0;

    if (!hasRadiographyResults && !hasExamResults) {
      return (
        <div className="text-center py-6 text-gray-500">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay resultados de examenes auxiliares registrados</p>
        </div>
      );
    }

    // Funciones auxiliares
    const formatFileSize = (bytes: number | null): string => {
      if (!bytes) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFullUrl = (path: string | null): string => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `${BACKEND_URL}/${cleanPath}`;
    };

    // Para archivos del dentista (external_files)
    const getFilePath = (file: any): string => {
      if (typeof file === 'string') return file;
      if (file && typeof file === 'object') {
        return file.path || file.url || file.filename || '';
      }
      return '';
    };

    const getFileName = (file: any): string => {
      if (file && typeof file === 'object' && file.name) return file.name;
      const filePath = getFilePath(file);
      if (!filePath) return 'Archivo';
      return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
    };

    const isImageFile = (file: any): boolean => {
      if (file && typeof file === 'object' && file.type) {
        return file.type.startsWith('image/');
      }
      const filename = getFilePath(file) || (file?.name || '');
      if (!filename) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    return (
      <div className="space-y-6">
        {/* Seccion 1: Resultados de Radiografia (Tecnico de Imagenes) */}
        {hasRadiographyResults && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <FileImage className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Resultados de Radiografia</h4>
                <p className="text-xs text-gray-500">Subidos por el tecnico de imagenes</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {radiographyImages.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {radiographyImages.length} imagen{radiographyImages.length !== 1 ? 'es' : ''}
                  </span>
                )}
                {radiographyDocuments.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    {radiographyDocuments.length} documento{radiographyDocuments.length !== 1 ? 's' : ''}
                  </span>
                )}
                {radiographyLinks.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {radiographyLinks.length} enlace{radiographyLinks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 space-y-4">
              {/* Imagenes de radiografia */}
              {radiographyImages.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Imagenes ({radiographyImages.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {radiographyImages.map((img, idx) => {
                      const fullUrl = getFullUrl(img.file_path);
                      return (
                        <motion.div
                          key={img.result_id || idx}
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedImage(fullUrl)}
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
                                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

              {/* Documentos de radiografia */}
              {radiographyDocuments.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Documentos ({radiographyDocuments.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {radiographyDocuments.map((doc, idx) => {
                      const fullUrl = getFullUrl(doc.file_path);
                      const isPdf = doc.mime_type === 'application/pdf' || doc.original_name?.toLowerCase().endsWith('.pdf');
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
                              {doc.uploader_name && ` • ${doc.uploader_name}`}
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
              {radiographyLinks.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold block mb-2">
                    Enlaces externos ({radiographyLinks.length})
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {radiographyLinks.map((link, idx) => (
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

        {/* Seccion 2: Archivos de Centros Externos (subidos por el dentista) */}
        {hasExamResults && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Archivos de Centros Externos</h4>
                <p className="text-xs text-gray-500">Subidos por el doctor</p>
              </div>
            </div>

            <div className="space-y-4">
              {examResults.map((result, index) => {
                // Parsear external_files
                let files: any[] = [];
                if (result.external_files) {
                  if (Array.isArray(result.external_files)) {
                    files = result.external_files;
                  } else if (typeof result.external_files === 'string') {
                    try {
                      const parsed = JSON.parse(result.external_files);
                      files = Array.isArray(parsed) ? parsed : [result.external_files];
                    } catch {
                      files = [result.external_files];
                    }
                  }
                }

                const imageFiles = files.filter(f => isImageFile(f));
                const otherFiles = files.filter(f => !isImageFile(f));

                return (
                  <div key={index} className="bg-cyan-50 rounded-lg border border-cyan-200 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-cyan-800">
                        Registro #{index + 1}
                      </span>
                      <span className="text-xs text-cyan-600">
                        {result.exam_date
                          ? formatTimestampToLima(result.exam_date, 'date')
                          : 'Sin fecha'}
                      </span>
                    </div>

                    {/* Observaciones */}
                    {result.doctor_observations && (
                      <div className="mb-3">
                        <span className="text-xs uppercase tracking-wider text-cyan-600 font-semibold block mb-1">
                          Observaciones del doctor
                        </span>
                        <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-cyan-100">
                          {result.doctor_observations}
                        </p>
                      </div>
                    )}

                    {/* Imagenes */}
                    {imageFiles.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs uppercase tracking-wider text-cyan-600 font-semibold block mb-2">
                          Imagenes ({imageFiles.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {imageFiles.map((file, fileIdx) => {
                            const fullUrl = getFullUrl(getFilePath(file));
                            const fileName = getFileName(file);
                            return (
                              <motion.div
                                key={fileIdx}
                                whileHover={{ scale: 1.02 }}
                                className="cursor-pointer"
                                onClick={() => setSelectedImage(fullUrl)}
                              >
                                <div className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-cyan-200 shadow-sm bg-white">
                                    <img
                                      src={fullUrl}
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                      }}
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Documentos */}
                    {otherFiles.length > 0 && (
                      <div>
                        <span className="text-xs uppercase tracking-wider text-cyan-600 font-semibold block mb-2">
                          Documentos ({otherFiles.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {otherFiles.map((file, fileIdx) => {
                            const fullUrl = getFullUrl(getFilePath(file));
                            const fileName = getFileName(file);
                            const isPdf = file?.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
                            return (
                              <a
                                key={fileIdx}
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-cyan-200 hover:bg-cyan-100 transition-colors group"
                              >
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${isPdf ? 'bg-red-100' : 'bg-blue-100'}`}>
                                  <FileText className={`w-4 h-4 ${isPdf ? 'text-red-600' : 'text-blue-600'}`} />
                                </div>
                                <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
                                <span className="text-xs text-cyan-600 font-medium">Abrir</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {files.length === 0 && !result.doctor_observations && (
                      <p className="text-sm text-gray-400 text-center py-2 italic">
                        Sin archivos ni observaciones
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Paso 10: Tratamiento Realizado - Checklist de Progreso
  const renderTratamientoRealizado = () => {
    if (!selectedConsultation) return null;

    const definitiveDiagnosis = selectedConsultation.definitive_diagnosis || [];
    const treatmentPlan = selectedConsultation.treatment_plan;
    const treatmentItems = treatmentPlan?.items || [];
    const additionalServices = treatmentPlan?.additional_services || [];
    const completedItems = selectedConsultation.completed_items || [];

    // Separar servicios adicionales por tipo
    const orthodonticServices = additionalServices.filter(s => s.service_type === 'orthodontic');
    const implantServices = additionalServices.filter(s => s.service_type === 'implant');
    const prosthesisServices = additionalServices.filter(s => s.service_type === 'prosthesis');

    // Función para verificar si un item está completado
    const isItemCompleted = (itemName: string, toothNumber?: string | null): boolean => {
      return completedItems.some(ci => {
        const nameMatch = ci.item_name?.toLowerCase() === itemName?.toLowerCase();
        if (toothNumber) {
          return nameMatch && ci.tooth_number === toothNumber;
        }
        return nameMatch;
      });
    };

    // Calcular totales para el progreso
    let totalItems = 0;
    let completedCount = 0;

    // Contar diagnósticos definitivos
    definitiveDiagnosis.forEach(diag => {
      totalItems++;
      if (isItemCompleted(diag.condition_label || diag.condition_name, diag.tooth_number)) {
        completedCount++;
      }
    });

    // Contar tratamientos
    treatmentItems.forEach(item => {
      if (item.conditions && item.conditions.length > 0) {
        item.conditions.forEach(cond => {
          totalItems++;
          if (isItemCompleted(cond.label)) {
            completedCount++;
          }
        });
      }
    });

    // Contar prótesis
    prosthesisServices.forEach(service => {
      totalItems++;
      if (isItemCompleted(service.service_name)) {
        completedCount++;
      }
    });

    const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Si no hay ningún item para mostrar
    if (totalItems === 0 && orthodonticServices.length === 0 && implantServices.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay tratamientos registrados en el plan</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Barra de Progreso */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">$</span>
              <span className="font-semibold text-gray-700">Progreso</span>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {completedCount}/{totalItems} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Grid de 2 columnas para Procedimientos y Tratamientos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Procedimientos del Plan (Diagnóstico Definitivo) */}
          {definitiveDiagnosis.length > 0 && (
            <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-between border-b border-green-200">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800 text-sm">Procedimientos del Plan</span>
                </div>
                <span className="text-xs font-bold text-green-700">
                  {definitiveDiagnosis.filter(d => isItemCompleted(d.condition_label || d.condition_name, d.tooth_number)).length}/{definitiveDiagnosis.length}
                </span>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {definitiveDiagnosis.map((diag, idx) => {
                  const completed = isItemCompleted(diag.condition_label || diag.condition_name, diag.tooth_number);
                  return (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
                        }`}>
                          {completed && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-sm ${completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {diag.condition_label || diag.condition_name}
                        </span>
                        {diag.tooth_number && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            D{diag.tooth_number}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        S/{Number(diag.price || 0).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tratamientos Aplicados */}
          {treatmentItems.length > 0 && (
            <div className="bg-white border border-emerald-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-between border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-800 text-sm">Tratamientos Aplicados</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {treatmentItems.reduce((acc, item) => acc + (item.conditions?.filter(c => isItemCompleted(c.label)).length || 0), 0)}/
                  {treatmentItems.reduce((acc, item) => acc + (item.conditions?.length || 0), 0)}
                </span>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {treatmentItems.map((item, tIdx) => (
                  <div key={tIdx} className="mb-2 last:mb-0">
                    <div className="text-xs font-semibold text-emerald-700 mb-1 px-2">
                      {item.treatment_name}
                    </div>
                    {item.conditions && item.conditions.length > 0 ? (
                      item.conditions.map((cond, cIdx) => {
                        const completed = isItemCompleted(cond.label);
                        return (
                          <div key={cIdx} className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'
                              }`}>
                                {completed && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {cond.label}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              S/{Number(cond.price || 0).toFixed(0)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-gray-500 italic px-2">Sin condiciones detalladas</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Servicios Adicionales - Grid de 3 columnas */}
        {(orthodonticServices.length > 0 || implantServices.length > 0 || prosthesisServices.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ortodoncia */}
            {orthodonticServices.length > 0 && (
              <div className="bg-white border border-green-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">🦷</span>
                    <span className="font-semibold text-white text-sm">Ortodoncia</span>
                  </div>
                  <span className="text-xs font-bold text-white/90">
                    {orthodonticServices.filter(s => s.service_status === 'completed').length}/{orthodonticServices.length}
                  </span>
                </div>
                {orthodonticServices.map((service, idx) => (
                  <div key={idx} className="p-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">{service.service_name}</span>
                      {service.modality && (
                        <span className="text-xs text-gray-500">({service.modality})</span>
                      )}
                      {/* Badge de estado */}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        service.service_status === 'completed' ? 'bg-green-100 text-green-700' :
                        service.service_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {service.service_status === 'completed' ? 'Completado' :
                         service.service_status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </div>
                    <div className={`rounded p-2 mb-2 ${
                      service.inicial_pagado_real ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          $ Inicial {service.inicial_pagado_real && <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />}
                        </span>
                        <span className={`font-bold ${service.inicial_pagado_real ? 'text-green-700' : 'text-yellow-700'}`}>
                          S/.{Number(service.inicial || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">Cuotas:</span> {service.cuotas_pagadas_reales || 0} de {service.monthly_payments_count || 0} (S/.{Number(service.mensual || 0).toFixed(2)} c/u)
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-gray-800">S/.{Number(service.monto_total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Implantes */}
            {implantServices.length > 0 && (
              <div className="bg-white border border-blue-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">🔩</span>
                    <span className="font-semibold text-white text-sm">Implantes</span>
                  </div>
                  <span className="text-xs font-bold text-white/90">
                    {implantServices.filter(s => s.service_status === 'completed').length}/{implantServices.length}
                  </span>
                </div>
                {implantServices.map((service, idx) => (
                  <div key={idx} className="p-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">{service.service_name}</span>
                      {/* Badge de estado */}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        service.service_status === 'completed' ? 'bg-green-100 text-green-700' :
                        service.service_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {service.service_status === 'completed' ? 'Completado' :
                         service.service_status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </div>
                    <div className={`rounded p-2 mb-2 ${
                      service.inicial_pagado_real ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          $ Inicial {service.inicial_pagado_real && <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />}
                        </span>
                        <span className={`font-bold ${service.inicial_pagado_real ? 'text-green-700' : 'text-yellow-700'}`}>
                          S/.{Number(service.inicial || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      <span className="font-medium">Cuotas:</span> {service.cuotas_pagadas_reales || 0} de {service.monthly_payments_count || 0} (S/.{Number(service.mensual || 0).toFixed(2)} c/u)
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-gray-800">S/.{Number(service.monto_total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Prótesis */}
            {prosthesisServices.length > 0 && (
              <div className="bg-white border border-pink-300 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">🔧</span>
                    <span className="font-semibold text-white text-sm">Prótesis</span>
                  </div>
                  <span className="text-xs font-bold text-white/90">
                    {prosthesisServices.filter(s => s.service_status === 'completed').length}/{prosthesisServices.length}
                  </span>
                </div>
                <div className="p-2">
                  {prosthesisServices.map((service, idx) => {
                    const completed = service.service_status === 'completed';
                    return (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            completed ? 'bg-pink-500 border-pink-500' : 'border-gray-300 bg-white'
                          }`}>
                            {completed && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {service.service_name}
                          </span>
                          {/* Badge de estado */}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            service.service_status === 'completed' ? 'bg-green-100 text-green-700' :
                            service.service_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {service.service_status === 'completed' ? 'Completado' :
                             service.service_status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          S/{Number(service.monto_total || 0).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Paso 5: Recetas Medicas - Grid de 2 columnas (cada columna = 1 receta)
  const renderRecetasMedicas = () => {
    if (!selectedConsultation) return null;

    const prescriptions = selectedConsultation.prescriptions || [];

    if (prescriptions.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <Pill className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay recetas medicas registradas</p>
        </div>
      );
    }

    // Contar total de medicamentos
    const totalMedicamentos = prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);

    // Obtener nombre del doctor de la consulta
    const doctorName = selectedConsultation.dentist_name || 'Doctor no especificado';
    const specialty = selectedConsultation.specialty_name || '';

    return (
      <div>
        {/* Header con contador */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            Medicamentos prescritos por el doctor
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {prescriptions.length} receta{prescriptions.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              {totalMedicamentos} medicamento{totalMedicamentos !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Grid de Recetas - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((prescription, pIdx) => (
            <div key={pIdx} className="border border-indigo-200 rounded-lg overflow-hidden bg-white flex flex-col">
              {/* Header de la receta */}
              <div className="px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <Pill className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-white text-sm">
                      Receta #{pIdx + 1}
                    </span>
                  </div>
                  <span className="text-xs text-white/90 bg-white/20 px-2 py-0.5 rounded">
                    {prescription.items?.length || 0} med.
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-white/80">
                  <span className="text-white/60">Emitida:</span>{' '}
                  <span className="text-white font-medium">
                    {formatTimestampToLima(prescription.prescription_date, 'date')}
                  </span>
                </div>
              </div>

              {/* Grid de medicamentos - 2 columnas dentro de cada receta */}
              <div className="flex-1 p-4">
                {prescription.items && prescription.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prescription.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-lg p-3 border border-indigo-100"
                      >
                        {/* Numero del medicamento */}
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-indigo-100">
                          <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                            {iIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-indigo-700">
                            Medicamento {iIdx + 1}
                          </span>
                        </div>

                        {/* Nombre del medicamento */}
                        <div className="mb-2">
                          <span className="text-[11px] uppercase tracking-wider text-indigo-500 font-semibold block mb-0.5">
                            Nombre del medicamento
                          </span>
                          <span className="font-bold text-gray-900 text-base block leading-tight">
                            {item.medication_name || 'No especificado'}
                          </span>
                        </div>

                        {/* Concentracion / Dosis */}
                        <div className="mb-2">
                          <span className="text-[11px] uppercase tracking-wider text-indigo-500 font-semibold block mb-0.5">
                            Concentracion / Dosis
                          </span>
                          <span className="text-sm text-gray-700">
                            {item.concentration || 'No especificada'}
                          </span>
                        </div>

                        {/* Cantidad a comprar */}
                        <div className="mb-2">
                          <span className="text-[11px] uppercase tracking-wider text-indigo-500 font-semibold block mb-0.5">
                            Cantidad a comprar
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-semibold">
                            {item.quantity || '0'} {Number(item.quantity) === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>

                        {/* Indicaciones de uso */}
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-indigo-500 font-semibold block mb-0.5">
                            Indicaciones de uso
                          </span>
                          {item.instructions ? (
                            <p className="text-sm text-gray-700 leading-relaxed bg-white/70 rounded p-2 border border-indigo-100 mt-0.5">
                              {item.instructions}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Seguir indicaciones del envase
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Sin medicamentos en esta receta
                  </p>
                )}
              </div>

              {/* Notas de la receta */}
              {prescription.prescription_notes && (
                <div className="px-3 py-2 bg-amber-50 border-t border-amber-200">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-500 text-xs">⚠</span>
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Nota:</span> {prescription.prescription_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Firma del doctor */}
              <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 mt-auto">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                      Prescrito por
                    </span>
                    <p className="font-semibold text-gray-900 text-base">{doctorName}</p>
                    {specialty && (
                      <p className="text-sm text-gray-500">{specialty}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="border-t-2 border-gray-400 pt-1.5 min-w-[120px]">
                      <p className="text-sm text-gray-500 italic">Firma del Doctor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer informativo */}
        <div className="mt-4 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">i</span>
            <span>
              <strong>Importante:</strong> Siga las indicaciones de su doctor. Ante cualquier reaccion adversa, consulte inmediatamente.
            </span>
          </p>
        </div>
      </div>
    );
  };

  const renderPresupuesto = () => {
    if (!selectedConsultation) return null;

    const budget = selectedConsultation.budget;

    if (!budget) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay presupuesto registrado para esta consulta</p>
        </div>
      );
    }

    const getStatusBadge = () => {
      const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
        draft: { label: 'Borrador', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
        approved: { label: 'Aprobado', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        rejected: { label: 'Rechazado', bgColor: 'bg-red-100', textColor: 'text-red-800' },
        completed: { label: 'Completado', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
      };
      const config = statusConfig[budget.budget_status] || statusConfig.draft;
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
          {config.label}
        </span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Presupuesto de la Consulta</h4>
          {getStatusBadge()}
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Diagnostico Definitivo:</span>
              <span className="font-medium">S/ {Number(budget.definitive_diagnosis_total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tratamientos:</span>
              <span className="font-medium">S/ {Number(budget.treatments_total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Servicios Adicionales:</span>
              <span className="font-medium">S/ {Number(budget.additional_services_total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Examenes:</span>
              <span className="font-medium">S/ {Number(budget.exams_total || 0).toFixed(2)}</span>
            </div>
            <hr className="border-amber-300" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-amber-700">S/ {Number(budget.grand_total || 0).toFixed(2)}</span>
            </div>
            <hr className="border-amber-300" />
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Adelanto:</span>
              <span className="font-medium text-green-700">S/ {Number(budget.advance_payment || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-red-600">Saldo Pendiente:</span>
              <span className="text-red-700">S/ {Number(budget.balance || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {budget.budget_observations && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Observaciones</h5>
            <p className="text-sm text-gray-700">{budget.budget_observations}</p>
          </div>
        )}
      </div>
    );
  };

  // ========================= MAIN RENDER =========================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${USE_CYAN_THEME ? 'bg-cyan-100' : 'bg-purple-100'}`}>
              <FileText className={`w-6 h-6 ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Historial Medico</h1>
              <p className="text-gray-600">Atenciones integrales y tratamientos registrados</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className={`p-4 rounded-lg ${USE_CYAN_THEME ? 'bg-cyan-50' : 'bg-purple-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`}>Total Consultas</p>
                <p className={`text-2xl font-bold ${USE_CYAN_THEME ? 'text-cyan-900' : 'text-purple-900'}`}>
                  {summary?.total_consultations || consultations.length}
                </p>
              </div>
              <FileText className={`w-8 h-8 ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`} />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Ultima Consulta</p>
                <p className="text-lg font-bold text-blue-900">
                  {summary?.last_consultation_date
                    ? formatTimestampToLima(summary.last_consultation_date, 'date')
                    : 'N/A'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Procedimientos Completados</p>
                <p className="text-2xl font-bold text-green-900">{summary?.completed_procedures || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Radiografias del Laboratorio (sin consulta asociada) */}
      {laboratoryRadiographyRequests.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Radiografias del Laboratorio</h2>
              <p className="text-sm text-gray-500">Estudios solicitados directamente por el laboratorio de imagenes</p>
            </div>
          </div>

          <div className="space-y-3">
            {laboratoryRadiographyRequests.map((request: any) => (
              <div
                key={request.radiography_request_id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {request.radiography_type || 'Radiografia'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.request_status === 'completed' ? 'bg-green-100 text-green-700' :
                        request.request_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        request.request_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.request_status === 'completed' ? 'Completado' :
                         request.request_status === 'in_progress' ? 'En progreso' :
                         request.request_status === 'cancelled' ? 'Cancelado' :
                         'Pendiente'}
                      </span>
                    </div>

                    {request.area_of_interest && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Area:</span> {request.area_of_interest}
                      </p>
                    )}

                    {request.clinical_indication && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Indicacion:</span> {request.clinical_indication}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Solicitado: {formatTimestampToLima(request.request_date, 'date')}
                    </p>

                    {request.performed_date && (
                      <p className="text-xs text-green-600 mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Realizado: {formatTimestampToLima(request.performed_date, 'date')}
                      </p>
                    )}

                    {request.findings && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Hallazgos:</p>
                        <p className="text-sm text-blue-800">{request.findings}</p>
                      </div>
                    )}

                    {/* Mostrar resultados/imagenes si existen */}
                    {request.results && request.results.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Imagenes:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {request.results.map((result: any, idx: number) => (
                            <div key={idx} className="relative group">
                              {result.image_url ? (
                                <img
                                  src={`${BACKEND_URL}${result.image_url}`}
                                  alt={`Resultado ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(`${BACKEND_URL}${result.image_url}`)}
                                />
                              ) : (
                                <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <button
                                onClick={() => result.image_url && setSelectedImage(`${BACKEND_URL}${result.image_url}`)}
                                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <ZoomIn className="w-6 h-6 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Consultas */}
      {!selectedConsultation ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona una atencion integral</h2>

          {consultations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay atenciones registradas</h3>
              <p className="text-gray-600">Tus atenciones integrales apareceran aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((consultation) => (
                <motion.button
                  key={consultation.consultation_id}
                  onClick={() => handleSelectConsultation(consultation)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${USE_CYAN_THEME ? 'bg-cyan-100' : 'bg-purple-100'}`}>
                        <FileText className={`w-6 h-6 ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatDateLong(consultation.consultation_date, true)}
                        </div>
                        <div className="text-sm text-gray-600">{consultation.dentist_name}</div>
                        {consultation.specialty_name && (
                          <div className="text-xs text-gray-500">{consultation.specialty_name}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Boton Volver */}
          <button
            onClick={() => setSelectedConsultation(null)}
            className={`flex items-center gap-2 font-medium ${USE_CYAN_THEME ? 'text-cyan-600 hover:text-cyan-700' : 'text-purple-600 hover:text-purple-700'}`}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Volver a la lista
          </button>

          {/* Informacion de la Consulta Seleccionada */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${USE_CYAN_THEME ? 'bg-cyan-100' : 'bg-purple-100'}`}>
                <FileText className={`w-6 h-6 ${USE_CYAN_THEME ? 'text-cyan-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Atencion Integral del{' '}
                  {formatDateLong(selectedConsultation.consultation_date, false)}
                </h2>
                <p className="text-gray-600">{selectedConsultation.dentist_name}</p>
                {selectedConsultation.specialty_name && (
                  <p className="text-sm text-gray-500">{selectedConsultation.specialty_name} - {selectedConsultation.branch_name}</p>
                )}
              </div>
            </div>

            {/* Pasos */}
            <div className="space-y-4">
              {STEP_CONFIG.map((step) => renderStep(step.number))}
            </div>
          </div>
        </>
      )}

      {/* Modal para Agendar Cita */}
      <RequestAppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={() => {
          setShowAppointmentModal(false);
          toast.success('Cita agendada exitosamente');
        }}
      />

      {/* Modal para ver imagen en pantalla completa */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientMedicalHistory;
