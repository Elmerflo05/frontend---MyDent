/**
 * PaymentPendingModal - Modal para gestionar pagos pendientes del paciente
 * Muestra deudas pendientes y permite subir vouchers de pago
 * Diseño con colores MyDent (cyan/turquesa)
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Receipt,
  ArrowRight,
  ChevronLeft,
  Wallet,
  Shield
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { incomePaymentsApi, type PendingDebt } from '@/services/api/incomePaymentsApi';
import { catalogsApi } from '@/services/api/catalogsApi';
import { toast } from 'sonner';

interface PaymentMethod {
  payment_method_id: number;
  method_name: string;
  method_code: string;
  status: string;
  is_electronic: boolean;
}

interface PaymentPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  onPaymentSubmitted?: () => void;
}

const PaymentPendingModal: React.FC<PaymentPendingModalProps> = ({
  isOpen,
  onClose,
  patientId,
  onPaymentSubmitted
}) => {
  const [debts, setDebts] = useState<PendingDebt[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'list' | 'upload'>('list');

  // Estado para el upload
  const [selectedDebts, setSelectedDebts] = useState<number[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string>('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen && patientId) {
      loadData();
    }
  }, [isOpen, patientId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [debtsResponse, methodsResponse] = await Promise.all([
        incomePaymentsApi.getPatientPendingDebts(patientId),
        catalogsApi.getPaymentMethods()
      ]);

      // Filtrar solo deudas pendientes, parciales y rechazadas con balance > 0
      const pendingDebts = debtsResponse.debts.filter(
        d => (d.payment_status === 'pending' || d.payment_status === 'partial' || d.payment_status === 'rejected')
          && parseFloat(String(d.balance || 0)) > 0
      );
      setDebts(pendingDebts);

      // Filtrar métodos de pago activos, electrónicos y que no sean "Efectivo"
      // Solo Yape, Plin, Transferencia para pacientes
      const activeMethods = (methodsResponse.data || []).filter(
        (m: PaymentMethod) =>
          m.status === 'active' &&
          m.is_electronic &&
          !m.method_name.toLowerCase().includes('efectivo')
      );
      setPaymentMethods(activeMethods);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los pagos pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDebt = (incomeId: number) => {
    setSelectedDebts(prev =>
      prev.includes(incomeId)
        ? prev.filter(id => id !== incomeId)
        : [...prev, incomeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDebts.length === debts.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(debts.map(d => d.income_id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (PNG, JPG) o PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5MB');
      return;
    }

    setVoucherFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setVoucherPreview('pdf');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({
        target: fileInputRef.current
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleSubmitVoucher = async () => {
    if (selectedDebts.length === 0) {
      toast.error('Selecciona al menos un pago');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }

    if (!voucherFile) {
      toast.error('Sube el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    try {
      await incomePaymentsApi.submitVoucher(
        selectedDebts,
        voucherFile,
        selectedPaymentMethod
      );

      toast.success('Comprobante enviado exitosamente');

      setSelectedDebts([]);
      setSelectedPaymentMethod(null);
      setVoucherFile(null);
      setVoucherPreview('');
      setStep('list');

      await loadData();
      onPaymentSubmitted?.();

      if (debts.length === selectedDebts.length) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error al enviar voucher:', error);
      toast.error(error.message || 'Error al enviar el comprobante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return debts
      .filter(d => selectedDebts.includes(d.income_id))
      .reduce((sum, d) => sum + parseFloat(String(d.balance || 0)), 0);
  };

  const calculateTotalPending = () => {
    return debts.reduce((sum, d) => sum + parseFloat(String(d.balance || 0)), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: Clock
        };
      case 'partial':
        return {
          label: 'Parcial',
          color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
          icon: RefreshCw
        };
      case 'pending_verification':
        return {
          label: 'En verificación',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: RefreshCw
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: AlertTriangle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: AlertCircle
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnBackdropClick={false}
      closeOnEscape={true}
      showCloseButton={false}
    >
      {/* Header con gradiente MyDent */}
      <div className="relative overflow-hidden">
        {/* Fondo con gradiente */}
        <div className="bg-gradient-to-br from-clinic-primary via-clinic-secondary to-clinic-accent px-6 py-8 text-center relative">
          {/* Patrón decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full" />
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icono principal animado */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-20 h-20 mx-auto mb-4"
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl rotate-6" />
            <div className="absolute inset-0 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              {step === 'list' ? (
                <Wallet className="w-10 h-10 text-clinic-primary" />
              ) : (
                <Receipt className="w-10 h-10 text-clinic-primary" />
              )}
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-clinic-accent rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </motion.div>
          </motion.div>

          {/* Título */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {step === 'list' ? 'Mis Pagos Pendientes' : 'Enviar Comprobante'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/90 text-sm max-w-xs mx-auto"
          >
            {step === 'list'
              ? 'Selecciona los tratamientos y sube tu comprobante de pago'
              : 'Adjunta el comprobante de tu transferencia o pago móvil'}
          </motion.p>

          {/* Badge de total */}
          {step === 'list' && debts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <span className="text-white/80 text-sm">Total pendiente:</span>
              <span className="text-white font-bold text-lg">{formatCurrency(calculateTotalPending())}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <Modal.Body className="p-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative">
                <div className="w-12 h-12 border-4 border-clinic-light rounded-full" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-clinic-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-gray-500 text-sm">Cargando información...</p>
            </motion.div>
          ) : debts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¡Estás al día!
              </h3>
              <p className="text-gray-500 max-w-xs">
                No tienes pagos pendientes. Gracias por confiar en MyDent para tu salud dental.
              </p>
            </motion.div>
          ) : step === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              {/* Barra de selección */}
              <div className="flex items-center justify-between bg-clinic-light/50 rounded-xl p-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedDebts.length === debts.length && debts.length > 0}
                      onChange={handleSelectAll}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:border-clinic-primary peer-checked:bg-clinic-primary transition-all duration-200 flex items-center justify-center">
                      {selectedDebts.length === debts.length && debts.length > 0 && (
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-clinic-dark transition-colors">
                    Seleccionar todos ({debts.length})
                  </span>
                </label>

                {selectedDebts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-clinic-primary text-white px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-xs">Total:</span>
                    <span className="font-bold">{formatCurrency(calculateTotal())}</span>
                  </motion.div>
                )}
              </div>

              {/* Lista de deudas */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {debts.map((debt, index) => {
                  const statusConfig = getStatusConfig(debt.payment_status);
                  const StatusIcon = statusConfig.icon;
                  const isSelected = selectedDebts.includes(debt.income_id);

                  return (
                    <motion.div
                      key={debt.income_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectDebt(debt.income_id)}
                      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-clinic-primary bg-clinic-light/30 shadow-md shadow-clinic-primary/10'
                          : 'border-gray-100 bg-white hover:border-clinic-secondary/50 hover:shadow-sm'
                      }`}
                    >
                      {/* Indicador de selección */}
                      <div className={`absolute top-4 left-4 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        isSelected
                          ? 'border-clinic-primary bg-clinic-primary'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>

                      <div className="ml-8">
                        {/* Header del item */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm pr-2 leading-tight">
                            {debt.item_name}
                          </h4>
                          <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Motivo de rechazo */}
                        {debt.rejection_reason && (
                          <div className="bg-red-50 border border-red-100 rounded-lg p-2 mb-2">
                            <p className="text-xs text-red-600">
                              <strong>Motivo:</strong> {debt.rejection_reason}
                            </p>
                          </div>
                        )}

                        {/* Metadatos */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-clinic-secondary" />
                            {formatDate(debt.performed_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-clinic-secondary" />
                            {debt.dentist_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-clinic-secondary" />
                            {debt.branch_name}
                          </span>
                        </div>

                        {/* Monto */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">Monto a pagar</span>
                          <span className={`text-lg font-bold ${isSelected ? 'text-clinic-primary' : 'text-gray-900'}`}>
                            {formatCurrency(parseFloat(String(debt.balance || 0)))}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              {/* Resumen */}
              <div className="bg-gradient-to-r from-clinic-light to-cyan-50 rounded-xl p-4 mb-4 border border-clinic-secondary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-clinic-dark/70 mb-1">Tratamientos seleccionados</p>
                    <p className="text-sm font-medium text-clinic-dark">{selectedDebts.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-clinic-dark/70 mb-1">Total a pagar</p>
                    <p className="text-2xl font-bold text-clinic-primary">{formatCurrency(calculateTotal())}</p>
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.payment_method_id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.payment_method_id)}
                      className={`relative p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                        selectedPaymentMethod === method.payment_method_id
                          ? 'border-clinic-primary bg-clinic-light/50 shadow-md'
                          : 'border-gray-100 bg-white hover:border-clinic-secondary/50'
                      }`}
                    >
                      {selectedPaymentMethod === method.payment_method_id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-clinic-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className={`text-sm font-medium ${
                        selectedPaymentMethod === method.payment_method_id
                          ? 'text-clinic-primary'
                          : 'text-gray-700'
                      }`}>
                        {method.method_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload de voucher */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Comprobante de Pago
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    voucherPreview
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-clinic-primary hover:bg-clinic-light/30'
                  }`}
                >
                  {voucherPreview ? (
                    <div className="space-y-3">
                      {voucherPreview === 'pdf' ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-red-500" />
                          </div>
                          <p className="text-sm text-gray-700 font-medium mt-2">
                            {voucherFile?.name}
                          </p>
                        </div>
                      ) : (
                        <img
                          src={voucherPreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded-lg shadow-md"
                        />
                      )}
                      <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Archivo listo (clic para cambiar)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-clinic-light rounded-xl mx-auto flex items-center justify-center">
                        <Upload className="w-7 h-7 text-clinic-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Arrastra tu comprobante aquí
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          o haz clic para seleccionar (PNG, JPG, PDF - máx. 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-clinic-light/50 border border-clinic-secondary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-clinic-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-clinic-primary" />
                  </div>
                  <div className="text-xs text-clinic-dark/80">
                    <p className="font-semibold text-clinic-dark mb-1">Proceso seguro</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Tu comprobante será verificado en máximo 24 horas</li>
                      <li>Recibirás una notificación cuando se apruebe</li>
                      <li>La imagen debe ser clara y legible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer className="border-t border-gray-100">
        {debts.length === 0 ? (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200"
          >
            Entendido
          </button>
        ) : step === 'list' ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cerrar
            </button>
            <button
              onClick={() => setStep('upload')}
              disabled={selectedDebts.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-clinic-primary to-clinic-secondary text-white rounded-xl font-medium shadow-lg shadow-clinic-primary/25 hover:shadow-xl hover:shadow-clinic-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setStep('list');
                setVoucherFile(null);
                setVoucherPreview('');
                setSelectedPaymentMethod(null);
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
            <button
              onClick={handleSubmitVoucher}
              disabled={isSubmitting || !voucherFile || !selectedPaymentMethod}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-clinic-primary to-clinic-secondary text-white rounded-xl font-medium shadow-lg shadow-clinic-primary/25 hover:shadow-xl hover:shadow-clinic-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Enviar Comprobante
                </>
              )}
            </button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentPendingModal;
