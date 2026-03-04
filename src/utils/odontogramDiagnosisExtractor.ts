/**
 * Utilidad para extraer condiciones del odontograma y generar texto descriptivo
 * para el diagnóstico presuntivo
 *
 * Responsabilidades:
 * - Extraer condiciones únicas del odontograma
 * - Buscar códigos CIE-10 correspondientes
 * - Agrupar dientes afectados por condición
 * - Generar texto descriptivo para observaciones
 */

import { OFFICIAL_DENTAL_CONDITIONS } from '@/constants/dentalConditions';

export interface ExtractedDiagnosis {
  conditionId: string;
  label: string;
  cie10?: string;
  affectedTeeth: string[];
  category: string;
}

/**
 * Extrae las condiciones únicas del odontograma y las mapea a diagnósticos presuntivos
 *
 * @param odontogramConditions - Array de condiciones del odontograma
 * @returns Array de diagnósticos extraídos con códigos CIE-10
 */
export const extractDiagnosisFromOdontogram = (
  odontogramConditions: any[]
): ExtractedDiagnosis[] => {
  if (!odontogramConditions || odontogramConditions.length === 0) {
    return [];
  }

  // Mapa para agrupar dientes por condición
  const conditionMap = new Map<string, Set<string>>();

  // Procesar cada condición del odontograma
  odontogramConditions.forEach((condition) => {
    // Obtener el ID de la condición (puede venir como 'condition' o 'conditionId')
    const conditionId = condition.conditionId || condition.condition;

    if (!conditionId) return;

    // Inicializar el Set si no existe
    if (!conditionMap.has(conditionId)) {
      conditionMap.set(conditionId, new Set());
    }

    // Agregar el diente al Set (automáticamente evita duplicados)
    if (condition.toothNumber) {
      conditionMap.get(conditionId)!.add(condition.toothNumber);
    }
  });

  // Convertir el mapa a array de diagnósticos
  const diagnoses: ExtractedDiagnosis[] = [];

  conditionMap.forEach((teeth, conditionId) => {
    // Buscar la configuración de la condición en el catálogo oficial
    const conditionConfig = OFFICIAL_DENTAL_CONDITIONS.find(
      (c) => c.id === conditionId
    );

    if (conditionConfig) {
      // Solo incluir patologías (no tratamientos ni prótesis)
      // Las patologías son las que deben aparecer en el diagnóstico presuntivo
      if (conditionConfig.category === 'patologia' || conditionConfig.category === 'anomalia') {
        diagnoses.push({
          conditionId: conditionConfig.id,
          label: conditionConfig.label,
          cie10: conditionConfig.cie10,
          affectedTeeth: Array.from(teeth).sort((a, b) => {
            // Ordenar los dientes numéricamente
            const numA = parseFloat(a.replace('.', ''));
            const numB = parseFloat(b.replace('.', ''));
            return numA - numB;
          }),
          category: conditionConfig.category
        });
      }
    }
  });

  return diagnoses;
};

/**
 * Genera texto descriptivo del diagnóstico para el campo de observaciones
 *
 * @param extractedDiagnoses - Diagnósticos extraídos del odontograma
 * @returns Texto descriptivo para observaciones
 */
export const generateDiagnosisText = (
  extractedDiagnoses: ExtractedDiagnosis[]
): string => {
  if (extractedDiagnoses.length === 0) {
    return '';
  }

  const lines = extractedDiagnoses.map((diagnosis) => {
    const teethList = diagnosis.affectedTeeth.join(', ');
    const cie10Text = diagnosis.cie10 ? ` [CIE-10: ${diagnosis.cie10}]` : '';
    return `• ${diagnosis.label}${cie10Text} - Dientes: ${teethList}`;
  });

  return `Condiciones detectadas en odontograma:\n\n${lines.join('\n')}`;
};
