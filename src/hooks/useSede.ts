import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import useSedeStore from '@/store/sedeStore';
import { PermissionService } from '@/services/permissions';
import { ApiAuthService } from '@/services/api/authService'; // 🔧 Usar ApiAuthService (API real)
import type { User, Sede } from '@/types';

/**
 * Hook personalizado para gestión de sedes
 * Proporciona funcionalidades para filtrar y gestionar datos según la sede del usuario
 */
export function useSede() {
  const { user } = useAuthStore();
  const {
    sedeActual,
    establecerSedeActual,
    obtenerSedesActivas,
    obtenerSedePorId,
    cargarSedesDesdeDB
  } = useSedeStore();

  const [sedesDisponibles, setSedesDisponibles] = useState<Sede[]>([]);
  const [cargandoSedes, setCargandoSedes] = useState(true);

  // Cargar sedes desde la base de datos al inicio y luego cargar sedes disponibles
  useEffect(() => {
    const inicializarSedes = async () => {
      setCargandoSedes(true);
      try {
        // Primero cargar sedes desde la DB y ESPERAR a que termine
        const resultado = await cargarSedesDesdeDB();

        // Solo continuar si la carga fue exitosa
        if (resultado.success) {
          // ✅ CORRECCIÓN: Para pacientes, usar las sedes devueltas por la API
          if (user?.role === 'patient') {
            // Las sedes ya están en el resultado de cargarSedesDesdeDB
            const sedesActivas = resultado.data || [];

            const sedesFiltradas = sedesActivas.filter(s => s.estado === 'activa');

            // ✅ FIX: Si no hay sedes con estado 'activa', devolver todas (probablemente usan 'active')
            const sedesFinales = sedesFiltradas.length > 0 ? sedesFiltradas : sedesActivas;

            setSedesDisponibles(sedesFinales);
          } else if (user) {
            cargarSedesDisponibles();
          }
        } else {
          setSedesDisponibles([]);
        }
      } catch (error) {
        setSedesDisponibles([]);
      } finally {
        setCargandoSedes(false);
      }
    };

    if (user) {
      inicializarSedes();
    } else {
      // Si no hay usuario, limpiar las sedes disponibles
      setSedesDisponibles([]);
      setCargandoSedes(false);
    }
  }, [user]); // ✅ Solo depende de user, no de cargarSedesDesdeDB para evitar loops

  const cargarSedesDisponibles = useCallback(() => {
    try {
      // 🔧 CRÍTICO: Usar ApiAuthService (API real) en lugar de AuthService (IndexedDB)
      const sedesAccesibles = ApiAuthService.getUserSedes();

      if (sedesAccesibles.includes('*')) {
        // Usuario puede acceder a todas las sedes
        const todasLasSedes = obtenerSedesActivas();
        setSedesDisponibles(todasLasSedes);
      } else {
        // Usuario solo puede acceder a sedes específicas
        const sedes = sedesAccesibles
          .map(sedeId => obtenerSedePorId(sedeId))
          .filter(sede => sede !== undefined) as Sede[];
        setSedesDisponibles(sedes);
      }

      // Si el usuario tiene una sede asignada y no hay sede actual, establecerla
      if (user?.sedeId && !sedeActual) {
        establecerSedeActual(user.sedeId);
      }
    } catch (error) {
      setSedesDisponibles([]);
    }
  }, [user, sedeActual, obtenerSedesActivas, obtenerSedePorId, establecerSedeActual]);

  /**
   * Filtra datos según la sede del usuario
   * @param data - Array de datos con sedeId opcional
   * @returns Datos filtrados según permisos de sede
   */
  const filtrarPorSede = useCallback(<T extends { sedeId?: string }>(data: T[]): T[] => {
    if (!user) return [];

    return PermissionService.filterDataBySede(user, data);
  }, [user]);

  /**
   * Verifica si el usuario puede acceder a una sede específica
   */
  const puedeAccederSede = useCallback((sedeId: string): boolean => {
    if (!user) return false;

    return PermissionService.canAccessSede(user, sedeId);
  }, [user]);

  /**
   * Cambiar la sede actual (para usuarios con acceso a múltiples sedes)
   */
  const cambiarSede = useCallback((sedeId: string): boolean => {
    if (!puedeAccederSede(sedeId)) {
      return false;
    }

    return establecerSedeActual(sedeId);
  }, [puedeAccederSede, establecerSedeActual]);

  /**
   * Obtener el filtro de sede para consultas
   * Retorna el ID de sede actual o null para usuarios globales
   */
  const obtenerFiltroSede = useCallback((): string | null => {
    if (!user) return null;

    // Usuarios globales (super_admin, pacientes, clientes externos) no tienen filtro
    if (user.role === 'super_admin' ||
        user.role === 'patient' ||
        user.role === 'external_client') {
      return null;
    }

    // Si hay sede actual establecida, usar esa
    if (sedeActual) {
      return sedeActual.id;
    }

    // Si el usuario tiene sede asignada, usar esa
    if (user.sedeId) {
      return user.sedeId;
    }

    return null;
  }, [user, sedeActual]);

  /**
   * Validar si un usuario pertenece a la sede actual
   */
  const usuarioPerteneceSedeActual = useCallback((usuario: User): boolean => {
    const filtroSede = obtenerFiltroSede();

    // Si no hay filtro de sede, el usuario es válido
    if (!filtroSede) return true;

    // Verificar si el usuario pertenece a la sede
    return usuario.sedeId === filtroSede ||
           usuario.sedesAcceso?.includes(filtroSede) ||
           false;
  }, [obtenerFiltroSede]);

  /**
   * Obtener estadísticas de la sede actual
   */
  const obtenerEstadisticasSede = useCallback(() => {
    if (!sedeActual) return null;

    return sedeActual.estadisticas || {
      totalPacientes: 0,
      totalDoctores: 0,
      totalPersonal: 0,
      citasDelDia: 0,
      ingresosMes: 0
    };
  }, [sedeActual]);

  return {
    // Estado
    sedeActual,
    sedesDisponibles,
    cargandoSedes,

    // Funciones
    filtrarPorSede,
    puedeAccederSede,
    cambiarSede,
    obtenerFiltroSede,
    usuarioPerteneceSedeActual,
    obtenerEstadisticasSede,

    // Utilidades
    esSuperAdmin: user?.role === 'super_admin',
    esUsuarioGlobal: user?.role === 'patient' || user?.role === 'external_client',
    tieneMultiplesSedes: (user?.sedesAcceso?.length || 0) > 1 || user?.role === 'super_admin'
  };
}

/**
 * Hook para aplicar filtro de sede a una lista de datos
 */
export function useFiltroSede<T extends { sedeId?: string }>(
  datos: T[],
  aplicarFiltro: boolean = true
): T[] {
  const { filtrarPorSede } = useSede();
  const [datosFiltrados, setDatosFiltrados] = useState<T[]>([]);

  useEffect(() => {
    if (aplicarFiltro) {
      setDatosFiltrados(filtrarPorSede(datos));
    } else {
      setDatosFiltrados(datos);
    }
  }, [datos, aplicarFiltro, filtrarPorSede]);

  return datosFiltrados;
}

/**
 * Hook para obtener selector de sede
 */
export function useSelectorSede() {
  const {
    sedeActual,
    sedesDisponibles,
    cambiarSede,
    tieneMultiplesSedes,
    esSuperAdmin
  } = useSede();

  const mostrarSelector = tieneMultiplesSedes || esSuperAdmin;

  return {
    sedeActual,
    sedesDisponibles,
    cambiarSede,
    mostrarSelector
  };
}