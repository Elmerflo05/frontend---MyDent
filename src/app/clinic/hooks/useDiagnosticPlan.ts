import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import {
  loadLaboratoryServices as loadServicesFromDB,
  loadPanocefRequests as loadPanocefFromDB,
  loadPatientLabResults as loadLabResultsFromDB,
  loadPatientRadiographyRequests,
  sendLabRequest
} from '../services/consultationService';

/**
 * Hook para manejar toda la lógica del plan diagnóstico
 * Incluye gestión de servicios de laboratorio, exámenes, y solicitudes PANOCEF
 */

interface DiagnosticPlanProps {
  selectedPatient: any;
  currentRecord: any;
  setCurrentRecord: Dispatch<SetStateAction<any>>;
  setUnsavedChanges: Dispatch<SetStateAction<boolean>>;
  user: any;
}

export const useDiagnosticPlan = (props: DiagnosticPlanProps) => {
  const { selectedPatient, currentRecord, setCurrentRecord, setUnsavedChanges, user } = props;

  // Estados para el Plan Diagnostico
  const [laboratoryServices, setLaboratoryServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [customExam, setCustomExam] = useState({
    name: '',
    description: '',
    estimatedPrice: ''
  });
  const [laboratorioInternoResults, setLaboratorioInternoResults] = useState<any[]>([]);
  const [resultadosExternosState, setResultadosExternosState] = useState<any[]>([]);
  const [panocefRequests, setPanocefRequests] = useState<any[]>([]);
  const [radiographyRequests, setRadiographyRequests] = useState<any[]>([]);

  // OPTIMIZACIÓN: Cargar servicios de laboratorio solo una vez al inicializar
  useEffect(() => {
    loadLaboratoryServices();
  }, []); // Sin dependencias - solo al montar

  // OPTIMIZACIÓN: Cargar solicitudes de PANOCEF cuando cambia el paciente (con guard)
  useEffect(() => {
    if (selectedPatient?.id) {
      loadPanocefRequests();
    }
  }, [selectedPatient?.id]); // Solo el ID

  // OPTIMIZACIÓN: Cargar resultados de laboratorio solo si cambia el ID del paciente
  useEffect(() => {
    if (selectedPatient?.id) {
      loadPatientLabResults();
    }
  }, [selectedPatient?.id]); // Solo el ID, no todo el objeto

  // OPTIMIZACIÓN: Cargar solicitudes de radiografia cuando cambia el paciente
  // Se cargan TODAS las radiografías del paciente (sin filtrar por consultation_id)
  // para incluir las creadas desde el laboratorio de imágenes
  useEffect(() => {
    if (selectedPatient?.id) {
      loadRadiographyRequests();
    }
  }, [selectedPatient?.id]); // Solo el ID del paciente

  // Funcion para cargar servicios de laboratorio
  const loadLaboratoryServices = async () => {
    try {
      setLoadingServices(true);
      const services = await loadServicesFromDB();
      setLaboratoryServices(services);
    } catch (error) {
    } finally {
      setLoadingServices(false);
    }
  };

  // Función para cargar solicitudes PANOCEF
  const loadPanocefRequests = async () => {
    if (!selectedPatient?.id) {
      setPanocefRequests([]);
      return;
    }

    try {
      const requests = await loadPanocefFromDB(selectedPatient.id);
      setPanocefRequests(requests);
    } catch (error) {
    }
  };

  // Funcion para cargar resultados de laboratorio
  const loadPatientLabResults = async () => {
    if (!selectedPatient) {
      setLaboratorioInternoResults([]);
      setResultadosExternosState([]);
      return;
    }

    try {
      const { internalResults, externalResults } = await loadLabResultsFromDB(selectedPatient);
      setLaboratorioInternoResults(internalResults);
      setResultadosExternosState(externalResults);
    } catch (error) {
      setLaboratorioInternoResults([]);
      setResultadosExternosState([]);
    }
  };

  // Funcion para cargar solicitudes de radiografia del backend
  // Carga TODAS las radiografías del paciente (sin filtrar por consultation_id)
  // para incluir las creadas desde el laboratorio de imágenes
  const loadRadiographyRequests = async () => {
    const patientId = selectedPatient?.id || selectedPatient?.patient_id;

    if (!patientId) {
      setRadiographyRequests([]);
      return;
    }

    try {
      // Solo pasar patientId para obtener TODAS las radiografías del paciente
      const requests = await loadPatientRadiographyRequests(patientId, null);
      setRadiographyRequests(requests);
    } catch (error) {
      console.error('Error al cargar solicitudes de radiografia:', error);
      setRadiographyRequests([]);
    }
  };

  // Función para manejar selección de servicios
  const handleServiceSelect = (service: any, isSelected: boolean) => {
    setCurrentRecord((prev: any) => {
      const currentExams = prev.diagnosticPlan?.selectedExams || [];
      let updatedExams;

      if (isSelected) {
        // Agregar examen si no existe
        if (!currentExams.find((exam: any) => exam.id === service.id)) {
          updatedExams = [...currentExams, {
            id: service.id,
            name: service.name,
            price: service.price || 0,
            type: 'service',
            description: service.description,
            isInternal: true // Por defecto es interno
          }];
        } else {
          updatedExams = currentExams;
        }
      } else {
        // Remover examen
        updatedExams = currentExams.filter((exam: any) => exam.id !== service.id);
      }

      const totalCost = calculateTotalCost(updatedExams, prev.diagnosticPlan?.customExams || []);

      return {
        ...prev,
        diagnosticPlan: {
          ...prev.diagnosticPlan,
          selectedExams: updatedExams,
          totalCost
        }
      };
    });
    setUnsavedChanges(true);
  };

  // Función para cambiar tipo de examen (interno/externo)
  const handleToggleExamType = (examId: string, isInternal: boolean) => {
    setCurrentRecord((prev: any) => {
      const updatedExams = (prev.diagnosticPlan?.selectedExams || []).map((exam: any) =>
        exam.id === examId ? { ...exam, isInternal } : exam
      );

      const updatedCustomExams = (prev.diagnosticPlan?.customExams || []).map((exam: any) =>
        exam.id === examId ? { ...exam, isInternal } : exam
      );

      return {
        ...prev,
        diagnosticPlan: {
          ...prev.diagnosticPlan,
          selectedExams: updatedExams,
          customExams: updatedCustomExams
        }
      };
    });
    setUnsavedChanges(true);
  };

  // Función para marcar/desmarcar envío a PANOCEF
  const handleTogglePanocef = (examId: string, sendToPanocef: boolean) => {
    setCurrentRecord((prev: any) => {
      const updatedExams = (prev.diagnosticPlan?.selectedExams || []).map((exam: any) =>
        exam.id === examId ? { ...exam, sendToPanocef } : exam
      );

      const updatedCustomExams = (prev.diagnosticPlan?.customExams || []).map((exam: any) =>
        exam.id === examId ? { ...exam, sendToPanocef } : exam
      );

      return {
        ...prev,
        diagnosticPlan: {
          ...prev.diagnosticPlan,
          selectedExams: updatedExams,
          customExams: updatedCustomExams
        }
      };
    });
    setUnsavedChanges(true);
  };

  // Función para agregar examen personalizado
  const handleAddCustomExam = () => {
    if (!customExam.name.trim()) {
      toast.error('Por favor ingrese el nombre del examen');
      return;
    }

    const price = parseFloat(customExam.estimatedPrice) || 0;

    setCurrentRecord((prev: any) => {
      const currentCustomExams = prev.diagnosticPlan?.customExams || [];
      const updatedCustomExams = [...currentCustomExams, {
        id: Date.now().toString(),
        name: customExam.name,
        description: customExam.description,
        estimatedPrice: price,
        type: 'manual',
        isInternal: false // Los exámenes manuales por defecto son externos
      }];

      const totalCost = calculateTotalCost(prev.diagnosticPlan?.selectedExams || [], updatedCustomExams);

      return {
        ...prev,
        diagnosticPlan: {
          ...prev.diagnosticPlan,
          customExams: updatedCustomExams,
          totalCost
        }
      };
    });

    setCustomExam({ name: '', description: '', estimatedPrice: '' });
    setUnsavedChanges(true);
    toast.success('Examen agregado exitosamente');
  };

  // Función para remover examen
  const handleRemoveExam = (examId: string, type: 'service' | 'manual') => {
    setCurrentRecord((prev: any) => {
      let updatedSelectedExams = prev.diagnosticPlan?.selectedExams || [];
      let updatedCustomExams = prev.diagnosticPlan?.customExams || [];

      if (type === 'service') {
        updatedSelectedExams = updatedSelectedExams.filter((exam: any) => exam.id !== examId);
      } else {
        updatedCustomExams = updatedCustomExams.filter((exam: any) => exam.id !== examId);
      }

      const totalCost = calculateTotalCost(updatedSelectedExams, updatedCustomExams);

      return {
        ...prev,
        diagnosticPlan: {
          ...prev.diagnosticPlan,
          selectedExams: updatedSelectedExams,
          customExams: updatedCustomExams,
          totalCost
        }
      };
    });
    setUnsavedChanges(true);
  };

  // Función para calcular costo total
  const calculateTotalCost = (selectedExams: any[], customExams: any[]): number => {
    const selectedTotal = selectedExams.reduce((sum, exam) => sum + (exam.price || 0), 0);
    const customTotal = customExams.reduce((sum, exam) => sum + (exam.estimatedPrice || 0), 0);
    return selectedTotal + customTotal;
  };

  // Función para enviar solicitud de laboratorio
  const handleSendLabRequest = async () => {
    await sendLabRequest({
      selectedPatient,
      user,
      currentRecord
    });
  };

  return {
    // Estados
    laboratoryServices,
    loadingServices,
    customExam,
    setCustomExam,
    laboratorioInternoResults,
    resultadosExternosState,
    panocefRequests,
    radiographyRequests,

    // Funciones
    loadLaboratoryServices,
    loadPanocefRequests,
    loadPatientLabResults,
    loadRadiographyRequests,
    handleServiceSelect,
    handleToggleExamType,
    handleTogglePanocef,
    handleAddCustomExam,
    handleRemoveExam,
    calculateTotalCost,
    handleSendLabRequest
  };
};
