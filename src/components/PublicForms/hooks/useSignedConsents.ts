/**
 * HOOK: useSignedConsents
 * Maneja la carga y filtrado de consentimientos firmados
 * Versión actualizada para usar API en lugar de IndexedDB
 */

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@/types';
import { consentsApiService, type SignedConsent } from '@/services/api/consentsApiService';
import { toast } from 'sonner';

export const useSignedConsents = (user: User | null) => {
  const [consents, setConsents] = useState<SignedConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar consentimientos al montar o cuando cambia el usuario
  useEffect(() => {
    loadConsents();
  }, [user]);

  // Filtrar consentimientos localmente cuando cambia el término de búsqueda
  const filteredConsents = useMemo(() => {
    if (!searchTerm.trim()) {
      return consents;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return consents.filter(consent =>
      consent.consentimientoNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.pacienteNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.pacienteDni.includes(searchTerm) ||
      consent.doctorNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.consentimientoCategoria.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, consents]);

  // Cargar consentimientos firmados desde API
  const loadConsents = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Para pacientes, filtrar por su patient_id. Para otros roles, obtener todos.
      const isPatient = user.role === 'patient';
      const patientId = user.patient_id;

      console.log('[useSignedConsents] Usuario:', {
        id: user.id,
        role: user.role,
        patient_id: patientId,
        isPatient,
        willFilter: isPatient && !!patientId
      });

      const params = isPatient && patientId
        ? { patient_id: patientId, limit: 100 }
        : { limit: 100 };

      console.log('[useSignedConsents] Params enviados:', params);

      const { consents: data } = await consentsApiService.getSignedConsents(params);

      // ====== LOGS DE DIAGNÓSTICO DE FECHA ======
      console.log('📅 [useSignedConsents] FECHAS RECIBIDAS:', {
        total_consents: data.length,
        primeros_3: data.slice(0, 3).map(c => ({
          id: c.id,
          fechaConsentimiento: c.fechaConsentimiento,
          tipo: typeof c.fechaConsentimiento
        }))
      });

      setConsents(data);
    } catch (error) {
      console.error('Error al cargar consentimientos:', error);
      toast.error('Error al cargar los consentimientos firmados');
    } finally {
      setLoading(false);
    }
  };

  // Recargar consentimientos
  const reload = async () => {
    await loadConsents();
  };

  return {
    consents: filteredConsents,
    loading,
    searchTerm,
    setSearchTerm,
    reload
  };
};
