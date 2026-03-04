import { createPortal } from 'react-dom';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  XCircle,
  FileText,
  X,
  TrendingUp,
  Receipt,
  Sparkles,
  User,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';

interface PaymentHistoryItem {
  id: string;
  type: 'appointment' | 'payment' | 'treatment';
  date: Date;
  description: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  paymentMethod?: string;
  services?: any[];
  reference?: string;
  procedures?: any[];
  dentistName?: string;
  branchName?: string;
  toothNumber?: string;
  isOverdue?: boolean;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  patient: Patient | null;
  history: PaymentHistoryItem[];
  onClose: () => void;
}

export const PaymentHistoryModal = ({
  isOpen,
  patient,
  history,
  onClose
}: PaymentHistoryModalProps) => {
  if (!isOpen || !patient) return null;

  const statusConfig = {
    paid: {
      label: 'Pagado',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-500'
    },
    pending: {
      label: 'Pendiente',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-500'
    },
    partial: {
      label: 'Parcial',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: CreditCard,
      iconColor: 'text-orange-500'
    },
    cancelled: {
      label: 'Rechazado',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-500'
    }
  };

  const handlePay = () => {
    toast.success('Funcionalidad de pago en desarrollo');
  };

  // Calcular totales (convertir a número para evitar concatenación de strings)
  const totalItems = history.length;
  const totalFacturado = history.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  const totalPagado = history.reduce((sum, h) => sum + (Number(h.amountPaid) || 0), 0);
  const totalPendiente = history.reduce((sum, h) => sum + (Number(h.balance) || Number(h.amount) || 0), 0);
  const itemsPagados = history.filter(h => h.paymentStatus === 'paid').length;
  const itemsVencidos = history.filter(h => h.isOverdue).length;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="relative bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-6">
            {/* Decoración */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-20 w-20 h-20 bg-white/10 rounded-full translate-y-1/2" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Historial de Pagos y Servicios
                  </h3>
                  <p className="text-cyan-100 mt-0.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            {history.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No hay historial</h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                  No se encontraron registros de pagos o servicios para este paciente.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-700">Servicios</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-4 border border-cyan-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-cyan-600" />
                      </div>
                      <span className="text-sm font-medium text-cyan-700">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-900">S/ {totalFacturado.toFixed(2)}</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-emerald-700">Pagado</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">S/ {totalPagado.toFixed(2)}</p>
                  </div>

                  <div className={`bg-gradient-to-br rounded-xl p-4 border ${
                    totalPendiente > 0
                      ? 'from-red-50 to-red-100/50 border-red-200/50'
                      : 'from-gray-50 to-gray-100/50 border-gray-200/50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        totalPendiente > 0 ? 'bg-red-500/10' : 'bg-gray-500/10'
                      }`}>
                        <Clock className={`w-4 h-4 ${totalPendiente > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-sm font-medium ${totalPendiente > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                        Debe
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${totalPendiente > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                      S/ {totalPendiente.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Alerta de vencidos */}
                {itemsVencidos > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">{itemsVencidos} {itemsVencidos === 1 ? 'servicio vencido' : 'servicios vencidos'}</span> - Requiere atención inmediata
                    </p>
                  </div>
                )}

                {/* History List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Detalle de Servicios
                  </h4>

                  {history.map((item, index) => {
                    const status = statusConfig[item.paymentStatus] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={index}
                        className={`group bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
                          item.isOverdue
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-gray-200 hover:border-cyan-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Type Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                              item.isOverdue ? 'bg-red-100' : 'bg-purple-100'
                            }`}>
                              <FileText className={`w-5 h-5 ${item.isOverdue ? 'text-red-600' : 'text-purple-600'}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900">
                                {item.description}
                              </h4>

                              {item.toothNumber && (
                                <p className="text-sm text-gray-600 mt-0.5">
                                  Pieza: {item.toothNumber}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(item.date).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>

                                {item.dentistName && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {item.dentistName}
                                  </span>
                                )}

                                {item.branchName && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {item.branchName}
                                  </span>
                                )}
                              </div>

                              {item.isOverdue && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Vencido
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {/* Precio total */}
                            <p className="text-lg font-bold text-gray-900">
                              S/ {Number(item.amount || 0).toFixed(2)}
                            </p>

                            {/* Si tiene pagos parciales, mostrar detalle */}
                            {item.amountPaid !== undefined && Number(item.amountPaid) > 0 && item.paymentStatus !== 'paid' && (
                              <div className="text-right text-xs">
                                <p className="text-emerald-600">Pagado: S/ {Number(item.amountPaid).toFixed(2)}</p>
                                <p className="text-red-600 font-semibold">Debe: S/ {Number(item.balance || 0).toFixed(2)}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                                <StatusIcon className={`w-3.5 h-3.5 ${status.iconColor}`} />
                                {status.label}
                              </span>
                            </div>

                            {(item.paymentStatus === 'pending' || item.paymentStatus === 'partial') && (
                              <button
                                onClick={handlePay}
                                className="mt-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm hover:shadow-md"
                              >
                                Registrar Pago
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50/80">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
