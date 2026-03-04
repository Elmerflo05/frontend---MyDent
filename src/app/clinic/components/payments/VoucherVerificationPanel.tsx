/**
 * VoucherVerificationPanel - Panel para verificar vouchers de pago
 * Usado por admin y recepcionistas para aprobar/rechazar comprobantes
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Calendar,
  Building2,
  DollarSign,
  Image,
  FileText,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Banknote,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { incomePaymentsApi, type PendingVerificationItem } from '@/services/api/incomePaymentsApi';
import { useAuth } from '@/hooks/useAuth';
import { formatTimestampToLima } from '@/utils/dateUtils';
import VoucherViewModal from './VoucherViewModal';

interface VoucherVerificationPanelProps {
  branchId?: number;
  onVoucherVerified?: () => void;
}

const VoucherVerificationPanel: React.FC<VoucherVerificationPanelProps> = ({ branchId, onVoucherVerified }) => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingVerificationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  // Cargar datos
  useEffect(() => {
    loadPendingVerifications();
  }, [branchId]);

  const loadPendingVerifications = async () => {
    try {
      setIsLoading(true);

      // Para super_admin: NO filtrar por sede (ver todos los vouchers de todas las sedes)
      // Para otros roles: filtrar por su sede asignada
      const isSuperAdmin = user?.role === 'super_admin';
      const effectiveBranchId = isSuperAdmin
        ? undefined  // Super admin ve TODO
        : (user?.branch_id || branchId);

      const items = await incomePaymentsApi.getPendingVerification({
        branch_id: effectiveBranchId
      });
      setPendingItems(items);

    } catch (error) {
      console.error('Error al cargar verificaciones pendientes:', error);
      toast.error('Error al cargar los vouchers pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPendingVerifications();
    setIsRefreshing(false);
    toast.success('Lista actualizada');
  };

  const handleApprove = async (incomeId: number) => {
    try {
      await incomePaymentsApi.approveVoucher(incomeId);
      toast.success('Pago aprobado exitosamente');
      setPendingItems(prev => prev.filter(item => item.income_id !== incomeId));
      setSelectedItem(null);
      onVoucherVerified?.();
    } catch (error: any) {
      console.error('Error al aprobar voucher:', error);
      toast.error(error.message || 'Error al aprobar el pago');
    }
  };

  const handleReject = async (incomeId: number, reason: string) => {
    try {
      await incomePaymentsApi.rejectVoucher(incomeId, reason);
      toast.success('Voucher rechazado');
      setPendingItems(prev => prev.filter(item => item.income_id !== incomeId));
      setSelectedItem(null);
      onVoucherVerified?.();
    } catch (error: any) {
      console.error('Error al rechazar voucher:', error);
      toast.error(error.message || 'Error al rechazar el pago');
    }
  };

  // Aprobar todos los items de un lote
  const handleApproveBatch = async (batchItems: PendingVerificationItem[]) => {
    try {
      for (const item of batchItems) {
        await incomePaymentsApi.approveVoucher(item.income_id);
      }
      toast.success(`${batchItems.length} pagos aprobados exitosamente`);
      const batchIds = batchItems.map(item => item.income_id);
      setPendingItems(prev => prev.filter(item => !batchIds.includes(item.income_id)));
      onVoucherVerified?.();
    } catch (error: any) {
      console.error('Error al aprobar lote:', error);
      toast.error(error.message || 'Error al aprobar los pagos del lote');
    }
  };

  // Toggle para expandir/colapsar lotes
  const toggleBatchExpansion = (batchKey: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchKey)) {
        newSet.delete(batchKey);
      } else {
        newSet.add(batchKey);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };


  const filteredItems = pendingItems.filter(item =>
    item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.patient_identification.includes(searchTerm)
  );

  // Agrupar por batch_id
  const groupedItems = filteredItems.reduce((acc, item) => {
    const batchKey = item.batch_id || `single-${item.income_id}`;
    if (!acc[batchKey]) {
      acc[batchKey] = [];
    }
    acc[batchKey].push(item);
    return acc;
  }, {} as Record<string, PendingVerificationItem[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Vouchers Pendientes</h2>
            <p className="text-sm text-gray-500">
              {pendingItems.length} comprobante(s) esperando verificación
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por paciente, DNI o tratamiento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* Lista de vouchers */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No se encontraron resultados' : 'No hay vouchers pendientes'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'Todos los comprobantes han sido verificados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedItems).map(([batchKey, batchItems]) => {
            const isBatch = batchItems.length > 1 && batchItems[0].batch_id;
            const isExpanded = expandedBatches.has(batchKey);
            const firstItem = batchItems[0];
            const batchTotal = batchItems.reduce((sum, item) => sum + (parseFloat(String(item.final_amount)) || 0), 0);

            // Si es un lote, mostrar tarjeta de lote con expand/collapse
            if (isBatch) {
              return (
                <motion.div
                  key={batchKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-orange-200 rounded-lg overflow-hidden"
                >
                  {/* Cabecera del lote - clickeable */}
                  <div
                    className="p-4 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => toggleBatchExpansion(batchKey)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Paciente */}
                        <div className="flex items-center gap-2 mb-2">
                          <button className="p-1 hover:bg-orange-200 rounded transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-orange-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-orange-600" />
                            )}
                          </button>
                          <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-700" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{firstItem.patient_name}</h4>
                            <p className="text-xs text-gray-500">DNI: {firstItem.patient_identification}</p>
                          </div>
                        </div>

                        {/* Info del lote */}
                        <div className="flex items-center flex-wrap gap-4 ml-10">
                          <span className="inline-flex items-center px-3 py-1 bg-orange-200 text-orange-800 rounded-lg text-sm font-bold">
                            <Package className="w-4 h-4 mr-1.5" />
                            Lote: {batchItems.length} tratamientos
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            Total: {formatCurrency(batchTotal)}
                          </span>
                          {firstItem.performed_date && (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              Cita: <span className="font-medium text-gray-800">{formatTimestampToLima(firstItem.performed_date, 'date')}</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {isExpanded ? 'Click para colapsar' : 'Click para ver detalle'}
                          </span>
                        </div>
                      </div>

                      {/* Acciones del lote */}
                      <div className="flex flex-col gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedItem(firstItem)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleApproveBatch(batchItems)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar Todo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalle expandido del lote */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-orange-200"
                      >
                        <div className="divide-y divide-gray-100">
                          {batchItems.map((item) => (
                            <div key={item.income_id} className="p-3 pl-12 bg-white hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-orange-400">└─</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-orange-500">•</span>
                                      <span className="font-medium text-gray-800">{item.item_name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-4">
                                      {item.branch_name} • {item.payment_method_name}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="font-semibold text-gray-900">
                                    {formatCurrency(parseFloat(String(item.final_amount)) || 0)}
                                  </span>
                                  <button
                                    onClick={() => setSelectedItem(item)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Ver voucher"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(item.income_id)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Aprobar"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            }

            // Item individual (sin batch_id)
            const item = firstItem;
            return (
              <motion.div
                key={item.income_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Paciente */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.patient_name}</h4>
                        <p className="text-xs text-gray-500">DNI: {item.patient_identification}</p>
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate">{item.item_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.final_amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>{item.payment_method_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.branch_name}</span>
                      </div>
                      {item.performed_date && (
                        <div className="flex items-center gap-1 text-gray-600 col-span-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>Cita: <span className="font-medium text-gray-800">{formatTimestampToLima(item.performed_date, 'date')}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600 col-span-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Enviado: {formatTimestampToLima(item.voucher_submitted_at, 'datetime')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleApprove(item.income_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de visualización */}
      {selectedItem && (
        <VoucherViewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default VoucherVerificationPanel;
