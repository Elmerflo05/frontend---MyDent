/**
 * Modal para que el paciente suba un voucher de pago
 * Permite seleccionar método de pago y adjuntar imagen/PDF del comprobante
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { incomePaymentsApi, type PendingDebt } from '@/services/api/incomePaymentsApi';
import { validateVoucherFile } from '@/services/api/uploadService';

interface UploadVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebts: PendingDebt[];
  onSuccess: () => void;
}

// Métodos de pago que permiten voucher
const VOUCHER_PAYMENT_METHODS = [
  { id: 4, name: 'Transferencia Bancaria', icon: '🏦' },
  { id: 5, name: 'Yape', icon: '💜' },
  { id: 6, name: 'Plin', icon: '💚' },
  { id: 7, name: 'Depósito Bancario', icon: '🏧' },
];

const UploadVoucherModal = ({
  isOpen,
  onClose,
  selectedDebts,
  onSuccess
}: UploadVoucherModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular total de la deuda seleccionada
  const totalAmount = selectedDebts.reduce((sum, debt) => {
    return sum + parseFloat(String(debt.balance || debt.final_amount || 0));
  }, 0);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((file: File) => {
    try {
      validateVoucherFile(file);
      setSelectedFile(file);

      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  // Manejar cambio de input de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Manejar drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Limpiar archivo seleccionado
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar voucher
  const handleSubmit = async () => {
    if (!selectedFile || !selectedPaymentMethod) {
      toast.error('Por favor selecciona un archivo y método de pago');
      return;
    }

    if (selectedDebts.length === 0) {
      toast.error('No hay pagos seleccionados');
      return;
    }

    try {
      setIsSubmitting(true);

      const incomeIds = selectedDebts.map(debt => debt.income_id);

      await incomePaymentsApi.submitVoucher(
        incomeIds,
        selectedFile,
        selectedPaymentMethod
      );

      toast.success('Voucher enviado exitosamente. Pendiente de verificación.');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error al enviar voucher:', error);
      toast.error(error.message || 'Error al enviar el voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal y limpiar estado
  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedPaymentMethod(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Subir Voucher de Pago</h2>
                  <p className="text-sm text-gray-500">Adjunta tu comprobante de pago</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Resumen de pagos seleccionados */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Pagos a registrar:</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedDebts.map(debt => (
                    <div key={debt.income_id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[200px]">{debt.item_name}</span>
                      <span className="font-medium text-gray-900">
                        S/ {parseFloat(String(debt.balance || debt.final_amount)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-700">Total:</span>
                  <span className="font-bold text-lg text-orange-600">
                    S/ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selector de método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago utilizado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOUCHER_PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl mr-2">{method.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Área de subida de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobante de pago
                </label>

                {!selectedFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      dragActive
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-orange-600">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG o PDF (max. 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      {/* Info del archivo */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Archivo listo</span>
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={clearFile}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Nota informativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Importante:</p>
                    <p>Tu pago será verificado por nuestro equipo. Una vez aprobado, se actualizará el estado de tu cuenta.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedFile || !selectedPaymentMethod}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar Voucher
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default UploadVoucherModal;
