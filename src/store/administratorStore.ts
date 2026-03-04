import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TEST_USERS_CONFIG } from '@/constants/seedData';
import { logger } from '@/lib/logger';
import { usersApi, type UserData } from '@/services/api/usersApi';

// ============================================================================
// TYPES
// ============================================================================

export interface Administrator {
  id: string;
  email: string;
  password: string;
  role: 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  sedeId: string | null;
  sedeName?: string | null; // ✅ Nombre de la sede desde el backend
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    department: string;
    licenseNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdministratorValidationResult {
  esValido: boolean;
  errores: string[];
}

export interface AdministratorSearchFilters {
  searchTerm?: string;
  sedeId?: string | 'all';
  status?: string | 'all';
}

export interface AdministratorStatistics {
  total: number;
  activos: number;
  inactivos: number;
  suspendidos: number;
  conSedeAsignada: number;
  sinSedeAsignada: number;
}

export interface AdministratorOperationResult<T = Administrator> {
  success: boolean;
  data?: T;
  error?: string | string[];
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface AdministratorState {
  administrators: Administrator[];
  loading: boolean;
  error: string | null;
}

interface AdministratorActions {
  // Inicialización
  initializeAdministrators: () => Promise<void>;

  // Obtención
  obtenerAdministradores: () => Administrator[];
  obtenerAdministradoresActivos: () => Administrator[];
  obtenerAdministradorPorId: (id: string) => Administrator | undefined;
  obtenerAdministradorPorEmail: (email: string) => Administrator | undefined;
  obtenerAdministradorPorSede: (sedeId: string) => Administrator | undefined;
  obtenerAdministradoresSinSede: () => Administrator[];

  // Validación
  validarAdministrador: (adminData: Partial<Administrator>) => AdministratorValidationResult;

  // CRUD (✅ Conectados con backend)
  crearAdministrador: (adminData: Partial<Administrator>) => Promise<AdministratorOperationResult>;
  actualizarAdministrador: (id: string, datosActualizados: Partial<Administrator>) => Promise<AdministratorOperationResult>;
  cambiarEstadoAdministrador: (id: string, nuevoEstado: Administrator['status']) => Promise<AdministratorOperationResult>;
  eliminarAdministrador: (id: string) => Promise<AdministratorOperationResult>;

  // Asignación de sede
  asignarSedeAdministrador: (adminId: string, sedeId: string) => Promise<AdministratorOperationResult>;
  desasignarSedeAdministrador: (adminId: string) => Promise<AdministratorOperationResult>;

  // Búsqueda
  buscarAdministradores: (filtros: AdministratorSearchFilters) => Administrator[];

  // Estadísticas
  obtenerEstadisticasAdministradores: () => AdministratorStatistics;

  // Utilidades
  limpiarStore: () => void;
  limpiarError: () => void;
}

type AdministratorStore = AdministratorState & AdministratorActions;

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAdministratorStore = create<AdministratorStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // STATE
      // ========================================================================
      administrators: [],
      loading: false,
      error: null,

      // ========================================================================
      // ACTIONS
      // ========================================================================

