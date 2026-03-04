import { motion } from 'framer-motion';
import { Users, Clock, BarChart3, Edit2, Trash2 } from 'lucide-react';
import type { Consultorio } from '@/types';
import { getEstadoIcon, getEstadoBadgeClass } from './consultorios-helpers';

interface ConsultorioCardProps {
  consultorio: Consultorio;
  index: number;
  onVerHistorial: (consultorio: Consultorio) => void;
  onEdit: (consultorio: Consultorio) => void;
  onDelete: (id: string) => void;
  onCambiarEstado: (id: string, estado: Consultorio['estado']) => void;
}

export const ConsultorioCard = ({
  consultorio,
  index,
  onVerHistorial,
  onEdit,
  onDelete,
  onCambiarEstado
}: ConsultorioCardProps) => {
  const EstadoIcon = getEstadoIcon(consultorio.estado);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header con color */}
      <div
        className="h-2"
        style={{ backgroundColor: consultorio.color }}
      />

      <div className="p-6">
        {/* Título */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {consultorio.nombre}
            </h3>
            <p className="text-sm text-gray-500">
              Nº {consultorio.numero} {consultorio.piso && `• Piso ${consultorio.piso}`}
            </p>
          </div>
          <EstadoIcon className="h-5 w-5 text-current" />
        </div>

        {/* Estado */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${getEstadoBadgeClass(consultorio.estado)}`}>
          {consultorio.estado.charAt(0).toUpperCase() + consultorio.estado.slice(1)}
        </span>

        {/* Información */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>Capacidad: {consultorio.capacidad} persona(s)</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{consultorio.horaApertura} - {consultorio.horaCierre}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onVerHistorial(consultorio)}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BarChart3 className="h-4 w-4 inline mr-1" />
            Historial
          </button>
          <button
            onClick={() => onEdit(consultorio)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(consultorio.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Cambiar estado rápido */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Cambiar estado:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => onCambiarEstado(consultorio.id, 'disponible')}
              className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
              disabled={consultorio.estado === 'disponible'}
            >
              Disponible
            </button>
            <button
              onClick={() => onCambiarEstado(consultorio.id, 'ocupado')}
              className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              disabled={consultorio.estado === 'ocupado'}
            >
              Ocupado
            </button>
            <button
              onClick={() => onCambiarEstado(consultorio.id, 'mantenimiento')}
              className="flex-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
              disabled={consultorio.estado === 'mantenimiento'}
            >
              Mant.
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
