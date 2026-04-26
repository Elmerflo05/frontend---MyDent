/**
 * HOOK: useSignedConsents
 * Maneja la carga y filtrado de consentimientos firmados
 * Versión actualizada para usar API en lugar de IndexedDB
 */

import { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User } from '@/types';
import { consentsApiService, type SignedConsent } from '@/services/api/consentsApiService';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

export const useSignedConsents = (user: User | null) => {
  const [consents, setConsents] = useState<SignedConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar consentimientos al montar o cuando cambia el usuario
  useEffect(() => {
    loadConsents();
  }, [user]);

  // Sincronización en tiempo real para pacientes (eliminación lógica desde el SA)
  useEffect(() => {
    if (user?.role !== 'patient' || !user?.patient_id) return;

    const socket: Socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join-patient', user.patient_id);
    });

    const onChanged = () => loadConsents();
    socket.on('consent-deleted', onChanged);
    socket.on('consent-updated', onChanged);

    return () => {
      socket.off('consent-deleted', onChanged);
      socket.off('consent-updated', onChanged);
      socket.disconnect();
    };
  }, [user?.role, user?.patient_id]);

  // Refetch cuando la pestaña vuelve al foco (capturar cambios hechos durante ausencia)
  useEffect(() => {
    if (!user?.id) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadConsents();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id]);

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

      const params = isPatient && patientId
        ? { patient_id: patientId, limit: 100 }
        : { limit: 100 };

      const { consents: data } = await consentsApiService.getSignedConsents(params);
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
