/**
 * Modal para aprobar o rechazar propuesta de reprogramación
 * Muestra los detalles de la propuesta y permite aprobar o rechazar
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { createPortal } from 'react-dom';
import { parseLocalDate } from '@/utils/dateUtils';

interface RescheduleProposal {
  reschedule_id: number;
  proposed_date: string;
  proposed_start_time: string;
  proposed_end_time: string;
  reason: string;
  proposed_by_user_id: number;
  proposed_by_name?: string;
  created_at: string;
}

interface ApproveRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointment_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    patient_name: string;
    dentist_name?: string;
  };
  proposal: RescheduleProposal;
  onSuccess: () => void;
}

export const ApproveRescheduleModal = ({
  isOpen,
  onClose,
  appointment,
  proposal,
  onSuccess
}: ApproveRescheduleModalProps) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      await appointmentsApi.approveReschedule(appointment.appointment_id, proposal.reschedule_id);
      toast.success('Reprogramación aprobada exitosamente');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error al aprobar reprogramación:', error);

      // Extract error details from API response
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message;
      const conflict = error?.response?.data?.conflict;

      // Handle specific error codes
      if (errorCode === 'SCHEDULE_NO_LONGER_AVAILABLE') {
        await Swal.fire({
          icon: 'error',
          title: 'Horario Ya No Disponible',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              ${errorMessage || 'El horario propuesto ya fue ocupado por otro paciente.'}
            </p>
            ${conflict ? `
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                <p class="text-sm font-semibold text-amber-900 mb-2">Detalles del conflicto:</p>
                <ul class="text-sm text-left text-gray-700 list-disc list-inside">
                  <li>Horario: ${conflict.start_time} - ${conflict.end_time}</li>
                  ${conflict.specialty_name ? `<li>Especialidad: ${conflict.specialty_name}</li>` : ''}
                  ${conflict.branch_name ? `<li>Sede: ${conflict.branch_name}</li>` : ''}
                </ul>
              </div>
            ` : ''}
            <p class="text-sm text-gray-600 mt-3">
              La propuesta ha sido rechazada automáticamente.<br>
              El solicitante deberá proponer un nuevo horario.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#DC2626'
        });

        // Cerrar el modal y refrescar para mostrar el estado actualizado
        onSuccess();
        handleClose();
        return;
      }

      // Generic error fallback
      toast.error(errorMessage || 'Error al aprobar reprogramación. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error('Por favor proporciona una razón de rechazo (mínimo 10 caracteres)');
      return;
    }

    setIsSubmitting(true);

    try {
      await appointmentsApi.rejectReschedule(
        appointment.appointment_id,
        proposal.reschedule_id,
        rejectionReason.trim()
      );
      toast.success('Reprogramación rechazada');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error al rechazar reprogramación:', error);

      // Extract error details from API response
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error.message;

      // Generic error handling
      toast.error(errorMessage || 'Error al rechazar reprogramación. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAction(null);
      setRejectionReason('');
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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Revisar Propuesta de Reprogramación
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
        <div className="p-6">
          {/* Información del paciente */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Información de la Cita:</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Paciente:</p>
                <p className="font-medium text-gray-900">{appointment.patient_name}</p>
              </div>
              {appointment.dentist_name && (
                <div>
                  <p className="text-gray-600">Doctor:</p>
                  <p className="font-medium text-gray-900">{appointment.dentist_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comparación: Actual vs Propuesta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Fecha/Hora Actual */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Fecha Actual:</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Fecha:</p>
                  <p className="font-medium text-gray-900">
                    {parseLocalDate(appointment.appointment_date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Horario:</p>
                  <p className="font-medium text-gray-900">
                    {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>
              </div>
            </div>

            {/* Nueva Fecha/Hora Propuesta */}
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-900">Nueva Propuesta:</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Fecha:</p>
                  <p className="font-medium text-green-900">
                    {new Date(proposal.proposed_date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Horario:</p>
                  <p className="font-medium text-green-900">
                    {proposal.proposed_start_time} - {proposal.proposed_end_time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Razón de la propuesta */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Razón de la Reprogramación:</h4>
            <p className="text-sm text-gray-700">{proposal.reason}</p>
            <div className="mt-2 text-xs text-gray-500">
              Propuesto por: {proposal.proposed_by_name || 'Usuario'} el{' '}
              {new Date(proposal.created_at).toLocaleString('es-ES')}
            </div>
          </div>

          {/* Formulario de rechazo (si se selecciona rechazar) */}
          {action === 'reject' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del Rechazo *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                rows={3}
                placeholder="Explica por qué se rechaza esta propuesta..."
                required
                minLength={10}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-red-600">
                {rejectionReason.length}/10 caracteres mínimo
              </p>
            </motion.div>
          )}

          {/* Advertencia */}
          {!action && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold mb-1">Antes de decidir:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verifica que el nuevo horario esté disponible</li>
                    <li>Considera la razón proporcionada</li>
                    <li>La decisión será notificada al solicitante</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!action && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Revisar Después
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                  disabled={isSubmitting}
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? 'Aprobando...' : 'Aprobar'}
                </button>
              </>
            )}

            {action === 'reject' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 shadow-sm"
                  disabled={isSubmitting || rejectionReason.trim().length < 10}
                >
                  {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
