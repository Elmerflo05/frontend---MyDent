/**
 * Modal para marcar una cita como "No Asistió"
 * Permite al staff registrar cuando un paciente no se presentó a su cita
 */

import { useState } from 'react';
import { User, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { Modal } from '@/components/common/Modal';
import { parseLocalDate } from '@/utils/dateUtils';

interface MarkNoShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    appointment_id: number;
    appointment_date: string;
    start_time: string;
    patient_name: string;
  };
  onSuccess: () => void;
}

export const MarkNoShowModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: MarkNoShowModalProps) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await appointmentsApi.markAsNoShow(appointment.appointment_id, { notes: notes.trim() || undefined });
      toast.success('Cita marcada como "No Asistió"');
      onSuccess();
      onClose();
      setNotes(''); // Limpiar formulario
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar como "No Asistió"');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {/* Header Personalizado */}
      <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 rounded-lg p-2">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Marcar como "No Asistió"</h2>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Información de la cita */}
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <p className="text-sm">
                <span className="font-medium text-gray-700">Paciente:</span>{' '}
                <span className="text-gray-900">{appointment.patient_name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <p className="text-sm">
                <span className="font-medium text-gray-700">Fecha:</span>{' '}
                <span className="text-gray-900">
                  {parseLocalDate(appointment.appointment_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <p className="text-sm">
                <span className="font-medium text-gray-700">Hora:</span>{' '}
                <span className="text-gray-900">{appointment.start_time}</span>
              </p>
            </div>
          </div>

          {/* Campo de notas */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              rows={3}
              placeholder="Ej: Se llamó al paciente pero no contestó, No envió mensaje de cancelación, etc..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">Agrega comentarios sobre la ausencia del paciente</p>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                <strong>Nota:</strong> Esta acción marcará al paciente como "No Asistió". El paciente podrá
                proponer una reprogramación de esta cita si lo desea.
              </p>
            </div>
          </div>
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer>
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
