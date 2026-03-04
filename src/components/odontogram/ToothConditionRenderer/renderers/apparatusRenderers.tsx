import React from 'react';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';
import { getToothDimensions } from '@/constants/toothDimensions';
import { TOOTH_DIMENSIONS, CIRCLE_RADIUS } from '@/constants/odontogramRenderConstants';
import { AppliedCondition } from '../types';
import { getAdjacentToothNumber } from '../utils/toothHelpers';
import { getLabelYPosition } from '../utils/positionHelpers';

// Helper: Renderizar fusión (dos círculos interceptados alrededor de números de dientes)
export const renderFusion = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];

  // Obtener el número del diente adyacente
  const adjacentTooth = getAdjacentToothNumber(toothNumber, applied.fusionPosition!);
  if (!adjacentTooth) return null;

  // Determinar cuadrante para calcular posición del label
  const quadrant = parseInt(toothNumber.split('.')[0]);
  const labelY = getLabelYPosition(quadrant, toothY);

  // Espaciado entre dientes
  const toothSpacing = TOOTH_DIMENSIONS.TOOTH_SPACING;

  // Calcular posiciones X de ambos números
  const tooth1X = toothX;
  const tooth2X = applied.fusionPosition === 'left' ? toothX - toothSpacing : toothX + toothSpacing;

  // Radio del círculo para encerrar el número
  const circleRadius = CIRCLE_RADIUS.FUSION;

  // Distancia de separación entre centros de los círculos para que se intercepten
  // Los círculos se interceptan cuando la distancia entre centros es menor que la suma de radios
  const centerDistance = toothSpacing * 0.5; // Ajustar para controlar el nivel de intersección

  // Calcular posiciones de los círculos (más cercanos entre sí para que se intercepten)
  const circle1X = tooth1X + (applied.fusionPosition === 'left' ? -centerDistance / 2 : centerDistance / 2);
  const circle2X = tooth2X + (applied.fusionPosition === 'left' ? centerDistance / 2 : -centerDistance / 2);

  return (
    <g key={`${toothNumber}-fusion-${index}`}>
      {/* Primer círculo (diente seleccionado) */}
      <circle
        cx={circle1X}
        cy={labelY}
        r={circleRadius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        className="pointer-events-none"
      />

      {/* Segundo círculo (diente adyacente) */}
      <circle
        cx={circle2X}
        cy={labelY}
        r={circleRadius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        className="pointer-events-none"
      />
    </g>
  );
};

// Helper: Renderizar geminación (círculo simple ARRIBA del diente gráfico)
export const renderGeminacion = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];

  // Determinar cuadrante
  const quadrant = parseInt(toothNumber.split('.')[0]);

  // Posición Y del círculo: Encerrando el NÚMERO del diente
  // Según normas oficiales del Colegio Odontológico del Perú (imagen 5.3.22)
  // El círculo debe encerrar el número del diente (entre el número y el diente gráfico)
  const circleY = getLabelYPosition(quadrant, toothY);

  // Radio del círculo
  const circleRadius = CIRCLE_RADIUS.GEMINACION;

  return (
    <circle
      key={`${toothNumber}-geminacion-${index}`}
      cx={toothX}
      cy={circleY}
      r={circleRadius}
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.5"
      className="pointer-events-none"
    />
  );
};

// Helper: Renderizar espigo-muñón (cuadrado en corona + línea en raíz)
export const renderEspigoMunon = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];

  // Obtener dimensiones reales del diente
  const dimensions = getToothDimensions(toothNumber);
  const crownHeight = dimensions.crownHeight;
  const rootHeight = dimensions.rootHeight;

  // Tamaño del cuadrado: ancho del diente menos margen
  const squareSize = dimensions.width - 4;

  // Calcular posición del cuadrado y la línea
  let squareCenterY: number;
  let lineStartY: number;
  let lineEndY: number;

  // El cuadrado debe ser cuadrado (mismo ancho y alto)
  const squareHeight = squareSize;

  if (isUpper) {
    // Dientes superiores: cuadrado centrado en el medio de la corona
    squareCenterY = toothY + (crownHeight / 2);
    // Línea en la raíz (arriba del diente)
    lineEndY = toothY - rootHeight; // Extremo superior (ápice)
    lineStartY = toothY; // Centro del diente (base de la corona)
  } else {
    // Dientes inferiores: cuadrado centrado en el medio de la corona
    squareCenterY = toothY + (crownHeight / 2);
    // Línea en la raíz (abajo del diente)
    lineStartY = toothY + crownHeight; // Base de la corona
    lineEndY = toothY + crownHeight + rootHeight; // Extremo inferior (ápice)
  }

  return (
    <g key={`${toothNumber}-espigo-munon-${index}`}>
      {/* Cuadrado centrado en el medio de la corona */}
      <rect
        x={toothX - squareSize / 2}
        y={squareCenterY - squareHeight / 2}
        width={squareSize}
        height={squareHeight}
        stroke={strokeColor}
        strokeWidth="2.5"
        fill="none"
        className="pointer-events-none"
      />

      {/* Línea vertical en la raíz */}
      <line
        x1={toothX}
        y1={lineStartY}
        x2={toothX}
        y2={lineEndY}
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pointer-events-none"
      />
    </g>
  );
};
