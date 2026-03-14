import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Shield } from 'lucide-react';
import { subProceduresApi, SubProcedureWithPrice } from '@/services/api/subProceduresApi';
import { formatCurrency } from '../../utils/treatmentPlanHelpers';
import { getPriceForPlan, normalizePlanCode } from '@/constants/healthPlanCodes';
import {
  getSubProcedurePriceForPatient,
  type ResolvedPrice
} from '@/services/pricing/consultationPricingService';

// Extender SubProcedureWithPrice para incluir campos de descuento calculados
interface EnrichedSubProcedure extends SubProcedureWithPrice {
  has_discount?: boolean;
  discount_amount?: number;
  discount_percentage?: number;
  plan_applied?: string | null;
  pricing_source?: string;
  company_name?: string | null;
}

interface SubProcedureSelectorProps {
  patientId?: number | string;
  patientHealthPlan?: string | null;
  onSelect: (subProcedure: SubProcedureWithPrice) => void;
  onCancel: () => void;
  onManualMode: () => void;
}

export const SubProcedureSelector: React.FC<SubProcedureSelectorProps> = ({
  patientId,
  patientHealthPlan,
  onSelect,
  onCancel,
  onManualMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<EnrichedSubProcedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalizar el código del plan de salud
  const normalizedPlanCode = normalizePlanCode(patientHealthPlan);

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const response = await subProceduresApi.getSpecialties();
        if (response.success && response.data) {
          setSpecialties(response.data);
        }
      } catch (error) {
        console.error('Error loading specialties:', error);
      }
    };
    loadSpecialties();
    inputRef.current?.focus();
  }, []);

  // ID numérico del paciente para la API de pricing
  const numericPatientId = patientId ? (typeof patientId === 'string' ? parseInt(patientId) : patientId) : null;

  useEffect(() => {
    const searchSubProcedures = async () => {
      if (!searchTerm && !selectedSpecialty) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await subProceduresApi.getSubProcedures({
          search: searchTerm || undefined,
          specialty: selectedSpecialty || undefined,
          is_active: true
        });

        if (response.success && response.data) {
          const sliced = response.data.slice(0, 20);

          // Paso 1: Enriquecer con precios locales (inmediato)
          const enrichedResults: EnrichedSubProcedure[] = sliced.map(sp => {
            const priceWithPlan = getPriceForPlan(sp, normalizedPlanCode);
            const priceWithoutPlan = Number(sp.price_without_plan) || 0;
            const hasDiscount = normalizedPlanCode && priceWithPlan < priceWithoutPlan;
            const discountAmount = hasDiscount ? priceWithoutPlan - priceWithPlan : 0;
            const discountPercentage = hasDiscount && priceWithoutPlan > 0
              ? Math.round((discountAmount / priceWithoutPlan) * 100)
              : 0;

            return {
              ...sp,
              price_with_plan: priceWithPlan,
              price_without_plan: priceWithoutPlan,
              has_discount: hasDiscount,
              discount_amount: discountAmount,
              discount_percentage: discountPercentage,
              plan_applied: normalizedPlanCode
            };
          });

          setResults(enrichedResults);

          // Paso 2: Resolver precios vía API (async, considera empresa corporativa)
          if (numericPatientId) {
            const apiPricePromises = sliced.map(sp =>
              getSubProcedurePriceForPatient(sp.sub_procedure_id, numericPatientId, sp)
                .catch(() => null)
            );

            const apiPrices = await Promise.all(apiPricePromises);

            setResults(prev => prev.map((sp, idx) => {
              const resolved = apiPrices[idx];
              if (!resolved || resolved.pricingSource === 'fallback') return sp;

              return {
                ...sp,
                price_with_plan: resolved.price,
                has_discount: resolved.hasDiscount,
                discount_amount: resolved.discountAmount,
                discount_percentage: resolved.discountPercentage,
                plan_applied: resolved.planApplied,
                pricing_source: resolved.pricingSource,
                company_name: resolved.companyName
              };
            }));
          }
        }
      } catch (error) {
        console.error('Error searching sub-procedures:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchSubProcedures, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedSpecialty, normalizedPlanCode, numericPatientId]);

  // Mapeo de nombres amigables para planes (fallback si no viene nombre dinámico)
  const planDisplayNames: Record<string, string> = {
    personal: 'Plan Personal',
    familiar: 'Plan Familiar',
    platinium: 'Plan Platinium',
    oro: 'Plan Oro'
  };

  return (
    <div className="bg-white border border-purple-200 rounded-lg shadow-lg p-3 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">Buscar en catálogo</span>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador del plan activo */}
      {normalizedPlanCode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-700">
              {planDisplayNames[normalizedPlanCode] || normalizedPlanCode}
            </p>
            <p className="text-[10px] text-blue-600">Los precios se ajustan automáticamente</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o codigo..."
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
          />
        </div>
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-purple-400"
        >
          <option value="">Todas</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="max-h-48 overflow-y-auto border border-gray-100 rounded">
        {loading ? (
          <div className="p-3 text-center text-gray-500 text-xs">Buscando...</div>
        ) : results.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-xs">
            {searchTerm || selectedSpecialty ? 'No se encontraron resultados' : 'Escribe para buscar'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {results.map((sp) => (
              <button
                key={sp.sub_procedure_id}
                onClick={() => onSelect(sp)}
                className="w-full px-2 py-1.5 text-left hover:bg-purple-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">
                    {sp.sub_procedure_name}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-2">
                    {sp.sub_procedure_code && <span className="font-mono">{sp.sub_procedure_code}</span>}
                    {sp.specialty && <span>• {sp.specialty}</span>}
                  </div>
                </div>
                <div className="text-right ml-2 flex items-center gap-1.5">
                  {sp.has_discount && (
                    <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                      -{sp.discount_percentage}%
                    </span>
                  )}
                  <div>
                    <div className="text-xs font-bold text-green-600">
                      {formatCurrency(sp.price_with_plan || sp.price_without_plan)}
                    </div>
                    {sp.has_discount && (
                      <div className="text-[10px] text-gray-400 line-through">
                        {formatCurrency(sp.price_without_plan)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={onManualMode}
          className="w-full text-xs text-blue-500 hover:text-blue-700 py-1"
        >
          Escribir manualmente
        </button>
      </div>
    </div>
  );
};
