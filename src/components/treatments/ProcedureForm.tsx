/**
 * ProcedureForm - Formulario para agregar procedimientos a un tratamiento
 *
 * Flujo:
 * 1. Seleccionar una condicion dental
 * 2. Ver y seleccionar procedimientos disponibles de esa condicion
 * 3. El precio se autocompleta segun el plan de salud del paciente
 */

import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { TreatmentProcedure } from '@/types';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { CONDITION_CATEGORIES } from '@/constants/dentalConditions';
import type { ConditionProcedureData } from '@/services/api/catalogsApi';

interface ProcedureFormProps {
  procedures: TreatmentProcedure[];
  onAddProcedure: () => void;
  onRemoveProcedure: (index: number) => void;
  onUpdateProcedure: (index: number, field: keyof TreatmentProcedure, value: any) => void;
}

export const ProcedureForm = ({
  procedures,
  onAddProcedure,
  onRemoveProcedure,
  onUpdateProcedure
}: ProcedureFormProps) => {
  // Obtener condiciones dentales desde el store
  const { dentalConditions, customConditions, isLoadingConditions, loadCatalogsFromDB } = useOdontogramConfigStore();
  const allConditions = useMemo(() => [...dentalConditions, ...customConditions], [dentalConditions, customConditions]);

  // Cargar catalogos si no estan cargados o si las condiciones no tienen procedimientos
  useEffect(() => {
    const hasConditionsWithProcedures = allConditions.some(c => (c as any).procedures?.length > 0);
    if (allConditions.length === 0 || !hasConditionsWithProcedures) {
      loadCatalogsFromDB();
    }
  }, []);

  // Estado para cada fila de procedimiento
  const [selectedConditions, setSelectedConditions] = useState<Record<number, string>>({});
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, 'condition' | 'procedure' | null>>({});

  // Filtrar condiciones por busqueda
  const getFilteredConditions = (index: number) => {
    const search = searchTerms[index]?.toLowerCase() || '';
    if (!search) return allConditions;
    return allConditions.filter(c =>
      c.label.toLowerCase().includes(search) ||
      (c as any).procedures?.some((p: any) => p.procedure_name.toLowerCase().includes(search))
    );
  };

  // Obtener procedimientos de una condicion seleccionada
  const getConditionProcedures = (conditionId: string): ConditionProcedureData[] => {
    const condition = allConditions.find(c => c.id === conditionId);
    return (condition as any)?.procedures || [];
  };

  // Seleccionar condicion
  const handleSelectCondition = (index: number, conditionId: string) => {
    setSelectedConditions(prev => ({ ...prev, [index]: conditionId }));
    setOpenDropdowns(prev => ({ ...prev, [index]: null })); // Cerrar dropdown de condicion
    // Limpiar el procedimiento actual
    onUpdateProcedure(index, 'name', '');
    onUpdateProcedure(index, 'cost', 0);
  };

  // Seleccionar procedimiento
  const handleSelectProcedure = (index: number, procedure: ConditionProcedureData) => {
    onUpdateProcedure(index, 'name', procedure.procedure_name);
    onUpdateProcedure(index, 'cost', procedure.price_without_plan || 0);
    onUpdateProcedure(index, 'description', procedure.specialty || '');
    setOpenDropdowns(prev => ({ ...prev, [index]: null }));
  };

  // Toggle dropdown
  const toggleDropdown = (index: number, type: 'condition' | 'procedure') => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: prev[index] === type ? null : type
    }));
  };

  // Si esta cargando, mostrar indicador
  if (isLoadingConditions) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-3" />
        <span className="text-gray-600">Cargando condiciones y procedimientos...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Procedimientos</h4>
        <button
          type="button"
          onClick={onAddProcedure}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Procedimiento
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {procedures.map((procedure, index) => {
          const selectedConditionId = selectedConditions[index];
          const selectedCondition = allConditions.find(c => c.id === selectedConditionId);
          const conditionProcedures = selectedConditionId ? getConditionProcedures(selectedConditionId) : [];
          const filteredConditions = getFilteredConditions(index);
          const isConditionOpen = openDropdowns[index] === 'condition';
          const isProcedureOpen = openDropdowns[index] === 'procedure';

          return (
            <div key={procedure.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="space-y-3">
                {/* Fila 1: Condicion y Procedimiento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Selector de Condicion */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      1. Seleccionar Condicion *
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleDropdown(index, 'condition')}
                      className={`w-full px-3 py-2 text-left text-sm border rounded-lg flex items-center justify-between transition-colors ${
                        selectedCondition
                          ? 'bg-white border-green-300 text-gray-900'
                          : 'bg-white border-gray-300 text-gray-500'
                      }`}
                    >
                      <span className="truncate">
                        {selectedCondition ? selectedCondition.label : 'Seleccione una condicion...'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isConditionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown de Condiciones */}
                    {isConditionOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                        {/* Buscador */}
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Buscar condicion..."
                              value={searchTerms[index] || ''}
                              onChange={(e) => setSearchTerms(prev => ({ ...prev, [index]: e.target.value }))}
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Lista de Condiciones agrupadas por categoria */}
                        <div className="max-h-48 overflow-y-auto">
                          {CONDITION_CATEGORIES.map(category => {
                            const categoryConditions = filteredConditions.filter(c => c.category === category.id);
                            if (categoryConditions.length === 0) return null;

                            return (
                              <div key={category.id}>
                                <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0">
                                  {category.icon} {category.label}
                                </div>
                                {categoryConditions.map(condition => {
                                  const procedureCount = ((condition as any).procedures || []).length;
                                  return (
                                    <button
                                      key={condition.id}
                                      type="button"
                                      onClick={() => handleSelectCondition(index, condition.id)}
                                      className={`w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex items-center justify-between ${
                                        selectedConditionId === condition.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                      }`}
                                    >
                                      <span>{condition.label}</span>
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        procedureCount > 0
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {procedureCount} proc.
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selector de Procedimiento */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      2. Seleccionar Procedimiento *
                    </label>
                    <button
                      type="button"
                      onClick={() => selectedConditionId && toggleDropdown(index, 'procedure')}
                      disabled={!selectedConditionId}
                      className={`w-full px-3 py-2 text-left text-sm border rounded-lg flex items-center justify-between transition-colors ${
                        !selectedConditionId
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : procedure.name
                            ? 'bg-white border-green-300 text-gray-900'
                            : 'bg-white border-gray-300 text-gray-500'
                      }`}
                    >
                      <span className="truncate">
                        {!selectedConditionId
                          ? 'Primero seleccione una condicion'
                          : procedure.name || 'Seleccione un procedimiento...'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isProcedureOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown de Procedimientos */}
                    {isProcedureOpen && selectedConditionId && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                        {conditionProcedures.length === 0 ? (
                          <div className="p-4 text-center">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Esta condicion no tiene procedimientos registrados</p>
                            <p className="text-xs text-gray-400 mt-1">Configure procedimientos en el tarifario</p>
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            {conditionProcedures.map(proc => (
                              <button
                                key={proc.condition_procedure_id}
                                type="button"
                                onClick={() => handleSelectProcedure(index, proc)}
                                className={`w-full px-3 py-2.5 text-left hover:bg-green-50 border-b border-gray-50 last:border-0 ${
                                  procedure.name === proc.procedure_name ? 'bg-green-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {proc.procedure_name}
                                    </div>
                                    {proc.specialty && (
                                      <div className="text-xs text-gray-500">{proc.specialty}</div>
                                    )}
                                  </div>
                                  <div className="ml-3 text-right">
                                    <div className="text-sm font-bold text-green-600">
                                      S/. {proc.price_without_plan || 0}
                                    </div>
                                    {proc.applies_to_state && (
                                      <div className={`text-xs ${
                                        proc.applies_to_state === 'good' ? 'text-blue-600' : 'text-red-600'
                                      }`}>
                                        {proc.applies_to_state === 'good' ? 'Buen estado' : 'Mal estado'}
                                      </div>
                                    )}
                                  </div>
                                  {procedure.name === proc.procedure_name && (
                                    <Check className="w-4 h-4 text-green-600 ml-2" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fila 2: Costo, Duracion y Diente */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Costo (S/)
                    </label>
                    <input
                      type="number"
                      value={procedure.cost}
                      onChange={(e) => onUpdateProcedure(index, 'cost', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duracion (min)
                    </label>
                    <input
                      type="number"
                      value={procedure.duration}
                      onChange={(e) => onUpdateProcedure(index, 'duration', parseInt(e.target.value) || 30)}
                      min="15"
                      step="15"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Diente
                    </label>
                    <input
                      type="text"
                      value={procedure.tooth || ''}
                      onChange={(e) => onUpdateProcedure(index, 'tooth', e.target.value)}
                      placeholder="Ej: 11, 21"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Boton eliminar */}
                {procedures.length > 1 && (
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => onRemoveProcedure(index)}
                      className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar procedimiento
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de Costos */}
      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Costo Total Estimado:</span>
          <span className="text-xl font-bold text-green-600">
            S/. {procedures.reduce((sum, p) => sum + (p.cost || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
