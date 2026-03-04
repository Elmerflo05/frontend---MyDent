import { AppliedCondition, getToothPosition } from '../ToothConditionRenderer';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';

export interface ConnectedToothConfig {
  // Configuración del símbolo en cada diente
  symbolType: 'cross-square' | 'zigzag' | 'vertical-line' | 'crossed-arrows' | 'none';
  symbolSize?: number;
  symbolYOffset?: (toothY: number, isUpper: boolean) => number;

  // Configuración de la línea de conexión
  connectionType: 'single-line' | 'double-line' | 'zigzag-line' | 'none';
  connectionYOffset?: (toothY: number, isUpper: boolean) => { y1?: number; y2?: number };

  // Configuración especial
  renderBetweenTeeth?: boolean; // Para prótesis removible (líneas entre todos los dientes del rango)
}

export const CONNECTED_TOOTH_CONFIGS: Record<string, ConnectedToothConfig> = {
  'aparato-fijo': {
    symbolType: 'cross-square',
    symbolSize: 14,
    symbolYOffset: (toothY, isUpper) => isUpper ? toothY - 60 : toothY + 100,
    connectionType: 'single-line',
    connectionYOffset: (toothY, isUpper) => ({ y1: isUpper ? toothY - 60 : toothY + 100 })
  },
  'aparato-removible': {
    symbolType: 'zigzag',
    symbolSize: 60,
    symbolYOffset: (toothY, isUpper) => isUpper ? toothY - 60 : toothY + 100,
    connectionType: 'zigzag-line',
    connectionYOffset: (toothY, isUpper) => ({ y1: isUpper ? toothY - 60 : toothY + 100 })
  },
  'protesis-fija': {
    symbolType: 'vertical-line',
    symbolYOffset: (toothY, isUpper) => isUpper ? toothY - 60 : toothY + 100,
    connectionType: 'single-line',
    connectionYOffset: (toothY, isUpper) => ({ y1: isUpper ? toothY - 75 : toothY + 115 })
  },
  'protesis-total': {
    symbolType: 'none',
    connectionType: 'single-line',
    connectionYOffset: (toothY, isUpper) => ({ y1: isUpper ? toothY - 75 : toothY + 115 })
  },
  'protesis-removible': {
    symbolType: 'none',
    connectionType: 'double-line',
    connectionYOffset: (toothY, isUpper) => ({
      y1: isUpper ? toothY - 65 : toothY + 105,
      y2: isUpper ? toothY - 55 : toothY + 95
    }),
    renderBetweenTeeth: true
  },
  'transposicion': {
    symbolType: 'crossed-arrows',
    symbolSize: 25,
    symbolYOffset: (toothY, isUpper) => isUpper ? toothY - 30 : toothY + 70,
    connectionType: 'none'
  }
};

export const renderConnectedTooth = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number,
  conditions: AppliedCondition[]
): JSX.Element | null => {
  const { condition, connectedToothNumber } = applied;

  if (!connectedToothNumber) return null;

  const config = CONNECTED_TOOTH_CONFIGS[condition.id];
  if (!config) return null;

  const connectedToothPos = getToothPosition(connectedToothNumber);
  if (!connectedToothPos) return null;

  // Evitar duplicación: solo renderizar desde el diente con número menor
  const shouldDraw = toothNumber < connectedToothNumber;
  if (!shouldDraw) return null;

  const strokeColor = OFFICIAL_COLORS[color];

  return (
    <g key={`${toothNumber}-${condition.id}-${index}`}>
      {/* Símbolo en diente actual */}
      {config.symbolType !== 'none' && config.symbolYOffset && (
        renderSymbol(
          config.symbolType,
          toothX,
          config.symbolYOffset(toothY, isUpper),
          strokeColor,
          config.symbolSize
        )
      )}

      {/* Símbolo en diente conectado */}
      {config.symbolType !== 'none' && config.symbolYOffset && (
        renderSymbol(
          config.symbolType,
          connectedToothPos.x,
          config.symbolYOffset(connectedToothPos.y, connectedToothPos.isUpper),
          strokeColor,
          config.symbolSize
        )
      )}

      {/* Línea de conexión */}
      {config.connectionType !== 'none' && config.connectionYOffset && (
        renderConnection(
          config.connectionType,
          toothX,
          connectedToothPos.x,
          toothY,
          connectedToothPos.y,
          isUpper,
          connectedToothPos.isUpper,
          strokeColor,
          config.connectionYOffset,
          config.renderBetweenTeeth ? conditions : undefined,
          toothNumber,
          connectedToothNumber
        )
      )}
    </g>
  );
};

