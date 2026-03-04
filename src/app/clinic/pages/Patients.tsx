import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { patientsApi } from '@/services/api/patientsApi';
import { medicalHistoriesApi, type MedicalHistoryData } from '@/services/api/medicalHistoriesApi';
import { incomePaymentsApi } from '@/services/api/incomePaymentsApi';
import { consentsApi, type ConsentData } from '@/services/api/consentsApi';
import { useAuth } from '@/hooks/useAuth';
import type { Patient, SignedConsent, Appointment, TreatmentPlan, User as UserType, PatientContract } from '@/types';
import {
  getPatientStats,
  PatientsStatsCards,
  PatientsFilters,
  PatientsTable,
  MedicalHistoryModal,
  PaymentHistoryModal
} from '@/components/patients';
import { NewPatientForm } from '@/app/admin/components/patients/NewPatientForm';
import { PatientDetailsModal } from '@/app/admin/components/patients/PatientDetailsModal';
import { PatientApiService, type PatientIntegralData } from '@/app/admin/services/patientApiService';
import { UploadContractModal } from '@/components/contracts/UploadContractModal';

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [patientMedicalHistory, setPatientMedicalHistory] = useState<MedicalHistoryData | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentHistoryPatient, setPaymentHistoryPatient] = useState<Patient | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Estados para el modal de detalles unificado
  const [patientConsents, setPatientConsents] = useState<SignedConsent[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [patientTreatmentPlans, setPatientTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [patientContracts, setPatientContracts] = useState<PatientContract[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, UserType>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedPatientIntegralData, setSelectedPatientIntegralData] = useState<PatientIntegralData | null>(null);
  const [showUploadContractModal, setShowUploadContractModal] = useState(false);
  // Estado para los antecedentes médicos en el modal de detalles
  const [patientMedicalRecords, setPatientMedicalRecords] = useState<MedicalHistoryData[]>([]);

  // Check if user can edit medical information (ONLY doctor)
  const canEditMedicalInfo = user?.role === 'doctor';
  const isReceptionist = user?.role === 'receptionist';
  // Receptionist can VIEW medical history but not edit
  const canViewMedicalHistory = user?.role === 'doctor' || user?.role === 'receptionist';

  // Load patients data
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);

      // Recepcionista, admin y super_admin pueden ver todos los pacientes
      // Solo el doctor ve pacientes filtrados por su sede
      const filters: { limit: number; branch_id?: number } = { limit: 1000 };
      if (user?.role === 'doctor' && user?.branch_id) {
        filters.branch_id = user.branch_id;
      }

      const response = await patientsApi.getPatients(filters);

      const mappedPatients: Patient[] = response.data.map(p => {
        // Mapear gender_id a código de género
        const getGenderCode = (genderId?: number): 'M' | 'F' | 'O' => {
          switch (genderId) {
            case 1: return 'M';  // Masculino
            case 2: return 'F';  // Femenino
            case 3: return 'O';  // Otro
            default: return 'M';
          }
        };

        return {
          id: p.patient_id?.toString() || '',
          dni: p.identification_number || '',
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.email || '',
          phone: p.mobile || p.phone || '',
          birthDate: p.birth_date ? new Date(p.birth_date) : new Date(),
          gender: getGenderCode(p.gender_id),
          address: p.address || '',
          medicalHistory: {
            bloodType: '', // Se llenará después con formulario médico
            allergies: [],
            conditions: [],
            medications: []
          },
          emergencyContact: {
            name: p.emergency_contact_name || '',
            phone: p.emergency_contact_phone || '',
            relationship: p.emergency_contact_relationship || ''
          },
          registrationDate: p.date_time_registration ? new Date(p.date_time_registration) : new Date(),
          isActive: p.is_active !== false,
          // Campo para estado de registro (completo/incompleto)
          isBasicRegistration: p.is_basic_registration,
          // Campos de fecha requeridos por PatientsTable
          createdAt: p.date_time_registration ? new Date(p.date_time_registration) : new Date(),
          updatedAt: p.date_time_modification ? new Date(p.date_time_modification) : new Date(),
          esClienteNuevo: p.is_new_client ?? true
        };
      });

      setPatients(mappedPatients);
    } catch (error) {
      toast.error('Error al cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar antecedentes médicos para el modal de Historial Médico
  const loadPatientMedicalHistory = async (patientId: string) => {
    try {
      const response = await medicalHistoriesApi.getPatientMedicalHistory(parseInt(patientId));
      if (response?.data) {
        setPatientMedicalHistory(response.data);
      } else {
        setPatientMedicalHistory(null);
      }
    } catch (error) {
      console.error('Error al cargar historial médico:', error);
      setPatientMedicalHistory(null);
    }
  };

  // Cargar antecedentes médicos para el modal de Detalles del Paciente
  const loadPatientMedicalRecords = async (patientId: string) => {
    try {
      const response = await medicalHistoriesApi.getPatientMedicalHistory(parseInt(patientId));
      if (response?.data) {
        setPatientMedicalRecords([response.data]);
      } else {
        setPatientMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error al cargar antecedentes médicos:', error);
      setPatientMedicalRecords([]);
    }
  };

  const loadPatientConsents = async (patientId: string) => {
    try {
      const consents = await PatientApiService.loadPatientConsents(patientId);
      setPatientConsents(consents);
    } catch (error) {
      console.error('Error al cargar consentimientos:', error);
      setPatientConsents([]);
    }
  };

  const loadPatientHistory = async (patientId: string) => {
    try {
      setIsLoadingHistory(true);
      const { appointments, treatmentPlans, doctorsMap: doctorsMapData } =
        await PatientApiService.loadPatientHistory(patientId);
      setPatientAppointments(appointments);
      setPatientTreatmentPlans(treatmentPlans);
      setDoctorsMap(doctorsMapData);
    } catch (error) {
      console.error('Error al cargar historial del paciente:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPatientContracts = async (patientId: string) => {
    try {
      const contracts = await PatientApiService.loadPatientContracts(patientId);
      setPatientContracts(contracts);
    } catch (error) {
      console.error('Error al cargar contratos del paciente:', error);
    }
  };

  const loadSelectedPatientIntegralData = async (patientId: string) => {
    try {
      const integralData = await PatientApiService.loadPatientIntegralData(patientId);
      setSelectedPatientIntegralData(integralData);
    } catch (error) {
      console.error('Error al cargar datos de atención integral:', error);
      setSelectedPatientIntegralData(null);
    }
  };

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

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' ||
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.dni.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;

    return matchesSearch && matchesGender;
  });

  const stats = getPatientStats(patients);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientConsents(patient.id);
    loadPatientHistory(patient.id);
    loadPatientContracts(patient.id);
    loadSelectedPatientIntegralData(patient.id);
    loadPatientMedicalRecords(patient.id);
  };

  const handleViewMedicalHistory = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientMedicalHistory(patient.id);
    setShowMedicalHistory(true);
  };

  const handleViewPaymentHistoryFromDetails = () => {
    if (selectedPatient) {
      loadPaymentHistory(selectedPatient.id);
      setPaymentHistoryPatient(selectedPatient);
      setSelectedPatient(null);
      setShowPaymentHistory(true);
    }
  };

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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Pacientes</h1>
                <p className="text-gray-600">Gestiona la información de tus pacientes</p>
              </div>
            </div>

            {isReceptionist && (
              <motion.button
                onClick={() => setShowNewPatientModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg font-semibold text-base"
              >
                <Plus className="w-5 h-5" />
                Nuevo Paciente
              </motion.button>
            )}
          </div>

          {/* Stats Cards */}
          <PatientsStatsCards stats={stats} />

          {/* Filters */}
          <PatientsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            genderFilter={genderFilter}
            onGenderFilterChange={setGenderFilter}
            filteredCount={filteredPatients.length}
            totalCount={patients.length}
          />

          {/* Patients Table */}
          <PatientsTable
            patients={filteredPatients}
            canEditMedicalInfo={canEditMedicalInfo}
            canViewMedicalHistory={canViewMedicalHistory}
            onViewDetails={handleViewDetails}
            onViewMedicalHistory={handleViewMedicalHistory}
          />
        </div>

        {/* Patient Details Modal */}
        {selectedPatient && !showMedicalHistory && (
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
            onClose={() => {
              setSelectedPatient(null);
              setPatientConsents([]);
              setPatientAppointments([]);
              setPatientTreatmentPlans([]);
              setPatientContracts([]);
              setDoctorsMap({});
              setSelectedPatientIntegralData(null);
              setPatientMedicalRecords([]);
            }}
            onUploadContract={() => setShowUploadContractModal(true)}
            onViewPaymentHistory={handleViewPaymentHistoryFromDetails}
          />
        )}

        {/* Medical History Modal */}
        <MedicalHistoryModal
          isOpen={showMedicalHistory}
          patient={selectedPatient}
          medicalHistory={patientMedicalHistory}
          onClose={() => {
            setShowMedicalHistory(false);
            setPatientMedicalHistory(null);
          }}
        />

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
      </motion.div>
    </div>
  );
};

export default Patients;
