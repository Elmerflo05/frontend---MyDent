import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, User } from 'lucide-react';
import type { AppointmentData } from '@/services/api/appointmentsApi';

interface SelectionStickyBarProps {
  selectedPatient: any | null;
  selectedAppointment: AppointmentData | null;
  onChange: () => void;
  onContinue: () => void;
  visible: boolean;
}

const formatTime = (t?: string) => (t ? t.substring(0, 5) : '');

const SelectionStickyBarComponent = ({
  selectedPatient,
  selectedAppointment,
  onChange,
  onContinue,
  visible
}: SelectionStickyBarProps) => {
  if (!selectedPatient && !selectedAppointment) return null;

  const name = selectedAppointment?.patient_name
    ?? (selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '');

  const meta = selectedAppointment
    ? `Cita ${formatTime(selectedAppointment.start_time)}${selectedAppointment.reason ? ` · ${selectedAppointment.reason}` : ''}`
    : selectedPatient
      ? `Sin cita · ${selectedPatient.documentType ?? ''} ${selectedPatient.documentNumber ?? ''}`.trim()
      : '';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40"
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 bg-clinic-light rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-clinic-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 leading-tight">Paciente seleccionado</p>
                <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {name || '—'}
                </p>
                {meta && <p className="text-xs text-gray-500 truncate">{meta}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onChange}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="bg-clinic-primary hover:bg-clinic-dark text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
              >
                Continuar con la consulta
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SelectionStickyBar = memo(SelectionStickyBarComponent);
