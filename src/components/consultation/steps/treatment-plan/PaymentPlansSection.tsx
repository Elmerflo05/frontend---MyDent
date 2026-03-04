import React, { useState } from 'react';
import {
  CreditCard, ChevronDown, ChevronUp, Check, Loader2,
  Stethoscope, Heart, Smile, Trash2
} from 'lucide-react';
import {
  OrthodonticPlan,
  ImplantPlan,
  ProsthesisItem
} from '@/services/api/additionalServicesApi';
import { SelectedAdditionalService, ServiceEditableFields } from '@/components/consultation/hooks/useAdditionalServices';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';

interface PaymentPlansSectionProps {
  // Datos de la API
  orthodonticPlans: OrthodonticPlan[];
  implantPlans: ImplantPlan[];
  prosthesisItems: ProsthesisItem[];
  isLoading: boolean;

  // Servicios seleccionados
  selectedServices: SelectedAdditionalService[];

  // Helpers
  isServiceSelected: (id: string) => boolean;
  getOrthodonticPlanName: (plan: OrthodonticPlan) => string;
  getImplantPlanName: (plan: ImplantPlan) => string;

  // Acciones
  toggleOrthodonticPlan: (plan: OrthodonticPlan) => void;
  toggleImplantPlan: (plan: ImplantPlan) => void;
  toggleProsthesisItem: (item: ProsthesisItem) => void;
  updateServiceField: (serviceId: string, field: keyof ServiceEditableFields, value: number) => void;
  removeService: (serviceId: string) => void;

  // Total
  additionalServicesTotal: number;

  readOnly?: boolean;
}

