import { useMemo } from 'react';
import { Calendar, Clock, User, MapPin, FileText, RefreshCcw, Upload } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useModal } from '@/hooks/useModal';
import {
  RescheduleAppointmentModal,
  ResubmitVoucherModal
} from '@/components/appointments';
import {
  AppointmentDetails,
  APPOINTMENT_STATUS,
} from '@/types/appointment.types';
import {
  getStatusConfig,
  getTypeLabel,
  formatAppointmentDate,
} from '@/utils/appointment.utils';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentDetails | null;
  onRefresh?: () => void;
}

export const AppointmentDetailsModal = ({
  isOpen,
  onClose,
  appointment,
  onRefresh
}: AppointmentDetailsModalProps) => {
  const rescheduleModal = useModal();
  const resubmitVoucherModal = useModal();

  // Memoize expensive computations
  const statusConfig = useMemo(
    () => appointment ? getStatusConfig(appointment.status) : null,
    [appointment?.status]
  );

  const typeLabel = useMemo(
    () => appointment ? getTypeLabel(appointment.type) : '',
    [appointment?.type]
  );

  const formattedDate = useMemo(
    () => appointment ? formatAppointmentDate(appointment.date) : '',
    [appointment?.date]
  );

  const handleSuccess = () => {
    onRefresh?.();
    onClose();
  };

  // Early return AFTER all hooks
  if (!appointment || !statusConfig) {
    return null;
  }

  const canReschedule =
    appointment.status === APPOINTMENT_STATUS.SCHEDULED ||
    appointment.status === APPOINTMENT_STATUS.NO_SHOW;

  const canResubmitVoucher = appointment.status === APPOINTMENT_STATUS.REJECTED;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        closeOnBackdropClick
        closeOnEscape
      >
        {/* Header */}
        <Modal.Header>
          <h2 id="appointment-modal-title" className="text-xl font-bold text-gray-900">
            Detalles de la Cita
          </h2>
        </Modal.Header>

        {/* Body */}
        <Modal.Body>
          <div className="space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Fecha y Hora */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-teal-700 font-medium">Fecha y Hora</div>
                  <div className="text-lg font-bold text-gray-900">{formattedDate}</div>
                  <div className="flex items-center gap-2 text-gray-700 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.time} - {typeLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Doctor */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Profesional</div>
                  <div className="font-semibold text-gray-900">{appointment.doctorName}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Especialidad:</span> {appointment.specialty}
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Ubicación</div>
                  <div className="font-semibold text-gray-900">{appointment.location}</div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {appointment.notes && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-blue-700 font-medium mb-2">Notas de la Cita</div>
                    <div className="text-gray-700 text-sm leading-relaxed">{appointment.notes}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Información Adicional */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                  <span className="text-gray-600">ID de Cita:</span>
                  <span className="font-medium text-gray-900">#{appointment.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium text-gray-900">{typeLabel}</span>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <h3 className="text-sm font-semibold text-teal-900 mb-2">Recordatorios Importantes</h3>
              <ul className="space-y-1 text-sm text-teal-800">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">•</span>
                  <span>Llegar 10 minutos antes de tu cita</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">•</span>
                  <span>Traer tu DNI o documento de identidad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">•</span>
                  <span>Si necesitas cancelar, hazlo con 24 horas de anticipación</span>
                </li>
              </ul>
            </div>
          </div>
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer>
          <div className="flex flex-wrap gap-3">
            {canReschedule && (
              <button
                onClick={rescheduleModal.open}
                className="flex-1 min-w-[120px] px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reprogramar
              </button>
            )}

            {canResubmitVoucher && (
              <button
                onClick={resubmitVoucherModal.open}
                className="flex-1 min-w-[120px] px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Reenviar Voucher
              </button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modales secundarios - SOLO se montan cuando están abiertos */}
      {rescheduleModal.isOpen && (
        <RescheduleAppointmentModal
          isOpen={rescheduleModal.isOpen}
          onClose={rescheduleModal.close}
          appointment={{
            appointment_id: parseInt(appointment.id),
            // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
            appointment_date: `${appointment.date.getFullYear()}-${String(appointment.date.getMonth() + 1).padStart(2, '0')}-${String(appointment.date.getDate()).padStart(2, '0')}`,
            start_time: appointment.time,
            end_time: new Date(appointment.date.getTime() + ((appointment as any).duration || 30) * 60000).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            patient_name: 'Tú',
            dentist_name: appointment.doctorName,
            duration: (appointment as any).duration || 30,
          }}
          onSuccess={handleSuccess}
        />
      )}

      {resubmitVoucherModal.isOpen && (
        <ResubmitVoucherModal
          isOpen={resubmitVoucherModal.isOpen}
          onClose={resubmitVoucherModal.close}
          appointment={{
            appointment_id: parseInt(appointment.id),
            // Extraer fecha local sin convertir a UTC para evitar desplazamiento de día
            appointment_date: `${appointment.date.getFullYear()}-${String(appointment.date.getMonth() + 1).padStart(2, '0')}-${String(appointment.date.getDate()).padStart(2, '0')}`,
            start_time: appointment.time,
            patient_name: 'Tú',
            rejection_reason: appointment.rejection_reason,
          }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};
