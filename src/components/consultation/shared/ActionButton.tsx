/**
 * ActionButton - Componente compartido para botones de acción
 *
 * Botones animados con iconos para acciones comunes:
 * - Ver (Eye)
 * - Descargar (Download)
 * - Eliminar (X/Trash)
 * - Editar (Edit)
 */

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  /** Icono de lucide-react */
  icon: LucideIcon;

  /** Variante del botón que define el color */
  variant: 'view' | 'download' | 'delete' | 'edit' | 'primary' | 'secondary';

  /** Función onClick */
  onClick: () => void;

  /** Aria label para accesibilidad */
  ariaLabel: string;

  /** Esquema de color personalizado (sobrescribe el variant) */
  colorScheme?: 'blue' | 'green' | 'teal' | 'orange' | 'purple' | 'red' | 'gray';

  /** Clases adicionales */
  className?: string;

  /** Deshabilitar el botón */
  disabled?: boolean;
}

/**
 * Mapeo de variantes a colores
 */
const variantMap = {
  view: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200',
  },
  download: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-200',
  },
  delete: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hover: 'hover:bg-red-200',
  },
  edit: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-200',
  },
  primary: {
    bg: 'bg-blue-500',
    text: 'text-white',
    hover: 'hover:bg-blue-600',
  },
  secondary: {
    bg: 'bg-gray-200',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-300',
  },
};

/**
 * Mapeo de colores personalizados
 */
const colorSchemeMap = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    hover: 'hover:bg-green-200',
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    hover: 'hover:bg-teal-200',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-200',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hover: 'hover:bg-red-200',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-200',
  },
};

export const ActionButton = ({
  icon: Icon,
  variant,
  onClick,
  ariaLabel,
  colorScheme,
  className = '',
  disabled = false,
}: ActionButtonProps) => {
  // Usar colorScheme si está definido, sino usar variant
  const colors = colorScheme ? colorSchemeMap[colorScheme] : variantMap[variant];

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`p-2 ${colors.bg} ${colors.text} rounded-lg ${colors.hover} transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
};
