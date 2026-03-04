/**
 * CompletionModal - Modal de confirmación de consulta finalizada
 * Muestra el estado de la cita y un resumen del tratamiento
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  User,
  Check,
  X,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  DollarSign,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';

interface CompletionModalProps {
  show: boolean;
  patient: any;
  consolidatedTotal: number;
  onClose: () => void;
  toast: {
    success: (message: string) => void;
  };
}

export const CompletionModal = ({
  show,
  patient,
  consolidatedTotal,
  onClose,
  toast
}: CompletionModalProps) => {
  const handleConfirm = () => {
    onClose();
    toast.success('Consulta completada exitosamente');
  };

  const statusInfo = {
    code: 'completed',
    name: 'Completada',
    color: 'green',
    description: 'La cita ha sido finalizada exitosamente'
  };

  const completedItems = [
    { icon: Stethoscope, text: 'Tratamiento registrado correctamente' },
    { icon: FileText, text: 'Historial médico actualizado' },
    { icon: Calendar, text: 'Cita marcada como completada' },
    { icon: DollarSign, text: 'Presupuesto generado' }
  ];

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      size="md"
    >
      {/* Header con gradiente y animación */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600" />

        <div className="relative px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
              className="relative"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-800" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ¡Consulta Finalizada!
              </h2>
              <p className="text-green-100 text-sm sm:text-base mt-1">
                El tratamiento se ha completado con éxito
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Body */}
      <Modal.Body className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-5">
          {/* Estado de la Cita */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">
                    Estado de la Cita
                  </span>
                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    {statusInfo.name}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-green-800 font-semibold mt-0.5">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Información del Paciente */}
          {patient && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paciente</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
              </div>

              <div className="space-y-2 ml-0 sm:ml-14">
                {completedItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-600"
                  >
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Presupuesto Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 sm:p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-blue-100">Presupuesto Total</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    S/. {consolidatedTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Nota informativa */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800">
              La cita ha sido marcada como <strong>completada</strong> en el sistema.
              El paciente puede ver el resumen en su portal.
            </p>
          </motion.div>
        </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer className="flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-5 bg-gray-50">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-200 text-sm sm:text-base"
        >
          <Check className="w-5 h-5" />
          ¡Entendido!
          <ArrowRight className="w-4 h-4" />
        </button>
      </Modal.Footer>
    </Modal>
  );
};
