/**
 * Modal para proponer reprogramación de cita
 * Permite al staff o paciente proponer nueva fecha/hora para una cita
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCcw, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';
import Swal from 'sweetalert2';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { Modal } from '@/components/common/Modal';
import { useAppointmentDuration } from '@/hooks/useAppointmentDuration';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointment_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    patient_name: string;
    dentist_name?: string;
    duration?: number;
  };
  onSuccess: () => void;
}

export const RescheduleAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: RescheduleAppointmentModalProps) => {
  const { isDurationAllowed, getValidationMessage } = useAppointmentDuration();
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular hora de fin automáticamente basada en duración
  useEffect(() => {
    if (newStartTime && appointment.duration) {
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + appointment.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      setNewEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
    } else if (newStartTime && !appointment.duration) {
      // Si no hay duración, usar 30 minutos por defecto
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 30;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      setNewEndTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
    }
  }, [newStartTime, appointment.duration]);

  // Calcular fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = formatDateToYMD(tomorrow);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDate || !newStartTime || !newEndTime) {
      toast.error('Fecha y horarios son requeridos');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      toast.error('Por favor proporciona una razón (mínimo 10 caracteres)');
      return;
    }

    // Validar duración resultante contra configuración del sistema
    const [sh, sm] = newStartTime.split(':').map(Number);
    const [eh, em] = newEndTime.split(':').map(Number);
    const calculatedDuration = (eh * 60 + em) - (sh * 60 + sm);
    if (calculatedDuration <= 0) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    if (!isDurationAllowed(calculatedDuration)) {
      toast.error(getValidationMessage(calculatedDuration) || 'Duración no permitida para su rol');
      return;
    }

    setIsSubmitting(true);

    try {
      await appointmentsApi.rescheduleAppointment(appointment.appointment_id, {
        new_date: newDate,
        new_start_time: newStartTime + ':00', // Agregar segundos
        new_end_time: newEndTime + ':00',
        reason: reason.trim()
      });

      toast.success('Propuesta de reprogramación enviada exitosamente');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error al proponer reprogramación:', error);

      // Extract error details from API response
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message;
      const errorDetails = error?.response?.data?.details;
      const statusCode = error?.response?.status;

      // Handle specific error codes
      if (errorCode === 'DENTIST_SCHEDULE_CONFLICT') {
        const conflict = error?.response?.data?.conflict || {};
        const message = error?.response?.data?.message || '';

        await Swal.fire({
          icon: 'error',
          title: 'Horario No Disponible',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              ${message}
            </p>
            ${conflict.start_time ? `
              <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p class="text-sm font-semibold text-red-900 mb-2">Conflicto detectado:</p>
                <ul class="text-sm text-left text-gray-700 list-disc list-inside">
                  <li>Horario ocupado: ${conflict.start_time} - ${conflict.end_time}</li>
                  ${conflict.specialty ? `<li>Especialidad: ${conflict.specialty}</li>` : ''}
                  ${conflict.branch ? `<li>Sede: ${conflict.branch}</li>` : ''}
                </ul>
              </div>
            ` : ''}
            <p class="text-sm text-gray-600 mt-3">
              Por favor, selecciona otro horario disponible.
            </p>
          `,
          confirmButtonText: 'Seleccionar otro horario',
          confirmButtonColor: '#3B82F6'
        });
        return;
      }

      if (statusCode === 429) {
        // Rate limiting - demasiadas propuestas
        const limit = errorDetails?.limit || 3;
        const current = errorDetails?.current || 0;
        const resetAt = errorDetails?.reset_at ? new Date(errorDetails.reset_at) : null;

        await Swal.fire({
          icon: 'warning',
          title: 'Límite de Propuestas Alcanzado',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              Has alcanzado el límite de <strong>${limit} propuestas</strong> de reprogramación en 24 horas.
            </p>
            <p class="text-sm text-gray-600 mb-3">
              Propuestas realizadas: <strong>${current}/${limit}</strong>
            </p>
            ${resetAt ? `
              <p class="text-sm text-gray-600">
                Podrás realizar nuevas propuestas después del:<br>
                <strong>${resetAt.toLocaleString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>
              </p>
            ` : ''}
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      // Generic error fallback
      toast.error(errorMessage || 'Error al proponer reprogramación. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewDate('');
      setNewStartTime('');
      setNewEndTime('');
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={false}
    >
      {/* Header Fijo */}
      <Modal.Header className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <RefreshCcw className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Reprogramar Cita
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Modal.Header>

      {/* Content con scroll */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <Modal.Body className="overflow-y-auto">
          {/* Información actual */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Cita Actual:</h3>
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
              <div>
                <p className="text-gray-600">Fecha actual:</p>
                <p className="font-medium text-gray-900">
                  {parseLocalDate(appointment.appointment_date).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Horario actual:</p>
                <p className="font-medium text-gray-900">
                  {appointment.start_time} - {appointment.end_time}
                </p>
              </div>
            </div>
          </div>

          {/* Nueva fecha y hora */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900">Nueva Fecha y Hora:</h3>

            {/* Nueva fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Nueva Fecha *
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={minDate}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Razón */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón de la Reprogramación *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              rows={3}
              placeholder="Ej: Conflicto de horario, Emergencia personal, Solicitud del paciente, etc..."
              required
              minLength={10}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {reason.length}/10 caracteres mínimo
            </p>
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Información Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>La reprogramación requiere aprobación de ambas partes</li>
                  <li>Se verificará la disponibilidad del horario propuesto</li>
                  <li>Recibirás una notificación cuando sea aprobada o rechazada</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal.Body>
      </form>

      {/* Footer Fijo */}
      <Modal.Footer>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Propuesta'}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
