/**
 * SÍMBOLOS DENTALES OFICIALES - COLEGIO ODONTOLÓGICO DEL PERÚ
 * Componentes SVG para representar condiciones según normas oficiales
 */

import { SymbolType, ColorType, OFFICIAL_COLORS } from '@/constants/dentalConditions';

interface SymbolProps {
  x: number;
  y: number;
  color: ColorType;
  size?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
}

/**
 * Aspa (X) - Para diente ausente
 */
export const AspaSymbol = ({ x, y, color, size = 40 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line
        x1={-size / 2}
        y1={-size / 2}
        x2={size / 2}
        y2={size / 2}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={size / 2}
        y1={-size / 2}
        x2={-size / 2}
        y2={size / 2}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * Círculo - Para coronas
 */
export const CircleSymbol = ({ x, y, color, size = 50 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  return (
    <circle
      cx={x}
      cy={y}
      r={size / 2}
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.5"
    />
  );
};

/**
 * Línea recta - Para fracturas, tratamientos pulpares, prótesis
 */
export const LineSymbol = ({ x, y, color, size = 40, direction = 'down' }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];

  const getLineCoords = () => {
    switch (direction) {
      case 'up':
        return { x1: x, y1: y, x2: x, y2: y - size };
      case 'down':
        return { x1: x, y1: y, x2: x, y2: y + size };
      case 'left':
        return { x1: x, y1: y, x2: x - size, y2: y };
      case 'right':
        return { x1: x, y1: y, x2: x + size, y2: y };
      default:
        return { x1: x, y1: y, x2: x, y2: y + size };
    }
  };

  const coords = getLineCoords();

  return (
    <line
      {...coords}
      stroke={strokeColor}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  );
};

/**
 * Flecha - Para movimientos dentales (extrusión, intrusión, migración)
 */
export const ArrowSymbol = ({ x, y, color, size = 40, direction = 'down' }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];

  const getArrowPath = () => {
    const arrowSize = size / 4;
    switch (direction) {
      case 'up':
        return {
          line: `M ${x} ${y} L ${x} ${y - size}`,
          head: `M ${x - arrowSize} ${y - size + arrowSize} L ${x} ${y - size} L ${x + arrowSize} ${y - size + arrowSize}`
        };
      case 'down':
        return {
          line: `M ${x} ${y} L ${x} ${y + size}`,
          head: `M ${x - arrowSize} ${y + size - arrowSize} L ${x} ${y + size} L ${x + arrowSize} ${y + size - arrowSize}`
        };
      case 'left':
        return {
          line: `M ${x} ${y} L ${x - size} ${y}`,
          head: `M ${x - size + arrowSize} ${y - arrowSize} L ${x - size} ${y} L ${x - size + arrowSize} ${y + arrowSize}`
        };
      case 'right':
        return {
          line: `M ${x} ${y} L ${x + size} ${y}`,
          head: `M ${x + size - arrowSize} ${y - arrowSize} L ${x + size} ${y} L ${x + size - arrowSize} ${y + arrowSize}`
        };
      default:
        return {
          line: `M ${x} ${y} L ${x} ${y + size}`,
          head: `M ${x - arrowSize} ${y + size - arrowSize} L ${x} ${y + size} L ${x + arrowSize} ${y + size - arrowSize}`
        };
    }
  };

  const { line, head } = getArrowPath();

  return (
    <g>
      <path d={line} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d={head} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  );
};

/**
 * Flecha curva - Para giroversión, transposición
 * BASADO EN IMAGEN OFICIAL: csa.png
 * Flecha curva gruesa con punta triangular apuntando hacia arriba
 */
export const CurveArrowSymbol = ({ x, y, color, size = 40, direction = 'clockwise' }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const radius = size * 0.7; // Radio más amplio para curva más visible
  const arrowHeadSize = 12; // Punta grande y clara como en csa.png

  // Arco curvo semicircular (180 grados) - INVERTIDO: curva va por ARRIBA
  // Dirección horaria: curva de izquierda a derecha POR ARRIBA con flecha arriba-derecha
  // Dirección antihoraria: curva de derecha a izquierda POR ARRIBA con flecha arriba-izquierda
  const arcPath = direction === 'clockwise'
    ? `M ${x - radius} ${y} A ${radius} ${radius} 0 0 0 ${x + radius} ${y}`
    : `M ${x + radius} ${y} A ${radius} ${radius} 0 0 1 ${x - radius} ${y}`;

  // Punta de flecha triangular RELLENA apuntando HACIA ARRIBA
  // Basado en aa.png - Flecha más puntiaguda y clara
  let arrowHeadPath: string;

  if (direction === 'clockwise') {
    // Flecha en el extremo derecho apuntando hacia ARRIBA ⬆️
    const arrowX = x + radius;
    const arrowY = y;
    arrowHeadPath = `
      M ${arrowX} ${arrowY - arrowHeadSize}
      L ${arrowX - arrowHeadSize * 0.6} ${arrowY + arrowHeadSize * 0.3}
      L ${arrowX} ${arrowY}
      L ${arrowX + arrowHeadSize * 0.6} ${arrowY + arrowHeadSize * 0.3}
      Z
    `;
  } else {
    // Flecha en el extremo izquierdo apuntando hacia ARRIBA ⬆️
    const arrowX = x - radius;
    const arrowY = y;
    arrowHeadPath = `
      M ${arrowX} ${arrowY - arrowHeadSize}
      L ${arrowX - arrowHeadSize * 0.6} ${arrowY + arrowHeadSize * 0.3}
      L ${arrowX} ${arrowY}
      L ${arrowX + arrowHeadSize * 0.6} ${arrowY + arrowHeadSize * 0.3}
      Z
    `;
  }

  return (
    <g>
      {/* Arco curvo GRUESO como en csa.png */}
      <path
        d={arcPath}
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Punta de flecha triangular RELLENA y GRANDE */}
      <path
        d={arrowHeadPath}
        fill={strokeColor}
        stroke="none"
      />
    </g>
  );
};

