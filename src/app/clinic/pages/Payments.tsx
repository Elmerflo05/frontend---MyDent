import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { formatDateToYMD, formatTimestampToLima } from '@/utils/dateUtils';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Printer,
  Receipt,
  Banknote,
  Wallet,
  X,
  FileCheck,
  ClipboardList,
  Package,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { PaymentApiService, type ServiceItem } from '../services/paymentApiService';
import { incomePaymentsApi, type PatientWithDebt, type PaymentHistoryItem } from '@/services/api/incomePaymentsApi';
import { radiographyApi, type ExternalPaymentData } from '@/services/api/radiographyApi';
import { paymentsApi, type PaymentItemData } from '@/services/api/paymentsApi';
import { subProceduresApi } from '@/services/api/subProceduresApi';
import { dentalProceduresApi } from '@/services/api/dentalProceduresApi';
import { additionalServicesApi } from '@/services/api/additionalServicesApi';
import { useAuth } from '@/hooks/useAuth';
import type { Patient, Appointment } from '@/types';
import VoucherVerificationPanel from '../components/payments/VoucherVerificationPanel';

interface Payment {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  description: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: Date;
  dueDate?: Date;
  createdBy: string;
  notes?: string;
  receiptNumber: string;
  services: ServiceItem[];
}

const SERVICE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  sub_procedure: { label: 'Sub-Proc.', color: 'bg-blue-100 text-blue-700' },
  dental_procedure: { label: 'Proc. Dental', color: 'bg-purple-100 text-purple-700' },
  additional_service: { label: 'Servicio Adic.', color: 'bg-teal-100 text-teal-700' },
  manual: { label: 'Manual', color: 'bg-gray-100 text-gray-700' }
};

const PAYMENT_METHODS = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'bg-green-100 text-green-800' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-100 text-blue-800' },
  bank_transfer: { label: 'Transferencia', icon: DollarSign, color: 'bg-purple-100 text-purple-800' },
  digital_wallet: { label: 'Billetera Digital', icon: Wallet, color: 'bg-orange-100 text-orange-800' }
};

const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  failed: { label: 'Fallido', icon: XCircle, color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
};

type TabType = 'debts' | 'payments' | 'verification' | 'lab_externo';

