import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatDateToYMD, parseLocalDate } from '@/utils/dateUtils';
import {
  Package,
  CheckCircle,
  Calendar,
  User,
  FileText,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useProsthesisStore } from '@/store/prosthesisStore';
import { useAuth } from '@/hooks/useAuth';
import { ProsthesisRequest } from '@/types';
import { toast } from 'sonner';

interface ReceptionModalData {
  request: ProsthesisRequest;
  receptionDate: string;
  notes: string;
  qualityCheck: boolean;
}

const Reception = () => {
  const { user } = useAuth();
  const {
    requests,
    loading,
    fetchRequests,
    markAsReceived,
    updateStatus
  } = useProsthesisStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<ReceptionModalData | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [user?.sedeId]);

  const loadRequests = async () => {
    await fetchRequests(user?.sedeId);
  };

  // Filtrar solicitudes que están listas para recibir
  const pendingReception = requests.filter(req =>
    (req.status === 'sent' || req.status === 'in_progress') &&
    !req.receptionDate
  );

  // Aplicar filtros de búsqueda y estado
  const filteredRequests = pendingReception.filter(req => {
    const matchesSearch = !searchTerm ||
      req.prosthesisName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patientId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleReceiveClick = (request: ProsthesisRequest) => {
    setModalData({
      request,
      receptionDate: formatDateToYMD(new Date()),
      notes: '',
      qualityCheck: false
    });
    setShowModal(true);
  };

  const handleConfirmReception = async () => {
    if (!modalData) return;

    setProcessingId(modalData.request.id);

    try {
      const receptionDate = parseLocalDate(modalData.receptionDate);
      const notes = modalData.notes || 'Prótesis recibida por recepcionista';

      await markAsReceived(modalData.request.id, receptionDate, notes);

      setShowModal(false);
      setModalData(null);
      toast.success('Prótesis marcada como recibida exitosamente');

    } catch (error) {
      toast.error('Error al marcar como recibida');
    } finally {
      setProcessingId(null);
    }
  };

  const isOverdue = (request: ProsthesisRequest) => {
    return new Date(request.tentativeDate) < new Date();
  };

  const getDaysOverdue = (request: ProsthesisRequest) => {
    const today = new Date();
    const tentativeDate = new Date(request.tentativeDate);
    const diffTime = today.getTime() - tentativeDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Enviado', icon: Package },
      in_progress: { color: 'bg-orange-100 text-orange-800', label: 'En Proceso', icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepción de Prótesis</h1>
          <p className="text-gray-600">
            Registra la recepción de prótesis enviadas desde el laboratorio
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border">
          <Calendar className="w-4 h-4 inline mr-2" />
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pendingReception.length}
              </div>
              <div className="text-sm text-gray-600">Pendientes de recibir</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pendingReception.filter(req => req.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">En proceso</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {pendingReception.filter(req => isOverdue(req)).length}
              </div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {requests.filter(req => req.status === 'received').length}
              </div>
              <div className="text-sm text-gray-600">Recibidas hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por tipo de prótesis, descripción o ID de paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Todos los estados</option>
            <option value="sent">Enviado</option>
            <option value="in_progress">En Proceso</option>
          </select>
        </div>
      </div>

      {/* Lista de prótesis pendientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay prótesis pendientes de recibir
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter
                ? 'No se encontraron resultados con los filtros aplicados'
                : 'Todas las prótesis han sido recibidas'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  isOverdue(request) ? 'bg-red-50 border-l-4 border-red-400' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.prosthesisName}
                          </h3>
                          {getStatusBadge(request.status)}
                          {isOverdue(request) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {getDaysOverdue(request)} días de retraso
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{request.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Paciente:</span>
                            <div className="text-gray-600">ID: {request.patientId}</div>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Doctor:</span>
                            <div className="text-gray-600">ID: {request.doctorId}</div>
                          </div>

                          <div>
                            <span className="font-medium text-gray-700">Fechas:</span>
                            <div className="text-gray-600">
                              Entrega: {parseLocalDate(request.deliveryDate).toLocaleDateString('es-ES')}
                            </div>
                            <div className={`${isOverdue(request) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              Esperada: {parseLocalDate(request.tentativeDate).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>

                        {request.color && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">Color:</span>
                            <span className="ml-2 text-gray-600">{request.color}</span>
                          </div>
                        )}

                        {request.specifications && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">Especificaciones:</span>
                            <p className="text-gray-600 mt-1">{request.specifications}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => handleReceiveClick(request)}
                          disabled={processingId === request.id}
                          className={`flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${
                            processingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingId === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Marcar como Recibida
                        </button>

                        <button className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de recepción */}
      {showModal && modalData && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Recepción de Prótesis
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{modalData.request.prosthesisName}</h4>
                <p className="text-gray-600 text-sm mt-1">{modalData.request.description}</p>
                {modalData.request.color && (
                  <p className="text-gray-600 text-sm">Color: {modalData.request.color}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de recepción
                </label>
                <input
                  type="date"
                  value={modalData.receptionDate}
                  onChange={(e) => setModalData(prev => prev ? { ...prev, receptionDate: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={modalData.notes}
                  onChange={(e) => setModalData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Observaciones sobre el estado de la prótesis, calidad, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="qualityCheck"
                  checked={modalData.qualityCheck}
                  onChange={(e) => setModalData(prev => prev ? { ...prev, qualityCheck: e.target.checked } : null)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="qualityCheck" className="ml-2 text-sm text-gray-700">
                  He verificado la calidad y estado de la prótesis
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReception}
                disabled={!modalData.qualityCheck || processingId === modalData.request.id}
                className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${
                  !modalData.qualityCheck || processingId === modalData.request.id
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {processingId === modalData.request.id ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  'Confirmar Recepción'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Reception;