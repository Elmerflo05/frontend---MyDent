/**
 * Utilidades para el plan de tratamiento
 */

/**
 * Agrupa las condiciones del odontograma por número de diente
 * Normaliza los campos para que sean compatibles con TreatmentSummary
 */
export const groupConditionsByTooth = (odontogramConditions: any[]): Record<string, any[]> => {
  return odontogramConditions.reduce((acc, condition) => {
    // Limpiar número de diente (sin puntos ni comas)
    const rawToothNumber = condition.toothNumber || condition.tooth_number || 'General';
    const toothNumber = String(rawToothNumber).replace(/[.,]/g, '');

    if (!acc[toothNumber]) {
      acc[toothNumber] = [];
    }

    // Normalizar campos para compatibilidad con TreatmentSummary
    const normalizedCondition = {
      ...condition,
      // Campo normalizado para el número de diente
      toothNumber: toothNumber,
      // Campo normalizado para el nombre de la condición
      conditionName: condition.condition_name || condition.conditionName || condition.conditionLabel || 'Sin nombre',
      // Campo para el código de condición
      conditionCode: condition.conditionId || condition.condition || condition.condition_code || '',
      // Precio normalizado
      price: Number(condition.price) || 0,
      // Categoría
      category: condition.category || '',
      // Superficies - normalizar de sectionId si no hay surfaces
      surfaces: condition.surfaces || (condition.sectionId ? [condition.sectionId] : []),
      surfaceName: condition.surfaceName || condition.sectionId || '',
      // Notas
      notes: condition.notes || '',
      // ID de condición dental
      dentalConditionId: condition.dental_condition_id || condition.dentalConditionId,
      // Procedimientos
      procedures: condition.procedures || []
    };

    acc[toothNumber].push(normalizedCondition);
    return acc;
  }, {} as Record<string, any[]>);
};

/**
 * Calcula el gran total de todos los tratamientos aplicados
 */
export const calculateGrandTotal = (appliedTreatments: any[]): number => {
  return appliedTreatments.reduce((sum, t) => sum + t.totalAmount, 0);
};

/**
 * Calcula el total de piezas en todos los tratamientos
 */
export const calculateTotalPieces = (appliedTreatments: any[]): number => {
  return appliedTreatments.reduce((sum, t) =>
    sum + t.conditions.reduce((condSum: number, c: any) => condSum + c.quantity, 0),
    0
  );
};

/**
 * Calcula el número total de condiciones en todos los tratamientos
 */
export const calculateTotalConditions = (appliedTreatments: any[]): number => {
  return appliedTreatments.reduce((sum, t) => sum + t.conditions.length, 0);
};

/**
 * Formatea un monto a formato de moneda con separador de miles
 * Ejemplo: 8050 -> "S/ 8,050.00"
 */
export const formatCurrency = (amount: number): string => {
  return `S/ ${Number(amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calcula el porcentaje pagado sobre un total
 */
export const calculatePercentage = (paid: number, total: number): number => {
  return total > 0 ? (paid / total) * 100 : 0;
};