// Helper: Renderizar símbolo
const renderSymbol = (
  symbolType: 'cross-square' | 'zigzag' | 'vertical-line' | 'crossed-arrows',
  x: number,
  y: number,
  color: string,
  size?: number
): JSX.Element => {
  switch (symbolType) {
    case 'cross-square':
      return (
        <g>
          <rect
            x={x - (size || 14) / 2}
            y={y - (size || 14) / 2}
            width={size || 14}
            height={size || 14}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
          />
          <line
            x1={x - (size || 14) / 2}
            y1={y - (size || 14) / 2}
            x2={x + (size || 14) / 2}
            y2={y + (size || 14) / 2}
            stroke={color}
            strokeWidth="2.5"
          />
          <line
            x1={x + (size || 14) / 2}
            y1={y - (size || 14) / 2}
            x2={x - (size || 14) / 2}
            y2={y + (size || 14) / 2}
            stroke={color}
            strokeWidth="2.5"
          />
        </g>
      );

    case 'zigzag':
      const zigzagSize = size || 60;
      return (
        <path
          d={`M ${x - zigzagSize / 2} ${y} L ${x - zigzagSize / 4} ${y - 8} L ${x} ${y} L ${x + zigzagSize / 4} ${y - 8} L ${x + zigzagSize / 2} ${y}`}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'vertical-line':
      return (
        <line
          x1={x}
          y1={y - 15}
          x2={x}
          y2={y + 15}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );

    case 'crossed-arrows':
      const arrowSize = size || 25;
      return (
        <g>
          {/* Flecha 1: ↗ */}
          <path
            d={`M ${x - arrowSize / 2} ${y + arrowSize / 2} L ${x + arrowSize / 2} ${y - arrowSize / 2}`}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${x + arrowSize / 2 - 6} ${y - arrowSize / 2} L ${x + arrowSize / 2} ${y - arrowSize / 2} L ${x + arrowSize / 2} ${y - arrowSize / 2 + 6}`}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Flecha 2: ↙ */}
          <path
            d={`M ${x + arrowSize / 2} ${y + arrowSize / 2} L ${x - arrowSize / 2} ${y - arrowSize / 2}`}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={`M ${x - arrowSize / 2 + 6} ${y - arrowSize / 2} L ${x - arrowSize / 2} ${y - arrowSize / 2} L ${x - arrowSize / 2} ${y - arrowSize / 2 + 6}`}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );

    default:
      return <></>;
  }
};

// Helper: Renderizar conexión
const renderConnection = (
  connectionType: 'single-line' | 'double-line' | 'zigzag-line',
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  isUpper1: boolean,
  isUpper2: boolean,
  color: string,
  yOffsetFn: (toothY: number, isUpper: boolean) => { y1?: number; y2?: number },
  conditions?: AppliedCondition[],
  fromTooth?: string,
  toTooth?: string
): JSX.Element => {
  const offset1 = yOffsetFn(y1, isUpper1);
  const offset2 = yOffsetFn(y2, isUpper2);

  const lineY1 = offset1.y1 || y1;
  const lineY2 = offset2.y1 || y2;

  switch (connectionType) {
    case 'single-line':
      return (
        <line
          x1={x1}
          y1={lineY1}
          x2={x2}
          y2={lineY2}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );

    case 'double-line':
      const line2Y1 = offset1.y2 || y1;
      const line2Y2 = offset2.y2 || y2;
      return (
        <>
          <line
            x1={x1}
            y1={lineY1}
            x2={x2}
            y2={lineY2}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={x1}
            y1={line2Y1}
            x2={x2}
            y2={line2Y2}
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      );

    case 'zigzag-line':
      // Calcular número de dientes basado en distancia
      const distance = Math.abs(x2 - x1);
      const numTeeth = Math.round(distance / 70) + 1;
      const numCompletePeaks = Math.max(1, numTeeth - 1);
      const numZigs = numCompletePeaks * 2;
      const zigWidth = distance / numZigs;
      const zigHeight = 20;
      const isLeftToRight = x2 > x1;

      let path = `M ${x1} ${lineY1}`;
      const firstVerticalOffset = zigWidth * 0.15;
      const firstVerticalX = x1 + (isLeftToRight ? 1 : -1) * firstVerticalOffset;
      path += ` L ${firstVerticalX} ${lineY1 - zigHeight}`;

      for (let i = 2; i <= numZigs; i++) {
        const xPos = x1 + (isLeftToRight ? 1 : -1) * (firstVerticalOffset + (i - 1) * zigWidth);
        const yPos = i % 2 === 1 ? lineY1 - zigHeight : lineY1 + zigHeight;
        path += ` L ${xPos} ${yPos}`;
      }

      // Línea final al punto de destino
      path += ` L ${x2} ${lineY2}`;

      return (
        <path
          d={path}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    default:
      return <></>;
  }
};
