/**
 * PatientInfoCard Component
 *
 * Muestra la información del paciente en la parte superior del diagnóstico
 * Componente extraído de FinalDiagnosisStep para reducir complejidad
 */

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface PatientInfoCardProps {
  patient: any;
}

export const PatientInfoCard = ({ patient }: PatientInfoCardProps) => {
  if (!patient) return null;

  const age = new Date().getFullYear() - new Date(patient.birthDate || '1990-01-01').getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-green-900">
            {patient.firstName} {patient.lastName}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Documento:</span> {patient.documentType}: {patient.documentNumber}
            </div>
            <div>
              <span className="font-medium">Edad:</span> {age} años
            </div>
            <div>
              <span className="font-medium">Teléfono:</span> {patient.phone}
            </div>
            {patient.medicalHistory?.allergies?.length > 0 && (
              <div className="md:col-span-3">
                <span className="font-medium text-red-600">⚠️ Alergias:</span>{' '}
                <span className="text-red-700">{patient.medicalHistory.allergies.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
