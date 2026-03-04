/**
 * TARJETA DE APROBACIÓN DE PRECIO - Cliente Externo
 *
 * Muestra la cotización enviada por el técnico y permite al cliente:
 * 1. Ver el desglose detallado de servicios
 * 2. Ver el precio final
 * 3. Aprobar la cotización
 * 4. Rechazar la cotización
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyRequestsApi } from '@/services/api/radiographyRequestsApi';
import type { RadiographyRequest } from '@/types';
import { formatPrice } from '@/services/laboratory';
import { useAuthStore } from '@/store/authStore';

interface PriceApprovalCardProps {
  request: RadiographyRequest;
  onApprove?: () => void;
  onReject?: () => void;
}

export const PriceApprovalCard = ({ request, onApprove, onReject }: PriceApprovalCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuthStore();

  // Detectar si debe usar tema cyan (imaging_technician o external_client)
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';

  if (!request.pricing || request.pricing.status !== 'sent_to_client') {
    return null;
  }

  const handleApprove = async () => {
    try {
      setIsProcessing(true);

      await radiographyRequestsApi.updateRequest(parseInt(request.id), {
        pricing_data: {
          ...request.pricing!,
          status: 'approved_by_client'
        },
        request_status: 'pending' // Sigue pendiente hasta que se suban los resultados
      });

      toast.success('Cotización aprobada exitosamente');
      onApprove?.();
    } catch (error) {
      toast.error('Error al aprobar la cotización');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);

      await radiographyRequestsApi.updateRequest(parseInt(request.id), {
        pricing_data: {
          ...request.pricing!,
          status: 'rejected_by_client'
        },
        request_status: 'cancelled' // Marcar como cancelada
      });

      toast.success('Cotización rechazada');
      onReject?.();
    } catch (error) {
      toast.error('Error al rechazar la cotización');
    } finally {
      setIsProcessing(false);
    }
  };

  const discount = request.pricing.discount || 0;
  const discountPercentage = request.pricing.discountPercentage || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br via-white rounded-xl shadow-lg border-2 overflow-hidden ${
        useCyanTheme
          ? 'from-cyan-50 to-teal-50 border-cyan-200'
          : 'from-purple-50 to-indigo-50 border-purple-200'
      }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r p-6 ${
        useCyanTheme
          ? 'from-cyan-500 to-teal-600'
          : 'from-purple-600 to-indigo-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Cotización Recibida
              </h3>
              <p className={`text-sm ${useCyanTheme ? 'text-cyan-100' : 'text-purple-100'}`}>
                Revisión y aprobación pendiente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {request.requestedDiscount && (
              <div className="bg-amber-400 text-amber-900 px-4 py-2 rounded-lg font-bold text-sm border-2 border-amber-500">
                💰 Con Promoción
              </div>
            )}
            <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-semibold text-sm">
              Pendiente
            </div>
          </div>
        </div>
      </div>

      {/* Precio Principal */}
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-600 text-sm mb-1">Total a Pagar:</p>
            <p className={`text-4xl font-bold ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`}>
              {formatPrice(request.pricing.finalPrice || 0)}
            </p>
            {discount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Descuento aplicado: {formatPrice(discount)} ({discountPercentage.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Botón para expandir desglose */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 text-gray-700 font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar Desglose
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver Desglose
              </>
            )}
          </button>
        </div>

        {/* Notas del Técnico */}
        {request.pricing.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">Nota del Técnico:</p>
                <p className="text-blue-800 text-sm">{request.pricing.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Desglose Expandible */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 pt-4 mt-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">Desglose de Servicios:</h4>
            <div className="space-y-2">
              {request.pricing.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{item.itemName}</span>
                    {item.quantity && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({item.quantity} × {formatPrice(item.basePrice)})
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal vs Final */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(request.pricing.suggestedPrice)}
                </span>
              </div>
              {discount !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {discount > 0 ? 'Descuento:' : 'Recargo:'}
                  </span>
                  <span className={`font-semibold ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {discount > 0 ? '-' : '+'} {formatPrice(Math.abs(discount))}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-300">
                <span className="font-bold text-gray-900">Total:</span>
                <span className={`font-bold ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`}>
                  {formatPrice(request.pricing.finalPrice || 0)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between gap-4">
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            Al aprobar, el equipo procederá con los estudios solicitados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-6 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-5 h-5" />
            Rechazar
          </button>

          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Aprobar Cotización
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
