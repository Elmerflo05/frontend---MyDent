// ============================================================================
// HEALTH PLANS (PATIENT) - Afíliate al Plan - Vista para Pacientes
// ============================================================================

import { useState, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { useAuthStore } from '@/store/authStore';
import { paymentScheduleService } from '@/services/healthPlan/PaymentScheduleService';
import VoucherUploadModal from '@/components/healthPlans/VoucherUploadModal';
import AlertModal from '@/components/common/AlertModal';
import {
  Check,
  Star,
  Heart,
  Shield,
  ArrowRight,
  FileText,
  X,
  RefreshCw,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Download,
  Search,
  Users,
  Crown,
  DollarSign,
  Building2,
  Calendar,
  Info
} from 'lucide-react';
import type { BaseHealthPlan, HealthPlanSubscription } from '@/types/healthPlans';
import { getPlanBenefitText } from '@/types/healthPlans';
// ❌ ELIMINADO: import de db (ahora usa backend PostgreSQL)
// import type { PlanContract } from '@/data/contracts/planTemplates';
import { motion } from 'framer-motion';
import healthPlansApi from '@/services/api/healthPlansApi';
import { mapHealthPlansFromBackend } from '@/services/api/healthPlansMapper';
import { patientsApi } from '@/services/api/patientsApi';
import { companiesApi } from '@/services/api/companiesApi';
import type { Patient, Company } from '@/types';
import { format } from 'date-fns';

// Tipo local para contratos de plan (cuando no está disponible la API)
interface PlanContract {
  id: string;
  titulo: string;
  descripcion: string;
  planNombre: string;
  planId: string;
  activo: boolean;
  version: string;
  contenidoHtml: string;
}

export default function HealthPlans() {
  const { user } = useAuthStore();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [companyContract, setCompanyContract] = useState<any | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const {
    plans,
    currentSubscription,
    loading,
    error,
    loadAvailablePlans,
    loadPatientSubscription,
    subscribeToPlan,
    cancelSubscription,
    loadPlanTerms
  } = useHealthPlanStore();

  const [selectedPlan, setSelectedPlan] = useState<BaseHealthPlan | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [daysUntilPayment, setDaysUntilPayment] = useState<number | null>(null);
  const [latestVoucher, setLatestVoucher] = useState<any>(null);

  // Estados para contratos de planes
  const [planContracts, setPlanContracts] = useState<PlanContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<PlanContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Estados para modales
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Cargar datos del paciente y empresa
  useEffect(() => {
    loadPatientAndCompany();
  }, [user]);

  const loadPatientAndCompany = async () => {
    if (!user?.profile?.dni) {
      setIsLoadingCompany(false);
      return;
    }

    try {
      // Buscar paciente por DNI usando la API
      const patientsResponse = await patientsApi.getPatients({ search: user.profile.dni, limit: 1 });
      const patient = patientsResponse.data[0];

      if (patient) {
        // Mapear datos de la API al tipo Patient
        const mappedPatient: Patient = {
          id: patient.patient_id?.toString() || '',
          firstName: patient.first_name || '',
          lastName: patient.last_name || '',
          dni: patient.identification_number || '',
          email: patient.email || '',
          phone: patient.mobile || '',
          companyId: patient.company_id?.toString(),
          ruc: patient.ruc,
          businessName: patient.business_name,
          status: patient.is_active ? 'active' : 'inactive',
          createdAt: patient.created_at ? new Date(patient.created_at) : new Date(),
          updatedAt: patient.updated_at ? new Date(patient.updated_at) : new Date()
        };
        setPatientData(mappedPatient);

        if (patient.company_id) {
          // Obtener empresa por ID
          const companyResponse = await companiesApi.getCompanyById(patient.company_id);
          if (companyResponse.data) {
            const companyData = companyResponse.data;
            const mappedCompany: Company = {
              id: companyData.company_id?.toString() || '',
              name: companyData.company_name || '',
              ruc: companyData.ruc || '',
              email: companyData.email,
              phone: companyData.phone,
              address: companyData.address,
              contactPerson: companyData.contact_person,
              status: (companyData.status as 'active' | 'inactive') || 'active',
              createdAt: companyData.created_at ? new Date(companyData.created_at) : new Date(),
              updatedAt: companyData.updated_at ? new Date(companyData.updated_at) : new Date()
            };
            setCompanyData(mappedCompany);

            // Verificar contratos de la empresa
            if (companyData.contracts && companyData.contracts.length > 0) {
              const activeContract = companyData.contracts.find(c => c.status === 'active');
              setCompanyContract(activeContract || null);
            }
          }
        }
      } else {
        setPatientData(null);
      }
    } catch (error) {
      console.error('Error al cargar datos del paciente y empresa:', error);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Función para sincronizar datos
  const syncData = async () => {
    await loadAvailablePlans();
    if (user?.id) {
      await loadPatientSubscription(user.id);
    }
  };

  // Cargar último voucher de la afiliación
  // TODO: Migrar a API cuando esté disponible el endpoint de vouchers
  useEffect(() => {
    const loadLatestVoucher = async () => {
      if (currentSubscription) {
        // Por ahora, el voucher se gestiona a través del store healthPlanStore
        // cuando esté disponible la API de vouchers, se actualizará aquí
        setLatestVoucher(null);
      }
    };
    loadLatestVoucher();
  }, [currentSubscription]);

  // ✅ Cargar planes desde backend (PostgreSQL)
  useEffect(() => {
    const loadPlansFromBackend = async () => {
      try {
        // ✅ CONECTAR CON BACKEND REAL - Obtener planes activos desde PostgreSQL
        const backendPlans = await healthPlansApi.getActivePlans();

        // Convertir formato backend (snake_case) a frontend (camelCase)
        const mappedPlans = mapHealthPlansFromBackend(backendPlans);

        // Los planes se cargan directamente desde la API, sin necesidad de IndexedDB
        console.log('Planes de salud cargados desde backend:', mappedPlans.length);
      } catch (error) {
        console.error('Error al cargar planes desde backend:', error);
      }
    };

    loadPlansFromBackend();
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    syncData();
  }, [user?.id]);

  // Cargar contratos de planes
  // TODO: Migrar a API cuando esté disponible el endpoint de contratos de planes
  useEffect(() => {
    const loadPlanContracts = async () => {
      try {
        // Por ahora, los contratos de planes se manejarán cuando exista la API
        // setPlanContracts([]);
        console.log('Contratos de planes: pendiente migración a API');
      } catch (error) {
        console.error('Error al cargar contratos:', error);
      }
    };
    loadPlanContracts();
  }, []);

  // Calcular estado de pago cuando hay afiliación activa
  useEffect(() => {
    const calculatePaymentStatus = async () => {
      if (currentSubscription && currentSubscription.status === 'active') {
        const status = await paymentScheduleService.getPaymentStatus(currentSubscription);
        setPaymentStatus(status);
        setDaysUntilPayment(status.daysUntilPayment);
      }
    };
    calculatePaymentStatus();
  }, [currentSubscription]);

  // Bloquear scroll del body cuando el modal de contrato está abierto
  useEffect(() => {
    if (showContractModal) {
      // Guardar posición actual del scroll
      const scrollY = window.scrollY;

      // Bloquear scroll del body y mantener posición
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restaurar scroll del body
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showContractModal]);

  const handleSelectPlan = async (plan: BaseHealthPlan) => {
    setSelectedPlan(plan);
    setAcceptedTerms(false);

    // Cargar términos
    const terms = await loadPlanTerms(plan.termsId);
    if (terms) {
      setTermsContent(terms.content);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;

    try {
      await subscribeToPlan(
        user.id,
        selectedPlan.id,
        selectedPlan.termsId,
        user.id
      );

      // Recargar datos de afiliación
      await loadPatientSubscription(user.id);

      // Guardar el plan antes de cerrar el modal
      const justSubscribedPlan = selectedPlan;

      // Cerrar modal de selección de plan
      setSelectedPlan(null);

      // Mostrar modal de éxito
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: '¡Afiliación Exitosa!',
        message: 'Ahora sube tu voucher de pago para activar el plan.',
        onConfirm: () => {
          // Verificar que el plan existe antes de abrir el modal
          if (!justSubscribedPlan) {
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: 'Por favor, recarga la página para continuar.'
            });
            return;
          }
          // Abrir automáticamente el modal de voucher al cerrar el alert
          setShowVoucherModal(true);
        }
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error || 'Ocurrió un error al suscribirte al plan. Por favor, intenta nuevamente.'
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    setAlertModal({
      isOpen: true,
      type: 'confirm',
      title: 'Cancelar Afiliación',
      message: '¿Estás seguro de que deseas cancelar tu afiliación? Perderás todos los beneficios de tu plan.',
      onConfirm: async () => {
        // Cerrar el modal de confirmación primero
        setAlertModal({ ...alertModal, isOpen: false });

        try {
          await cancelSubscription(currentSubscription.id, 'Cancelado por el usuario');

          if (user?.id) {
            loadPatientSubscription(user.id);
          }

          // Esperar un momento antes de abrir el modal de éxito
          setTimeout(() => {
            setAlertModal({
              isOpen: true,
              type: 'success',
              title: 'Afiliación Cancelada',
              message: 'Tu afiliación ha sido cancelada exitosamente.'
            });
          }, 300);
        } catch (err) {
          setTimeout(() => {
            setAlertModal({
              isOpen: true,
              type: 'error',
              title: 'Error',
              message: error || 'Ocurrió un error al cancelar la afiliación. Por favor, intenta nuevamente.'
            });
          }, 300);
        }
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'basic': return <Shield className="w-6 h-6" />;
      case 'standard': return <Star className="w-6 h-6" />;
      case 'premium': return <Heart className="w-6 h-6" />;
      case 'family': return <Heart className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'bg-blue-100 text-blue-600';
      case 'standard': return 'bg-purple-100 text-purple-600';
      case 'premium': return 'bg-yellow-100 text-yellow-600';
      case 'family': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      monthly: 'mes',
      quarterly: 'trimestre',
      biannual: 'semestre',
      annual: 'año'
    };
    return labels[cycle] || cycle;
  };

  // Funciones para contratos de planes
  const getPlanIcon = (tipo: string) => {
    switch (tipo) {
      case 'personal':
        return Shield;
      case 'familiar':
        return Users;
      case 'planitium':
        return Crown;
      case 'gold':
        return Star;
      default:
        return FileText;
    }
  };

  const getPlanColor = (tipo: string) => {
    switch (tipo) {
      case 'personal':
        return 'from-blue-500 to-blue-600';
      case 'familiar':
        return 'from-green-500 to-green-600';
      case 'planitium':
        return 'from-purple-500 to-purple-600';
      case 'gold':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleViewContract = (contract: PlanContract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleDownloadContract = (contract: PlanContract) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${contract.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #1e3a8a; }
          .info { margin: 20px 0; background: #f3f4f6; padding: 20px; border-radius: 8px; }
          .content { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>${contract.nombre}</h1>
        <div class="info">
          <p><strong>Descripción:</strong> ${contract.descripcion}</p>
          <p><strong>Precio Mensual:</strong> S/ ${contract.precio.toFixed(2)}</p>
          <p><strong>Duración:</strong> ${contract.duracion}</p>
        </div>
        <div class="content">
          ${contract.contenido}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.nombre.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtrar contratos por búsqueda
  const filteredContracts = planContracts.filter(contract =>
    contract.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si es un empleado corporativo, mostrar vista de Plan Empresarial
  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (companyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header Empresarial */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Plan Empresarial</h1>
                <p className="text-lg text-gray-600">
                  Beneficios corporativos de {companyData.nombre}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card principal con información de la empresa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden mb-6"
          >
            {/* Header del card */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{companyData.nombre}</h2>
                  <p className="text-blue-100">RUC: {companyData.ruc}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    companyData.estado === 'activa'
                      ? 'bg-green-100 text-green-800'
                      : companyData.estado === 'suspendida'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {companyData.estado.charAt(0).toUpperCase() + companyData.estado.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido del card */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Vigencia */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Vigencia del Convenio</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Inicio:</span>{' '}
                      {format(new Date(companyData.vigenciaInicio), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Fin:</span>{' '}
                      {format(new Date(companyData.vigenciaFin), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                {/* Contacto */}
                <div className="bg-cyan-50 rounded-xl p-6 border border-cyan-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-cyan-600" />
                    <h3 className="font-semibold text-gray-900">Contacto Principal</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">{companyData.contactoPrincipal.nombre}</span>
                    </p>
                    <p className="text-gray-600">{companyData.contactoPrincipal.cargo}</p>
                    <p className="text-gray-600">{companyData.contactoPrincipal.email}</p>
                    <p className="text-gray-600">{companyData.contactoPrincipal.telefono}</p>
                  </div>
                </div>
              </div>

              {/* Beneficios del Contrato */}
              {companyContract ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-green-600" />
                      <h3 className="font-semibold text-gray-900 text-lg">Tarifario de Servicios Odontológicos</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                      <DollarSign className="w-5 h-5 text-green-700" />
                      <span className="text-sm font-semibold text-green-700">Descuento Empresarial Aplicado</span>
                    </div>
                  </div>

                  {/* Mostrar contenido HTML del contrato */}
                  <div
                    className="bg-white rounded-lg p-6 max-h-[600px] overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: companyContract.contenido }}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#10b981 #f0fdf4'
                    }}
                  />

                  {/* Información adicional */}
                  <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Importante</h4>
                        <p className="text-xs text-gray-700">
                          Los precios mostrados ya incluyen el descuento acordado entre {companyData.nombre} y MYDENT.
                          El pago se realizará mediante descuento por planilla según el convenio vigente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Tus Beneficios Corporativos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Cobertura Empresarial</p>
                        <p className="text-sm text-gray-600">Acceso al plan de salud dental corporativo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Sin Costo Adicional</p>
                        <p className="text-sm text-gray-600">Cubierto por tu empresa</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Atención Prioritaria</p>
                        <p className="text-sm text-gray-600">Agenda tus citas con preferencia</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Convenio Vigente</p>
                        <p className="text-sm text-gray-600">Hasta {format(new Date(companyData.vigenciaFin), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        El contrato de servicios con el tarifario detallado aún no está disponible.
                        Contacta con Recursos Humanos para más información.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones si existen */}
              {companyData.observaciones && (
                <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Información Adicional</h4>
                      <p className="text-sm text-gray-700">{companyData.observaciones}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Botón de ayuda */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-gray-600 mb-4">¿Tienes dudas sobre tu plan empresarial?</p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold">
              Contactar con Recursos Humanos
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">¡Afíliate a Nuestros Planes!</h1>
          <p className="text-lg text-gray-600">
            Descubre el plan que mejor se adapte a tu salud dental
          </p>
        </div>

      {/* Current Subscription - Different States */}
      {currentSubscription && (() => {
        const hasNeverPaid = currentSubscription.totalPaid === 0;
        const hasPendingVoucher = latestVoucher && latestVoucher.status === 'pending';
        const hasRejectedVoucher = latestVoucher && latestVoucher.status === 'rejected';
        const currentPlan = plans.find(p => p.id === currentSubscription.planId);

        // Validar que el plan existe
        if (!currentPlan) {
          return (
            <div className="mb-8 rounded-xl p-6 shadow-lg border-2 bg-red-50 border-red-300">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900">Error al cargar el plan</h3>
                  <p className="text-sm text-red-700 mt-1">
                    No se pudo encontrar la información de tu plan. Por favor, recarga la página.
                  </p>
                </div>
                <button
                  onClick={syncData}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar
                </button>
              </div>
            </div>
          );
        }

        // Estado 1: Recién suscrito sin voucher - NO MOSTRAR NADA
        if (hasNeverPaid && !latestVoucher) {
          return null;
        }

        // Estado 2: Voucher en Revisión (AZUL)
        if (hasNeverPaid && hasPendingVoucher) {
          return (
            <div className="mb-8 rounded-xl p-6 shadow-lg border-2 bg-blue-50 border-blue-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-blue-100 text-blue-700">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-bold">Voucher en Revisión</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {currentPlan?.name || 'Mi Plan'}
                  </h3>

                  <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Tu voucher ha sido enviado
                        </p>
                        <p className="text-sm text-gray-600">
                          Nuestro equipo lo está revisando. Te notificaremos cuando sea aprobado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Enviado</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(latestVoucher.uploadDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Monto</p>
                      <p className="text-sm font-semibold text-gray-900">
                        S/ {latestVoucher.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Estado 3: Voucher Rechazado (ROJO)
        if (hasNeverPaid && hasRejectedVoucher) {
          return (
            <div className="mb-8 rounded-xl p-6 shadow-lg border-2 bg-red-50 border-red-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-red-100 text-red-700">
                    <X className="w-5 h-5" />
                    <span className="text-sm font-bold">Voucher Rechazado</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {currentPlan?.name || 'Mi Plan'}
                  </h3>

                  <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 mb-1">
                          Tu voucher fue rechazado
                        </p>
                        <p className="text-sm text-red-700 mb-2">
                          Motivo: {latestVoucher.rejectionReason || 'No especificado'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Por favor, sube un nuevo voucher con la información correcta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Verificar que el plan existe antes de abrir el modal
                    const plan = plans.find(p => p.id === currentSubscription.planId);
                    if (!plan) {
                      setAlertModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Error',
                        message: 'No se pudo cargar la información del plan. Intenta recargar la página.'
                      });
                      return;
                    }
                    setShowVoucherModal(true);
                  }}
                  className="ml-4 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir Nuevo
                </button>
              </div>
            </div>
          );
        }

        // Estado 4: Plan Activo (VERDE) - Ya pagó al menos una vez
        return (
          <div className="mb-8 rounded-xl p-6 shadow-lg border-2 bg-green-50 border-green-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-green-100 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Plan Activo</span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentPlan?.name || 'Mi Suscripción'}
                </h3>

                {/* Payment Status Alert */}
                {paymentStatus && daysUntilPayment !== null && (
                  <div className="mb-4">
                    {paymentStatus.hasPendingVoucher ? (
                      // Si tiene voucher pendiente, solo mostrar ese mensaje
                      <p className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Voucher en revisión - Te notificaremos cuando sea aprobado
                      </p>
                    ) : (
                      // Si NO tiene voucher pendiente, mostrar días hasta pago
                      <>
                        {daysUntilPayment > 0 ? (
                          <p className="text-sm text-gray-700">
                            Próximo pago en <strong className="text-blue-600">{daysUntilPayment} días</strong>
                          </p>
                        ) : daysUntilPayment === 0 ? (
                          <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            ¡Hoy vence tu pago!
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Pago vencido hace {Math.abs(daysUntilPayment)} días
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Día de pago</p>
                    <p className="text-base font-semibold text-gray-900">
                      Día {currentSubscription.paymentDay} de cada mes
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Próximo pago</p>
                    <p className="text-base font-semibold text-gray-900">
                      {currentSubscription.nextPaymentDate
                        ? new Date(currentSubscription.nextPaymentDate).toLocaleDateString()
                        : 'No disponible'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Total pagado</p>
                    <p className="text-base font-semibold text-green-700">
                      S/ {currentSubscription.totalPaid.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Info Bar */}
      {!loading && plans.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {plans.length} {plans.length === 1 ? 'plan disponible' : 'planes disponibles'}
          </p>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando planes disponibles...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">Cargando planes...</p>
          <p className="text-gray-500 text-sm">
            Un momento, estamos preparando los planes para ti.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const typeBorderColors = {
              basic: 'border-blue-300',
              standard: 'border-purple-300',
              premium: 'border-amber-400',
              family: 'border-pink-300'
            };

            const typeBadgeColors = {
              basic: 'bg-blue-600 text-white shadow-sm',
              standard: 'bg-purple-600 text-white shadow-sm',
              premium: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md',
              family: 'bg-pink-600 text-white shadow-sm'
            };

            const typeButtonColors = {
              basic: 'bg-blue-600 hover:bg-blue-700 hover:scale-105',
              standard: 'bg-purple-600 hover:bg-purple-700 hover:scale-105',
              premium: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:scale-105',
              family: 'bg-pink-600 hover:bg-pink-700 hover:scale-105'
            };

            const typeIconBgColors = {
              basic: 'bg-blue-50',
              standard: 'bg-purple-50',
              premium: 'bg-amber-50',
              family: 'bg-pink-50'
            };

            const typeIconColors = {
              basic: 'text-blue-600',
              standard: 'text-purple-600',
              premium: 'text-amber-600',
              family: 'text-pink-600'
            };

            return (
              <div
                key={plan.id}
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                }}
                className={`bg-white rounded-2xl hover:shadow-depth transition-all duration-300 overflow-hidden border-2 ${typeBorderColors[plan.type]} transform hover:-translate-y-3 relative group`}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                {/* Header with Badge */}
                <div className="p-8 pb-6 relative">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold mb-4 tracking-wide ${typeBadgeColors[plan.type]}`}
                       style={{
                         boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'
                       }}>
                    {plan.type.toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price Section - More Prominent */}
                <div className="px-8 py-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative"
                     style={{
                       boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)'
                     }}>
                  <div className="text-center relative">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-base text-gray-500 font-medium">S/</span>
                      <span className="text-5xl font-black text-gray-900 tracking-tight"
                            style={{
                              textShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                        {plan.price.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 font-medium">
                      por {getBillingCycleLabel(plan.billingCycle)}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                {/* Benefits Section - Precios Preferenciales */}
                <div className="p-8 py-6">
                  <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full ${typeBorderColors[plan.type]} bg-current`}></div>
                    Precios Preferenciales
                  </h4>

                  <div className="flex items-start gap-3">
                    <div className={`${typeIconBgColors[plan.type]} rounded-lg p-2 flex-shrink-0`}
                         style={{
                           boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 -1px 1px rgba(0,0,0,0.03)'
                         }}>
                      <Check className={`w-4 h-4 ${typeIconColors[plan.type]} font-bold`} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pt-1">
                      {getPlanBenefitText(plan.planCode)}
                    </p>
                  </div>
                </div>

                {/* CTA Button - Enhanced */}
                <div className="p-8 pt-6 relative">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={currentSubscription?.status === 'active'}
                    style={currentSubscription?.status !== 'active' ? {
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(0,0,0,0.1)'
                    } : undefined}
                    className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base
                      ${currentSubscription?.status === 'active'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : `${typeButtonColors[plan.type]} text-white hover:shadow-button`
                      }`}
                  >
                    {currentSubscription?.status === 'active' ? (
                      <>
                        <Shield className="w-5 h-5" />
                        Ya estás afiliado
                      </>
                    ) : (
                      <>
                        ¡Quiero afiliarme!
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sección de Contratos de Planes */}
      <div className="mt-16 pt-12 border-t-2 border-gray-200">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Contratos de Planes de Salud Dental</h2>
          <p className="text-lg text-gray-600">
            Conoce nuestros planes y descarga los contratos disponibles
          </p>
        </div>

        {/* Búsqueda */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar planes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Grid de contratos */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron planes' : 'No hay planes disponibles en este momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredContracts.map((contract) => {
              const Icon = getPlanIcon(contract.tipo);
              const colorClass = getPlanColor(contract.tipo);

              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                >
                  {/* Header con gradiente */}
                  <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-10 h-10" />
                      {contract.tipo === 'gold' && <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />}
                    </div>
                    <h3 className="font-bold text-xl mb-2">
                      {contract.nombre.replace('Contrato Plan ', '')}
                    </h3>
                    <p className="text-sm opacity-90">{contract.descripcion}</p>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">S/ {contract.precio.toFixed(0)}</span>
                        <span className="text-gray-500">/mes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{contract.duracion}</span>
                      </div>
                    </div>

                    {/* Características destacadas */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Limpiezas incluidas</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Descuentos especiales</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Atención preferencial</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewContract(contract)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleDownloadContract(contract)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar Contrato
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Sombra profunda multicapa */
        .hover\:shadow-depth:hover {
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 30px 60px -15px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        /* Sombra del botón en hover */
        .hover\:shadow-button:hover {
          box-shadow:
            0 8px 16px -2px rgba(0, 0, 0, 0.2),
            0 4px 8px -2px rgba(0, 0, 0, 0.1),
            inset 0 -2px 4px rgba(0,0,0,0.15);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
                <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price */}
            <div className="px-6 pt-6 pb-4 bg-gray-50">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-gray-600">S/</span>
                <span className="text-5xl font-bold text-gray-900">
                  {selectedPlan.price.toFixed(0)}
                </span>
                <span className="text-gray-600">/ {getBillingCycleLabel(selectedPlan.billingCycle)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">

              {/* Precios Preferenciales */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Precios Preferenciales:</h4>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getPlanBenefitText(selectedPlan.planCode)}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total a pagar:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    S/ {selectedPlan.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  Pago {getBillingCycleLabel(selectedPlan.billingCycle)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  'Confirmar Afiliación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Upload Modal */}
      {showVoucherModal && currentSubscription && (() => {
        const currentPlan = plans.find(p => p.id === currentSubscription.planId);

        if (!currentPlan) {
          setShowVoucherModal(false);
          setAlertModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo cargar la información del plan. Por favor, recarga la página.'
          });
          return null;
        }

        return (
          <VoucherUploadModal
            subscription={currentSubscription}
            plan={currentPlan}
            onClose={() => setShowVoucherModal(false)}
            onSuccess={() => {
              syncData();
            }}
          />
        );
      })()}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
      />

      {/* Modal de visualización de contratos */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${getPlanColor(selectedContract.tipo)} text-white p-6 flex justify-between items-center`}>
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = getPlanIcon(selectedContract.tipo);
                  return <Icon className="w-8 h-8" />;
                })()}
                <div>
                  <h2 className="text-2xl font-bold">{selectedContract.nombre}</h2>
                  <p className="text-white/90">{selectedContract.descripcion}</p>
                </div>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Precio Mensual</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      S/ {selectedContract.precio.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Duración</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedContract.duracion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Términos y Condiciones</h3>
                <div className="bg-gray-50 p-6 rounded-lg prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedContract.contenido }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => handleDownloadContract(selectedContract)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Descargar Contrato
              </button>
              <button
                onClick={() => setShowContractModal(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
}
