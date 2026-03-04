import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  Activity,
  Wrench,
  TrendingUp
} from 'lucide-react';

interface ConsultoriosStatsCardsProps {
  stats: {
    total: number;
    disponibles: number;
    ocupados: number;
    mantenimiento: number;
    inactivos: number;
    porcentajeDisponible: string;
  };
}

export const ConsultoriosStatsCards = ({ stats }: ConsultoriosStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Disponibles</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.disponibles}</p>
          </div>
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Ocupados</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.ocupados}</p>
          </div>
          <Activity className="h-10 w-10 text-blue-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.mantenimiento}</p>
          </div>
          <Wrench className="h-10 w-10 text-yellow-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">% Disponible</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.porcentajeDisponible}%</p>
          </div>
          <TrendingUp className="h-10 w-10 text-purple-400" />
        </div>
      </motion.div>
    </div>
  );
};
