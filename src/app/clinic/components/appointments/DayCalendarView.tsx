import { Calendar, Clock, User, Phone, MapPin, Play, RefreshCcw } from 'lucide-react';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { SPECIALTIES, getSpecialtyFromDoctor } from './constants';
import type { Appointment, Patient, User as UserType } from '@/types';

interface DayCalendarViewProps {
  appointments: Appointment[];
  doctors: UserType[];
  getPatientInfo: (patientId: string) => Patient | null;
  getDoctorName: (doctorId: string) => string;
  onAppointmentClick: (appointment: Appointment) => void;
  onStartConsultation: (appointment: Appointment) => void;
  userRole?: string;
}

export const DayCalendarView = ({
  appointments,
  doctors,
  getPatientInfo,
  getDoctorName,
  onAppointmentClick,
  onStartConsultation,
  userRole
}: DayCalendarViewProps) => {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas programadas</h3>
        <p className="mt-1 text-sm text-gray-500">
          No hay citas para este día con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map(appointment => {
        // DERIVAR SPECIALTY DEL DOCTOR (dentro del componente)
        const specialtyKey = getSpecialtyFromDoctor(appointment.doctorId, doctors);
        const specialtyConfig = SPECIALTIES[specialtyKey];
        const SpecialtyIcon = specialtyConfig?.icon || User;

        const config = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
        const patient = getPatientInfo(appointment.patientId);
        const doctor = getDoctorName(appointment.doctorId);
        // Usar startTime o time directamente, no extraer de date
        const time = appointment.startTime || (appointment as any).time || '00:00';

        return (
          <div
            key={appointment.id}
            className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
              config?.borderColor || 'border-gray-200'
            }`}
            onClick={() => onAppointmentClick(appointment)}
            title={`Estado: ${config?.label || 'Desconocido'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    config?.bgColor || 'bg-gray-100'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span className={`text-sm font-medium ${config?.textColor || 'text-gray-700'}`}>
                      {time}
                    </span>
                  </div>

                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    specialtyConfig?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    <SpecialtyIcon className="w-3 h-3 mr-1" />
                    {specialtyConfig?.label}
                  </span>

                  {(appointment as any).rescheduleCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      <RefreshCcw className="w-2.5 h-2.5" />
                      Reprogramada
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{patient?.phone || 'Sin teléfono'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{doctor}</span>
                  </div>

                  {(appointment as any).room && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{(appointment as any).room}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Solo el doctor puede iniciar consultas */}
              {appointment.status === 'scheduled' && userRole === 'doctor' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartConsultation(appointment);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-clinic-primary text-white rounded-lg hover:bg-clinic-dark transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Atención
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
