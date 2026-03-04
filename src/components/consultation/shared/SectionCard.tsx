/**
 * SectionCard - Componente compartido para secciones con gradiente
 *
 * Componente reutilizable que aparece en múltiples steps de la consulta.
 * Proporciona un contenedor con gradiente, icono, título y subtítulo consistente.
 */

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface SectionCardProps {
  /** Icono de lucide-react */
  icon: LucideIcon;

  /** Título de la sección */
  title: string;

  /** Subtítulo opcional */
  subtitle?: string;

  /** Esquema de color: define el color del gradiente, icono y border */
  colorScheme: 'blue' | 'green' | 'teal' | 'orange' | 'purple' | 'amber' | 'indigo' | 'cyan' | 'emerald' | 'pink' | 'rose';

  /** Color secundario opcional para el gradiente (ej: 'cyan' para 'from-teal-50 to-cyan-50') */
  gradientTo?: 'blue' | 'green' | 'teal' | 'orange' | 'purple' | 'amber' | 'indigo' | 'cyan' | 'emerald' | 'pink' | 'rose';

  /** Contenido de la sección */
  children: ReactNode;

  /** Clases adicionales para el contenedor */
  className?: string;

  /** Delay de la animación en segundos */
  animationDelay?: number;
}

/**
 * Mapeo de colores a clases de Tailwind
 */
const colorMap = {
  blue: {
    gradient: 'from-blue-50',
    gradientTo: 'to-blue-50',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    gradient: 'from-green-50',
    gradientTo: 'to-green-50',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    border: 'border-green-200',
  },
  teal: {
    gradient: 'from-teal-50',
    gradientTo: 'to-teal-50',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-600',
    border: 'border-teal-200',
  },
  orange: {
    gradient: 'from-orange-50',
    gradientTo: 'to-orange-50',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    border: 'border-orange-200',
  },
  purple: {
    gradient: 'from-purple-50',
    gradientTo: 'to-purple-50',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    border: 'border-purple-200',
  },
  amber: {
    gradient: 'from-amber-50',
    gradientTo: 'to-amber-50',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    border: 'border-amber-200',
  },
  indigo: {
    gradient: 'from-indigo-50',
    gradientTo: 'to-indigo-50',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    border: 'border-indigo-200',
  },
  cyan: {
    gradient: 'from-cyan-50',
    gradientTo: 'to-cyan-50',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-600',
    border: 'border-cyan-200',
  },
  emerald: {
    gradient: 'from-emerald-50',
    gradientTo: 'to-emerald-50',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  pink: {
    gradient: 'from-pink-50',
    gradientTo: 'to-pink-50',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-600',
    border: 'border-pink-200',
  },
  rose: {
    gradient: 'from-rose-50',
    gradientTo: 'to-rose-50',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
    border: 'border-rose-200',
  },
};

export const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  colorScheme,
  gradientTo,
  children,
  className = '',
  animationDelay = 0,
}: SectionCardProps) => {
  const colors = colorMap[colorScheme];
  const gradientToColor = gradientTo ? colorMap[gradientTo].gradientTo : colors.gradientTo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className={`bg-gradient-to-r ${colors.gradient} ${gradientToColor} p-6 rounded-xl border ${colors.border} ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.iconText}`} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">{title}</h4>
          {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
};
