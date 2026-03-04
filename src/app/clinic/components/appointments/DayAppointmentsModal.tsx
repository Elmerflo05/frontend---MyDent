import { motion } from 'framer-motion';
import { Edit, CheckCircle, Play, X, User, Stethoscope, FileText, Calendar, RefreshCcw } from 'lucide-react';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { SPECIALTIES } from './constants';
import type { Appointment } from '@/types';
import { createPortal } from 'react-dom';

interface DayAppointmentsModalProps {
  selectedDay: { day: number; appointments: Appointment[] };
  currentDate: Date;
  getPatientName: (patientId: string) => string;
  getDoctorName: (doctorId: string) => string;
  isAppointmentReady: (appointment: Appointment) => boolean;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onViewDetails: (appointment: Appointment) => void;
  onStartConsultation: (appointment: Appointment) => void;
  userRole?: string;
}

export const DayAppointmentsModal = ({
  selectedDay,
  currentDate,
  getPatientName,
  getDoctorName,
  isAppointmentReady,
  onClose,
  onEdit,
  onViewDetails,
  onStartConsultation,
  userRole
}: DayAppointmentsModalProps) => {
  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Citas del {selectedDay.day} de {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-blue-100 text-sm">
                {selectedDay.appointments.length} {selectedDay.appointments.length === 1 ? 'cita programada' : 'citas programadas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedDay.appointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-gray-900 font-semibold text-lg mb-2">No hay citas programadas</h4>
              <p className="text-gray-500 text-sm">
                No hay citas programadas para este día.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDay.appointments.map((appointment) => {
                const config = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
                // Usar startTime o time directamente, no extraer de date
                const time = appointment.startTime || (appointment as any).time || '00:00';

                return (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white"
                  >
                    {/* Header con hora y estado */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 rounded-lg px-4 py-2">
                          <div className="text-lg font-bold text-blue-700">
                            {time}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          config?.bgColor || 'bg-gray-100'
                        } ${config?.textColor || 'text-gray-700'}`}>
                          <span className="text-base">{config?.icon}</span>
                          {config?.label || appointment.status}
                        </span>
                        {(appointment as any).rescheduleCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            <RefreshCcw className="w-2.5 h-2.5" />
                            Reprogramada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(appointment)}
                          className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>

                        {/* Solo el doctor puede iniciar consultas */}
                        {appointment.status === 'scheduled' && isAppointmentReady(appointment) && userRole === 'doctor' && (
                          <button
                            onClick={() => {
                              onStartConsultation(appointment);
                              onClose();
                            }}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                            title="Iniciar atención del paciente"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onViewDetails(appointment);
                            onClose();
                          }}
                          className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>

                    {/* Información de la cita */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Paciente</p>
                            <p className="text-sm text-gray-900 font-semibold">{getPatientName(appointment.patientId)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-green-50 rounded-lg p-2">
                            <Stethoscope className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Doctor</p>
                            <p className="text-sm text-gray-900 font-semibold">{getDoctorName(appointment.doctorId)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-50 rounded-lg p-2">
                            <Stethoscope className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Especialidad</p>
                            <p className="text-sm text-gray-900 font-semibold">
                              {SPECIALTIES[(appointment as any).specialty]?.label || 'General'}
                            </p>
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start gap-3">
                            <div className="bg-amber-50 rounded-lg p-2 mt-0.5">
                              <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-medium mb-1">Notas</p>
                              <p className="text-sm text-gray-700 line-clamp-2">{appointment.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
