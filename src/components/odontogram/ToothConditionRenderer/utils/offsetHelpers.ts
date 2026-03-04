// Helper: Calcular Y para cross-square (aparato fijo)
export const getCrossSquareY = (toothY: number, isUpper: boolean): number =>
  isUpper ? toothY - 60 : toothY + 100;

// Helper: Calcular Y para zigzag (aparato removible)
export const getZigzagY = (toothY: number, isUpper: boolean): number =>
  isUpper ? toothY - 60 : toothY + 100;

// Helper: Calcular Y para líneas horizontales de prótesis
export const getHorizontalY = (toothY: number, isUpper: boolean): number =>
  isUpper ? toothY - 75 : toothY + 115;

// Helper: Calcular Y para doble línea (prótesis removible)
export const getDoubleLineY = (toothY: number, isUpper: boolean): { line1Y: number; line2Y: number } => ({
  line1Y: isUpper ? toothY - 65 : toothY + 105,
  line2Y: isUpper ? toothY - 55 : toothY + 95
});
