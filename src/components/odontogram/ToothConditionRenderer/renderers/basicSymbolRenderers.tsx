import React from 'react';
import { OFFICIAL_COLORS, ColorType } from '@/constants/dentalConditions';

// Helper: Renderizar línea horizontal arriba del diente (Gingivitis)
export const renderHorizontalLineTop = (
  toothNumber: string,
  conditionId: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  return (
    <line
      key={`${toothNumber}-${conditionId}-${index}`}
      x1={toothX - 15}
      y1={isUpper ? toothY - 40 : toothY + 80}
      x2={toothX + 15}
      y2={isUpper ? toothY - 40 : toothY + 80}
      stroke={OFFICIAL_COLORS[color]}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  );
};

// Helper: Renderizar línea horizontal en la base de la corona (Periodontitis)
export const renderHorizontalLineBottom = (
  toothNumber: string,
  conditionId: string,
  toothX: number,
  toothY: number,
  color: ColorType,
  isUpper: boolean,
  index: number
) => {
  return (
    <line
      key={`${toothNumber}-${conditionId}-${index}`}
      x1={toothX - 15}
      y1={isUpper ? toothY - 18 : toothY + 58}
      x2={toothX + 15}
      y2={isUpper ? toothY - 18 : toothY + 58}
      stroke={OFFICIAL_COLORS[color]}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  );
};
