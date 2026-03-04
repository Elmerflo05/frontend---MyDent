import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import { dentistsApi, type DentistData } from '@/services/api/dentistsApi';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { useAuth } from '@/hooks/useAuth';
import RequestAppointmentModal from './RequestAppointmentModal';
import type { Appointment } from '@/types';

interface CalendarioCitasProps {
  citas: any[]; // Recibe las citas del componente padre
  onSolicitarCita: () => void;
  onAppointmentCreated?: () => void; // Callback para recargar citas
}

const CalendarioCitas = ({ citas, onSolicitarCita, onAppointmentCreated }: CalendarioCitasProps) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DentistData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDateForAppointment, setSelectedDateForAppointment] = useState<Date | undefined>();

  // Usar el ID del paciente autenticado
  const currentPatientId = user?.patientId || user?.id;

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      // Usar endpoint público que no requiere autenticación
      const doctors = await dentistsApi.getAllDentists();
      setDoctors(doctors);
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener nombre del doctor - ahora usa directamente el campo doctorName de la cita
  const getDoctorName = (appointment: any) => {
    // Si viene el doctorName formateado desde Appointments.tsx, usarlo directamente
    if (appointment.doctorName) {
      return appointment.doctorName;
    }
    // Fallback: buscar por doctorId si existe
    if (appointment.doctorId) {
      const doctor = doctors.find(d => d.dentist_id?.toString() === appointment.doctorId || d.user_id?.toString() === appointment.doctorId);
      return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Doctor no asignado';
    }
    return 'Doctor no asignado';
  };

  // Obtener hora formateada de la cita
  const getAppointmentTime = (appointment: any) => {
    // Si viene el campo time separado (desde Appointments.tsx)
    if (appointment.time) {
      return appointment.time;
    }
    // Fallback: extraer de start_time o date
    if (appointment.start_time) {
      const timeParts = appointment.start_time.split(':');
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    // Último recurso: extraer del objeto Date
    const date = new Date(appointment.date);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Generar grid del calendario
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Agregar celdas vacías antes del primer día
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Agregar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Obtener citas de un día específico
  const getDayAppointments = (day: number) => {
    if (!day) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDate = new Date(year, month, day);

    return citas.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.toDateString() === targetDate.toDateString();
    });
  };

  // Navegar por meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Manejar click en fecha para solicitar cita
  const handleDateClick = (day: number) => {
    if (!day) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const selectedDate = new Date(year, month, day);

    // No permitir fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return;
    }

    setSelectedDateForAppointment(selectedDate);
    setShowRequestModal(true);
  };

  // Manejar éxito al crear cita
  const handleAppointmentSuccess = (appointmentId: string) => {
    // Recargar las citas si existe el callback
    if (onAppointmentCreated) {
      onAppointmentCreated();
    }
    // NO llamar a onSolicitarCita() porque eso abre otro modal
  };

  const calendarDays = generateCalendarGrid();

  if (citas.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes citas programadas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Haz clic en cualquier fecha futura para solicitar una cita.
          </p>
        </div>

        {/* Calendario vacío pero funcional */}
        <div className="mt-8">
          {/* Header del calendario */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }).slice(1)}
              </h3>

              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Haz clic en cualquier fecha para solicitar una cita
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Grid del calendario */}
          <div className="p-6">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isToday = day &&
                  new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                const isPast = day && new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date().setHours(0,0,0,0);

                return (
                  <div
                    key={index}
                    onClick={() => day && !isPast && handleDateClick(day)}
                    className={`min-h-20 p-1 border border-gray-100 rounded-lg transition-colors ${
                      day && !isPast ? 'hover:bg-teal-50 cursor-pointer hover:border-teal-300' : day && isPast ? 'opacity-60' : ''
                    } ${isToday ? 'bg-teal-50 border-teal-200' : ''}`}
                  >
                    {day && (
                      <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                        isToday ? 'text-teal-700' : 'text-gray-900'
                      }`}>
                        <span>{day}</span>
                        {!isPast && (
                          <Plus className="w-3 h-3 text-teal-500 opacity-50" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal de solicitar cita */}
        <RequestAppointmentModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedDateForAppointment(undefined);
          }}
          selectedDate={selectedDateForAppointment}
          onSuccess={handleAppointmentSuccess}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric'
            }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric'
            }).slice(1)}
          </h3>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Plus className="w-3 h-3" />
            Haz clic en cualquier fecha para solicitar una cita
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="p-6">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayAppointments = day ? getDayAppointments(day) : [];
            const isToday = day &&
              new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            const isPast = day && new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date().setHours(0,0,0,0);

            return (
              <div
                key={index}
                onClick={() => day && !isPast && handleDateClick(day)}
                className={`min-h-20 p-1 border border-gray-100 rounded-lg transition-colors ${
                  day && !isPast ? 'hover:bg-teal-50 cursor-pointer hover:border-teal-300' : day && isPast ? 'opacity-60' : ''
                } ${isToday ? 'bg-teal-50 border-teal-200' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
                      isToday ? 'text-teal-700' : 'text-gray-900'
                    }`}>
                      <span>{day}</span>
                      {!isPast && dayAppointments.length === 0 && (
                        <Plus className="w-3 h-3 text-teal-500 opacity-50" />
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map(appointment => {
                        const config = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
                        const time = getAppointmentTime(appointment);

                        return (
                          <div
                            key={appointment.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                              config?.bgColor || 'bg-gray-100'
                            } ${config?.textColor || 'text-gray-700'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                            }}
                            title={`${time} - ${getDoctorName(appointment)}`}
                          >
                            <div className="truncate">
                              {config?.icon} {time}
                            </div>
                          </div>
                        );
                      })}

                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 2} más
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

      {/* Modal de detalles de cita */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalles de la Cita</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha y Hora</label>
                <div className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-gray-900 flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {getAppointmentTime(selectedAppointment)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Doctor</label>
                <div className="text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {getDoctorName(selectedAppointment)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = APPOINTMENT_STATUS_CONFIG[selectedAppointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        config?.bgColor || 'bg-gray-100'
                      } ${
                        config?.textColor || 'text-gray-700'
                      }`}>
                        {config?.icon} {config?.label || selectedAppointment.status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notas</label>
                  <div className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg mt-1">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de solicitar cita */}
      <RequestAppointmentModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedDateForAppointment(undefined);
        }}
        selectedDate={selectedDateForAppointment}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
};

export default CalendarioCitas;