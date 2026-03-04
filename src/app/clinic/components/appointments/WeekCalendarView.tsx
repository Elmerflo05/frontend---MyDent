import { Calendar, RefreshCcw } from 'lucide-react';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { SPECIALTIES, getSpecialtyFromDoctor } from './constants';
import type { Appointment, User as UserType } from '@/types';

interface WeekCalendarViewProps {
  weekDays: { date: Date; appointments: Appointment[] }[];
  doctors: UserType[];
  getPatientName: (patientId: string) => string;
  onAppointmentClick: (appointment: Appointment) => void;
}

export const WeekCalendarView = ({
  weekDays,
  doctors,
  getPatientName,
  onAppointmentClick
}: WeekCalendarViewProps) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map(({ date, appointments }, index) => {
        const isToday = date.toDateString() === new Date().toDateString();

        return (
          <div key={index} className="space-y-2">
            <div className={`text-center p-2 rounded-lg ${
              isToday ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-50'
            }`}>
              <div className="text-sm font-medium">
                {date.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div className="text-lg">
                {date.getDate()}
              </div>
            </div>

            <div className="space-y-1 min-h-96">
              {appointments.map(appointment => {
                // DERIVAR SPECIALTY DEL DOCTOR (dentro del componente)
                const specialtyKey = getSpecialtyFromDoctor(appointment.doctorId, doctors);
                const specialtyConfig = SPECIALTIES[specialtyKey];

                // ✅ CORREGIDO: Usar colores del ESTADO en lugar de especialidad
                // Las citas canceladas se muestran en ROJO
                // Las citas pendientes se muestran en AMARILLO
                const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
                // Usar startTime o time directamente, no extraer de date
                const time = appointment.startTime || (appointment as any).time || '00:00';

                return (
                  <div
                    key={appointment.id}
                    className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow border ${
                      statusConfig?.bgColor || 'bg-gray-100'
                    } ${statusConfig?.textColor || 'text-gray-800'} ${statusConfig?.borderColor || 'border-gray-200'}`}
                    onClick={() => onAppointmentClick(appointment)}
                    title={`Estado: ${statusConfig?.label || 'Desconocido'}`}
                  >
                    <div className="font-medium">{statusConfig?.icon || ''} {time}</div>
                    <div className="truncate">{getPatientName(appointment.patientId)}</div>
                    {(appointment as any).rescheduleCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 text-purple-700 border border-purple-200 mt-0.5">
                        <RefreshCcw className="w-2 h-2" />
                        Reprog.
                      </span>
                    )}
                    <div className="truncate text-[10px] opacity-80">{specialtyConfig?.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
