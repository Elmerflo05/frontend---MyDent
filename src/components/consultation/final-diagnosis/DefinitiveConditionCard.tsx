import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Stethoscope, Plus, X, Loader2, Check, DollarSign } from 'lucide-react';
import type { DefinitiveDiagnosticCondition } from '@/types';
import { consultationsApi, ConditionProcedureData } from '@/services/api/consultationsApi';
import { formatCurrency } from '../utils/treatmentPlanHelpers';
import { getPriceForPlan } from '@/constants/healthPlanCodes';
import { getConditionProcedurePriceForPatient } from '@/services/pricing/consultationPricingService';
import { getEffectiveProcedurePrice } from './final-diagnosis-helpers';

interface DefinitiveConditionCardProps {
  condition: DefinitiveDiagnosticCondition;
  index: number;
  readOnly: boolean;
  patientHealthPlan?: string | null;
  /** ID numérico del paciente para resolver precios vía API (empresa > plan > regular) */
  patientId?: number | null;
  onEdit: (condition: DefinitiveDiagnosticCondition) => void;
  onDelete: (condition: DefinitiveDiagnosticCondition) => void;
  onProcedureChange?: (conditionId: string, procedureId: number, procedurePrice: number, procedureName: string) => void;
}

const getProcedurePrice = (procedure: ConditionProcedureData, healthPlan?: string | null): number => {
  // Fallback local que maneja solo planes de salud (no empresa)
  return getPriceForPlan(procedure, healthPlan);
};

