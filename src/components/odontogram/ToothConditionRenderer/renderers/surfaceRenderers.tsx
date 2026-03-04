import React from 'react';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';
import { getToothDimensions } from '@/constants/toothDimensions';
import { AppliedCondition } from '../types';
import { isRightSide, getToothType } from '../utils/toothHelpers';

// Helper: Obtener coordenadas de superficie dental
export const getSurfaceCoordinates = (
  sectionId: string,
  toothX: number,
  toothY: number,
  toothNumber: string,
  isUpper: boolean
): { x: number; y: number; w: number; h: number } | null => {
  const dimensions = getToothDimensions(toothNumber);
  const { width, crownHeight } = dimensions;
  const isRight = isRightSide(toothNumber);

  const surfaceMap: Record<string, { x: number; y: number; w: number; h: number }> = {
    corona: {
      x: toothX - width / 4,
      y: toothY + crownHeight / 4,
      w: width / 2,
      h: crownHeight / 2
    },
    vestibular: isUpper ? {
      x: toothX - width / 2,
      y: toothY,
      w: width,
      h: crownHeight / 4
    } : {
      x: toothX - width / 2,
      y: toothY + (crownHeight * 3) / 4,
      w: width,
      h: crownHeight / 4
    },
    lingual: isUpper ? {
      x: toothX - width / 2,
      y: toothY + (crownHeight * 3) / 4,
      w: width,
      h: crownHeight / 4
    } : {
      x: toothX - width / 2,
      y: toothY,
      w: width,
      h: crownHeight / 4
    },
    mesial: isRight ? {
      x: toothX + width / 4,
      y: toothY + crownHeight / 4,
      w: width / 4,
      h: crownHeight / 2
    } : {
      x: toothX - width / 2,
      y: toothY + crownHeight / 4,
      w: width / 4,
      h: crownHeight / 2
    },
    distal: isRight ? {
      x: toothX - width / 2,
      y: toothY + crownHeight / 4,
      w: width / 4,
      h: crownHeight / 2
    } : {
      x: toothX + width / 4,
      y: toothY + crownHeight / 4,
      w: width / 4,
      h: crownHeight / 2
    }
  };

  return surfaceMap[sectionId] ?? null;
};

// Helper: Renderizar superficie dental (relleno o contorno)
export const renderSurface = (
  applied: AppliedCondition,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  renderMode: 'fill' | 'outline'
) => {
  if (!applied.sectionId) return null;

  const fillColor = OFFICIAL_COLORS[color];
  const { condition, toothNumber } = applied;

  const surface = getSurfaceCoordinates(applied.sectionId, toothX, toothY, toothNumber, isUpper);
  if (!surface) return null;

  return (
    <rect
      key={`${toothNumber}-${condition.id}-${applied.sectionId}-${renderMode}`}
      x={surface.x}
      y={surface.y}
      width={surface.w}
      height={surface.h}
      fill={renderMode === 'fill' ? fillColor : 'none'}
      stroke={renderMode === 'outline' ? fillColor : 'none'}
      strokeWidth={renderMode === 'outline' ? '2' : undefined}
      opacity={renderMode === 'fill' ? 0.7 : 1}
      className="pointer-events-none"
    />
  );
};

// Helper: Renderizar patrón de fosas y fisuras para sellantes
export const renderSealantFissurePattern = (
  applied: AppliedCondition,
  toothNumber: string,
  toothX: number,
  toothY: number,
  color: ColorType
) => {
  const strokeColor = OFFICIAL_COLORS[color];
  const toothType = getToothType(toothNumber);

  // Los sellantes solo se aplican en molares y premolares (superficie oclusal)
  if (toothType !== 'molar' && toothType !== 'premolar') {
    return null;
  }

  const centerY = toothY + 20; // Centro vertical de la corona

  // Patrones de fosas y fisuras según tipo de diente
  if (toothType === 'molar') {
    // Patrón en forma de "H" para molares
    return (
      <g key={`${toothNumber}-${applied.condition.id}-fissure`}>
        {/* Fisura central longitudinal */}
        <path
          d={`M ${toothX} ${centerY - 12} Q ${toothX - 1} ${centerY - 6} ${toothX} ${centerY} Q ${toothX + 1} ${centerY + 6} ${toothX} ${centerY + 12}`}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Fisura transversal mesial */}
        <path
          d={`M ${toothX - 12} ${centerY - 4} Q ${toothX - 6} ${centerY - 6} ${toothX} ${centerY - 4}`}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Fisura transversal distal */}
        <path
          d={`M ${toothX} ${centerY + 4} Q ${toothX + 6} ${centerY + 6} ${toothX + 12} ${centerY + 4}`}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  } else {
    // Patrón en forma de "I" o "Y" simple para premolares
    return (
      <g key={`${toothNumber}-${applied.condition.id}-fissure`}>
        {/* Fisura central */}
        <path
          d={`M ${toothX - 10} ${centerY - 6} Q ${toothX - 5} ${centerY - 4} ${toothX} ${centerY} Q ${toothX + 5} ${centerY + 4} ${toothX + 10} ${centerY + 6}`}
          stroke={strokeColor}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
};
