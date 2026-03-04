// ============================================================================
// VOUCHER UPLOAD MODAL - Modal para subir vouchers de pago (Paciente)
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { paymentScheduleService } from '@/services/healthPlan/PaymentScheduleService';
import AlertModal from '@/components/common/AlertModal';
import { formatDateToYMD } from '@/utils/dateUtils';
import {
  Upload,
  X,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import type { HealthPlanSubscription, BaseHealthPlan } from '@/types/healthPlans';

interface VoucherUploadModalProps {
  subscription: HealthPlanSubscription;
  plan: BaseHealthPlan;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoucherUploadModal({
  subscription,
  plan,
  onClose,
  onSuccess
}: VoucherUploadModalProps) {
  const { uploadVoucher, loading, loadPlanTerms } = useHealthPlanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: plan.price,
    paymentDate: formatDateToYMD(new Date()),
    voucherImage: '',
    imagePreview: ''
  });

  const [errors, setErrors] = useState({
    amount: '',
    paymentDate: '',
    voucherImage: ''
  });

  const [showTerms, setShowTerms] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Cargar términos y condiciones del plan
  useEffect(() => {
    const loadTerms = async () => {
      if (plan.termsId) {
        const terms = await loadPlanTerms(plan.termsId);
        if (terms) {
          setTermsContent(terms.content);
        }
      }
    };
    loadTerms();
  }, [plan.termsId, loadPlanTerms]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, voucherImage: 'Solo se permiten imágenes' }));
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, voucherImage: 'La imagen no puede superar 5MB' }));
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({
        ...prev,
        voucherImage: base64,
        imagePreview: base64
      }));
      setErrors(prev => ({ ...prev, voucherImage: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleImageChange({
        target: fileInputRef.current
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const validate = () => {
    const newErrors = {
      amount: '',
      paymentDate: '',
      voucherImage: ''
    };

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Ingresa el monto del pago';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Selecciona la fecha del pago';
    }

    if (!formData.voucherImage) {
      newErrors.voucherImage = 'Sube la imagen del voucher';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Validar términos y condiciones
    if (!acceptedTerms) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Términos y Condiciones',
        message: 'Debes aceptar los términos y condiciones para continuar.'
      });
      return;
    }

    try {
      const paymentPeriod = paymentScheduleService.formatPaymentPeriod(
        new Date(formData.paymentDate)
      );

      await uploadVoucher(
        subscription.id,
        subscription.patientId,
        subscription.planId,
        formData.voucherImage,
        formData.amount,
        new Date(formData.paymentDate),
        paymentPeriod
      );

      setAlertModal({
        isOpen: true,
        type: 'success',
        title: '¡Voucher Enviado!',
        message: 'Tu comprobante de pago ha sido enviado exitosamente. Nuestro equipo lo revisará y te notificaremos cuando sea aprobado.'
      });

      // Cerrar modal después de mostrar alerta
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 100);
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Subir Voucher',
        message: 'Ocurrió un error al subir tu comprobante. Por favor, verifica tu conexión e intenta nuevamente.'
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Contenido del modal */}
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subir Voucher de Pago</h2>
            <p className="text-sm text-gray-600 mt-1">Plan: {plan.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Alert - Pago Inicial */}
          {subscription.totalPaid === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    Esperando voucher de pago inicial
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Este es tu primer pago. Una vez subas el voucher, nuestro equipo lo revisará para activar tu plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comprobante de Pago *
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                formData.imagePreview
                  ? 'border-green-300 bg-green-50'
                  : errors.voucherImage
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {formData.imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Imagen cargada (clic para cambiar)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-base font-medium text-gray-700">
                      Arrastra tu voucher o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {errors.voucherImage && (
              <p className="text-sm text-red-600 mt-1">{errors.voucherImage}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monto Pagado (S/) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Monto sugerido: S/ {plan.price.toFixed(2)} ({plan.billingCycle})
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha del Pago *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                max={formatDateToYMD(new Date())}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.paymentDate
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.paymentDate && (
              <p className="text-sm text-red-600 mt-1">{errors.paymentDate}</p>
            )}
          </div>

          {/* Términos y Condiciones */}
          {termsContent && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="w-full p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">
                    Términos y Condiciones del Plan
                  </span>
                </div>
                <ArrowRight
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    showTerms ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showTerms && (
                <div className="p-4 bg-white border-t border-gray-200 max-h-64 overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: termsContent }}
                  />
                </div>
              )}

              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    He leído y acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline"
                    >
                      Términos y Condiciones
                    </button>{' '}
                    del plan de salud
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Información Importante
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tu voucher será revisado por el administrador</li>
                  <li>• Recibirás una notificación cuando sea aprobado o rechazado</li>
                  <li>• Asegúrate de que la imagen sea clara y legible</li>
                  <li>• Si es rechazado, podrás subir uno nuevo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Subir Voucher
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
