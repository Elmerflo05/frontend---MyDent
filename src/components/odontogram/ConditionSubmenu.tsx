/**
 * Submenu para condiciones que requieren selección adicional
 * Usado para:
 * - Fractura (Corona/Raíz/Ambos)
 * - Estado de restauración (Buen estado/Mal estado)
 * - Supernumerario (Izquierda/Derecha)
 * - Diastema (Izquierda/Derecha)
 * - Giroversión (Horario/Antihorario)
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle } from 'lucide-react';

export type SubmenuType = 'fracture-location' | 'restoration-state' | 'supernumerary-position' | 'diastema-position' | 'giroversion-direction' | 'fusion-position' | 'tratamiento-pulpar-type' | 'migracion-direction';

export interface SubmenuOption {
  value: string;
  label: string;
  color?: string;
  icon?: 'check' | 'x';
}

interface ConditionSubmenuProps {
  x: number;
  y: number;
  type: SubmenuType;
  toothNumber: string;
  clickPosition?: { x: number; y: number }; // Posición del click dentro del diente
  onSelect: (value: string) => void;
  onClose: () => void;
  portalContainer?: HTMLElement | null; // Contenedor para portal (fullscreen support)
  isFullscreen?: boolean; // Estado de fullscreen para evitar cerrar accidentalmente
}

const SUBMENU_OPTIONS: Record<SubmenuType, SubmenuOption[]> = {
  'fracture-location': [
    { value: 'corona', label: 'Corona', color: 'bg-red-500' },
    { value: 'raiz', label: 'Raíz', color: 'bg-red-500' },
    { value: 'ambos', label: 'Ambos', color: 'bg-red-500' }
  ],
  'restoration-state': [
    { value: 'good', label: 'Buen Estado', color: 'bg-blue-500', icon: 'check' },
    { value: 'bad', label: 'Mal Estado', color: 'bg-red-500', icon: 'x' }
  ],
  'supernumerary-position': [
    { value: 'left', label: 'Izquierda', color: 'bg-blue-500' },
    { value: 'right', label: 'Derecha', color: 'bg-blue-500' }
  ],
  'diastema-position': [
    { value: 'left', label: 'Izquierda', color: 'bg-blue-500' },
    { value: 'right', label: 'Derecha', color: 'bg-blue-500' }
  ],
  'giroversion-direction': [
    { value: 'clockwise', label: 'Horario ↻', color: 'bg-blue-500' },
    { value: 'counterclockwise', label: 'Antihorario ↺', color: 'bg-blue-500' }
  ],
  'fusion-position': [
    { value: 'left', label: 'Izquierda', color: 'bg-purple-500' },
    { value: 'right', label: 'Derecha', color: 'bg-purple-500' }
  ],
  'tratamiento-pulpar-type': [
    { value: 'TC', label: 'TC - Tratamiento de Conductos', color: 'bg-blue-500' },
    { value: 'PC', label: 'PC - Pulpectomía', color: 'bg-blue-500' },
    { value: 'PP', label: 'PP - Pulpotomía', color: 'bg-green-500' }
  ],
  'migracion-direction': [
    { value: 'mesial', label: 'Mesial (hacia el centro) →', color: 'bg-blue-500' },
    { value: 'distal', label: 'Distal (alejándose del centro) ←', color: 'bg-blue-500' }
  ]
};

export const ConditionSubmenu = ({
  x,
  y,
  type,
  toothNumber,
  onSelect,
  onClose,
  portalContainer,
  isFullscreen = false
}: ConditionSubmenuProps) => {
  const options = SUBMENU_OPTIONS[type];

  // Títulos según tipo de submenu
  const titles: Record<SubmenuType, string> = {
    'fracture-location': 'Ubicación de Fractura',
    'restoration-state': 'Estado de Restauración',
    'supernumerary-position': 'Posición del Supernumerario',
    'diastema-position': 'Posición del Diastema',
    'giroversion-direction': 'Dirección de Giroversión',
    'fusion-position': 'Fusión con Diente',
    'tratamiento-pulpar-type': 'Tipo de Tratamiento Pulpar',
    'migracion-direction': 'Dirección de Migración'
  };

  // ALTURA DINÁMICA: adaptarse al espacio disponible
  const menuWidth = 280;

  const spaceBelow = window.innerHeight - y - 20;
  const maxHeight = 300;
  const minHeight = 150;

  const menuHeight = Math.max(minHeight, Math.min(maxHeight, spaceBelow));

  // POSICIONAMIENTO: Usar la posición recibida directamente
  let adjustedX = x;
  let adjustedY = y;

  // Ajuste horizontal
  if (adjustedX + menuWidth > window.innerWidth - 20) {
    adjustedX = window.innerWidth - menuWidth - 20;
  }
  if (adjustedX < 20) adjustedX = 20;

  // El Y queda pegado al diente
  if (adjustedY < 20) adjustedY = 20;

  // En fullscreen: usar portalContainer (necesario para que aparezca dentro del fullscreen)
  // En modo normal: usar document.body (para que position:fixed funcione correctamente)
  const portalTarget = isFullscreen && portalContainer ? portalContainer : document.body;

  // Renderizar usando Portal directamente en el body para evitar conflictos de posicionamiento
  return createPortal(
    <AnimatePresence>
      {/* Overlay para cerrar al hacer click fuera - NUNCA en fullscreen para evitar salir del modo */}
      {!isFullscreen && (
        <div
          key="submenu-overlay"
          className="fixed inset-0 z-[9998]"
          onClick={onClose}
        />
      )}
      <motion.div
        key="submenu-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="fixed bg-white rounded-xl shadow-2xl border-2 border-purple-500 overflow-hidden z-[9999]"
        style={{
          left: adjustedX,
          top: adjustedY,
          minWidth: '220px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold text-sm">{titles[type]}</h4>
            <p className="text-purple-100 text-xs">Diente {toothNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-purple-700 flex items-center gap-2"
            >
              {option.icon === 'check' && <CheckCircle className="w-5 h-5 text-blue-600" />}
              {option.icon === 'x' && <XCircle className="w-5 h-5 text-red-600" />}
              {!option.icon && <div className={`w-2 h-2 rounded-full ${option.color || 'bg-gray-500'}`} />}
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    portalTarget
  );
};
