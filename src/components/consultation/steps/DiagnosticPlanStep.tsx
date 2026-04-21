/**
 * Step 4: Plan para el Diagnóstico Definitivo
 *
 * Componente que permite al doctor seleccionar exámenes de diagnóstico:
 * - Tomografía 3D
 * - Radiografías
 *
 * Los datos se guardan en la base de datos (tabla radiography_requests)
 * y se notifica automáticamente a los técnicos de laboratorio.
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  FileImage,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { radiographyRequestsApi } from '@/services/api/radiographyRequestsApi';
import { dentistsApi, type DentistData } from '@/services/api/dentistsApi';

// Componentes unificados
import {
  Tomografia3DSection,
  RadiografiasSection,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  type Tomografia3DFormData,
  type RadiografiasFormData
} from '@/components/laboratory-form';

// Hooks de precios
import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';

// Fuente única de verdad para armar el desglose (compartido con técnico y admin)
import { buildBreakdownFromFormData } from '@/utils/pricing/breakdownBuilder';

interface DiagnosticPlanStepProps {
  currentRecord: any;
  setCurrentRecord: (record: any) => void;
  setUnsavedChanges: (val: boolean) => void;
  selectedPatient?: any;
  readOnly?: boolean;
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

/**
 * Verifica si hay alguna selección en Tomografía 3D
 */
const hasTomografiaSelection = (data: Tomografia3DFormData): boolean => {
  // Verificar campos booleanos principales
  const booleanFields: (keyof Tomografia3DFormData)[] = [
    'conInforme', 'sinInforme', 'dicom', 'soloUsb',
    'endodoncia', 'fracturaRadicular', 'anatomiaEndodontica',
    'localizacionDiente', 'implantes', 'conGuiaQx', 'maxilarSuperior',
    'viaAerea', 'ortognatica',
    'marpe', 'miniImplantes', 'intraAlveolares', 'extraAlveolares', 'infracigomatico', 'buccalShelf',
    'atm', 'macizoFacial'
  ];

  return booleanFields.some(field => data[field] === true);
};

/**
 * Verifica si hay alguna selección en Radiografías
 */
const hasRadiografiasSelection = (data: RadiografiasFormData): boolean => {
  // Verificar campos booleanos
  const booleanFields: (keyof RadiografiasFormData)[] = [
    'bitewingMolaresDerecha', 'bitewingMolaresIzquierda', 'bitewingPremolaresDerecha', 'bitewingPremolaresIzquierda',
    'oclusalSuperiores', 'oclusalInferiores',
    'seriada', 'fotografias', 'fotografiaIntraoral', 'fotografiaExtraoral',
    'extraoralPanoramica', 'extraoralCefalometrica', 'extraoralCarpal', 'carpalFishman', 'carpalTtw2',
    'extraoralPosteriorAnterior', 'posteriorAnteriorRicketts', 'extraoralAtmAbierta', 'extraoralAtmCerrada', 'extraoralFotografia',
    'ortodonciaAlineadores', 'alineadoresPlanificacion', 'alineadoresImpresion',
    'ortodonciaEscaneo', 'escaneoIntraoral', 'escaneoIntraoralZocalo', 'escaneoIntraoralInforme',
    'ortodonciaImpresion', 'modelosDigitalesConInforme', 'modelosDigitalesSinInforme', 'modelosImpresionDigital',
    'analisisRicketts', 'analisisSchwartz', 'analisisSteiner', 'analisisMcNamara', 'analisisTweed',
    'analisisDowns', 'analisisBjorks', 'analisisUSP', 'analisisRotJarabak', 'analisisTejidosBlancos'
  ];

  const hasBooleanSelection = booleanFields.some(field => data[field] === true);

  // Verificar arrays con selecciones
  const hasArraySelection =
    (data.intraoralTipo?.length > 0) ||
    (data.extraoralTipo?.length > 0) ||
    (data.ortodonciaTipo?.length > 0) ||
    (data.periapicalFisico?.length > 0) ||
    (data.periapicalDigital?.length > 0) ||
    (data.dientesSuperioresFisico?.length > 0) ||
    (data.dientesInferioresFisico?.length > 0) ||
    (data.dientesTemporalesFisico?.length > 0) ||
    (data.dientesSuperioresDigital?.length > 0) ||
    (data.dientesInferioresDigital?.length > 0) ||
    (data.dientesTemporalesDigital?.length > 0);

  // Verificar paquete de ortodoncia
  const hasPaqueteSelection = data.ortodonciaPaquete > 0;

  return hasBooleanSelection || hasArraySelection || hasPaqueteSelection;
};

