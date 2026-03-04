/**
 * ProcedurePricingTab - Gestion de Precios por Procedimiento
 *
 * Vista expandible por condicion dental con:
 * - Precios editables por cada procedimiento
 * - 5 columnas de precios (Sin Plan, Personal, Familiar, Platinium, Oro)
 * - Indicadores visuales de estado (buen/mal estado)
 * - Guardado automatico con feedback visual
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DollarSign,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Search,
  AlertCircle,
  Sparkles,
  Crown,
  Users,
  User,
  Star
} from 'lucide-react';
import { CONDITION_CATEGORIES, OFFICIAL_COLORS } from '@/constants/dentalConditions';
import { DentalSymbol } from '@/components/odontogram/DentalSymbols';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import catalogsApi, { ConditionProcedureData } from '@/services/api/catalogsApi';
import { toast } from 'sonner';

// Tipos de planes de salud con sus iconos y colores
const HEALTH_PLANS = [
  { key: 'price_without_plan', label: 'Sin Plan', shortLabel: 'S/P', icon: User, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
  { key: 'price_plan_personal', label: 'Personal', shortLabel: 'PER', icon: User, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { key: 'price_plan_familiar', label: 'Familiar', shortLabel: 'FAM', icon: Users, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
  { key: 'price_plan_platinium', label: 'Platinium', shortLabel: 'PLT', icon: Crown, color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' },
  { key: 'price_plan_oro', label: 'Oro', shortLabel: 'ORO', icon: Star, color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
] as const;

interface ProcedurePricingTabProps {
  canEditConfiguration: boolean;
}

export const ProcedurePricingTab = ({ canEditConfiguration }: ProcedurePricingTabProps) => {
  // Store
  const { dentalConditions, customConditions, isLoadingConditions, conditionsLoaded, loadCatalogsFromDB } = useOdontogramConfigStore();
  const OFFICIAL_DENTAL_CONDITIONS = [...dentalConditions, ...customConditions];

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set());
  const [editingProcedure, setEditingProcedure] = useState<{ conditionId: string; procedureId: number } | null>(null);
  const [editingPriceValues, setEditingPriceValues] = useState<Record<string, string>>({});
  const [savingProcedure, setSavingProcedure] = useState<number | null>(null);
  const [addingProcedure, setAddingProcedure] = useState<string | null>(null);
  const [newProcedureName, setNewProcedureName] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Filtrar condiciones
  const filteredConditions = useMemo(() => {
    let result = OFFICIAL_DENTAL_CONDITIONS;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.label.toLowerCase().includes(search) ||
        (c as any).procedures?.some((p: any) => p.procedure_name.toLowerCase().includes(search))
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(c => c.category === filterCategory);
    }

    return result;
  }, [OFFICIAL_DENTAL_CONDITIONS, searchTerm, filterCategory]);

  // Toggle expansion de condicion
  const toggleCondition = useCallback((conditionId: string) => {
    setExpandedConditions(prev => {
      const next = new Set(prev);
      if (next.has(conditionId)) {
        next.delete(conditionId);
      } else {
        next.add(conditionId);
      }
      return next;
    });
  }, []);

  // Iniciar edicion de precios de un procedimiento
  const startEditingProcedure = useCallback((conditionId: string, procedure: ConditionProcedureData) => {
    const procedureId = procedure.condition_procedure_id!;
    setEditingProcedure({ conditionId, procedureId });
    setEditingPriceValues({
      price_without_plan: String(procedure.price_without_plan || 0),
      price_plan_personal: procedure.price_plan_personal !== null ? String(procedure.price_plan_personal) : '',
      price_plan_familiar: procedure.price_plan_familiar !== null ? String(procedure.price_plan_familiar) : '',
      price_plan_platinium: procedure.price_plan_platinium !== null ? String(procedure.price_plan_platinium) : '',
      price_plan_oro: procedure.price_plan_oro !== null ? String(procedure.price_plan_oro) : '',
    });
  }, []);

  // Cancelar edicion
  const cancelEditing = useCallback(() => {
    setEditingProcedure(null);
    setEditingPriceValues({});
  }, []);

  // Guardar precios de procedimiento
  const saveProcedurePrices = useCallback(async (conditionId: string, procedureId: number) => {
    try {
      setSavingProcedure(procedureId);

      const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === conditionId);
      if (!condition || !(condition as any).condition_id) {
        toast.error('Condicion no encontrada');
        return;
      }

      const dbConditionId = (condition as any).condition_id;

      // Preparar datos - convertir strings vacios a null (N.I. = No Incluido)
      const priceData = {
        price_without_plan: parseFloat(editingPriceValues.price_without_plan) || 0,
        price_plan_personal: editingPriceValues.price_plan_personal === '' ? null : parseFloat(editingPriceValues.price_plan_personal),
        price_plan_familiar: editingPriceValues.price_plan_familiar === '' ? null : parseFloat(editingPriceValues.price_plan_familiar),
        price_plan_platinium: editingPriceValues.price_plan_platinium === '' ? null : parseFloat(editingPriceValues.price_plan_platinium),
        price_plan_oro: editingPriceValues.price_plan_oro === '' ? null : parseFloat(editingPriceValues.price_plan_oro),
      };

      await catalogsApi.updateConditionProcedure(dbConditionId, procedureId, priceData);
      await loadCatalogsFromDB();

      setEditingProcedure(null);
      setEditingPriceValues({});
      toast.success('Precios actualizados correctamente');
    } catch (error: any) {
      console.error('Error al guardar precios:', error);
      toast.error(error?.message || 'Error al guardar precios');
    } finally {
      setSavingProcedure(null);
    }
  }, [editingPriceValues, OFFICIAL_DENTAL_CONDITIONS, loadCatalogsFromDB]);

  // Crear nuevo procedimiento
  const handleCreateProcedure = useCallback(async (conditionId: string) => {
    if (!newProcedureName.trim()) {
      toast.error('Ingrese un nombre para el procedimiento');
      return;
    }

    try {
      setLoadingAction(true);
      const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === conditionId);
      if (!condition || !(condition as any).condition_id) {
        toast.error('Condicion no encontrada');
        return;
      }

      const dbConditionId = (condition as any).condition_id;
      const procedures = (condition as any).procedures || [];

      await catalogsApi.createConditionProcedure(dbConditionId, {
        procedure_name: newProcedureName.trim(),
        display_order: procedures.length,
        price_without_plan: 0,
      });

      await loadCatalogsFromDB();
      setAddingProcedure(null);
      setNewProcedureName('');
      toast.success('Procedimiento creado correctamente');
    } catch (error: any) {
      console.error('Error al crear procedimiento:', error);
      toast.error(error?.message || 'Error al crear procedimiento');
    } finally {
      setLoadingAction(false);
    }
  }, [newProcedureName, OFFICIAL_DENTAL_CONDITIONS, loadCatalogsFromDB]);

  // Eliminar procedimiento
  const handleDeleteProcedure = useCallback(async (conditionId: string, procedureId: number, procedureName: string) => {
    if (!confirm(`¿Eliminar el procedimiento "${procedureName}"?`)) return;

    try {
      setLoadingAction(true);
      const condition = OFFICIAL_DENTAL_CONDITIONS.find(c => c.id === conditionId);
      if (!condition || !(condition as any).condition_id) {
        toast.error('Condicion no encontrada');
        return;
      }

      await catalogsApi.deleteConditionProcedure((condition as any).condition_id, procedureId);
      await loadCatalogsFromDB();
      toast.success('Procedimiento eliminado');
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      toast.error(error?.message || 'Error al eliminar procedimiento');
    } finally {
      setLoadingAction(false);
    }
  }, [OFFICIAL_DENTAL_CONDITIONS, loadCatalogsFromDB]);

  // Loading state
  if (isLoadingConditions) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Cargando condiciones dentales...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (conditionsLoaded && OFFICIAL_DENTAL_CONDITIONS.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="mt-3 text-gray-600">No se encontraron condiciones dentales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Tarifario de Procedimientos</h2>
            <p className="text-emerald-100 text-sm">Configure precios por plan de salud</p>
          </div>
        </div>
      </div>

      {/* Barra de busqueda y filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar condicion o procedimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
        >
          <option value="all">Todas las categorias</option>
          {CONDITION_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
          ))}
        </select>
      </div>

      {/* Leyenda de planes */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-gray-700">Planes de Salud:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {HEALTH_PLANS.map(plan => {
            const Icon = plan.icon;
            return (
              <div key={plan.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${plan.bgColor} ${plan.borderColor} border`}>
                <Icon className={`w-3.5 h-3.5 ${plan.textColor}`} />
                <span className={`text-xs font-medium ${plan.textColor}`}>{plan.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
            <X className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700">N.I. = No Incluido</span>
          </div>
        </div>
      </div>

      {/* Lista de condiciones */}
      <div className="space-y-2">
        {CONDITION_CATEGORIES.map(category => {
          const categoryConditions = filteredConditions.filter(c => c.category === category.id);
          if (categoryConditions.length === 0) return null;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Header de categoria */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2.5 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <span className="text-xs font-normal text-gray-500">({categoryConditions.length})</span>
                </h3>
              </div>

              {/* Condiciones */}
              <div className="divide-y divide-gray-100">
                {categoryConditions.map(condition => {
                  const isExpanded = expandedConditions.has(condition.id);
                  const procedures = (condition as any).procedures as ConditionProcedureData[] || [];
                  const hasStates = (condition as any).colorConditional !== undefined && (condition as any).colorConditional !== null;

                  return (
                    <div key={condition.id}>
                      {/* Fila de condicion (clickeable para expandir) */}
                      <div
                        className={`px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-emerald-50/50' : ''}`}
                        onClick={() => toggleCondition(condition.id)}
                      >
                        {/* Icono expandir */}
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>

                        {/* Simbolo */}
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm">
                          {(condition as any).symbolType === 'fill' ? (
                            <div className="w-7 h-7 rounded" style={{ backgroundColor: OFFICIAL_COLORS[condition.color as keyof typeof OFFICIAL_COLORS], opacity: 0.8 }} />
                          ) : (condition as any).symbolType === 'text' ? (
                            <div className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-bold rounded">
                              {(condition as any).abbreviation}
                            </div>
                          ) : (
                            <svg width="32" height="32" viewBox="0 0 40 40">
                              <DentalSymbol symbolType={(condition as any).symbolType} x={20} y={20} color={condition.color} size={12} />
                            </svg>
                          )}
                        </div>

                        {/* Nombre de condicion */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">{condition.label}</div>
                          <div className="text-xs text-gray-500">
                            {procedures.length} procedimiento{procedures.length !== 1 ? 's' : ''}
                            {hasStates && (
                              <span className="ml-2 text-blue-600">
                                (con estados buen/mal)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Resumen de precios */}
                        <div className="text-right">
                          {procedures.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Desde <span className="font-semibold text-emerald-600">
                                S/. {Math.min(...procedures.map(p => p.price_without_plan || 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Panel expandido con procedimientos */}
                      {isExpanded && (
                        <div className="bg-gray-50/50 border-t border-gray-100">
                          {/* Encabezado de tabla */}
                          <div className="px-4 py-2 bg-white border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-xs font-semibold text-gray-600 pl-6">Procedimiento</div>
                              {HEALTH_PLANS.map(plan => (
                                <div key={plan.key} className={`w-20 text-center text-xs font-semibold ${plan.textColor}`}>
                                  {plan.shortLabel}
                                </div>
                              ))}
                              {canEditConfiguration && (
                                <div className="w-20 text-center text-xs font-semibold text-gray-500">Acciones</div>
                              )}
                            </div>
                          </div>

                          {/* Lista de procedimientos */}
                          <div className="divide-y divide-gray-100">
                            {procedures.map((procedure, idx) => {
                              const isEditing = editingProcedure?.procedureId === procedure.condition_procedure_id;
                              const isSaving = savingProcedure === procedure.condition_procedure_id;

                              return (
                                <div
                                  key={procedure.condition_procedure_id || idx}
                                  className={`group px-4 py-2.5 flex items-center gap-2 ${isEditing ? 'bg-blue-50' : 'hover:bg-white'} transition-colors`}
                                >
                                  {/* Indicador de estado */}
                                  <div className="w-6 flex-shrink-0">
                                    {procedure.applies_to_state === 'good' && (
                                      <div className="w-3 h-3 rounded-full bg-blue-500" title="Solo buen estado" />
                                    )}
                                    {procedure.applies_to_state === 'bad' && (
                                      <div className="w-3 h-3 rounded-full bg-red-500" title="Solo mal estado" />
                                    )}
                                  </div>

                                  {/* Nombre del procedimiento */}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-800 font-medium truncate block">
                                      {procedure.procedure_name}
                                    </span>
                                    {procedure.specialty && (
                                      <span className="text-xs text-gray-400">{procedure.specialty}</span>
                                    )}
                                  </div>

                                  {/* Precios */}
                                  {isEditing ? (
                                    // Modo edicion
                                    <>
                                      {HEALTH_PLANS.map(plan => (
                                        <div key={plan.key} className="w-20">
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="N.I."
                                            value={editingPriceValues[plan.key] || ''}
                                            onChange={(e) => setEditingPriceValues(prev => ({
                                              ...prev,
                                              [plan.key]: e.target.value
                                            }))}
                                            className={`w-full px-2 py-1 text-xs text-center border rounded focus:ring-1 focus:ring-emerald-500 ${plan.borderColor}`}
                                          />
                                        </div>
                                      ))}
                                      <div className="w-20 flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => saveProcedurePrices(condition.id, procedure.condition_procedure_id!)}
                                          disabled={isSaving}
                                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button
                                          onClick={cancelEditing}
                                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    // Modo visualizacion
                                    <>
                                      {HEALTH_PLANS.map(plan => {
                                        const value = procedure[plan.key as keyof ConditionProcedureData] as number | null;
                                        const isNI = value === null || value === undefined;
                                        return (
                                          <div
                                            key={plan.key}
                                            className={`w-20 text-center text-xs font-medium py-1 rounded ${
                                              isNI
                                                ? 'bg-red-50 text-red-400'
                                                : value === 0
                                                  ? 'bg-emerald-50 text-emerald-600 font-bold'
                                                  : 'text-gray-700'
                                            }`}
                                          >
                                            {isNI ? 'N.I.' : value === 0 ? 'GRATIS' : `${value}`}
                                          </div>
                                        );
                                      })}
                                      {canEditConfiguration && (
                                        <div className="w-20 flex items-center justify-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingProcedure(condition.id, procedure);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Editar precios"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteProcedure(condition.id, procedure.condition_procedure_id!, procedure.procedure_name);
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* Boton agregar procedimiento */}
                            {canEditConfiguration && (
                              addingProcedure === condition.id ? (
                                <div className="px-4 py-2.5 flex items-center gap-2 bg-emerald-50">
                                  <div className="w-6" />
                                  <input
                                    type="text"
                                    placeholder="Nombre del nuevo procedimiento"
                                    value={newProcedureName}
                                    onChange={(e) => setNewProcedureName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleCreateProcedure(condition.id);
                                      if (e.key === 'Escape') {
                                        setAddingProcedure(null);
                                        setNewProcedureName('');
                                      }
                                    }}
                                    className="flex-1 px-3 py-1.5 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleCreateProcedure(condition.id)}
                                    disabled={loadingAction}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Crear
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAddingProcedure(null);
                                      setNewProcedureName('');
                                    }}
                                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div className="px-4 py-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingProcedure(condition.id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-emerald-300 w-full justify-center font-medium"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Agregar Procedimiento
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje si no hay resultados */}
      {filteredConditions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="mt-3 text-gray-500">No se encontraron condiciones</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
            }}
            className="mt-2 text-emerald-600 hover:underline text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};
