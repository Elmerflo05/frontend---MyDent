/**
 * HOOK: useConsentTemplates
 * Maneja la carga de templates de consentimiento desde la API
 */

import { useState, useEffect, useMemo } from 'react';
import { consentsApiService, type ConsentTemplate } from '@/services/api/consentsApiService';
import { toast } from 'sonner';

export const useConsentTemplates = () => {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');

  // Cargar templates al montar
  useEffect(() => {
    loadTemplates();
  }, []);

  // Cargar templates desde la API
  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const { templates: data } = await consentsApiService.getTemplates({ limit: 100 });
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar templates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const uniqueCategories = Array.from(new Set(templates.map(t => t.categoria)));
    return ['all', ...uniqueCategories.sort()];
  }, [templates]);

  // Filtrar templates por categoría seleccionada
  const templatesFiltrados = useMemo(() => {
    if (selectedCategoria === 'all') {
      return templates;
    }
    return templates.filter(t => t.categoria === selectedCategoria);
  }, [templates, selectedCategoria]);

  return {
    templates: templatesFiltrados,
    allTemplates: templates,
    categorias,
    selectedCategoria,
    setSelectedCategoria,
    loading,
    error,
    reload: loadTemplates
  };
};