const Payments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('debts');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [patientsWithDebts, setPatientsWithDebts] = useState<PatientWithDebt[]>([]);
  const [externalPayments, setExternalPayments] = useState<ExternalPaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtSearchTerm, setDebtSearchTerm] = useState('');
  const [labExternoSearchTerm, setLabExternoSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  // Estado para modal detalle de pago directo
  const [directPaymentDetail, setDirectPaymentDetail] = useState<{
    payment: any;
    items: PaymentItemData[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Estados para expansión de pacientes en Cuentas por Cobrar
  const [expandedPatients, setExpandedPatients] = useState<Set<number>>(new Set());
  const [patientDebtsDetails, setPatientDebtsDetails] = useState<Record<number, any[]>>({});
  const [loadingPatientDebts, setLoadingPatientDebts] = useState<number | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [user?.branch_id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Filtrar por sede del usuario (excepto super_admin que ve todo)
      const branchId = user?.role !== 'super_admin' && user?.branch_id ? user.branch_id : undefined;

      const [patientsData, appointmentsData, historyData, debtsData, externalPaymentsData] = await Promise.all([
        PaymentApiService.loadPatients(),
        PaymentApiService.loadAppointments(branchId),
        incomePaymentsApi.getAllPaymentHistory({ branch_id: branchId, limit: 200 }),
        incomePaymentsApi.getPatientsWithDebts({ branch_id: branchId }),
        // Cargar pagos externos de laboratorio
        // Super admin ve todos, admin/recepcionista solo ve los de su sede
        ['super_admin', 'admin', 'receptionist'].includes(user?.role || '')
          ? radiographyApi.getAllExternalPayments({
              limit: 200,
              ...(user?.role !== 'super_admin' && user?.branch_id ? { branch_id: user.branch_id } : {})
            })
          : Promise.resolve({ success: true, data: [], total: 0 })
      ]);

      setPatients(patientsData);
      setAppointments(appointmentsData);
      setPaymentHistory(historyData);
      setPatientsWithDebts(debtsData);
      setExternalPayments(externalPaymentsData.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de pagos');
    } finally {
      setIsLoading(false);
    }
  };

  // Get patient name by ID (para formulario de nuevo pago)
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente desconocido';
  };

  // Filtrar historial de pagos
  const filteredHistory = paymentHistory.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patient_dni?.includes(searchTerm);

    // Mapear estados del backend a los del frontend
    const statusMap: Record<string, string> = {
      'paid': 'completed',
      'pending': 'pending',
      'partial': 'pending',
      'pending_verification': 'pending',
      'rejected': 'failed',
      'courtesy': 'completed'
    };
    const mappedStatus = statusMap[item.payment_status] || 'pending';
    const matchesStatus = selectedStatus === 'all' || mappedStatus === selectedStatus;

    // Filtrar por método de pago
    const paymentMethodMap: Record<string, string> = {
      'Efectivo': 'cash',
      'Tarjeta': 'card',
      'Tarjeta de Crédito': 'card',
      'Tarjeta de Débito': 'card',
      'Transferencia': 'bank_transfer',
      'Transferencia Bancaria': 'bank_transfer',
      'Yape': 'digital_wallet',
      'Plin': 'digital_wallet',
      'Billetera Digital': 'digital_wallet'
    };
    const mappedMethod = item.payment_method_name ? (paymentMethodMap[item.payment_method_name] || 'cash') : null;
    const matchesMethod = selectedMethod === 'all' || mappedMethod === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Agrupar historial por batch_id para vista colapsable
  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const batchKey = item.batch_id || `single-${item.income_id}`;
    if (!acc[batchKey]) {
      acc[batchKey] = [];
    }
    acc[batchKey].push(item);
    return acc;
  }, {} as Record<string, PaymentHistoryItem[]>);

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

  // Toggle para expandir/colapsar pacientes en Cuentas por Cobrar
  const togglePatientExpansion = async (patientId: number) => {
    const isCurrentlyExpanded = expandedPatients.has(patientId);

    if (isCurrentlyExpanded) {
      // Colapsar
      setExpandedPatients(prev => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    } else {
      // Expandir - cargar items si no están cargados
      if (!patientDebtsDetails[patientId]) {
        try {
          setLoadingPatientDebts(patientId);
          const branchId = user?.role !== 'super_admin' && user?.branch_id ? user.branch_id : undefined;
          const response = await incomePaymentsApi.getPatientPendingDebts(patientId, {
            branch_id: branchId,
            include_all: true
          });
          setPatientDebtsDetails(prev => ({
            ...prev,
            [patientId]: response.debts || []
          }));
        } catch (error) {
          console.error('Error al cargar deudas del paciente:', error);
          toast.error('Error al cargar los items de deuda');
        } finally {
          setLoadingPatientDebts(null);
        }
      }

      setExpandedPatients(prev => {
        const newSet = new Set(prev);
        newSet.add(patientId);
        return newSet;
      });
    }
  };

  // Ver detalle de un pago directo (con items/servicios)
  const viewDirectPaymentDetail = async (paymentId: number) => {
    try {
      setLoadingDetail(true);
      const response = await paymentsApi.getPaymentById(paymentId);
      const data = response.data as any;
      setDirectPaymentDetail({
        payment: data,
        items: data.items || []
      });
    } catch (error) {
      console.error('Error al cargar detalle del pago:', error);
      toast.error('Error al cargar el detalle del pago');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Agrupar items de deuda por batch_id
  const groupDebtsByBatch = (debts: any[]) => {
    return debts.reduce((acc, item) => {
      const batchKey = item.batch_id || `single-${item.income_id}`;
      if (!acc[batchKey]) {
        acc[batchKey] = [];
      }
      acc[batchKey].push(item);
      return acc;
    }, {} as Record<string, any[]>);
  };

  // Estadísticas del historial
  const getStats = () => {
    const total = paymentHistory.length;
    const completed = paymentHistory.filter(p => p.payment_status === 'paid' || p.payment_status === 'courtesy').length;
    const pending = paymentHistory.filter(p => p.payment_status === 'pending' || p.payment_status === 'partial' || p.payment_status === 'pending_verification').length;
    const totalRevenue = paymentHistory
      .filter(p => p.payment_status === 'paid' || p.payment_status === 'courtesy')
      .reduce((sum, p) => sum + (parseFloat(String(p.amount_paid)) || 0), 0);

    const today = formatDateToYMD(new Date());
    const todayPayments = paymentHistory.filter(p =>
      p.performed_date?.startsWith(today)
    ).length;

    return { total, completed, pending, totalRevenue, todayPayments };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
                <p className="text-gray-600">Control de pagos, facturación y transacciones</p>
              </div>
            </div>

            {activeTab === 'payments' && (
              <button
                onClick={() => setShowNewPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar Pago
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'debts'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Cuentas por Cobrar
              {patientsWithDebts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                  {patientsWithDebts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'payments'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Historial de Pagos
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'verification'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Verificar Vouchers
            </button>
            {/* Tab de Lab Externo - visible para super_admin, admin, recepcionista */}
            {['super_admin', 'admin', 'receptionist'].includes(user?.role || '') && (
              <button
                onClick={() => setActiveTab('lab_externo')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'lab_externo'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Lab Externo
                {externalPayments.filter(p => p.payment_status === 'pending').length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                    {externalPayments.filter(p => p.payment_status === 'pending').length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Contenido según tab activo */}
          {activeTab === 'verification' ? (
            <VoucherVerificationPanel branchId={user?.branch_id} onVoucherVerified={loadData} />
          ) : activeTab === 'lab_externo' ? (
            <LabExternoTab
              externalPayments={externalPayments}
              searchTerm={labExternoSearchTerm}
              setSearchTerm={setLabExternoSearchTerm}
              processingPaymentId={processingPaymentId}
              onRegisterPayment={async (requestId) => {
                const confirmed = window.confirm('¿Confirmar el registro de pago para esta solicitud? Esta acción no se puede deshacer.');
                if (!confirmed) return;

                setProcessingPaymentId(requestId);
                try {
                  await radiographyApi.registerPayment(requestId);
                  toast.success('Pago registrado exitosamente');
                  await loadData();
                } catch (error) {
                  console.error('Error al registrar pago:', error);
                  toast.error('Error al registrar el pago');
                } finally {
                  setProcessingPaymentId(null);
                }
              }}
            />
          ) : activeTab === 'debts' ? (
            <>
              {/* Resumen de deudas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Pacientes Deudores</p>
                      <p className="text-2xl font-bold text-red-900">{patientsWithDebts.length}</p>
                    </div>
                    <User className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Items Pendientes</p>
                      <p className="text-2xl font-bold text-amber-900">
                        {patientsWithDebts.reduce((sum, p) => sum + (parseInt(String(p.pending_items)) || 0), 0)}
                      </p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-amber-600" />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Total por Cobrar</p>
                      <p className="text-2xl font-bold text-orange-900">
                        S/ {patientsWithDebts.reduce((sum, p) => sum + (parseFloat(String(p.total_balance)) || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-600" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Items Vencidos</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {patientsWithDebts.reduce((sum, p) => sum + (parseInt(String(p.overdue_items)) || 0), 0)}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Filtro de búsqueda */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={debtSearchTerm}
                    onChange={(e) => setDebtSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-80"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {patientsWithDebts.filter(p =>
                    debtSearchTerm === '' ||
                    p.patient_name?.toLowerCase().includes(debtSearchTerm.toLowerCase()) ||
                    p.identification_number?.includes(debtSearchTerm)
                  ).length} pacientes con deuda
                </div>
              </div>

              {/* Tabla de pacientes con deudas */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items Pendientes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deuda Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Servicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patientsWithDebts
                        .filter(p =>
                          debtSearchTerm === '' ||
                          p.patient_name?.toLowerCase().includes(debtSearchTerm.toLowerCase()) ||
                          p.identification_number?.includes(debtSearchTerm)
                        )
                        .map((patient) => {
                          const isExpanded = expandedPatients.has(patient.patient_id);
                          const isLoading = loadingPatientDebts === patient.patient_id;
                          const patientDebts = patientDebtsDetails[patient.patient_id] || [];
                          const groupedDebts = groupDebtsByBatch(patientDebts);

                          return (
                            <React.Fragment key={patient.patient_id}>
                              {/* Fila principal del paciente - clickeable para expandir */}
                              <tr
                                className={`hover:bg-red-50 cursor-pointer transition-colors ${isExpanded ? 'bg-red-50 border-l-4 border-l-red-400' : ''}`}
                                onClick={() => togglePatientExpansion(patient.patient_id)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <button className="p-1 hover:bg-red-100 rounded transition-colors mr-2">
                                      {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                      ) : isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-red-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-red-600" />
                                      )}
                                    </button>
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-red-600" />
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {patient.patient_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        DNI: {patient.identification_number}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{patient.mobile || '-'}</div>
                                  <div className="text-sm text-gray-500">{patient.email || '-'}</div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    {patient.pending_items} items
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {isExpanded ? 'Click para colapsar' : 'Click para ver detalle'}
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-lg font-bold text-red-600">
                                    S/ {(parseFloat(String(patient.total_balance)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {patient.latest_service_date
                                    ? new Date(patient.latest_service_date).toLocaleDateString('es-ES')
                                    : '-'}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  {patient.overdue_items > 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {patient.overdue_items} vencidos
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Filas de items expandidos - agrupados por batch */}
                              {isExpanded && patientDebts.length > 0 && (
                                <>
                                  {/* Encabezado de items */}
                                  <tr className="bg-gray-50 border-l-4 border-l-red-300">
                                    <td colSpan={6} className="px-6 py-2">
                                      <div className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase">
                                        <Package className="w-3 h-3" />
                                        Detalle de items pendientes ({patientDebts.length} items)
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Items agrupados por batch */}
                                  {Object.entries(groupedDebts).map(([batchKey, batchItems]: [string, any[]]) => {
                                    const isBatchGroup = batchItems.length > 1 && batchItems[0].batch_id;
                                    const batchTotal = batchItems.reduce((sum, item) => sum + (parseFloat(String(item.balance)) || 0), 0);

                                    if (isBatchGroup) {
                                      // Grupo de items (lote)
                                      return (
                                        <React.Fragment key={batchKey}>
                                          {/* Fila de grupo */}
                                          <tr className="bg-orange-50/50 border-l-4 border-l-orange-300">
                                            <td colSpan={3} className="px-6 py-2 pl-12">
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                  <Package className="w-3 h-3 mr-1" />
                                                  Lote: {batchItems.length} items
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {formatTimestampToLima(batchItems[0].performed_date, 'date')}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap">
                                              <div className="text-sm font-bold text-red-600">
                                                S/ {batchTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                              </div>
                                            </td>
                                            <td colSpan={2}></td>
                                          </tr>

                                          {/* Items del lote */}
                                          {batchItems.map((item, idx) => (
                                            <tr key={`${batchKey}-${item.income_id}`} className="bg-orange-50/30 border-l-4 border-l-orange-200">
                                              <td colSpan={3} className="px-6 py-1.5 pl-16">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-orange-400 mt-0.5">•</span>
                                                  <div>
                                                    <div className="text-sm text-gray-800">{item.item_name}</div>
                                                    {item.tooth_number && (
                                                      <div className="text-xs text-gray-500">Pieza: {item.tooth_number}</div>
                                                    )}
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-6 py-1.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                  S/ {(parseFloat(String(item.balance)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                </div>
                                              </td>
                                              <td className="px-6 py-1.5 whitespace-nowrap text-xs text-gray-500">
                                                {item.dentist_name}
                                              </td>
                                              <td className="px-6 py-1.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                  item.payment_status === 'pending_verification' ? 'bg-blue-100 text-blue-800' :
                                                  item.payment_status === 'partial' ? 'bg-orange-100 text-orange-800' :
                                                  'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                  {item.payment_status === 'pending_verification' ? 'Por Verificar' :
                                                   item.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </React.Fragment>
                                      );
                                    } else {
                                      // Item individual
                                      const item = batchItems[0];
                                      return (
                                        <tr key={`single-${item.income_id}`} className="bg-red-50/30 border-l-4 border-l-red-200">
                                          <td colSpan={3} className="px-6 py-2 pl-12">
                                            <div className="flex items-start gap-2">
                                              <span className="text-red-400 mt-0.5">•</span>
                                              <div>
                                                <div className="text-sm font-medium text-gray-800">{item.item_name}</div>
                                                {item.tooth_number && (
                                                  <div className="text-xs text-gray-500">Pieza: {item.tooth_number}</div>
                                                )}
                                                <div className="text-xs text-gray-400">
                                                  {formatTimestampToLima(item.performed_date, 'date')}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-red-600">
                                              S/ {(parseFloat(String(item.balance)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </div>
                                          </td>
                                          <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500">
                                            {item.dentist_name}
                                          </td>
                                          <td className="px-6 py-2 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                              item.payment_status === 'pending_verification' ? 'bg-blue-100 text-blue-800' :
                                              item.payment_status === 'partial' ? 'bg-orange-100 text-orange-800' :
                                              'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {item.payment_status === 'pending_verification' ? 'Por Verificar' :
                                               item.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    }
                                  })}
                                </>
                              )}

                              {/* Mensaje si está cargando o no hay items */}
                              {isExpanded && patientDebts.length === 0 && !isLoading && (
                                <tr className="bg-gray-50 border-l-4 border-l-red-300">
                                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No se encontraron items de deuda para este paciente
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {patientsWithDebts.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sin deudas pendientes</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No hay pacientes con deudas pendientes en esta sede.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Pagos</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completados</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Ingresos Total</p>
                  <p className="text-2xl font-bold text-blue-900">S/. {stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Hoy</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.todayPayments}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por paciente, descripción o recibo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-80"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(PAYMENT_STATUS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">Todos los métodos</option>
              {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {filteredHistory.length} de {paymentHistory.length} servicios
            </div>
          </div>

          {/* Payments History Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedHistory).map(([batchKey, batchItems]) => {
                    const isBatch = batchItems.length > 1 && batchItems[0].batch_id;
                    const isExpanded = expandedBatches.has(batchKey);
                    const firstItem = batchItems[0];

                    // Calcular totales del lote
                    const batchTotal = batchItems.reduce((sum, item) => sum + (parseFloat(String(item.final_amount)) || 0), 0);
                    const batchPaid = batchItems.reduce((sum, item) => sum + (parseFloat(String(item.amount_paid)) || 0), 0);
                    const batchBalance = batchItems.reduce((sum, item) => sum + (parseFloat(String(item.balance)) || 0), 0);

                    // Mapear estados
                    const statusLabels: Record<string, { label: string; color: string }> = {
                      'paid': { label: 'Pagado', color: 'bg-green-100 text-green-800' },
                      'pending': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
                      'partial': { label: 'Parcial', color: 'bg-orange-100 text-orange-800' },
                      'pending_verification': { label: 'Por Verificar', color: 'bg-blue-100 text-blue-800' },
                      'rejected': { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
                      'courtesy': { label: 'Cortesía', color: 'bg-purple-100 text-purple-800' }
                    };

                    // Si es un lote, mostrar fila resumen + filas detalle expandibles
                    if (isBatch) {
                      const statusConfig = statusLabels[firstItem.payment_status] || { label: firstItem.payment_status, color: 'bg-gray-100 text-gray-800' };

                      return (
                        <React.Fragment key={batchKey}>
                          {/* Fila resumen del lote - clickeable */}
                          <tr
                            className={`hover:bg-orange-50 cursor-pointer border-l-4 border-l-orange-400 ${isExpanded ? 'bg-orange-50' : ''}`}
                            onClick={() => toggleBatchExpansion(batchKey)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button className="p-1 hover:bg-orange-100 rounded transition-colors">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-orange-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-orange-600" />
                                  )}
                                </button>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatTimestampToLima(firstItem.date_time_registration || firstItem.performed_date, firstItem.date_time_registration ? 'datetime' : 'date')}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-orange-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {firstItem.patient_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {firstItem.patient_dni}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                                  <Package className="w-4 h-4 mr-1.5" />
                                  Lote: {batchItems.length} tratamientos
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isExpanded ? 'Click para colapsar' : 'Click para ver detalle'}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                S/ {batchTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-green-600">
                                S/ {batchPaid.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </div>
                              {batchBalance > 0 && (
                                <div className="text-xs text-red-500 font-medium">
                                  Debe: S/ {batchBalance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              {firstItem.payment_method_name ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  firstItem.payment_method_name === 'Efectivo' ? 'bg-green-100 text-green-800' :
                                  firstItem.payment_method_name?.includes('Tarjeta') ? 'bg-blue-100 text-blue-800' :
                                  firstItem.payment_method_name?.includes('Transferencia') ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {firstItem.payment_method_name === 'Efectivo' && <Banknote className="w-3 h-3 mr-1" />}
                                  {firstItem.payment_method_name?.includes('Tarjeta') && <CreditCard className="w-3 h-3 mr-1" />}
                                  {firstItem.payment_method_name?.includes('Transferencia') && <DollarSign className="w-3 h-3 mr-1" />}
                                  {(firstItem.payment_method_name === 'Yape' || firstItem.payment_method_name === 'Plin') && <Wallet className="w-3 h-3 mr-1" />}
                                  {firstItem.payment_method_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {firstItem.dentist_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {firstItem.branch_name}
                              </div>
                            </td>
                            <td className="px-4 py-4"></td>
                          </tr>

                          {/* Filas de detalle del lote (cuando está expandido) */}
                          {isExpanded && batchItems.map((item, index) => {
                            const itemStatusConfig = statusLabels[item.payment_status] || { label: item.payment_status, color: 'bg-gray-100 text-gray-800' };
                            return (
                              <tr key={`detail-${item.income_id}`} className="bg-orange-50/30 border-l-4 border-l-orange-300">
                                {/* Columna vacía para mantener alineación */}
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <div className="pl-6 text-xs text-gray-400">
                                    └─
                                  </div>
                                </td>

                                {/* Columna vacía - paciente ya se muestra arriba */}
                                <td className="px-6 py-2 whitespace-nowrap"></td>

                                {/* Nombre del tratamiento */}
                                <td className="px-6 py-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-orange-400 mt-0.5">•</span>
                                    <div>
                                      <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                        {item.item_name}
                                        {(item as any).record_type === 'direct_payment' && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                            Pago directo
                                          </span>
                                        )}
                                      </div>
                                      {item.tooth_number && (
                                        <div className="text-xs text-gray-500">
                                          Pieza: {item.tooth_number}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Monto */}
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-700">
                                    S/ {(parseFloat(String(item.final_amount)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </div>
                                </td>

                                {/* Pagado */}
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <div className="text-sm text-green-600">
                                    S/ {(parseFloat(String(item.amount_paid)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </div>
                                  {parseFloat(String(item.balance)) > 0 && (
                                    <div className="text-xs text-red-500">
                                      Debe: S/ {parseFloat(String(item.balance)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </td>

                                {/* Estado */}
                                <td className="px-6 py-2 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${itemStatusConfig.color}`}>
                                    {itemStatusConfig.label}
                                  </span>
                                </td>

                                {/* Método de pago */}
                                <td className="px-6 py-2 whitespace-nowrap">
                                  {item.payment_method_name ? (
                                    <span className="text-xs text-gray-600">
                                      {item.payment_method_name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>

                                {/* Doctor - solo mostrar si es diferente */}
                                <td className="px-6 py-2 whitespace-nowrap"></td>
                                <td className="px-4 py-2"></td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    }

                    // Item individual (sin batch_id o lote de 1)
                    const item = firstItem;
                    const statusConfig = statusLabels[item.payment_status] || { label: item.payment_status, color: 'bg-gray-100 text-gray-800' };

                    return (
                      <tr key={item.income_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 pl-6">
                            {formatTimestampToLima(item.date_time_registration || item.performed_date, item.date_time_registration ? 'datetime' : 'date')}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-orange-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {item.patient_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.patient_dni}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-gray-900 max-w-xs truncate flex items-center gap-2">
                              {item.item_name}
                              {(item as any).record_type === 'direct_payment' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                  Pago directo
                                </span>
                              )}
                            </div>
                            {item.tooth_number && (
                              <div className="text-xs text-gray-500">
                                Pieza: {item.tooth_number}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            S/ {(parseFloat(String(item.final_amount)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            S/ {(parseFloat(String(item.amount_paid)) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </div>
                          {parseFloat(String(item.balance)) > 0 && (
                            <div className="text-xs text-red-500">
                              Debe: S/ {parseFloat(String(item.balance)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.payment_method_name ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.payment_method_name === 'Efectivo' ? 'bg-green-100 text-green-800' :
                              item.payment_method_name?.includes('Tarjeta') ? 'bg-blue-100 text-blue-800' :
                              item.payment_method_name?.includes('Transferencia') ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {item.payment_method_name === 'Efectivo' && <Banknote className="w-3 h-3 mr-1" />}
                              {item.payment_method_name?.includes('Tarjeta') && <CreditCard className="w-3 h-3 mr-1" />}
                              {item.payment_method_name?.includes('Transferencia') && <DollarSign className="w-3 h-3 mr-1" />}
                              {(item.payment_method_name === 'Yape' || item.payment_method_name === 'Plin') && <Wallet className="w-3 h-3 mr-1" />}
                              {item.payment_method_name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {item.dentist_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.branch_name}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          {(item as any).record_type === 'direct_payment' && (
                            <button
                              onClick={() => viewDirectPaymentDetail(Math.abs(item.income_id))}
                              disabled={loadingDetail}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver servicios incluidos"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron servicios</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay registros de servicios que coincidan con los filtros.
                </p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Modal Detalle de Pago Directo */}
        {directPaymentDetail && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
            style={{ zIndex: 9999 }}
            onClick={() => setDirectPaymentDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Detalle del Pago</h2>
                    <p className="text-sm text-gray-500">
                      {directPaymentDetail.payment.patient_name || 'Pago directo'} &mdash; {formatTimestampToLima(directPaymentDetail.payment.date_time_registration || directPaymentDetail.payment.payment_date, directPaymentDetail.payment.date_time_registration ? 'datetime' : 'date')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDirectPaymentDetail(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Info general */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Monto total:</span>
                    <span className="ml-2 font-bold text-green-700">S/ {Number(directPaymentDetail.payment.amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Método:</span>
                    <span className="ml-2 font-medium">{directPaymentDetail.payment.payment_method_name || '-'}</span>
                  </div>
                </div>

                {directPaymentDetail.payment.notes && (
                  <div className="text-sm">
                    <span className="text-gray-500">Descripción:</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">{directPaymentDetail.payment.notes}</p>
                  </div>
                )}

                {/* Tabla de servicios incluidos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Servicios Incluidos</h4>
                  {directPaymentDetail.items.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Servicio</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Tipo</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {directPaymentDetail.items.map((item, idx) => {
                            const typeConfig = SERVICE_TYPE_LABELS[item.item_type] || SERVICE_TYPE_LABELS.manual;
                            return (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-gray-800">{item.item_name}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-800">
                                  S/ {(Number(item.unit_price) * (item.quantity || 1)).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-3 py-2 text-right font-semibold text-gray-700">Total:</td>
                            <td className="px-3 py-2 text-right font-bold text-green-700">
                              S/ {directPaymentDetail.items.reduce((sum, i) => sum + Number(i.unit_price) * (i.quantity || 1), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Este pago no tiene servicios detallados</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200">
                <button
                  onClick={() => setDirectPaymentDetail(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

        {/* New Payment Modal - Header y Footer fijos */}
        {showNewPaymentModal && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
            style={{ zIndex: 9999 }}
            onClick={() => setShowNewPaymentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Fijo */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Registrar Nuevo Pago</h2>
                    <p className="text-sm text-gray-500">Complete los datos del pago</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewPaymentModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body con Scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <NewPaymentForm
                  patients={patients}
                  appointments={appointments}
                  onSave={async (newPayment) => {
                    try {
                      // Guardar en la base de datos
                      await PaymentApiService.createPayment(
                        newPayment,
                        user?.branch_id || 1
                      );
                      setShowNewPaymentModal(false);
                      toast.success('Pago registrado exitosamente');
                      // Recargar datos desde la BD para mostrar info completa
                      await loadData();
                    } catch (error) {
                      console.error('Error al guardar pago:', error);
                      toast.error('Error al guardar el pago en la base de datos');
                    }
                  }}
                  onCancel={() => setShowNewPaymentModal(false)}
                />
              </div>

            </motion.div>
          </div>,
          document.body
        )}

        {/* Payment Details Modal */}
        {selectedPayment && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/50"
            style={{ zIndex: 9999 }}
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalles del Pago - {selectedPayment.receiptNumber}</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información General</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Recibo:</strong> {selectedPayment.receiptNumber}</div>
                    <div><strong>Fecha:</strong> {new Date(selectedPayment.date).toLocaleDateString('es-ES')}</div>
                    <div><strong>Paciente:</strong> {getPatientName(selectedPayment.patientId)}</div>
                    <div><strong>Monto:</strong> S/. {selectedPayment.amount.toFixed(2)}</div>
                    <div><strong>Descripción:</strong> {selectedPayment.description}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Estado del Pago</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <strong>Estado:</strong>
                      {(() => {
                        const statusConfig = PAYMENT_STATUS[selectedPayment.status];
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <strong>Método:</strong>
                      {(() => {
                        const methodConfig = PAYMENT_METHODS[selectedPayment.method];
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${methodConfig.color}`}>
                            <methodConfig.icon className="w-3 h-3 mr-1" />
                            {methodConfig.label}
                          </span>
                        );
                      })()}
                    </div>
                    
                    {selectedPayment.dueDate && (
                      <div><strong>Fecha de Vencimiento:</strong> {new Date(selectedPayment.dueDate).toLocaleDateString('es-ES')}</div>
                    )}
                  </div>
                </div>

                {selectedPayment.services && selectedPayment.services.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Servicios</h4>
                  {typeof selectedPayment.services[0] === 'string' ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {(selectedPayment.services as any[]).map((service: any, index: number) => (
                        <li key={index} className="text-gray-700">{service}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Servicio</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Tipo</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(selectedPayment.services as ServiceItem[]).map((item, index) => {
                            const typeConfig = SERVICE_TYPE_LABELS[item.type] || SERVICE_TYPE_LABELS.manual;
                            return (
                              <tr key={index}>
                                <td className="px-3 py-2 text-gray-800">{item.name}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-800">S/ {(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-3 py-2 text-right font-semibold text-gray-700">Total:</td>
                            <td className="px-3 py-2 text-right font-bold text-green-700">
                              S/ {(selectedPayment.services as ServiceItem[]).reduce((sum, s) => sum + s.price * s.quantity, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                )}

                {selectedPayment.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Notas Adicionales</h4>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedPayment.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Editar Pago
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <Receipt className="w-4 h-4 mr-2 inline" />
                  Imprimir Recibo
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </motion.div>
    </div>
  );
};

// New Payment Form Component
interface NewPaymentFormProps {
  patients: Patient[];
  appointments: Appointment[];
  onSave: (payment: Payment) => void | Promise<void>;
  onCancel: () => void;
}

const NewPaymentForm = ({ patients, appointments, onSave, onCancel }: NewPaymentFormProps) => {
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    description: '',
    method: 'cash' as Payment['method'],
    notes: '',
    services: [] as ServiceItem[]
  });

  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Service search states
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const totalAmount = useMemo(() => {
    return formData.services.reduce((sum, s) => sum + s.price * s.quantity, 0);
  }, [formData.services]);

  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setCurrentPatient(patient || null);
    } else {
      setCurrentPatient(null);
    }
  }, [formData.patientId, patients]);

  // Debounced search across all service APIs
  useEffect(() => {
    if (serviceSearchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const term = serviceSearchTerm.toLowerCase();
        const results: ServiceItem[] = [];

        const [subProcsResult, dentalProcsResult, additionalResult] = await Promise.allSettled([
          subProceduresApi.getSubProcedures({ search: serviceSearchTerm, is_active: true, limit: 10 }),
          dentalProceduresApi.searchProcedures(serviceSearchTerm),
          additionalServicesApi.getAllServices()
        ]);

        // Map sub-procedures
        if (subProcsResult.status === 'fulfilled' && subProcsResult.value?.data) {
          subProcsResult.value.data.slice(0, 10).forEach((sp: any) => {
            results.push({
              name: sp.sub_procedure_name,
              price: Number(sp.price_without_plan) || 0,
              quantity: 1,
              type: 'sub_procedure',
              source: 'Sub-Procedimiento',
              sourceId: sp.sub_procedure_id
            });
          });
        }

        // Map dental procedures
        if (dentalProcsResult.status === 'fulfilled' && dentalProcsResult.value) {
          (dentalProcsResult.value as any[]).slice(0, 10).forEach((dp: any) => {
            results.push({
              name: dp.procedure_name,
              price: Number(dp.default_price) || 0,
              quantity: 1,
              type: 'dental_procedure',
              source: 'Proc. Dental',
              sourceId: dp.dental_procedure_id
            });
          });
        }

        // Map additional services (filter client-side)
        if (additionalResult.status === 'fulfilled' && additionalResult.value?.data) {
          const data = additionalResult.value.data;
          // Orthodontic plans
          if (data.orthodontic_plans) {
            data.orthodontic_plans
              .filter((op: any) => op.plan_type?.toLowerCase().includes(term) || 'ortodoncia'.includes(term))
              .slice(0, 5)
              .forEach((op: any) => {
                results.push({
                  name: `Ortodoncia - ${op.plan_type}`,
                  price: Number(op.monto_total || op.pago_mensual) || 0,
                  quantity: 1,
                  type: 'additional_service',
                  source: 'Ortodoncia',
                  sourceId: op.orthodontic_plan_id
                });
              });
          }
          // Implant plans
          if (data.implant_plans) {
            data.implant_plans
              .filter((ip: any) => ip.plan_type?.toLowerCase().includes(term) || 'implante'.includes(term))
              .slice(0, 5)
              .forEach((ip: any) => {
                results.push({
                  name: `Implante - ${ip.plan_type}`,
                  price: Number(ip.monto_total) || 0,
                  quantity: 1,
                  type: 'additional_service',
                  source: 'Implante',
                  sourceId: ip.implant_plan_id
                });
              });
          }
          // Prosthesis items
          if (data.prosthesis_items) {
            data.prosthesis_items
              .filter((pi: any) => pi.treatment_projection?.toLowerCase().includes(term) || 'protesis'.includes(term))
              .slice(0, 5)
              .forEach((pi: any) => {
                results.push({
                  name: pi.treatment_projection,
                  price: Number(pi.cost) || 0,
                  quantity: 1,
                  type: 'additional_service',
                  source: 'Prótesis',
                  sourceId: pi.prosthesis_item_id
                });
              });
          }
        }

        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Error buscando servicios:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [serviceSearchTerm]);

  const addServiceItem = useCallback((item: ServiceItem) => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, item]
    }));
    setServiceSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  }, []);

  const removeServiceItem = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  }, []);

  const updateServicePrice = useCallback((index: number, newPrice: number) => {
    setFormData(prev => {
      const updated = [...prev.services];
      updated[index] = { ...updated[index], price: newPrice };
      return { ...prev, services: updated };
    });
  }, []);

  const addManualService = useCallback(() => {
    if (!manualName.trim() || !manualPrice) return;
    addServiceItem({
      name: manualName.trim(),
      price: parseFloat(manualPrice),
      quantity: 1,
      type: 'manual'
    });
    setManualName('');
    setManualPrice('');
    setShowManualInput(false);
  }, [manualName, manualPrice, addServiceItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.description) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    if (formData.services.length === 0) {
      toast.error('Debe agregar al menos un servicio');
      return;
    }

    setIsSaving(true);

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      patientId: formData.patientId,
      appointmentId: formData.appointmentId || undefined,
      amount: totalAmount,
      description: formData.description,
      method: formData.method,
      status: 'completed' as Payment['status'],
      date: new Date(),
      createdBy: 'current-receptionist',
      receiptNumber: `REC-${String(Date.now()).slice(-6)}`,
      services: formData.services,
      notes: formData.notes || undefined
    };

    try {
      await onSave(newPayment);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form id="new-payment-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="font-semibold text-orange-900 mb-3">Información del Paciente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - DNI: {patient.dni}
                </option>
              ))}
            </select>
          </div>

          {currentPatient && (
            <div className="bg-white p-3 rounded border">
              <div className="text-sm">
                <div><strong>Edad:</strong> {new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear()} años</div>
                <div><strong>Teléfono:</strong> {currentPatient.phone}</div>
                <div><strong>Email:</strong> {currentPatient.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Amount - Read only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total</label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
            {formData.services.length > 0 ? (
              <span className="text-lg font-bold text-green-700">S/ {totalAmount.toFixed(2)}</span>
            ) : (
              <span className="text-gray-400 text-sm">Agregue servicios para calcular el total</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
          <select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value as Payment['method'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción del Pago <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Describir el motivo del pago..."
          required
        />
      </div>

      {/* Services Selector */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900">Servicios Incluidos</h4>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar manual
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar servicio del catálogo..."
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Search results dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => {
                const typeConfig = SERVICE_TYPE_LABELS[result.type] || SERVICE_TYPE_LABELS.manual;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addServiceItem(result)}
                    className="w-full px-3 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{result.name}</div>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                        {result.source || typeConfig.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-700 whitespace-nowrap">S/ {Number(result.price).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual service input */}
        {showManualInput && (
          <div className="flex gap-2 mb-3 p-3 bg-white rounded-lg border border-blue-200">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Precio"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addManualService}
              disabled={!manualName.trim() || !manualPrice}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Agregar
            </button>
            <button
              type="button"
              onClick={() => { setShowManualInput(false); setManualName(''); setManualPrice(''); }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selected services list */}
        {formData.services.length > 0 ? (
          <div className="space-y-2">
            {formData.services.map((item, index) => {
              const typeConfig = SERVICE_TYPE_LABELS[item.type] || SERVICE_TYPE_LABELS.manual;
              return (
                <div key={index} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateServicePrice(index, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceItem(index)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {/* Total line */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-200">
              <span className="text-sm font-semibold text-blue-900">Total:</span>
              <span className="text-lg font-bold text-green-700">S/ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">
            Busque un servicio arriba o agregue uno manualmente
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Notas opcionales..."
        />
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            'Registrar Pago'
          )}
        </button>
      </div>

    </form>
  );
};

// Lab Externo Tab Component
interface LabExternoTabProps {
  externalPayments: ExternalPaymentData[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  processingPaymentId: number | null;
  onRegisterPayment: (requestId: number) => Promise<void>;
}

const LabExternoTab = ({
  externalPayments,
  searchTerm,
  setSearchTerm,
  processingPaymentId,
  onRegisterPayment
}: LabExternoTabProps) => {
  // Filtrar pagos por busqueda
  const filteredPayments = externalPayments.filter(payment => {
    if (searchTerm === '') return true;
    const patientData = payment.request_data?.patient;
    const patientName = patientData ? `${patientData.nombres} ${patientData.apellidos}`.toLowerCase() : '';
    const patientDni = patientData?.dni || '';
    return patientName.includes(searchTerm.toLowerCase()) || patientDni.includes(searchTerm);
  });

  // Estadisticas
  const pendingPayments = externalPayments.filter(p => p.payment_status === 'pending');
  const paidPayments = externalPayments.filter(p => p.payment_status === 'paid');
  const totalPending = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.final_price) || 0), 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.final_price) || 0), 0);

  return (
    <>
      {/* Resumen de pagos externos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Servicios</p>
              <p className="text-2xl font-bold text-purple-900">{externalPayments.length}</p>
            </div>
            <Receipt className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Pendientes</p>
              <p className="text-2xl font-bold text-amber-900">{pendingPayments.length}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Por Cobrar</p>
              <p className="text-2xl font-bold text-orange-900">
                S/ {totalPending.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Recaudado</p>
              <p className="text-2xl font-bold text-green-900">
                S/ {totalPaid.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtro de busqueda */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI del cliente externo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-80"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredPayments.length} de {externalPayments.length} servicios
        </div>
      </div>

      {/* Tabla de pagos externos */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente Externo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const patientData = payment.request_data?.patient;
                const patientName = patientData
                  ? `${patientData.nombres || ''} ${patientData.apellidos || ''}`.trim()
                  : 'Cliente Externo';
                const patientDni = patientData?.dni || '-';
                const isProcessing = processingPaymentId === payment.radiography_request_id;

                return (
                  <tr key={payment.payment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTimestampToLima(payment.date_time_registration, 'date')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestampToLima(payment.date_time_registration, 'time')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patientName || 'Cliente Externo'}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {patientDni}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.radiography_type || 'Estudio de imagen'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Solicitud #{payment.radiography_request_id}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-purple-600">
                        S/ {(payment.final_price || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.payment_status === 'pending' ? (
                        <button
                          onClick={() => onRegisterPayment(payment.radiography_request_id)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-1" />
                              Registrar Pago
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <div>Pagado por: {payment.paid_by_name || '-'}</div>
                          <div className="text-xs">
                            {payment.paid_at
                              ? formatTimestampToLima(payment.paid_at, 'date')
                              : ''}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin servicios externos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay servicios de laboratorio externo registrados.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Payments;