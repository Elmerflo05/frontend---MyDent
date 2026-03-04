import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Stethoscope,
  TestTube,
  Building2,
  Home,
  ExternalLink,
  FileX
} from 'lucide-react';
import { toast } from 'sonner';
import httpClient from '@/services/api/httpClient';

// Tipos para las solicitudes unificadas
interface UnifiedRequest {
  source_type: 'radiography' | 'laboratory' | 'prosthesis';
  request_id: number;
  patient_id: number;
  dentist_id: number;
  branch_id: number;
  consultation_id: number | null;
  request_date: string;
  request_type: string;
  description: string | null;
  urgency: string;
  request_status: string;
  laboratory_name: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  cost: number | null;
  notes: string | null;
  patient_name: string;
  patient_dni: string;
  dentist_name: string;
  branch_name: string;
  // Campos específicos de prótesis
  tooth_positions?: string;
  material?: string;
  color_shade?: string;
}

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

interface AllStats {
  internal: Stats;
  external: Stats;
}

type TabType = 'internal' | 'external';

const AdminLaboratoryRequests = () => {
  const [activeTab, setActiveTab] = useState<TabType>('internal');
  const [internalRequests, setInternalRequests] = useState<UnifiedRequest[]>([]);
  const [externalRequests, setExternalRequests] = useState<UnifiedRequest[]>([]);
  const [stats, setStats] = useState<AllStats>({
    internal: { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
    external: { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    console.log('=== [AdminLaboratoryRequests] Iniciando carga de datos ===');
    try {
      const [internalRes, externalRes, statsRes] = await Promise.all([
        httpClient.get('/laboratory/requests/internal'),
        httpClient.get('/laboratory/requests/external'),
        httpClient.get('/laboratory/requests/stats')
      ]);

      console.log('[AdminLaboratoryRequests] Respuesta internalRes:', internalRes);
      console.log('[AdminLaboratoryRequests] Respuesta externalRes:', externalRes);
      console.log('[AdminLaboratoryRequests] Respuesta statsRes:', statsRes);

      // Verificar estructura de respuesta
      const internalData = internalRes?.data?.data || internalRes?.data || [];
      const externalData = externalRes?.data?.data || externalRes?.data || [];
      const statsData = statsRes?.data?.data || statsRes?.data || {
        internal: { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
        external: { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
      };

      console.log('[AdminLaboratoryRequests] Datos procesados:', {
        internalCount: internalData.length,
        externalCount: externalData.length,
        stats: statsData
      });

      setInternalRequests(internalData);
      setExternalRequests(externalData);
      setStats(statsData);
    } catch (error) {
      console.error('[AdminLaboratoryRequests] Error loading data:', error);
      toast.error('Error al cargar las solicitudes de laboratorio');
    } finally {
      setIsLoading(false);
      console.log('=== [AdminLaboratoryRequests] Carga finalizada ===');
    }
  };

  // Obtener solicitudes según tab activo
  const currentRequests = activeTab === 'internal' ? internalRequests : externalRequests;
  const currentStats = activeTab === 'internal' ? stats.internal : stats.external;

  // Filtrar solicitudes
  const filteredRequests = currentRequests.filter(request => {
    const matchesSearch = searchTerm === '' ||
      request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.dentist_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.laboratory_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.request_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: TestTube, label: 'En Proceso' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Cancelado' },
      ordered: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'Ordenado' },
      received: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Recibido' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Get source type badge
  const getSourceBadge = (sourceType: string) => {
    const sourceConfig: Record<string, { color: string; label: string }> = {
      radiography: { color: 'bg-indigo-100 text-indigo-800', label: 'Radiografía' },
      laboratory: { color: 'bg-cyan-100 text-cyan-800', label: 'Laboratorio' },
      prosthesis: { color: 'bg-orange-100 text-orange-800', label: 'Prótesis' }
    };

    const config = sourceConfig[sourceType] || { color: 'bg-gray-100 text-gray-800', label: sourceType };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Get urgency badge
  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Baja' },
      normal: { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente' }
    };

    const config = urgencyConfig[urgency] || urgencyConfig.normal;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Solicitudes de Laboratorio
            </h1>
            <p className="text-gray-600">Gestión y supervisión de solicitudes internas y externas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('internal')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'internal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4" />
                Solicitudes Internas
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'internal' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.internal.total}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('external')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'external'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                Solicitudes Externas
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'external' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.external.total}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            {activeTab === 'internal' ? (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Solicitudes internas:</span> Radiografías, tomografías y otros trabajos procesados por el técnico de imagen de la clínica.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Solicitudes externas:</span> Prótesis dentales, coronas, puentes y otros trabajos enviados a laboratorios externos.
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.total}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{currentStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-700">{currentStats.in_progress}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-700">{currentStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canceladas</p>
                <p className="text-2xl font-bold text-red-700">{currentStats.cancelled}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por paciente, doctor, tipo o laboratorio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-80"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Proceso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
              {activeTab === 'external' && (
                <>
                  <option value="ordered">Ordenado</option>
                  <option value="received">Recibido</option>
                </>
              )}
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {filteredRequests.length} de {currentRequests.length} solicitudes
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trabajo Solicitado
                  </th>
                  {activeTab === 'external' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laboratorio
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={`${request.source_type}-${request.request_id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getSourceBadge(request.source_type)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {request.patient_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.patient_dni}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Stethoscope className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{request.dentist_name}</div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {request.request_type}
                      </div>
                      {request.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {request.description}
                        </div>
                      )}
                    </td>

                    {activeTab === 'external' && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {request.laboratory_name || '-'}
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(request.request_status)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {getUrgencyBadge(request.urgency)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(request.request_date).toLocaleDateString('es-PE')}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FileX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'internal'
                  ? 'No hay solicitudes internas que coincidan con los filtros.'
                  : 'No hay solicitudes externas que coincidan con los filtros.'}
              </p>
            </div>
          )}
        </div>

        {/* Request Details Modal */}
        {selectedRequest && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Detalles de la Solicitud</h3>
                  {getSourceBadge(selectedRequest.source_type)}
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Información de la Solicitud</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>ID:</strong> {selectedRequest.request_id}</div>
                      <div><strong>Tipo:</strong> {selectedRequest.request_type}</div>
                      <div><strong>Fecha de Solicitud:</strong> {new Date(selectedRequest.request_date).toLocaleDateString('es-PE')}</div>
                      <div><strong>Estado:</strong> {getStatusBadge(selectedRequest.request_status)}</div>
                      <div><strong>Urgencia:</strong> {getUrgencyBadge(selectedRequest.urgency)}</div>
                      {selectedRequest.expected_delivery_date && (
                        <div><strong>Fecha Esperada:</strong> {new Date(selectedRequest.expected_delivery_date).toLocaleDateString('es-PE')}</div>
                      )}
                      {selectedRequest.actual_delivery_date && (
                        <div><strong>Fecha Entrega:</strong> {new Date(selectedRequest.actual_delivery_date).toLocaleDateString('es-PE')}</div>
                      )}
                      {selectedRequest.cost && (
                        <div><strong>Costo:</strong> S/ {Number(selectedRequest.cost).toFixed(2)}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Información del Paciente</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nombre:</strong> {selectedRequest.patient_name}</div>
                      <div><strong>DNI:</strong> {selectedRequest.patient_dni}</div>
                      <div><strong>Doctor Solicitante:</strong> {selectedRequest.dentist_name}</div>
                      <div><strong>Sucursal:</strong> {selectedRequest.branch_name}</div>
                    </div>
                  </div>
                </div>

                {selectedRequest.laboratory_name && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Laboratorio Externo</h4>
                    <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      {selectedRequest.laboratory_name}
                    </div>
                  </div>
                )}

                {/* Campos específicos de prótesis */}
                {selectedRequest.source_type === 'prosthesis' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Detalles de Prótesis</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {selectedRequest.tooth_positions && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-xs mb-1">Posiciones Dentales</div>
                          <div className="font-medium">{selectedRequest.tooth_positions}</div>
                        </div>
                      )}
                      {selectedRequest.material && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-xs mb-1">Material</div>
                          <div className="font-medium">{selectedRequest.material}</div>
                        </div>
                      )}
                      {selectedRequest.color_shade && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-gray-500 text-xs mb-1">Color/Tono</div>
                          <div className="font-medium">{selectedRequest.color_shade}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRequest.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Descripción</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Notas Adicionales</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </motion.div>
    </div>
  );
};

export default AdminLaboratoryRequests;
