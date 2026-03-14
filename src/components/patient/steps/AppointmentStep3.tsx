import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, FileText, AlertCircle, Mail, Download } from 'lucide-react';
import { PAYMENT_METHODS_DETAILED } from '@/constants/ui';
import type { AppointmentFormData } from '../hooks/useAppointmentForm';
import type { User as UserType } from '@/types';
import { generateAppointmentPDF } from '@/utils/pdfGenerator';
import { getSpecialtyName, getWhatsAppBaseUrl } from '../utils/appointmentHelpers';

interface AppointmentStep3Props {
  formData: AppointmentFormData;
  user: UserType | null;
  doctors: UserType[];
  sedesDisponibles: any[];
  getDoctorName: (doctorId: string, doctors: UserType[]) => string;
  getSedeName: (sedeId: string, sedesDisponibles: any[]) => string;
}

export const AppointmentStep3: React.FC<AppointmentStep3Props> = ({
  formData,
  user,
  doctors,
  sedesDisponibles,
  getDoctorName,
  getSedeName
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const doctorName = getDoctorName(formData.doctorId, doctors);
      const sedeName = getSedeName(formData.sedeId, sedesDisponibles);

      // Buscar el nombre de la especialidad
      const doctor = doctors.find(d => d.id === formData.doctorId);
      const specialty = doctor?.specialties?.find(s => s.id === formData.specialtyId);
      const specialtyName = specialty?.name || formData.specialtyId;

      await generateAppointmentPDF({
        formData,
        user,
        doctorName,
        sedeName,
        specialtyName
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ¡Cita Solicitada Exitosamente!
        </h3>
        <p className="text-gray-600 mb-4">
          Hemos enviado una confirmación a tu correo electrónico
        </p>
      </div>

      {/* Complete Summary */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Resumen de tu Solicitud
        </h4>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">{formData.date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hora</p>
              <p className="font-medium">{formData.time}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Sede</p>
              <p className="font-medium">{getSedeName(formData.sedeId, sedesDisponibles)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Especialidad</p>
              <p className="font-medium">{getSpecialtyName(formData.specialtyId, doctors)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Doctor</p>
            <p className="font-medium">{getDoctorName(formData.doctorId, doctors)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium">
                {PAYMENT_METHODS_DETAILED.find(m => m.id === formData.paymentMethod)?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Voucher</p>
              <p className="font-medium text-green-600">✅ Subido</p>
            </div>
          </div>

          {formData.notes && (
            <div>
              <p className="text-sm text-gray-500">Notas</p>
              <p className="font-medium">{formData.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Descargar PDF de Confirmación
            </>
          )}
        </button>

        <a
          href={`${getWhatsAppBaseUrl()}?text=${encodeURIComponent('Hola, he solicitado una cita y me gustaría más información')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>📱</span>
          Contactar por WhatsApp
        </a>
      </div>

      {/* What's Next */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 text-left">
            <p className="font-medium mb-2">¿Qué sigue?</p>
            <ul className="space-y-1 text-xs">
              <li>• Te contactaremos en las próximas 2-4 horas</li>
              <li>• Verificaremos tu voucher de pago</li>
              <li>• Confirmaremos la disponibilidad del doctor</li>
              <li>• Recibirás una confirmación final por {formData.preferredContact === 'phone' ? 'teléfono' : 'email'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Email Confirmation Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-teal-50 p-5 rounded-lg border-2 border-green-200"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-800">Confirmación enviada por email</span>
            </div>
            <p className="text-sm text-green-700">
              Hemos enviado los detalles completos de tu cita a:
            </p>
            <p className="text-sm font-medium text-green-900 mt-1">
              {user?.email}
            </p>
            <p className="text-xs text-green-600 mt-2">
              Por favor revisa tu bandeja de entrada y spam
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
