/**
 * HOOK: useMultiToothSelection
 *
 * Gestiona las selecciones multi-diente del odontograma (aparatos, prótesis, etc.)
 *
 * Características:
 * - 7 estados de selección independientes
 * - Validación usando ToothConditionService
 * - Callbacks para completar selecciones
 * - Utilidades para verificar estado de selecciones
 */

import { useState } from 'react';
import { ToothConditionService, type ToothCondition } from '@/services/tooth';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface MultiToothSelectionState {
  firstTooth: string;
  state: 'good' | 'bad';
  abbreviation?: string;
  waitingForSecond: boolean;
}

export interface UseMultiToothSelectionReturn {
  // Estados de selección
  aparatoFijoSelection: MultiToothSelectionState | null;
  aparatoRemovibleSelection: MultiToothSelectionState | null;
  transposicionSelection: MultiToothSelectionState | null;
  protesisFijaSelection: MultiToothSelectionState | null;
  protesisTotalSelection: MultiToothSelectionState | null;
  protesisRemovibleSelection: MultiToothSelectionState | null;
  edentuloTotalSelection: MultiToothSelectionState | null;

  // Handlers para iniciar selección
  startAparatoFijo: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startAparatoRemovible: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startTransposicion: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startProtesisFija: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startProtesisTotal: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startProtesisRemovible: (firstTooth: string, state: 'good' | 'bad', abbreviation?: string) => void;
  startEdentuloTotal: (firstTooth: string, state: 'good' | 'bad') => void;

  // Handlers para completar selección (validar segundo diente)
  completeAparatoFijo: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeAparatoRemovible: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeTransposicion: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeProtesisFija: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeProtesisTotal: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeProtesisRemovible: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;
  completeEdentuloTotal: (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ) => void;

  // Utilidades
  resetAllSelections: () => void;
  hasActiveSelection: () => boolean;
  getActiveSelectionType: () => string | null;
}

/**
 * Hook para gestión de selecciones multi-diente
 *
 * Maneja los 7 tipos de selecciones que requieren 2 dientes:
 * - Aparato Ortodóntico Fijo
 * - Aparato Ortodóntico Removible
 * - Transposición
 * - Prótesis Fija
 * - Prótesis Total
 * - Prótesis Removible (rango)
 * - Edéntulo Total (rango)
 *
 * @returns Estados y handlers para todas las selecciones
 *
 * @example
 * ```tsx
 * const {
 *   aparatoFijoSelection,
 *   startAparatoFijo,
 *   completeAparatoFijo,
 *   resetAllSelections
 * } = useMultiToothSelection();
 *
 * // Iniciar selección desde el menú contextual
 * const handleAparatoFijoClick = (toothNumber: string) => {
 *   startAparatoFijo(toothNumber, 'good', 'OF');
 * };
 *
 * // Completar selección al hacer click en segundo diente
 * const handleToothClick = (toothNumber: string) => {
 *   if (aparatoFijoSelection?.waitingForSecond) {
 *     completeAparatoFijo(toothNumber, (conditions) => {
 *       setToothConditions([...toothConditions, ...conditions]);
 *     });
 *   }
 * };
 * ```
 */
