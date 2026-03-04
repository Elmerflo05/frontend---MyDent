import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, AlertCircle } from 'lucide-react';
import { CONSULTATION_ADVANCE_PAYMENT } from '@/constants/services';
import { formatDateToYMD } from '@/utils/dateUtils';
import { useAppointmentDuration } from '@/hooks/useAppointmentDuration';
import type { Patient, User } from '@/types';

interface CreateAppointmentFormProps {
  patients: Patient[];
  doctors: User[];
  sedes: any[];
  isSuperAdmin: boolean;
  userSedeId?: string | null;
  onSave: (appointment: any) => void;
  onCancel: () => void;
}

export const CreateAppointmentForm = ({ patients, doctors, sedes, isSuperAdmin, userSedeId, onSave, onCancel }: CreateAppointmentFormProps) => {
  const today = formatDateToYMD(new Date());

  // Hook para obtener duraciones dinámicas según el rol del usuario
  const {
    getAvailableDurations,
    isLoading: durationConfigLoading,
    defaultDuration
  } = useAppointmentDuration();

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    specialtyId: '', // Especialidad seleccionada
    sedeId: userSedeId || '',
    date: today,
    time: '',
    duration: '30', // Valor temporal, se actualiza cuando carga la configuración
    price: CONSULTATION_ADVANCE_PAYMENT.toString(), // Precio fijo de consulta: S/. 50
    notes: ''
  });

  // Actualizar duración por defecto cuando se carga la configuración
  useEffect(() => {
    if (!durationConfigLoading && defaultDuration) {
      setFormData(prev => ({ ...prev, duration: defaultDuration.toString() }));
    }
  }, [durationConfigLoading, defaultDuration]);

  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; available: boolean; reason?: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorScheduleInfo, setDoctorScheduleInfo] = useState<{ hasSchedule: boolean; startTime?: string; endTime?: string }>({ hasSchedule: false });
  const [doctorSpecialties, setDoctorSpecialties] = useState<Array<{ specialty_id: number; specialty_name: string }>>([]);

  // Update current patient when selection changes
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setCurrentPatient(patient || null);
    } else {
      setCurrentPatient(null);
    }
  }, [formData.patientId, patients]);

  // Cargar especialidades cuando cambia el doctor seleccionado
  useEffect(() => {
    if (formData.doctorId) {
      const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
      if (selectedDoctor) {
        // Obtener especialidades del doctor (guardadas en specialtiesData)
        const specialties = (selectedDoctor as any).specialtiesData || [];
        setDoctorSpecialties(specialties);

        // Si el doctor solo tiene una especialidad, seleccionarla automáticamente
        if (specialties.length === 1) {
          setFormData(prev => ({ ...prev, specialtyId: specialties[0].specialty_id.toString() }));
        } else {
          // Limpiar especialidad si el doctor cambió y tiene múltiples
          setFormData(prev => ({ ...prev, specialtyId: '' }));
        }
      }
    } else {
      setDoctorSpecialties([]);
      setFormData(prev => ({ ...prev, specialtyId: '' }));
    }
  }, [formData.doctorId, doctors]);

  // Cargar horarios disponibles cuando cambia doctor, fecha o sede
  useEffect(() => {
    const loadAvailableSlots = async () => {
      // Necesitamos sede para filtrar correctamente los horarios del médico
      const currentSedeId = formData.sedeId || userSedeId;

      if (formData.date && formData.doctorId && currentSedeId) {
        setLoadingSlots(true);

        try {
          const { getAvailableTimeSlots, getDoctorScheduleForDate } = await import('@/services/doctorAvailability');
          const selectedDate = new Date(formData.date + 'T00:00:00');

          // Obtener horario del médico FILTRADO POR SEDE
          const schedule = await getDoctorScheduleForDate(formData.doctorId, selectedDate, currentSedeId);

          if (schedule) {
            setDoctorScheduleInfo({
              hasSchedule: true,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            });

            // Obtener slots disponibles FILTRADO POR SEDE
            const slots = await getAvailableTimeSlots(formData.doctorId, selectedDate, parseInt(formData.duration), currentSedeId);
            setAvailableSlots(slots);

            // Si el horario actual no está disponible, limpiarlo
            if (formData.time) {
              const currentSlot = slots.find(s => s.time === formData.time);
              if (!currentSlot || !currentSlot.available) {
                setFormData(prev => ({ ...prev, time: '' }));
              }
            }
          } else {
            setDoctorScheduleInfo({ hasSchedule: false });
            setAvailableSlots([]);
          }
        } catch (error) {
          console.error('Error al cargar horarios:', error);
          setAvailableSlots([]);
          setDoctorScheduleInfo({ hasSchedule: false });
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
        setDoctorScheduleInfo({ hasSchedule: false });
      }
    };

    loadAvailableSlots();
  }, [formData.date, formData.doctorId, formData.duration, formData.sedeId, userSedeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time || !formData.specialtyId) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar que el slot esté disponible
    const selectedSlot = availableSlots.find(s => s.time === formData.time);
    if (selectedSlot && !selectedSlot.available) {
      toast.error('El horario seleccionado no está disponible');
      return;
    }

    // Validar disponibilidad una última vez antes de crear
    try {
      const { isDoctorAvailable } = await import('@/services/doctorAvailability');
      const selectedDate = new Date(formData.date + 'T00:00:00');
      const currentSedeId = formData.sedeId || userSedeId;
      const availability = await isDoctorAvailable(
        formData.doctorId,
        selectedDate,
        formData.time,
        parseInt(formData.duration),
        currentSedeId || undefined
      );

      if (!availability.available) {
        toast.error(`No se puede crear la cita: ${availability.reason}`);
        return;
      }
    } catch (error) {
      console.error('Error validando disponibilidad:', error);
      // Continuar si hay error en la validación (el backend también valida)
    }

    // Create appointment date
    const appointmentDate = new Date(`${formData.date}T${formData.time}:00`);

    // Obtener nombre de la especialidad seleccionada
    const selectedSpecialty = doctorSpecialties.find(s => s.specialty_id.toString() === formData.specialtyId);

    const newAppointment = {
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      specialtyId: formData.specialtyId, // ID de especialidad para el backend
      specialty: selectedSpecialty?.specialty_name || '', // Nombre para mostrar
      sedeId: formData.sedeId || userSedeId,
      date: appointmentDate,
      time: formData.time, // Hora separada para el backend
      notes: formData.notes,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price), // Adelanto de consulta (S/. 50)
      totalAmount: parseFloat(formData.price) // Por ahora, el total es igual al adelanto
    };

    onSave(newAppointment);
  };

  // Filter doctors by sede if not super admin
  // Los doctores pueden tener acceso a múltiples sedes (branchesAccess desde schedule_branches)
  // Fallback: usar sedeId del doctor si branchesAccess no está disponible

  const availableDoctors = isSuperAdmin
    ? doctors.filter(d => {
        if (!formData.sedeId) return true; // Si no hay sede seleccionada, mostrar todos
        const branchesAccess: number[] = (d as any).branchesAccess || [];
        const sedeIdNum = parseInt(formData.sedeId);
        // Verificar en branchesAccess O comparar sedeId directamente
        const hasAccess = (!isNaN(sedeIdNum) && branchesAccess.includes(sedeIdNum)) ||
                          d.sedeId === formData.sedeId;
        return hasAccess;
      })
    : doctors.filter(d => {
        if (!userSedeId) return false;
        const branchesAccess: number[] = (d as any).branchesAccess || [];
        const sedeIdNum = parseInt(userSedeId);
        // Verificar en branchesAccess O comparar sedeId directamente (fallback)
        const hasAccess = (!isNaN(sedeIdNum) && branchesAccess.includes(sedeIdNum)) ||
                          d.sedeId === userSedeId;
        return hasAccess;
      });

  return (
    <form id="create-appointment-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Sede Selection (only for super admin) */}
      {isSuperAdmin && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="font-semibold text-indigo-900 mb-3">Sede</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sedeId}
              onChange={(e) => setFormData({ ...formData, sedeId: e.target.value, doctorId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccionar sede...</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
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

      {/* Doctor Selection */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-900 mb-3">Doctor y Especialidad</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, specialtyId: '', date: formData.date, time: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
              disabled={isSuperAdmin && !formData.sedeId}
            >
              <option value="">Seleccionar doctor...</option>
              {availableDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
            {isSuperAdmin && !formData.sedeId && (
              <p className="text-sm text-gray-500 mt-1">Primero seleccione una sede</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidad <span className="text-red-500">*</span>
            </label>
            {!formData.doctorId ? (
              <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-200">
                Primero seleccione un doctor
              </div>
            ) : doctorSpecialties.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">El doctor no tiene especialidades configuradas</span>
              </div>
            ) : doctorSpecialties.length === 1 ? (
              <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                {doctorSpecialties[0].specialty_name}
              </div>
            ) : (
              <select
                value={formData.specialtyId}
                onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Seleccionar especialidad...</option>
                {doctorSpecialties.map(specialty => (
                  <option key={specialty.specialty_id} value={specialty.specialty_id.toString()}>
                    {specialty.specialty_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-3">Fecha y Hora</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
              disabled={!formData.doctorId}
            />
            {!formData.doctorId && (
              <p className="text-sm text-gray-500 mt-1">Primero seleccione un doctor</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora <span className="text-red-500">*</span>
            </label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Cargando horarios...
              </div>
            ) : !formData.doctorId || !formData.date ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Seleccione doctor y fecha primero
              </div>
            ) : !doctorScheduleInfo.hasSchedule ? (
              <div className="flex items-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">El doctor no tiene horario configurado para este día</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No hay horarios disponibles para esta fecha</span>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Seleccionar hora...</option>
                  {availableSlots.filter(s => s.available).map(slot => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time}
                    </option>
                  ))}
                </select>
                {doctorScheduleInfo.hasSchedule && (
                  <div className="flex items-center gap-1 text-xs text-green-700">
                    <Clock className="w-3 h-3" />
                    Horario del doctor: {doctorScheduleInfo.startTime} - {doctorScheduleInfo.endTime}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos)
            </label>
            {durationConfigLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Cargando opciones...
              </div>
            ) : (
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value, time: '' })}
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Motivo de consulta, observaciones..."
        />
      </div>

      {/* Action Buttons - Ahora en el footer del modal, no aquí */}
    </form>
  );
};
