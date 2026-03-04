/**
 * FORMULARIO PÚBLICO - TOMOGRAFÍAS 3D + RADIOGRAFÍAS
 *
 * MIGRADO: Ahora usa componentes unificados de @/components/laboratory-form
 * Los precios se cargan desde la API y se muestran junto a cada opción
 *
 * Flujo de 2 pasos:
 * - Paso 1: Datos del paciente + Tomografía 3D
 * - Paso 2: Datos del doctor + Radiografías
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileImage, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicForm } from '@/types';
import { publicFormsApi } from '@/services/api/publicFormsApi';

// Componentes unificados
import {
  Tomografia3DSection,
  RadiografiasSection,
  PatientDataSection,
  DoctorDataSection,
  INITIAL_TOMOGRAFIA_FORM,
  INITIAL_RADIOGRAFIAS_FORM,
  INITIAL_PATIENT_DATA,
  INITIAL_DOCTOR_DATA,
  type Tomografia3DFormData,
  type RadiografiasFormData,
  type PatientData,
  type DoctorData
} from '@/components/laboratory-form';

// Hooks de precios
import { useTomografia3DPricing } from '@/app/admin/pages/laboratory-services/hooks/useTomografia3DPricing';
import { useRadiografiasPricing } from '@/app/admin/pages/laboratory-services/hooks/useRadiografiasPricing';

const PublicFormPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<PublicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Estado del formulario usando tipos unificados
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [doctorData, setDoctorData] = useState<DoctorData>(INITIAL_DOCTOR_DATA);
  const [tomografiaData, setTomografiaData] = useState<Tomografia3DFormData>(INITIAL_TOMOGRAFIA_FORM);
  const [radiografiasData, setRadiografiasData] = useState<RadiografiasFormData>(INITIAL_RADIOGRAFIAS_FORM);

  // Cargar precios desde la API
  const tomografiaPricing = useTomografia3DPricing();
  const radiografiasPricing = useRadiografiasPricing();

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setIsLoading(true);

      const response = await publicFormsApi.getPublicForms({ code: formId });

      if (!response.data || response.data.length === 0) {
        toast.error('Formulario no encontrado');
        setIsLoading(false);
        return;
      }

      const formData = response.data[0];

      if (!formData.is_active) {
        toast.error('Este formulario ya no está disponible');
        setIsLoading(false);
        return;
      }

      const mappedForm: PublicForm = {
        id: formData.form_id?.toString() || '',
        code: formData.form_code || '',
        type: formData.form_type || 'radiography',
        title: formData.title || '',
        description: formData.description || '',
        active: formData.is_active,
        createdAt: new Date(formData.created_at || Date.now()),
        expiresAt: formData.expires_at ? new Date(formData.expires_at) : undefined,
        maxSubmissions: formData.max_submissions,
        currentSubmissions: formData.current_submissions || 0,
        allowMultipleSubmissions: formData.allow_multiple_submissions || false
      };

      setForm(mappedForm);
    } catch (error) {
      toast.error('Error al cargar el formulario');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para actualizar datos
  const handlePatientChange = (field: keyof PatientData, value: string) => {
    setPatientData((prev: PatientData) => ({ ...prev, [field]: value }));
  };

  const handleDoctorChange = (field: keyof DoctorData, value: string) => {
    setDoctorData((prev: DoctorData) => ({ ...prev, [field]: value }));
  };

  const handleTomografiaChange = (field: keyof Tomografia3DFormData, value: any) => {
    setTomografiaData((prev: Tomografia3DFormData) => ({ ...prev, [field]: value }));
  };

  const handleRadiografiasChange = (field: keyof RadiografiasFormData, value: any) => {
    setRadiografiasData((prev: RadiografiasFormData) => ({ ...prev, [field]: value }));
  };

  // Validación del paso 1
  const validateStep1 = (): boolean => {
    const errors: string[] = [];

    // Validar datos del paciente
    if (!patientData.nombres.trim()) errors.push('El nombre del paciente es obligatorio');
    if (!patientData.apellidos.trim()) errors.push('Los apellidos del paciente son obligatorios');
    if (!patientData.dni.trim()) errors.push('El DNI del paciente es obligatorio');
    if (!patientData.telefono.trim()) errors.push('El teléfono del paciente es obligatorio');

    // No es obligatorio seleccionar tomografía (puede querer solo radiografías)

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }

    return true;
  };

  // Validación del paso 2
  const validateStep2 = (): boolean => {
    const errors: string[] = [];

    // Validar datos del doctor
    if (!doctorData.nombres.trim()) errors.push('El nombre del odontólogo es obligatorio');
    if (!doctorData.apellidos.trim()) errors.push('Los apellidos del odontólogo son obligatorios');
    if (!doctorData.cop.trim()) errors.push('El COP del odontólogo es obligatorio');

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStep1()) return;
    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      handleNextStep();
      return;
    }

    if (!form) return;

    if (!validateStep2()) return;

    try {
      setIsSubmitting(true);

      // Construir datos de envío
      const submissionData = {
        form_id: parseInt(form.id),
        form_code: form.code,
        form_title: form.title,
        status: 'pending',
        form_type: 'radiography',
        submission_data: JSON.stringify({
          patientData: {
            nombre: `${patientData.nombres} ${patientData.apellidos}`,
            nombres: patientData.nombres,
            apellidos: patientData.apellidos,
            edad: patientData.edad || undefined,
            dni: patientData.dni,
            telefono: patientData.telefono || undefined,
            email: patientData.email || undefined,
            motivoConsulta: patientData.motivoConsulta || undefined
          },
          doctorData: {
            doctor: `${doctorData.nombres} ${doctorData.apellidos}`,
            nombres: doctorData.nombres,
            apellidos: doctorData.apellidos,
            cop: doctorData.cop || undefined,
            especialidad: doctorData.especialidad || undefined,
            direccion: doctorData.direccion || undefined,
            email: doctorData.email || undefined,
            telefono: doctorData.telefono || undefined
          },
          tomografia3D: tomografiaData,
          radiografias: radiografiasData
        }),
        submitted_at: new Date().toISOString()
      };

      await publicFormsApi.submitPublicForm(submissionData);

      setIsSubmitted(true);
      toast.success('¡Solicitud enviada correctamente!');
    } catch (error) {
      toast.error('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">Cargando formulario...</span>
        </div>
      </div>
    );
  }

  // Formulario no encontrado
  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Formulario no encontrado</h1>
          <p className="text-gray-600">El formulario que buscas no existe o ya no está disponible</p>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-6">
            Hemos recibido tu solicitud de estudios de imágenes. Nuestro equipo técnico se pondrá en contacto contigo pronto para coordinar la cita.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-purple-900 mb-2">Detalles de tu solicitud:</p>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Paciente: {patientData.nombres} {patientData.apellidos}</li>
              <li>• DNI: {patientData.dni}</li>
              <li>• Teléfono: {patientData.telefono}</li>
              <li>• Odontólogo: Dr(a) {doctorData.nombres} {doctorData.apellidos}</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Por favor, mantén tu teléfono disponible. Te contactaremos dentro de las próximas 24 horas.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-7xl mx-auto overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {currentStep === 1 ? 'Paso 1: Datos del Paciente y Tomografía 3D' : 'Paso 2: Datos del Doctor y Radiografías'}
              </h2>
              <p className="text-purple-100 text-sm">PanoCef - Centro de Imágenes Dentomaxilofacial</p>
            </div>
            <div className="text-white text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Paso {currentStep} de 2
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>

        {/* Indicador de carga de precios */}
        {(tomografiaPricing.fetching || radiografiasPricing.fetching) && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700 text-sm">Cargando precios configurados...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {currentStep === 1 ? (
              // PASO 1: DATOS DEL PACIENTE + TOMOGRAFÍA 3D
              <div className="space-y-6">
                {/* Sección de Datos del Paciente */}
                <PatientDataSection
                  data={patientData}
                  onChange={handlePatientChange}
                  colorTheme="purple"
                />

                {/* Sección de Tomografía 3D con precios */}
                <Tomografia3DSection
                  mode="edit"
                  colorTheme="purple"
                  showPrices={true}
                  formData={tomografiaData}
                  onFormChange={handleTomografiaChange}
                  pricing={tomografiaPricing.pricing}
                  loading={tomografiaPricing.loading}
                />
              </div>
            ) : (
              // PASO 2: DATOS DEL DOCTOR + RADIOGRAFÍAS
              <div className="space-y-6">
                {/* Sección de Datos del Doctor */}
                <DoctorDataSection
                  data={doctorData}
                  onChange={handleDoctorChange}
                  colorTheme="purple"
                />

                {/* Sección de Radiografías con precios */}
                <RadiografiasSection
                  mode="edit"
                  colorTheme="indigo"
                  showPrices={true}
                  formData={radiografiasData}
                  onFormChange={handleRadiografiasChange}
                  pricing={radiografiasPricing.pricing}
                  loading={radiografiasPricing.loading}
                />
              </div>
            )}
          </div>

          {/* Footer - Navigation Buttons */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 ? (
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Solicitud
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PublicFormPage;
