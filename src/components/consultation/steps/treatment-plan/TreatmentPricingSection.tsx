import React, { useMemo } from 'react';
import { FileText, Package, Sparkles, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';

interface TreatmentPricingSectionProps {
  // Totales calculados
  definitiveConditionsTotal: number;
  treatmentsTotal: number;
  additionalServicesTotal: number;
}

export const TreatmentPricingSection: React.FC<TreatmentPricingSectionProps> = ({
  definitiveConditionsTotal,
  treatmentsTotal,
  additionalServicesTotal
}) => {
  // Calcular el total general sumando todos los componentes
  const grandTotal = useMemo(() => {
    return definitiveConditionsTotal + treatmentsTotal + additionalServicesTotal;
  }, [definitiveConditionsTotal, treatmentsTotal, additionalServicesTotal]);

  // Item de desglose
  const BreakdownItem = ({
    icon: Icon,
    label,
    amount,
    color
  }: {
    icon: React.ElementType;
    label: string;
    amount: number;
    color: string;
  }) => {
    const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' }
    };
    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div className={`flex items-center justify-between p-2 rounded-lg ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {formatCurrency(amount)}
        </span>
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3">
      {/* Desglose de precios */}
      <div className="space-y-2">
        <BreakdownItem
          icon={FileText}
          label="Diagnóstico Definitivo"
          amount={definitiveConditionsTotal}
          color="blue"
        />
        <BreakdownItem
          icon={Package}
          label="Tratamientos del Plan"
          amount={treatmentsTotal}
          color="purple"
        />
        <BreakdownItem
          icon={Sparkles}
          label="Servicios Adicionales"
          amount={additionalServicesTotal}
          color="amber"
        />
      </div>

      {/* Precio Total - Prominente */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Precio Total del Tratamiento</span>
          </div>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
