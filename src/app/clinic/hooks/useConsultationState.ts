import { useState } from 'react';
import { Medication } from '@/components/consultation/steps/PrescriptionStep';

/**
 * Hook personalizado para manejar el estado de la consulta de paciente
 * Encapsula todos los estados relacionados con la consulta
 */
export const useConsultationState = (userId?: string) => {
  // Estados de UI
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());
  const [showPatientSearch, setShowPatientSearch] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para síntomas y medicamentos dinámicos
  const [symptoms, setSymptoms] = useState<string[]>(['']);
  const [medications, setMedications] = useState<string[]>(['']);

  // Estado para medicamentos de la receta médica
  const [prescriptionMedications, setPrescriptionMedications] = useState<Medication[]>([]);

  // Estados para listas dinámicas de anamnesis
  const [newPathological, setNewPathological] = useState('');
  const [newDisease, setNewDisease] = useState('');
  const [newOperation, setNewOperation] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Estados para el plan de tratamiento
  const [additionalServices, setAdditionalServices] = useState<string[]>(['']);
  const [treatmentObservations, setTreatmentObservations] = useState('');


  // Estado del record médico completo
  const [currentRecord, setCurrentRecord] = useState<any>({
    patientId: '',
    doctorId: userId || '',
    date: new Date(),
    currentSymptoms: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    habits: '',
    diagnosis: '',
    prescriptions: [],
    notes: '',
    // Examen clínico - Anamnesis (campos movidos de CreatePatient)
    consultationReason: '',
    pathologicalHistory: [],
    previousDiseases: [],
    previousOperations: [],
    allergiesList: [], // Renombrado para evitar conflicto con 'allergies'
    stomatologicalHistory: '',
    // Examen clínico - Funciones vitales
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    // Examen clínico - Evaluaciones (campos separados con soporte para imagenes)
    generalCondition: '',
    extraoralExam: '',
    extraoralExamImages: [] as string[],
    pendingExtraoralImages: [] as Array<{ id: string; file: File; previewUrl: string }>,
    intraoralExam: '',
    intraoralExamImages: [] as string[],
    pendingIntraoralImages: [] as Array<{ id: string; file: File; previewUrl: string }>,
    // Diagnóstico Presuntivo (solo observaciones - las condiciones vienen del odontograma)
    presumptiveDiagnosis: {
      observacionesDiagnostico: ''
    },
    // Plan para el diagnóstico definitivo
    diagnosticPlan: {
      selectedExams: [], // Exámenes seleccionados de servicios de laboratorio
      customExams: [],   // Exámenes escritos manualmente
      totalCost: 0,
      observations: ''
    },
    // Resultados de exámenes auxiliares
    examResults: {
      laboratoryResults: [], // Resultados subidos por técnico de imágenes
      externalResults: [],   // Resultados externos subidos por admin/recepcionista
      observations: ''
    },
    // Diagnóstico definitivo
    finalDiagnosis: '',
    // Plan de tratamiento
    treatmentPlan: {
      description: '',
      additionalServices: [], // Servicios adicionales sin precios
      observations: ''
    },
    // Presupuesto consolidado
    consolidatedBudget: {
      odontogramItems: [],
      diagnosticTests: [],
      additionalServices: [],
      totalCost: 0,
      advance: 0,
      balance: 0,
      observations: ''
    },
    // Tratamiento realizado
    treatmentPerformed: '',
    // Checkboxes de tratamientos completados (persiste entre navegaciones)
    // FORMATO DE CLAVES (actualizado 2026-01-29):
    // - procedure-id-{definitive_condition_id} : Cuando hay ID de BD (preferido)
    // - procedure-tooth-{toothId}-cond-{conditionId} : Cuando hay IDs de posición/condición
    // - procedure-{index} : Fallback para datos legacy
    // - treatment-{tIndex}-cond-{cIndex} : Para tratamientos aplicados
    // - prosthesis-{index}, exam-{index}, prescription-{index} : Otros tipos
    completedTreatments: {} as Record<string, boolean>
  });

  // Estado del tratamiento
  const [currentTreatment, setCurrentTreatment] = useState<any>({
    patientId: '',
    doctorId: userId || '',
    diagnosis: '',
    procedures: [],
    estimatedDuration: '',
    priority: 'normal',
    notes: '',
    status: 'planned',
    totalCost: 0,
    paidAmount: 0,
    startDate: new Date()
  });

  // Estado del odontograma
  const [currentOdontogram, setCurrentOdontogram] = useState<any>([]);
  const [isOdontogramIncomplete, setIsOdontogramIncomplete] = useState<boolean>(false);

  // Estado de la prescripción actual
  const [currentPrescription, setCurrentPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  // Función para resetear el estado completo
  const resetConsultationState = () => {
    setSelectedPatient(null);
    setCurrentRecord({
      patientId: '',
      doctorId: userId || '',
      date: new Date(),
      currentSymptoms: '',
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      habits: '',
      diagnosis: '',
      prescriptions: [],
      notes: '',
      consultationReason: '',
      pathologicalHistory: [],
      previousDiseases: [],
      previousOperations: [],
      allergiesList: [],
      stomatologicalHistory: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      weight: '',
      height: '',
      generalCondition: '',
      extraoralExam: '',
      extraoralExamImages: [],
      pendingExtraoralImages: [],
      intraoralExam: '',
      intraoralExamImages: [],
      pendingIntraoralImages: [],
      presumptiveDiagnosis: {
        observacionesDiagnostico: ''
      },
      completedTreatments: {}
    });
    setCurrentTreatment({
      patientId: '',
      doctorId: userId || '',
      diagnosis: '',
      procedures: [],
      estimatedDuration: '',
      priority: 'normal',
      notes: '',
      status: 'planned',
      totalCost: 0,
      paidAmount: 0,
      startDate: new Date()
    });
    setCurrentOdontogram([]);
    setCompletedSteps(new Set());
    setActiveStep(0);
    setShowPatientSearch(true);
    setSymptoms(['']);
    setMedications(['']);
    setPrescriptionMedications([]);
    setUnsavedChanges(false);
  };

  return {
    // Estados de UI
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

    // Estados de síntomas y medicamentos
    symptoms,
    setSymptoms,
    medications,
    setMedications,
    prescriptionMedications,
    setPrescriptionMedications,

    // Estados de anamnesis
    newPathological,
    setNewPathological,
    newDisease,
    setNewDisease,
    newOperation,
    setNewOperation,
    newAllergy,
    setNewAllergy,

    // Estados de tratamiento
    additionalServices,
    setAdditionalServices,
    treatmentObservations,
    setTreatmentObservations,

    // Estados principales
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

    // Función de reset
    resetConsultationState
  };
};
