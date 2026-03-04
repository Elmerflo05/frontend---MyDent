import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import type { Patient, SignedConsent, Appointment, MedicalRecord, TreatmentPlan, User as UserType, PatientContract, Company } from '@/types';
import { UploadContractModal } from '@/components/contracts/UploadContractModal';
import { PaymentHistoryModal } from '@/components/patients/PaymentHistoryModal';
import { incomePaymentsApi } from '@/services/api/incomePaymentsApi';

// Import services and utils - INTEGRACIÓN CON API REAL
import { PatientApiService } from '../services/patientApiService';
import {
  calculateAge,
  getGenderLabel,
  getAppointmentStatusInfo,
  getPaymentStatusInfo,
  getTreatmentStatusInfo,
  getDoctorName,
  getPatientStats
} from '../utils/patientHelpers';
import { filterPatients, type PatientFilterOptions } from '../utils/patientFilters';

// Import modular components
import { PatientsHeader } from '../components/patients/PatientsHeader';
import { PatientsStats } from '../components/patients/PatientsStats';
import { PatientsFilters } from '../components/patients/PatientsFilters';
import { PatientCard, IntegralDataSummary } from '../components/patients/PatientCard';
import { PatientDetailsModal } from '../components/patients/PatientDetailsModal';
import { NewPatientForm } from '../components/patients/NewPatientForm';
import { CompletePatientInfoModal } from '../components/patients/CompletePatientInfoModal';

const PatientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [patientConsents, setPatientConsents] = useState<SignedConsent[]>([]);

  // Filtros de tratamiento
  const [treatmentFilters, setTreatmentFilters] = useState({
    ortodoncia: false,
    rehabilitacion: false,
    implantes: false
  });
  const [allTreatmentPlans, setAllTreatmentPlans] = useState<TreatmentPlan[]>([]);

  // Estados para historial de atenciones
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientTreatmentPlans, setPatientTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, UserType>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Estados para contratos
  const [patientContracts, setPatientContracts] = useState<PatientContract[]>([]);
  const [showUploadContractModal, setShowUploadContractModal] = useState(false);

  // Estados para historial de pagos
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentHistoryPatient, setPaymentHistoryPatient] = useState<Patient | null>(null);

  // Estado para datos de atención integral de todos los pacientes
  const [patientsIntegralData, setPatientsIntegralData] = useState<Record<string, IntegralDataSummary>>({});

  // Estado para datos integrales completos del paciente seleccionado
  const [selectedPatientIntegralData, setSelectedPatientIntegralData] = useState<Awaited<ReturnType<typeof PatientApiService.loadPatientIntegralData>> | null>(null);

  // Estado para el modal de completar información
  const [showCompleteInfoModal, setShowCompleteInfoModal] = useState(false);
  const [patientToComplete, setPatientToComplete] = useState<Patient | null>(null);

  // Super admin, admin and receptionist can complete basic patient info
  const canCompleteBasicInfo = ['super_admin', 'admin', 'receptionist'].includes(user?.role || '');

  // Load patients and companies data
  useEffect(() => {
    loadPatients();
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // INTEGRACIÓN API REAL: Cargar empresas desde el backend
      const allCompanies = await PatientApiService.loadCompanies();

      // Validar que se recibieron datos válidos
      if (!Array.isArray(allCompanies)) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Filtrar empresas con datos incompletos
      const validCompanies = allCompanies.filter(c => c.id && c.nombre);

      if (validCompanies.length !== allCompanies.length) {
        console.warn(`[Patients] Se filtraron ${allCompanies.length - validCompanies.length} empresas con datos inválidos`);
      }

      setCompanies(validCompanies);
    } catch (error) {
      console.error('[Patients.loadCompanies] Error:', error);
      toast.error('Error al cargar empresas: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // Load patient's signed consents and history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientConsents(selectedPatient.id);
      loadPatientHistory(selectedPatient.id);
      loadPatientContracts(selectedPatient.id);
      loadSelectedPatientIntegralData(selectedPatient.id);
    } else {
      setPatientConsents([]);
      setPatientAppointments([]);
      setPatientMedicalRecords([]);
      setPatientTreatmentPlans([]);
      setDoctorsMap({});
      setPatientContracts([]);
      setSelectedPatientIntegralData(null);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      // INTEGRACIÓN API REAL: Cargar pacientes desde el backend
      const { patients: patientsData, treatmentPlans } = await PatientApiService.loadPatients();
      setPatients(patientsData);
      setAllTreatmentPlans(treatmentPlans);

      // Cargar datos de atención integral para todos los pacientes
      loadAllPatientsIntegralData(patientsData);
    } catch (error) {
      toast.error('Error al cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos de atención integral para todos los pacientes (en paralelo)
  const loadAllPatientsIntegralData = async (patientsList: Patient[]) => {
    try {
      const integralDataMap: Record<string, IntegralDataSummary> = {};

      // Cargar en lotes para no sobrecargar el servidor
      const batchSize = 10;
      for (let i = 0; i < patientsList.length; i += batchSize) {
        const batch = patientsList.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(patient => PatientApiService.loadPatientIntegralData(patient.id))
        );

        results.forEach((result, index) => {
          const patient = batch[index];
          if (result.status === 'fulfilled') {
            integralDataMap[patient.id] = {
              has_integral_attention: result.value.has_integral_attention,
              total_consultations: result.value.total_consultations,
              services_summary: result.value.services_summary
            };
          }
        });
      }

      setPatientsIntegralData(integralDataMap);
    } catch (error) {
      console.error('Error al cargar datos de atención integral:', error);
    }
  };

  const loadPatientConsents = async (patientId: string) => {
    try {
      // INTEGRACIÓN API REAL: Cargar consentimientos desde el backend
      const consents = await PatientApiService.loadPatientConsents(patientId);
      setPatientConsents(consents);
    } catch (error) {
      toast.error('Error al cargar los consentimientos del paciente');
    }
  };

  const loadPatientHistory = async (patientId: string) => {
    try {
      setIsLoadingHistory(true);
      // INTEGRACIÓN API REAL: Cargar historial del paciente desde el backend
      const { appointments, medicalRecords, treatmentPlans, doctorsMap: doctorsMapData } =
        await PatientApiService.loadPatientHistory(patientId);
      setPatientAppointments(appointments);
      setPatientMedicalRecords(medicalRecords);
      setPatientTreatmentPlans(treatmentPlans);
      setDoctorsMap(doctorsMapData);
    } catch (error) {
      toast.error('Error al cargar el historial del paciente');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPatientContracts = async (patientId: string) => {
    try {
      // INTEGRACIÓN API REAL: Cargar contratos del paciente desde el backend
      const contracts = await PatientApiService.loadPatientContracts(patientId);
      setPatientContracts(contracts);
    } catch (error) {
      toast.error('Error al cargar los contratos del paciente');
    }
  };

  const loadSelectedPatientIntegralData = async (patientId: string) => {
    try {
      // Cargar datos integrales completos del paciente seleccionado
      const integralData = await PatientApiService.loadPatientIntegralData(patientId);
      setSelectedPatientIntegralData(integralData);
    } catch (error) {
      console.error('Error al cargar datos de atención integral:', error);
      setSelectedPatientIntegralData(null);
    }
  };

  // Cargar historial de pagos
  const loadPaymentHistory = async (patientId: string) => {
    try {
      const patId = parseInt(patientId);

      // Obtener deudas reales del paciente desde procedure_income
      const debtsResponse = await incomePaymentsApi.getPatientPendingDebts(patId);
      const debts = debtsResponse.debts || [];

      // Mapear las deudas al formato del historial
      const history = debts.map(debt => {
        // Determinar el estado de pago
        let paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled' = 'pending';
        if (debt.payment_status === 'paid') paymentStatus = 'paid';
        else if (debt.payment_status === 'partial') paymentStatus = 'partial';
        else if (debt.payment_status === 'pending_verification') paymentStatus = 'pending';
        else if (debt.payment_status === 'rejected') paymentStatus = 'cancelled';

        return {
          id: debt.income_id?.toString() || '',
          type: 'treatment' as const,
          date: new Date(debt.performed_date),
          description: debt.item_name || 'Tratamiento',
          amount: debt.final_amount || 0,
          amountPaid: debt.amount_paid || 0,
          balance: debt.balance || 0,
          paymentStatus,
          paymentMethod: debt.voucher_payment_method_id ? 'Transferencia' : undefined,
          dentistName: debt.dentist_name,
          branchName: debt.branch_name,
          toothNumber: debt.tooth_number,
          isOverdue: debt.is_overdue
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPaymentHistory(history);
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error);
      toast.error('Error al cargar el historial de pagos');
    }
  };

  // Manejar apertura de historial de pagos
  const handleViewPaymentHistory = () => {
    if (selectedPatient) {
      loadPaymentHistory(selectedPatient.id);
      setPaymentHistoryPatient(selectedPatient);
      setSelectedPatient(null);
      setShowPaymentHistory(true);
    }
  };

  // Manejar apertura del modal de completar información
  const handleCompleteInfo = (patient: Patient) => {
    setPatientToComplete(patient);
    setShowCompleteInfoModal(true);
  };

  // Toggle cliente nuevo status
  const toggleClienteNuevo = async (patientId: string, currentStatus: boolean) => {
    try {
      // INTEGRACIÓN API REAL: Actualizar estado del paciente en el backend
      const newStatus = await PatientApiService.toggleClienteNuevo(patientId, currentStatus);
      toast.success(newStatus ? 'Marcado como cliente nuevo' : 'Marcado como cliente continuador');
      loadPatients();
    } catch (error) {
      toast.error('Error al actualizar el estado del paciente');
    }
  };

  // Filter patients
  const filteredPatients = filterPatients(
    patients,
    { searchTerm, companyFilter, treatmentFilters },
    allTreatmentPlans
  );

  // Get statistics
  const stats = getPatientStats(patients);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <PatientsHeader onNewPatient={() => setShowNewPatientModal(true)} />

        {/* Stats Cards */}
        <PatientsStats stats={stats} />

        {/* Filters */}
        <PatientsFilters
          searchTerm={searchTerm}
          companyFilter={companyFilter}
          treatmentFilters={treatmentFilters}
          companies={companies}
          onSearchChange={setSearchTerm}
          onCompanyChange={setCompanyFilter}
          onTreatmentFilterChange={setTreatmentFilters}
        />

        {/* Filter count */}
        <div className="text-right text-sm text-gray-600 mb-4">
          {filteredPatients.length} de {patients.length} pacientes
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    Información
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    canCompleteMedicalInfo={false}
                    canCompleteBasicInfo={canCompleteBasicInfo}
                    integralData={patientsIntegralData[patient.id]}
                    onViewDetails={setSelectedPatient}
                    onToggleClienteNuevo={toggleClienteNuevo}
                    onNavigate={navigate}
                    onCompleteInfo={handleCompleteInfo}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron pacientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Intenta ajustar los filtros o agregar un nuevo paciente.
              </p>
            </div>
          )}
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && (
          <PatientDetailsModal
            patient={selectedPatient}
            patientConsents={patientConsents}
            patientAppointments={patientAppointments}
            patientTreatmentPlans={patientTreatmentPlans}
            patientMedicalRecords={patientMedicalRecords}
            patientContracts={patientContracts}
            doctorsMap={doctorsMap}
            integralData={selectedPatientIntegralData || undefined}
            isLoadingHistory={isLoadingHistory}
            userRole={user?.role}
            onClose={() => setSelectedPatient(null)}
            onUploadContract={() => setShowUploadContractModal(true)}
            onViewPaymentHistory={handleViewPaymentHistory}
          />
        )}

        {/* Payment History Modal */}
        <PaymentHistoryModal
          isOpen={showPaymentHistory}
          patient={paymentHistoryPatient}
          history={paymentHistory}
          onClose={() => setShowPaymentHistory(false)}
        />

        {/* New Patient Modal */}
        {showNewPatientModal && createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewPatientModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Nuevo Paciente</h3>
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <NewPatientForm
                onSuccess={() => {
                  setShowNewPatientModal(false);
                  loadPatients();
                }}
                onCancel={() => setShowNewPatientModal(false)}
              />
            </motion.div>
          </div>,
          document.body
        )}

        {/* Upload Contract Modal */}
        {selectedPatient && showUploadContractModal && (
          <UploadContractModal
            isOpen={showUploadContractModal}
            onClose={() => setShowUploadContractModal(false)}
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
            onSuccess={() => {
              loadPatientContracts(selectedPatient.id);
            }}
          />
        )}

        {/* Complete Patient Info Modal */}
        {patientToComplete && (
          <CompletePatientInfoModal
            isOpen={showCompleteInfoModal}
            patient={patientToComplete}
            onClose={() => {
              setShowCompleteInfoModal(false);
              setPatientToComplete(null);
            }}
            onSuccess={async () => {
              await loadPatients(); // Recargar lista de pacientes
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PatientsPage;