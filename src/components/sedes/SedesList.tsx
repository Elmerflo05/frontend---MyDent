import React, { useState, useEffect } from 'react';
import SedeFormModal from './SedeFormModal';
import { Plus, Edit, Trash2, Building2, MapPin, Phone, Mail, Users, Calendar, TrendingUp, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PermissionService, PERMISSIONS } from '@/services/permissions';
import { useBranches } from '@/hooks/useBranches';
import type { BranchData } from '@/services/api/branchesApi';
import statisticsApi, { type BranchStatistics, type GlobalStatistics } from '@/services/api/statisticsApi';

export default function SedesList() {
  const { user } = useAuthStore();
  const { branches, loading, refreshBranches, deleteBranch } = useBranches();

  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [globalStats, setGlobalStats] = useState<GlobalStatistics>({
    totalBranches: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0
  });
  const [branchStats, setBranchStats] = useState<Record<number, BranchStatistics>>({});

  const canCreate = PermissionService.hasPermission(user, PERMISSIONS.SEDE_CREATE);
  const canEdit = PermissionService.hasPermission(user, PERMISSIONS.SEDE_EDIT);
  const canDelete = PermissionService.hasPermission(user, PERMISSIONS.SEDE_DELETE);

  // Filtrar solo sedes activas
  const activeBranches = branches.filter(branch => branch.status !== 'inactive');

  // Cargar estadísticas
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await statisticsApi.getGlobalStatistics();
        setGlobalStats({
          ...stats,
          totalBranches: activeBranches.length
        });

        const branchStatsData = await statisticsApi.getAllBranchesStatistics();
        setBranchStats(branchStatsData);
      } catch (error) {
      }
    };

    if (branches.length > 0) {
      loadStatistics();
    }
  }, [branches, activeBranches.length]);

  const handleCreateBranch = () => {
    setSelectedBranch(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditBranch = (branch: BranchData) => {
    setSelectedBranch(branch);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteBranch = async (branch: BranchData) => {
    if (!branch.branch_id) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la sede "${branch.branch_name}"?\n\nEsta acción cambiará el estado a inactivo.`
    );

    if (confirmDelete) {
      const success = await deleteBranch(branch.branch_id);
      if (success) {
        await refreshBranches();
      }
    }
  };

  const getStatusBadge = (status: string = 'active') => {
    const estilos = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      active: 'Activa',
      inactive: 'Inactiva',
      suspended: 'Suspendida'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${estilos[status as keyof typeof estilos] || estilos.active}`}>
        {labels[status as keyof typeof labels] || 'Activa'}
      </span>
    );
  };

  const getBranchStatsForBranch = (branchId?: number): BranchStatistics => {
    if (!branchId || !branchStats[branchId]) {
      return {
        branch_id: branchId || 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalStaff: 0,
        appointmentsToday: 0,
        monthlyRevenue: 0
      };
    }
    return branchStats[branchId];
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas globales */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Sedes</h1>
            <p className="text-gray-600 mt-1">Administra todas las sedes del centro odontológico</p>
          </div>
          {canCreate && (
            <button
              onClick={handleCreateBranch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nueva Sede
            </button>
          )}
        </div>

        {/* Estadísticas globales - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6 pt-6 border-t">
          {/* Card 1: Sedes Activas */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Sedes Activas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{globalStats.totalBranches}</p>
          </div>

          {/* Card 2: Total Pacientes */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Total Pacientes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{globalStats.totalPatients.toLocaleString()}</p>
          </div>

          {/* Card 3: Total Doctores */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <UserCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Total Doctores</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{globalStats.totalDoctors.toLocaleString()}</p>
          </div>

          {/* Card 4: Total Personal */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Total Personal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{globalStats.totalStaff.toLocaleString()}</p>
          </div>

          {/* Card 5: Citas Hoy */}
          <div className="bg-cyan-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-cyan-600 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Citas Hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{globalStats.appointmentsToday.toLocaleString()}</p>
          </div>

          {/* Card 6: Ingresos Mes */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Ingresos Mes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              S/ {globalStats.monthlyRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sedes...</p>
        </div>
      )}

      {/* Lista de sedes */}
      {!loading && activeBranches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBranches.map((branch) => {
            const stats = getBranchStatsForBranch(branch.branch_id);

            return (
              <div
                key={branch.branch_id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{branch.branch_name}</h3>
                        {branch.is_main_office && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                      {branch.branch_code && (
                        <p className="text-sm text-gray-500">{branch.branch_code}</p>
                      )}
                    </div>
                    {getStatusBadge(branch.status)}
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Dirección */}
                    {branch.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-gray-600">{branch.address}</span>
                          {(branch.city || branch.state || branch.department) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {[branch.city, branch.state, branch.department].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Teléfonos */}
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{branch.phone}</span>
                        {branch.mobile && (
                          <span className="text-gray-500 text-xs">/ {branch.mobile}</span>
                        )}
                      </div>
                    )}

                    {/* Email */}
                    {branch.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 text-xs truncate">{branch.email}</span>
                      </div>
                    )}

                    {/* Horarios */}
                    {branch.opening_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 text-xs">{branch.opening_hours}</span>
                      </div>
                    )}

                    {/* Información del Encargado/Manager */}
                    {branch.manager_name && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <span className="text-gray-900 font-medium text-sm">
                              {branch.manager_name}
                            </span>
                            <p className="text-xs text-gray-500">Encargado</p>
                            {branch.manager_phone && (
                              <p className="text-xs text-gray-500">{branch.manager_phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estadísticas de la sede */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Pacientes</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.totalPatients}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Doctores</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.totalDoctors}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Personal</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.totalStaff}
                        </p>
                      </div>
                    </div>

                    {/* Métricas adicionales */}
                    {(stats.appointmentsToday > 0 || stats.monthlyRevenue > 0) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center bg-cyan-50 rounded p-2">
                          <p className="text-xs text-cyan-600">Citas Hoy</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {stats.appointmentsToday}
                          </p>
                        </div>
                        <div className="text-center bg-green-50 rounded p-2">
                          <p className="text-xs text-green-600">Ingreso Mes</p>
                          <p className="text-sm font-semibold text-gray-900">
                            S/ {stats.monthlyRevenue.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    {canEdit && (
                      <button
                        onClick={() => handleEditBranch(branch)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteBranch(branch)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    )}
                  </div>

                  {/* Notas */}
                  {branch.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 italic line-clamp-2">{branch.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje si no hay sedes */}
      {!loading && activeBranches.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sedes registradas</h3>
          <p className="text-gray-600 mb-6">Comienza creando la primera sede del centro odontológico</p>
          {canCreate && (
            <button
              onClick={handleCreateBranch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Crear Primera Sede
            </button>
          )}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <SedeFormModal
          branch={selectedBranch}
          mode={modalMode}
          onClose={() => setShowModal(false)}
          onSave={async () => {
            await refreshBranches();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
