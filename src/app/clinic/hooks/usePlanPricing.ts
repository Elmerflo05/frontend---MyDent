/**
 * usePlanPricing Hook
 * Maneja el calculo de precios con descuentos del plan de salud
 */

import { useState, useCallback } from 'react';
import { pricingApi, PriceCalculation, MultiplePricesResult } from '@/services/api/pricingApi';

interface PlanPricingState {
  loading: boolean;
  error: string | null;
  calculations: PriceCalculation[];
  totals: {
    total_without_plan: number;
    total_with_plan: number;
    total_discount: number;
  } | null;
  planInfo: {
    plan_code: string;
    plan_name: string;
    coverage_type: string;
  } | null;
}

interface UsePlanPricingReturn {
  // Estado
  state: PlanPricingState;
  // Acciones
  calculatePrice: (subProcedureId: number, patientId: number) => Promise<PriceCalculation | null>;
  calculatePriceByCode: (code: string, patientId: number) => Promise<PriceCalculation | null>;
  calculateMultiplePrices: (subProcedureIds: number[], patientId: number) => Promise<MultiplePricesResult | null>;
  clearCalculations: () => void;
  // Helpers
  getDiscountPercentage: (priceWithoutPlan: number, priceWithPlan: number) => number;
  formatPriceDisplay: (calculation: PriceCalculation) => string;
}

const initialState: PlanPricingState = {
  loading: false,
  error: null,
  calculations: [],
  totals: null,
  planInfo: null
};

export function usePlanPricing(): UsePlanPricingReturn {
  const [state, setState] = useState<PlanPricingState>(initialState);

  /**
   * Calcular precio de un sub-procedimiento para un paciente
   */
  const calculatePrice = useCallback(async (
    subProcedureId: number,
    patientId: number
  ): Promise<PriceCalculation | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await pricingApi.calculatePrice(subProcedureId, patientId);

      if (response.success && response.data) {
        const calculation = response.data;

        setState(prev => ({
          ...prev,
          loading: false,
          calculations: [...prev.calculations, calculation],
          planInfo: calculation.plan_applied ? {
            plan_code: calculation.plan_applied,
            plan_name: calculation.plan_name || '',
            coverage_type: calculation.coverage_type || ''
          } : prev.planInfo
        }));

        return calculation;
      }

      setState(prev => ({ ...prev, loading: false }));
      return null;
    } catch (error) {
      console.error('Error calculating price:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al calcular precio'
      }));
      return null;
    }
  }, []);

  /**
   * Calcular precio por codigo de sub-procedimiento
   */
  const calculatePriceByCode = useCallback(async (
    code: string,
    patientId: number
  ): Promise<PriceCalculation | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await pricingApi.calculatePriceByCode(code, patientId);

      if (response.success && response.data) {
        const calculation = response.data;

        setState(prev => ({
          ...prev,
          loading: false,
          calculations: [...prev.calculations, calculation],
          planInfo: calculation.plan_applied ? {
            plan_code: calculation.plan_applied,
            plan_name: calculation.plan_name || '',
            coverage_type: calculation.coverage_type || ''
          } : prev.planInfo
        }));

        return calculation;
      }

      setState(prev => ({ ...prev, loading: false }));
      return null;
    } catch (error) {
      console.error('Error calculating price by code:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al calcular precio'
      }));
      return null;
    }
  }, []);

  /**
   * Calcular precios de multiples sub-procedimientos
   */
  const calculateMultiplePrices = useCallback(async (
    subProcedureIds: number[],
    patientId: number
  ): Promise<MultiplePricesResult | null> => {
    if (subProcedureIds.length === 0) {
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await pricingApi.calculateMultiplePrices(subProcedureIds, patientId);

      if (response.success && response.data) {
        const result = response.data;

        setState({
          loading: false,
          error: null,
          calculations: result.details,
          totals: result.totals,
          planInfo: result.plan
        });

        return result;
      }

      setState(prev => ({ ...prev, loading: false }));
      return null;
    } catch (error) {
      console.error('Error calculating multiple prices:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al calcular precios'
      }));
      return null;
    }
  }, []);

  /**
   * Limpiar calculos
   */
  const clearCalculations = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Calcular porcentaje de descuento
   */
  const getDiscountPercentage = useCallback((
    priceWithoutPlan: number,
    priceWithPlan: number
  ): number => {
    if (priceWithoutPlan <= 0) return 0;
    const discount = ((priceWithoutPlan - priceWithPlan) / priceWithoutPlan) * 100;
    return Math.round(discount * 100) / 100; // Redondear a 2 decimales
  }, []);

  /**
   * Formatear precio para display
   */
  const formatPriceDisplay = useCallback((calculation: PriceCalculation): string => {
    if (calculation.has_discount) {
      return `S/ ${calculation.price_with_plan.toFixed(2)} (antes S/ ${calculation.price_without_plan.toFixed(2)})`;
    }
    return `S/ ${calculation.price_without_plan.toFixed(2)}`;
  }, []);

  return {
    state,
    calculatePrice,
    calculatePriceByCode,
    calculateMultiplePrices,
    clearCalculations,
    getDiscountPercentage,
    formatPriceDisplay
  };
}

export default usePlanPricing;
