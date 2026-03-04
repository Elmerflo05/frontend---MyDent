/**
 * ResultCard - Componente compartido para tarjetas de resultados/exámenes
 *
 * Usado para mostrar:
 * - Resultados de laboratorio
 * - Resultados externos
 * - Exámenes seleccionados
 * - Cualquier item con acciones (ver, descargar, eliminar)
 */

import { motion } from 'framer-motion';
import { Image, FileText, Calendar, LucideIcon, Eye, Download, Edit, X } from 'lucide-react';
import { ReactNode } from 'react';
import { ActionButton } from './ActionButton';

interface ResultCardProps {
  /** ID único del resultado */
  id: string;

  /** Nombre del resultado/examen */
  name: string;

  /** Tipo de archivo/examen */
  type: string;

  /** Fecha (opcional) */
  date?: string;

  /** Descripción (opcional) */
  description?: string;

  /** Tipo de icono */
  iconType?: 'image' | 'file';

  /** Icono personalizado (sobrescribe iconType) */
  customIcon?: LucideIcon;

  /** Esquema de color */
  colorScheme: 'blue' | 'green' | 'teal' | 'orange' | 'purple';

  /** Acciones disponibles */
  actions?: {
    onView?: () => void;
    onDownload?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
  };

  /** Contenido adicional (ej: precio, radio buttons, etc.) */
  additionalContent?: ReactNode;

  /** Índice en la lista (para animación escalonada) */
  index?: number;

  /** Clases adicionales */
  className?: string;
}

const colorMap = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    border: 'border-blue-100',
  },
  green: {
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
    border: 'border-green-100',
  },
  teal: {
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-600',
    border: 'border-teal-100',
  },
  orange: {
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    border: 'border-orange-100',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    border: 'border-purple-100',
  },
};

export const ResultCard = ({
  id,
  name,
  type,
  date,
  description,
  iconType = 'file',
  customIcon,
  colorScheme,
  actions,
  additionalContent,
  index = 0,
  className = '',
}: ResultCardProps) => {
  const colors = colorMap[colorScheme];

  // Determinar icono a usar
  const IconComponent = customIcon || (iconType === 'image' ? Image : FileText);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white p-4 rounded-xl border ${colors.border} hover:shadow-md transition-all group ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Icono */}
          <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-6 h-6 ${colors.iconText}`} />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-gray-900">{name}</h5>

            {/* Fecha y tipo */}
            {(date || type) && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                {date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {date}
                  </span>
                )}
                {type && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {type}
                  </span>
                )}
              </div>
            )}

            {/* Descripción */}
            {description && (
              <div className="text-xs text-gray-600 mt-1">{description}</div>
            )}

            {/* Contenido adicional */}
            {additionalContent && (
              <div className="mt-2">{additionalContent}</div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions.onView && (
              <ActionButton
                icon={Eye}
                variant="view"
                onClick={actions.onView}
                ariaLabel={`Ver ${name}`}
                colorScheme={colorScheme}
              />
            )}
            {actions.onDownload && (
              <ActionButton
                icon={Download}
                variant="download"
                onClick={actions.onDownload}
                ariaLabel={`Descargar ${name}`}
              />
            )}
            {actions.onEdit && (
              <ActionButton
                icon={Edit}
                variant="edit"
                onClick={actions.onEdit}
                ariaLabel={`Editar ${name}`}
              />
            )}
            {actions.onDelete && (
              <ActionButton
                icon={X}
                variant="delete"
                onClick={actions.onDelete}
                ariaLabel={`Eliminar ${name}`}
                className="opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
