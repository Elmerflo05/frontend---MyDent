import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Check,
  AlertCircle
} from 'lucide-react';

// Componentes de Planes de Salud
import { PatientHealthPlanBadge } from '@/components/health-plans';
import { CoverageSummary } from '@/services/api/pricingApi';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { patientsApi } from '@/services/api/patientsApi';
import { medicalHistoriesApi } from '@/services/api/medicalHistoriesApi';
import { consultationsApi } from '@/services/api/consultationsApi';
import { odontogramsApi } from '@/services/api/odontogramsApi';
import { prescriptionsApi } from '@/services/api/prescriptionsApi';
import { type AppointmentData } from '@/services/api/appointmentsApi';
import { usePatientStore } from '@/store/patientStore';
import { useOdontogramStore } from '@/store/odontogramStore';
import { useTreatmentStore } from '@/store/treatmentStore';
import { useMedicalRecordStore } from '@/store/medicalRecordStore';
import { useAuth } from '@/hooks/useAuth';

// Import step components
import {
  PatientSelectionStep,
  ClinicalExamStep,
  OdontogramStep,
  PresumptiveDiagnosisStep,
  DiagnosticPlanStep,
  PrescriptionStep,
  AuxiliaryResultsStep,
  FinalDiagnosisStep,
  ProsthesisLabStep,
  TreatmentPlanStep,
  BudgetStep,
  TreatmentPerformedStep
} from '@/components/consultation/steps';

// Import custom hooks
import { useConsultationState } from '../hooks/useConsultationState';
import { useConsultationHandlers } from '../hooks/useConsultationHandlers';
import { useDiagnosticPlan } from '../hooks/useDiagnosticPlan';
import { useOdontogramDiagnosis } from '../hooks/useOdontogramDiagnosis';

// Import services
import { saveConsultationProgress, saveConsultationTreatmentPlan, loadConsultationTreatmentPlan } from '../services/consultationService';

// Import utilities
import { consultationSteps, formatPatientOptions, isStepAccessible } from '../utils/consultationHelpers';

