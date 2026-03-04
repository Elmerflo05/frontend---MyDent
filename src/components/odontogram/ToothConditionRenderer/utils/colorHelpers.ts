import { ColorType, DentalCondition } from '@/constants/dentalConditions';
import { AppliedCondition } from '../types';

// Helper: Determinar color de la condición según estado
export const determineConditionColor = (
  applied: AppliedCondition,
  condition: DentalCondition
): ColorType => {
  // CASO ESPECIAL: Corona Metal Cerámica (CMC) siempre en ROJO
  if (condition.id === 'corona-definitiva' && applied.abbreviation === 'CMC' && applied.state === 'bad') {
    return 'red';
  }

  // Condiciones con colorConditional
  if (condition.colorConditional && applied.state) {
    return applied.state === 'good'
      ? condition.colorConditional.goodState
      : condition.colorConditional.badState;
  }

  // Para condiciones sin colorConditional pero con estado
  if (applied.state && !condition.colorConditional) {
    return applied.state === 'good' ? 'blue' : 'red';
  }

  // Color por defecto
  return applied.color || condition.color;
};
