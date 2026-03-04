/**
 * MODAL DE EDICIÓN DE PRECIOS - Técnico de Imágenes
 *
 * Permite al técnico:
 * 1. Ver el desglose detallado de precios calculado automáticamente
 * 2. Modificar el precio final antes de enviar al cliente
 * 3. Agregar notas sobre el precio
 * 4. Enviar la cotización al cliente
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, DollarSign, Info, Percent, Save } from 'lucide-react';
import { toast } from 'sonner';
import { radiographyRequestsApi } from '@/services/api/radiographyRequestsApi';
import type { RadiographyRequest } from '@/types';
import { formatPrice } from '@/services/laboratory';
import { useAuthStore } from '@/store/authStore';

interface EditPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RadiographyRequest;
  onSuccess: () => void;
}

export const EditPricingModal = ({ isOpen, onClose, request, onSuccess }: EditPricingModalProps) => {
  const [finalPrice, setFinalPrice] = useState(request.pricing?.finalPrice || request.pricing?.suggestedPrice || 0);
  const [notes, setNotes] = useState(request.pricing?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();

  // Detectar si debe usar tema cyan (imaging_technician o external_client)
  const useCyanTheme = user?.role === 'imaging_technician' || user?.role === 'external_client';

  if (!request.pricing) {
    return null;
  }

  const suggestedPrice = request.pricing.suggestedPrice;
  const discount = suggestedPrice - finalPrice;
  const discountPercentage = suggestedPrice > 0 ? ((discount / suggestedPrice) * 100) : 0;

  const handleSaveAndSend = async () => {
    try {
      setIsSaving(true);

      // Actualizar la solicitud con el precio modificado
      await radiographyRequestsApi.updateRequest(parseInt(request.id), {
        pricing_data: {
          ...request.pricing!,
          finalPrice,
          discount: discount > 0 ? discount : undefined,
          discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
          status: 'sent_to_client'
        },
        request_status: 'in_progress', // Cambiar estado de la solicitud
        notes: notes || undefined
      });

      toast.success('Cotización enviada al cliente exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al guardar el precio');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
        {/* Overlay oscuro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Contenido del modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r px-6 py-4 flex items-center justify-between ${
            useCyanTheme
              ? 'from-cyan-500 to-teal-600'
              : 'from-purple-600 to-indigo-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Configurar Precio de Cotización
                </h2>
                <p className={`text-sm ${useCyanTheme ? 'text-cyan-100' : 'text-purple-100'}`}>
                  Paciente: {request.patientData.nombre}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Desglose de Precios */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Desglose de Servicios Solicitados
              </h3>
              <div className="space-y-2">
                {request.pricing.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-white rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{item.itemName}</span>
                      {item.quantity && (
                        <span className="text-gray-500 ml-2">
                          ({item.quantity} × {formatPrice(item.basePrice)})
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Precio Sugerido */}
              <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Precio Sugerido (Automático):
                </span>
                <span className={`text-2xl font-bold ${useCyanTheme ? 'text-cyan-600' : 'text-purple-600'}`}>
                  {formatPrice(suggestedPrice)}
                </span>
              </div>
            </div>

            {/* Editor de Precio Final */}
            <div className={`bg-gradient-to-br rounded-lg p-6 border-2 ${
              useCyanTheme
                ? 'from-cyan-50 to-teal-50 border-cyan-200'
                : 'from-purple-50 to-indigo-50 border-purple-200'
            }`}>
              <h3 className="font-semibold text-gray-900 mb-4">
                Ajustar Precio Final
              </h3>

              <div className="space-y-4">
                {/* Input de Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Final a Enviar al Cliente
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold text-lg">
                      S/.
                    </span>
                    <input
                      type="number"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className={`w-full pl-14 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-lg font-semibold ${
                        useCyanTheme
                          ? 'border-cyan-300 focus:ring-cyan-500'
                          : 'border-purple-300 focus:ring-purple-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Mostrar Descuento/Recargo */}
                {discount !== 0 && (
                  <div className={`p-4 rounded-lg ${discount > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">
                        {discount > 0 ? 'Descuento Aplicado:' : 'Recargo Aplicado:'}
                      </span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(Math.abs(discount))}
                        </div>
                        <div className={`text-sm ${discount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <Percent className="w-3 h-3 inline mr-1" />
                          {Math.abs(discountPercentage).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas sobre el Precio (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ej: Se aplicó descuento por ser cliente frecuente..."
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none ${
                      useCyanTheme ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Resumen Final */}
            <div className={`bg-gradient-to-r rounded-lg p-6 text-white ${
              useCyanTheme
                ? 'from-cyan-500 to-teal-600'
                : 'from-purple-600 to-indigo-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${useCyanTheme ? 'text-cyan-100' : 'text-purple-100'}`}>Total a Cobrar:</p>
                  <p className="text-3xl font-bold">{formatPrice(finalPrice)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${useCyanTheme ? 'text-cyan-100' : 'text-purple-100'}`}>
                    {discount > 0 && `Ahorro: ${formatPrice(discount)}`}
                    {discount < 0 && `Adicional: ${formatPrice(Math.abs(discount))}`}
                    {discount === 0 && 'Sin modificaciones'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              onClick={handleSaveAndSend}
              disabled={isSaving || finalPrice <= 0}
              className={`px-6 py-3 bg-gradient-to-r text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                useCyanTheme
                  ? 'from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700'
                  : 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Cotización al Cliente
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