const PatientConsultation = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');
  const { user } = useAuth();

  // Determinar si el usuario tiene permisos de solo lectura
  const isReceptionist = user?.role === 'receptionist';
  const readOnlyMode = isReceptionist;

  // Store hooks
  const { patients, getPatientById, searchPatients, addPatient, setPatients, clearPatients } = usePatientStore();
  const { setPatientOdontogram, getPatientOdontogram } = useOdontogramStore();
  const { createTreatment, updateTreatment, getTreatmentsByPatient } = useTreatmentStore();
  const { createRecord, updateRecord, getLatestRecordByPatient } = useMedicalRecordStore();

  // Custom hooks para estado y lógica
  const consultationState = useConsultationState(user?.id);
  const {
    selectedPatient,
    setSelectedPatient,
    searchTerm,
    setSearchTerm,
    activeStep,
    setActiveStep,
    completedSteps,
    setCompletedSteps,
    showPatientSearch,
    setShowPatientSearch,
    unsavedChanges,
    setUnsavedChanges,
    recentPatients,
    setRecentPatients,
    isSaving,
    setIsSaving,
    symptoms,
    setSymptoms,
    medications,
    setMedications,
    prescriptionMedications,
    setPrescriptionMedications,
    newPathological,
    setNewPathological,
    newDisease,
    setNewDisease,
    newOperation,
    setNewOperation,
    newAllergy,
    setNewAllergy,
    additionalServices,
    setAdditionalServices,
    treatmentObservations,
    setTreatmentObservations,
    currentRecord,
    setCurrentRecord,
    currentTreatment,
    setCurrentTreatment,
    currentOdontogram,
    setCurrentOdontogram,
    isOdontogramIncomplete,
    setIsOdontogramIncomplete,
    currentPrescription,
    setCurrentPrescription,
    resetConsultationState
  } = consultationState;

  // Estado del modal de guardado exitoso
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estado para la cita seleccionada
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  // Estado para el plan de salud del paciente
  const [patientCoverage, setPatientCoverage] = useState<CoverageSummary | null>(null);
  const [hasHealthPlan, setHasHealthPlan] = useState(false);

  // Callback para cuando se carga el plan de salud
  const handlePlanLoaded = useCallback((hasPlan: boolean, planData: CoverageSummary | null) => {
    setHasHealthPlan(hasPlan);
    setPatientCoverage(planData);

    // Guardar en el currentRecord para uso en otros pasos
    if (hasPlan && planData) {
      setCurrentRecord((prev: any) => ({
        ...prev,
        healthPlanCoverage: planData,
        hasHealthPlan: true,
        firstFreeConsultationAvailable: planData.first_free_consultation?.available || false
      }));
    }
  }, [setCurrentRecord]);

  // Hook de handlers
  const handlers = useConsultationHandlers({
    symptoms,
    setSymptoms,
    medications,
    setMedications,
    currentRecord,
    setCurrentRecord,
    additionalServices,
    setAdditionalServices,
    currentTreatment,
    setCurrentTreatment,
    currentOdontogram,
    setCurrentOdontogram,
    setUnsavedChanges
  });

  // Hook del plan diagnóstico
  const diagnosticPlan = useDiagnosticPlan({
    selectedPatient,
    currentRecord,
    setCurrentRecord,
    setUnsavedChanges,
    user
  });

  // Hook del mapeo odontograma-diagnóstico
  useOdontogramDiagnosis({
    selectedPatient,
    currentOdontogram,
    setCurrentRecord
  });


  // Cargar pacientes desde la API al montar el componente
  // OPTIMIZACION: Cargar solo 20 pacientes inicialmente para reducir carga
  useEffect(() => {
    const loadPatientsFromApi = async () => {
      try {
        // Solo cargar los pacientes más recientes inicialmente (20 para carga rápida)
        const response = await patientsApi.getPatients({ limit: 20, page: 1 });

        if (response.success && response.data && response.data.length > 0) {
          // Mapear todos los pacientes del backend al formato frontend
          const mappedPatients = response.data.map((apiPatient) => ({
            id: apiPatient.patient_id?.toString() || '',
            firstName: apiPatient.first_name || '',
            lastName: apiPatient.last_name || '',
            documentType: apiPatient.identification_type_id?.toString() || 'DNI',
            documentNumber: apiPatient.identification_number || '',
            birthDate: apiPatient.birth_date || '',
            gender: (apiPatient.gender_id === 1 ? 'male' : apiPatient.gender_id === 2 ? 'female' : 'other') as 'male' | 'female' | 'other',
            email: apiPatient.email || '',
            phone: apiPatient.mobile || apiPatient.phone || '',
            address: apiPatient.address || '',
            emergencyContact: apiPatient.emergency_contact_name ? {
              name: apiPatient.emergency_contact_name,
              phone: apiPatient.emergency_contact_phone || '',
              relationship: apiPatient.emergency_contact_relationship || ''
            } : undefined,
            medicalHistory: {
              allergies: apiPatient.allergies ? apiPatient.allergies.split(',').map(a => a.trim()) : [],
              chronicDiseases: apiPatient.chronic_diseases ? apiPatient.chronic_diseases.split(',').map(d => d.trim()) : [],
              currentMedications: apiPatient.current_medications ? apiPatient.current_medications.split(',').map(m => m.trim()) : [],
              previousSurgeries: []
            },
            insuranceInfo: apiPatient.insurance_company ? {
              provider: apiPatient.insurance_company,
              policyNumber: apiPatient.insurance_policy_number || '',
              coverageType: 'standard'
            } : undefined,
            // Campos de plan de salud
            health_plan_id: apiPatient.active_health_plan_id || apiPatient.health_plan_id,
            health_plan_name: apiPatient.health_plan_name,
            health_plan_code: apiPatient.health_plan_code,
            health_plan_type: apiPatient.health_plan_type,
            // Aliases para compatibilidad
            healthPlan: apiPatient.health_plan_name,
            healthPlanCode: apiPatient.health_plan_code,
            createdAt: new Date(apiPatient.created_at || Date.now()),
            updatedAt: new Date(apiPatient.updated_at || Date.now())
          }));

          // Reemplazar todos los pacientes en el store con los de la API
          setPatients(mappedPatients);
        }
      } catch (error) {
        console.error('Error al cargar pacientes desde la API:', error);
        toast.error('Error al cargar la lista de pacientes');
      }
    };

    // Siempre cargar pacientes frescos desde la API
    loadPatientsFromApi();
  }, []);

  // Obtener pacientes recientes
  useEffect(() => {
    const recent = patients.slice(0, 5);
    setRecentPatients(recent);
  }, [patients]);

  // Cargar paciente desde API si se proporciona ID
  const loadPatientFromDatabase = async (patientId: string) => {
    try {
      const numericId = parseInt(patientId, 10);

      if (isNaN(numericId)) {
        toast.error('ID de paciente inválido');
        return;
      }

      const response = await patientsApi.getPatientById(numericId);

      if (response.success && response.data) {
        const apiPatient = response.data;

        // Mapear del formato backend al formato frontend
        const mappedPatient = {
          id: apiPatient.patient_id?.toString() || patientId,
          firstName: apiPatient.first_name || '',
          lastName: apiPatient.last_name || '',
          documentType: apiPatient.identification_type_id?.toString() || 'DNI',
          documentNumber: apiPatient.identification_number || '',
          birthDate: apiPatient.birth_date || '',
          gender: (apiPatient.gender_id === 1 ? 'male' : apiPatient.gender_id === 2 ? 'female' : 'other') as 'male' | 'female' | 'other',
          email: apiPatient.email || '',
          phone: apiPatient.mobile || apiPatient.phone || '',
          address: apiPatient.address || '',
          emergencyContact: apiPatient.emergency_contact_name ? {
            name: apiPatient.emergency_contact_name,
            phone: apiPatient.emergency_contact_phone || '',
            relationship: apiPatient.emergency_contact_relationship || ''
          } : undefined,
          medicalHistory: {
            allergies: apiPatient.allergies ? apiPatient.allergies.split(',').map(a => a.trim()) : [],
            chronicDiseases: apiPatient.chronic_diseases ? apiPatient.chronic_diseases.split(',').map(d => d.trim()) : [],
            currentMedications: apiPatient.current_medications ? apiPatient.current_medications.split(',').map(m => m.trim()) : [],
            previousSurgeries: []
          },
          insuranceInfo: apiPatient.insurance_company ? {
            provider: apiPatient.insurance_company,
            policyNumber: apiPatient.insurance_policy_number || '',
            coverageType: 'standard'
          } : undefined,
          // Campos de plan de salud
          health_plan_id: apiPatient.active_health_plan_id || apiPatient.health_plan_id,
          health_plan_name: apiPatient.health_plan_name,
          health_plan_code: apiPatient.health_plan_code,
          health_plan_type: apiPatient.health_plan_type,
          // Aliases para compatibilidad
          healthPlan: apiPatient.health_plan_name,
          healthPlanCode: apiPatient.health_plan_code,
          // Empresa corporativa (para precios corporativos)
          company_id: apiPatient.company_id || null,
          companyId: apiPatient.company_id?.toString() || undefined,
          company_name: apiPatient.company_name || null,
          companyName: apiPatient.company_name || undefined,
          // Patient ID numérico para API de pricing
          patient_id: apiPatient.patient_id,
          createdAt: new Date(apiPatient.created_at || Date.now()),
          updatedAt: new Date(apiPatient.updated_at || Date.now())
        };

        addPatient(mappedPatient);
        handlePatientSelection(mappedPatient);
        setActiveStep(1);
        toast.success(`Paciente ${mappedPatient.firstName} ${mappedPatient.lastName} cargado`);
      } else {
        toast.error('El paciente no existe en el sistema');
      }
    } catch (error) {
      console.error('Error al cargar el paciente:', error);
      toast.error('Error al cargar el paciente desde el servidor');
    }
  };

  // Manejar paciente desde URL
  useEffect(() => {
    if (patientId) {
      const patient = getPatientById(patientId);

      if (patient) {
        handlePatientSelection(patient);
        setActiveStep(1);
        toast.success(`Paciente ${patient.firstName} ${patient.lastName} seleccionado automáticamente`);
      } else {
        loadPatientFromDatabase(patientId);
      }
    }
  }, [patientId, getPatientById]);

  // OPTIMIZACIÓN: Memoizar handlePatientSelection para evitar recreaciones
  const handlePatientSelection = useCallback(async (patient: any) => {
    try {
      setSelectedPatient(patient);
      setShowPatientSearch(false);

      const patientIdNumeric = parseInt(patient.id, 10);

      // Inicializar registros con el ID del paciente y dentista
      setCurrentRecord((prev: any) => ({
        ...prev,
        patientId: patient.id,
        dentistId: user?.dentist_id
      }));

      setCurrentTreatment((prev: any) => ({
        ...prev,
        patientId: patient.id
      }));

      // OPTIMIZACION: Ejecutar todas las llamadas API en paralelo para reducir tiempo de carga
      const [
        medicalHistoryResult,
        consultationsResult,
        odontogramResult
      ] = await Promise.allSettled([
        // 1. Cargar historia médica desde la API
        medicalHistoriesApi.getPatientMedicalHistory(patientIdNumeric),
        // 2. Cargar última consulta desde la API
        consultationsApi.getConsultations({ patient_id: patientIdNumeric, limit: 10 }),
        // 3. Cargar odontograma actual desde la API
        odontogramsApi.getCurrentPatientOdontogram(patientIdNumeric)
      ]);

      // Procesar historia médica
      if (medicalHistoryResult.status === 'fulfilled' && medicalHistoryResult.value?.success && medicalHistoryResult.value?.data) {
        const mh = medicalHistoryResult.value.data;

        // Mapear la historia médica al formato del currentRecord
        setCurrentRecord((prev: any) => ({
          ...prev,
          patientId: patient.id,
          dentistId: user?.dentist_id,
          // Campos para ClinicalExamStep (Antecedentes Médicos)
          // Cargar datos si existen, independientemente del campo booleano
          pathologicalHistory: Array.isArray(mh.pathological_background) ? mh.pathological_background : [],
          previousDiseases: mh.chronic_diseases_description
            ? mh.chronic_diseases_description.split(',').map((d: string) => d.trim()).filter((d: string) => d)
            : [],
          previousOperations: mh.surgeries_description
            ? mh.surgeries_description.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            : [],
          allergiesList: mh.allergies_description
            ? mh.allergies_description.split(',').map((a: string) => a.trim()).filter((a: string) => a)
            : [],
          stomatologicalHistory: mh.additional_notes || '',
          // Objeto medicalHistory para compatibilidad
          medicalHistory: {
            allergies: mh.has_allergies ? (mh.allergies_description?.split(',').map((a: string) => a.trim()) || []) : [],
            chronicDiseases: mh.has_chronic_diseases ? (mh.chronic_diseases_description?.split(',').map((d: string) => d.trim()) || []) : [],
            currentMedications: mh.has_medications ? (mh.current_medications?.split(',').map((m: string) => m.trim()) || []) : [],
            previousSurgeries: mh.has_surgeries ? (mh.surgeries_description?.split(',').map((s: string) => s.trim()) || []) : []
          },
          // Campos booleanos
          hasAllergies: mh.has_allergies,
          hasChronicDiseases: mh.has_chronic_diseases,
          hasDiabetes: mh.has_diabetes,
          hasHypertension: mh.has_hypertension,
          hasHeartDisease: mh.has_heart_disease,
          isPregnant: mh.is_pregnant,
          pregnancyMonths: mh.pregnancy_months,
          isBreastfeeding: mh.is_breastfeeding,
          smokes: mh.smokes,
          smokingFrequency: mh.smoking_frequency,
          drinksAlcohol: mh.drinks_alcohol,
          alcoholFrequency: mh.alcohol_frequency,
          lastDentalVisit: mh.last_dental_visit,
          additionalMedicalNotes: mh.additional_notes
        }));
      }

      // Procesar consultas previas
      if (consultationsResult.status === 'fulfilled' && consultationsResult.value?.success && consultationsResult.value?.data?.length > 0) {
        const consultationsData = consultationsResult.value.data;
        // Si hay appointmentId en URL, buscar esa consulta específica
        let consultationToLoad = consultationsData[0]; // Por defecto, la más reciente

        if (appointmentId) {
          const appointmentConsultation = consultationsData.find(
            c => c.appointment_id === parseInt(appointmentId, 10)
          );
          if (appointmentConsultation) {
            consultationToLoad = appointmentConsultation;
          }
        }

        // Cargar TODOS los datos de la consulta al currentRecord, incluyendo examen clínico e imágenes
        setCurrentRecord((prev: any) => ({
          ...prev,
          // Datos de referencia de la consulta
          dentistId: user?.dentist_id,
          lastConsultationId: consultationToLoad.consultation_id,
          consultationId: consultationToLoad.consultation_id,
          lastConsultationDate: consultationToLoad.consultation_date,
          lastDiagnosis: consultationToLoad.diagnosis,
          lastTreatmentPlan: consultationToLoad.treatment_plan,
          appointmentId: consultationToLoad.appointment_id,
          // Campos del examen clínico
          consultationReason: consultationToLoad.chief_complaint || '',
          currentSymptoms: consultationToLoad.present_illness || '',
          // Signos vitales
          bloodPressure: consultationToLoad.vital_signs?.blood_pressure || '',
          heartRate: consultationToLoad.vital_signs?.heart_rate || '',
          respiratoryRate: consultationToLoad.vital_signs?.respiratory_rate || '',
          weight: consultationToLoad.vital_signs?.weight || '',
          height: consultationToLoad.vital_signs?.height || '',
          // Examen clínico separado
          generalCondition: consultationToLoad.general_condition || '',
          extraoralExam: consultationToLoad.extraoral_exam || '',
          extraoralExamImages: consultationToLoad.extraoral_exam_images || [],
          intraoralExam: consultationToLoad.intraoral_exam || '',
          intraoralExamImages: consultationToLoad.intraoral_exam_images || [],
          // Diagnóstico y plan
          diagnosis: consultationToLoad.diagnosis || '',
          treatmentPlan: { description: consultationToLoad.treatment_plan || '' },
          notes: consultationToLoad.notes || ''
        }));

        // Cargar plan de tratamiento de la consulta (Paso 8) - sin bloquear
        loadConsultationTreatmentPlan(consultationToLoad.consultation_id)
          .then(treatmentPlanData => {
            if (treatmentPlanData) {
              setCurrentRecord((prev: any) => ({
                ...prev,
                consultationTreatmentPlanId: treatmentPlanData.consultationTreatmentPlanId,
                treatmentPlanHasInitial: treatmentPlanData.treatmentPlanHasInitial,
                treatmentPlanInitialPayment: treatmentPlanData.treatmentPlanInitialPayment,
                treatmentPlanMonthlyPayment: treatmentPlanData.treatmentPlanMonthlyPayment,
                appliedTreatments: treatmentPlanData.appliedTreatments || [],
                selectedAdditionalServices: treatmentPlanData.selectedAdditionalServices || []
              }));
              setTreatmentObservations(treatmentPlanData.treatmentObservations || '');
            }
          })
          .catch(() => {
            // Silencioso - es esperado que no exista plan para consultas nuevas
          });
      }

      // Procesar odontograma
      if (odontogramResult.status === 'fulfilled' && odontogramResult.value?.conditions?.length > 0) {
        const odontogramData = odontogramResult.value;
        // Transformar condiciones del formato BD al formato frontend
        const transformedConditions = odontogramData.conditions.map((dbCondition: any) => {
          // Determinar el sectionId correcto
          let sectionId = 'general';
          if (dbCondition.surface_section) {
            sectionId = dbCondition.surface_section;
          } else if (dbCondition.surface_code) {
            const DB_TO_FRONTEND_SURFACE: Record<string, string> = {
              'V': 'vestibular', 'L': 'lingual', 'M': 'mesial',
              'D': 'distal', 'C': 'corona', 'O': 'corona', 'I': 'corona'
            };
            sectionId = DB_TO_FRONTEND_SURFACE[dbCondition.surface_code] || dbCondition.surface_code;
          }

          const conditionCode = dbCondition.dental_condition_code || dbCondition.condition_name || 'unknown';

          // Convertir tooth_number de formato BD ("11") a formato frontend ("1.1")
          let toothNumber = dbCondition.tooth_number;
          if (toothNumber && !toothNumber.includes('.') && toothNumber.length === 2) {
            toothNumber = `${toothNumber[0]}.${toothNumber[1]}`;
          }

          // SPREAD OPERATOR: Preserva TODOS los campos de BD (custom_tooth_price, abbreviation, etc.)
          // Solo sobrescribimos los que necesitan transformación específica
          // NOTA: El spread trae campos snake_case de la BD; los campos camelCase
          // deben mapearse explícitamente para que el frontend los encuentre.
          return {
            ...dbCondition,  // Preserva: custom_tooth_price, abbreviation, price, config_price_base, symbol_type, fill_surfaces, etc.
            // Campos que necesitan transformación
            toothNumber: toothNumber,
            sectionId: sectionId,
            condition: conditionCode,
            conditionId: conditionCode,
            color: dbCondition.color_type || 'gray',
            notes: dbCondition.notes || dbCondition.description,
            date: dbCondition.created_at ? new Date(dbCondition.created_at) : new Date(),
            patientId: patient.id,
            // Campos calculados para compatibilidad con diferentes interfaces
            state: dbCondition.color_type === 'blue' ? 'good' : 'bad',
            initialState: dbCondition.color_type === 'blue' ? 'good' : 'bad',
            // Diente conectado: mapear snake_case (BD) → camelCase (frontend)
            // Necesario para renderizado visual de prótesis, aparatos, transposición
            connectedToothNumber: dbCondition.connected_tooth_number || undefined
          };
        });

        setCurrentOdontogram(transformedConditions);
        setPatientOdontogram(patient.id, transformedConditions);
      } else {
        setCurrentOdontogram([]);
        setPatientOdontogram(patient.id, []);
      }

      // Intentar cargar desde stores locales como fallback
      // IMPORTANTE: Preservar los datos de la consulta cargados de la BD (imágenes, consultationId, etc.)
      const existingRecord = getLatestRecordByPatient(patient.id);
      if (existingRecord) {
        setCurrentRecord((prev: any) => {
          // Preservar campos importantes que vienen de la BD
          const preservedFields = {
            consultationId: prev.consultationId,
            dentistId: prev.dentistId,
            patientId: prev.patientId,
            extraoralExamImages: prev.extraoralExamImages,
            intraoralExamImages: prev.intraoralExamImages,
            pendingExtraoralImages: prev.pendingExtraoralImages,
            pendingIntraoralImages: prev.pendingIntraoralImages,
            extraoralExam: prev.extraoralExam,
            intraoralExam: prev.intraoralExam,
            generalCondition: prev.generalCondition,
            consultationReason: prev.consultationReason,
            appointmentId: prev.appointmentId
          };
          return { ...prev, ...existingRecord, ...preservedFields };
        });
      }

      const existingTreatments = getTreatmentsByPatient(patient.id);
      const activeTreatment = existingTreatments.find((t: any) => t.status === 'in_progress' || t.status === 'planned');
      if (activeTreatment) {
        setCurrentTreatment(activeTreatment);
      }

      setCompletedSteps(new Set([0]));
      setActiveStep(1);
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
      toast.error('Error al cargar los datos del paciente');
    }
  }, [
    user?.dentist_id,
    setSelectedPatient,
    setShowPatientSearch,
    setCurrentRecord,
    setCurrentTreatment,
    setCurrentOdontogram,
    setPatientOdontogram,
    setCompletedSteps,
    setActiveStep,
    getLatestRecordByPatient,
    getTreatmentsByPatient,
    setTreatmentObservations
  ]); // OPTIMIZACIÓN: Dependencias explícitas

  // OPTIMIZACIÓN: Memoizar handleAppointmentSelect
  const handleAppointmentSelect = useCallback(async (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);

    // Guardar el appointment_id en el currentRecord
    setCurrentRecord((prev: any) => ({
      ...prev,
      appointmentId: appointment.appointment_id
    }));

    // Cargar el paciente automáticamente desde la cita
    if (appointment.patient_id) {
      try {
        const response = await patientsApi.getPatientById(appointment.patient_id);

        if (response.success && response.data) {
          const apiPatient = response.data;

          // Mapear del formato backend al formato frontend
          const mappedPatient = {
            id: apiPatient.patient_id?.toString() || '',
            firstName: apiPatient.first_name || '',
            lastName: apiPatient.last_name || '',
            documentType: apiPatient.identification_type_id?.toString() || 'DNI',
            documentNumber: apiPatient.identification_number || '',
            birthDate: apiPatient.birth_date || '',
            gender: (apiPatient.gender_id === 1 ? 'male' : apiPatient.gender_id === 2 ? 'female' : 'other') as 'male' | 'female' | 'other',
            email: apiPatient.email || '',
            phone: apiPatient.mobile || apiPatient.phone || '',
            address: apiPatient.address || '',
            emergencyContact: apiPatient.emergency_contact_name ? {
              name: apiPatient.emergency_contact_name,
              phone: apiPatient.emergency_contact_phone || '',
              relationship: apiPatient.emergency_contact_relationship || ''
            } : undefined,
            medicalHistory: {
              allergies: apiPatient.allergies ? apiPatient.allergies.split(',').map((a: string) => a.trim()) : [],
              chronicDiseases: apiPatient.chronic_diseases ? apiPatient.chronic_diseases.split(',').map((d: string) => d.trim()) : [],
              currentMedications: apiPatient.current_medications ? apiPatient.current_medications.split(',').map((m: string) => m.trim()) : [],
              previousSurgeries: []
            },
            insuranceInfo: apiPatient.insurance_company ? {
              provider: apiPatient.insurance_company,
              policyNumber: apiPatient.insurance_policy_number || '',
              coverageType: 'standard'
            } : undefined,
            // Campos de plan de salud
            health_plan_id: apiPatient.active_health_plan_id || apiPatient.health_plan_id,
            health_plan_name: apiPatient.health_plan_name,
            health_plan_code: apiPatient.health_plan_code,
            health_plan_type: apiPatient.health_plan_type,
            // Aliases para compatibilidad
            healthPlan: apiPatient.health_plan_name,
            healthPlanCode: apiPatient.health_plan_code,
            createdAt: new Date(apiPatient.created_at || Date.now()),
            updatedAt: new Date(apiPatient.updated_at || Date.now())
          };

          // Seleccionar el paciente (esto también carga historia médica, consultas previas, etc.)
          await handlePatientSelection(mappedPatient);

          toast.success(`Cita seleccionada: ${appointment.patient_name || mappedPatient.firstName + ' ' + mappedPatient.lastName}`);
        }
      } catch (error) {
        console.error('Error al cargar paciente de la cita:', error);
        toast.error('Error al cargar los datos del paciente de la cita');
      }
    }
  }, [handlePatientSelection, setCurrentRecord, setSelectedAppointment]); // OPTIMIZACIÓN: Dependencias explícitas

  // Manejar click en un paso - memoizado para evitar re-renders
  const handleStepClick = useCallback((stepId: number) => {
    if (isStepAccessible(stepId, selectedPatient)) {
      setActiveStep(stepId);
    }
  }, [selectedPatient]);

  // Marcar paso como completado - memoizado
  const markStepCompleted = useCallback((stepId: number) => {
    setCompletedSteps((prev: Set<number>) => new Set([...prev, stepId]));
    if (stepId < consultationSteps.length - 1) {
      setActiveStep(stepId + 1);
    }
  }, []);

  // Callbacks memoizados para navegación entre pasos
  const goToStep = useCallback((step: number) => () => setActiveStep(step), []);
  const goToStep0 = useMemo(() => goToStep(0), [goToStep]);
  const goToStep1 = useMemo(() => goToStep(1), [goToStep]);
  const goToStep2 = useMemo(() => goToStep(2), [goToStep]);
  const goToStep3 = useMemo(() => goToStep(3), [goToStep]);
  const goToStep4 = useMemo(() => goToStep(4), [goToStep]);
  const goToStep5 = useMemo(() => goToStep(5), [goToStep]);
  const goToStep6 = useMemo(() => goToStep(6), [goToStep]);
  const goToStep7 = useMemo(() => goToStep(7), [goToStep]);
  const goToStep8 = useMemo(() => goToStep(8), [goToStep]);
  const goToStep9 = useMemo(() => goToStep(9), [goToStep]);
  const goToStep10 = useMemo(() => goToStep(10), [goToStep]);

  // Callbacks para markStepCompleted
  const markStep2Completed = useCallback(() => markStepCompleted(2), [markStepCompleted]);
  const markStep3Completed = useCallback(() => markStepCompleted(3), [markStepCompleted]);
  const markStep4Completed = useCallback(() => markStepCompleted(4), [markStepCompleted]);
  const markStep5Completed = useCallback(() => markStepCompleted(5), [markStepCompleted]);
  const markStep6Completed = useCallback(() => markStepCompleted(6), [markStepCompleted]);
  const markStep7Completed = useCallback(() => markStepCompleted(7), [markStepCompleted]);
  const markStep8Completed = useCallback(() => markStepCompleted(8), [markStepCompleted]);

  // Guardar progreso de la consulta
  const handleSaveProgress = async () => {
    // Validaciones previas
    if (!selectedPatient) {
      toast.error('Por favor seleccione un paciente');
      return;
    }

    if (!user) {
      toast.error('Error: Usuario no autenticado');
      return;
    }

    // Verificar dentist_id
    if (!user.dentist_id) {
      console.error('Usuario sin dentist_id:', { user_id: user.id, role: user.role });
      toast.error('Error: Informacion del doctor no disponible. Cierre sesion e ingrese nuevamente.');
      return;
    }

    // Verificar branch_id o sedesAcceso (uno de los dos es suficiente)
    const hasBranchAccess = user.branch_id || (user.sedesAcceso && user.sedesAcceso.length > 0);
    if (!hasBranchAccess) {
      console.error('Usuario sin branch_id ni sedesAcceso:', {
        user_id: user.id,
        dentist_id: user.dentist_id,
        branch_id: user.branch_id,
        sedesAcceso: user.sedesAcceso,
        role: user.role
      });
      toast.error('Error: Informacion de sede no disponible. Cierre sesion e ingrese nuevamente.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveConsultationProgress({
        selectedPatient,
        currentRecord,
        symptoms,
        medications,
        prescriptionMedications,
        currentTreatment,
        currentOdontogram,
        user,
        createRecord,
        updateRecord,
        createTreatment,
        updateTreatment,
        setPatientOdontogram,
        setCurrentRecord,
        setCurrentTreatment,
        setPrescriptionMedications // Para limpiar el formulario despues de guardar la receta
      });

      if (success) {
        // saveConsultationProgress retorna el consultationId directamente (no depende del state async)
        const consultationIdForTreatmentPlan = typeof success === 'number'
          ? success
          : (currentRecord?.consultationId || currentRecord?.consultation_id || currentRecord?.lastConsultationId);

        // Si estamos en el paso 8 (Plan de Tratamiento), guardar tambien el plan
        if (activeStep === 8 && consultationIdForTreatmentPlan) {
          const treatmentPlanResult = await saveConsultationTreatmentPlan({
            consultationId: consultationIdForTreatmentPlan,
            currentRecord,
            treatmentObservations,
            user
          });
          if (!treatmentPlanResult.success) {
            console.error('Error al guardar plan de tratamiento');
          }
        }

        setUnsavedChanges(false);
        // Solo mostrar toast de exito, NO mostrar modal ni resetear estado
        toast.success('Progreso guardado correctamente');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cierre del modal de éxito (solo para finalización completa)
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // Finalizar y salir de la consulta
  const handleFinishAndExit = () => {
    setShowSuccessModal(false);
    resetConsultationState();
  };

  // Completar consulta
  const handleCompleteConsultation = async () => {
    await handleSaveProgress();
    toast.success('Consulta completada exitosamente');
    resetConsultationState();
  };

  // Preparar opciones para el combobox
  const patientOptions = useMemo(() => formatPatientOptions(patients), [patients]);

  // Filtrar pacientes por búsqueda
  const filteredPatients = searchTerm
    ? searchPatients(searchTerm)
    : patients.slice(0, 10);

  // Renderizar contenido del paso actual - memoizado para evitar re-renders
  const stepContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <PatientSelectionStep
            patientOptions={patientOptions}
            selectedPatient={selectedPatient}
            handlePatientSelection={handlePatientSelection}
            selectedAppointment={selectedAppointment}
            onAppointmentSelect={handleAppointmentSelect}
            user={user}
            markStepCompleted={markStepCompleted}
          />
        );

      case 1:
        return (
          <ClinicalExamStep
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            newPathological={newPathological}
            setNewPathological={setNewPathological}
            newDisease={newDisease}
            setNewDisease={setNewDisease}
            newOperation={newOperation}
            setNewOperation={setNewOperation}
            newAllergy={newAllergy}
            setNewAllergy={setNewAllergy}
            addToMedicalList={handlers.addToMedicalList}
            removeFromMedicalList={handlers.removeFromMedicalList}
            setUnsavedChanges={setUnsavedChanges}
            handleSaveProgress={handleSaveProgress}
            markStepCompleted={markStepCompleted}
            onBack={goToStep0}
            readOnly={readOnlyMode}
          />
        );

      case 2:
        return (
          <OdontogramStep
            selectedPatient={selectedPatient}
            currentOdontogram={currentOdontogram}
            setCurrentOdontogram={setCurrentOdontogram}
            isOdontogramIncomplete={isOdontogramIncomplete}
            setIsOdontogramIncomplete={setIsOdontogramIncomplete}
            setUnsavedChanges={setUnsavedChanges}
            handleOdontogramChange={handlers.handleOdontogramChange}
            onBack={goToStep1}
            onSave={handleSaveProgress}
            onContinue={markStep2Completed}
            readOnly={readOnlyMode}
          />
        );

      case 3:
        return (
          <PresumptiveDiagnosisStep
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            currentOdontogram={currentOdontogram}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep2}
            onSave={handleSaveProgress}
            onContinue={markStep3Completed}
            readOnly={readOnlyMode}
          />
        );

      case 4:
        return (
          <DiagnosticPlanStep
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            setUnsavedChanges={setUnsavedChanges}
            selectedPatient={selectedPatient}
            onBack={goToStep3}
            onSave={handleSaveProgress}
            onContinue={markStep4Completed}
            readOnly={readOnlyMode}
          />
        );

      case 5:
        return (
          <PrescriptionStep
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            medications={prescriptionMedications}
            setMedications={setPrescriptionMedications}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep4}
            onSave={handleSaveProgress}
            onContinue={markStep5Completed}
            readOnly={readOnlyMode}
            user={user}
            patientId={selectedPatient?.id}
          />
        );

      case 6:
        return (
          <AuxiliaryResultsStep
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep5}
            onSave={handleSaveProgress}
            onContinue={markStep6Completed}
            readOnly={readOnlyMode}
          />
        );

      case 7:
        return (
          <FinalDiagnosisStep
            selectedPatient={selectedPatient}
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            getPatientOdontogram={getPatientOdontogram}
            currentOdontogram={currentOdontogram}
            setCurrentOdontogram={setCurrentOdontogram}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep6}
            onSave={handleSaveProgress}
            onContinue={markStep7Completed}
            readOnly={readOnlyMode}
          />
        );

      case 8:
        return (
          <TreatmentPlanStep
            selectedPatient={selectedPatient}
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            additionalServices={additionalServices}
            addAdditionalService={handlers.addAdditionalService}
            updateAdditionalService={handlers.updateAdditionalService}
            removeAdditionalService={handlers.removeAdditionalService}
            treatmentObservations={treatmentObservations}
            setTreatmentObservations={setTreatmentObservations}
            getPatientOdontogram={getPatientOdontogram}
            currentOdontogram={currentOdontogram}
            setCurrentOdontogram={setCurrentOdontogram}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep7}
            onSave={handleSaveProgress}
            onContinue={async () => {
              await handleSaveProgress();
              markStep8Completed();
            }}
            readOnly={readOnlyMode}
          />
        );

      case 9:
        return (
          <BudgetStep
            selectedPatient={selectedPatient}
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            getPatientOdontogram={getPatientOdontogram}
            currentOdontogram={currentOdontogram}
            setUnsavedChanges={setUnsavedChanges}
            handleSaveProgress={handleSaveProgress}
            markStepCompleted={markStepCompleted}
            onBack={goToStep8}
            readOnly={readOnlyMode}
          />
        );

      case 10:
        return (
          <TreatmentPerformedStep
            selectedPatient={selectedPatient}
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            getPatientOdontogram={getPatientOdontogram}
            currentOdontogram={currentOdontogram}
            setCurrentOdontogram={setCurrentOdontogram}
            isOdontogramIncomplete={isOdontogramIncomplete}
            setUnsavedChanges={setUnsavedChanges}
            handleSaveProgress={handleSaveProgress}
            markStepCompleted={markStepCompleted}
            toast={toast}
            onBack={goToStep9}
            readOnly={readOnlyMode}
            user={user}
            appointmentId={appointmentId || undefined}
          />
        );

      case 11:
        return (
          <ProsthesisLabStep
            selectedPatient={selectedPatient}
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            setUnsavedChanges={setUnsavedChanges}
            onBack={goToStep10}
            onSave={handleSaveProgress}
            onFinishConsultation={handleFinishAndExit}
            readOnly={readOnlyMode}
            userRole={user?.role}
            appointmentId={appointmentId || currentRecord?.appointmentId}
          />
        );

      default:
        return null;
    }
  }, [
    activeStep,
    // OPTIMIZACIÓN: Necesitamos los objetos completos pero controlamos los re-renders con React.memo en los componentes hijos
    selectedPatient,
    currentRecord,
    currentOdontogram,
    patientOptions,
    selectedAppointment,
    prescriptionMedications,
    treatmentObservations,
    additionalServices,
    isOdontogramIncomplete,
    newPathological,
    newDisease,
    newOperation,
    newAllergy,
    readOnlyMode,
    user,
    appointmentId,
    // Funciones memoizadas
    handlePatientSelection,
    handleAppointmentSelect,
    markStepCompleted,
    handleSaveProgress,
    handlers,
    diagnosticPlan,
    getPatientOdontogram,
    setCurrentRecord,
    setCurrentOdontogram,
    setUnsavedChanges,
    setNewPathological,
    setNewDisease,
    setNewOperation,
    setNewAllergy,
    setPrescriptionMedications,
    setTreatmentObservations,
    setIsOdontogramIncomplete,
    goToStep0,
    goToStep1,
    goToStep2,
    goToStep3,
    goToStep4,
    goToStep5,
    goToStep6,
    goToStep7,
    goToStep8,
    goToStep9,
    goToStep10,
    markStep2Completed,
    markStep3Completed,
    markStep4Completed,
    markStep5Completed,
    markStep6Completed,
    markStep7Completed,
    markStep8Completed,
    handleFinishAndExit
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Atención Integral del Paciente</h1>
          <p className="text-gray-600 mt-1">
            Flujo completo de atención: Historia clínica, odontograma y tratamiento en un solo lugar
          </p>
        </div>

        {selectedPatient && (
          <div className="mb-6 space-y-3">
            {/* Informacion del paciente */}
            <div className="p-4 bg-clinic-light rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-clinic-primary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      {/* Badge compacto del plan de salud */}
                      <PatientHealthPlanBadge
                        patientId={selectedPatient.id}
                        onPlanLoaded={handlePlanLoaded}
                        compact={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedPatient.documentType}: {selectedPatient.documentNumber} | Tel: {selectedPatient.phone}
                    </p>
                  </div>
                </div>
                {unsavedChanges && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-orange-600"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Cambios sin guardar</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Banner del plan de salud (detallado) - solo si tiene plan */}
            {/* OPTIMIZACIÓN: Usa datos pre-cargados para evitar fetch duplicado */}
            {hasHealthPlan && patientCoverage && (
              <PatientHealthPlanBadge
                patientId={selectedPatient.id}
                compact={false}
                className="shadow-sm"
                preloadedCoverage={patientCoverage}
              />
            )}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
            {consultationSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              const isAccessible = isStepAccessible(step.id, selectedPatient);

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <motion.button
                    whileHover={isAccessible ? { scale: 1.05 } : {}}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-clinic-primary text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : isAccessible
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{step.label}</span>
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>

                  {index < consultationSteps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                      completedSteps.has(step.id) ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {stepContent}
        </motion.div>
      </motion.div>

      {/* Modal de Guardado Exitoso */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={handleCloseSuccessModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative z-10"
            >
              {/* Icono de éxito */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                ¡Consulta Guardada!
              </h2>

              {/* Mensaje */}
              <p className="text-gray-600 text-center mb-8">
                La información de la consulta se ha guardado exitosamente. Serás redirigido al primer paso.
              </p>

              {/* Botón */}
              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Continuar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientConsultation;