/**
 * Flecha en zigzag ⚡ - Para pieza dentaria en erupción
 * Según normativa oficial COP: flecha en forma de rayo dirigida hacia plano oclusal
 */
export const ArrowZigzagSymbol = ({ x, y, color, size = 40, direction = 'down' }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];

  // Crear forma de rayo ⚡ (flecha zigzag)
  const getZigzagArrowPath = () => {
    const height = size;
    const width = size * 0.4;

    if (direction === 'down') {
      // Flecha hacia abajo (para dientes superiores)
      return `
        M ${x} ${y}
        L ${x + width * 0.3} ${y + height * 0.35}
        L ${x - width * 0.2} ${y + height * 0.4}
        L ${x + width * 0.4} ${y + height * 0.7}
        L ${x - width * 0.1} ${y + height * 0.75}
        L ${x + width * 0.2} ${y + height}
        L ${x} ${y + height * 0.8}
        L ${x - width * 0.3} ${y + height * 0.6}
        L ${x + width * 0.1} ${y + height * 0.55}
        L ${x - width * 0.4} ${y + height * 0.3}
        L ${x} ${y}
      `;
    } else {
      // Flecha hacia arriba (para dientes inferiores)
      return `
        M ${x} ${y}
        L ${x + width * 0.3} ${y - height * 0.35}
        L ${x - width * 0.2} ${y - height * 0.4}
        L ${x + width * 0.4} ${y - height * 0.7}
        L ${x - width * 0.1} ${y - height * 0.75}
        L ${x + width * 0.2} ${y - height}
        L ${x} ${y - height * 0.8}
        L ${x - width * 0.3} ${y - height * 0.6}
        L ${x + width * 0.1} ${y - height * 0.55}
        L ${x - width * 0.4} ${y - height * 0.3}
        L ${x} ${y}
      `;
    }
  };

  return (
    <path
      d={getZigzagArrowPath()}
      stroke={strokeColor}
      strokeWidth="2"
      fill={strokeColor}
      fillOpacity="0.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/**
 * Doble línea - Para prótesis removible/total
 */
export const DoubleLineSymbol = ({ x, y, color, size = 60, direction = 'right' }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const spacing = 4;

  const getDoubleLineCoords = () => {
    if (direction === 'right') {
      return {
        line1: { x1: x, y1: y - spacing, x2: x + size, y2: y - spacing },
        line2: { x1: x, y1: y + spacing, x2: x + size, y2: y + spacing }
      };
    } else {
      return {
        line1: { x1: x - spacing, y1: y, x2: x - spacing, y2: y + size },
        line2: { x1: x + spacing, y1: y, x2: x + spacing, y2: y + size }
      };
    }
  };

  const { line1, line2 } = getDoubleLineCoords();

  return (
    <g>
      <line {...line1} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line {...line2} stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
};

/**
 * Línea zigzag - Para aparato ortodóncico removible
 */
export const ZigzagSymbol = ({ x, y, color, size = 60 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const segments = 6;
  const segmentWidth = size / segments;
  const height = 8;

  let path = `M ${x} ${y}`;
  for (let i = 0; i < segments; i++) {
    const xPos = x + (i + 1) * segmentWidth;
    const yPos = i % 2 === 0 ? y - height : y + height;
    path += ` L ${xPos} ${yPos}`;
  }

  return (
    <path
      d={path}
      stroke={strokeColor}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/**
 * Paréntesis invertido - Para diastema
 * Según normativa oficial COP: ) ( entre las piezas dentarias
 * "Invertido" significa que se abren hacia AFUERA, no hacia adentro
 */
export const ParenthesisSymbol = ({ x, y, color, size = 20 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const height = size * 1.5; // Altura del paréntesis
  const curveDepth = size * 0.6; // Curvatura hacia afuera

  return (
    <g>
      {/* Paréntesis izquierdo ) abriendo hacia la DERECHA (invertido) */}
      <path
        d={`M ${x - size / 2} ${y - height / 2} Q ${x - size / 2 + curveDepth} ${y} ${x - size / 2} ${y + height / 2}`}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Paréntesis derecho ( abriendo hacia la IZQUIERDA (invertido) */}
      <path
        d={`M ${x + size / 2} ${y - height / 2} Q ${x + size / 2 - curveDepth} ${y} ${x + size / 2} ${y + height / 2}`}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * Triángulo - Para diente en clavija
 */
export const TriangleSymbol = ({ x, y, color, size = 30 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const height = size * 0.866; // altura de triángulo equilátero

  return (
    <path
      d={`M ${x} ${y - height / 2} L ${x + size / 2} ${y + height / 2} L ${x - size / 2} ${y + height / 2} Z`}
      stroke={strokeColor}
      strokeWidth="2"
      fill="none"
    />
  );
};

/**
 * Cuadrado - Para coronas (definitivas y temporales)
 */
export const SquareSymbol = ({ x, y, color, size = 50 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];

  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      stroke={strokeColor}
      strokeWidth="2.5"
      fill="none"
    />
  );
};

/**
 * Cuadrado con cruz - Para aparato ortodóncico fijo
 */
export const CrossSquareSymbol = ({ x, y, color, size = 16 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cuadrado */}
      <rect
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
      />
      {/* Cruz */}
      <line
        x1={-size / 2}
        y1={-size / 2}
        x2={size / 2}
        y2={size / 2}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <line
        x1={size / 2}
        y1={-size / 2}
        x2={-size / 2}
        y2={size / 2}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    </g>
  );
};

/**
 * Doble círculo interceptado - Para geminación/fusión
 */
export const DoubleCircleSymbol = ({ x, y, color, size = 40 }: SymbolProps) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const radius = size / 3;
  const offset = size / 4;

  return (
    <g>
      <circle
        cx={x - offset}
        cy={y}
        r={radius}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx={x + offset}
        cy={y}
        r={radius}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
};

/**
 * Componente principal de renderizado de símbolos
 */
interface DentalSymbolProps {
  symbolType: SymbolType;
  x: number;
  y: number;
  color: ColorType;
  size?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
}

export const DentalSymbol = ({ symbolType, x, y, color, size, direction }: DentalSymbolProps) => {
  switch (symbolType) {
    case 'aspa':
      return <AspaSymbol x={x} y={y} color={color} size={size} />;
    case 'circle':
      return <CircleSymbol x={x} y={y} color={color} size={size} />;
    case 'square':
      return <SquareSymbol x={x} y={y} color={color} size={size} />;
    case 'line':
      return <LineSymbol x={x} y={y} color={color} size={size} direction={direction} />;
    case 'arrow':
      return <ArrowSymbol x={x} y={y} color={color} size={size} direction={direction} />;
    case 'arrow-zigzag':
      return <ArrowZigzagSymbol x={x} y={y} color={color} size={size} direction={direction} />;
    case 'curve-arrow':
      return <CurveArrowSymbol x={x} y={y} color={color} size={size} direction={direction} />;
    case 'double-line':
      return <DoubleLineSymbol x={x} y={y} color={color} size={size} direction={direction} />;
    case 'zigzag':
      return <ZigzagSymbol x={x} y={y} color={color} size={size} />;
    case 'parenthesis':
      return <ParenthesisSymbol x={x} y={y} color={color} size={size} />;
    case 'triangle':
      return <TriangleSymbol x={x} y={y} color={color} size={size} />;
    case 'cross-square':
      return <CrossSquareSymbol x={x} y={y} color={color} size={size} />;
    case 'double-circle':
      return <DoubleCircleSymbol x={x} y={y} color={color} size={size} />;
    default:
      return null;
  }
};
