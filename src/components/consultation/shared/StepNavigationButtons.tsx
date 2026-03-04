/**
 * StepNavigationButtons - Componente reutilizable para botones de navegación
 *
 * Proporciona los botones estándar para navegar entre steps:
 * - Volver (opcional)
 * - Guardar
 * - Continuar
 *
 * ELIMINA: ~30-40 líneas de código duplicado por step
 */

import { Save, ChevronRight, ChevronLeft } from 'lucide-react';

interface StepNavigationButtonsProps {
  /** Handler para el botón Volver */
  onBack?: () => void;

  /** Handler para el botón Guardar */
  onSave: () => void;

  /** Handler para el botón Continuar */
  onContinue: () => void;

  /** Texto del botón Continuar (varía por step) */
  continueLabel?: string;

  /** Mostrar el botón Volver (default: true) */
  showBackButton?: boolean;

  /** Deshabilitar el botón Guardar */
  disableSave?: boolean;

  /** Deshabilitar el botón Continuar */
  disableContinue?: boolean;

  /** Estado de guardado en progreso */
  isSaving?: boolean;

  /** Clase CSS adicional para el contenedor */
  className?: string;
}

/**
 * Componente de botones de navegación para steps de consulta
 *
 * Proporciona una interfaz consistente para:
 * - Retroceder al step anterior
 * - Guardar progreso actual
 * - Avanzar al siguiente step
 *
 * @example
 * ```tsx
 * <StepNavigationButtons
 *   onBack={() => setActiveStep(1)}
 *   onSave={handleSaveProgress}
 *   onContinue={() => markStepCompleted(2)}
 *   continueLabel="Continuar a Diagnóstico Presuntivo"
 * />
 * ```
 */
export const StepNavigationButtons = ({
  onBack,
  onSave,
  onContinue,
  continueLabel = 'Continuar',
  showBackButton = true,
  disableSave = false,
  disableContinue = false,
  isSaving = false,
  className = ''
}: StepNavigationButtonsProps) => {
  return (
    <div className={`flex justify-between ${className}`}>
      {/* Botón Volver */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          type="button"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
      )}

      {/* Espaciador si no hay botón Volver */}
      {(!showBackButton || !onBack) && <div />}

      {/* Botones de acción (Guardar + Continuar) */}
      <div className="flex gap-3">
        {/* Botón Guardar */}
        <button
          onClick={onSave}
          disabled={disableSave || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            disableSave || isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          type="button"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>

        {/* Botón Continuar */}
        <button
          onClick={onContinue}
          disabled={disableContinue}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            disableContinue
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-clinic-primary text-white hover:bg-clinic-dark shadow-md hover:shadow-lg'
          }`}
          type="button"
        >
          {continueLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
