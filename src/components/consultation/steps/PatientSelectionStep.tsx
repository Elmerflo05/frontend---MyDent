/**
 * Step 0: Selección de Paciente mediante Cita
 *
 * Componente para seleccionar una cita asignada al doctor e iniciar la consulta.
 * Incluye:
 * - Vista de citas de la semana actual
 * - Selección automática del paciente al elegir una cita
 * - Búsqueda manual de paciente (sin cita) como opción secundaria
 */

import { useState, useEffect, memo } from 'react';
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Check,
  Search,
  CalendarDays,
  UserSearch,
  Stethoscope,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDateToYMD } from '@/utils/dateUtils';
import Combobox from '@/components/ui/Combobox';
import { appointmentsApi, type AppointmentData } from '@/services/api/appointmentsApi';

interface PatientSelectionStepProps {
  // Opciones de pacientes
  patientOptions: any[];

  // Paciente seleccionado
  selectedPatient: any;
  handlePatientSelection: (patient: any) => void;

  // Cita seleccionada
  selectedAppointment: AppointmentData | null;
  onAppointmentSelect: (appointment: AppointmentData) => void;

  // Usuario actual (dentista)
  user: any;

  // Handlers
  markStepCompleted: (step: number) => void;
}

/**
 * Normaliza una fecha a formato YYYY-MM-DD
 */
const normalizeDateKey = (dateStr: string): string => {
  if (!dateStr) return 'sin-fecha';

  // Si viene en formato ISO (2024-11-25T00:00:00.000Z), extraer solo la parte de fecha
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }

  // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
  return dateStr;
};

/**
 * Agrupa las citas por fecha
 */
const groupAppointmentsByDate = (appointments: AppointmentData[]) => {
  const grouped: Record<string, AppointmentData[]> = {};

  appointments.forEach(apt => {
    const dateKey = normalizeDateKey(apt.appointment_date);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(apt);
  });

  // Ordenar cada grupo por hora
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  });

  return grouped;
};

/**
 * Parsea una fecha de string de forma segura
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Si viene en formato ISO (2024-11-25T00:00:00.000Z) o YYYY-MM-DD
  let date: Date;

  if (dateStr.includes('T')) {
    // Formato ISO completo
    date = new Date(dateStr);
  } else {
    // Formato YYYY-MM-DD - agregar hora para evitar problemas de zona horaria
    date = new Date(dateStr + 'T12:00:00');
  }

  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formatea fecha para mostrar (versión segura)
 */
const formatDateSafe = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return dateStr || 'Fecha no disponible';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Hoy';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Mañana';
  } else {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
};

/**
 * Formatea fecha para mostrar (para agrupación)
 */
const formatDate = (dateStr: string): string => {
  return formatDateSafe(dateStr);
};

/**
 * Formatea hora para mostrar (HH:MM)
 */
const formatTime = (timeStr: string): string => {
  return timeStr.substring(0, 5);
};

/**
 * Obtiene el inicio y fin de la semana actual
 */
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: formatDateToYMD(monday),
    end: formatDateToYMD(sunday)
  };
};

/**
 * Componente del Step 0: Selección de Paciente
 */
