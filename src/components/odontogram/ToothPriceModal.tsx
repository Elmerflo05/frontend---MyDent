/**
 * ToothPriceModal
 *
 * Modal para definir el precio final de un diente cuando tiene múltiples condiciones.
 * Se muestra automáticamente cuando el usuario agrega una segunda condición a un diente.
 */

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Calculator, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal/Modal';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { formatCurrency } from '@/components/consultation/utils/treatmentPlanHelpers';
import { getConditionPrice } from '@/utils/dentalPricing';

interface ToothCondition {
  toothNumber: string;
  sectionId?: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  price?: number;
  notes?: string;
  dental_condition_id?: number;
  custom_tooth_price?: number;
}

interface ToothPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: string;
  conditions: ToothCondition[];
  onConfirm: (toothNumber: string, finalPrice: number) => void;
}

export const ToothPriceModal = ({
  isOpen,
  onClose,
  toothNumber,
  conditions,
  onConfirm
}: ToothPriceModalProps) => {
  // Obtener condiciones desde el store para obtener labels
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  // Obtener precio real de cada condición usando getConditionPrice
  const conditionsWithPrices = useMemo(() => {
    return conditions.map(cond => ({
      ...cond,
      calculatedPrice: getConditionPrice(cond.conditionId, cond.abbreviation, cond.state)
    }));
  }, [conditions]);

  // Calcular suma automática de precios individuales
  const automaticTotal = useMemo(() => {
    return conditionsWithPrices.reduce((sum, cond) => sum + cond.calculatedPrice, 0);
  }, [conditionsWithPrices]);

  // Detectar si ya existe un precio personalizado previo (de las condiciones existentes, no la nueva)
  const existingCustomPrice = useMemo(() => {
    // Buscar en las condiciones existentes (excepto la última que es la nueva)
    const existingConditions = conditions.slice(0, -1);
    const conditionWithCustomPrice = existingConditions.find(c =>
      c.custom_tooth_price !== undefined && c.custom_tooth_price !== null
    );
    return conditionWithCustomPrice?.custom_tooth_price;
  }, [conditions]);

  // Estado local para el precio final editable
  const [finalPrice, setFinalPrice] = useState<number>(existingCustomPrice ?? automaticTotal);
  const [useAutomaticTotal, setUseAutomaticTotal] = useState(existingCustomPrice === undefined);

  // Actualizar el precio final cuando cambian las condiciones (solo si usa suma automática)
  useEffect(() => {
    if (useAutomaticTotal) {
      setFinalPrice(automaticTotal);
    }
  }, [automaticTotal, useAutomaticTotal]);

  // Reset cuando se abre el modal - considerar precio personalizado existente
  useEffect(() => {
    if (isOpen) {
      if (existingCustomPrice !== undefined) {
        // Si ya había un precio personalizado, usarlo como base
        setFinalPrice(existingCustomPrice);
        setUseAutomaticTotal(false);
      } else {
        // Si no había precio personalizado, usar la suma automática
        setFinalPrice(automaticTotal);
        setUseAutomaticTotal(true);
      }
    }
  }, [isOpen, automaticTotal, existingCustomPrice]);

  // Obtener el label de una condición
  const getConditionLabel = (conditionId: string): string => {
    const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === conditionId);
    return condition?.label || conditionId;
  };

  // Diferencia entre suma automática y precio final
  const priceDifference = finalPrice - automaticTotal;
  const hasDiscount = priceDifference < 0;

  const handleConfirm = () => {
    onConfirm(toothNumber, finalPrice);
    onClose();
  };

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFinalPrice(numValue);
    setUseAutomaticTotal(false);
  };

  const handleUseAutomatic = () => {
    setFinalPrice(automaticTotal);
    setUseAutomaticTotal(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Precio del Diente {toothNumber}
            </h2>
            <p className="text-indigo-100 text-sm">
              {conditions.length} condiciones registradas
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-4">
          {/* Aviso de precio existente */}
          {existingCustomPrice !== undefined && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900">Precio anterior definido</p>
                <p className="text-lg font-bold text-purple-700">{formatCurrency(existingCustomPrice)}</p>
              </div>
            </div>
          )}

          {/* Aviso informativo */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {existingCustomPrice !== undefined
                ? 'Ajuste el precio considerando la nueva condición agregada.'
                : 'Puede definir un precio combinado diferente a la suma individual.'}
            </p>
          </div>

          {/* Lista de condiciones */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Condiciones en el diente:
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-100">
                {conditionsWithPrices.map((cond, index) => (
                  <div
                    key={`${cond.conditionId}-${cond.sectionId || 'full'}-${index}`}
                    className="flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900">
                        {getConditionLabel(cond.conditionId)}
                      </p>
                      {cond.sectionId && (
                        <p className="text-xs text-gray-500">{cond.sectionId.toUpperCase()}</p>
                      )}
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${cond.calculatedPrice > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {formatCurrency(cond.calculatedPrice)}
                    </span>
                  </div>
                ))}
              </div>
              {/* Suma automática */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Suma total:</span>
                </div>
                <span className="text-base font-bold text-blue-600">
                  {formatCurrency(automaticTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de precio final */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio final del diente:
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-lg font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                    useAutomaticTotal
                      ? 'border-blue-300 bg-blue-50 text-blue-700 focus:border-blue-500'
                      : 'border-purple-300 bg-purple-50 text-purple-700 focus:border-purple-500'
                  }`}
                />
              </div>
              {!useAutomaticTotal && (
                <button
                  onClick={handleUseAutomatic}
                  className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Usar suma
                </button>
              )}
            </div>

            {/* Indicador de diferencia */}
            {!useAutomaticTotal && priceDifference !== 0 && (
              <p className={`mt-2 text-sm font-medium ${hasDiscount ? 'text-green-600' : 'text-orange-600'}`}>
                {hasDiscount
                  ? `Descuento aplicado: ${formatCurrency(Math.abs(priceDifference))}`
                  : `Incremento: +${formatCurrency(priceDifference)}`}
              </p>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          <Check className="w-4 h-4" />
          Confirmar Precio
        </button>
      </Modal.Footer>
    </Modal>
  );
};
