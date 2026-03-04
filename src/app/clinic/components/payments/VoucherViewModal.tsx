/**
 * VoucherViewModal - Modal para visualizar y aprobar/rechazar vouchers
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  Banknote,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink
} from 'lucide-react';
import { type PendingVerificationItem } from '@/services/api/incomePaymentsApi';

interface VoucherViewModalProps {
  item: PendingVerificationItem;
  onClose: () => void;
  onApprove: (incomeId: number) => Promise<void>;
  onReject: (incomeId: number, reason: string) => Promise<void>;
}

// Base URL del API para archivos estáticos
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

const VoucherViewModal: React.FC<VoucherViewModalProps> = ({
  item,
  onClose,
  onApprove,
  onReject
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [imageZoom, setImageZoom] = useState(1);

  // Construir URL completa del voucher
  const getVoucherUrl = (url: string) => {
    if (!url) return '';
    // Si ya es una URL completa o base64, retornar tal cual
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Si es una ruta relativa, agregar el base URL
    return `${API_BASE_URL}${url}`;
  };

  const voucherFullUrl = getVoucherUrl(item.voucher_url);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(item.income_id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setIsRejecting(true);
    try {
      await onReject(item.income_id, rejectReason);
    } finally {
      setIsRejecting(false);
    }
  };

  const isPdf = voucherFullUrl?.toLowerCase().includes('.pdf') ||
    voucherFullUrl?.includes('application/pdf');

  const isBase64Image = voucherFullUrl?.startsWith('data:image/');
  const isBase64Pdf = voucherFullUrl?.startsWith('data:application/pdf');

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-[9999]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Verificar Comprobante</h2>
              <p className="text-sm text-gray-500">Revisa el voucher y aprueba o rechaza el pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0">
            {/* Columna izquierda: Imagen del voucher */}
            <div className="bg-gray-900 p-4 flex flex-col items-center justify-center min-h-[300px] lg:min-h-[400px]">
              {/* Controles de zoom */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-white text-sm px-2">{Math.round(imageZoom * 100)}%</span>
                <button
                  onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {!isBase64Pdf && !isPdf && (
                  <a
                    href={voucherFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors ml-2"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Imagen o PDF */}
              <div className="overflow-auto max-h-[350px] max-w-full">
                {isPdf || isBase64Pdf ? (
                  <div className="flex flex-col items-center gap-4">
                    <FileText className="w-16 h-16 text-red-500" />
                    <span className="text-white text-sm">Archivo PDF</span>
                    <a
                      href={voucherFullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Ver/Descargar PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={voucherFullUrl}
                    alt="Comprobante de pago"
                    style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center' }}
                    className="max-w-full h-auto rounded-lg transition-transform duration-200"
                  />
                )}
              </div>
            </div>

            {/* Columna derecha: Información */}
            <div className="p-6 space-y-6">
              {/* Info del paciente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Paciente
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.patient_name}</p>
                    <p className="text-sm text-gray-500">DNI: {item.patient_identification}</p>
                  </div>
                </div>
              </div>

              {/* Info del pago */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Detalles del Pago
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                      Tratamiento
                    </span>
                    <span className="font-medium text-gray-900 text-right">{item.item_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0">
                      <DollarSign className="w-4 h-4" />
                      Monto
                    </span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(item.final_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0">
                      <Banknote className="w-4 h-4" />
                      Método
                    </span>
                    <span className="font-medium text-gray-900 text-right">{item.payment_method_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                      Sede
                    </span>
                    <span className="font-medium text-gray-900 text-right">{item.branch_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0">
                      <User className="w-4 h-4" />
                      Doctor
                    </span>
                    <span className="font-medium text-gray-900 text-right">{item.dentist_name}</span>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Fechas
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Tratamiento: {formatDate(item.performed_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Voucher enviado: {formatDate(item.voucher_submitted_at)}</span>
                  </div>
                </div>
              </div>

              {/* Form de rechazo */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Motivo del rechazo</h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Indica el motivo del rechazo (ej: imagen borrosa, monto incorrecto, etc.)"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || isRejecting}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                    >
                      {isRejecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Rechazando...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Confirmar Rechazo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        {!showRejectForm && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isApproving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Aprobar Pago
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default VoucherViewModal;