export const useMultiToothSelection = (): UseMultiToothSelectionReturn => {
  // ============================================================================
  // ESTADOS
  // ============================================================================

  const [aparatoFijoSelection, setAparatoFijoSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [aparatoRemovibleSelection, setAparatoRemovibleSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [transposicionSelection, setTransposicionSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [protesisFijaSelection, setProtesisFijaSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [protesisTotalSelection, setProtesisTotalSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [protesisRemovibleSelection, setProtesisRemovibleSelection] =
    useState<MultiToothSelectionState | null>(null);

  const [edentuloTotalSelection, setEdentuloTotalSelection] =
    useState<MultiToothSelectionState | null>(null);

  // ============================================================================
  // HANDLERS - INICIAR SELECCIÓN
  // ============================================================================

  const startAparatoFijo = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setAparatoFijoSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Aparato Fijo', 'ui', { firstTooth, state });
  };

  const startAparatoRemovible = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setAparatoRemovibleSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Aparato Removible', 'ui', { firstTooth, state });
  };

  const startTransposicion = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setTransposicionSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Transposición', 'ui', { firstTooth, state });
  };

  const startProtesisFija = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setProtesisFijaSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Prótesis Fija', 'ui', { firstTooth, state });
  };

  const startProtesisTotal = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setProtesisTotalSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Prótesis Total', 'ui', { firstTooth, state });
  };

  const startProtesisRemovible = (
    firstTooth: string,
    state: 'good' | 'bad',
    abbreviation?: string
  ): void => {
    setProtesisRemovibleSelection({
      firstTooth,
      state,
      abbreviation,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Prótesis Removible', 'ui', { firstTooth, state });
  };

  const startEdentuloTotal = (firstTooth: string, state: 'good' | 'bad'): void => {
    setEdentuloTotalSelection({
      firstTooth,
      state,
      waitingForSecond: true
    });
    logger.db('Iniciada selección de Edéntulo Total', 'ui', { firstTooth, state });
  };

  // ============================================================================
  // HANDLERS - COMPLETAR SELECCIÓN
  // ============================================================================

  const completeAparatoFijo = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!aparatoFijoSelection) return;

    const { firstTooth, state, abbreviation } = aparatoFijoSelection;

    // Validar usando el service
    const validation = ToothConditionService.validateOrthodonticFixedAppliance(
      firstTooth,
      secondTooth
    );

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Crear condiciones usando el service
    const conditions = ToothConditionService.createConnectedToothConditions(
      firstTooth,
      secondTooth,
      'aparato-fijo',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setAparatoFijoSelection(null);
    logger.db('Completada selección de Aparato Fijo', 'ui', { firstTooth, secondTooth });
  };

  const completeAparatoRemovible = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!aparatoRemovibleSelection) return;

    const { firstTooth, state, abbreviation } = aparatoRemovibleSelection;

    // Validar usando el service
    const validation = ToothConditionService.validateOrthodonticRemovableAppliance(
      firstTooth,
      secondTooth
    );

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Crear condiciones usando el service
    const conditions = ToothConditionService.createConnectedToothConditions(
      firstTooth,
      secondTooth,
      'aparato-removible',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setAparatoRemovibleSelection(null);
    logger.db('Completada selección de Aparato Removible', 'ui', { firstTooth, secondTooth });
  };

  const completeTransposicion = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!transposicionSelection) return;

    const { firstTooth, state, abbreviation } = transposicionSelection;

    // Validar usando el service
    const validation = ToothConditionService.validateTransposition(firstTooth, secondTooth);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Crear condiciones usando el service
    const conditions = ToothConditionService.createConnectedToothConditions(
      firstTooth,
      secondTooth,
      'transposicion',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setTransposicionSelection(null);
    logger.db('Completada selección de Transposición', 'ui', { firstTooth, secondTooth });
  };

  const completeProtesisFija = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!protesisFijaSelection) return;

    const { firstTooth, state, abbreviation } = protesisFijaSelection;

    // Validar usando el service
    const validation = ToothConditionService.validateFixedProsthesis(firstTooth, secondTooth);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Crear condiciones usando el service
    const conditions = ToothConditionService.createConnectedToothConditions(
      firstTooth,
      secondTooth,
      'protesis-fija',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setProtesisFijaSelection(null);
    logger.db('Completada selección de Prótesis Fija', 'ui', { firstTooth, secondTooth });
  };

  const completeProtesisTotal = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!protesisTotalSelection) return;

    const { firstTooth, state, abbreviation } = protesisTotalSelection;

    // Validar usando el service
    const validation = ToothConditionService.validateTotalProsthesis(firstTooth, secondTooth);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Crear condiciones usando el service
    const conditions = ToothConditionService.createConnectedToothConditions(
      firstTooth,
      secondTooth,
      'protesis-total',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setProtesisTotalSelection(null);
    logger.db('Completada selección de Prótesis Total', 'ui', { firstTooth, secondTooth });
  };

  const completeProtesisRemovible = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!protesisRemovibleSelection) return;

    const { firstTooth, state, abbreviation } = protesisRemovibleSelection;

    // Validar y calcular rango usando el service
    const result = ToothConditionService.validateAndCalculateRemovableProsthesis(
      firstTooth,
      secondTooth
    );

    if (!result.valid) {
      alert(result.error);
      return;
    }

    // Crear condiciones para el rango usando el service
    const conditions = ToothConditionService.createRangeConditions(
      result.teeth!,
      'protesis-removible',
      state,
      abbreviation
    );

    onSuccess(conditions);
    setProtesisRemovibleSelection(null);
    logger.db('Completada selección de Prótesis Removible', 'ui', {
      firstTooth,
      secondTooth,
      teeth: result.teeth
    });
  };

  const completeEdentuloTotal = (
    secondTooth: string,
    onSuccess: (conditions: ToothCondition[]) => void
  ): void => {
    if (!edentuloTotalSelection) return;

    const { firstTooth, state } = edentuloTotalSelection;

    // Validar y calcular rango usando el service
    const result = ToothConditionService.validateAndCalculateEdentuloTotal(
      firstTooth,
      secondTooth
    );

    if (!result.valid) {
      alert(result.error);
      return;
    }

    // Crear condiciones para el rango usando el service
    const conditions = ToothConditionService.createRangeConditions(
      result.teeth!,
      'edentulo-total',
      state
    );

    onSuccess(conditions);
    setEdentuloTotalSelection(null);
    logger.db('Completada selección de Edéntulo Total', 'ui', {
      firstTooth,
      secondTooth,
      teeth: result.teeth
    });
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Resetea todas las selecciones activas
   */
  const resetAllSelections = (): void => {
    setAparatoFijoSelection(null);
    setAparatoRemovibleSelection(null);
    setTransposicionSelection(null);
    setProtesisFijaSelection(null);
    setProtesisTotalSelection(null);
    setProtesisRemovibleSelection(null);
    setEdentuloTotalSelection(null);
    logger.db('Todas las selecciones reseteadas', 'ui', {});
  };

  /**
   * Verifica si hay alguna selección activa
   */
  const hasActiveSelection = (): boolean => {
    return !!(
      aparatoFijoSelection?.waitingForSecond ||
      aparatoRemovibleSelection?.waitingForSecond ||
      transposicionSelection?.waitingForSecond ||
      protesisFijaSelection?.waitingForSecond ||
      protesisTotalSelection?.waitingForSecond ||
      protesisRemovibleSelection?.waitingForSecond ||
      edentuloTotalSelection?.waitingForSecond
    );
  };

  /**
   * Obtiene el tipo de selección activa
   */
  const getActiveSelectionType = (): string | null => {
    if (aparatoFijoSelection?.waitingForSecond) return 'aparato-fijo';
    if (aparatoRemovibleSelection?.waitingForSecond) return 'aparato-removible';
    if (transposicionSelection?.waitingForSecond) return 'transposicion';
    if (protesisFijaSelection?.waitingForSecond) return 'protesis-fija';
    if (protesisTotalSelection?.waitingForSecond) return 'protesis-total';
    if (protesisRemovibleSelection?.waitingForSecond) return 'protesis-removible';
    if (edentuloTotalSelection?.waitingForSecond) return 'edentulo-total';
    return null;
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Estados
    aparatoFijoSelection,
    aparatoRemovibleSelection,
    transposicionSelection,
    protesisFijaSelection,
    protesisTotalSelection,
    protesisRemovibleSelection,
    edentuloTotalSelection,

    // Handlers para iniciar
    startAparatoFijo,
    startAparatoRemovible,
    startTransposicion,
    startProtesisFija,
    startProtesisTotal,
    startProtesisRemovible,
    startEdentuloTotal,

    // Handlers para completar
    completeAparatoFijo,
    completeAparatoRemovible,
    completeTransposicion,
    completeProtesisFija,
    completeProtesisTotal,
    completeProtesisRemovible,
    completeEdentuloTotal,

    // Utilidades
    resetAllSelections,
    hasActiveSelection,
    getActiveSelectionType
  };
};
