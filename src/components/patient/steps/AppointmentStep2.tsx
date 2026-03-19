import React, { useState, useEffect } from 'react';
import { User, Phone, CheckCircle, AlertCircle, FileText, Ticket, X, Loader2, CreditCard, DollarSign, Building2 } from 'lucide-react';
import type { AppointmentFormData, ValidatedCoupon } from '../hooks/useAppointmentForm';
import type { User as UserType } from '@/types';
import { getSpecialtyName, getWhatsAppBaseUrl, type PriceInfo } from '../utils/appointmentHelpers';
import { promotionsApi } from '@/services/api/promotionsApi';
import { branchPaymentMethodsApi, type BranchPaymentMethod } from '@/services/api/branchPaymentMethodsApi';

interface AppointmentStep2Props {
  formData: AppointmentFormData;
  errors: Record<string, string>;
  user: UserType | null;
  esClienteNuevo: boolean;
  tienePlanSalud: boolean;
  primeraConsultaDisponible?: boolean;
  nombrePlan?: string;
  availablePromotions: any[];
  priceInfo: PriceInfo;
  doctors: UserType[];
  sedesDisponibles: any[];
  getDoctorName: (doctorId: string, doctors: UserType[]) => string;
  getSedeName: (sedeId: string, sedesDisponibles: any[]) => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleVoucherUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<AppointmentFormData>>;
}

