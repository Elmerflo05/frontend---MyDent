import { useState } from 'react';
import { X, XCircle, Loader2, AlertTriangle, Calendar, User } from 'lucide-react';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { Modal } from '@/components/common/Modal';
import { parseLocalDate } from '@/utils/dateUtils';

interface AppointmentData {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  patient_name?: string;
  dentist_name?: string;
  specialty_name?: string;
  branch_name?: string;
}

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentData | null;
  onSuccess: () => void;
}

export const RejectAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: RejectAppointmentModalProps) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setRejectionReason('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) return;

    if (rejectionReason.trim().length < 10) {
      setError('La razón de rechazo debe tener al menos 10 caracteres');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await appointmentsApi.rejectAppointment(
        appointment.appointment_id,
        rejectionReason.trim()
      );

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error al rechazar cita:', err);

      // Manejar error específico de estado inválido
      const errorCode = err?.data?.code;
      const errorDetails = err?.data?.details;

      if (errorCode === 'INVALID_STATUS') {
        const statusId = errorDetails?.current_status_id;
        let statusName = 'desconocido';

        // Mapear status_id a nombres legibles
        const statusMap: Record<number, string> = {
          0: 'Pendiente de Aprobación',
          1: 'Programada',
          2: 'Confirmada',
          3: 'En Proceso',
          4: 'Completada',
          5: 'Cancelada',
          6: 'No Asistió',
          7: 'Reagendada',
          8: 'Rechazada'
        };

        if (statusId !== undefined && statusMap[statusId]) {
          statusName = statusMap[statusId];
        }

        setError(
          `No se puede rechazar esta cita porque su estado actual es "${statusName}". ` +
          `Solo se pueden rechazar citas en estado "Pendiente de Aprobación".`
        );
      } else {
        setError(err.message || 'Error al rechazar la cita. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  // ✅ Usar parseLocalDate para evitar desfase de timezone
  const appointmentDate = parseLocalDate(appointment.appointment_date);
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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
      <Modal.Header className="bg-gradient-to-r from-red-600 to-red-700 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Rechazar Cita</h2>
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
          {/* Información de la cita */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Estás a punto de rechazar:</div>

            <div className="space-y-2">
              {/* Fecha */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-semibold text-gray-900">{formattedDate}</div>
                  <div className="text-sm text-gray-600">Hora: {appointment.start_time}</div>
                </div>
              </div>

              {/* Paciente */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div className="text-sm">
                  <span className="text-gray-600">Paciente: </span>
                  <span className="font-medium text-gray-900">{appointment.patient_name || 'N/A'}</span>
                </div>
              </div>

              {/* Doctor */}
              <div className="text-sm">
                <span className="text-gray-600">Doctor: </span>
                <span className="font-medium text-gray-900">{appointment.dentist_name || 'N/A'}</span>
              </div>

              {/* Especialidad */}
              {appointment.specialty_name && (
                <div className="text-sm">
                  <span className="text-gray-600">Especialidad: </span>
                  <span className="font-medium text-gray-900">{appointment.specialty_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Esta acción no se puede deshacer</li>
                  <li>• La cita será marcada como "Rechazada" (voucher inválido)</li>
                  <li>• El paciente podrá ver que su cita fue rechazada y la razón</li>
                  <li>• El paciente deberá solicitar una nueva cita con un voucher válido</li>
                  <li>• Asegúrate de proporcionar una razón clara y profesional</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Razón de rechazo */}
          <div className="mb-4">
            <label htmlFor="rejection_reason" className="block text-sm font-medium text-gray-700 mb-2">
              Razón de rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError(null);
              }}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ej: El voucher proporcionado no es válido. El número de operación no coincide con los registros del banco. Por favor, envía un voucher válido."
              required
            />
            <div className="mt-1 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Mínimo 10 caracteres
              </div>
              <div className={`text-xs ${rejectionReason.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                {rejectionReason.length}/500
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </Modal.Body>
      </form>

      {/* Footer Fijo */}
      <Modal.Footer>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rejectionReason.trim().length < 10}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Rechazar Cita
              </>
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
