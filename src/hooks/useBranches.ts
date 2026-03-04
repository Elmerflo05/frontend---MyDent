/**
 * Hook personalizado para gestión de Sedes (Branches)
 * Conecta directamente con la API del backend PostgreSQL
 */

import { useState, useEffect, useCallback } from 'react';
import branchesApi, { type BranchData } from '@/services/api/branchesApi';
import { toast } from 'sonner';

interface UseBranchesReturn {
  branches: BranchData[];
  loading: boolean;
  error: string | null;
  refreshBranches: () => Promise<void>;
  createBranch: (data: BranchData) => Promise<boolean>;
  updateBranch: (id: number, data: Partial<BranchData>) => Promise<boolean>;
  deleteBranch: (id: number) => Promise<boolean>;
}

export function useBranches(): UseBranchesReturn {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga las sedes desde el backend
   */
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await branchesApi.getBranches({ limit: 100 });

      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        console.error('❌ [useBranches] Respuesta sin éxito o sin datos');
        throw new Error('No se pudieron cargar las sedes');
      }
    } catch (err) {
      console.error('❌ [useBranches] Error al cargar sedes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar sedes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca la lista de sedes
   */
  const refreshBranches = useCallback(async () => {
    await fetchBranches();
  }, [fetchBranches]);

  /**
   * Crea una nueva sede
   */
  const createBranch = useCallback(async (data: BranchData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await branchesApi.createBranch(data);

      if (response.success) {
        toast.success('Sede creada exitosamente');
        await fetchBranches(); // Recargar lista
        return true;
      }

      throw new Error(response.message || 'Error al crear sede');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear sede';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  /**
   * Actualiza una sede existente
   */
  const updateBranch = useCallback(async (id: number, data: Partial<BranchData>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await branchesApi.updateBranch(id, data);

      if (response.success) {
        toast.success('Sede actualizada exitosamente');
        await fetchBranches(); // Recargar lista
        return true;
      }

      throw new Error(response.message || 'Error al actualizar sede');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar sede';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  /**
   * Elimina una sede (soft delete)
   */
  const deleteBranch = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await branchesApi.deleteBranch(id);

      if (response.success) {
        toast.success('Sede eliminada exitosamente');
        await fetchBranches(); // Recargar lista
        return true;
      }

      throw new Error(response.message || 'Error al eliminar sede');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar sede';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBranches]);

  // Cargar sedes al montar el componente
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    branches,
    loading,
    error,
    refreshBranches,
    createBranch,
    updateBranch,
    deleteBranch
  };
}

export default useBranches;