      /**
       * Inicializa administradores desde backend
       * ✅ Carga usuarios con role_id = 2 (Administrador de Sede) desde PostgreSQL
       * 🔒 Solo permite carga si el usuario tiene permisos administrativos
       */
      initializeAdministrators: async () => {
        logger.store('administratorStore', 'Inicializando administradores desde API');
        set({ loading: true, error: null });

        try {
          // 🔒 Importar authStore dinámicamente para evitar dependencia circular
          const { useAuthStore } = await import('./authStore');
          const { user } = useAuthStore.getState();

          // 🔒 Verificar que el usuario tenga permisos para ver administradores
          const rolesConPermiso = ['super_admin', 'admin', 'doctor', 'receptionist'];
          if (!user || !rolesConPermiso.includes(user.role)) {
            logger.info(`🔒 [administratorStore] Usuario con rol "${user?.role || 'ninguno'}" NO tiene permiso para ver administradores`);
            set({ administrators: [], loading: false, error: null });
            return;
          }

          // ✅ Obtener usuarios con role_id = 2 desde backend
          // includeInactive = true para incluir administradores sin sede (status != 'active')
          const usersData = await usersApi.getUsersByRole(2, undefined, true);

          const administrators: Administrator[] = usersData.map((user): Administrator => ({
            id: user.user_id!.toString(),
            email: user.email,
            password: '', // No almacenar password en frontend
            role: 'admin',
            status: user.status || 'inactive',
            sedeId: user.branch_id?.toString() || null,
            sedeName: user.branch_name || null, // ✅ Mapear branch_name desde el backend
            profile: {
              firstName: user.first_name,
              lastName: user.last_name,
              phone: user.phone || '',
              department: 'Administración',
              licenseNumber: `ADM${user.user_id}`
            },
            createdAt: user.date_time_registration || user.created_at || new Date().toISOString(),
            updatedAt: user.date_time_modification || user.updated_at || new Date().toISOString()
          }));

          set({ administrators, loading: false, error: null });
          logger.store('administratorStore', `✅ Cargados ${administrators.length} administradores desde BD`);
        } catch (error: any) {
          logger.error('❌ Error al cargar administradores desde API', error);
          set({ loading: false, error: error.message || 'Error al cargar administradores' });

          // Fallback a seedData solo en caso de error
          logger.store('administratorStore', 'Fallback: Cargando desde seedData');
          const adminUsers = Object.values(TEST_USERS_CONFIG)
            .filter((user: any) => user.role === 'admin')
            .map((user: any, index: number): Administrator => ({
              id: `admin_${user.email.split('@')[0]}_${index}`,
              email: user.email,
              password: user.password,
              role: 'admin',
              status: 'active',
              sedeId: user.sedeId || null,
              profile: {
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                phone: user.profile.phone || '+51 999 000 000',
                department: user.profile.department,
                licenseNumber: user.profile.licenseNumber
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));

          set({ administrators: adminUsers, loading: false });
        }
      },

      /**
       * Obtiene todos los administradores (excluye deleted)
       */
      obtenerAdministradores: () => {
        const state = get();
        return state.administrators.filter(admin => admin.status !== 'deleted');
      },

      /**
       * Obtiene solo administradores activos
       */
      obtenerAdministradoresActivos: () => {
        const state = get();
        return state.administrators.filter(admin => admin.status === 'active');
      },

      /**
       * Busca un administrador por ID
       */
      obtenerAdministradorPorId: (id: string) => {
        const state = get();
        return state.administrators.find(admin => admin.id === id);
      },

      /**
       * Busca un administrador por email
       */
      obtenerAdministradorPorEmail: (email: string) => {
        const state = get();
        return state.administrators.find(admin => admin.email === email);
      },

      /**
       * Busca un administrador activo por sede
       */
      obtenerAdministradorPorSede: (sedeId: string) => {
        const state = get();
        return state.administrators.find(
          admin => admin.sedeId === sedeId && admin.status === 'active'
        );
      },

      /**
       * Obtiene administradores activos sin sede asignada
       */
      obtenerAdministradoresSinSede: () => {
        const state = get();
        return state.administrators.filter(
          admin => !admin.sedeId && admin.status === 'active'
        );
      },

      /**
       * Valida datos de un administrador
       * Realiza 5 validaciones:
       * 1. firstName requerido
       * 2. lastName requerido
       * 3. email requerido y formato válido
       * 4. phone requerido
       * 5. password requerido (solo para nuevos) y mínimo 8 caracteres
       * 6. email único
       */
      validarAdministrador: (adminData: Partial<Administrator>) => {
        const errores: string[] = [];

        // Validación 1: firstName
        if (!adminData.profile?.firstName?.trim()) {
          errores.push('El nombre es requerido');
        }

        // Validación 2: lastName
        if (!adminData.profile?.lastName?.trim()) {
          errores.push('El apellido es requerido');
        }

        // Validación 3: email formato
        if (!adminData.email?.trim()) {
          errores.push('El email es requerido');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
          errores.push('El email no es válido');
        }

        // Validación 4: phone
        if (!adminData.profile?.phone?.trim()) {
          errores.push('El teléfono es requerido');
        }

        // Validación 5: password (solo para nuevos admins)
        if (!adminData.password?.trim() && !adminData.id) {
          errores.push('La contraseña es requerida');
        }

        if (adminData.password && adminData.password.length < 8) {
          errores.push('La contraseña debe tener al menos 8 caracteres');
        }

        // Validación 6: email único
        const existingAdmin = get().obtenerAdministradorPorEmail(adminData.email!);
        if (existingAdmin && existingAdmin.id !== adminData.id) {
          errores.push('Ya existe un administrador con este email');
        }

        return {
          esValido: errores.length === 0,
          errores
        };
      },

      /**
       * Crea un nuevo administrador
       * ✅ Conectado 100% con backend y base de datos PostgreSQL
       */
      crearAdministrador: async (adminData: Partial<Administrator>) => {
        logger.store('administratorStore', 'Creando administrador via API', { email: adminData.email });
        set({ loading: true, error: null });

        const validacion = get().validarAdministrador(adminData);
        if (!validacion.esValido) {
          const errorMsg = validacion.errores.join(', ');
          set({ loading: false, error: errorMsg });
          logger.warn('Validación falló al crear administrador', validacion.errores);
          return { success: false, error: validacion.errores };
        }

        try {
          // ✅ Crear usuario en backend con role_id = 2 (Administrador de Sede)
          const userData: UserData & { password: string } = {
            role_id: 2, // Administrador de Sede
            branch_id: adminData.sedeId ? parseInt(adminData.sedeId) : undefined,
            username: adminData.email!.split('@')[0], // username desde email
            email: adminData.email!,
            password: adminData.password!,
            first_name: adminData.profile!.firstName,
            last_name: adminData.profile!.lastName,
            phone: adminData.profile!.phone,
            status: adminData.status || 'active',
            profile: {
              department: 'Administración'
            }
          };

          const response = await usersApi.createUser(userData);

          // Mapear respuesta del backend al formato del store
          const nuevoAdmin: Administrator = {
            id: response.data.user_id!.toString(),
            email: response.data.email,
            password: '', // No almacenar password en frontend
            role: 'admin',
            status: response.data.status || 'inactive',
            sedeId: response.data.branch_id?.toString() || null,
            sedeName: response.data.branch_name || null, // ✅ Mapear branch_name desde el backend
            profile: {
              firstName: response.data.first_name,
              lastName: response.data.last_name,
              phone: response.data.phone || '',
              department: 'Administración',
              licenseNumber: `ADM${response.data.user_id}`
            },
            createdAt: response.data.date_time_registration || response.data.created_at || new Date().toISOString(),
            updatedAt: response.data.date_time_modification || response.data.updated_at || new Date().toISOString()
          };

          set((state) => ({
            administrators: [...state.administrators, nuevoAdmin],
            loading: false,
            error: null
          }));

          logger.store('administratorStore', '✅ Administrador creado en BD exitosamente', { id: nuevoAdmin.id });
          return { success: true, data: nuevoAdmin };
        } catch (error: any) {
          const errorMsg = error.message || 'Error al crear administrador en el servidor';
          set({ loading: false, error: errorMsg });
          logger.error('❌ Error al crear administrador en API', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Actualiza un administrador existente
       * ✅ Conectado 100% con backend y base de datos PostgreSQL
       */
      actualizarAdministrador: async (id: string, datosActualizados: Partial<Administrator>) => {
        logger.store('administratorStore', 'Actualizando administrador via API', { id });
        set({ loading: true, error: null });

        const adminIndex = get().administrators.findIndex(admin => admin.id === id);
        if (adminIndex === -1) {
          const errorMsg = 'Administrador no encontrado';
          set({ loading: false, error: errorMsg });
          logger.warn('Administrador no encontrado para actualizar', { id });
          return { success: false, error: errorMsg };
        }

        const adminActualizado: Administrator = {
          ...get().administrators[adminIndex],
          ...datosActualizados,
          updatedAt: new Date().toISOString()
        };

        const validacion = get().validarAdministrador(adminActualizado);
        if (!validacion.esValido) {
          const errorMsg = validacion.errores.join(', ');
          set({ loading: false, error: errorMsg });
          logger.warn('Validación falló al actualizar administrador', validacion.errores);
          return { success: false, error: validacion.errores };
        }

        try {
          // ✅ Actualizar usuario en backend
          // IMPORTANTE: Enviar null explícitamente para branch_id cuando sedeId es null o vacío
          // para que el backend actualice el campo correctamente
          const userData: Partial<UserData> = {
            branch_id: datosActualizados.sedeId ? parseInt(datosActualizados.sedeId) : null,
            email: datosActualizados.email,
            first_name: datosActualizados.profile?.firstName,
            last_name: datosActualizados.profile?.lastName,
            phone: datosActualizados.profile?.phone,
            status: datosActualizados.status
          };

          const response = await usersApi.updateUser(parseInt(id), userData);

          // Actualizar en el store local
          set((state) => ({
            administrators: state.administrators.map((admin, i) =>
              i === adminIndex ? adminActualizado : admin
            ),
            loading: false,
            error: null
          }));

          logger.store('administratorStore', '✅ Administrador actualizado en BD exitosamente', { id });
          return { success: true, data: adminActualizado };
        } catch (error: any) {
          const errorMsg = error.message || 'Error al actualizar administrador en el servidor';
          set({ loading: false, error: errorMsg });
          logger.error('❌ Error al actualizar administrador en API', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Cambia el estado de un administrador
       * Valida que el estado sea uno de: 'active', 'inactive', 'suspended'
       */
      cambiarEstadoAdministrador: async (id: string, nuevoEstado: Administrator['status']) => {
        const estadosValidos: Administrator['status'][] = ['active', 'inactive', 'suspended'];
        if (!estadosValidos.includes(nuevoEstado)) {
          logger.warn('Estado no válido', { estado: nuevoEstado });
          return { success: false, error: 'Estado no válido' };
        }

        return await get().actualizarAdministrador(id, { status: nuevoEstado });
      },

      /**
       * Asigna una sede a un administrador
       * Verifica que no haya otro admin en esa sede
       * ✅ Conectado con backend
       */
      asignarSedeAdministrador: async (adminId: string, sedeId: string) => {
        logger.store('administratorStore', 'Asignando sede a administrador', { adminId, sedeId });

        // Verificar que no haya otro administrador en esa sede
        const adminExistente = get().obtenerAdministradorPorSede(sedeId);
        if (adminExistente && adminExistente.id !== adminId) {
          logger.warn('Ya existe un administrador en la sede', {
            sedeId,
            adminExistente: adminExistente.email
          });
          return {
            success: false,
            error: 'Ya existe un administrador asignado a esta sede'
          };
        }

        return await get().actualizarAdministrador(adminId, { sedeId });
      },

      /**
       * Desasigna la sede de un administrador
       * ✅ Conectado con backend
       */
      desasignarSedeAdministrador: async (adminId: string) => {
        logger.store('administratorStore', 'Desasignando sede de administrador', { adminId });
        return await get().actualizarAdministrador(adminId, { sedeId: null });
      },

      /**
       * Elimina un administrador (soft delete)
       * ✅ Conectado 100% con backend y base de datos PostgreSQL
       */
      eliminarAdministrador: async (id: string) => {
        logger.store('administratorStore', 'Eliminando administrador via API (soft delete)', { id });
        set({ loading: true, error: null });

        const admin = get().obtenerAdministradorPorId(id);
        if (!admin) {
          logger.warn('Administrador no encontrado para eliminar', { id });
          set({ loading: false, error: 'Administrador no encontrado' });
          return { success: false, error: 'Administrador no encontrado' };
        }

        try {
          // ✅ Eliminar usuario en backend (soft delete)
          await usersApi.deleteUser(parseInt(id));

          // Actualizar en el store local
          set((state) => ({
            administrators: state.administrators.map(a =>
              a.id === id ? { ...a, status: 'deleted' } : a
            ),
            loading: false,
            error: null
          }));

          logger.store('administratorStore', '✅ Administrador eliminado en BD exitosamente', { id });
          return { success: true };
        } catch (error: any) {
          const errorMsg = error.message || 'Error al eliminar administrador en el servidor';
          set({ loading: false, error: errorMsg });
          logger.error('❌ Error al eliminar administrador en API', error);
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Busca administradores por filtros
       * Soporta búsqueda por: searchTerm (nombre, apellido, email), sedeId, status
       */
      buscarAdministradores: (filtros: AdministratorSearchFilters) => {
        const { searchTerm, sedeId, status } = filtros;
        const administradores = get().obtenerAdministradores();

        return administradores.filter(admin => {
          // Filtro por término de búsqueda (nombre, apellido, email)
          const matchesSearch = !searchTerm ||
            admin.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase());

          // Filtro por sede
          // - 'all' o undefined: mostrar todos
          // - '' (cadena vacía): mostrar solo admins SIN sede (sedeId === null)
          // - otro valor: mostrar admins con esa sede específica
          let matchesSede = true;
          if (sedeId === 'all' || sedeId === undefined) {
            matchesSede = true; // Mostrar todos
          } else if (sedeId === '') {
            matchesSede = admin.sedeId === null; // Sin sede asignada
          } else {
            matchesSede = admin.sedeId === sedeId; // Sede específica
          }

          // Filtro por status
          const matchesStatus = !status || status === 'all' || admin.status === status;

          return matchesSearch && matchesSede && matchesStatus;
        });
      },

      /**
       * Obtiene estadísticas de los administradores
       * Retorna conteos por estado y asignación de sede
       */
      obtenerEstadisticasAdministradores: () => {
        const administradores = get().administrators;

        return {
          total: administradores.filter(admin => admin.status !== 'deleted').length,
          activos: administradores.filter(admin => admin.status === 'active').length,
          inactivos: administradores.filter(admin => admin.status === 'inactive').length,
          suspendidos: administradores.filter(admin => admin.status === 'suspended').length,
          conSedeAsignada: administradores.filter(
            admin => admin.sedeId && admin.status === 'active'
          ).length,
          sinSedeAsignada: administradores.filter(
            admin => !admin.sedeId && admin.status === 'active'
          ).length
        };
      },

      /**
       * Limpia el store por completo
       */
      limpiarStore: () => {
        logger.store('administratorStore', 'Limpiando store');
        set({
          administrators: [],
          loading: false,
          error: null
        });
      },

      /**
       * Limpia solo el error
       */
      limpiarError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'administrator-storage',
      partialize: (state) => ({
        administrators: state.administrators
      })
    }
  )
);

// ============================================================================
// DEFAULT EXPORT (compatibilidad con código antiguo)
// ============================================================================

export default useAdministratorStore;
