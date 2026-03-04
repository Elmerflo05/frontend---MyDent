import { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CONSULTATION_ADVANCE_PAYMENT } from '@/constants/services';
import { SPECIALTIES, mapDoctorSpecialtyToKey } from './constants';
import { formatDateToYMD } from '@/utils/dateUtils';
import { useAppointmentDuration } from '@/hooks/useAppointmentDuration';
import type { Appointment, Patient, User as UserType } from '@/types';

interface EditAppointmentFormProps {
  appointment: Appointment;
  patients: Patient[];
  doctors: UserType[];
  specialties: typeof SPECIALTIES;
  onSave: (appointment: any) => void;
  onCancel: () => void;
}

export const EditAppointmentForm = ({ appointment, patients, doctors, specialties, onSave, onCancel }: EditAppointmentFormProps) => {
  // Hook para obtener duraciones dinámicas según el rol del usuario
  const {
    getAvailableDurations,
    isDurationAllowed,
    getValidationMessage,
    isLoading: durationConfigLoading
  } = useAppointmentDuration();

  // Validar y parsear la fecha del appointment de forma robusta
  const parseAppointmentDate = (): Date => {
    // Si appointment.date ya es un objeto Date válido
    if (appointment.date instanceof Date && !isNaN(appointment.date.getTime())) {
      return appointment.date;
    }

    // Si es un string, intentar parsearlo
    if (typeof appointment.date === 'string') {
      const parsed = new Date(appointment.date);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback: usar fecha actual
    console.warn('⚠️ [EditAppointmentForm] Fecha de cita inválida, usando fecha actual como fallback:', appointment.date);
    return new Date();
  };

  const appointmentDate = parseAppointmentDate();
  // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
  const appointmentDateStr = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;

  // Usar startTime o time del appointment si existe, sino extraer del Date
  const appointmentTimeStr = (appointment as any).startTime || (appointment as any).time || appointmentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const [formData, setFormData] = useState({
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    specialty: (appointment as any).specialty || 'general' as keyof typeof SPECIALTIES,
    date: appointmentDateStr,
    time: appointmentTimeStr, // ✅ Usar la hora extraída correctamente
    duration: (appointment as any).duration?.toString() || '30',
    room: (appointment as any).room || 'Consultorio 1',
    price: (appointment as any).price?.toString() || CONSULTATION_ADVANCE_PAYMENT.toString(),
    priority: (appointment as any).priority || 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    status: appointment.status,
    notes: appointment.notes || '',
    patientPhone: '',
    patientEmail: ''
  });

  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Filtrar especialidades según el doctor seleccionado
  const filteredSpecialties = useMemo(() => {
    if (!formData.doctorId) return specialties;

    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    const doctorSpecialties = selectedDoctor?.specialties;

    // Si el doctor no tiene especialidades asignadas, mostrar todas
    if (!doctorSpecialties || doctorSpecialties.length === 0) return specialties;

    // Mapear las especialidades del doctor a keys del SPECIALTIES constant
    const doctorSpecialtyKeys = doctorSpecialties.map(s => mapDoctorSpecialtyToKey(s.name));

    // Filtrar solo las especialidades que tiene el doctor
    const filtered: Partial<typeof SPECIALTIES> = {};
    for (const [key, config] of Object.entries(specialties)) {
      if (doctorSpecialtyKeys.includes(key as keyof typeof SPECIALTIES)) {
        (filtered as any)[key] = config;
      }
    }

    // Si no hubo coincidencias, mostrar todas como fallback
    return Object.keys(filtered).length > 0 ? filtered : specialties;
  }, [formData.doctorId, doctors, specialties]);

  // Time slots (every 30 minutes from 8:00 to 18:00)
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  // Update current patient when selection changes
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setCurrentPatient(patient || null);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patientPhone: patient.phone,
          patientEmail: patient.email
        }));
      }
    } else {
      setCurrentPatient(null);
    }
  }, [formData.patientId, patients]);

  // Auto-seleccionar especialidad del doctor cuando cambia el doctor
  useEffect(() => {
    if (!formData.doctorId) return;

    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    const doctorSpecialties = selectedDoctor?.specialties;

    if (!doctorSpecialties || doctorSpecialties.length === 0) return;

    // Mapear a keys
    const doctorSpecialtyKeys = doctorSpecialties.map(s => mapDoctorSpecialtyToKey(s.name));

    // Si la especialidad actual no está en las del doctor, seleccionar la primera del doctor
    if (!doctorSpecialtyKeys.includes(formData.specialty as keyof typeof SPECIALTIES)) {
      setFormData(prev => ({ ...prev, specialty: doctorSpecialtyKeys[0] }));
    }
  }, [formData.doctorId, doctors]);

  // Update available time slots when date or doctor changes
  useEffect(() => {
    if (formData.date && formData.doctorId) {
      // Simulate checking available slots (in real app, this would be an API call)
      const unavailableSlots = ['09:00', '14:30', '16:00']; // Mock unavailable times
      const available = timeSlots.filter(slot => !unavailableSlots.includes(slot));
      setAvailableSlots(available);
    } else {
      setAvailableSlots(timeSlots);
    }
  }, [formData.date, formData.doctorId]);

  // Track changes
  useEffect(() => {
    // Usar la misma lógica de parseo seguro para la fecha original
    const originalDate = parseAppointmentDate();
    const originalDateStr = formatDateToYMD(originalDate);
    // Priorizar startTime/time del appointment sobre extraer del Date
    const originalTimeStr = (appointment as any).startTime || (appointment as any).time || originalDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const changed =
      formData.patientId !== appointment.patientId ||
      formData.doctorId !== appointment.doctorId ||
      formData.date !== originalDateStr ||
      formData.time !== originalTimeStr ||
      formData.duration !== ((appointment as any).duration?.toString() || '30') ||
      formData.priority !== ((appointment as any).priority || 'normal') ||
      formData.specialty !== ((appointment as any).specialty || 'general') ||
      formData.room !== ((appointment as any).room || 'Consultorio 1') ||
      formData.price !== ((appointment as any).price?.toString() || CONSULTATION_ADVANCE_PAYMENT.toString()) ||
      formData.status !== appointment.status ||
      formData.notes !== (appointment.notes || '');

    setHasChanges(changed);
  }, [formData, appointment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar duración contra configuración del sistema antes de enviar
    const durationValue = parseInt(formData.duration);
    if (!isDurationAllowed(durationValue)) {
      toast.error(getValidationMessage(durationValue) || 'Duración no permitida para su rol');
      return;
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      console.error('❌ [handleSubmit] Formato de fecha inválido:', formData.date);
      toast.error('El formato de fecha es inválido');
      return;
    }

    // Validar formato de hora (HH:MM o HH:MM:SS)
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(formData.time)) {
      console.error('❌ [handleSubmit] Formato de hora inválido:', formData.time);
      toast.error('El formato de hora es inválido');
      return;
    }

    // Normalizar la hora a HH:MM:SS
    const normalizedTime = formData.time.length === 5 ? `${formData.time}:00` : formData.time;

    // Create appointment date de forma segura usando componentes numéricos
    const [year, month, day] = formData.date.split('-').map(Number);
    const [hours, minutes] = formData.time.split(':').map(Number);

    // Crear fecha usando componentes numéricos (más confiable que parsear string)
    const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0);

    // Validar que la fecha sea válida
    if (isNaN(appointmentDate.getTime())) {
      console.error('❌ [handleSubmit] No se pudo crear fecha válida:', {
        date: formData.date,
        time: formData.time,
        year, month, day, hours, minutes
      });
      toast.error('Error al procesar la fecha de la cita');
      return;
    }

    console.log('✅ [handleSubmit] Fecha creada correctamente:', {
      input: { date: formData.date, time: formData.time },
      output: appointmentDate.toISOString(),
      local: appointmentDate.toLocaleString()
    });

    const updatedAppointment = {
      ...appointment,
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      date: appointmentDate,
      // ✅ CRÍTICO: Sobrescribir time y startTime explícitamente para que no use los valores antiguos del spread
      time: formData.time,
      startTime: formData.time,
      status: formData.status,
      notes: formData.notes,
      specialty: formData.specialty,
      duration: parseInt(formData.duration),
      room: formData.room,
      price: parseFloat(formData.price),
      priority: formData.priority,
      updatedAt: new Date()
    };

    onSave(updatedAppointment);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Changes Alert */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">Cambios Detectados</h4>
              <p className="text-sm text-yellow-700">
                Se enviarán notificaciones al paciente sobre los cambios realizados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Selection */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Información del Paciente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - DNI: {patient.dni}
                </option>
              ))}
            </select>
          </div>

          {currentPatient && (
            <div className="bg-white p-3 rounded border">
              <div className="text-sm space-y-1">
                <div><strong>Edad:</strong> {new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear()} años</div>
                <div><strong>Teléfono:</strong> {currentPatient.phone}</div>
                <div><strong>Email:</strong> {currentPatient.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctor and Specialty */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-3">Doctor y Especialidad</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            >
              <option value="">Seleccionar doctor...</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value as keyof typeof SPECIALTIES })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {Object.entries(filteredSpecialties).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            {formData.doctorId && Object.keys(filteredSpecialties).length < Object.keys(specialties).length && (
              <p className="text-xs text-purple-600 mt-1">
                Mostrando especialidades del doctor seleccionado
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-3">Fecha y Horario</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              min={formatDateToYMD(new Date())}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos)</label>
            {durationConfigLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Cargando opciones...
              </div>
            ) : (
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {getAvailableDurations().map((option) => (
                  <option key={option.value} value={option.value.toString()}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
              {formData.priority === 'low' && 'Prioridad Baja'}
              {formData.priority === 'normal' && 'Prioridad Normal'}
              {formData.priority === 'high' && 'Prioridad Alta'}
              {formData.priority === 'urgent' && 'Urgente'}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notas y Observaciones</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Motivo de la consulta, síntomas, observaciones especiales..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!hasChanges}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasChanges ? 'Guardar Cambios y Notificar' : 'Sin Cambios'}
        </button>
      </div>
    </form>
  );
};