/**
 * Calcula los datos de precios basándose en la selección usando el util compartido
 * `buildBreakdownFromFormData` — misma lógica que emplean SetPriceModal y RequestDetailsModal.
 * Guarda el breakdown en formato canónico (category, itemName, itemKey, basePrice, quantity, subtotal).
 */
const calculatePricingData = (
  tomografia3D: Tomografia3DFormData,
  radiografias: RadiografiasFormData,
  tomografiaPricing: any,
  radiografiasPricing: any
) => {
  const items = buildBreakdownFromFormData(
    { tomografia3D, radiografias },
    tomografiaPricing,
    radiografiasPricing
  );
  const breakdown = items.map(it => ({
    category: it.category,
    itemName: it.itemName,
    itemKey: it.itemKey,
    basePrice: it.price,
    quantity: it.quantity,
    subtotal: it.price * (it.quantity || 1)
  }));
  const subtotal = breakdown.reduce((s, it) => s + (it.subtotal || 0), 0);
  return {
    breakdown,
    subtotal,
    suggestedPrice: subtotal,
    finalPrice: null,
    status: 'pending_approval'
  };
};

const DiagnosticPlanStepComponent = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges,
  selectedPatient,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: DiagnosticPlanStepProps) => {
  const { user } = useAuth();

  // Estado para datos del dentista (COP, especialidad)
  const [dentistData, setDentistData] = useState<DentistData | null>(null);

  // Guardia anti-clic-doble. Si un save está en curso, descartamos nuevos disparos
  // hasta que termine. Evita crear 2 registros cuando el usuario hace clic rápido
  // en "Guardar" dentro de Tomografía y luego en Radiografías (o viceversa).
  const isSavingRef = useRef(false);

  // Cargar datos del dentista desde la API
  useEffect(() => {
    const loadDentistData = async () => {
      if (user?.dentist_id) {
        try {
          const response = await dentistsApi.getDentistById(user.dentist_id);
          setDentistData(response.data);
        } catch (error) {
          // Error silencioso - los datos del dentista son opcionales para el guardado
        }
      }
    };
    loadDentistData();
  }, [user?.dentist_id]);

  // Cargar precios desde la API
  const tomografiaPricing = useTomografia3DPricing();
  const radiografiasPricing = useRadiografiasPricing();

  // Obtener paciente de currentRecord si no se pasa como prop
  const patient = selectedPatient || currentRecord?.patient;

  // Datos de Tomografía 3D (fusionados con valores iniciales)
  const tomografia3D: Tomografia3DFormData = {
    ...INITIAL_TOMOGRAFIA_FORM,
    ...currentRecord.diagnosticPlan?.tomografia3D
  };

  // Datos de Radiografías (fusionados con valores iniciales)
  const radiografias: RadiografiasFormData = {
    ...INITIAL_RADIOGRAFIAS_FORM,
    ...currentRecord.diagnosticPlan?.radiografias
  };

  // Actualizar tomografía
  const updateTomografia = (field: keyof Tomografia3DFormData, value: any) => {
    setCurrentRecord((prev: any) => ({
      ...prev,
      diagnosticPlan: {
        ...prev.diagnosticPlan,
        tomografia3D: {
          ...tomografia3D,
          [field]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  // Actualizar radiografías
  const updateRadiografias = (field: keyof RadiografiasFormData, value: any) => {
    setCurrentRecord((prev: any) => ({
      ...prev,
      diagnosticPlan: {
        ...prev.diagnosticPlan,
        radiografias: {
          ...radiografias,
          [field]: value
        }
      }
    }));
    setUnsavedChanges(true);
  };

  /**
   * Guarda la solicitud de exámenes en la base de datos.
   * El endpoint /radiography/upsert decide server-side:
   *   - Si se envía radiography_request_id (hint) y sigue 'pending' → UPDATE sobre ese.
   *   - Si no, busca por consultation_id y actualiza la última 'pending'.
   *   - En cualquier otro caso, crea una solicitud nueva.
   * La operación va envuelta en una transacción con pg_advisory_xact_lock para
   * serializar saves simultáneos sobre la misma consulta/paciente.
   */
  const saveRadiographyRequest = async () => {
    // Guardia anti-concurrencia: si otro save está en vuelo, no disparamos uno nuevo.
    if (isSavingRef.current) return true;
    isSavingRef.current = true;
    try {
      // Validar datos mínimos
      if (!patient) {
        toast.error('No se ha seleccionado un paciente');
        return false;
      }

      if (!user) {
        toast.error('No se ha identificado al usuario');
        return false;
      }

      // Verificar que se haya seleccionado al menos un examen
      const hasTomo = hasTomografiaSelection(tomografia3D);
      const hasRadio = hasRadiografiasSelection(radiografias);
      const hasSelection = hasTomo || hasRadio;

      if (!hasSelection) {
        // No hay exámenes seleccionados, no crear solicitud vacía
        return true;
      }

      // Calcular precios
      const pricingData = calculatePricingData(
        tomografia3D,
        radiografias,
        tomografiaPricing.pricing,
        radiografiasPricing.pricing
      );

      // Calcular edad del paciente
      const birthDateValue = patient.birthDate || patient.date_of_birth || patient.dateOfBirth;
      let edadPaciente = '';
      if (birthDateValue) {
        const birthYear = new Date(birthDateValue).getFullYear();
        const currentYear = new Date().getFullYear();
        edadPaciente = String(currentYear - birthYear);
      }

      // Preparar datos del paciente (formato compatible con RequestDetailsModal)
      const patientData = {
        // Nombre completo y también separado para compatibilidad
        nombre: patient.firstName && patient.lastName
          ? `${patient.firstName} ${patient.lastName}`
          : patient.first_name && patient.last_name
            ? `${patient.first_name} ${patient.last_name}`
            : patient.name || 'Paciente',
        nombres: patient.firstName || patient.first_name || patient.name?.split(' ')[0] || '',
        apellidos: patient.lastName || patient.last_name || patient.name?.split(' ').slice(1).join(' ') || '',
        edad: edadPaciente,
        dni: patient.documentNumber || patient.identification_number || patient.dni || '',
        telefono: patient.phone || patient.telefono || '',
        email: patient.email || '',
        motivoConsulta: currentRecord.consultationReason || ''
      };

      // Preparar datos del doctor (formato compatible con RequestDetailsModal)
      // Usar datos de dentistData (de la tabla dentists) para COP y especialidad
      // El campo COP está en professional_license (columna real de la BD)
      const copDoctor = dentistData?.professional_license || dentistData?.license_number || '';
      const especialidadDoctor = dentistData?.specialty_name ||
        (dentistData?.specialties && dentistData.specialties.length > 0
          ? dentistData.specialties.map(s => s.specialty_name).join(', ')
          : '');

      const doctorData = {
        // Nombre completo y también separado para compatibilidad
        doctor: dentistData?.first_name && dentistData?.last_name
          ? `${dentistData.first_name} ${dentistData.last_name}`
          : user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.profile?.firstName && user.profile?.lastName
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : 'Doctor',
        nombres: dentistData?.first_name || user.firstName || user.profile?.firstName || '',
        apellidos: dentistData?.last_name || user.lastName || user.profile?.lastName || '',
        cop: copDoctor,
        especialidad: especialidadDoctor,
        direccion: user.address || user.profile?.address || '',
        email: dentistData?.email || user.email || '',
        telefono: dentistData?.phone || dentistData?.mobile || user.phone || user.profile?.phone || ''
      };

      // Preparar payload para la API.
      // radiography_request_id se envía como "hint" cuando ya tenemos uno de un save
      // previo en esta misma sesión. Permite que el BE localice el registro aun cuando
      // la consulta (consultation_id) todavía no existiera al momento del primer save.
      const requestPayload = {
        radiography_request_id:
          currentRecord.radiography_request_id || currentRecord.radiographyRequestId || null,
        patient_id: patient.patient_id || patient.id,
        dentist_id: user.dentist_id || user.id,
        branch_id: user.branch_id || user.profile?.branch_id || 1,
        consultation_id: currentRecord.consultationId || currentRecord.consultation_id || null,
        appointment_id: currentRecord.appointmentId || currentRecord.appointment_id || null,
        request_date: formatDateToYMD(new Date()),
        radiography_type: 'diagnostic_plan',
        urgency: 'normal' as const,
        request_status: 'pending' as const,
        clinical_indication: currentRecord.consultationReason || '',
        request_data: {
          patientData,
          doctorData,
          tomografia3D,
          radiografias
        },
        pricing_data: pricingData
      };

      // Llamar al endpoint upsert
      const response = await radiographyRequestsApi.upsertRequest(requestPayload);

      if (response.success && response.data) {
        // Guardar el ID de la solicitud en el record
        setCurrentRecord((prev: any) => ({
          ...prev,
          radiography_request_id: response.data.radiography_request_id
        }));

        // El servidor decide: si la última solicitud de la consulta sigue en
        // 'pending' la actualiza; si ya fue procesada o no existe, crea una nueva.
        if (response.wasUpdated) {
          toast.success('Solicitud actualizada (aún pendiente de atención)');
        } else {
          toast.success('Nueva solicitud enviada al técnico de imágenes');
        }

        return true;
      } else {
        toast.error('No se pudo procesar la solicitud de exámenes');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud de exámenes');
      return false;
    } finally {
      isSavingRef.current = false;
    }
  };

  // Función unificada para guardar desde cualquier sección
  const handleSaveSection = async () => {
    await saveRadiographyRequest();
    onSave();
  };

  const handleContinue = async () => {
    await saveRadiographyRequest();
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      {/* Header Principal */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FileImage className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Plan para el Diagnóstico Definitivo</h1>
            <p className="text-purple-100">Seleccione los exámenes necesarios para confirmar el diagnóstico</p>
          </div>
        </div>
      </div>

      {/* Indicador de carga de precios */}
      {(tomografiaPricing.fetching || radiografiasPricing.fetching) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-700">Cargando precios configurados...</span>
        </div>
      )}

      {/* Mensaje informativo */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Información importante</p>
          <p>Al guardar la solicitud, se enviará una notificación automática al técnico de laboratorio para que prepare los exámenes solicitados.</p>
        </div>
      </div>

      {/* Paso 1: Tomografía 3D - Componente Unificado */}
      <Tomografia3DSection
        mode={readOnly ? 'view' : 'edit'}
        colorTheme="purple"
        showPrices={true}
        formData={tomografia3D}
        onFormChange={updateTomografia}
        pricing={tomografiaPricing.pricing}
        onSave={handleSaveSection}
        loading={tomografiaPricing.loading}
      />

      {/* Paso 2: Radiografías - Componente Unificado */}
      <RadiografiasSection
        mode={readOnly ? 'view' : 'edit'}
        colorTheme="indigo"
        showPrices={true}
        formData={radiografias}
        onFormChange={updateRadiografias}
        pricing={radiografiasPricing.pricing}
        onSave={handleSaveSection}
        loading={radiografiasPricing.loading}
      />

      {/* Navegación */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          disabled={readOnly}
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Diagnóstico
        </button>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await saveRadiographyRequest();
              onSave();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            disabled={readOnly}
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-2"
            disabled={readOnly}
          >
            Continuar a Tratamientos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Exportar el componente memoizado
export const DiagnosticPlanStep = memo(DiagnosticPlanStepComponent);
