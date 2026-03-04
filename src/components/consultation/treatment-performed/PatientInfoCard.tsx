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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">
            {patient.firstName} {patient.lastName}
          </h4>
          <p className="text-sm text-blue-700">
            {age} años • {patient.phone}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
