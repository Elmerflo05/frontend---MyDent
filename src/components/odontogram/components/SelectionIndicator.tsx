import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useMemo } from 'react';

interface SelectionIndicatorProps {
  type: 'aparato-fijo' | 'aparato-removible' | 'transposicion' | 'protesis-fija' | 'protesis-total' | 'protesis-removible' | 'edentulo-total';
  firstTooth: string;
  onCancel: () => void;
  isVisible: boolean;
  position?: { x: number; y: number };
}

const CONFIG = {
  'aparato-fijo': {
    gradient: 'from-purple-600 to-indigo-600',
    title: 'Aparato Ortodóntico Fijo',
    message: (tooth: string) => `Seleccionó: ${tooth} - Ahora seleccione el segundo diente (misma arcada)`
  },
  'aparato-removible': {
    gradient: 'from-green-600 to-teal-600',
    title: 'Aparato Ortodóntico Removible',
    message: (tooth: string) => `Diente 1: ${tooth} - Ahora seleccione el segundo diente (misma arcada)`
  },
  'transposicion': {
    gradient: 'from-pink-600 to-rose-600',
    title: 'Transposición',
    message: (tooth: string) => `Diente 1: ${tooth} - Ahora seleccione el segundo diente que intercambia posición (misma arcada)`
  },
  'protesis-fija': {
    gradient: 'from-orange-600 to-amber-600',
    title: 'Prótesis Fija',
    message: (tooth: string) => `Pilar 1: ${tooth} - Ahora seleccione el segundo pilar (misma arcada)`
  },
  'protesis-total': {
    gradient: 'from-cyan-600 to-blue-600',
    title: 'Prótesis Total',
    message: (tooth: string) => `Extremo 1: ${tooth} - Ahora seleccione el segundo extremo (misma arcada)`
  },
  'protesis-removible': {
    gradient: 'from-purple-600 to-violet-600',
    title: 'Prótesis Removible - Selección de Rango',
    message: (tooth: string) => `Inicio del rango: ${tooth} - Ahora seleccione el último diente del rango (mismo cuadrante)`
  },
  'edentulo-total': {
    gradient: 'from-blue-600 to-cyan-600',
    title: 'Edéntulo Total - Selección de Rango',
    message: (tooth: string) => `Inicio del rango: ${tooth} - Ahora seleccione el último diente del rango (mismo cuadrante)`
  }
};

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  type,
  firstTooth,
  onCancel,
  isVisible,
  position
}) => {
  if (!isVisible) return null;

  const config = CONFIG[type];

  // Calcular posición fija cerca del diente clickeado
  const fixedStyle = useMemo(() => {
    if (!position) return undefined;

    const indicatorWidth = 420;
    const indicatorHeight = 60;
    const gap = 15;
    const padding = 10;

    // Posicionar justo encima del click
    let x = position.x - indicatorWidth / 2;
    let y = position.y - indicatorHeight - gap;

    // Ajustar si se sale del viewport horizontalmente
    if (x + indicatorWidth > window.innerWidth - padding) {
      x = window.innerWidth - indicatorWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Si no cabe arriba, ponerlo abajo
    if (y < padding) {
      y = position.y + gap;
    }

    // Ajustar si se sale del viewport verticalmente
    if (y + indicatorHeight > window.innerHeight - padding) {
      y = window.innerHeight - indicatorHeight - padding;
    }

    return {
      position: 'fixed' as const,
      left: x,
      top: y,
      zIndex: 9999,
      maxWidth: indicatorWidth,
    };
  }, [position]);

  const indicator = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={position ? '' : 'absolute top-4 left-1/2 transform -translate-x-1/2 z-50'}
      style={fixedStyle}
    >
      <div className={`bg-gradient-to-r ${config.gradient} text-white px-6 py-3 rounded-lg shadow-lg border-2 border-white flex items-center gap-3`}>
        <div className="animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div>
          <p className="text-sm font-bold">{config.title}</p>
          <p className="text-xs opacity-90">
            {config.message(firstTooth)}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>
    </motion.div>
  );

  // Si tiene posición, renderizar via portal para evitar problemas con transform del contenedor
  if (position) {
    return createPortal(indicator, document.body);
  }

  return indicator;
};
