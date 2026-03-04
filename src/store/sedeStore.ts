import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validarSede } from '@/models/sede.model';
import { EstadisticasOdontologicasService } from '@/services/estadisticasOdontologicas';
import { SedeAdministratorService } from '@/services/sede/SedeAdministratorService';
import { logger } from '@/lib/logger';
import type { Administrator } from './administratorStore';
import { branchesApi, type BranchData } from '@/services/api/branchesApi';
import { useAuthStore } from './authStore';

// ============================================================================
// MAPPERS: Conversion entre Sede (frontend) y BranchData (backend)
// ============================================================================

/**
 * Convierte Sede (frontend) a BranchData (backend)
 */
const mapSedeToBackend = (sede: Partial<Sede>): Partial<BranchData> => {
  const data: Partial<BranchData> = {};

  if (sede.nombre !== undefined) data.branch_name = sede.nombre;
  if (sede.codigo !== undefined) data.branch_code = sede.codigo;
  if (sede.direccion !== undefined) data.address = sede.direccion;
  if (sede.telefono !== undefined) data.phone = sede.telefono;
  if (sede.email !== undefined) data.email = sede.email;
  if (sede.estado !== undefined) {
    data.status = sede.estado === 'activa' ? 'active' : 'inactive';
  }
  if (sede.configuracion !== undefined) data.configuration = sede.configuracion;

  return data;
};

/**
 * Convierte BranchData (backend) a Sede (frontend)
 */
const mapBackendToSede = (branch: BranchData): Sede => {
  const isActive = branch.status === 'active';

  return {
    id: branch.branch_id!.toString(),
    codigo: branch.branch_code || `BRANCH-${branch.branch_id}`,
    nombre: branch.branch_name || 'Sin nombre',
    direccion: branch.address || '',
    telefono: branch.phone || branch.mobile || '',
    email: branch.email || '',
    estado: isActive ? 'activa' : 'inactiva',
    administradorId: branch.administrator_id?.toString() || null,
    createdAt: branch.date_time_registration || branch.created_at || new Date().toISOString(),
    updatedAt: branch.date_time_modification || branch.updated_at || new Date().toISOString(),
    estadisticas: {},
    configuracion: branch.configuration || {}
  };
};

// ============================================================================
// TYPES
// ============================================================================

export interface Sede {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: 'activa' | 'inactiva' | 'suspendida' | 'eliminada';
  administradorId: string | null;
  administrador?: Administrator; // Populado desde administrator
  estadisticas?: {
    totalPacientes?: number;
    totalDoctores?: number;
    totalPersonal?: number;
    citasDelDia?: number;
    ingresosMes?: number;
    [key: string]: any;
  };
  configuracion?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SedeValidationResult {
  esValido: boolean;
  errores: string[];
}

export interface SedeOperationResult<T = Sede> {
  success: boolean;
  data?: T;
  error?: string | string[];
}

export interface GlobalStatistics {
  totalSedes: number;
  totalPacientes: number;
  totalDoctores: number;
  totalPersonal: number;
  citasDelDia: number;
  ingresosMes: number;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SedeState {
  sedes: Sede[];
  sedeActual: Sede | null;
  loading: boolean;
  error: string | null;
}

interface SedeActions {
  // Carga desde API
  cargarSedesDesdeDB: () => Promise<SedeOperationResult<Sede[]>>;

  // Obtencion
  obtenerSedes: () => Sede[];
  obtenerSedesActivas: () => Sede[];
  obtenerSedePorId: (id: string) => Sede | undefined;
  obtenerSedePorCodigo: (codigo: string) => Sede | undefined;
  establecerSedeActual: (sedeId: string) => boolean;

  // CRUD - MIGRADO: Ahora todos son async y usan API
  crearSede: (datosSede: Partial<Sede>) => Promise<SedeOperationResult>;
  actualizarSede: (id: string, datosActualizados: Partial<Sede>) => Promise<SedeOperationResult>;
  cambiarEstadoSede: (id: string, nuevoEstado: Sede['estado']) => Promise<SedeOperationResult>;
  eliminarSede: (id: string) => Promise<SedeOperationResult>;

