import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { appointmentsApi } from '@/services/api/appointmentsApi';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
}

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export const CancelAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: CancelAppointmentModalProps) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setCancellationReason('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await appointmentsApi.cancelAppointment(
        parseInt(appointment.id),
        cancellationReason.trim()
      );

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error al cancelar cita:', err);
      setError(err.message || 'Error al cancelar la cita. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cancelar Cita</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información de la cita */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Estás a punto de cancelar:</div>
            <div className="font-semibold text-gray-900">
              {appointment.date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })} - {appointment.time}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {appointment.doctorName} • {appointment.specialty}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Esta acción no se puede deshacer</li>
                  <li>• Si cancelas con menos de 24 horas, puede afectar futuras reservas</li>
                  <li>• Te recomendamos reprogramar en lugar de cancelar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Razón de cancelación */}
          <div className="mb-4">
            <label htmlFor="cancellation_reason" className="block text-sm font-medium text-gray-700 mb-2">
              Razón de cancelación (opcional)
            </label>
            <textarea
              id="cancellation_reason"
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                setError(null);
              }}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Escribe aquí el motivo de la cancelación..."
            />
            <div className="mt-1 text-xs text-gray-500">
              {cancellationReason.length}/500 caracteres
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

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
