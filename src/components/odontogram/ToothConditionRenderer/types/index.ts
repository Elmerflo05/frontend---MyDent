import { DentalCondition, ColorType } from '@/constants/dentalConditions';

export interface AppliedCondition {
  condition: DentalCondition;
  toothNumber: string;
  sectionId?: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  // Para Fractura
  fractureLocation?: 'corona' | 'raiz' | 'ambos';
  clickPosition?: { x: number; y: number };
  // Para Supernumerario
  supernumeraryPosition?: 'left' | 'right';
  // Para Diastema
  diastemaPosition?: 'left' | 'right';
  // Para Giroversión
  giroversionDirection?: 'clockwise' | 'counterclockwise';
  // Para Fusión
  fusionPosition?: 'left' | 'right';
  // Para Migración
  migracionDirection?: 'mesial' | 'distal';
  // Para Aparato Ortodóntico Fijo
  connectedToothNumber?: string;
}

export interface ToothConditionRendererProps {
  toothNumber: string;
  toothX: number;
  toothY: number;
  conditions: AppliedCondition[];
  isUpper: boolean;
}
