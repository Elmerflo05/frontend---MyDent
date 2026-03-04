import { UserCheck, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface PatientsHeaderProps {
  onNewPatient: () => void;
}

export const PatientsHeader = ({ onNewPatient }: PatientsHeaderProps) => {

  return (
    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          Gestión de Pacientes
        </h1>
        <p className="text-gray-600 mt-1">Administra la base de datos de pacientes de la clínica</p>
      </div>

      <motion.button
        onClick={() => {
          onNewPatient();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg font-semibold text-base"
      >
        <Plus className="w-5 h-5" />
        Nuevo Paciente
      </motion.button>
    </div>
  );
};
