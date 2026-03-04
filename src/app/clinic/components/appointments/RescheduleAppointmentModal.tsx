import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, X, AlertCircle, User, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { Appointment } from '@/types';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment;
  patientName: string;
  doctorName: string;
  onClose: () => void;
  onSave: (appointmentId: string, newDate: string, newTime: string, notes?: string) => Promise<void>;
}

export const RescheduleAppointmentModal = ({
  isOpen,
  appointment,
  patientName,
  doctorName,
  onClose,
  onSave
}: RescheduleAppointmentModalProps) => {
  const appointmentDate = new Date(appointment.date);
  // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
  const appointmentDateStr = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    date: appointmentDateStr,
    time: appointment.time || appointmentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si hay cambios
  const originalDate = appointmentDateStr;
  const originalTime = appointment.time || appointmentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const hasChanges = formData.date !== originalDate || formData.time !== originalTime;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      toast.error('Por favor seleccione fecha y hora');
      return;
    }

    if (!hasChanges) {
      toast.warning('No hay cambios para guardar');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(appointment.id, formData.date, formData.time, formData.notes);
      onClose();
    } catch (error) {
      console.error('Error al reprogramar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reprogramar Cita</h2>
              <p className="text-sm text-gray-500">Cambiar fecha y hora</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info de la cita actual */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium text-gray-900">{patientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Doctor:</span>
              <span className="font-medium text-gray-900">{doctorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Fecha actual:</span>
              <span className="font-medium text-gray-900">
                {appointmentDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })} a las {originalTime}
              </span>
            </div>
          </div>

          {/* Alerta de cambios */}
          {hasChanges && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Cambios detectados</p>
                <p className="text-amber-700">Se notificará al paciente sobre la reprogramación.</p>
              </div>
            </div>
          )}

          {/* Nueva fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Fecha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                min={formatDateToYMD(new Date())}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Nueva hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Hora <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Motivo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de reprogramación <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Ej: A solicitud del paciente..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              hasChanges && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              'Reprogramar Cita'
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
