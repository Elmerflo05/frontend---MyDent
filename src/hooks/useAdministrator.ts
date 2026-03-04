import { useCallback, useMemo } from 'react';
import useAdministratorStore from '@/store/administratorStore';
import useSedeStore from '@/store/sedeStore';

export const useAdministrator = () => {
  const store = useAdministratorStore();
  const sedeStore = useSedeStore();

  // Funciones del store
  const {
    administrators,
    loading,
    error,
    obtenerAdministradores,
    obtenerAdministradoresActivos,
    obtenerAdministradorPorId,
    obtenerAdministradorPorEmail,
    obtenerAdministradorPorSede,
    obtenerAdministradoresSinSede,
    crearAdministrador,
    actualizarAdministrador,
    eliminarAdministrador,
    asignarSedeAdministrador,
    desasignarSedeAdministrador,
    buscarAdministradores,
    obtenerEstadisticasAdministradores,
    initializeAdministrators,
    limpiarError
  } = store;

  // Obtener administradores con información de sede
  const obtenerAdministradoresConSede = useCallback(() => {
    const administradores = obtenerAdministradores();
    const sedes = sedeStore.obtenerSedesActivas();

    return administradores.map(admin => {
      if (admin.sedeId) {
        const sede = sedes.find(s => s.id === admin.sedeId);
        return {
          ...admin,
          sede: sede || null
        };
      }
      return admin;
    });
  }, [obtenerAdministradores, sedeStore]);

  // Verificar si un administrador puede ser asignado a una sede
  const puedeAsignarSede = useCallback((adminId: string, sedeId: string) => {
    const adminExistente = obtenerAdministradorPorSede(sedeId);
    return !adminExistente || adminExistente.id === adminId;
  }, [obtenerAdministradorPorSede]);

  // Crear administrador con validaciones adicionales
  const crearAdministradorConValidacion = useCallback(async (adminData: any) => {
    // Verificar que no exista ya un administrador en esa sede si se especifica
    if (adminData.sedeId) {
      const adminExistente = obtenerAdministradorPorSede(adminData.sedeId);
      if (adminExistente) {
        return {
          success: false,
          error: 'Ya existe un administrador asignado a esta sede'
        };
      }
    }

    return crearAdministrador(adminData);
  }, [crearAdministrador, obtenerAdministradorPorSede]);

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    const stats = obtenerEstadisticasAdministradores();
    const sedesActivas = sedeStore.obtenerSedesActivas();

    return {
      ...stats,
      porcentajeSedesConAdmin: sedesActivas.length > 0
        ? Math.round((stats.conSedeAsignada / sedesActivas.length) * 100)
        : 0,
      sedesSinAdministrador: sedesActivas.length - stats.conSedeAsignada
    };
  }, [obtenerEstadisticasAdministradores, sedeStore]);

  // Funciones helper
  const buscarPorTermino = useCallback((termino: string) => {
    return buscarAdministradores({
      searchTerm: termino,
      sedeId: '',
      status: ''
    });
  }, [buscarAdministradores]);

  const obtenerPorEstado = useCallback((estado: string) => {
    return buscarAdministradores({
      searchTerm: '',
      sedeId: '',
      status: estado
    });
  }, [buscarAdministradores]);

  return {
    // Estado
    administrators,
    loading,
    error,
    estadisticas,

    // Funciones básicas
    obtenerAdministradores,
    obtenerAdministradoresActivos,
    obtenerAdministradorPorId,
    obtenerAdministradorPorEmail,
    obtenerAdministradorPorSede,
    obtenerAdministradoresSinSede,

    // Funciones extendidas
    obtenerAdministradoresConSede,
    crearAdministradorConValidacion,
    puedeAsignarSede,

    // Funciones de CRUD
    crearAdministrador,
    actualizarAdministrador,
    eliminarAdministrador,

    // Funciones de asignación
    asignarSedeAdministrador,
    desasignarSedeAdministrador,

    // Funciones de búsqueda
    buscarAdministradores,
    buscarPorTermino,
    obtenerPorEstado,

    // Funciones de utilidad
    initializeAdministrators,
    limpiarError
  };
};

export default useAdministrator;