import { DollarSign, FileText, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConditionPrice, formatPrice } from '@/utils/dentalPricing';
import type { DentalCondition } from '@/constants/dentalConditions';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';

interface ToothCondition {
  toothNumber: string;
  conditionId: string;
  abbreviation?: string;
  state?: 'good' | 'bad';
  sectionId?: string; // Cara del diente (corona, vestibular, lingual, mesial, distal)
  custom_tooth_price?: number; // Precio personalizado del diente (cuando hay múltiples condiciones)
}

interface TreatmentCostSummaryProps {
  conditions: ToothCondition[];
  onClose?: () => void;
}

export const TreatmentCostSummary = ({ conditions, onClose }: TreatmentCostSummaryProps) => {
  // Obtener condiciones desde el store (base de datos)
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  // Mapeo de nombres de superficies a etiquetas en español
  const surfaceLabels: Record<string, string> = {
    corona: 'C',
    vestibular: 'V',
    lingual: 'L',
    distal: 'D',
    mesial: 'M'
  };

  // Primero, identificar dientes con precio personalizado
  // Un diente tiene precio personalizado si custom_tooth_price está definido en cualquiera de sus condiciones
  const teethWithCustomPrice = new Map<string, number>();
  conditions.forEach(condition => {
    if (condition.custom_tooth_price !== undefined && condition.custom_tooth_price !== null) {
      // Solo guardar si aún no existe (el valor es el mismo para todas las condiciones del diente)
      if (!teethWithCustomPrice.has(condition.toothNumber)) {
        teethWithCustomPrice.set(condition.toothNumber, condition.custom_tooth_price);
      }
    }
  });

  // Agrupar condiciones por tipo y calcular costos
  const conditionGroups = conditions.reduce((acc, condition) => {
    const dentalCondition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === condition.conditionId);
    if (!dentalCondition) return acc;

    const key = `${condition.conditionId}-${condition.abbreviation || 'base'}-${condition.state || 'none'}`;

    // Si el diente tiene precio personalizado, el precio de esta condición individual es 0
    // El precio personalizado se sumará por separado al total
    const hasCustomPrice = teethWithCustomPrice.has(condition.toothNumber);
    const price = hasCustomPrice ? 0 : getConditionPrice(condition.conditionId, condition.abbreviation, condition.state);

    if (!acc[key]) {
      acc[key] = {
        conditionId: condition.conditionId,
        label: dentalCondition.label,
        abbreviation: condition.abbreviation,
        state: condition.state,
        count: 0,
        unitPrice: getConditionPrice(condition.conditionId, condition.abbreviation, condition.state), // Precio unitario original para mostrar
        totalPrice: 0,
        teeth: [],
        details: [] // Array de detalles con diente y superficie
      };
    }

    acc[key].count++;
    acc[key].totalPrice += price;
    acc[key].teeth.push(condition.toothNumber);

    // Agregar detalle con superficie
    acc[key].details.push({
      tooth: condition.toothNumber,
      surface: condition.sectionId, // sectionId representa la cara del diente
      hasCustomPrice: hasCustomPrice
    });

    return acc;
  }, {} as Record<string, {
    conditionId: string;
    label: string;
    abbreviation?: string;
    state?: 'good' | 'bad';
    count: number;
    unitPrice: number;
    totalPrice: number;
    teeth: string[];
    details: Array<{ tooth: string; surface?: string; hasCustomPrice?: boolean }>;
  }>);

  const groups = Object.values(conditionGroups);

  // Calcular total: suma de precios individuales + suma de precios personalizados de dientes
  const totalFromGroups = groups.reduce((sum, group) => sum + group.totalPrice, 0);
  const totalFromCustomPrices = Array.from(teethWithCustomPrice.values()).reduce((sum, price) => sum + price, 0);
  const totalCost = totalFromGroups + totalFromCustomPrices;
  const totalItems = conditions.length;

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-xl shadow-lg border-2 border-emerald-500 p-6 max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Resumen de Costos</h3>
              <p className="text-xs text-gray-500">{totalItems} condición{totalItems > 1 ? 'es' : ''} aplicada{totalItems > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Condition Groups */}
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {groups.map((group, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <span>{group.label}</span>
                    {group.abbreviation && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {group.abbreviation}
                      </span>
                    )}
                    {group.state && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                        group.state === 'good'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {group.state === 'good' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Buen Estado
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Mal Estado
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {/* Agrupar detalles por diente */}
                    {Object.entries(
                      group.details.reduce((acc, detail) => {
                        if (!acc[detail.tooth]) {
                          acc[detail.tooth] = { surfaces: [], hasCustomPrice: false };
                        }
                        if (detail.surface) {
                          acc[detail.tooth].surfaces.push(detail.surface);
                        }
                        if (detail.hasCustomPrice) {
                          acc[detail.tooth].hasCustomPrice = true;
                        }
                        return acc;
                      }, {} as Record<string, { surfaces: string[]; hasCustomPrice: boolean }>)
                    ).map(([tooth, { surfaces, hasCustomPrice }]) => {
                      // Verificar si tiene las 5 caras
                      const allSurfaces = ['corona', 'vestibular', 'lingual', 'distal', 'mesial'];
                      const hasAllSurfaces = allSurfaces.every(s =>
                        surfaces.some(surf => surf.toLowerCase() === s)
                      );

                      return (
                        <div key={tooth} className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-700">Diente {tooth}:</span>
                          {hasAllSurfaces ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                              Diente completo
                            </span>
                          ) : surfaces.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {surfaces.map((surface, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {surfaceLabels[surface.toLowerCase()] || surface}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {hasCustomPrice && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              Precio combinado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(group.totalPrice)}
                  </div>
                  {group.count > 1 && (
                    <div className="text-xs text-gray-500">
                      {group.count} × {formatPrice(group.unitPrice)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sección de Precios Personalizados por Diente */}
        {teethWithCustomPrice.size > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                Precios Combinados por Diente
              </span>
            </div>
            <div className="space-y-1">
              {Array.from(teethWithCustomPrice.entries()).map(([toothNumber, price]) => {
                const toothConditions = conditions.filter(c => c.toothNumber === toothNumber);
                return (
                  <div key={toothNumber} className="flex items-center justify-between text-sm">
                    <span className="text-purple-800">
                      Diente {toothNumber} ({toothConditions.length} condiciones)
                    </span>
                    <span className="font-semibold text-purple-700">{formatPrice(price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">Total Estimado</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPrice(totalCost)}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Los precios son estimados y pueden variar según la complejidad del caso.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
