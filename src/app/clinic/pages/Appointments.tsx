import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { patientsApi } from '@/services/api/patientsApi';
import { dentistsApi } from '@/services/api/dentistsApi';
import { notificationsApi } from '@/services/api/notificationsApi';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentSocket } from '@/hooks/useAppointmentSocket';
import useSedeStore from '@/store/sedeStore';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import type { Appointment, Patient, User as UserType } from '@/types';

// Importar componentes modulares
import { SPECIALTIES } from '../components/appointments/constants';
import { CalendarHeader } from '../components/appointments/CalendarHeader';
import { AppointmentStatsCards } from '../components/appointments/AppointmentStatsCards';
import { AppointmentFilters } from '../components/appointments/AppointmentFilters';
import { MonthCalendarView } from '../components/appointments/MonthCalendarView';
import { WeekCalendarView } from '../components/appointments/WeekCalendarView';
import { DayCalendarView } from '../components/appointments/DayCalendarView';
import { AppointmentDetailsModal } from '../components/appointments/AppointmentDetailsModal';
import { DayAppointmentsModal } from '../components/appointments/DayAppointmentsModal';
import { RescheduleAppointmentModal } from '../components/appointments/RescheduleAppointmentModal';
import { Modal } from '@/components/common/Modal';
import { CreateAppointmentForm } from '@/app/admin/components/appointments/CreateAppointmentForm';

// Modales de aprobar/rechazar (del admin)
import { ApproveAppointmentModal } from '@/components/admin/ApproveAppointmentModal';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';

const CALENDAR_VIEWS = {
  month: { label: 'Mes' },
  week: { label: 'Semana' },
  day: { label: 'Día' }
} as const;

const Appointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { obtenerSedesActivas, cargarSedesDesdeDB } = useSedeStore();
  const sedes = obtenerSedesActivas();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ day: number; appointments: Appointment[] } | null>(null);

  // Filtros de fecha
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modales de aprobar/rechazar
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [appointmentForAction, setAppointmentForAction] = useState<any>(null);

  // Helper para formatear fecha a YYYY-MM-DD
  const formatDateToInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sincronizar filtros de fecha con navegación del calendario
  useEffect(() => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      setDateFrom(formatDateToInput(firstDay));
      setDateTo(formatDateToInput(lastDay));
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      setDateFrom(formatDateToInput(startOfWeek));
      setDateTo(formatDateToInput(endOfWeek));
    } else if (viewMode === 'day') {
      const dayDate = formatDateToInput(currentDate);
      setDateFrom(dayDate);
      setDateTo(dayDate);
    }
  }, [currentDate, viewMode]);

  // Load data - recargar cuando cambie el branch_id del usuario
  useEffect(() => {
    if (user?.branch_id || user?.role === 'super_admin') {
      loadData();
    }
  }, [user?.branch_id, user?.role]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Preparar filtros para las citas
      const appointmentFilters: any = { limit: 1000 };
      const patientFilters: any = { limit: 1000 };

      // Si el usuario es doctor, filtrar SOLO por dentist_id (no por sede)
      // El doctor puede atender en múltiples sedes según branches_access
      if (user?.role === 'doctor') {
        // Obtener el dentist_id del usuario actual
        const dentistsRes = await dentistsApi.getDentists({ limit: 100 });
        const currentDentist = dentistsRes.data.find(
          (d: any) => d.user_id?.toString() === user.id?.toString()
        );

        if (currentDentist) {
          appointmentFilters.dentist_id = currentDentist.dentist_id;
          // NO filtrar por branch_id - el doctor ve todas sus citas de todas las sedes
        }

        // Pacientes: el doctor puede ver pacientes de todas sus sedes
        if (user?.branch_id) {
          patientFilters.branch_id = user.branch_id;
        }
      } else if (user?.role !== 'super_admin' && user?.branch_id) {
        // Para otros roles (admin, recepcionista), filtrar por sede
        appointmentFilters.branch_id = user.branch_id;
      }

      // Filtrar doctores por sede usando dentist_schedules (excepto para super_admin)
      const dentistFilters: any = { limit: 100 };
      if (user?.role !== 'super_admin' && user?.branch_id) {
        dentistFilters.branch_id = user.branch_id;
      }

      const [appointmentsRes, patientsRes, dentistsRes] = await Promise.all([
        appointmentsApi.getAppointments(appointmentFilters),
        patientsApi.getPatients(patientFilters),
        dentistsApi.getDentists(dentistFilters),
        cargarSedesDesdeDB() // Cargar sedes desde la API
      ]);

      // Map backend data to frontend format
      const appointmentsData: Appointment[] = appointmentsRes.data.map(apt => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const timeParts = (apt.start_time || '00:00').split(':').map(Number);
        const hours = timeParts[0] || 0;
        const minutes = timeParts[1] || 0;
        // Crear fecha en zona horaria LOCAL (mes es 0-indexed)
        const appointmentDate = new Date(year, month - 1, day, hours, minutes);

        const mapped: any = {
          id: apt.appointment_id?.toString() || '',
          patientId: apt.patient_id?.toString() || '',
          patientName: apt.patient_name || 'Paciente',
          doctorId: apt.dentist_id?.toString() || '',
          dentistId: apt.dentist_id?.toString() || '',
          dentistName: apt.dentist_name || 'Doctor desconocido',
          specialty: apt.specialty_name || 'general',
          date: appointmentDate,
          time: apt.start_time || '00:00',
          room: apt.room || '',
          // ✅ Campos de sede
          sedeId: apt.branch_id?.toString() || '',
          branch_name: apt.branch_name || '',
          // ✅ Mapear duración desde el backend (fuente única de verdad)
          duration: apt.duration || 30,
          price: apt.price || 50,
          // ✅ NUEVO: Usar status_code del backend directamente (fuente única de verdad)
          // El backend ya envía el código correcto: 'confirmed', 'pending_approval', etc.
          status: apt.status_code || 'pending_approval',
          reason: apt.reason || '',
          notes: apt.notes || '',
          services: apt.reason ? [apt.reason] : [],
          totalAmount: 0,
          paymentStatus: 'pending',
          isActive: true,
          // Badge "Reprogramada"
          rescheduleCount: parseInt(String(apt.reschedule_count)) || 0
        };
        return mapped;
      });

      const patientsData: Patient[] = patientsRes.data.map(p => ({
        id: p.patient_id?.toString() || '',
        dni: p.identification_number || '',
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email || '',
        phone: p.mobile || p.phone || '',
        birthDate: p.birth_date ? new Date(p.birth_date) : new Date(),
        gender: (p.gender || 'M') as 'M' | 'F' | 'O',
        address: p.address || '',
        registrationDate: new Date(),
        isActive: true
      }));

      const doctorsData: UserType[] = dentistsRes.data.map((d: any) => ({
        id: d.dentist_id?.toString() || '',
        email: d.email || '',
        firstName: d.first_name || '',
        lastName: d.last_name || '',
        role: 'doctor',
        sedeId: d.branch_id?.toString() || '',
        // ✅ Agregar branchesAccess desde schedule_branches (sedes donde tiene horarios)
        branchesAccess: d.schedule_branches || [],
        // ✅ Agregar especialidades completas para el formulario de citas
        specialtiesData: d.specialties || [],
        profile: {
          firstName: d.first_name || '',
          lastName: d.last_name || '',
          phone: d.phone || '',
          licenseNumber: d.professional_license || '',
          specialties: d.specialties?.map((s: any) => s.specialty_name) || [],
          department: 'Odontología'
        },
        isActive: d.is_active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // ✅ Filtrar SOLO citas rechazadas del calendario
      // Las citas canceladas SÍ deben aparecer (en rojo)
      // Las citas pendientes SÍ deben aparecer (en amarillo)
      const activeAppointmentsData = appointmentsData.filter(appointment => appointment.status !== 'rejected');

      // Enhanced appointments - DERIVAR SPECIALTY DEL DOCTOR aquí
      const enhancedAppointments = activeAppointmentsData.map(apt => {
        const doctor = doctorsData.find(d => d.id === apt.doctorId);
        const doctorSpecialty = doctor?.profile?.specialties?.[0];

        // Map doctor specialty to specialty key
        const specialtyMap: Record<string, keyof typeof SPECIALTIES> = {
          'Odontología General': 'general',
          'Ortodoncia': 'orthodontics',
          'Odontopediatría': 'pediatric',
          'Cirugía Oral': 'surgery',
          'Estética Dental': 'cosmetic',
          'Endodoncia': 'endodontics'
        };

        const specialty = doctorSpecialty ? (specialtyMap[doctorSpecialty] || 'general') : 'general';

        return {
          ...apt,
          specialty,
          // duration y price ya vienen mapeados desde el backend
          room: apt.room || `Consultorio ${Math.floor(Math.random() * 5) + 1}`
        };
      });

      setAppointments(enhancedAppointments);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      toast.error('Error al cargar las citas');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos silenciosamente (sin spinner de loading)
  // Se usa cuando se reciben actualizaciones por WebSocket
  const loadDataSilent = useCallback(async () => {
    try {
      const appointmentFilters: any = { limit: 1000 };
      const patientFilters: any = { limit: 1000 };

      // Filtrar citas por sede del usuario (excepto super_admin que ve todo)
      if (user?.role !== 'super_admin' && user?.branch_id) {
        appointmentFilters.branch_id = user.branch_id;
      }

      // Solo el doctor ve pacientes filtrados por su sede
      if (user?.role === 'doctor' && user?.branch_id) {
        patientFilters.branch_id = user.branch_id;
      }

      if (user?.role === 'doctor') {
        const dentistsRes = await dentistsApi.getDentists({ limit: 100 });
        const currentDentist = dentistsRes.data.find(
          (d: any) => d.user_id?.toString() === user.id?.toString()
        );
        if (currentDentist) {
          appointmentFilters.dentist_id = currentDentist.dentist_id;
        }
      }

      // Filtrar doctores por sede usando dentist_schedules (excepto para super_admin)
      const dentistFilters: any = { limit: 100 };
      if (user?.role !== 'super_admin' && user?.branch_id) {
        dentistFilters.branch_id = user.branch_id;
      }

      const [appointmentsRes, patientsRes, dentistsRes] = await Promise.all([
        appointmentsApi.getAppointments(appointmentFilters),
        patientsApi.getPatients(patientFilters),
        dentistsApi.getDentists(dentistFilters)
      ]);

      const appointmentsData: Appointment[] = appointmentsRes.data.map(apt => {
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
          patientName: apt.patient_name || 'Paciente',
          doctorId: apt.dentist_id?.toString() || '',
          dentistId: apt.dentist_id?.toString() || '',
          dentistName: apt.dentist_name || 'Doctor desconocido',
          specialty: apt.specialty_name || 'general',
          date: appointmentDate,
          time: apt.start_time || '00:00',
          room: apt.room || '',
          // ✅ Campos de sede
          sedeId: apt.branch_id?.toString() || '',
          branch_name: apt.branch_name || '',
          // Mapear duración y precio desde el backend
          duration: apt.duration || 30,
          price: apt.price || 50,
          status: apt.status_code || 'pending_approval',
          reason: apt.reason || '',
          notes: apt.notes || '',
          services: apt.reason ? [apt.reason] : [],
          totalAmount: 0,
          paymentStatus: 'pending',
          isActive: true,
          // Badge "Reprogramada"
          rescheduleCount: parseInt(String(apt.reschedule_count)) || 0
        };
      });

      const patientsData: Patient[] = patientsRes.data.map(p => ({
        id: p.patient_id?.toString() || '',
        dni: p.identification_number || '',
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email || '',
        phone: p.mobile || p.phone || '',
        birthDate: p.birth_date ? new Date(p.birth_date) : new Date(),
        gender: (p.gender || 'M') as 'M' | 'F' | 'O',
        address: p.address || '',
        registrationDate: new Date(),
        isActive: true
      }));

      const doctorsData: UserType[] = dentistsRes.data.map((d: any) => ({
        id: d.dentist_id?.toString() || '',
        email: d.email || '',
        firstName: d.first_name || '',
        lastName: d.last_name || '',
        role: 'doctor',
        sedeId: d.branch_id?.toString() || '',
        // ✅ Agregar branchesAccess desde schedule_branches (sedes donde tiene horarios)
        branchesAccess: d.schedule_branches || [],
        // ✅ Agregar especialidades completas para el formulario de citas
        specialtiesData: d.specialties || [],
        profile: {
          firstName: d.first_name || '',
          lastName: d.last_name || '',
          phone: d.phone || '',
          licenseNumber: d.professional_license || '',
          specialties: d.specialties?.map((s: any) => s.specialty_name) || [],
          department: 'Odontología'
        },
        isActive: d.is_active !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const activeAppointmentsData = appointmentsData.filter(appointment => appointment.status !== 'rejected');
      const enhancedAppointments = activeAppointmentsData.map(apt => {
        const doctor = doctorsData.find(d => d.id === apt.doctorId);
        const doctorSpecialty = doctor?.profile?.specialties?.[0];
        const specialtyMap: Record<string, string> = {
          'Odontología General': 'general',
          'Ortodoncia': 'orthodontics',
          'Odontopediatría': 'pediatric',
          'Cirugía Oral': 'surgery',
          'Estética Dental': 'cosmetic',
          'Endodoncia': 'endodontics'
        };
        const specialty = doctorSpecialty ? (specialtyMap[doctorSpecialty] || 'general') : 'general';
        // duration y price ya vienen mapeados desde el backend
        return { ...apt, specialty, room: apt.room || 'Consultorio 1' };
      });

      setAppointments(enhancedAppointments);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  }, [user?.branch_id, user?.role, user?.id]);

  // Hook de WebSocket para actualizaciones en tiempo real
  const { isConnected } = useAppointmentSocket({
    onAppointmentUpdate: loadDataSilent,
    showNotifications: true,
    enabled: true,
  });

  // Helper functions
  const getPatientInfo = (patientId: string) => patients.find(p => p.id === patientId) || null;
  const getPatientName = (patientId: string) => {
    const patient = getPatientInfo(patientId);
    if (patient) {
      return `${patient.firstName} ${patient.lastName}`;
    }
    // Fallback: buscar el nombre directamente en la cita (viene del backend)
    const appointment = appointments.find(apt => apt.patientId === patientId);
    if (appointment && (appointment as any).patientName) {
      return (appointment as any).patientName;
    }
    return 'Paciente desconocido';
  };
  const getDoctorInfo = (doctorId: string) => doctors.find(d => d.id === doctorId) || null;
  const getDoctorName = (doctorId: string) => {
    const doctor = getDoctorInfo(doctorId);
    return doctor ? `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}` : 'Doctor desconocido';
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = selectedStatus === 'all'
      || (selectedStatus === 'rescheduled' ? (appointment as any).rescheduleCount > 0 : appointment.status === selectedStatus);
    const matchesDoctor = selectedDoctor === 'all' || appointment.doctorId === selectedDoctor;
    const matchesSpecialty = selectedSpecialty === 'all' || (appointment as any).specialty === selectedSpecialty;
    const matchesSearch = searchTerm === '' ||
      getPatientName(appointment.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDoctorName(appointment.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.notes && appointment.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro por rango de fechas
    let matchesDate = true;
    if (viewMode !== 'day' && (dateFrom || dateTo)) {
      const appointmentDate = new Date(appointment.date);
      const matchesDateFrom = !dateFrom || appointmentDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || appointmentDate <= new Date(dateTo + 'T23:59:59');
      matchesDate = matchesDateFrom && matchesDateTo;
    }

    return matchesStatus && matchesDoctor && matchesSpecialty && matchesSearch && matchesDate;
  });

  // Calendar functions
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

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

  const getWeekAppointments = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays.map(day => ({
      date: day,
      appointments: filteredAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === day.toDateString();
      })
    }));
  };

  const getDayViewAppointments = () => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === currentDate.toDateString();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getStats = () => {
    const stats = Object.keys(APPOINTMENT_STATUS_CONFIG).reduce((acc, status) => {
      if (status === 'rescheduled') {
        // El card "Reprogramada" cuenta citas que FUERON reprogramadas (tienen badge),
        // sin importar su estado actual (pueden ser confirmed, scheduled, etc.)
        acc[status] = filteredAppointments.filter(apt => (apt as any).rescheduleCount > 0).length;
      } else {
        acc[status] = filteredAppointments.filter(apt => apt.status === status).length;
      }
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedDoctor('all');
    setSelectedSpecialty('all');
    setSearchTerm('');
  };

  // Event handlers
  const handleCancelAppointment = async (appointment: Appointment) => {
    // Step 1: Ask for cancellation reason with SweetAlert2
    const { value: reason, isConfirmed } = await Swal.fire({
      title: '¿Cancelar esta cita?',
      html: `
        <p class="text-sm text-gray-600 mb-4">
          Opcionalmente, puedes proporcionar un motivo de cancelación.
        </p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (opcional)',
      inputPlaceholder: 'Escribe aquí el motivo de la cancelación...',
      inputAttributes: {
        'aria-label': 'Motivo de cancelación',
        'maxlength': '500'
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar cita',
      cancelButtonText: 'No, volver',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      reverseButtons: true,
      customClass: {
        input: 'swal2-textarea',
        validationMessage: 'text-sm'
      }
    });

    if (!isConfirmed) return;

    try {
      await appointmentsApi.cancelAppointment(
        parseInt(appointment.id),
        reason?.trim() || ''
      );
      await sendPatientNotification(appointment, 'cancelled');
      loadData();
      toast.success('Cita cancelada y notificación enviada al paciente');
      setSelectedAppointment(null);
      setShowDayModal(false);
    } catch (error: any) {
      console.error('Error al cancelar cita:', error);

      // Extract error details from API response
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message;
      const errorDetails = error?.response?.data?.details;

      // Handle specific error codes
      if (errorCode === 'HAS_PAYMENTS') {
        const paymentsCount = errorDetails?.payments_count || 0;
        const totalPaid = errorDetails?.total_paid || 0;

        await Swal.fire({
          icon: 'error',
          title: 'No se puede cancelar',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              Esta cita tiene <strong>${paymentsCount} pago(s)</strong> asociado(s)
              por un total de <strong>$${totalPaid.toFixed(2)}</strong>.
            </p>
            <p class="text-sm text-gray-600">
              Por favor, contacta al administrador o contador para procesar el reembolso antes de cancelar.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        });
        return;
      }

      if (errorCode === 'HAS_MEDICAL_DATA') {
        const { consultations, odontograms, prescriptions, treatment_notes } = errorDetails || {};
        const dataTypes = [];
        if (consultations > 0) dataTypes.push(`${consultations} consulta(s)`);
        if (odontograms > 0) dataTypes.push(`${odontograms} odontograma(s)`);
        if (prescriptions > 0) dataTypes.push(`${prescriptions} receta(s)`);
        if (treatment_notes > 0) dataTypes.push(`${treatment_notes} nota(s) de tratamiento`);

        await Swal.fire({
          icon: 'error',
          title: 'No se puede cancelar',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              Esta cita tiene datos médicos registrados:
            </p>
            <ul class="text-sm text-left text-gray-600 list-disc list-inside mb-3">
              ${dataTypes.map(type => `<li>${type}</li>`).join('')}
            </ul>
            <p class="text-sm text-gray-600">
              No es posible cancelar citas con información médica asociada.
              Contacta al administrador si necesitas ayuda.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        });
        return;
      }

      if (errorCode === 'CANCELLATION_TOO_LATE') {
        const hoursRemaining = errorDetails?.hours_remaining || 0;

        await Swal.fire({
          icon: 'warning',
          title: 'Cancelación no permitida',
          html: `
            <p class="text-sm text-gray-700 mb-3">
              Solo faltan <strong>${hoursRemaining.toFixed(1)} horas</strong> para la cita.
            </p>
            <p class="text-sm text-gray-600">
              La política de cancelación requiere un mínimo de <strong>24 horas</strong> de anticipación.
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Contacta al administrador si necesitas ayuda.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      if (errorCode === 'INVALID_STATUS') {
        const currentStatus = errorDetails?.current_status || 'desconocido';

        await Swal.fire({
          icon: 'warning',
          title: 'Estado no válido',
          html: `
            <p class="text-sm text-gray-700">
              Esta cita tiene el estado <strong>"${currentStatus}"</strong> y no puede ser cancelada.
            </p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#F59E0B'
        });
        return;
      }

      // Generic error fallback
      toast.error(errorMessage || 'Error al cancelar la cita. Por favor, intenta nuevamente.');
    }
  };

  // Handler para reprogramar cita
  const handleRescheduleAppointment = async (appointmentId: string, newDate: string, newTime: string, notes?: string) => {
    try {
      // Calcular end_time basado en la duración de la cita seleccionada
      const duration = (selectedAppointment as any)?.duration || 30;
      const [hours, minutes] = newTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      const updateData = {
        appointment_date: newDate,
        start_time: newTime,
        end_time: endTime,
        notes: notes || undefined
      };

      await appointmentsApi.updateAppointment(parseInt(appointmentId), updateData);

      // Enviar notificación al paciente
      if (selectedAppointment) {
        await sendPatientNotification(selectedAppointment, 'updated');
      }

      loadData();
      toast.success('Cita reprogramada exitosamente');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Error al reprogramar cita:', error);
      if (error?.response?.status === 409) {
        toast.error('El doctor ya tiene una cita en ese horario');
      } else {
        toast.error('Error al reprogramar la cita');
      }
      throw error;
    }
  };

  const sendPatientNotification = async (appointment: Appointment, type: 'confirmed' | 'updated' | 'cancelled') => {
    try {
      const patient = getPatientInfo(appointment.patientId);
      const doctor = getDoctorInfo(appointment.doctorId);
      if (!patient || !doctor) return;

      // Mapeo de tipos para la API
      const typeMap: Record<string, 'confirmed' | 'rescheduled' | 'cancelled'> = {
        confirmed: 'confirmed',
        updated: 'rescheduled',
        cancelled: 'cancelled'
      };

      const appointmentDate = new Date(appointment.date);
      const dateStr = appointmentDate.toLocaleDateString('es-ES');
      const timeStr = appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const doctorName = doctor.profile ? `${doctor.profile.firstName} ${doctor.profile.lastName}` : 'Doctor';

      // Enviar notificación al backend usando la API
      await notificationsApi.sendAppointmentNotification({
        patientId: appointment.patientId,
        appointmentId: Number(appointment.id),
        type: typeMap[type],
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        dentistName: doctorName
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  };

  // Transformar cita para los modales de aprobar/rechazar
  const transformAppointmentForModal = (appointment: Appointment) => {
    const patient = getPatientInfo(appointment.patientId);
    const doctor = getDoctorInfo(appointment.doctorId);
    const appointmentDate = new Date(appointment.date);
    // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
    const appointment_date_str = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;

    return {
      appointment_id: parseInt(appointment.id),
      appointment_date: appointment_date_str,
      start_time: appointment.time || appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      patient_name: patient ? `${patient.firstName} ${patient.lastName}` : (appointment as any).patientName || 'N/A',
      patient_phone: patient?.phone || '',
      patient_mobile: patient?.phone || '',
      dentist_name: doctor ? `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}` : 'N/A',
      specialty_name: (appointment as any).specialty || 'General',
      branch_name: 'Mi Sede',
      voucher: (appointment as any).voucher || '',
      price: (appointment as any).price || 0,
      payment_method: (appointment as any).payment_method || ''
    };
  };

  // Handler para abrir modal de aprobar
  const handleApproveClick = (appointment: Appointment) => {
    const transformedData = transformAppointmentForModal(appointment);
    setAppointmentForAction(transformedData);
    setShowApproveModal(true);
    setSelectedAppointment(null);
    setShowDayModal(false);
  };

  // Handler para abrir modal de rechazar
  const handleRejectClick = (appointment: Appointment) => {
    const transformedData = transformAppointmentForModal(appointment);
    setAppointmentForAction(transformedData);
    setShowRejectModal(true);
    setSelectedAppointment(null);
    setShowDayModal(false);
  };

  // Callbacks para éxito de aprobar/rechazar
  const handleApproveSuccess = () => {
    loadData();
    toast.success('Cita aprobada exitosamente');
  };

  const handleRejectSuccess = () => {
    loadData();
    toast.success('Cita rechazada exitosamente');
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      // Marcar el paciente como llegado usando la API
      await appointmentsApi.markAppointmentAsArrived(parseInt(appointment.id));
      toast.success(`Iniciando consulta para ${getPatientName(appointment.patientId)}`);
      navigate(`/clinic/consultation?patientId=${appointment.patientId}&appointmentId=${appointment.id}`);
      loadData();
    } catch (error) {
      console.error('Error al iniciar consulta:', error);
      toast.error('Error al iniciar la consulta');
    }
  };

  // Handler para crear cita usando CreateAppointmentForm
  const handleCreateAppointment = async (newAppointment: any) => {
    try {
      // Calcular end_time basado en start_time y duration
      const startTime = newAppointment.time;
      const duration = newAppointment.duration || 30;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      // Obtener branch_id del usuario actual o de la cita
      const branchId = newAppointment.sedeId ? parseInt(newAppointment.sedeId) : (user?.branch_id || 1);

      // Preparar datos en formato del backend
      const appointmentData = {
        patient_id: parseInt(newAppointment.patientId),
        dentist_id: parseInt(newAppointment.doctorId),
        branch_id: branchId,
        specialty_id: newAppointment.specialtyId ? parseInt(newAppointment.specialtyId) : undefined,
        // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
        appointment_date: newAppointment.date instanceof Date
          ? `${newAppointment.date.getFullYear()}-${String(newAppointment.date.getMonth() + 1).padStart(2, '0')}-${String(newAppointment.date.getDate()).padStart(2, '0')}`
          : newAppointment.date.split('T')[0],
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        reason: newAppointment.notes || 'Consulta odontológica',
        notes: newAppointment.notes || '',
        room: 'Consultorio 1',
        price: newAppointment.price || 50,
        appointment_status_id: 0 // Pendiente de aprobación
      };

      await appointmentsApi.createAppointment(appointmentData);
      await loadData();
      setShowNewAppointmentModal(false);
      toast.success('Cita creada exitosamente. Pendiente de aprobación.');
    } catch (error: any) {
      console.error('Error al crear cita:', error);
      // Manejar error de conflicto de horario
      if (error?.response?.status === 409 || error?.message?.includes('CONFLICT')) {
        toast.error('El odontólogo ya tiene una cita en ese horario. Por favor elija otro horario.');
      } else {
        toast.error(error?.message || 'Error al crear la cita');
      }
    }
  };

  const isAppointmentReady = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
    return appointment.status === 'scheduled' && now >= fifteenMinutesBefore;
  };

  const handleDayClick = (day: number) => {
    if (!day) return;
    const dayAppointments = getDayAppointments(day);
    setSelectedDay({ day, appointments: dayAppointments });
    setShowDayModal(true);
  };

  const stats = getStats();
  const calendarDays = generateCalendarGrid();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <CalendarHeader
          onTodayClick={() => setCurrentDate(new Date())}
          onNewAppointment={() => setShowNewAppointmentModal(true)}
          isConnected={isConnected}
          userRole={user?.role}
        />

        {/* Stats Cards */}
        <AppointmentStatsCards
          stats={stats}
          selectedStatus={selectedStatus}
          onStatusClick={(status) => setSelectedStatus(status)}
        />

        {/* Filters */}
        <AppointmentFilters
          searchTerm={searchTerm}
          selectedDoctor={selectedDoctor}
          selectedSpecialty={selectedSpecialty}
          viewMode={viewMode}
          doctors={doctors}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={setSearchTerm}
          onDoctorChange={setSelectedDoctor}
          onSpecialtyChange={setSelectedSpecialty}
          onViewModeChange={setViewMode}
          onDateFromChange={(date) => {
            setDateFrom(date);
            if (viewMode === 'day' && date) setCurrentDate(new Date(date + 'T12:00:00'));
          }}
          onDateToChange={(date) => {
            setDateTo(date);
            if (viewMode === 'day' && date) setCurrentDate(new Date(date + 'T12:00:00'));
          }}
          onClearFilters={clearFilters}
          userRole={user?.role}
        />

        {/* Calendar Views */}
        <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateCalendar('prev')}
                className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                ←
              </button>
              <button
                onClick={() => navigateCalendar('next')}
                className="p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                →
              </button>
            </div>
          </div>

          {viewMode === 'month' && (
            <MonthCalendarView
              calendarDays={calendarDays}
              currentDate={currentDate}
              filteredAppointments={filteredAppointments}
              getPatientName={getPatientName}
              doctors={doctors}
              onDayClick={handleDayClick}
              onAppointmentClick={setSelectedAppointment}
              onNavigate={navigateCalendar}
            />
          )}

          {viewMode === 'week' && (
            <WeekCalendarView
              weekDays={getWeekAppointments()}
              getPatientName={getPatientName}
              doctors={doctors}
              onAppointmentClick={setSelectedAppointment}
            />
          )}

          {viewMode === 'day' && (
            <DayCalendarView
              appointments={getDayViewAppointments()}
              doctors={doctors}
              getPatientInfo={getPatientInfo}
              getDoctorName={getDoctorName}
              onAppointmentClick={setSelectedAppointment}
              onStartConsultation={handleStartConsultation}
              userRole={user?.role}
            />
          )}
        </div>

        {/* Modals */}
        {selectedAppointment && !showRescheduleModal && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            userRole={user?.role}
            getPatientInfo={getPatientInfo}
            getPatientName={getPatientName}
            getDoctorName={getDoctorName}
            isAppointmentReady={isAppointmentReady}
            onClose={() => setSelectedAppointment(null)}
            onEdit={() => setShowRescheduleModal(true)}
            onCancel={handleCancelAppointment}
            onStartConsultation={handleStartConsultation}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            onRefresh={loadData}
          />
        )}

        {showDayModal && selectedDay && (
          <DayAppointmentsModal
            selectedDay={selectedDay}
            currentDate={currentDate}
            getPatientName={getPatientName}
            getDoctorName={getDoctorName}
            isAppointmentReady={isAppointmentReady}
            onClose={() => setShowDayModal(false)}
            onEdit={(apt) => {
              setSelectedAppointment(apt);
              setShowRescheduleModal(true);
            }}
            onViewDetails={(apt) => {
              setSelectedAppointment(apt);
              setShowDayModal(false);
            }}
            onStartConsultation={handleStartConsultation}
            userRole={user?.role}
          />
        )}

        {/* Modal de Reprogramar Cita (simple) */}
        {selectedAppointment && (
          <RescheduleAppointmentModal
            isOpen={showRescheduleModal}
            appointment={selectedAppointment}
            patientName={getPatientName(selectedAppointment.patientId)}
            doctorName={getDoctorName(selectedAppointment.doctorId)}
            onClose={() => {
              setShowRescheduleModal(false);
              setSelectedAppointment(null);
            }}
            onSave={handleRescheduleAppointment}
          />
        )}

        {/* Modal de Crear Nueva Cita */}
        <Modal
          isOpen={showNewAppointmentModal}
          onClose={() => setShowNewAppointmentModal(false)}
          size="xl"
          closeOnBackdropClick={false}
          closeOnEscape={true}
        >
          <Modal.Header>
            <h3 className="text-xl font-bold text-gray-900">Crear Nueva Cita</h3>
          </Modal.Header>

          <Modal.Body>
            <CreateAppointmentForm
              patients={patients}
              doctors={doctors}
              sedes={sedes}
              isSuperAdmin={false}
              userSedeId={user?.branch_id?.toString()}
              onSave={handleCreateAppointment}
              onCancel={() => setShowNewAppointmentModal(false)}
            />
          </Modal.Body>

          <Modal.Footer>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowNewAppointmentModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="create-appointment-form"
                className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Crear Cita
              </button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Modal de Aprobar Cita */}
        {showApproveModal && appointmentForAction && (
          <ApproveAppointmentModal
            isOpen={showApproveModal}
            onClose={() => {
              setShowApproveModal(false);
              setAppointmentForAction(null);
            }}
            appointment={appointmentForAction}
            onSuccess={handleApproveSuccess}
          />
        )}

        {/* Modal de Rechazar Cita */}
        {showRejectModal && appointmentForAction && (
          <RejectAppointmentModal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setAppointmentForAction(null);
            }}
            appointment={appointmentForAction}
            onSuccess={handleRejectSuccess}
          />
        )}
      </motion.div>
    </div>
  );
};

export default Appointments;
