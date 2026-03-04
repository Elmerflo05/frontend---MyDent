/**
 * EmptyState - Componente compartido para estados vacíos
 *
 * Muestra un icono y mensaje cuando no hay datos disponibles.
 * Usado en listas vacías, resultados pendientes, etc.
 */

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Icono de lucide-react */
  icon: LucideIcon;

  /** Mensaje a mostrar */
  message: string;

  /** Color del icono (opcional, por defecto gris) */
  iconColor?: string;

  /** Clases adicionales para el contenedor */
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  message,
  iconColor = 'text-gray-300',
  className = '',
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-8 text-gray-500 ${className}`}>
      <Icon className={`w-12 h-12 mx-auto mb-4 ${iconColor}`} />
      <p className="text-sm">{message}</p>
    </div>
  );
};
