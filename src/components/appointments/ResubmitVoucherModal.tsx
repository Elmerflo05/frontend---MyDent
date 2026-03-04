/**
 * Modal para reenviar voucher después de rechazo
 * Permite al paciente proporcionar un nuevo voucher válido
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { createPortal } from 'react-dom';
import { parseLocalDate } from '@/utils/dateUtils';

interface ResubmitVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointment_id: number;
    appointment_date: string;
    start_time: string;
    patient_name: string;
    rejection_reason?: string;
  };
  onSuccess: () => void;
}

export const ResubmitVoucherModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: ResubmitVoucherModalProps) => {
  const [voucher, setVoucher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voucher || voucher.trim().length === 0) {
      toast.error('Por favor ingresa el código o número del voucher');
      return;
    }

    if (voucher.trim().length < 5) {
      toast.error('El voucher debe tener al menos 5 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      await appointmentsApi.resubmitVoucher(appointment.appointment_id, voucher.trim());
      toast.success('Voucher reenviado exitosamente. La cita está en revisión.');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setVoucher('');
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Reenviar Voucher
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información de la cita */}
          <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Información de la Cita:</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Paciente:</span>{' '}
                <span className="font-medium text-gray-900">{appointment.patient_name}</span>
              </p>
              <p>
                <span className="text-gray-600">Fecha:</span>{' '}
                <span className="font-medium text-gray-900">
                  {parseLocalDate(appointment.appointment_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Hora:</span>{' '}
                <span className="font-medium text-gray-900">{appointment.start_time}</span>
              </p>
            </div>
          </div>

          {/* Razón del rechazo anterior */}
          {appointment.rejection_reason && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm mb-1">
                    Razón del Rechazo Anterior:
                  </h4>
                  <p className="text-sm text-red-800">{appointment.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Campo de voucher */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Nuevo Voucher / Comprobante *
            </label>
            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Ej: VP-2025-001234 o número de operación"
              required
              minLength={5}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingresa el código o número del voucher de pago válido
            </p>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Información Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Asegúrate de que el voucher sea válido y legible</li>
                  <li>El voucher será revisado por el personal administrativo</li>
                  <li>Recibirás una notificación sobre el resultado de la verificación</li>
                  <li>Tu cita volverá a estado "Pendiente de Aprobación"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Consejos para evitar rechazos:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✓ Verifica que el monto coincida con el costo de la consulta</li>
              <li>✓ Asegúrate de que la fecha sea reciente</li>
              <li>✓ El voucher debe estar a nombre del paciente</li>
              <li>✓ Si tienes dudas, contacta con la clínica antes de enviar</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Voucher'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
