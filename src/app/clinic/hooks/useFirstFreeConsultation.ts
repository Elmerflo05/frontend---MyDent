/**
 * useFirstFreeConsultation Hook
 * Maneja la logica de primera consulta gratis para planes de salud
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { pricingApi } from '@/services/api/pricingApi';

interface FirstFreeConsultationState {
  available: boolean;
  loading: boolean;
  error: string | null;
  usedDate: string | null;
  subscriptionId: number | null;
  planName: string | null;
}

interface UseFirstFreeConsultationReturn {
  // Estado
  state: FirstFreeConsultationState;
  // Acciones
  checkAvailability: (patientId: number) => Promise<boolean>;
  useConsultation: (patientId: number) => Promise<boolean>;
  reset: () => void;
}

const initialState: FirstFreeConsultationState = {
  available: false,
  loading: false,
  error: null,
  usedDate: null,
  subscriptionId: null,
  planName: null
};

export function useFirstFreeConsultation(): UseFirstFreeConsultationReturn {
  const [state, setState] = useState<FirstFreeConsultationState>(initialState);

  /**
   * Verificar si la primera consulta gratis esta disponible para un paciente
   */
  const checkAvailability = useCallback(async (patientId: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await pricingApi.checkFirstFreeConsultation(patientId);

      if (response.success && response.data) {
        const data = response.data;
        setState({
          available: data.available,
          loading: false,
          error: null,
          usedDate: data.used_date || null,
          subscriptionId: data.subscription_id || null,
          planName: data.plan_name || null
        });
        return data.available;
      }

      setState(prev => ({ ...prev, loading: false, available: false }));
      return false;
    } catch (error) {
      console.error('Error checking first free consultation:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al verificar primera consulta gratis'
      }));
      return false;
    }
  }, []);

  /**
   * Usar la primera consulta gratis (marcarla como usada)
   */
  const useConsultation = useCallback(async (patientId: number): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await pricingApi.useFirstFreeConsultation(patientId);

      if (response.success) {
        setState(prev => ({
          ...prev,
          available: false,
          loading: false,
          usedDate: new Date().toISOString()
        }));

        toast.success('Primera consulta gratis aplicada correctamente');
        return true;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: response.message || 'Error al aplicar primera consulta gratis'
      }));

      toast.error(response.message || 'Error al aplicar primera consulta gratis');
      return false;
    } catch (error: any) {
      console.error('Error using first free consultation:', error);

      const errorMessage = error.message || 'Error al aplicar primera consulta gratis';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Resetear el estado
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    checkAvailability,
    useConsultation,
    reset
  };
}

export default useFirstFreeConsultation;
