/**
 * Funciones auxiliares para formularios de radiografía
 *
 * Este módulo contiene funciones helper reutilizables para determinar
 * estados y realizar cálculos basados en los datos del formulario.
 *
 * MIGRADO: Usa tipos unificados de @/components/laboratory-form/types
 */

import type {
  Tomografia3DFormData,
  RadiografiasFormData
} from '@/components/laboratory-form/types';

/**
 * Determina el campo de estudio de tomografía basado en las opciones seleccionadas
 * ACTUALIZADO: Usa campos de Tomografia3DFormData unificado
 */
export const determineCampoEstudio = (data: Tomografia3DFormData): 'pequeño' | 'mediano' | 'grande' => {
  // Campo grande: estudios más complejos
  // conGuiaQx, ortognatica, ortodoncia (marpe/miniImplantes), atm, macizoFacial
  const hasOrtodoncia = data.marpe || data.miniImplantes;
  if (data.conGuiaQx || data.ortognatica || hasOrtodoncia || data.atm || data.macizoFacial || data.viaAerea) {
    return 'grande';
  }

  // Campo mediano: estudios de complejidad media
  if (data.localizacionDiente || data.implantes || data.maxilarSuperior) {
    return 'mediano';
  }

  // Campo pequeño: estudios básicos
  return 'pequeño';
};

/**
 * Verifica si hay estudios intraorales seleccionados
 * ACTUALIZADO: Usa campos separados (Fisico/Digital) del tipo unificado
 */
export const hasIntraoralSelected = (data: RadiografiasFormData): boolean => {
  return data.intraoralTipo.length > 0 ||
         data.dientesSuperioresFisico.length > 0 ||
         data.dientesInferioresFisico.length > 0 ||
         data.dientesTemporalesFisico.length > 0 ||
         data.dientesSuperioresDigital.length > 0 ||
         data.dientesInferioresDigital.length > 0 ||
         data.dientesTemporalesDigital.length > 0 ||
         data.bitewingMolaresDerecha ||
         data.bitewingMolaresIzquierda ||
         data.bitewingPremolaresDerecha ||
         data.bitewingPremolaresIzquierda ||
         data.oclusalSuperiores ||
         data.oclusalInferiores ||
         data.seriada ||
         data.fotografiaIntraoral;
};

/**
 * Verifica si hay estudios extraorales seleccionados
 */
export const hasExtraoralSelected = (data: RadiografiasFormData): boolean => {
  return data.extraoralPanoramica ||
         data.extraoralCefalometrica ||
         data.extraoralCarpal ||
         data.extraoralPosteriorAnterior ||
         data.extraoralAtmAbierta ||
         data.extraoralAtmCerrada ||
         data.extraoralFotografia;
};

/**
 * Verifica si hay servicios de ortodoncia seleccionados
 */
export const hasOrtodonciaSelected = (data: RadiografiasFormData): boolean => {
  return data.ortodonciaPaquete > 0 ||
         data.ortodonciaAlineadores ||
         data.ortodonciaEscaneo ||
         data.ortodonciaImpresion;
};

/**
 * Verifica si hay análisis cefalométricos seleccionados
 */
export const hasAnalisisSelected = (data: RadiografiasFormData): boolean => {
  return data.analisisRicketts ||
         data.analisisSchwartz ||
         data.analisisSteiner ||
         data.analisisMcNamara ||
         data.analisisTweed ||
         data.analisisDowns ||
         data.analisisBjorks ||
         data.analisisUSP ||
         data.analisisRotJarabak ||
         data.analisisTejidosBlancos ||
         data.analisisOtros.trim() !== '';
};

/**
 * Construye el array de análisis cefalométricos seleccionados
 */
export const buildAnalisisCefalometricos = (data: RadiografiasFormData): string[] => {
  const analisis: string[] = [];

  if (data.analisisRicketts) analisis.push('Ricketts');
  if (data.analisisSchwartz) analisis.push('Schwartz');
  if (data.analisisSteiner) analisis.push('Steiner');
  if (data.analisisMcNamara) analisis.push('Mc Namara');
  if (data.analisisTweed) analisis.push('Tweed');
  if (data.analisisDowns) analisis.push('Downs');
  if (data.analisisBjorks) analisis.push('Bjorks');
  if (data.analisisUSP) analisis.push('U.S.P');
  if (data.analisisRotJarabak) analisis.push('Rot-h-Jarabak');
  if (data.analisisTejidosBlancos) analisis.push('Tejidos Blancos');
  if (data.analisisOtros.trim()) analisis.push(`Otros: ${data.analisisOtros}`);

  return analisis;
};

/**
 * Verifica si hay algún estudio de tomografía seleccionado
 * ACTUALIZADO: Usa campos de Tomografia3DFormData unificado
 */