export const PaymentPlansSection: React.FC<PaymentPlansSectionProps> = ({
  orthodonticPlans,
  implantPlans,
  prosthesisItems,
  isLoading,
  selectedServices,
  isServiceSelected,
  getOrthodonticPlanName,
  getImplantPlanName,
  toggleOrthodonticPlan,
  toggleImplantPlan,
  toggleProsthesisItem,
  updateServiceField,
  removeService,
  additionalServicesTotal,
  readOnly = false
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // Manejar cambio de campo numérico
  const handleFieldChange = (
    serviceId: string,
    field: keyof ServiceEditableFields,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    updateServiceField(serviceId, field, numValue);
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500 mr-2" />
        <span className="text-sm text-gray-500">Cargando servicios adicionales...</span>
      </div>
    );
  }

  // Componente de sección colapsable
  const ServiceSection = ({
    id,
    title,
    icon: Icon,
    color,
    children,
    count
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    children: React.ReactNode;
    count: number;
  }) => {
    const isExpanded = expandedSection === id;
    const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', iconBg: 'bg-green-100' }
    };
    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
        <div
          onClick={() => toggleSection(id)}
          className={`flex items-center justify-between px-3 py-2 ${colors.bg} cursor-pointer`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${colors.iconBg} flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
            </div>
            <span className="font-medium text-sm text-gray-800">{title}</span>
            {count > 0 && (
              <span className={`text-xs ${colors.text} px-1.5 py-0.5 rounded-full ${colors.iconBg}`}>
                {count} seleccionados
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        {isExpanded && (
          <div className="p-3 bg-white space-y-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Componente de item seleccionable
  const SelectableItem = ({
    id,
    name,
    price,
    details,
    isSelected,
    onToggle,
    disabled = false
  }: {
    id: string;
    name: string;
    price: number;
    details?: string;
    isSelected: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`
        flex items-center justify-between p-2 rounded-lg border transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}
      `}
    >
      <div className="flex items-center gap-2">
        <div className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}
        `}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">{name}</span>
          {details && <p className="text-xs text-gray-500">{details}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold ${isSelected ? 'text-purple-600' : 'text-gray-500'}`}>
        {formatCurrency(price)}
      </span>
    </div>
  );

  // Servicios seleccionados contados
  const selectedOrthoCount = selectedServices.filter(s => s.type === 'orthodontic').length;
  const selectedImplantCount = selectedServices.filter(s => s.type === 'implant').length;
  const selectedProsthesisCount = selectedServices.filter(s => s.type === 'prosthesis').length;

  // Obtener etiquetas de modalidad para ortodoncia
  const getModalityLabel = (modality?: string): string => {
    const labels: Record<string, string> = {
      'presupuesto_total': 'Presupuesto Total',
      'sin_presupuesto': 'Sin Presupuesto',
      'sin_inicial': 'Sin Inicial'
    };
    return labels[modality || ''] || modality || '';
  };

  // Determinar qué campos mostrar según el tipo y modalidad
  const getEditableFields = (service: SelectedAdditionalService): {
    showMontoTotal: boolean;
    showInicial: boolean;
    showMensual: boolean;
  } => {
    if (service.type === 'prosthesis') {
      // Prótesis solo tiene costo (montoTotal)
      return { showMontoTotal: true, showInicial: false, showMensual: false };
    }

    if (service.type === 'orthodontic') {
      // Ortodoncia depende de la modalidad
      if (service.modality === 'sin_presupuesto') {
        return { showMontoTotal: false, showInicial: true, showMensual: true };
      }
      if (service.modality === 'sin_inicial') {
        return { showMontoTotal: false, showInicial: false, showMensual: true };
      }
      // presupuesto_total muestra todo
      return { showMontoTotal: true, showInicial: true, showMensual: true };
    }

    // Implantes siempre muestran todo
    return { showMontoTotal: true, showInicial: true, showMensual: true };
  };

  // Componente de campo editable
  const EditableField = ({
    label,
    value,
    onChange,
    disabled = false,
    originalValue
  }: {
    label: string;
    value: number;
    onChange: (value: string) => void;
    disabled?: boolean;
    originalValue: number;
  }) => {
    const hasChanged = value !== originalValue;
    return (
      <div className="flex flex-col">
        <label className="text-[10px] text-gray-500 mb-0.5">{label}</label>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">S/</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`
              w-full pl-7 pr-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-purple-400 focus:border-purple-400
              ${hasChanged ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
        </div>
        {hasChanged && (
          <span className="text-[9px] text-amber-600 mt-0.5">
            Original: {formatCurrency(originalValue)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3">
      {/* ORTODONCIA */}
      <ServiceSection
        id="orthodontic"
        title="Planes de Ortodoncia"
        icon={Smile}
        color="blue"
        count={selectedOrthoCount}
      >
        {orthodonticPlans.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No hay planes de ortodoncia configurados</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {orthodonticPlans.map(plan => (
              <SelectableItem
                key={plan.orthodontic_plan_id}
                id={`ortho-${plan.orthodontic_plan_id}`}
                name={getOrthodonticPlanName(plan)}
                price={plan.monto_total || 0}
                details={`Inicial: ${formatCurrency(plan.inicial || 0)} | Mensual: ${formatCurrency(plan.pago_mensual || 0)}`}
                isSelected={isServiceSelected(`ortho-${plan.orthodontic_plan_id}`)}
                onToggle={() => toggleOrthodonticPlan(plan)}
                disabled={readOnly}
              />
            ))}
          </div>
        )}
      </ServiceSection>

      {/* IMPLANTES */}
      <ServiceSection
        id="implant"
        title="Planes de Implantes"
        icon={Heart}
        color="purple"
        count={selectedImplantCount}
      >
        {implantPlans.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No hay planes de implantes configurados</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {implantPlans.map(plan => (
              <SelectableItem
                key={plan.implant_plan_id}
                id={`implant-${plan.implant_plan_id}`}
                name={getImplantPlanName(plan)}
                price={plan.monto_total || 0}
                details={`Inicial: ${formatCurrency(plan.inicial || 0)} | Mensual: ${formatCurrency(plan.mensual || 0)}`}
                isSelected={isServiceSelected(`implant-${plan.implant_plan_id}`)}
                onToggle={() => toggleImplantPlan(plan)}
                disabled={readOnly}
              />
            ))}
          </div>
        )}
      </ServiceSection>

      {/* PRÓTESIS */}
      <ServiceSection
        id="prosthesis"
        title="Items de Prótesis"
        icon={Stethoscope}
        color="green"
        count={selectedProsthesisCount}
      >
        {prosthesisItems.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No hay items de prótesis configurados</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {prosthesisItems.map(item => (
              <SelectableItem
                key={item.prosthesis_item_id}
                id={`prosthesis-${item.prosthesis_item_id}`}
                name={item.treatment_projection}
                price={item.cost || 0}
                details={`Item #${item.item_number}`}
                isSelected={isServiceSelected(`prosthesis-${item.prosthesis_item_id}`)}
                onToggle={() => toggleProsthesisItem(item)}
                disabled={readOnly}
              />
            ))}
          </div>
        )}
      </ServiceSection>

      {/* TABLA DE SERVICIOS SELECCIONADOS CON CAMPOS EDITABLES */}
      {selectedServices.length > 0 && (
        <div className="border border-amber-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-sm text-gray-800">Servicios Seleccionados</span>
            </div>
            <span className="text-sm font-bold text-amber-600">
              Total: {formatCurrency(additionalServicesTotal)}
            </span>
          </div>

          <div className="bg-white">
            {/* Tabla de servicios */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Servicio</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600 w-28">Monto Total</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600 w-28">Inicial</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600 w-28">Mensual</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600 w-16">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedServices.map(service => {
                    const fields = getEditableFields(service);
                    const typeLabels: Record<string, { label: string; color: string }> = {
                      orthodontic: { label: 'Ortodoncia', color: 'text-blue-600 bg-blue-50' },
                      implant: { label: 'Implante', color: 'text-purple-600 bg-purple-50' },
                      prosthesis: { label: 'Prótesis', color: 'text-green-600 bg-green-50' }
                    };
                    const typeInfo = typeLabels[service.type] || { label: '', color: '' };

                    return (
                      <tr key={service.id} className="hover:bg-gray-50">
                        {/* Nombre del servicio */}
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 text-sm">{service.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              {service.modality && (
                                <span className="text-[10px] text-gray-500">
                                  {getModalityLabel(service.modality)}
                                </span>
                              )}
                              {service.description && (
                                <span className="text-[10px] text-gray-400">{service.description}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Monto Total */}
                        <td className="py-2 px-2">
                          {fields.showMontoTotal ? (
                            <EditableField
                              label=""
                              value={service.editedFields.montoTotal}
                              onChange={(val) => handleFieldChange(service.id, 'montoTotal', val)}
                              disabled={readOnly}
                              originalValue={service.originalFields.montoTotal}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center block">N/A</span>
                          )}
                        </td>

                        {/* Inicial */}
                        <td className="py-2 px-2">
                          {fields.showInicial ? (
                            <EditableField
                              label=""
                              value={service.editedFields.inicial}
                              onChange={(val) => handleFieldChange(service.id, 'inicial', val)}
                              disabled={readOnly}
                              originalValue={service.originalFields.inicial}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center block">N/A</span>
                          )}
                        </td>

                        {/* Mensual */}
                        <td className="py-2 px-2">
                          {fields.showMensual ? (
                            <EditableField
                              label=""
                              value={service.editedFields.mensual}
                              onChange={(val) => handleFieldChange(service.id, 'mensual', val)}
                              disabled={readOnly}
                              originalValue={service.originalFields.mensual}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs text-center block">N/A</span>
                          )}
                        </td>

                        {/* Acción - Eliminar */}
                        <td className="py-2 px-2 text-center">
                          {!readOnly && (
                            <button
                              onClick={() => removeService(service.id)}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                              title="Quitar servicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Nota de campos modificados */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-500">
                Los campos con fondo amarillo han sido modificados del valor original.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
