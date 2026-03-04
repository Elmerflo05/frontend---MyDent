import React from 'react';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';
import { getToothDimensions } from '@/constants/toothDimensions';
import { TOOTH_DIMENSIONS, CIRCLE_RADIUS } from '@/constants/odontogramRenderConstants';
import { AppliedCondition } from '../types';
import { getLabelYPosition } from '../utils/positionHelpers';

// Helper: Renderizar fractura con línea roja en la ubicación seleccionada
export const renderFracture = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const location = applied.fractureLocation;

  // Dimensiones del diente
  const dimensions = getToothDimensions(toothNumber);
  const width = dimensions.width;
  const crownHeight = dimensions.crownHeight;
  const rootHeight = dimensions.rootHeight;

  // Función helper para renderizar una línea de fractura
  const renderFractureLine = (key: string, baseY: number, variation: number = 0) => {
    // Variación aleatoria basada en el click position si está disponible
    const offset = applied.clickPosition ? (applied.clickPosition.x % 10) - 5 : variation;

    return (
      <line
        key={key}
        x1={toothX - width/4 + offset}
        y1={baseY - 10}
        x2={toothX + width/4 + offset}
        y2={baseY + 10}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pointer-events-none"
      />
    );
  };

  // Renderizar según ubicación
  switch (location) {
    case 'corona':
      // Línea en la corona
      return renderFractureLine(
        `${toothNumber}-fractura-corona-${index}`,
        toothY + crownHeight / 2
      );

    case 'raiz':
      // Línea en la raíz
      return renderFractureLine(
        `${toothNumber}-fractura-raiz-${index}`,
        isUpper ? toothY - rootHeight / 2 : toothY + crownHeight + rootHeight / 2
      );

    case 'ambos':
      // Línea diagonal que cruza TODO el diente (raíz + corona)
      // Desde una esquina superior de la raíz hasta la esquina inferior opuesta
      if (isUpper) {
        // Dientes superiores: raíz hacia arriba
        return (
          <line
            key={`${toothNumber}-fractura-ambos-${index}`}
            x1={toothX - width / 3}
            y1={toothY - rootHeight}  // Extremo superior de la raíz (izquierda)
            x2={toothX + width / 3}
            y2={toothY + crownHeight}  // Extremo inferior de la corona (derecha)
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
        );
      } else {
        // Dientes inferiores: raíz hacia abajo
        return (
          <line
            key={`${toothNumber}-fractura-ambos-${index}`}
            x1={toothX - width / 3}
            y1={toothY}  // Extremo superior de la corona (izquierda)
            x2={toothX + width / 3}
            y2={toothY + crownHeight + rootHeight}  // Extremo inferior de la raíz (derecha)
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
        );
      }

    default:
      return null;
  }
};