export const hasTomografiaStudySelected = (data: Tomografia3DFormData): boolean => {
  return data.endodoncia ||
         data.fracturaRadicular ||
         data.anatomiaEndodontica ||
         data.localizacionDiente ||
         data.implantes ||
         data.maxilarSuperior ||
         data.conGuiaQx ||
         data.ortognatica ||
         data.marpe ||
         data.miniImplantes ||
         data.viaAerea ||
         data.atm ||
         data.macizoFacial ||
         data.otros.trim() !== '';
};

/**
 * Convierte notación FDI a índice numérico para ordenamiento
 * Ejemplos: '1.1' -> 11, '1.8' -> 18, '4.3' -> 43
 */
const toothToIndex = (tooth: string): number => {
  return parseInt(tooth.replace('.', ''));
};

/**
 * Agrupa dientes en rangos contiguos
 *
 * Regla: Si hay 1 o menos dientes EN MEDIO entre dos dientes seleccionados,
 * se consideran el mismo grupo. Si hay 2 o más dientes en medio, son grupos separados.
 *
 * @param teeth - Array de dientes en notación FDI (ej: ['1.8', '1.6', '1.4'])
 * @param allTeethInOrder - Array con todos los dientes posibles en orden (para cada cuadrante)
 * @returns Número de grupos contiguos
 *
 * @example
 * // Dientes seleccionados: 1.2, 2.1 (en medio está 1.1)
 * // 1 diente en medio -> MISMO GRUPO
 * groupTeethByRange(['1.2', '2.1'], DIENTES_SUPERIORES) // -> 1
 *
 * @example
 * // Dientes seleccionados: 1.6, 1.4 (en medio está 1.5)
 * // 1 diente en medio -> MISMO GRUPO
 * groupTeethByRange(['1.6', '1.4'], DIENTES_SUPERIORES) // -> 1
 *
 * @example
 * // Dientes seleccionados: 1.8, 1.5 (en medio están 1.7 y 1.6)
 * // 2 dientes en medio -> GRUPOS SEPARADOS
 * groupTeethByRange(['1.8', '1.5'], DIENTES_SUPERIORES) // -> 2
 */
export const groupTeethByRange = (teeth: string[], allTeethInOrder: string[]): number => {
  if (teeth.length === 0) return 0;
  if (teeth.length === 1) return 1;

  // Ordenar los dientes seleccionados según su posición en la arcada
  const sortedTeeth = [...teeth].sort((a, b) => {
    const indexA = allTeethInOrder.indexOf(a);
    const indexB = allTeethInOrder.indexOf(b);
    return indexA - indexB;
  });

  let groups = 1; // Empezamos con 1 grupo

  // Recorrer los dientes seleccionados y verificar la distancia entre ellos
  for (let i = 0; i < sortedTeeth.length - 1; i++) {
    const currentTooth = sortedTeeth[i];
    const nextTooth = sortedTeeth[i + 1];

    const currentIndex = allTeethInOrder.indexOf(currentTooth);
    const nextIndex = allTeethInOrder.indexOf(nextTooth);

    // Calcular cuántos dientes hay EN MEDIO (sin contar los seleccionados)
    const dientesEnMedio = nextIndex - currentIndex - 1;

    // Si hay 2 o más dientes en medio, es un nuevo grupo
    if (dientesEnMedio > 1) {
      groups++;
    }
  }

  return groups;
};

/**
 * Agrupa todos los dientes seleccionados (superiores, inferiores, temporales)
 * y retorna el número total de grupos
 */
export const countTotalToothGroups = (
  superiores: string[],
  inferiores: string[],
  temporales: string[]
): { totalGroups: number; breakdown: { superiores: number; inferiores: number; temporales: number } } => {
  // Definir todos los dientes posibles en orden para cada cuadrante
  const DIENTES_SUPERIORES = [
    '1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1',
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8'
  ];

  const DIENTES_INFERIORES = [
    '4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1',
    '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8'
  ];

  const DIENTES_TEMPORALES = [
    '5.5', '5.4', '5.3', '5.2', '5.1',
    '6.1', '6.2', '6.3', '6.4', '6.5',
    '8.5', '8.4', '8.3', '8.2', '8.1',
    '7.1', '7.2', '7.3', '7.4', '7.5'
  ];

  // DEBUG: Log para ver qué dientes están siendo procesados

  const groupsSuperiores = groupTeethByRange(superiores, DIENTES_SUPERIORES);
  const groupsInferiores = groupTeethByRange(inferiores, DIENTES_INFERIORES);
  const groupsTemporales = groupTeethByRange(temporales, DIENTES_TEMPORALES);


  return {
    totalGroups: groupsSuperiores + groupsInferiores + groupsTemporales,
    breakdown: {
      superiores: groupsSuperiores,
      inferiores: groupsInferiores,
      temporales: groupsTemporales
    }
  };
};
