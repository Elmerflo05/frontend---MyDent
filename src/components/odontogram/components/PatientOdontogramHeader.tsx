import { Download, Activity, RotateCcw, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { UI_TEXTS } from '@/constants/ui';
import type { OdontogramStatistics } from '../classes';

interface PatientOdontogramHeaderProps {
  patient: any;
  stats: OdontogramStatistics | null;
  totalBudget: number;
  servicesCount: number;
  hideStatsCards?: boolean;
  onExport: () => void;
  onShowServices: () => void;
  onReset: () => void;
  onSave: () => void;
}

export const PatientOdontogramHeader = ({
  patient,
  stats,
  totalBudget,
  servicesCount,
  hideStatsCards = false,
  onExport,
  onShowServices,
  onReset,
  onSave
}: PatientOdontogramHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {patient ? `Odontograma de ${patient.name}` : 'Odontograma'}
            </h2>
            {patient && <p className="text-sm text-gray-600">DNI: {patient.documentNumber}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button onClick={onShowServices} disabled={!patient} className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <Activity className="w-4 h-4" />
              Servicios adicionales
            </button>
            <button onClick={onReset} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </button>
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Save className="w-4 h-4" />
              {UI_TEXTS.BUTTONS.SAVE}
            </button>
          </div>
        </div>
        {!hideStatsCards && stats && (
          <div className="grid grid-cols-6 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{stats.totalTeeth}</div>
              <div className="text-xs text-blue-600">Total dientes</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{stats.healthyTeeth}</div>
              <div className="text-xs text-green-600">Sanos</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{stats.treatedTeeth}</div>
              <div className="text-xs text-yellow-600">Tratados</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{stats.missingTeeth}</div>
              <div className="text-xs text-red-600">Ausentes</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{servicesCount}</div>
              <div className="text-xs text-purple-600">Servicios</div>
            </div>
            <motion.div initial={{ scale: 1 }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.3, ease: "easeInOut" }} key={totalBudget} className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg border-2 border-emerald-200">
              <div className="text-xl font-bold text-emerald-700">S/ {totalBudget.toFixed(2)}</div>
              <div className="text-xs text-emerald-600 font-medium">Presupuesto en Tiempo Real</div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-1 animate-pulse"></div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
