/**
 * Modal para crear formularios de radiografía
 *
 * MIGRADO a arquitectura UNIFICADA:
 * - useUnifiedRadiographyForm hook (estado separado por sección)
 * - Componentes unificados de @/components/laboratory-form
 * - Servicios de validación y transformación
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileImage,
  Send,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// NUEVO: Hook y componentes UNIFICADOS
import { useUnifiedRadiographyForm } from '@/hooks/useUnifiedRadiographyForm';
import {
  TomografiaFormStepUnified,
  RadiografiasFormStepUnified
} from '@/components/laboratory-form';

import { validateRadiografiasStep2, transformToSubmission } from '@/services/radiography';
import { publicFormsApi } from '@/services/api/publicFormsApi';

interface CreateFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateFormModal = ({ onClose, onSuccess }: CreateFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);

  // NUEVO: Hook UNIFICADO con datos separados
  const form = useUnifiedRadiographyForm();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    setShowTopShadow(scrollTop > 20);
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 20);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.currentStep === 1) {
      form.handlers.nextStep();
      return;
    }

    // Validar paso 2
    const validation = validateRadiografiasStep2(form.radiografiasData);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);

      // ACTUALIZADO: Usar firma unificada de transformToSubmission (5 parámetros separados)
      const submissionData = transformToSubmission(
        form.patientData,
        form.doctorData,
        form.tomografiaData,
        form.radiografiasData,
        {
          id: 'admin_generated',
          code: 'ADMIN',
          title: 'Solicitud Administrativa - Tomografía/Radiografía'
        }
      );

      // Guardar vía API backend
      await publicFormsApi.submitPublicForm({
        form_id: 1, // ID genérico para formularios administrativos
        form_code: 'ADMIN',
        form_title: 'Solicitud Administrativa - Tomografía/Radiografía',
        status: 'pending',
        form_type: 'radiography',
        submission_data: JSON.stringify(submissionData.radiographyData),
        submitted_at: new Date().toISOString()
      });

      toast.success('¡Solicitud creada exitosamente!');
      form.handlers.reset();
      onSuccess();
    } catch (error: any) {
      // Manejo de errores detallado
      console.error('Error al crear solicitud:', error);

      if (error?.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else if (error?.response?.status === 403) {
        toast.error('No tiene permisos para crear solicitudes.');
      } else if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.message || 'Datos de solicitud inválidos';
        toast.error(`Error de validación: ${errorMessage}`);
      } else if (error?.response?.status >= 500) {
        toast.error('Error del servidor. Por favor, intente más tarde.');
      } else if (error?.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Error al crear la solicitud. Verifique su conexión e intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      {/* Overlay oscuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Contenido del modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
        className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-[98vw] sm:max-w-[95vw] md:max-w-6xl lg:max-w-7xl my-2 sm:my-4 md:my-8 flex flex-col relative z-10"
        style={{
          maxHeight: 'calc(100vh - 1rem)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sm:rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileImage className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-white truncate">
                  {form.currentStep === 1 ? 'Paso 1: Tomografía 3D' : 'Paso 2: Radiografías'}
                </h2>
                <p className="text-purple-100 text-xs sm:text-sm hidden sm:block">Nueva Solicitud de Imágenes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="text-white text-xs sm:text-sm font-medium">Paso {form.currentStep}/2</div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar - Fixed */}
        <div className="h-1 bg-gray-200 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${(form.currentStep / 2) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          {/* Scroll Shadow Top */}
          {showTopShadow && (
            <div className="absolute top-[73px] left-0 right-0 h-6 bg-gradient-to-b from-gray-900/10 to-transparent pointer-events-none z-10" />
          )}

          {/* Content Area - Scrollable */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth modal-scrollbar"
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9333ea #f3f4f6'
            }}
          >
            {form.currentStep === 1 ? (
              // PASO 1: TOMOGRAFÍA 3D - Usa componente UNIFICADO
              <TomografiaFormStepUnified
                patientData={form.patientData}
                doctorData={form.doctorData}
                tomografiaData={form.tomografiaData}
                onPatientChange={form.handlers.handlePatientChange}
                onDoctorChange={form.handlers.handleDoctorChange}
                onTomografiaChange={form.handlers.handleTomografiaChange}
                showSelectors={true}
                colorTheme="purple"
              />
            ) : (
              // PASO 2: RADIOGRAFÍAS - Usa componente UNIFICADO
              <RadiografiasFormStepUnified
                formData={form.radiografiasData}
                onFormChange={form.handlers.handleRadiografiasChange}
                showPrices={false}
                colorTheme="teal"
              />
            )}
          </div>

          {/* Scroll Shadow Bottom */}
          {showBottomShadow && (
            <div className="absolute bottom-[73px] left-0 right-0 h-6 bg-gradient-to-t from-gray-900/10 to-transparent pointer-events-none z-10" />
          )}

          {/* Footer - Sticky with elevation */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky bottom-0 shadow-lg rounded-b-lg sm:rounded-b-xl">
            <div>
              {form.currentStep === 2 && (
                <button
                  type="button"
                  onClick={form.handlers.previousStep}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 hover:shadow-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {form.currentStep === 1 ? (
                <button
                  type="submit"
                  className={`px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 hover:shadow-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    showBottomShadow ? 'animate-pulse' : ''
                  }`}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    showBottomShadow ? 'animate-pulse' : ''
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? (
                    <span className="hidden sm:inline">Creando...</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Crear Solicitud</span>
                      <span className="sm:hidden">Crear</span>
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
