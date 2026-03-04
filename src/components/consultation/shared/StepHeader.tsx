/**
 * StepHeader - Componente reutilizable para headers de steps de consulta
 *
 * Muestra un header consistente con:
 * - Ícono con color de fondo personalizable
 * - Título principal
 * - Descripción/subtítulo
 *
 * ELIMINA: ~15-20 líneas de código duplicado por step
 */

import { LucideIcon } from 'lucide-react';

/**
 * Colores predefinidos para los iconos
 * Cada step usa un color diferente para diferenciación visual
 */
const colorVariants = {
  // Step 0: Selección Paciente
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600'
  },
  // Step 1: Examen Clínico
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600'
  },
  // Step 2: Odontograma
  indigo: {
    bg: 'bg-indigo-100',
    icon: 'text-indigo-600'
  },
  // Step 3: Diagnóstico Presuntivo
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600'
  },
  // Step 4: Plan Diagnóstico
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600'
  },
  // Step 5: Resultados Auxiliares
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600'
  },
  // Step 6: Diagnóstico Definitivo
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600'
  },
  // Step 7: Plan de Tratamiento
  violet: {
    bg: 'bg-violet-100',
    icon: 'text-violet-600'
  },
  // Step 8: Presupuesto
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600'
  },
  // Step 9: Tratamiento Realizado
  cyan: {
    bg: 'bg-cyan-100',
    icon: 'text-cyan-600'
  }
} as const;

type ColorVariant = keyof typeof colorVariants;

interface StepHeaderProps {
  /** Ícono de lucide-react a mostrar */
  icon: LucideIcon;

  /** Título principal del step */
  title: string;

  /** Descripción o subtítulo del step */
  description: string;

  /** Color del ícono (debe coincidir con colorVariants) */
  color?: ColorVariant;

  /** Clase CSS adicional para el contenedor */
  className?: string;
}

/**
 * Componente de header para steps de consulta
 *
 * @example
 * ```tsx
 * <StepHeader
 *   icon={Grid3x3}
 *   title="Odontograma"
 *   description="Registro dental interactivo del paciente"
 *   color="indigo"
 * />
 * ```
 */
export const StepHeader = ({
  icon: Icon,
  title,
  description,
  color = 'indigo',
  className = ''
}: StepHeaderProps) => {
  const colors = colorVariants[color];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};
