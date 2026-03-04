import { useState } from 'react';
import { X, CheckCircle, Loader2, Calendar, User, Phone, Receipt, ExternalLink, FileText, X as CloseIcon, ZoomIn } from 'lucide-react';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/common/Modal';
import { parseLocalDate } from '@/utils/dateUtils';

// Obtener la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

interface AppointmentData {
  appointment_id: number;
  appointment_date: string;
  start_time: string;
  patient_name?: string;
  patient_phone?: string;
  patient_mobile?: string;
  dentist_name?: string;
  specialty_name?: string;
  branch_name?: string;
  voucher?: string;
  price?: number;
  payment_method?: string;
}

interface ApproveAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentData | null;
  onSuccess: () => void;
}

export const ApproveAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}: ApproveAppointmentModalProps) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const voucherUrl = appointment?.voucher
    ? `${API_BASE_URL.replace('/api', '')}${appointment.voucher}`
    : null;

  const handleClose = () => {
    if (!isSubmitting) {
      setApprovalNotes('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await appointmentsApi.approveAppointment(
        appointment.appointment_id,
        approvalNotes.trim() || undefined
      );

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error al aprobar cita:', err);
      setError(err.message || 'Error al aprobar la cita. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  // ✅ Usar parseLocalDate para evitar desfase de timezone
  const appointmentDate = parseLocalDate(appointment.appointment_date);
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      showCloseButton={false}
    >
      {/* Header Fijo */}
      <Modal.Header className="bg-gradient-to-r from-green-600 to-green-700 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Aprobar Cita</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Modal.Header>

      {/* Content con scroll */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <Modal.Body className="overflow-y-auto">
          {/* Información de la cita */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha y hora */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="font-semibold">{formattedDate}</div>
                    <div className="text-sm text-gray-600">Hora: {appointment.start_time}</div>
                  </div>
                </div>
              </div>

              {/* Paciente */}
              <div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-teal-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Paciente</div>
                    <div className="font-medium text-gray-900">{appointment.patient_name || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-teal-600 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Contacto</div>
                    <div className="font-medium text-gray-900">
                      {appointment.patient_mobile || appointment.patient_phone || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor */}
              <div>
                <div className="text-xs text-gray-500">Doctor</div>
                <div className="font-medium text-gray-900">{appointment.dentist_name || 'N/A'}</div>
              </div>

              {/* Especialidad */}
              <div>
                <div className="text-xs text-gray-500">Especialidad</div>
                <div className="font-medium text-gray-900">{appointment.specialty_name || 'N/A'}</div>
              </div>

              {/* Sede */}
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Sede</div>
                <div className="font-medium text-gray-900">{appointment.branch_name || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Información de pago */}
          {(appointment.price || appointment.voucher) && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-start gap-2 mb-2">
                <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Información de Pago</h3>
                  <div className="space-y-1 text-sm">
                    {appointment.price && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Monto:</span>
                        <span className="font-medium text-blue-900">
                          S/ {typeof appointment.price === 'number'
                            ? appointment.price.toFixed(2)
                            : parseFloat(appointment.price).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {appointment.payment_method && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Método de pago:</span>
                        <span className="font-medium text-blue-900">{appointment.payment_method}</span>
                      </div>
                    )}
                    {appointment.voucher && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <span className="text-blue-700 font-medium">Voucher de Pago:</span>
                        <div className="mt-2 space-y-2">
                          {/* Mostrar la imagen del voucher */}
                          {appointment.voucher && appointment.voucher.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <div className="relative rounded-lg overflow-hidden border border-blue-200 bg-white">
                              <img
                                src={`${API_BASE_URL.replace('/api', '')}${appointment.voucher}`}
                                alt="Voucher de pago"
                                className="w-full h-auto max-h-96 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="p-4 text-center text-gray-500">
                                        <p>No se pudo cargar la imagen del voucher</p>
                                        <p class="text-xs mt-1">${appointment.voucher}</p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          ) : appointment.voucher && appointment.voucher.match(/\.pdf$/i) ? (
                            <div className="bg-white p-4 rounded border border-blue-200 flex items-center gap-3">
                              <FileText className="w-8 h-8 text-blue-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Documento PDF</p>
                                <p className="text-xs text-gray-500 break-all">{appointment.voucher}</p>
                              </div>
                              <a
                                href={`${API_BASE_URL.replace('/api', '')}${appointment.voucher}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Abrir PDF"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          ) : (
                            <div className="font-mono text-sm bg-white p-3 rounded border border-blue-200 break-all">
                              {appointment.voucher}
                            </div>
                          )}

                          {/* Botón de acción */}
                          <button
                            onClick={() => setShowVoucherModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Ver en pantalla completa"
                          >
                            <ZoomIn className="w-4 h-4" />
                            Ver completo
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          ⚠️ Verifica que el voucher sea válido y corresponda al monto antes de aprobar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <ul className="space-y-1 text-xs ml-4">
                <li>• Verifica que el voucher sea válido y corresponda al monto indicado</li>
                <li>• Al aprobar, la cita cambiará a estado "Programada"</li>
                <li>• El paciente y el doctor recibirán una notificación</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>

          {/* Notas de aprobación (opcional) */}
          <div className="mb-6">
            <label htmlFor="approval_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas de aprobación (opcional)
            </label>
            <textarea
              id="approval_notes"
              value={approvalNotes}
              onChange={(e) => {
                setApprovalNotes(e.target.value);
                setError(null);
              }}
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ej: Voucher verificado - Banco BCP - Operación #123456"
            />
            <div className="mt-1 text-xs text-gray-500">
              {approvalNotes.length}/500 caracteres
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </Modal.Body>
      </form>

      {/* Footer Fijo */}
      <Modal.Footer>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Aprobar Cita
              </>
            )}
          </button>
        </div>
      </Modal.Footer>

      {/* Modal de Visualización del Voucher */}
      <AnimatePresence>
        {showVoucherModal && voucherUrl && appointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
            style={{ zIndex: 10000 }}
            onClick={() => setShowVoucherModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">
                    Voucher de Pago
                  </h3>
                  <button
                    onClick={() => setShowVoucherModal(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                {appointment.voucher?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  // Mostrar imagen
                  <img
                    src={voucherUrl}
                    alt="Voucher de pago"
                    className="max-w-full max-h-full object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                ) : appointment.voucher?.match(/\.pdf$/i) ? (
                  // Mostrar PDF en iframe
                  <iframe
                    src={voucherUrl}
                    className="w-full h-full"
                    title="Voucher PDF"
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Formato de voucher no soportado para vista previa</p>
                    <a
                      href={voucherUrl}
                      download
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Descargar archivo
                    </a>
                  </div>
                )}
              </div>

              {/* Footer con acciones */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <div className="flex justify-center">
                  <a
                    href={voucherUrl}
                    download
                    className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
