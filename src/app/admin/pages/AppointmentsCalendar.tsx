import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentSocket } from '@/hooks/useAppointmentSocket';
import useSedeStore from '@/store/sedeStore';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import type { Appointment, Patient, User } from '@/types';
import { Modal } from '@/components/common/Modal';

// INTEGRACIÓN API REAL
import { AppointmentApiService } from '../services/appointmentApiService';
import { notificationsApi } from '@/services/api/notificationsApi';

// Importar componentes modulares
import { SedeFilter } from '../components/appointments/SedeFilter';
import { AppointmentFiltersAdmin } from '../components/appointments/AppointmentFiltersAdmin';
import { CreateAppointmentForm } from '../components/appointments/CreateAppointmentForm';

// Reutilizar componentes del clinic
import { AppointmentStatsCards } from '@/app/clinic/components/appointments/AppointmentStatsCards';
import { MonthCalendarView } from '@/app/clinic/components/appointments/MonthCalendarView';
import { WeekCalendarView } from '@/app/clinic/components/appointments/WeekCalendarView';
import { DayCalendarView } from '@/app/clinic/components/appointments/DayCalendarView';
import { EditAppointmentForm } from '@/app/clinic/components/appointments/EditAppointmentForm';
import { AppointmentDetailsModal } from '@/app/clinic/components/appointments/AppointmentDetailsModal';
import { DayAppointmentsModal } from '@/app/clinic/components/appointments/DayAppointmentsModal';
import { SPECIALTIES } from '@/app/clinic/components/appointments/constants';

// Importar modales de aprobación/rechazo
import { ApproveAppointmentModal } from '@/components/admin/ApproveAppointmentModal';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';

const AppointmentsCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { obtenerSedesActivas, obtenerSedePorId, cargarSedesDesdeDB } = useSedeStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  // Para usuarios no super_admin, inicializar con su sede asignada
  const userBranchId = user?.branch_id?.toString() || '';
  const [selectedSede, setSelectedSede] = useState<string>(() => {
    // Si NO es super_admin y tiene branch_id, forzar a su sede
    if (user?.role !== 'super_admin' && userBranchId) {
      return userBranchId;
    }
    return 'all';
  });
  const [showSedeDropdown, setShowSedeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ day: number; appointments: Appointment[] } | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [appointmentForAction, setAppointmentForAction] = useState<any>(null);

  const sedes = obtenerSedesActivas();
  const isSuperAdmin = user?.role === 'super_admin';

  // Helper function to format date to YYYY-MM-DD
  const formatDateToInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sync filters with calendar navigation
  useEffect(() => {
    if (viewMode === 'MONTH') {
      // Vista MES: primer y último día del mes visible
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      setDateFrom(formatDateToInput(firstDay));
      setDateTo(formatDateToInput(lastDay));
    } else if (viewMode === 'WEEK') {
      // Vista SEMANA: primer y último día de la semana visible
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      setDateFrom(formatDateToInput(startOfWeek));
      setDateTo(formatDateToInput(endOfWeek));
    } else if (viewMode === 'DAY') {
      // Vista DÍA: mismo día para desde y hasta
      const dayDate = formatDateToInput(currentDate);
      setDateFrom(dayDate);
      setDateTo(dayDate);
    }
  }, [currentDate, viewMode]);

  // Fetch data
  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSedeDropdown) {
        const dropdown = document.querySelector('[data-dropdown="sede"]');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setShowSedeDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSedeDropdown]);

  // Forzar sede del usuario para roles no super_admin (admin, receptionist, etc.)
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.branch_id) {
      const branchIdStr = user.branch_id.toString();
      if (selectedSede !== branchIdStr) {
        setSelectedSede(branchIdStr);
      }
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Para usuarios no super_admin, filtrar doctores por su sede (usando dentist_schedules)
      const branchIdForDoctors = isSuperAdmin ? undefined : user?.branch_id;

      // INTEGRACIÓN API REAL: Cargar citas, pacientes, doctores y sedes desde el backend
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        AppointmentApiService.loadAppointments(),
        AppointmentApiService.loadPatients(),
        AppointmentApiService.loadDoctors(branchIdForDoctors),
        cargarSedesDesdeDB() // Cargar sedes desde la API
      ]);

      // Mostrar todas las citas (incluyendo pendientes de aprobación, canceladas y rechazadas)
      // Los usuarios pueden filtrar por estado según necesiten
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      toast.error('Error al cargar los datos del calendario');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos silenciosamente (sin spinner de loading)
  // Se usa cuando se reciben actualizaciones por WebSocket
  const loadDataSilent = useCallback(async () => {
    try {
      // Para usuarios no super_admin, filtrar doctores por su sede (usando dentist_schedules)
      const branchIdForDoctors = isSuperAdmin ? undefined : user?.branch_id;

      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        AppointmentApiService.loadAppointments(),
        AppointmentApiService.loadPatients(),
        AppointmentApiService.loadDoctors(branchIdForDoctors),
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  }, [isSuperAdmin, user?.branch_id]);

  // Hook de WebSocket para actualizaciones en tiempo real
  const { isConnected } = useAppointmentSocket({
    onAppointmentUpdate: loadDataSilent,
    showNotifications: true,
    enabled: true,
  });

  // Helper functions
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor desconocido';
  };

  const getPatientInfo = (patientId: string) => {
    return patients.find(p => p.id === patientId) || null;
  };

  const getDoctorInfo = (doctorId: string) => {
    return doctors.find(d => d.id === doctorId) || null;
  };

  const getSedeName = (sedeId: string) => {
    const sede = obtenerSedePorId(sedeId);
    return sede?.nombre || 'Sin sede';
  };

  const getSelectedSedeName = () => {
    if (selectedSede === 'all') return 'Todas las Sedes';
    const sede = obtenerSedePorId(selectedSede);
    return sede?.nombre || 'Todas las Sedes';
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    // ✅ NUEVO: Excluir citas rechazadas del calendario (no deben visualizarse)
    // Las citas canceladas SÍ se muestran (en rojo)
    // Las citas pendientes SÍ se muestran (en amarillo)
    if (appointment.status === 'rejected') {
      return false;
    }

    const matchesStatus = selectedStatus === 'all'
      || (selectedStatus === 'rescheduled' ? (appointment as any).rescheduleCount > 0 : appointment.status === selectedStatus);
    const matchesDoctor = selectedDoctor === 'all' || appointment.doctorId === selectedDoctor;
    const matchesSede = selectedSede === 'all' || (appointment as any).sedeId === selectedSede;
    const matchesSearch = searchTerm === '' ||
      getPatientName(appointment.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDoctorName(appointment.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.notes && appointment.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro por rango de fechas (solo en vistas MES/SEMANA)
    // En vista DÍA, getDayViewAppointments() ya filtra por fecha
    let matchesDate = true;
    if (viewMode !== 'DAY' && (dateFrom || dateTo)) {
      const appointmentDate = new Date(appointment.date);
      const matchesDateFrom = !dateFrom || appointmentDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || appointmentDate <= new Date(dateTo + 'T23:59:59');
      matchesDate = matchesDateFrom && matchesDateTo;
    }

    return matchesStatus && matchesDoctor && matchesSede && matchesSearch && matchesDate
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'WEEK') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'DAY') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDayViewAppointments = () => {
    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === currentDate.toDateString();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleDayClick = (day: number) => {
    if (!day) return;
    const dayAppointments = getDayAppointments(day);
    setSelectedDay({ day, appointments: dayAppointments });
    setShowDayModal(true);
  };

  const getStatusStats = () => {
    return Object.keys(APPOINTMENT_STATUS_CONFIG).reduce((acc, status) => {
      if (status === 'rescheduled') {
        // Contar citas con rescheduleCount > 0 (badge "Reprogramada")
        acc[status] = filteredAppointments.filter(apt => (apt as any).rescheduleCount > 0).length;
      } else {
        acc[status] = filteredAppointments.filter(apt => apt.status === status).length;
      }
      return acc;
    }, {} as Record<string, number>);
  };

  // Event handlers
  const handleConfirmAppointment = async (appointment: Appointment) => {
    try {
      // INTEGRACIÓN API REAL: Confirmar cita en el backend
      await AppointmentApiService.confirmAppointment(appointment.id);
      await sendPatientNotification(appointment, 'confirmed');
      loadData();
      toast.success('Cita confirmada y notificación enviada al paciente');
      setSelectedAppointment(null);
    } catch (error) {
      toast.error('Error al confirmar la cita');
    }
  };

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
      await AppointmentApiService.cancelAppointment(appointment.id, reason?.trim() || '');
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
              Como Super Admin, puedes anular esta restricción si es necesario.
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

  const handleUpdateAppointment = async (updatedAppointment: any) => {
    try {
      // Actualizar cita en el backend
      await AppointmentApiService.updateAppointment(updatedAppointment.id, updatedAppointment);
      await sendPatientNotification(updatedAppointment, 'updated');
      await loadData();

      toast.success('Cita actualizada y notificación enviada al paciente');
      setShowEditAppointmentModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('❌ [handleUpdateAppointment] Error:', error);
      toast.error('Error al actualizar la cita');
    }
  };

  const handleCreateAppointment = async (newAppointment: any) => {
    try {
      // INTEGRACIÓN API REAL: Crear cita en el backend
      const branchId = newAppointment.sedeId ? parseInt(newAppointment.sedeId) : 1;

      const appointmentToCreate = {
        ...newAppointment,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await AppointmentApiService.createAppointment(appointmentToCreate, branchId);

      loadData();
      toast.success('Cita creada exitosamente');
      setShowCreateAppointmentModal(false);
    } catch (error) {
      console.error('❌ [AppointmentsCalendar.tsx] Error al crear cita:', error);
      toast.error('Error al crear la cita');
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

      // Enviar notificación al backend usando la API
      await notificationsApi.sendAppointmentNotification({
        patientId: appointment.patientId,
        appointmentId: Number(appointment.id),
        type: typeMap[type],
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        dentistName: `${doctor.firstName} ${doctor.lastName}`
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      await db.appointments.update(appointment.id, { status: 'in_progress', updatedAt: new Date() });
      toast.success(`Iniciando consulta para ${getPatientName(appointment.patientId)}`);
      navigate(`/clinic/consultation?patientId=${appointment.patientId}`);
      loadData();
    } catch (error) {
      toast.error('Error al iniciar la consulta');
    }
  };

  const isAppointmentReady = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
    return appointment.status === 'scheduled' && now >= fifteenMinutesBefore;
  };

  // Transform appointment for approve/reject modals
  const transformAppointmentForModal = (appointment: Appointment) => {
    const patient = getPatientInfo(appointment.patientId);
    const doctor = getDoctorInfo(appointment.doctorId);
    const sede = obtenerSedePorId((appointment as any).sedeId);
    const appointmentDate = new Date(appointment.date);
    // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
    const appointment_date_str = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}-${String(appointmentDate.getDate()).padStart(2, '0')}`;

    return {
      appointment_id: (appointment as any).appointment_id || parseInt(appointment.id),
      appointment_date: appointment_date_str,
      start_time: appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      patient_name: patient ? `${patient.firstName} ${patient.lastName}` : 'N/A',
      patient_phone: patient?.phone || '',
      patient_mobile: patient?.phone || '',
      dentist_name: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'N/A',
      specialty_name: (appointment as any).specialty || 'General',
      branch_name: sede?.nombre || 'N/A',
      voucher: (appointment as any).voucher || '',
      price: (appointment as any).price || 0,
      payment_method: (appointment as any).payment_method || ''
    };
  };

  const handleApproveClick = (appointment: Appointment) => {
    const transformedData = transformAppointmentForModal(appointment);
    setAppointmentForAction(transformedData);
    setShowApproveModal(true);
    setSelectedAppointment(null);
  };

  const handleRejectClick = (appointment: Appointment) => {
    const transformedData = transformAppointmentForModal(appointment);
    setAppointmentForAction(transformedData);
    setShowRejectModal(true);
    setSelectedAppointment(null);
  };

  const handleApproveSuccess = () => {
    loadData();
    toast.success('Cita aprobada exitosamente');
  };

  const handleRejectSuccess = () => {
    loadData();
    toast.success('Cita rechazada exitosamente');
  };

  const statusStats = getStatusStats();
  const calendarDays = generateCalendarGrid();
  const monthAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.getFullYear() === currentDate.getFullYear() &&
           aptDate.getMonth() === currentDate.getMonth();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
                <p className="text-gray-600">Panel administrativo - Gestión de citas</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Indicador de conexión en tiempo real */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isConnected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={isConnected ? 'Conectado - Actualizaciones en tiempo real' : 'Desconectado'}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>En vivo</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowCreateAppointmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Cita
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <AppointmentStatsCards
          stats={statusStats}
          selectedStatus={selectedStatus}
          onStatusClick={(status) => setSelectedStatus(status)}
        />

        {/* Sede Filter - Solo para Super Admin */}
        {isSuperAdmin && (
          <SedeFilter
            selectedSede={selectedSede}
            sedes={sedes}
            showSedeDropdown={showSedeDropdown}
            getSelectedSedeName={getSelectedSedeName}
            onSedeChange={(sedeId) => {
              setSelectedSede(sedeId);
              setShowSedeDropdown(false);
            }}
            onToggleDropdown={() => setShowSedeDropdown(!showSedeDropdown)}
          />
        )}

        {/* Filters */}
        <AppointmentFiltersAdmin
          searchTerm={searchTerm}
          selectedDoctor={selectedDoctor}
          viewMode={viewMode}
          dateFrom={dateFrom}
          dateTo={dateTo}
          doctors={doctors}
          onSearchChange={setSearchTerm}
          onDoctorChange={setSelectedDoctor}
          onViewModeChange={setViewMode}
          onDateFromChange={(date) => {
            setDateFrom(date);
            if (viewMode === 'DAY' && date) setCurrentDate(new Date(date + 'T12:00:00'));
          }}
          onDateToChange={(date) => {
            setDateTo(date);
            if (viewMode === 'DAY' && date) setCurrentDate(new Date(date + 'T12:00:00'));
          }}
        />

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric'
                }).slice(1)}
              </h2>

              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {monthAppointments.length} citas este mes
            </div>
          </div>

          {/* Calendar Views */}
          <div className="p-4">
            {viewMode === 'MONTH' && (
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

            {viewMode === 'WEEK' && (
              <WeekCalendarView
                weekDays={getWeekAppointments()}
                getPatientName={getPatientName}
                doctors={doctors}
                onAppointmentClick={setSelectedAppointment}
              />
            )}

            {viewMode === 'DAY' && (
              <DayCalendarView
                appointments={getDayViewAppointments()}
                doctors={doctors}
                getPatientInfo={getPatientInfo}
                getDoctorName={getDoctorName}
                onAppointmentClick={setSelectedAppointment}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {selectedAppointment && !showEditAppointmentModal && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            userRole={user?.role}
            getPatientInfo={getPatientInfo}
            getPatientName={getPatientName}
            getDoctorName={getDoctorName}
            isAppointmentReady={isAppointmentReady}
            onClose={() => setSelectedAppointment(null)}
            onEdit={() => setShowEditAppointmentModal(true)}
            onConfirm={handleConfirmAppointment}
            onCancel={handleCancelAppointment}
            onStartConsultation={handleStartConsultation}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
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
              setShowEditAppointmentModal(true);
            }}
            onConfirm={handleConfirmAppointment}
            onViewDetails={(apt) => {
              setSelectedAppointment(apt);
              setShowDayModal(false);
            }}
            onStartConsultation={handleStartConsultation}
          />
        )}

        {showEditAppointmentModal && selectedAppointment && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowEditAppointmentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Reprogramar Cita</h3>
                <button
                  onClick={() => setShowEditAppointmentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <EditAppointmentForm
                appointment={selectedAppointment}
                patients={patients}
                doctors={doctors}
                specialties={SPECIALTIES}
                onSave={handleUpdateAppointment}
                onCancel={() => setShowEditAppointmentModal(false)}
              />
            </motion.div>
          </div>,
          document.body
        )}

        <Modal
          isOpen={showCreateAppointmentModal}
          onClose={() => setShowCreateAppointmentModal(false)}
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
              isSuperAdmin={isSuperAdmin}
              userSedeId={user?.branch_id?.toString() || user?.sedeId}
              onSave={handleCreateAppointment}
              onCancel={() => setShowCreateAppointmentModal(false)}
            />
          </Modal.Body>

          <Modal.Footer>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowCreateAppointmentModal(false)}
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

        {/* Approve Appointment Modal - Solo renderizar si hay datos */}
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

        {/* Reject Appointment Modal - Solo renderizar si hay datos */}
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

export default AppointmentsCalendar;
