// Colores permitidos para las condiciones dentales
export const ALLOWED_COLORS = {
  RED: '#ef4444',
  BLUE: '#3b82f6'
} as const;

// Iconos por categoría
export const CATEGORY_ICONS: Record<string, string> = {
  'Patología': '🦷',
  'Tratamiento': '⚕️',
  'Prótesis': '🔧',
  'Anomalía': '⚠️',
  'Ortodoncia': '🔩',
  'Endodoncia': '🩺',
  'Periodoncia': '🫧',
  'Preventivo': '🛡️',
  'Cirugía': '✂️'
};
