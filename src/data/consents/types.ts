/**
 * CONSENT TEMPLATE TYPES
 * Tipos para las plantillas de consentimientos informados
 */

export interface ConsentTemplate {
  id: string;
  nombre: string;
  categoria: string;
  contenido: string; // HTML o texto formateado
  ultimaActualizacion: Date;
}

export type ConsentCategory =
  | 'Cirugía'
  | 'Endodoncia'
  | 'Periodoncia'
  | 'Ortodoncia'
  | 'Prótesis'
  | 'Operatoria'
  | 'Exodoncia'
  | 'Implantes'
  | 'General';
