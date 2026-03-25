import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Phone,
  Mail,
  Filter,
  Search,
  List,
  Grid3X3,
  Wifi,
  WifiOff,
  CheckCircle,
  X
} from 'lucide-react';
import ResumenCitas from '@/components/patient/ResumenCitas';
import ListaCitas from '@/components/patient/ListaCitas';
import CalendarioCitas from '@/components/patient/CalendarioCitas';
import RequestAppointmentModal from '@/components/patient/RequestAppointmentModal';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { useAuthStore } from '@/store/authStore';
import { useAppointmentSocket } from '@/hooks/useAppointmentSocket';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
  location: string;
  status: 'pending_approval' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'rejected';
  notes?: string;
  type: 'consultation' | 'treatment' | 'followup' | 'emergency';
  duration?: number;
  rejection_reason?: string;
}

// Tipo para la vista
type Vista = 'lista' | 'calendario';

const PatientAppointments = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [vista, setVista] = useState<Vista>('lista');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Usar el user_id como patient_id
      // El backend se encarga de buscar el patient_id correcto en la tabla patients
      const userId = parseInt(user.id);

      const response = await appointmentsApi.getAppointments({
        patient_id: userId,
        limit: 100
      });

      const formattedAppointments: Appointment[] = response.data.map((apt: any) => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);

        // Usar start_time (campo real del backend) en lugar de appointment_time
        const timeStr = apt.start_time || '00:00:00';
        const timeParts = timeStr.split(':');
        const hours = timeParts[0]?.padStart(2, '0') || '00';
        const minutes = timeParts[1]?.padStart(2, '0') || '00';

        // Crear fecha en zona horaria LOCAL
        const aptDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));

        // Map status basado en appointment_status_id
        // 0: Pendiente Aprobación, 1: Programada, 2: Confirmada, 3: En Proceso,
        // 4: Completada, 5: Cancelada, 6: No Asistió, 7: Reprogramada, 8: Rechazada
        type AppointmentStatus = 'pending_approval' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'rejected';
        let status: AppointmentStatus = 'pending_approval';

        switch (apt.appointment_status_id) {
          case 0: status = 'pending_approval'; break;
          case 1: status = 'scheduled'; break;
          case 2: status = 'confirmed'; break;
          case 3: status = 'in_progress'; break;
          case 4: status = 'completed'; break;
          case 5: status = 'cancelled'; break;
          case 6: status = 'no_show'; break;
          case 7: status = 'rescheduled'; break;
          case 8: status = 'rejected'; break;
          default: status = 'pending_approval';
        }

        // Override si está cancelada explícitamente
        if (apt.cancelled_at) status = 'cancelled';

        return {
          id: apt.appointment_id?.toString() || '',
          date: aptDate,
          time: `${hours}:${minutes}`,
          doctorName: apt.dentist_name ? `Dr. ${apt.dentist_name}` : 'Doctor no asignado',
          specialty: apt.specialty_name || 'Consulta General',
          location: apt.branch_name || 'Sede principal',
          status: status,
          notes: apt.notes || apt.reason || '',
          type: 'consultation' as const,
          duration: apt.duration || 30,
          rejection_reason: apt.rejection_reason || ''
        };
      });

      setAppointments(formattedAppointments);

    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recargar datos silenciosamente (sin spinner de loading)
  // Se usa cuando se reciben actualizaciones por WebSocket
  const loadAppointmentsSilent = useCallback(async () => {
    try {
      if (!user?.id) return;

      const userId = parseInt(user.id);
      const response = await appointmentsApi.getAppointments({
        patient_id: userId,
        limit: 100
      });

      const formattedAppointments: Appointment[] = response.data.map((apt: any) => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const timeStr = apt.start_time || '00:00:00';
        const timeParts = timeStr.split(':');
        const hours = timeParts[0]?.padStart(2, '0') || '00';
        const minutes = timeParts[1]?.padStart(2, '0') || '00';

        // Crear fecha en zona horaria LOCAL
        const aptDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));

        type AppointmentStatus = 'pending_approval' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'rejected';
        let status: AppointmentStatus = 'pending_approval';

        switch (apt.appointment_status_id) {
          case 0: status = 'pending_approval'; break;
          case 1: status = 'scheduled'; break;
          case 2: status = 'confirmed'; break;
          case 3: status = 'in_progress'; break;
          case 4: status = 'completed'; break;
          case 5: status = 'cancelled'; break;
          case 6: status = 'no_show'; break;
          case 7: status = 'rescheduled'; break;
          case 8: status = 'rejected'; break;
          default: status = 'pending_approval';
        }

        if (apt.cancelled_at) status = 'cancelled';

        return {
          id: apt.appointment_id?.toString() || '',
          date: aptDate,
          time: `${hours}:${minutes}`,
          doctorName: apt.dentist_name ? `Dr. ${apt.dentist_name}` : 'Doctor no asignado',
          specialty: apt.specialty_name || 'Consulta General',
          location: apt.branch_name || 'Sede principal',
          status: status,
          notes: apt.notes || apt.reason || '',
          type: 'consultation' as const,
          duration: apt.duration || 30,
          rejection_reason: apt.rejection_reason || ''
        };
      });

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error al recargar citas:', error);
    }
  }, [user?.id]);

  // Hook de WebSocket para actualizaciones en tiempo real
  const { isConnected } = useAppointmentSocket({
    onAppointmentUpdate: loadAppointmentsSilent,
    showNotifications: true,
    enabled: true,
  });

  // Manejar solicitud de nueva cita
  const handleSolicitarCita = () => {
    setShowRequestModal(true);
  };

  // Manejar éxito al crear cita
  const handleAppointmentSuccess = () => {
    loadAppointments();
    setShowSuccessPopup(true);
    // Auto-cerrar después de 5 segundos
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setShowSuccessPopup(false);
    }, 5000);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = selectedFilter === 'all' || appointment.status === selectedFilter;
    const matchesSearch = searchTerm.trim() === '' ||
      appointment.doctorName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      appointment.specialty.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      appointment.location.toLowerCase().includes(searchTerm.trim().toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calcular estadísticas para el resumen
  const upcomingAppointments = filteredAppointments.filter(apt => new Date(apt.date) >= new Date());
  const pastAppointments = filteredAppointments.filter(apt => new Date(apt.date) < new Date());
  const pendingAppointments = filteredAppointments.filter(apt =>
    apt.status === 'pending_approval' || apt.status === 'scheduled' || apt.status === 'rescheduled'
  );
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed');

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
        {/* Modal siempre renderizado para mantener estado */}
        <RequestAppointmentModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleAppointmentSuccess}
        />
      </>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
                <p className="text-gray-600">Gestiona tus citas médicas y seguimientos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setVista('lista')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    vista === 'lista'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
                <button
                  onClick={() => setVista('calendario')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    vista === 'calendario'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Calendario
                </button>
              </div>
            </div>
          </div>

          {/* Resumen - Se muestra solo una vez */}
          <ResumenCitas
            proximas={upcomingAppointments.length}
            completadas={completedAppointments.length}
            pendientes={pendingAppointments.length}
            total={filteredAppointments.length}
          />

          {/* Filters - Solo para vista lista */}
          {vista === 'lista' && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por doctor o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-64"
                />
              </div>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todos los estados</option>
                <option value="pending_approval">Pendiente de Aprobación</option>
                <option value="scheduled">Programadas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="in_progress">En Proceso</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
                <option value="rejected">Rechazadas</option>
              </select>

              <div className="ml-auto text-sm text-gray-600">
                {filteredAppointments.length} citas encontradas
              </div>
            </div>
          )}
        </div>

        {/* Renderizado condicional basado en la vista */}
        {vista === 'lista' && (
          <ListaCitas
            citas={filteredAppointments}
            onSolicitarCita={handleSolicitarCita}
            onAppointmentCancelled={loadAppointments}
          />
        )}

        {vista === 'calendario' && (
          <CalendarioCitas
            citas={filteredAppointments}
            onSolicitarCita={handleSolicitarCita}
            onAppointmentCreated={loadAppointments}
          />
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

        {/* Modal de solicitar cita */}
        <RequestAppointmentModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleAppointmentSuccess}
        />
      </motion.div>

      {/* Popup de éxito al solicitar cita */}
      {createPortal(
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSuccessPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, duration: 0.5 }}
                  className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-5"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Solicitud Enviada!
                </h3>
                <p className="text-gray-600 mb-6">
                  Tu solicitud de cita ha sido enviada exitosamente. Te contactaremos pronto para confirmar tu cita.
                </p>

                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium shadow-sm"
                >
                  Entendido
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Botón Flotante Solicitar Cita - Portal al body */}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSolicitarCita}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Solicitar Cita</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PatientAppointments;