import { OFFICIAL_DENTAL_CONDITIONS, CONDITION_CATEGORIES, OFFICIAL_COLORS } from '@/constants/dentalConditions';

/**
 * Función de filtrado por búsqueda
 */
export const filterConditions = (conditions: typeof OFFICIAL_DENTAL_CONDITIONS, searchTerm: string) => {
  if (!searchTerm.trim()) return conditions;

  const term = searchTerm.toLowerCase();
  return conditions.filter(condition => {
    // Buscar en el nombre
    if (condition.label.toLowerCase().includes(term)) return true;

    // Buscar en código CIE-10
    if (condition.cie10?.toLowerCase().includes(term)) return true;

    // Buscar en la descripción
    if (condition.description?.toLowerCase().includes(term)) return true;

    // Buscar en especificaciones
    if (condition.specifications?.toLowerCase().includes(term)) return true;

    // Buscar en abreviatura principal
    if (condition.abbreviation?.toLowerCase().includes(term)) return true;

    // Buscar en abreviaturas secundarias
    if (condition.abbreviations) {
      const hasMatch = Object.entries(condition.abbreviations).some(([abbr, desc]) =>
        abbr.toLowerCase().includes(term) || desc.toLowerCase().includes(term)
      );
      if (hasMatch) return true;
    }

    // Buscar en categoría
    const category = CONDITION_CATEGORIES.find(c => c.id === condition.category);
    if (category?.label.toLowerCase().includes(term)) return true;

    return false;
  });
};

/**
 * Obtener todas las abreviaturas únicas (filtradas)
 */
export const getAllAbbreviations = (conditions: typeof OFFICIAL_DENTAL_CONDITIONS): Array<{ abbr: string; description: string; color: string }> => {
  const allAbbreviations: Array<{ abbr: string; description: string; color: string }> = [];

  conditions.forEach(condition => {
    if (condition.abbreviation) {
      allAbbreviations.push({
        abbr: condition.abbreviation,
        description: condition.label,
        color: OFFICIAL_COLORS[condition.color]
      });
    }
    if (condition.abbreviations) {
      Object.entries(condition.abbreviations).forEach(([abbr, desc]) => {
        allAbbreviations.push({
          abbr,
          description: desc,
          color: OFFICIAL_COLORS[condition.color]
        });
      });
    }
  });

  return allAbbreviations;
};
