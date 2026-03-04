import React, { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import type { AppliedTreatment } from '@/components/consultation/hooks/useTreatmentManagement';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';
import { SubProcedureSelector } from './SubProcedureSelector';
import type { SubProcedureWithPrice } from '@/services/api/subProceduresApi';

interface TreatmentTableProps {
  appliedTreatments: AppliedTreatment[];
  grandTotal: number;
  readOnly?: boolean;
  patientId?: number | string;
  patientHealthPlan?: string | null;
  handleEditTreatmentName: (treatmentId: string, newName: string) => void;
  handleEditConditionLabel: (treatmentId: string, conditionId: string, newLabel: string) => void;
  handleEditConditionPrice: (treatmentId: string, conditionId: string, newPrice: number) => void;
  handleEditConditionQuantity: (treatmentId: string, conditionId: string, newQuantity: number) => void;
  handleAddConditionToTreatment?: (
    treatmentId: string,
    label: string,
    price: number,
    definitiveConditionId?: number | null,
    subProcedureId?: number | null,
    subProcedureCode?: string | null,
    specialty?: string | null
  ) => void;
  setDeleteModal: (state: any) => void;
}

export const TreatmentTable: React.FC<TreatmentTableProps> = ({
  appliedTreatments,
  grandTotal,
  readOnly = false,
  patientId,
  patientHealthPlan,
  handleEditTreatmentName,
  handleEditConditionLabel,
  handleEditConditionPrice,
  handleEditConditionQuantity,
  handleAddConditionToTreatment,
  setDeleteModal
}) => {
  const [newConditionForms, setNewConditionForms] = useState<Record<string, { label: string; price: string }>>({});
  const [expandedTreatments, setExpandedTreatments] = useState<Record<string, boolean>>({});
  const [showCatalogSelector, setShowCatalogSelector] = useState<Record<string, boolean>>({});
  const [showManualForm, setShowManualForm] = useState<Record<string, boolean>>({});

  const toggleTreatment = (id: string) => {
    setExpandedTreatments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddNewCondition = (treatmentId: string) => {
    const form = newConditionForms[treatmentId];
    if (!form || !form.label.trim() || !form.price || parseFloat(form.price) <= 0) return;
    handleAddConditionToTreatment?.(treatmentId, form.label, parseFloat(form.price));
    setNewConditionForms(prev => ({ ...prev, [treatmentId]: { label: '', price: '' } }));
  };

  const updateNewConditionForm = (treatmentId: string, field: 'label' | 'price', value: string) => {
    setNewConditionForms(prev => ({
      ...prev,
      [treatmentId]: { ...prev[treatmentId], [field]: value }
    }));
  };

  const handleSelectFromCatalog = (treatmentId: string, subProcedure: SubProcedureWithPrice) => {
    handleAddConditionToTreatment?.(
      treatmentId,
      subProcedure.sub_procedure_name,
      subProcedure.price_with_plan || subProcedure.price_without_plan,
      null,
      subProcedure.sub_procedure_id,
      subProcedure.sub_procedure_code,
      subProcedure.specialty
    );
    setShowCatalogSelector(prev => ({ ...prev, [treatmentId]: false }));
  };

  if (appliedTreatments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No hay tratamientos agregados
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appliedTreatments.map((treatment) => {
        const isExpanded = expandedTreatments[treatment.id] !== false; // Default expandido
        return (
          <div
            key={treatment.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Header del tratamiento - compacto */}
            <div
              className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 cursor-pointer"
              onClick={() => toggleTreatment(treatment.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                {readOnly ? (
                  <span className="font-semibold text-sm text-gray-900 truncate">{treatment.treatmentName}</span>
                ) : (
                  <input
                    type="text"
                    value={treatment.treatmentName}
                    onChange={(e) => { e.stopPropagation(); handleEditTreatmentName(treatment.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-sm text-gray-900 bg-transparent border-b border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none flex-1 min-w-0"
                  />
                )}
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({treatment.conditions.length})
                </span>
              </div>

              <div className="flex items-center gap-3 ml-2">
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(treatment.totalAmount)}
                </span>
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({
                        show: true,
                        type: 'treatment',
                        treatmentId: treatment.id,
                        label: treatment.treatmentName
                      });
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenido expandible */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Tabla compacta */}
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Descripción</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500 w-20">Precio</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500 w-14">Cant.</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500 w-20">Total</th>
                      {!readOnly && <th className="w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {treatment.conditions.map((condition) => (
                      <tr key={condition.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5">
                          {readOnly ? (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-800">{condition.label}</span>
                              {condition.subProcedureId && (
                                <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">catalogo</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={condition.label}
                                onChange={(e) => handleEditConditionLabel(treatment.id, condition.id, e.target.value)}
                                className="flex-1 text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none py-0.5"
                              />
                              {condition.subProcedureId && (
                                <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded flex-shrink-0">catalogo</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {readOnly ? (
                            <span className="text-gray-700">{formatCurrency(condition.price)}</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={condition.price}
                              onChange={(e) => handleEditConditionPrice(treatment.id, condition.id, parseFloat(e.target.value) || 0)}
                              className="w-16 text-right text-gray-700 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none py-0.5"
                            />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {readOnly ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 font-medium rounded text-xs">
                              {condition.quantity}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              value={condition.quantity}
                              onChange={(e) => handleEditConditionQuantity(treatment.id, condition.id, parseInt(e.target.value) || 1)}
                              className="w-10 text-center border border-gray-200 rounded font-medium text-blue-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 py-0.5"
                            />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-green-600">
                          {formatCurrency(condition.price * condition.quantity)}
                        </td>
                        {!readOnly && (
                          <td className="px-1 py-1.5 text-center">
                            <button
                              onClick={() => setDeleteModal({
                                show: true,
                                type: 'condition',
                                treatmentId: treatment.id,
                                conditionId: condition.id,
                                label: condition.label
                              })}
                              className="p-0.5 text-red-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Fila para agregar - con opciones */}
                    {!readOnly && (
                      <>
                        {showCatalogSelector[treatment.id] ? (
                          <tr>
                            <td colSpan={5} className="p-2">
                              <SubProcedureSelector
                                patientId={patientId}
                                patientHealthPlan={patientHealthPlan}
                                onSelect={(sp) => handleSelectFromCatalog(treatment.id, sp)}
                                onCancel={() => setShowCatalogSelector(prev => ({ ...prev, [treatment.id]: false }))}
                                onManualMode={() => {
                                  setShowCatalogSelector(prev => ({ ...prev, [treatment.id]: false }));
                                  setShowManualForm(prev => ({ ...prev, [treatment.id]: true }));
                                }}
                              />
                            </td>
                          </tr>
                        ) : showManualForm[treatment.id] ? (
                          <tr className="bg-blue-50/50">
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={newConditionForms[treatment.id]?.label || ''}
                                onChange={(e) => updateNewConditionForm(treatment.id, 'label', e.target.value)}
                                placeholder="Nombre del item..."
                                className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                autoFocus
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newConditionForms[treatment.id]?.price || ''}
                                onChange={(e) => updateNewConditionForm(treatment.id, 'price', e.target.value)}
                                placeholder="0"
                                className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className="text-gray-400">1</span>
                            </td>
                            <td className="px-2 py-1.5 text-right text-gray-400">
                              {formatCurrency(parseFloat(newConditionForms[treatment.id]?.price || '0') || 0)}
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    handleAddNewCondition(treatment.id);
                                    setShowManualForm(prev => ({ ...prev, [treatment.id]: false }));
                                  }}
                                  disabled={!newConditionForms[treatment.id]?.label || !newConditionForms[treatment.id]?.price}
                                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShowManualForm(prev => ({ ...prev, [treatment.id]: false }));
                                    setNewConditionForms(prev => ({ ...prev, [treatment.id]: { label: '', price: '' } }));
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr className="bg-gray-50/50">
                            <td colSpan={5} className="px-2 py-1.5">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowCatalogSelector(prev => ({ ...prev, [treatment.id]: true }))}
                                  className="text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
                                >
                                  <Search className="w-3 h-3" /> Buscar en catalogo
                                </button>
                                <button
                                  onClick={() => setShowManualForm(prev => ({ ...prev, [treatment.id]: true }))}
                                  className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Agregar manual
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Total general - compacto */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg border border-emerald-200">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{appliedTreatments.length}</span> tratamiento(s) •{' '}
          <span className="font-medium">{appliedTreatments.reduce((sum, t) => sum + t.conditions.length, 0)}</span> item(s)
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-600 mr-2">Total:</span>
          <span className="text-lg font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
};