export const AppointmentStep2: React.FC<AppointmentStep2Props> = ({
  formData,
  errors,
  user,
  esClienteNuevo,
  tienePlanSalud,
  primeraConsultaDisponible,
  nombrePlan,
  availablePromotions,
  priceInfo,
  doctors,
  sedesDisponibles,
  getDoctorName,
  getSedeName,
  handleInputChange,
  handleVoucherUpload,
  setFormData
}) => {
  // Mostrar sección de pago si es cliente nuevo Y NO tiene primera consulta gratis disponible
  // - Nuevo con plan pero ya usó primera consulta -> paga
  // - Nuevo sin plan -> paga
  const mostrarSeccionPago = esClienteNuevo && !primeraConsultaDisponible;

  // Estado para métodos de pago dinámicos de la sede
  const [branchPaymentMethods, setBranchPaymentMethods] = useState<BranchPaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Cargar métodos de pago activos cuando hay sede seleccionada
  useEffect(() => {
    if (formData.sedeId) {
      const branchId = parseInt(formData.sedeId);
      if (!isNaN(branchId)) {
        setLoadingPaymentMethods(true);
        branchPaymentMethodsApi.getActivePaymentMethods(branchId)
          .then(methods => setBranchPaymentMethods(methods))
          .catch(() => setBranchPaymentMethods([]))
          .finally(() => setLoadingPaymentMethods(false));
      }
    } else {
      setBranchPaymentMethods([]);
    }
  }, [formData.sedeId]);

  // Iconos por tipo de método
  const methodTypeIcons: Record<string, React.ReactNode> = {
    yape: <Phone className="w-5 h-5" />,
    plin: <Phone className="w-5 h-5" />,
    bank_transfer: <Building2 className="w-5 h-5" />,
    cash: <DollarSign className="w-5 h-5" />,
    credit_card: <CreditCard className="w-5 h-5" />,
    debit_card: <CreditCard className="w-5 h-5" />,
    other: <CreditCard className="w-5 h-5" />
  };

  // Estado para validación de cupón
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Validar código de promoción (flujo simplificado - sin compra de cupón)
  const handleValidateCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setCouponError('Ingresa un código de promoción');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponError(null);

      // Llamar al endpoint de validación de promociones directamente
      const response = await promotionsApi.validatePromotionCode(
        formData.couponCode.trim().toUpperCase(),
        user?.id ? parseInt(user.id) : undefined,
        formData.sedeId ? parseInt(formData.sedeId) : undefined
      );

      if (response.success && response.applicable && response.data) {
        // Código válido - guardar datos de la promoción como ValidatedCoupon
        setFormData(prev => ({
          ...prev,
          validatedCoupon: {
            purchase_id: 0, // No aplica - es código directo
            purchase_code: formData.couponCode.trim().toUpperCase(),
            promotion_id: response.data!.promotion_id,
            promotion_name: response.data!.promotion_name,
            discount_type: response.data!.discount_type,
            discount_value: response.data!.discount_value,
            patient_name: user?.profile?.firstName || '',
            patient_id: user?.id ? parseInt(user.id) : 0
          } as ValidatedCoupon,
          // Limpiar promoción de lista si se usa código
          selectedPromotionId: ''
        }));
      } else {
        setCouponError(response.message || 'Código de promoción no válido');
        setFormData(prev => ({ ...prev, validatedCoupon: null }));
      }
    } catch (error: any) {
      setCouponError(error.message || 'Error al validar el código');
      setFormData(prev => ({ ...prev, validatedCoupon: null }));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Limpiar cupón validado
  const handleClearCoupon = () => {
    setFormData(prev => ({
      ...prev,
      couponCode: '',
      validatedCoupon: null
    }));
    setCouponError(null);
  };

  // Calcular descuento del cupón
  const getCouponDiscount = (basePrice: number): { discount: number; finalPrice: number } => {
    if (!formData.validatedCoupon) return { discount: 0, finalPrice: basePrice };

    const { discount_type, discount_value } = formData.validatedCoupon;
    let discount = 0;

    if (discount_type === 'percentage') {
      discount = (basePrice * discount_value) / 100;
    } else {
      discount = Math.min(discount_value, basePrice);
    }

    return {
      discount,
      finalPrice: Math.max(0, basePrice - discount)
    };
  };
  return (
    <div className="space-y-4">
      {/* Información del usuario registrado */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <User className="h-4 w-4" />
          Datos de Contacto Registrados
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Nombre:</strong> {user?.profile?.firstName} {user?.profile?.lastName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Teléfono:</strong> {user?.profile?.phone || 'No registrado'}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferencia de Contacto
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preferredContact"
              value="phone"
              checked={formData.preferredContact === 'phone'}
              onChange={handleInputChange}
              className="w-4 h-4 text-teal-600"
            />
            <Phone className="w-4 h-4" />
            <span className="text-sm">Llamada telefónica</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preferredContact"
              value="email"
              checked={formData.preferredContact === 'email'}
              onChange={handleInputChange}
              className="w-4 h-4 text-teal-600"
            />
            <span className="text-sm">Correo electrónico</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgencia
        </label>
        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="low">Baja (flexible con horarios)</option>
          <option value="normal">Normal</option>
          <option value="high">Alta (requiere atención pronta)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Describe el motivo de tu cita o cualquier información relevante..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
        />
      </div>

      {/* Mensaje para paciente con primera consulta gratis (Plan de Salud) */}
      {primeraConsultaDisponible && (
        <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 mb-1">
                Primera Consulta Gratis
              </h4>
              <p className="text-sm text-emerald-700">
                Tu {nombrePlan || 'Plan de Salud'} incluye la primera consulta gratis.
                No necesitas realizar ningún pago.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje para cliente continuador */}
      {!esClienteNuevo && !primeraConsultaDisponible && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Cliente Continuador
              </h4>
              <p className="text-sm text-green-700">
                Como ya eres nuestro paciente, esta consulta no tiene costo adicional.
                Puedes reservar tu cita directamente.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Sección de Código de Promoción */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-purple-600" />
          ¿Tienes un Código de Promoción?
        </h4>
        <p className="text-sm text-gray-600">
          Si tienes un código de promoción, ingrésalo aquí para aplicar el descuento.
        </p>

        {/* Código ya validado */}
        {formData.validatedCoupon ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Código Válido</p>
                  <p className="text-sm text-green-700 font-mono">{formData.validatedCoupon.purchase_code}</p>
                  <p className="text-sm text-green-800 mt-1">
                    <strong>{formData.validatedCoupon.promotion_name}</strong>
                  </p>
                  <p className="text-sm text-green-600">
                    Descuento: {formData.validatedCoupon.discount_type === 'percentage'
                      ? `${formData.validatedCoupon.discount_value}%`
                      : `S/ ${formData.validatedCoupon.discount_value.toFixed(2)}`
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearCoupon}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Quitar cupón"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Input para ingresar código */
          <div className="flex gap-2">
            <input
              type="text"
              name="couponCode"
              value={formData.couponCode}
              onChange={handleInputChange}
              placeholder="Ingresa tu código (ej: VERANO2026)"
              className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                couponError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isValidatingCoupon}
            />
            <button
              type="button"
              onClick={handleValidateCoupon}
              disabled={isValidatingCoupon || !formData.couponCode.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidatingCoupon ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Validar
                </>
              )}
            </button>
          </div>
        )}

        {/* Error de validación */}
        {couponError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {couponError}
          </div>
        )}

        {/* Link a Promociones */}
        <p className="text-xs text-gray-500">
          ¿No tienes código? <a href="/patient/promotions" className="text-purple-600 hover:underline">Ver promociones disponibles</a>
        </p>
      </div>

      {/* Resumen de Descuento con Cupón */}
      {formData.validatedCoupon && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border-2 border-purple-200">
          <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Descuento con Cupón Aplicado
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-gray-700">
              <span>Precio de Consulta:</span>
              <span className="font-medium">S/ {priceInfo.originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-purple-600">
              <span className="flex items-center gap-1">
                <Ticket className="w-4 h-4" /> Descuento ({formData.validatedCoupon.promotion_name}):
              </span>
              <span className="font-medium">
                -{formData.validatedCoupon.discount_type === 'percentage'
                  ? `${formData.validatedCoupon.discount_value}%`
                  : `S/ ${formData.validatedCoupon.discount_value.toFixed(2)}`
                }
              </span>
            </div>
            <div className="h-px bg-purple-300 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-purple-900">TOTAL CON DESCUENTO:</span>
              <span className="text-2xl font-bold text-purple-900">
                S/ {getCouponDiscount(priceInfo.originalPrice).finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-3 bg-purple-100 p-3 rounded-lg">
            <p className="text-xs text-purple-800 text-center">
              ✅ ¡Cupón aplicado! Ahorras S/ {getCouponDiscount(priceInfo.originalPrice).discount.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Sección de Promociones Internas (solo si no hay cupón) */}
      {!formData.validatedCoupon && (
      <>
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          ¿Tienes una Promoción Interna? (Opcional)
        </h4>

        {/* Mostrar promociones activas como opciones seleccionables */}
        {availablePromotions.length > 0 ? (
          <div className="space-y-3">
            {/* Opción: Sin promoción */}
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, selectedPromotionId: '' }))}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                formData.selectedPromotionId === ''
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.selectedPromotionId === ''
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.selectedPromotionId === '' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Sin promoción</span>
                </div>
              </div>
            </button>

            {/* Opciones: Promociones disponibles */}
            {availablePromotions.map((promo, index) => (
              <button
                key={`promo-${promo.id}-${index}`}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, selectedPromotionId: promo.id }))}
                className={`w-full text-left rounded-lg border-2 transition-all ${
                  formData.selectedPromotionId === promo.id
                    ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      formData.selectedPromotionId === promo.id
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.selectedPromotionId === promo.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-purple-900 mb-1">
                        {promo.title}
                      </h5>
                      <p className="text-sm text-purple-700 mb-2">
                        {promo.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full">
                          <span className="text-sm font-bold text-purple-900">
                            {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `S/ ${promo.discountValue} OFF`}
                          </span>
                        </div>
                        {promo.code && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-full">
                            <span className="text-xs text-purple-700">
                              Código: <span className="font-bold">{promo.code}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              No hay promociones disponibles en este momento
            </p>
          </div>
        )}
      </div>

      {/* Resumen de Precio con Descuento */}
      {formData.selectedPromotionId && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 p-5 rounded-lg border-2 border-green-200">
          <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            💰 Resumen de Precio
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-gray-700">
              <span>Precio de Consulta:</span>
              <span className="font-medium">S/ {priceInfo.originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span className="flex items-center gap-1">
                <span>🎁</span> Descuento ({priceInfo.promotionName}):
              </span>
              <span className="font-medium">-S/ {priceInfo.discount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-green-300 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-900">TOTAL A PAGAR:</span>
              <span className="text-2xl font-bold text-green-900">S/ {priceInfo.finalPrice.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 bg-green-100 p-3 rounded-lg">
            <p className="text-xs text-green-800 text-center">
              ✅ ¡Descuento aplicado! Ahorras S/ {priceInfo.discount.toFixed(2)}
            </p>
          </div>
        </div>
      )}
      </>
      )}

      {/* Métodos de Pago - Solo para clientes nuevos CON plan de salud */}
      {mostrarSeccionPago && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-lg font-medium text-blue-900 mb-2">Pago de Consulta - Cliente Nuevo</h4>
            <p className="text-sm text-blue-700">
              Como es tu primera visita, necesitamos que realices el pago de la consulta por adelantado.
            </p>
          </div>

          {/* Mensaje importante sobre la cancelación */}
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">
                  ⚠️ Importante para confirmar tu cita
                </h4>
                <p className="text-sm text-amber-800 font-medium">
                  Para que su cita sea válida y confirmada la reserva, debe hacer la cancelación del adelanto.
                </p>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-medium text-gray-900">Método de Pago</h4>

          {loadingPaymentMethods ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-teal-500 mr-2" />
              <span className="text-sm text-gray-500">Cargando métodos de pago...</span>
            </div>
          ) : branchPaymentMethods.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {branchPaymentMethods.map((method) => (
                <button
                  key={method.payment_method_id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.payment_method_id.toString() }))}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    formData.paymentMethod === method.payment_method_id.toString()
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-teal-600">
                      {methodTypeIcons[method.method_type] || <CreditCard className="w-5 h-5" />}
                    </div>
                    <span className="font-medium">{method.method_name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
              <p className="text-sm text-amber-700">
                No hay métodos de pago configurados para esta sede. Contacte a la clínica.
              </p>
            </div>
          )}
          {errors.paymentMethod && (
            <p className="text-sm text-red-600">{errors.paymentMethod}</p>
          )}

          {/* Detalles del método seleccionado */}
          {formData.paymentMethod && (() => {
            const selectedMethod = branchPaymentMethods.find(m => m.payment_method_id.toString() === formData.paymentMethod);
            if (!selectedMethod) return null;

            return (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900">
                    Detalles de Pago - {selectedMethod.method_name}
                  </h5>

                  <div className="bg-white p-4 rounded border space-y-2">
                    {/* Teléfono para Yape/Plin */}
                    {selectedMethod.phone_number && (
                      <p className="text-sm">
                        <strong>Número:</strong>{' '}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {selectedMethod.phone_number}
                        </span>
                      </p>
                    )}

                    {/* Titular */}
                    {selectedMethod.account_holder && (
                      <p className="text-sm">
                        <strong>Titular:</strong> {selectedMethod.account_holder}
                      </p>
                    )}

                    {/* Banco */}
                    {selectedMethod.bank_name && (
                      <p className="text-sm">
                        <strong>Banco:</strong> {selectedMethod.bank_name}
                      </p>
                    )}

                    {/* Número de cuenta */}
                    {selectedMethod.account_number && (
                      <p className="text-sm">
                        <strong>Número de Cuenta:</strong>{' '}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {selectedMethod.account_number}
                        </span>
                      </p>
                    )}

                    {/* Información adicional */}
                    {selectedMethod.additional_info && (
                      <p className="text-xs text-gray-500 mt-3 italic">
                        {selectedMethod.additional_info}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Contact Button */}
                  <div className="flex justify-center">
                    <a
                      href={`${getWhatsAppBaseUrl()}?text=${encodeURIComponent('Hola, tengo una consulta sobre el pago de mi cita')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span>📱</span>
                      Contactar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Subida de Voucher */}
          {formData.paymentMethod && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir Voucher de Pago *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleVoucherUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="voucher-upload"
                />
                <label
                  htmlFor="voucher-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  {formData.paymentVoucher ? (
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">
                        ✅ {formData.paymentVoucher.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.paymentVoucher.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">
                        Haz clic para subir tu voucher
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG o PDF (máx. 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {errors.paymentVoucher && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentVoucher}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de advertencia si falta completar campos */}
      {mostrarSeccionPago && (!formData.paymentMethod || !formData.paymentVoucher) && (
        <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Completa los siguientes campos para continuar:</p>
              <ul className="list-disc list-inside space-y-1">
                {!formData.paymentMethod && <li>Selecciona un método de pago</li>}
                {!formData.paymentVoucher && <li>Sube el voucher de pago</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <h4 className="font-medium text-teal-900 mb-2">Resumen de tu cita:</h4>
        <div className="text-sm text-teal-700 space-y-1">
          <p><strong>Fecha:</strong> {formData.date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}</p>
          <p><strong>Hora:</strong> {formData.time}</p>
          <p><strong>Sede:</strong> {getSedeName(formData.sedeId, sedesDisponibles)}</p>
          <p><strong>Especialidad:</strong> {getSpecialtyName(formData.specialtyId, doctors)}</p>
          <p><strong>Doctor:</strong> {getDoctorName(formData.doctorId, doctors)}</p>
        </div>
      </div>
    </div>
  );
};
