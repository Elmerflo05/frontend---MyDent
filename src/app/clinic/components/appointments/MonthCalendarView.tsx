import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { SPECIALTIES, getSpecialtyFromDoctor } from './constants';
import type { Appointment, User as UserType } from '@/types';

interface MonthCalendarViewProps {
  currentDate: Date;
  calendarDays: (number | null)[];
  filteredAppointments: Appointment[];
  doctors: UserType[];
  getPatientName: (patientId: string) => string;
  onDayClick: (day: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export const MonthCalendarView = ({
  currentDate,
  calendarDays,
  filteredAppointments,
  doctors,
  getPatientName,
  onDayClick,
  onAppointmentClick,
  onNavigate
}: MonthCalendarViewProps) => {
  // Get appointments for specific day
  const getDayAppointments = (day: number | null) => {
    if (!day) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDate = new Date(year, month, day);

    return filteredAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.toDateString() === targetDate.toDateString();
    });
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold capitalize">{monthName}</h2>

        <button
          onClick={() => onNavigate('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayAppointments = getDayAppointments(day);
          const today = new Date();
          const isToday = day &&
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <div
              key={index}
              onClick={() => day && onDayClick(day)}
              className={`min-h-32 p-2 border border-gray-100 rounded-lg ${
                day ? 'hover:bg-gray-50 cursor-pointer' : ''
              } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(appointment => {
                      // DERIVAR SPECIALTY DEL DOCTOR AQUÍ (dentro del componente)
                      const specialtyKey = getSpecialtyFromDoctor(appointment.doctorId, doctors);
                      const specialtyConfig = SPECIALTIES[specialtyKey];

                      // ✅ CORREGIDO: Usar colores del ESTADO en lugar de especialidad
                      // Las citas canceladas se muestran en ROJO
                      // Las citas pendientes se muestran en AMARILLO
                      // Las citas rechazadas NO aparecen (filtradas previamente)
                      const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
                      // Usar startTime o time directamente, no extraer de date
                      const time = appointment.startTime || (appointment as any).time || '00:00';

                      return (
                        <div
                          key={appointment.id}
                          className={`text-xs p-2 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                            statusConfig?.bgColor || 'bg-gray-100'
                          } ${statusConfig?.textColor || 'text-gray-800'} ${statusConfig?.borderColor || 'border-gray-200'} border`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                          title={`${time} - ${getPatientName(appointment.patientId)} - ${specialtyConfig?.label} - Estado: ${statusConfig?.label}`}
                        >
                          <div className="font-medium truncate">
                            {statusConfig?.icon || ''} {time} {getPatientName(appointment.patientId)}
                            {(appointment as any).rescheduleCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0 rounded-full text-[8px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                <RefreshCcw className="w-2 h-2" />
                                R
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[10px] opacity-80">
                            {specialtyConfig?.label}
                          </div>
                        </div>
                      );
                    })}

                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