// Helper: Renderizar pieza dentaria supernumeraria (círculo con "S" entre dientes adyacentes)
export const renderSupernumerario = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const fillColor = OFFICIAL_COLORS[color];

  // Dimensiones del diente
  const crownHeight = 40;
  const rootHeight = 40;
  const toothSpacing = TOOTH_DIMENSIONS.TOOTH_SPACING; // Distancia entre dientes

  // Calcular posición X según la selección (left/right)
  // "left" = a la izquierda del diente actual
  // "right" = a la derecha del diente actual
  let circleX: number;

  if (applied.supernumeraryPosition === 'left') {
    // Posicionar círculo a la IZQUIERDA del diente
    circleX = toothX - toothSpacing / 2;
  } else {
    // Posicionar círculo a la DERECHA del diente
    circleX = toothX + toothSpacing / 2;
  }

  // Calcular posición Y a nivel de los ápices (puntas de las raíces)
  // Para dientes superiores: ápices están arriba (toothY - rootHeight)
  // Para dientes inferiores: ápices están abajo (toothY + crownHeight + rootHeight)
  const circleY = isUpper
    ? toothY - rootHeight
    : toothY + crownHeight + rootHeight;

  // Tamaño del círculo (más grande)
  const circleRadius = 16;

  return (
    <g key={`${toothNumber}-supernumerario-${index}`}>
      {/* Círculo azul */}
      <circle
        cx={circleX}
        cy={circleY}
        r={circleRadius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        className="pointer-events-none"
      />

      {/* Letra "S" dentro del círculo */}
      <text
        x={circleX}
        y={circleY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={fillColor}
        fontSize="20"
        fontWeight="bold"
        className="pointer-events-none select-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        S
      </text>
    </g>
  );
};

// Helper: Renderizar flecha para diente extruido/intruido (FUERA del diente)
export const renderExtrusionIntrusionArrow = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const condition = applied.condition;

  // Dimensiones del diente
  const crownHeight = 40;
  const rootHeight = 40;
  const arrowLength = 35; // Longitud de la flecha
  const arrowHeadSize = 8; // Tamaño de la punta de la flecha

  // DIENTE EXTRUIDO: Flecha apuntando HACIA ABAJO (hacia el plano oclusal)
  if (condition.id === 'diente-extruido') {
    if (isUpper) {
      // Dientes superiores: flecha debajo de la corona apuntando HACIA ABAJO
      const arrowStartY = toothY + crownHeight + 10; // Comienza 10px debajo de la corona
      const arrowEndY = toothY + crownHeight + 10 + arrowLength; // Termina apuntando hacia abajo

      return (
        <g key={`${toothNumber}-${condition.id}-${index}`}>
          {/* Línea de la flecha */}
          <line
            x1={toothX}
            y1={arrowStartY}
            x2={toothX}
            y2={arrowEndY}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
          {/* Punta de la flecha (apuntando hacia abajo) */}
          <path
            d={`M ${toothX - arrowHeadSize} ${arrowEndY - arrowHeadSize} L ${toothX} ${arrowEndY} L ${toothX + arrowHeadSize} ${arrowEndY - arrowHeadSize}`}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        </g>
      );
    } else {
      // Dientes inferiores: flecha debajo de la raíz apuntando HACIA ABAJO
      const arrowStartY = toothY + crownHeight + rootHeight + 10; // Comienza 10px abajo de la raíz
      const arrowEndY = toothY + crownHeight + rootHeight + 10 + arrowLength; // Termina apuntando hacia abajo

      return (
        <g key={`${toothNumber}-${condition.id}-${index}`}>
          {/* Línea de la flecha */}
          <line
            x1={toothX}
            y1={arrowStartY}
            x2={toothX}
            y2={arrowEndY}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
          {/* Punta de la flecha (apuntando hacia abajo) */}
          <path
            d={`M ${toothX - arrowHeadSize} ${arrowEndY - arrowHeadSize} L ${toothX} ${arrowEndY} L ${toothX + arrowHeadSize} ${arrowEndY - arrowHeadSize}`}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        </g>
      );
    }
  }

  // DIENTE INTRUIDO: Flecha apuntando HACIA ARRIBA (hacia el ápice)
  if (condition.id === 'diente-intruido') {
    if (isUpper) {
      // Dientes superiores: flecha debajo de la corona apuntando HACIA ARRIBA
      const arrowStartY = toothY + crownHeight + 10 + arrowLength; // Comienza 10px debajo de la corona + longitud de flecha
      const arrowEndY = toothY + crownHeight + 10; // Termina 10px debajo de la corona (apuntando hacia arriba)

      return (
        <g key={`${toothNumber}-${condition.id}-${index}`}>
          {/* Línea de la flecha */}
          <line
            x1={toothX}
            y1={arrowStartY}
            x2={toothX}
            y2={arrowEndY}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
          {/* Punta de la flecha (apuntando hacia arriba) */}
          <path
            d={`M ${toothX - arrowHeadSize} ${arrowEndY + arrowHeadSize} L ${toothX} ${arrowEndY} L ${toothX + arrowHeadSize} ${arrowEndY + arrowHeadSize}`}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        </g>
      );
    } else {
      // Dientes inferiores: flecha debajo de la raíz apuntando HACIA ARRIBA
      const arrowStartY = toothY + crownHeight + rootHeight + 10 + arrowLength; // Comienza 10px abajo de la raíz + longitud de flecha
      const arrowEndY = toothY + crownHeight + rootHeight + 10; // Termina 10px abajo de la raíz (apuntando hacia arriba)

      return (
        <g key={`${toothNumber}-${condition.id}-${index}`}>
          {/* Línea de la flecha */}
          <line
            x1={toothX}
            y1={arrowStartY}
            x2={toothX}
            y2={arrowEndY}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none"
          />
          {/* Punta de la flecha (apuntando hacia arriba) */}
          <path
            d={`M ${toothX - arrowHeadSize} ${arrowEndY + arrowHeadSize} L ${toothX} ${arrowEndY} L ${toothX + arrowHeadSize} ${arrowEndY + arrowHeadSize}`}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        </g>
      );
    }
  }

  return null;
};