const PatientSelectionStepComponent = ({
  patientOptions,
  selectedPatient,
  handlePatientSelection,
  selectedAppointment,
  onAppointmentSelect,
  user,
  markStepCompleted
}: PatientSelectionStepProps) => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Cargar citas del dentista
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.dentist_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const weekRange = getWeekRange();

        // Cargar citas con estados: Programada (1), Confirmada (2), En Proceso (3)
        // Hacemos múltiples llamadas porque la API no soporta múltiples status_id
        const [programadas, confirmadas, enProceso] = await Promise.all([
          appointmentsApi.getAppointments({
            dentist_id: user.dentist_id,
            date_from: weekRange.start,
            date_to: weekRange.end,
            appointment_status_id: 1, // Programada
            limit: 100
          }),
          appointmentsApi.getAppointments({
            dentist_id: user.dentist_id,
            date_from: weekRange.start,
            date_to: weekRange.end,
            appointment_status_id: 2, // Confirmada
            limit: 100
          }),
          appointmentsApi.getAppointments({
            dentist_id: user.dentist_id,
            date_from: weekRange.start,
            date_to: weekRange.end,
            appointment_status_id: 3, // En Proceso
            limit: 100
          })
        ]);

        // Combinar todas las citas
        const allAppointments = [
          ...(programadas.success && programadas.data ? programadas.data : []),
          ...(confirmadas.success && confirmadas.data ? confirmadas.data : []),
          ...(enProceso.success && enProceso.data ? enProceso.data : [])
        ];

        // Eliminar duplicados por appointment_id
        const uniqueAppointments = allAppointments.filter(
          (apt, index, self) => index === self.findIndex(a => a.appointment_id === apt.appointment_id)
        );

        const response = { success: true, data: uniqueAppointments };

        if (response.success && response.data) {
          // Filtrar solo las que tienen patient_id
          const validAppointments = response.data.filter(apt => apt.patient_id);
          setAppointments(validAppointments);

          // Expandir la fecha de hoy por defecto
          const today = formatDateToYMD(new Date());
          setExpandedDates({ [today]: true });
        }
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user?.dentist_id]);

  // Agrupar citas por fecha
  const groupedAppointments = groupAppointmentsByDate(appointments);
  const sortedDates = Object.keys(groupedAppointments).sort();

  // Toggle expandir/colapsar fecha
  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Manejar selección de cita
  const handleAppointmentClick = (appointment: AppointmentData) => {
    onAppointmentSelect(appointment);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Seleccionar Cita</h3>
        <p className="text-gray-600">
          Seleccione una cita programada para iniciar la atención integral del paciente
        </p>
      </div>

      {/* Citas de la Semana */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-clinic-primary" />
          <h4 className="text-lg font-semibold text-gray-900">Citas de la Semana</h4>
          <span className="text-sm text-gray-500">
            ({appointments.length} cita{appointments.length !== 1 ? 's' : ''} programada{appointments.length !== 1 ? 's' : ''})
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-primary"></div>
            <span className="ml-3 text-gray-600">Cargando citas...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No hay citas programadas esta semana</p>
            <p className="text-sm text-gray-500 mt-1">
              Puede buscar un paciente manualmente usando la opción de abajo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map(date => {
              const dateAppointments = groupedAppointments[date];
              const isExpanded = expandedDates[date];
              const isToday = date === formatDateToYMD(new Date());

              return (
                <div
                  key={date}
                  className={`border rounded-lg overflow-hidden ${
                    isToday ? 'border-clinic-primary bg-clinic-light/30' : 'border-gray-200'
                  }`}
                >
                  {/* Header de fecha */}
                  <button
                    onClick={() => toggleDate(date)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${
                      isToday ? 'bg-clinic-light/50' : 'bg-gray-50'
                    } hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className={`w-5 h-5 ${isToday ? 'text-clinic-primary' : 'text-gray-500'}`} />
                      <span className={`font-semibold ${isToday ? 'text-clinic-primary' : 'text-gray-700'}`}>
                        {formatDate(date)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({dateAppointments.length} cita{dateAppointments.length !== 1 ? 's' : ''})
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-clinic-primary text-white text-xs rounded-full">
                          HOY
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Lista de citas del día */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {dateAppointments.map(appointment => {
                        const isSelected = selectedAppointment?.appointment_id === appointment.appointment_id;

                        return (
                          <div
                            key={appointment.appointment_id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-clinic-primary/10 border-l-4 border-l-clinic-primary'
                                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                {/* Hora */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                                  isSelected ? 'bg-clinic-primary text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  <Clock className="w-4 h-4" />
                                  <span className="font-semibold text-sm">
                                    {formatTime(appointment.start_time)}
                                  </span>
                                </div>

                                {/* Info del paciente */}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <User className={`w-4 h-4 ${isSelected ? 'text-clinic-primary' : 'text-gray-500'}`} />
                                    <span className="font-semibold text-gray-900">
                                      {appointment.patient_name || 'Paciente sin nombre'}
                                    </span>
                                    {/* Badge de estado */}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      appointment.appointment_status_id === 1
                                        ? 'bg-blue-100 text-blue-700'
                                        : appointment.appointment_status_id === 2
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {appointment.appointment_status_id === 1
                                        ? 'Programada'
                                        : appointment.appointment_status_id === 2
                                          ? 'Confirmada'
                                          : 'En Proceso'}
                                    </span>
                                  </div>

                                  {appointment.reason && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <Stethoscope className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">
                                        {appointment.reason}
                                      </span>
                                    </div>
                                  )}

                                  {appointment.identification_number && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Doc: {appointment.identification_number}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Indicador de selección */}
                              <div className={`flex items-center gap-2 ${
                                isSelected ? 'text-clinic-primary' : 'text-gray-400'
                              }`}>
                                {isSelected ? (
                                  <>
                                    <span className="text-sm font-medium">Seleccionada</span>
                                    <CheckCircle className="w-6 h-6" />
                                  </>
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Separador */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm text-gray-500">o</span>
        </div>
      </div>

      {/* Búsqueda Manual */}
      <div>
        <button
          onClick={() => setShowManualSearch(!showManualSearch)}
          className="flex items-center gap-2 text-gray-600 hover:text-clinic-primary transition-colors mb-4"
        >
          <UserSearch className="w-5 h-5" />
          <span className="font-medium">Atender paciente sin cita previa</span>
          {showManualSearch ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showManualSearch && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar paciente
              </label>
              <Combobox
                options={patientOptions}
                value={selectedPatient?.id || ''}
                onChange={(value, option) => {
                  if (option.data) {
                    handlePatientSelection(option.data);
                  }
                }}
                placeholder="Buscar por nombre, documento, teléfono o email..."
                searchPlaceholder="Escriba para buscar..."
                emptyMessage="No se encontraron pacientes"
                showSearch={true}
              />
            </div>

            {/* Paciente Seleccionado (sin cita) */}
            {selectedPatient && !selectedAppointment && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Atención sin cita programada</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPatient.documentType}: {selectedPatient.documentNumber}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paciente Seleccionado (via cita) */}
      {selectedAppointment && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Cita y Paciente Seleccionados</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paciente:</p>
              <p className="font-medium text-gray-900">
                {selectedAppointment.patient_name || 'Sin nombre'}
              </p>
              {selectedAppointment.identification_number && (
                <p className="text-xs text-gray-500">Doc: {selectedAppointment.identification_number}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cita:</p>
              <p className="font-medium text-gray-900">
                {formatDateSafe(selectedAppointment.appointment_date)} a las {formatTime(selectedAppointment.start_time)}
              </p>
            </div>
            {selectedAppointment.reason && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-1">Motivo:</p>
                <p className="font-medium text-gray-900">{selectedAppointment.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {(selectedPatient || selectedAppointment) ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                {selectedAppointment
                  ? 'Cita seleccionada - Listo para continuar'
                  : 'Paciente seleccionado (sin cita)'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span>Seleccione una cita o paciente para continuar</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (selectedPatient || selectedAppointment) {
              markStepCompleted(0);
            }
          }}
          disabled={!selectedPatient && !selectedAppointment}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            (selectedPatient || selectedAppointment)
              ? 'bg-clinic-primary text-white hover:bg-clinic-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar con la consulta
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Exportar el componente memoizado
export const PatientSelectionStep = memo(PatientSelectionStepComponent);
