import { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  Ban
} from 'lucide-react';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';

// Tipos locales para la lista de citas
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
}

interface ListaCitasProps {
  citas: Appointment[];
  onSolicitarCita: () => void;
  onAppointmentCancelled?: () => void;
}

const ListaCitas = ({ citas, onSolicitarCita, onAppointmentCancelled }: ListaCitasProps) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    if (onAppointmentCancelled) {
      onAppointmentCancelled();
    }
  };
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return {
          label: 'Pendiente de Aprobación',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle
        };
      case 'scheduled':
        return {
          label: 'Programada',
          color: 'bg-indigo-100 text-indigo-800',
          icon: Calendar
        };
      case 'confirmed':
        return {
          label: 'Confirmada',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        };
      case 'in_progress':
        return {
          label: 'En Proceso',
          color: 'bg-orange-100 text-orange-800',
          icon: Clock
        };
      case 'completed':
        return {
          label: 'Completada',
          color: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        };
      case 'no_show':
        return {
          label: 'No Asistió',
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle
        };
      case 'rescheduled':
        return {
          label: 'Reprogramada',
          color: 'bg-purple-100 text-purple-800',
          icon: Calendar
        };
      case 'rejected':
        return {
          label: 'Rechazada',
          color: 'bg-rose-100 text-rose-800',
          icon: XCircle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consulta';
      case 'treatment': return 'Tratamiento';
      case 'followup': return 'Seguimiento';
      case 'emergency': return 'Emergencia';
      default: return type;
    }
  };

  // Filtrar citas
  const upcomingAppointments = citas.filter(apt => new Date(apt.date) >= new Date());
  const pastAppointments = citas.filter(apt => new Date(apt.date) < new Date());

  if (citas.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron citas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Solicita una nueva cita para comenzar.
          </p>
          <button
            onClick={onSolicitarCita}
            className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Primera Cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas Citas</h2>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {appointment.date.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {appointment.time} - {getTypeLabel(appointment.type)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{appointment.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Especialidad:</strong> {appointment.specialty}
                  </div>

                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-3">
                      <strong>Notas:</strong> {appointment.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(appointment)}
                      className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalles
                    </button>
                    {!['cancelled', 'completed', 'no_show', 'rejected'].includes(appointment.status) && (
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Citas</h2>
          <div className="space-y-4">
            {pastAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {appointment.date.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {appointment.time} - {getTypeLabel(appointment.type)}
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{appointment.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-3">
                      <strong>Notas:</strong> {appointment.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(appointment)}
                      className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modales */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
      />

      <CancelAppointmentModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        appointment={selectedAppointment}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
};

export default ListaCitas;