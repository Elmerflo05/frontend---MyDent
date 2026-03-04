import React from 'react';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';
import { getToothDimensions } from '@/constants/toothDimensions';
import { AppliedCondition } from '../types';
import { getToothType } from '../utils/toothHelpers';

// Helper: Renderizar mancha/relleno para pulpectomía (PP) en la corona
// Según norma 5.3.36: "se dibuja la representación de la pulpa dentaria coronal"
export const renderPulpotomySquare = (
  applied: AppliedCondition,
  toothX: number,
  toothY: number,
  color: ColorType
) => {
  const fillColor = OFFICIAL_COLORS[color];
  const { condition, toothNumber } = applied;

  /**
   * NORMATIVA OFICIAL - PP (Pulpectomía):
   *
   * Se dibuja una MANCHA/RELLENO en la corona que representa la remoción
   * de la pulpa de la cámara pulpar coronal (sin tratamiento de conductos radiculares).
   *
   * Es una mancha visible de color que ocupa una porción significativa de la corona.
   */
  const dimensions = getToothDimensions(toothNumber);
  const crownHeight = dimensions.crownHeight;

  // Dimensiones de la mancha (aproximadamente 60-70% del ancho de la corona)
  const stainWidth = 30; // Ancho de la mancha
  const stainHeight = 25; // Alto de la mancha

  // Posicionar en el centro de la corona (cámara pulpar)
  const centerY = toothY + crownHeight / 2; // Centro vertical de la corona

  return (
    <rect
      key={`${toothNumber}-${condition.id}-pulpotomy`}
      x={toothX - stainWidth / 2}
      y={centerY - stainHeight / 2}
      width={stainWidth}
      height={stainHeight}
      fill={fillColor}
      stroke="none"
      rx="2"
      className="pointer-events-none"
    />
  );
};

// Helper: Renderizar línea vertical para Tratamiento de Conductos (TC) y Pulpectomía (PC)
// Según norma 5.3.36: "Se dibuja una línea recta vertical de color azul en la raíz"
export const renderTratamientoPulparLinea = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const { condition, abbreviation } = applied;

  // Dimensiones del diente
  const dimensions = getToothDimensions(toothNumber);
  const crownHeight = dimensions.crownHeight;
  const toothType = getToothType(toothNumber);
  const rootHeight = dimensions.rootHeight;

  /**
   * NORMATIVA OFICIAL - Diferencias de longitud:
   *
   * TC (Tratamiento de Conductos): Línea COMPLETA desde cámara pulpar hasta ápice (100% de la raíz)
   * PC (Pulpotomía): Línea PARCIAL desde cámara pulpar hasta 50-60% de la raíz (NO llega al ápice)
   */
  const isPulpotomy = abbreviation === 'PC'; // PC = Pulpotomía (línea corta)
  const isCanalTreatment = abbreviation === 'TC'; // TC = Tratamiento de Conductos (línea completa)

  // Calcular posición de la línea DESDE EL MEDIO DE LA CORONA
  let lineStartY: number;
  let lineEndY: number;

  if (isUpper) {
    // Dientes superiores: línea desde el medio de la corona hacia arriba (hacia raíz)
    lineStartY = toothY + crownHeight / 2; // Comienza en el centro de la corona (cámara pulpar)

    if (isPulpotomy) {
      // PC: Línea CORTA - solo llega al 50% de la raíz
      lineEndY = toothY + crownHeight / 2 - (rootHeight * 0.5); // 50% de la raíz
    } else {
      // TC: Línea COMPLETA - llega hasta cerca del ápice
      lineEndY = toothY - rootHeight + 5; // Hasta el ápice
    }
  } else {
    // Dientes inferiores: línea desde el medio de la corona hacia abajo (hacia raíz)
    lineStartY = toothY + crownHeight / 2; // Comienza en el centro de la corona (cámara pulpar)

    if (isPulpotomy) {
      // PC: Línea CORTA - solo llega al 50% de la raíz
      lineEndY = toothY + crownHeight / 2 + (rootHeight * 0.5); // 50% de la raíz
    } else {
      // TC: Línea COMPLETA - llega hasta cerca del ápice
      lineEndY = toothY + crownHeight + rootHeight - 5; // Hasta el ápice
    }
  }

  return (
    <line
      key={`${toothNumber}-${condition.id}-${index}`}
      x1={toothX}
      y1={lineStartY}
      x2={toothX}
      y2={lineEndY}
      stroke={strokeColor}
      strokeWidth="2.5"
      strokeLinecap="round"
      className="pointer-events-none"
    />
  );
};