// Helper: Renderizar pieza dentaria en erupción (RAYO ⚡)
export const renderPiezaEnErupcion = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];

  // Dimensiones del diente
  const crownHeight = 40;
  const rootHeight = 40;

  // Dibujar RAYO REAL (zigzag pronunciado como relámpago ⚡)
  // Siempre apunta hacia el PLANO OCLUSAL (línea central)
  // Debe ocupar todo el diente (corona + raíz) SIN salirse
  const rayHeight = crownHeight + rootHeight;  // 40 + 40 = 80px (todo el diente)
  const rayWidth = 20;   // Ancho del zigzag

  if (isUpper) {
    // Dientes SUPERIORES: Rayo desde la raíz hacia abajo hasta la corona (⬇️)
    // Centro en el medio del diente completo (raíz + corona)
    const centerY = toothY - rootHeight / 2;
    const endY = centerY + rayHeight;

    const rayPath = `
      M ${toothX} ${centerY}
      L ${toothX + rayWidth * 0.4} ${centerY + rayHeight * 0.15}
      L ${toothX - rayWidth * 0.2} ${centerY + rayHeight * 0.3}
      L ${toothX + rayWidth * 0.5} ${centerY + rayHeight * 0.5}
      L ${toothX - rayWidth * 0.3} ${centerY + rayHeight * 0.7}
      L ${toothX} ${endY}
    `;

    // Flecha al final (apuntando hacia abajo)
    const arrowSize = 6;
    const arrowPath = `
      M ${toothX - arrowSize} ${endY - arrowSize}
      L ${toothX} ${endY}
      L ${toothX + arrowSize} ${endY - arrowSize}
    `;

    return (
      <g key={`${toothNumber}-erupcion-${index}`}>
        <path
          d={rayPath}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
        <path
          d={arrowPath}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      </g>
    );
  } else {
    // Dientes INFERIORES: Rayo desde la raíz hacia arriba hasta la corona (⬆️)
    // Centro en el medio del diente completo (corona + raíz)
    const centerY = toothY + crownHeight + rootHeight / 2;
    const endY = centerY - rayHeight;

    const rayPath = `
      M ${toothX} ${centerY}
      L ${toothX - rayWidth * 0.4} ${centerY - rayHeight * 0.15}
      L ${toothX + rayWidth * 0.2} ${centerY - rayHeight * 0.3}
      L ${toothX - rayWidth * 0.5} ${centerY - rayHeight * 0.5}
      L ${toothX + rayWidth * 0.3} ${centerY - rayHeight * 0.7}
      L ${toothX} ${endY}
    `;

    // Flecha al final (apuntando hacia arriba)
    const arrowSize = 6;
    const arrowPath = `
      M ${toothX - arrowSize} ${endY + arrowSize}
      L ${toothX} ${endY}
      L ${toothX + arrowSize} ${endY + arrowSize}
    `;

    return (
      <g key={`${toothNumber}-erupcion-${index}`}>
        <path
          d={rayPath}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
        <path
          d={arrowPath}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      </g>
    );
  }
};

// Helper: Renderizar flecha de migración horizontal (mesial o distal)
export const renderMigracionArrow = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const direction = applied.migracionDirection!;

  // Determinar si el diente está en el lado derecho o izquierdo
  const quadrant = parseInt(toothNumber.split('.')[0]);
  const isRightQuadrant = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;

  // MESIAL = hacia el centro de la arcada
  // DISTAL = alejándose del centro

  // Calcular dirección de la flecha según el cuadrante:
  // - Cuadrantes derechos (1,4,5,8): mesial apunta DERECHA →, distal apunta IZQUIERDA ←
  // - Cuadrantes izquierdos (2,3,6,7): mesial apunta IZQUIERDA ←, distal apunta DERECHA →

  let arrowDirection: 'left' | 'right';

  if (isRightQuadrant) {
    // Cuadrantes derechos: mesial va hacia la derecha (centro), distal hacia la izquierda
    arrowDirection = direction === 'mesial' ? 'right' : 'left';
  } else {
    // Cuadrantes izquierdos: mesial va hacia la izquierda (centro), distal hacia la derecha
    arrowDirection = direction === 'mesial' ? 'left' : 'right';
  }

  // Posición Y: debajo del número del diente
  const crownHeight = 40;
  const arrowY = toothY + crownHeight / 2; // Centro de la corona

  // Longitud y tamaño de la flecha
  const arrowLength = 30;
  const arrowHeadSize = 7;

  // Calcular posiciones según la dirección
  const startX = arrowDirection === 'right' ? toothX - arrowLength / 2 : toothX + arrowLength / 2;
  const endX = arrowDirection === 'right' ? toothX + arrowLength / 2 : toothX - arrowLength / 2;

  return (
    <g key={`${toothNumber}-migracion-${index}`}>
      {/* Línea horizontal de la flecha */}
      <line
        x1={startX}
        y1={arrowY}
        x2={endX}
        y2={arrowY}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Punta de la flecha */}
      <path
        d={arrowDirection === 'right'
          ? `M ${endX - arrowHeadSize} ${arrowY - arrowHeadSize} L ${endX} ${arrowY} L ${endX - arrowHeadSize} ${arrowY + arrowHeadSize}`
          : `M ${endX + arrowHeadSize} ${arrowY - arrowHeadSize} L ${endX} ${arrowY} L ${endX + arrowHeadSize} ${arrowY + arrowHeadSize}`
        }
        stroke={strokeColor}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none"
      />
    </g>
  );
};

// Helper: Renderizar triángulo para diente en clavija (encierra el NÚMERO del diente)
export const renderDienteClavijaTriangle = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  // Determinar cuadrante para calcular posición del label
  const quadrant = parseInt(toothNumber.split('.')[0]);
  const labelY = getLabelYPosition(quadrant, toothY);

  // Tamaño del triángulo para encerrar el número (ej: "1.8", "2.3")
  const triangleSize = 35;

  // Importar DentalSymbol dinámicamente para evitar dependencia circular
  return { labelY, triangleSize };
};