export const DefinitiveConditionCard = ({
  condition,
  index,
  readOnly,
  patientHealthPlan,
  patientId,
  onEdit,
  onDelete,
  onProcedureChange
}: DefinitiveConditionCardProps) => {
  const [showProcedureSelector, setShowProcedureSelector] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState<string>('');
  // Precios editables por procedimiento en el selector
  const [procedurePrices, setProcedurePrices] = useState<Record<number, string>>({});

  // Obtener procedimientos de la condición
  const proceduresData: ConditionProcedureData[] = (condition as any)._procedures ||
    (condition as any).definitive?.procedures ||
    (condition as any).procedures || [];
  const hasProcedures = proceduresData.length > 0;

  // Procedimiento seleccionado - usar ?? para preservar valores 0
  const selectedProcId = (condition as any).selected_procedure_id ??
    (condition as any).selectedProcedureId ?? null;
  const selectedProcName = (condition as any).selected_procedure_name ??
    (condition as any)._selected_procedure_name ?? null;

  // Precio guardado del procedimiento (puede ser editado)
  const savedProcedurePrice = (condition as any).procedure_price;

  // Precio efectivo: fuente única de verdad (procedure_price si existe, fallback a price base).
  // Usado tanto para mostrar como para edición inline.
  const displayPrice: number | null = (() => {
    const resolved = getEffectiveProcedurePrice(condition);
    if (resolved > 0) return resolved;
    const selectedProcData = selectedProcId
      ? proceduresData.find(p => p.procedure_id === selectedProcId)
      : null;
    return selectedProcData ? getProcedurePrice(selectedProcData, patientHealthPlan) : null;
  })();

  // Sincronizar editedPrice cuando cambia el precio mostrado
  useEffect(() => {
    if (displayPrice !== null) {
      setEditedPrice(String(displayPrice));
    }
  }, [displayPrice]);

  // Ref para el debounce del guardado automático
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar precios editables cuando se abre el selector
  // Usa el precio guardado para el procedimiento seleccionado, y precios base para los demás
  useEffect(() => {
    if (showProcedureSelector && proceduresData.length > 0) {
      // Paso 1: Inicializar con precios locales (sync, inmediato)
      const initialPrices: Record<number, string> = {};
      proceduresData.forEach(proc => {
        if (proc.procedure_id === selectedProcId && savedProcedurePrice !== null && savedProcedurePrice !== undefined) {
          initialPrices[proc.procedure_id] = String(savedProcedurePrice);
        } else {
          const price = getProcedurePrice(proc, patientHealthPlan);
          initialPrices[proc.procedure_id] = String(price);
        }
      });
      setProcedurePrices(initialPrices);

      // Paso 2: Resolver precios vía API (async, considera empresa corporativa)
      if (patientId) {
        proceduresData.forEach(proc => {
          // No sobreescribir precio guardado del procedimiento seleccionado
          if (proc.procedure_id === selectedProcId && savedProcedurePrice !== null && savedProcedurePrice !== undefined) return;

          getConditionProcedurePriceForPatient(proc.procedure_id, patientId, proc)
            .then(resolved => {
              if (resolved.pricingSource !== 'fallback') {
                setProcedurePrices(prev => ({
                  ...prev,
                  [proc.procedure_id]: String(resolved.price)
                }));
              }
            })
            .catch(() => { /* mantener precio local */ });
        });
      }
    }
  }, [showProcedureSelector, proceduresData, patientHealthPlan, patientId, selectedProcId, savedProcedurePrice]);

  // Auto-guardar cuando se edita el precio del procedimiento SELECCIONADO (con debounce)
  useEffect(() => {
    // Solo aplicar si hay un procedimiento seleccionado y el selector está abierto
    if (!showProcedureSelector || !selectedProcId || !onProcedureChange) return;

    const currentEditedPrice = procedurePrices[selectedProcId];
    if (currentEditedPrice === undefined || currentEditedPrice === '') return;

    const newPrice = parseFloat(currentEditedPrice);
    if (isNaN(newPrice)) return;

    // Comparar con el precio guardado para evitar loops
    const currentSavedPrice = savedProcedurePrice !== null && savedProcedurePrice !== undefined
      ? Number(savedProcedurePrice)
      : null;

    if (currentSavedPrice !== null && Math.abs(newPrice - currentSavedPrice) < 0.01) return;

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce de 800ms para no guardar en cada tecla
    debounceRef.current = setTimeout(() => {
      const selectedProc = proceduresData.find(p => p.procedure_id === selectedProcId);
      if (selectedProc) {
        onProcedureChange(condition.id, selectedProcId, newPrice, selectedProc.procedure_name);
      }
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [procedurePrices, selectedProcId, showProcedureSelector, savedProcedurePrice, onProcedureChange, condition.id, proceduresData]);

  const handleProcedureSelect = useCallback(async (procedureId: number) => {
    const conditionId = condition.id;
    // Obtener el ID de la BD (definitive_condition_id) - debe ser un número válido de BD, no un timestamp
    const dbConditionId = (condition as any).definitive_condition_id ||
                          (condition as any).definitiveConditionId ||
                          (condition as any)._definitiveConditionId;

    console.log('[DefinitiveConditionCard] handleProcedureSelect:', {
      conditionId,
      procedureId,
      dbConditionId,
      definitive_condition_id: (condition as any).definitive_condition_id,
      definitiveConditionId: (condition as any).definitiveConditionId,
      esIdValido: dbConditionId && typeof dbConditionId === 'number' && dbConditionId < 1000000000
    });

    if (!conditionId || !procedureId) return;

    const selectedProc = proceduresData.find(p => p.procedure_id === procedureId);
    if (!selectedProc) return;

    // Usar el precio editado si existe, sino el precio base
    const editedProcPrice = procedurePrices[procedureId];
    const price = editedProcPrice ? parseFloat(editedProcPrice) : getProcedurePrice(selectedProc, patientHealthPlan);

    console.log('[DefinitiveConditionCard] Procedimiento seleccionado:', {
      procedure_name: selectedProc.procedure_name,
      price,
      procedureId
    });

    setIsUpdating(true);

    try {
      // Solo llamar a la API si tenemos un ID de BD válido (número pequeño, no timestamp)
      // Los timestamps son > 1000000000000 (13 dígitos), los IDs de BD son < 1000000
      if (dbConditionId && typeof dbConditionId === 'number' && dbConditionId < 1000000000) {
        console.log('[DefinitiveConditionCard] Llamando API updateSelectedProcedure con:', {
          dbConditionId,
          procedureId,
          price
        });
        await consultationsApi.updateSelectedProcedure(dbConditionId, procedureId, price);
        console.log('[DefinitiveConditionCard] API updateSelectedProcedure exitoso');
      } else {
        console.log('[DefinitiveConditionCard] NO se llama API (ID no válido o es timestamp). Se guardará al hacer "Guardar" o "Continuar"');
      }

      // Siempre actualizar localmente
      if (onProcedureChange) {
        console.log('[DefinitiveConditionCard] Llamando onProcedureChange para actualizar estado local');
        onProcedureChange(conditionId, procedureId, price, selectedProc.procedure_name);
      }
      setShowProcedureSelector(false);
    } catch (error) {
      console.error('[DefinitiveConditionCard] Error al actualizar procedimiento:', error);
      // Aún así actualizar localmente si falla la API
      if (onProcedureChange) {
        onProcedureChange(conditionId, procedureId, price, selectedProc.procedure_name);
      }
      setShowProcedureSelector(false);
    } finally {
      setIsUpdating(false);
    }
  }, [condition, proceduresData, patientHealthPlan, onProcedureChange, procedurePrices]);

  // Guardar precio editado
  const handleSaveEditedPrice = useCallback(async () => {
    const conditionId = condition.id;
    // Obtener el ID de la BD (definitive_condition_id)
    const dbConditionId = (condition as any).definitive_condition_id ||
                          (condition as any).definitiveConditionId ||
                          (condition as any)._definitiveConditionId;

    if (!conditionId || !selectedProcId) return;

    const newPrice = parseFloat(editedPrice) || 0;

    setIsUpdating(true);

    try {
      // Solo llamar a la API si tenemos un ID de BD válido (número pequeño, no timestamp)
      // Los timestamps son > 1000000000000 (13 dígitos), los IDs de BD son < 1000000
      if (dbConditionId && typeof dbConditionId === 'number' && dbConditionId < 1000000000) {
        await consultationsApi.updateSelectedProcedure(dbConditionId, selectedProcId, newPrice);
      }

      // Siempre actualizar localmente
      if (onProcedureChange) {
        onProcedureChange(conditionId, selectedProcId, newPrice, selectedProcName || '');
      }
      setIsEditingPrice(false);
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      // Aún así actualizar localmente si falla la API
      if (onProcedureChange) {
        onProcedureChange(conditionId, selectedProcId, newPrice, selectedProcName || '');
      }
      setIsEditingPrice(false);
    } finally {
      setIsUpdating(false);
    }
  }, [condition, selectedProcId, editedPrice, selectedProcName, onProcedureChange]);

  // Cancelar edición de precio
  const handleCancelEditPrice = () => {
    setEditedPrice(String(displayPrice || 0));
    setIsEditingPrice(false);
  };

  return (
    <motion.div
      key={condition.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border-2 overflow-hidden ${
        condition.modified
          ? 'bg-amber-50 border-amber-300'
          : 'bg-white border-emerald-200'
      }`}
    >
      {/* Card principal con layout horizontal */}
      <div className="flex items-stretch">
        {/* Número de diente */}
        <div
          className={`w-14 flex items-center justify-center font-bold text-xl text-white flex-shrink-0 ${
            condition.modified
              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600'
          }`}
        >
          {condition.toothNumber}
        </div>

        {/* Información de la condición */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Nombre de la condición */}
              <div className="flex items-center gap-2 flex-wrap">
                <h6 className="font-bold text-gray-900">
                  {condition.definitive.conditionLabel}
                </h6>
                {condition.modified && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                    <Edit3 className="w-2.5 h-2.5" />
                    Modificado
                  </span>
                )}
              </div>

              {/* Metadatos: CIE-10, Superficie (el precio se muestra en la zona del procedimiento) */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {condition.definitive.cie10 && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[11px] font-medium rounded">
                    CIE-10: {condition.definitive.cie10}
                  </span>
                )}
                {((condition as any).surfaces?.length > 0 || (condition as any).definitive?.surfaces?.length > 0) && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-medium rounded">
                    Sup: {((condition as any).surfaces || (condition as any).definitive?.surfaces || []).join(', ')}
                  </span>
                )}
              </div>

              {/* Notas */}
              {condition.definitive.notes && (
                <p className="text-[11px] text-gray-500 mt-1.5 italic">
                  Notas: {condition.definitive.notes}
                </p>
              )}
            </div>

            {/* Botones de edición/eliminación */}
            {!readOnly && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(condition)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(condition)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Procedimiento (derecha) - zona amarilla */}
        <div className="flex-shrink-0 w-48 border-l border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50 flex flex-col justify-center p-2">
          {isUpdating ? (
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Guardando...</span>
            </div>
          ) : selectedProcName ? (
            // Procedimiento seleccionado
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Stethoscope className="w-3 h-3 text-amber-600" />
                <span className="text-[9px] text-amber-700 font-medium uppercase">Procedimiento</span>
              </div>
              <p className="text-[11px] font-semibold text-gray-800 leading-tight mb-0.5">
                {selectedProcName}
              </p>
              {/* Precio editable */}
              {displayPrice !== null && (
                isEditingPrice ? (
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                        className="w-16 pl-5 pr-1 py-0.5 text-xs font-bold border border-emerald-300 rounded focus:outline-none focus:border-emerald-500 text-emerald-700"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleSaveEditedPrice}
                      className="p-0.5 text-emerald-600 hover:bg-emerald-100 rounded"
                      title="Guardar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelEditPrice}
                      className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => !readOnly && setIsEditingPrice(true)}
                    disabled={readOnly}
                    className={`text-sm font-bold text-emerald-600 flex items-center justify-center gap-1 mx-auto ${!readOnly ? 'hover:bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer' : ''}`}
                    title={readOnly ? '' : 'Clic para editar precio'}
                  >
                    {formatCurrency(displayPrice)}
                    {!readOnly && <DollarSign className="w-3 h-3 opacity-50" />}
                  </button>
                )
              )}
              {!readOnly && hasProcedures && !isEditingPrice && (
                <button
                  onClick={() => setShowProcedureSelector(true)}
                  className="mt-1.5 flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-full transition-all duration-200 hover:shadow-sm"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  Cambiar
                </button>
              )}
            </div>
          ) : hasProcedures && !readOnly ? (
            // Botón para seleccionar procedimiento
            <button
              onClick={() => setShowProcedureSelector(true)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition-colors shadow-sm mx-auto"
            >
              <Plus className="w-3 h-3" />
              Asignar
            </button>
          ) : (
            // Sin procedimientos disponibles
            <div className="text-center text-gray-400 text-[10px]">
              <Stethoscope className="w-4 h-4 mx-auto mb-0.5 opacity-50" />
              Sin procedimientos
            </div>
          )}
        </div>
      </div>

      {/* Selector de procedimientos (expandible) */}
      {showProcedureSelector && hasProcedures && (
        <div className="border-t border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4" />
              Seleccionar procedimiento:
            </span>
            <button
              onClick={() => setShowProcedureSelector(false)}
              className="p-1 hover:bg-amber-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-amber-700" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
            {proceduresData.map((proc, procIdx) => {
              const isSelected = proc.procedure_id === selectedProcId;
              const currentPrice = procedurePrices[proc.procedure_id] || '';
              return (
                <div
                  key={`proc-${proc.procedure_id || procIdx}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white border border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {proc.procedure_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Input editable de precio */}
                    <div className="relative">
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentPrice}
                        onChange={(e) => {
                          e.stopPropagation();
                          setProcedurePrices(prev => ({
                            ...prev,
                            [proc.procedure_id]: e.target.value
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-24 pl-7 pr-2 py-1 text-sm font-bold rounded border focus:outline-none focus:ring-1 ${
                          isSelected
                            ? 'bg-emerald-400 border-emerald-300 text-white focus:ring-emerald-200'
                            : 'bg-white border-emerald-300 text-emerald-700 focus:ring-emerald-400'
                        }`}
                      />
                    </div>
                    {/* Botón seleccionar */}
                    <button
                      onClick={() => handleProcedureSelect(proc.procedure_id)}
                      disabled={isUpdating}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
                        isSelected
                          ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {isSelected ? 'Seleccionado' : 'Elegir'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
