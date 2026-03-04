import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { useProsthesisStore } from '@/store/prosthesisStore';
import { useAuth } from '@/hooks/useAuth';
import { PermissionService, PERMISSIONS } from '@/services/permissions';
import { ProsthesisRequest } from '@/types';
import { toast } from 'sonner';
import { parseLocalDate } from '@/utils/dateUtils';

interface FilterState {
  status: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

const Requests = () => {
  const { user } = useAuth();
  const {
    requests,
    searchResults,
    filters,
    loading,
    fetchRequests,
    setFilter,
    clearFilters,
    applyFilters,
    searchRequests,
    deleteRequest,
    updateStatus
  } = useProsthesisStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<FilterState>({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  // Permisos
  const canCreate = PermissionService.hasPermission(user, PERMISSIONS.PROSTHESIS_REQUEST_CREATE);
  const canEdit = PermissionService.hasPermission(user, PERMISSIONS.PROSTHESIS_REQUEST_EDIT);
  const canDelete = PermissionService.hasPermission(user, PERMISSIONS.PROSTHESIS_REQUEST_DELETE);
  const canReceive = PermissionService.hasPermission(user, PERMISSIONS.PROSTHESIS_REQUEST_RECEIVE);

  useEffect(() => {
    loadRequests();
  }, [user?.sedeId]);

  const loadRequests = async () => {
    await fetchRequests(user?.sedeId);
  };

  const handleSearch = (term: string) => {
    setLocalFilters(prev => ({ ...prev, searchTerm: term }));
    searchRequests(term);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyLocalFilters = () => {
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value) {
        setFilter(key as any, key === 'dateFrom' || key === 'dateTo' ? new Date(value) : value);
      }
    });
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setLocalFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
    clearFilters();
  };

  const handleStatusChange = async (requestId: string, newStatus: ProsthesisRequest['status']) => {
    try {
      await updateStatus(requestId, newStatus);
    } catch (error) {
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) {
      try {
        await deleteRequest(requestId);
      } catch (error) {
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRequests.length === 0) {
      toast.warning('Selecciona al menos una solicitud');
      return;
    }

    switch (action) {
      case 'delete':
        if (window.confirm(`¿Estás seguro de eliminar ${selectedRequests.length} solicitudes?`)) {
          for (const id of selectedRequests) {
            await deleteRequest(id);
          }
          setSelectedRequests([]);
        }
        break;
      case 'mark_sent':
        for (const id of selectedRequests) {
          await updateStatus(id, 'sent');
        }
        setSelectedRequests([]);
        break;
      case 'mark_in_progress':
        for (const id of selectedRequests) {
          await updateStatus(id, 'in_progress');
        }
        setSelectedRequests([]);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Enviado', icon: Package },
      in_progress: { color: 'bg-orange-100 text-orange-800', label: 'En Proceso', icon: RefreshCw },
      received: { color: 'bg-green-100 text-green-800', label: 'Recibido', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const displayRequests = searchResults.length > 0 || localFilters.searchTerm ? searchResults : requests;

  const isOverdue = (request: ProsthesisRequest) => {
    return request.status !== 'received' &&
           request.status !== 'cancelled' &&
           new Date(request.tentativeDate) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Prótesis</h1>
          <p className="text-gray-600">
            Gestiona todas las solicitudes del laboratorio de prótesis dental
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadRequests}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          {canCreate && (
            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </button>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descripción, tipo de prótesis, color..."
              value={localFilters.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>

          {/* Limpiar filtros */}
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* Panel de filtros expandido */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={localFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="sent">Enviado</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="received">Recibido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={localFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={localFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={applyLocalFilters}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Acciones en lote */}
      {selectedRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-800">
              {selectedRequests.length} solicitudes seleccionadas
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('mark_sent')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Marcar como Enviado
              </button>
              <button
                onClick={() => handleBulkAction('mark_in_progress')}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
              >
                Marcar En Proceso
              </button>
              {canDelete && (
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : displayRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
            <p className="text-gray-600">
              {localFilters.searchTerm || Object.values(localFilters).some(v => v)
                ? 'No se encontraron solicitudes con los filtros aplicados'
                : 'Aún no hay solicitudes de prótesis registradas'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRequests.length === displayRequests.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(displayRequests.map(req => req.id));
                        } else {
                          setSelectedRequests([]);
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prótesis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayRequests.map((request) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 transition-colors ${
                      isOverdue(request) ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests(prev => [...prev, request.id]);
                          } else {
                            setSelectedRequests(prev => prev.filter(id => id !== request.id));
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start space-x-3">
                        {isOverdue(request) && (
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.prosthesisName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.description}
                          </div>
                          {request.color && (
                            <div className="text-xs text-gray-500 mt-1">
                              Color: {request.color}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        Paciente ID: {request.patientId}
                      </div>
                      <div className="text-sm text-gray-600">
                        Doctor ID: {request.doctorId}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {getStatusBadge(request.status)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium">Entrega:</span>{' '}
                          {parseLocalDate(request.deliveryDate).toLocaleDateString('es-ES')}
                        </div>
                        <div>
                          <span className="font-medium">Tentativa:</span>{' '}
                          {parseLocalDate(request.tentativeDate).toLocaleDateString('es-ES')}
                        </div>
                        {request.receptionDate && (
                          <div className="text-green-600">
                            <span className="font-medium">Recibido:</span>{' '}
                            {parseLocalDate(request.receptionDate).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{displayRequests.length}</div>
          <div className="text-sm text-gray-600">Total mostradas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {displayRequests.filter(r => r.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">En proceso</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {displayRequests.filter(r => r.status === 'received').length}
          </div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {displayRequests.filter(r => isOverdue(r)).length}
          </div>
          <div className="text-sm text-gray-600">Atrasadas</div>
        </div>
      </div>
    </div>
  );
};

export default Requests;