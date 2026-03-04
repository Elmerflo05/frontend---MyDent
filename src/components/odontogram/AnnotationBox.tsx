/**
 * COMPONENTE DE ANOTACIONES - COLEGIO ODONTOLÓGICO DEL PERÚ
 * Recuadros para abreviaturas oficiales
 */

import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';

interface AnnotationBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: ColorType;
  onClick?: () => void;
  editable?: boolean;
}

export const AnnotationBox = ({
  x,
  y,
  width,
  height,
  text,
  color = 'blue',
  onClick,
  editable = true
}: AnnotationBoxProps) => {
  const textColor = text ? OFFICIAL_COLORS[color] : '#999';

  return (
    <g>
      {/* Recuadro */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#fff"
        stroke="#999"
        strokeWidth="1"
        rx="2"
        className={editable ? 'cursor-pointer hover:fill-gray-50 transition-colors' : ''}
        onClick={onClick}
      />

      {/* Texto de abreviatura */}
      {text && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[9px] font-bold pointer-events-none select-none"
          fill={textColor}
        >
          {text}
        </text>
      )}
    </g>
  );
};