  // Estadísticas y Configuración
  actualizarEstadisticas: (id: string, estadisticas: Partial<Sede['estadisticas']>) => SedeOperationResult;
  actualizarConfiguracion: (id: string, configuracion: Partial<Sede['configuracion']>) => SedeOperationResult;
  obtenerEstadisticasGlobales: () => GlobalStatistics;
  obtenerEstadisticasOdontologicasGlobales: () => Promise<any>;
  obtenerEstadisticasOdontologicasSede: (sedeId: string) => Promise<any>;
  recalcularEstadisticasOdontologicas: () => Promise<void>;

  // Gestión de Administradores
  asignarAdministradorSede: (sedeId: string, administradorId: string) => Promise<SedeOperationResult>;
  desasignarAdministradorSede: (sedeId: string) => Promise<SedeOperationResult>;
  obtenerSedesSinAdministrador: () => Sede[];
  crearSedeConAdministrador: (
    datosSede: Partial<Sede>,
    datosAdministrador?: any
  ) => Promise<SedeOperationResult<{ sede: Sede; administrador?: Administrator }>>;

  // Utilidades
  limpiarStore: () => void;
}

type SedeStore = SedeState & SedeActions;

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSedeStore = create<SedeStore>()(
  persist(
    (set, get) => {
      return {
        // ========================================================================
        // STATE
        // ========================================================================
        sedes: [],
        sedeActual: null,
        loading: false,
        error: null,

      // ========================================================================
      // ACTIONS
      // ========================================================================

      /**
       * Carga sedes desde la API real del backend
       * 🔧 MIGRADO: Ahora usa branchesApi en lugar de IndexedDB
       * 🔒 SEGURIDAD: Solo carga todas las sedes si el usuario tiene permisos administrativos
       */
      cargarSedesDesdeDB: async () => {
        logger.store('sedeStore', '🔄 Cargando sedes desde API (backend real)');
        set({ loading: true, error: null });

        try {
          // 🔒 CRÍTICO: Verificar permisos del usuario antes de cargar
          const { user } = useAuthStore.getState();

          if (!user) {
            logger.warn('⚠️ [sedeStore] No hay usuario autenticado, omitiendo carga de sedes');
            set({ loading: false, error: null });
            return { success: true, data: [] };
          }

          // 🔒 Verificar si el usuario tiene permisos administrativos
          const rolesConPermisoSedes = ['super_admin', 'admin', 'doctor', 'receptionist', 'imaging_technician'];
          const tienePermisoSedes = rolesConPermisoSedes.includes(user.role);

          if (!tienePermisoSedes) {
            // ✅ CAMBIO: Para pacientes y clientes externos, usar endpoint público
            logger.info(`🔓 [sedeStore] Usuario con rol "${user.role}" cargará sedes desde endpoint público`);

            try {
              // Usar endpoint público que permite a pacientes consultar sedes activas
              const publicBranches = await branchesApi.getPublicActiveBranches();

              if (!publicBranches || !Array.isArray(publicBranches)) {
                throw new Error('Formato de respuesta inválido del endpoint público');
              }

              logger.info('✅ Sedes públicas cargadas:', { count: publicBranches.length });

              // Mapear BranchData a formato Sede
              const sedesMapeadas: Sede[] = publicBranches.map((branch: BranchData) => {
                const isActive = branch.status === 'active' || branch.is_active === true;

                return {
                  id: branch.branch_id!.toString(),
                  codigo: branch.branch_code || `BRANCH-${branch.branch_id}`,
                  nombre: branch.branch_name || 'Sin nombre',
                  direccion: branch.address || '',
                  telefono: branch.phone || branch.mobile || '',
                  email: branch.email || '',
                  estado: isActive ? 'activa' as const : 'inactiva' as const,
                  administradorId: null,
                  createdAt: branch.date_time_registration || branch.created_at || new Date().toISOString(),
                  updatedAt: branch.date_time_modification || branch.updated_at || new Date().toISOString(),
                  estadisticas: {},
                  configuracion: branch.configuration || {}
                };
              });

              set({ sedes: sedesMapeadas, loading: false, error: null });

              logger.store('sedeStore', '✅ Sedes públicas cargadas y almacenadas', { count: sedesMapeadas.length });

              return { success: true, data: sedesMapeadas };
            } catch (error) {
              logger.error('❌ Error cargando sedes desde endpoint público:', error);

              // En caso de error, devolver array vacío
              set({ sedes: [], loading: false, error: 'Error cargando sedes' });
              return { success: false, data: [], error: 'Error cargando sedes públicas' };
            }
          }

          // 🔥 Usuario con permisos administrativos: cargar todas las sedes desde API
          logger.info(`✅ [sedeStore] Usuario con rol "${user.role}" tiene permiso para ver todas las sedes`);
          const response = await branchesApi.getBranches({ limit: 100 });

          if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Formato de respuesta inválido: data no es un array');
          }

          logger.info('✅ Sedes cargadas desde API:', { count: response.data.length });

          // Mapear BranchData a formato Sede del store
          const sedesMapeadas: Sede[] = response.data
            .filter((branch: BranchData) => {
              // Filtrar branches que no tengan ID válido
              if (!branch.branch_id) {
                return false;
              }
              return true;
            })
            .map((branch: BranchData) => {
              // 🔧 CRÍTICO: El backend usa "status" no "is_active"
              // Primero intentar con status (campo real), luego con is_active (legacy)
              const isActive = branch.status === 'active' || branch.is_active === true;

              const sede: Sede = {
                id: branch.branch_id!.toString(),
                codigo: branch.branch_code || `BRANCH-${branch.branch_id}`,
                nombre: branch.branch_name || 'Sin nombre',
                direccion: branch.address || '',
                telefono: branch.phone || branch.mobile || '',
                email: branch.email || '',
                estado: isActive ? 'activa' as const : 'inactiva' as const,
                administradorId: null, // Se pobla después si es necesario
                createdAt: branch.date_time_registration || branch.created_at || new Date().toISOString(),
                updatedAt: branch.date_time_modification || branch.updated_at || new Date().toISOString(),
                estadisticas: {},
                configuracion: branch.configuration || {}
              };

              return sede;
            });

          set({
            sedes: sedesMapeadas,
            loading: false,
            error: null
          });

          logger.store('sedeStore', '✅ Sedes mapeadas y almacenadas desde API', { count: sedesMapeadas.length });

          return { success: true, data: sedesMapeadas };
        } catch (error) {
          const errorMsg = 'Error cargando sedes desde la API';
          logger.error('❌ Error cargando sedes desde API:', error);

          set({
            loading: false,
            error: errorMsg
          });

          return {
            success: false,
            error: error instanceof Error ? error.message : errorMsg
          };
        }
      },

      /**
       * Obtiene todas las sedes (excluye eliminadas)
       * Popula la información del administrador si existe
       */
      obtenerSedes: () => {
        const state = get();
        const sedes = state.sedes.filter(s => s.estado !== 'eliminada');

        // Poplar información del administrador para cada sede
        // NOTA: Para mejor performance, considera usar SedeAdministratorService.getAllSedesWithAdministrators()
        return sedes.map(sede => {
          if (sede.administradorId) {
            // El administrador ya debería estar en la DB
            // Si necesitas popularlo, usa SedeAdministratorService
            return sede;
          }
          return sede;
        });
      },

      /**
       * Obtiene solo sedes activas
       */
      obtenerSedesActivas: () => {
        const state = get();
        const sedesActivas = state.sedes.filter(s => s.estado === 'activa');

        logger.debug('Sedes activas encontradas', {
          activas: sedesActivas.length,
          total: state.sedes.length
        });

        return sedesActivas;
      },

      /**
       * Busca una sede por ID
       */
      obtenerSedePorId: (id: string) => {
        const state = get();
        return state.sedes.find(s => s.id === id);
      },

      /**
       * Busca una sede por código
       */
      obtenerSedePorCodigo: (codigo: string) => {
        const state = get();
        return state.sedes.find(s => s.codigo === codigo);
      },

      /**
       * Establece la sede actual
       */
      establecerSedeActual: (sedeId: string) => {
        const sede = get().obtenerSedePorId(sedeId);
        if (sede) {
          set({ sedeActual: sede });
          logger.store('sedeStore', 'Sede actual establecida', { sedeId });
          return true;
        }
        logger.warn('Sede no encontrada para establecer como actual', { sedeId });
        return false;
      },

      /**
       * Crea una nueva sede
       * MIGRADO: Usa branchesApi.createBranch() en lugar de modelo local
       */
      crearSede: async (datosSede: Partial<Sede>): Promise<SedeOperationResult> => {
        logger.store('sedeStore', 'Creando sede via API', { nombre: datosSede.nombre });
        set({ loading: true, error: null });

        const validacion = validarSede(datosSede);
        if (!validacion.esValido) {
          const errorMsg = validacion.errores.join(', ');
          set({ loading: false, error: errorMsg });
          logger.warn('Validacion fallo al crear sede', validacion.errores);
          return { success: false, error: validacion.errores };
        }

        try {
          // Convertir a formato backend
          const backendData = mapSedeToBackend(datosSede) as BranchData;

          // Crear en backend
          const response = await branchesApi.createBranch(backendData);

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al crear sede');
          }

          // Convertir respuesta a formato frontend
          const nuevaSede = mapBackendToSede(response.data);

          set((state) => ({
            sedes: [...state.sedes, nuevaSede],
            loading: false,
            error: null
          }));

          logger.store('sedeStore', 'Sede creada exitosamente via API', { id: nuevaSede.id });
          return { success: true, data: nuevaSede };

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al crear sede';
          set({ loading: false, error: errorMsg });
          logger.error('Error creando sede via API:', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Actualiza una sede existente
       * MIGRADO: Usa branchesApi.updateBranch() en lugar de actualizacion local
       */
      actualizarSede: async (id: string, datosActualizados: Partial<Sede>): Promise<SedeOperationResult> => {
        logger.store('sedeStore', 'Actualizando sede via API', { id });
        set({ loading: true, error: null });

        const sedeActual = get().sedes.find(s => s.id === id);
        if (!sedeActual) {
          const errorMsg = 'Sede no encontrada';
          set({ loading: false, error: errorMsg });
          logger.warn('Sede no encontrada para actualizar', { id });
          return { success: false, error: errorMsg };
        }

        try {
          // Convertir a formato backend
          const backendData = mapSedeToBackend(datosActualizados);

          // Actualizar en backend
          const response = await branchesApi.updateBranch(parseInt(id), backendData);

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Error al actualizar sede');
          }

          // Convertir respuesta a formato frontend
          const sedeActualizada = mapBackendToSede(response.data);

          set((state) => ({
            sedes: state.sedes.map(s => s.id === id ? sedeActualizada : s),
            sedeActual: state.sedeActual?.id === id ? sedeActualizada : state.sedeActual,
            loading: false,
            error: null
          }));

          logger.store('sedeStore', 'Sede actualizada exitosamente via API', { id });
          return { success: true, data: sedeActualizada };

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar sede';
          set({ loading: false, error: errorMsg });
          logger.error('Error actualizando sede via API:', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Cambia el estado de una sede
       * MIGRADO: Ahora es async porque actualizarSede usa API
       */
      cambiarEstadoSede: async (id: string, nuevoEstado: Sede['estado']): Promise<SedeOperationResult> => {
        const estadosValidos: Sede['estado'][] = ['activa', 'inactiva', 'suspendida'];
        if (!estadosValidos.includes(nuevoEstado)) {
          logger.warn('Estado no valido', { estado: nuevoEstado });
          return { success: false, error: 'Estado no valido' };
        }

        return await get().actualizarSede(id, { estado: nuevoEstado });
      },

      /**
       * Elimina una sede
       * MIGRADO: Usa branchesApi.deleteBranch() (soft delete en backend)
       */
      eliminarSede: async (id: string): Promise<SedeOperationResult> => {
        logger.store('sedeStore', 'Eliminando sede via API', { id });
        set({ loading: true, error: null });

        const sede = get().obtenerSedePorId(id);
        if (!sede) {
          set({ loading: false });
          logger.warn('Sede no encontrada para eliminar', { id });
          return { success: false, error: 'Sede no encontrada' };
        }

        try {
          // Eliminar en backend (soft delete)
          await branchesApi.deleteBranch(parseInt(id));

          // Remover del estado local
          set((state) => ({
            sedes: state.sedes.filter(s => s.id !== id),
            sedeActual: state.sedeActual?.id === id ? null : state.sedeActual,
            loading: false,
            error: null
          }));

          logger.store('sedeStore', 'Sede eliminada exitosamente via API', { id });
          return { success: true };

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al eliminar sede';
          set({ loading: false, error: errorMsg });
          logger.error('Error eliminando sede via API:', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Actualiza las estadísticas de una sede
       * Hace merge con las estadísticas existentes
       */
      actualizarEstadisticas: (id: string, estadisticas: Partial<Sede['estadisticas']>) => {
        const sede = get().obtenerSedePorId(id);
        if (!sede) {
          logger.warn('Sede no encontrada para actualizar estadísticas', { id });
          return { success: false, error: 'Sede no encontrada' };
        }

        return get().actualizarSede(id, {
          estadisticas: {
            ...sede.estadisticas,
            ...estadisticas
          }
        });
      },

      /**
       * Actualiza la configuración de una sede
       * Hace merge con la configuración existente
       */
      actualizarConfiguracion: (id: string, configuracion: Partial<Sede['configuracion']>) => {
        const sede = get().obtenerSedePorId(id);
        if (!sede) {
          logger.warn('Sede no encontrada para actualizar configuración', { id });
          return { success: false, error: 'Sede no encontrada' };
        }

        return get().actualizarSede(id, {
          configuracion: {
            ...sede.configuracion,
            ...configuracion
          }
        });
      },

      /**
       * Obtiene estadísticas globales sumando las de todas las sedes activas
       */
      obtenerEstadisticasGlobales: () => {
        const sedes = get().obtenerSedesActivas();

        return sedes.reduce(
          (totales, sede) => ({
            totalSedes: totales.totalSedes + 1,
            totalPacientes: totales.totalPacientes + (sede.estadisticas?.totalPacientes || 0),
            totalDoctores: totales.totalDoctores + (sede.estadisticas?.totalDoctores || 0),
            totalPersonal: totales.totalPersonal + (sede.estadisticas?.totalPersonal || 0),
            citasDelDia: totales.citasDelDia + (sede.estadisticas?.citasDelDia || 0),
            ingresosMes: totales.ingresosMes + (sede.estadisticas?.ingresosMes || 0)
          }),
          {
            totalSedes: 0,
            totalPacientes: 0,
            totalDoctores: 0,
            totalPersonal: 0,
            citasDelDia: 0,
            ingresosMes: 0
          }
        );
      },

      /**
       * Obtiene estadísticas odontológicas globales (calculadas dinámicamente desde DB)
       */
      obtenerEstadisticasOdontologicasGlobales: async () => {
        return await EstadisticasOdontologicasService.calcularEstadisticasGlobales();
      },

      /**
       * Obtiene estadísticas odontológicas de una sede (calculadas dinámicamente desde DB)
       */
      obtenerEstadisticasOdontologicasSede: async (sedeId: string) => {
        return await EstadisticasOdontologicasService.calcularEstadisticasSede(sedeId);
      },

      /**
       * Recalcula y actualiza estadísticas odontológicas de todas las sedes
       */
      recalcularEstadisticasOdontologicas: async () => {
        logger.store('sedeStore', 'Recalculando estadísticas odontológicas');

        await EstadisticasOdontologicasService.actualizarTodasLasEstadisticas();

        // Recargar sedes desde la DB para obtener las estadísticas actualizadas
        await get().cargarSedesDesdeDB();

        logger.store('sedeStore', 'Estadísticas odontológicas recalculadas');
      },

      /**
       * Asigna un administrador a una sede
       * USA SedeAdministratorService para manejar la transacción atómica
       */
      asignarAdministradorSede: async (sedeId: string, administradorId: string) => {
        logger.store('sedeStore', 'Asignando administrador a sede', {
          sedeId,
          administradorId
        });

        const sede = get().obtenerSedePorId(sedeId);
        if (!sede) {
          logger.warn('Sede no encontrada', { sedeId });
          return { success: false, error: 'Sede no encontrada' };
        }

        // Usar el servicio para manejar la asignación bidireccional
        const resultado = await SedeAdministratorService.assignAdministratorToSede(
          sedeId,
          administradorId
        );

        if (resultado.success) {
          // Actualizar el store local con la sede actualizada
          get().actualizarSede(sedeId, { administradorId });
          logger.store('sedeStore', 'Administrador asignado exitosamente', {
            sedeId,
            administradorId
          });
        }

        return resultado;
      },

      /**
       * Desasigna un administrador de una sede
       * USA SedeAdministratorService para manejar la transacción atómica
       */
      desasignarAdministradorSede: async (sedeId: string) => {
        logger.store('sedeStore', 'Desasignando administrador de sede', { sedeId });

        const sede = get().obtenerSedePorId(sedeId);
        if (!sede) {
          logger.warn('Sede no encontrada', { sedeId });
          return { success: false, error: 'Sede no encontrada' };
        }

        const administradorId = sede.administradorId;

        // Usar el servicio para manejar la desasignación bidireccional
        const resultado = await SedeAdministratorService.unassignAdministratorFromSede(sedeId);

        if (resultado.success) {
          // Actualizar el store local
          get().actualizarSede(sedeId, { administradorId: null });
          logger.store('sedeStore', 'Administrador desasignado exitosamente', {
            sedeId,
            administradorId
          });
        }

        return resultado;
      },

      /**
       * Obtiene sedes sin administrador asignado
       */
      obtenerSedesSinAdministrador: () => {
        const sedes = get().obtenerSedesActivas();
        return sedes.filter(sede => !sede.administradorId);
      },

      /**
       * Crea una sede con un administrador asignado
       * Usa transacciones para asegurar consistencia
       * Hace rollback si algo falla
       */
      crearSedeConAdministrador: async (
        datosSede: Partial<Sede>,
        datosAdministrador: any = null
      ) => {
        logger.store('sedeStore', 'Creando sede con administrador', {
          sede: datosSede.nombre
        });
        set({ loading: true, error: null });

        // Primero crear la sede
        const resultadoSede = get().crearSede(datosSede);

        if (!resultadoSede.success) {
          return resultadoSede as any;
        }

        // Si se proporcionaron datos del administrador, crearlo y asignarlo
        if (datosAdministrador) {
          try {
            // Importar dinámicamente para evitar dependencia circular
            const { useAdministratorStore } = await import('./administratorStore');
            const adminStore = useAdministratorStore.getState();

            // Asignar la sede al administrador
            const datosAdminCompletos = {
              ...datosAdministrador,
              sedeId: resultadoSede.data!.id
            };

            const resultadoAdmin = adminStore.crearAdministrador(datosAdminCompletos);

            if (resultadoAdmin.success) {
              // Asignar el administrador a la sede usando el servicio
              const resultadoAsignacion = await SedeAdministratorService.assignAdministratorToSede(
                resultadoSede.data!.id,
                resultadoAdmin.data!.id
              );

              if (resultadoAsignacion.success) {
                // Actualizar el store local
                get().actualizarSede(resultadoSede.data!.id, {
                  administradorId: resultadoAdmin.data!.id
                });

                set({ loading: false });
                logger.store('sedeStore', 'Sede con administrador creada exitosamente');

                return {
                  success: true,
                  data: {
                    sede: resultadoAsignacion.data?.sede,
                    administrador: resultadoAsignacion.data?.administrador
                  }
                };
              }
            }

            // Si falló, eliminar la sede creada (rollback)
            get().eliminarSede(resultadoSede.data!.id);
            set({ loading: false, error: resultadoAdmin.error as string });
            logger.warn('Falló creación de administrador, eliminando sede', {
              sedeId: resultadoSede.data!.id
            });
            return resultadoAdmin as any;
          } catch (error) {
            // Rollback: eliminar la sede creada
            get().eliminarSede(resultadoSede.data!.id);
            const errorMsg = 'Error creando administrador';
            set({ loading: false, error: errorMsg });
            logger.error('Error en crearSedeConAdministrador', error);
            return { success: false, error: errorMsg };
          }
        }

        set({ loading: false });
        return resultadoSede as any;
      },

      /**
       * Limpia el store por completo
       */
      limpiarStore: () => {
        logger.store('sedeStore', 'Limpiando store');
        set({
          sedes: [],
          sedeActual: null,
          loading: false,
          error: null
        });
      }
    };
    },
    {
      name: 'sede-storage',
      partialize: (state) => {
        // 🔒 NO persistir sedes para pacientes (se cargan dinámicamente desde API)
        const { user } = useAuthStore.getState();
        if (user?.role === 'patient' || user?.role === 'external_client') {
          // Para pacientes, NO guardar sedes en localStorage
          return {
            sedes: [], // Siempre vacío para forzar recarga desde API
            sedeActual: null
          };
        }

        // Para otros roles, persistir normalmente
        return {
          sedes: state.sedes,
          sedeActual: state.sedeActual
        };
      }
    }
  )
);

// ============================================================================
// DEFAULT EXPORT (compatibilidad con código antiguo)
// ============================================================================

export default useSedeStore;
