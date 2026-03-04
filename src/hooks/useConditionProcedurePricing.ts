/**
 * useConditionProcedurePricing Hook
 *
 * Hook para manejar precios de procedimientos de condiciones del odontograma
 * Los precios ahora viven en los PROCEDIMIENTOS, no en las CONDICIONES
 */

import { useState, useCallback } from 'react';
import {
  conditionProcedurePricingApi,
  ConditionProcedure,
  ProcedurePriceCalculation,
  MultipleProcedurePricesResult,
  ConditionWithProcedures
} from '@/services/api/conditionProcedurePricingApi';
import { getPriceForPlan } from '@/constants/healthPlanCodes';

interface UseConditionProcedurePricingState {
  loading: boolean;
  error: string | null;
  procedures: ConditionProcedure[];
  priceCalculations: ProcedurePriceCalculation[];
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

interface UseConditionProcedurePricingReturn {
  state: UseConditionProcedurePricingState;
  // Obtencion de procedimientos
  fetchProceduresByConditionId: (conditionId: number) => Promise<ConditionProcedure[]>;
  fetchProceduresByConditionCode: (conditionCode: string) => Promise<ConditionProcedure[]>;
  // Calculo de precios
  calculatePriceForPatient: (procedureId: number, patientId: number) => Promise<ProcedurePriceCalculation | null>;
  calculateMultiplePricesForPatient: (procedureIds: number[], patientId: number) => Promise<MultipleProcedurePricesResult | null>;
  // Utilidades
  clearState: () => void;
  getPriceForPlan: (procedure: ConditionProcedure, planCode: string | null) => number;
  formatPrice: (price: number) => string;
  getDiscountText: (calculation: ProcedurePriceCalculation) => string;
}

const initialState: UseConditionProcedurePricingState = {
  loading: false,
  error: null,
  procedures: [],
  priceCalculations: [],
  totals: null,
  planInfo: null
};

export function useConditionProcedurePricing(): UseConditionProcedurePricingReturn {
  const [state, setState] = useState<UseConditionProcedurePricingState>(initialState);

  /**
   * Obtener procedimientos de una condicion por ID
   */
  const fetchProceduresByConditionId = useCallback(async (
    conditionId: number
  ): Promise<ConditionProcedure[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await conditionProcedurePricingApi.getProceduresByConditionId(conditionId);

      if (response.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          procedures: response.data
        }));
        return response.data;
      }

      setState(prev => ({ ...prev, loading: false }));
      return [];
    } catch (error) {
      console.error('Error fetching procedures by condition ID:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al obtener procedimientos'
      }));
      return [];
    }
  }, []);

  /**
   * Obtener procedimientos de una condicion por codigo
   */
  const fetchProceduresByConditionCode = useCallback(async (
    conditionCode: string
  ): Promise<ConditionProcedure[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await conditionProcedurePricingApi.getProceduresByConditionCode(conditionCode);

      if (response.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          procedures: response.data
        }));
        return response.data;
      }

      setState(prev => ({ ...prev, loading: false }));
      return [];
    } catch (error) {
      console.error('Error fetching procedures by condition code:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al obtener procedimientos'
      }));
      return [];
    }
  }, []);

  /**
   * Calcular precio de un procedimiento para un paciente
   */
  const calculatePriceForPatient = useCallback(async (
    procedureId: number,
    patientId: number
  ): Promise<ProcedurePriceCalculation | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await conditionProcedurePricingApi.getProcedurePriceForPatient(
        procedureId,
        patientId
      );

      if (response.success && response.data) {
        const calculation = response.data;

        setState(prev => ({
          ...prev,
          loading: false,
          priceCalculations: [...prev.priceCalculations, calculation],
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
      console.error('Error calculating price for patient:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al calcular precio'
      }));
      return null;
    }
  }, []);

  /**
   * Calcular precios de multiples procedimientos para un paciente
   */
  const calculateMultiplePricesForPatient = useCallback(async (
    procedureIds: number[],
    patientId: number
  ): Promise<MultipleProcedurePricesResult | null> => {
    if (procedureIds.length === 0) {
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await conditionProcedurePricingApi.calculateMultiplePrices(
        procedureIds,
        patientId
      );

      if (response.success && response.data) {
        const result = response.data;

        setState({
          loading: false,
          error: null,
          procedures: state.procedures,
          priceCalculations: result.details,
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
  }, [state.procedures]);

  /**
   * Limpiar estado
   */
  const clearState = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Obtener precio de un procedimiento segun el plan (sin API call)
   * Usa la función centralizada getPriceForPlan que maneja normalización de códigos
   */
  const getPriceForPlanCallback = useCallback((
    procedure: ConditionProcedure,
    planCode: string | null
  ): number => {
    // Usar función centralizada que maneja normalización de códigos
    return getPriceForPlan(procedure, planCode);
  }, []);

  /**
   * Formatear precio para mostrar
   */
  const formatPrice = useCallback((price: number): string => {
    return `S/ ${price.toFixed(2)}`;
  }, []);

  /**
   * Obtener texto de descuento
   */
  const getDiscountText = useCallback((calculation: ProcedurePriceCalculation): string => {
    if (!calculation.has_discount) {
      return '';
    }
    return `${calculation.discount_percentage}% desc. (Ahorro: ${formatPrice(calculation.discount_amount)})`;
  }, [formatPrice]);

  return {
    state,
    // Obtencion de procedimientos
    fetchProceduresByConditionId,
    fetchProceduresByConditionCode,
    // Calculo de precios
    calculatePriceForPatient,
    calculateMultiplePricesForPatient,
    // Utilidades
    clearState,
    getPriceForPlan: getPriceForPlanCallback,
    formatPrice,
    getDiscountText
  };
}

export default useConditionProcedurePricing;
