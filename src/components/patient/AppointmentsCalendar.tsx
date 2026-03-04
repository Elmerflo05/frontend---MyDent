import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Plus
} from 'lucide-react';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { dentistsApi, type DentistData } from '@/services/api/dentistsApi';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { useAuth } from '@/hooks/useAuth';
import RequestAppointmentModal from './RequestAppointmentModal';
import type { Appointment, Patient } from '@/types';

interface CalendarProps {
  patientId?: string;
}

const PatientAppointmentsCalendar = ({ patientId }: CalendarProps) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DentistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDateForAppointment, setSelectedDateForAppointment] = useState<Date | undefined>();
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ day: number; appointments: Appointment[] } | null>(null);

  // Usar el ID del paciente autenticado o el proporcionado
  const currentPatientId = patientId || user?.patientId || user?.id;

  useEffect(() => {
    if (currentPatientId) {
      loadData();
    }
  }, [currentPatientId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [appointmentsResponse, dentistsResponse] = await Promise.all([
        appointmentsApi.getAppointments({ patient_id: parseInt(currentPatientId), limit: 1000 }),
        dentistsApi.getDentists({ is_active: true, limit: 100 })
      ]);

      // Mapear citas del backend al formato frontend
      const mappedAppointments: Appointment[] = appointmentsResponse.data.map(apt => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const timeParts = (apt.start_time || '00:00').split(':').map(Number);
        const hours = timeParts[0] || 0;
        const minutes = timeParts[1] || 0;
        const appointmentDate = new Date(year, month - 1, day, hours, minutes);

        return {
          id: apt.appointment_id?.toString() || '',
          patientId: apt.patient_id?.toString() || '',
          patientName: apt.patient_name || '',
          dentistId: apt.dentist_id?.toString() || '',
          dentistName: apt.dentist_name || '',
          date: appointmentDate,
          time: apt.start_time || '00:00',
          room: apt.room || '',
          status: apt.appointment_status_id === 1 ? 'confirmed' : apt.appointment_status_id === 3 ? 'completed' : 'pending',
          reason: apt.reason || '',
          notes: apt.notes || '',
          isActive: true
        };
      });

      // Filtrar citas canceladas del calendario
      const activeAppointments = mappedAppointments.filter(appointment => appointment.status !== 'cancelled');
      setAppointments(activeAppointments);
      setDoctors(dentistsResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener nombre del doctor
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.dentist_id?.toString() === doctorId || d.user_id?.toString() === doctorId);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Doctor no asignado';
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

    return appointments.filter(appointment => {
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

  // Filtrar citas por estado
  const getAppointmentsByStatus = () => {
    const now = new Date();
    const upcoming = appointments.filter(apt => new Date(apt.date) >= now);
    const past = appointments.filter(apt => new Date(apt.date) < now);
    const pending = appointments.filter(apt => apt.status === 'pending_approval');
    const confirmed = appointments.filter(apt => apt.status === 'scheduled');

    return { upcoming, past, pending, confirmed, total: appointments.length };
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
    // Recargar las citas para mostrar la nueva
    loadData();
  };

  // Manejar click en día del calendario
  const handleDayClick = (day: number) => {
    if (!day) return;

    const dayAppointments = getDayAppointments(day);
    setSelectedDay({ day, appointments: dayAppointments });
    setShowDayModal(true);
  };

  // Manejar click en botón "Solicitar Cita"
  const handleRequestAppointmentClick = () => {
    setSelectedDateForAppointment(undefined);
    setShowRequestModal(true);
  };

  const stats = getAppointmentsByStatus();
  const calendarDays = generateCalendarGrid();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mis Citas - Calendario</h2>
              <p className="text-gray-600">Vista de calendario de tus citas médicas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lista
              </button>
            </div>

            <button
              onClick={handleRequestAppointmentClick}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Solicitar Cita
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">Próximas</p>
                <p className="text-2xl font-bold text-teal-900">{stats.upcoming.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-teal-600" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Completadas</p>
                <p className="text-2xl font-bold text-blue-900">{stats.past.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Eye className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vista de calendario */}
      {viewMode === 'month' && (
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
                    onClick={() => day && handleDayClick(day)}
                    className={`min-h-20 p-1 border border-gray-100 rounded-lg transition-colors ${
                      day ? 'hover:bg-teal-50 cursor-pointer hover:border-teal-300' : ''
                    } ${day && isPast ? 'opacity-60' : ''} ${isToday ? 'bg-teal-50 border-teal-200' : ''}`}
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
                            // Usar startTime o time directamente, no extraer de date
                            const time = appointment.startTime || (appointment as any).time || '00:00';

                            return (
                              <div
                                key={appointment.id}
                                className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${
                                  config?.bgColor || 'bg-gray-100'
                                } ${config?.textColor || 'text-gray-700'}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevenir que se abra el modal de crear cita
                                  setSelectedAppointment(appointment);
                                }}
                                title={`${time} - ${getDoctorName(appointment.doctorId)}`}
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
        </div>
      )}

      {/* Vista de lista */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Próximas citas */}
          {stats.upcoming.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas Citas</h3>
              <div className="space-y-3">
                {stats.upcoming.map((appointment) => {
                  const config = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];

                  return (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {appointment.startTime || (appointment as any).time || '00:00'}
                            </div>
                          </div>
                        </div>

                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          config?.bgColor || 'bg-gray-100'
                        } ${config?.textColor || 'text-gray-700'}`}>
                          {config?.icon} {config?.label || appointment.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 ml-13">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{getDoctorName(appointment.doctorId)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial de citas */}
          {stats.past.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Citas</h3>
              <div className="space-y-3">
                {stats.past.slice(0, 5).map((appointment) => {
                  const config = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];

                  return (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 opacity-75 cursor-pointer hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {new Date(appointment.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {getDoctorName(appointment.doctorId)}
                            </div>
                          </div>
                        </div>

                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          config?.bgColor || 'bg-gray-100'
                        } ${config?.textColor || 'text-gray-700'}`}>
                          {config?.icon} {config?.label || appointment.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {stats.past.length > 5 && (
                <div className="text-center mt-4">
                  <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Ver más citas anteriores ({stats.past.length - 5} más)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  {new Date(selectedAppointment.date).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Doctor</label>
                <div className="text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {getDoctorName(selectedAppointment.doctorId)}
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
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              {selectedAppointment.status === 'pending' && (
                <button className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                  Confirmar Cita
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Información de contacto */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-teal-900">¿Necesitas ayuda?</h3>
            <p className="text-sm text-teal-700">
              Contacta a recepción para cambios o consultas sobre tus citas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-teal-700">
            <Phone className="w-4 h-4" />
            <span>(01) 234-5678</span>
          </div>
          <div className="flex items-center gap-2 text-teal-700">
            <Mail className="w-4 h-4" />
            <span>citas@clinica.com</span>
          </div>
        </div>
      </div>

      {/* Estado vacío */}
      {appointments.length === 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes citas programadas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Solicita una cita para comenzar tu atención médica.
            </p>
            <button
              onClick={handleRequestAppointmentClick}
              className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Primera Cita
            </button>
          </div>
        </div>
      )}

      {/* Modal de citas del día */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Citas del {selectedDay.day} de {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setShowDayModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {selectedDay.appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-gray-900 font-medium mb-2">No hay citas programadas</h4>
                <p className="text-gray-600 text-sm mb-4">
                  No tienes citas programadas para este día.
                </p>
                <button
                  onClick={() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const selectedDate = new Date(year, month, selectedDay.day);
                    setSelectedDateForAppointment(selectedDate);
                    setShowDayModal(false);
                    setShowRequestModal(true);
                  }}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Solicitar Cita para este Día
                </button>
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
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold text-gray-900">
                            {time}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            config?.bgColor || 'bg-gray-100'
                          } ${config?.textColor || 'text-gray-700'}`}>
                            {config?.icon} {config?.label || appointment.status}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowDayModal(false);
                          }}
                          className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                        >
                          Ver Detalles
                        </button>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span>👨‍⚕️</span>
                          <span>{getDoctorName(appointment.doctorId)}</span>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start gap-2">
                            <span>📝</span>
                            <span>{appointment.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const selectedDate = new Date(year, month, selectedDay.day);
                      setSelectedDateForAppointment(selectedDate);
                      setShowDayModal(false);
                      setShowRequestModal(true);
                    }}
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Solicitar Nueva Cita para este Día
                  </button>
                </div>
              </div>
            )}
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

export default PatientAppointmentsCalendar;