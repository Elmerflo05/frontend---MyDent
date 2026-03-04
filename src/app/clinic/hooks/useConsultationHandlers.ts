import { Dispatch, SetStateAction, useCallback } from 'react';

/**
 * Hook para manejar todas las operaciones de manipulación de arrays y listas
 * en la consulta de pacientes
 */

interface TreatmentProcedure {
  id?: string;
  toothNumber?: string;
  procedureName: string;
  surfaces?: string[];
  price: number;
  status?: 'pending' | 'in_progress' | 'completed';
}

interface ConsultationHandlersProps {
  symptoms: string[];
  setSymptoms: Dispatch<SetStateAction<string[]>>;
  medications: string[];
  setMedications: Dispatch<SetStateAction<string[]>>;
  currentRecord: any;
  setCurrentRecord: Dispatch<SetStateAction<any>>;
  additionalServices: string[];
  setAdditionalServices: Dispatch<SetStateAction<string[]>>;
  currentTreatment: any;
  setCurrentTreatment: Dispatch<SetStateAction<any>>;
  currentOdontogram: any[];
  setCurrentOdontogram: Dispatch<SetStateAction<any[]>>;
  setUnsavedChanges: Dispatch<SetStateAction<boolean>>;
}

export const useConsultationHandlers = (props: ConsultationHandlersProps) => {
  const {
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
  } = props;

  // Funciones para síntomas - memoizadas
  const addSymptom = useCallback(() => {
    setSymptoms(prev => [...prev, '']);
  }, [setSymptoms]);

  const removeSymptom = useCallback((index: number) => {
    setSymptoms(prev => prev.filter((_, i) => i !== index));
  }, [setSymptoms]);

  const updateSymptom = useCallback((index: number, value: string) => {
    setSymptoms(prev => {
      const newSymptoms = [...prev];
      newSymptoms[index] = value;
      return newSymptoms;
    });
    setUnsavedChanges(true);
  }, [setSymptoms, setUnsavedChanges]);

  // Funciones para medicamentos - memoizadas
  const addMedication = useCallback(() => {
    setMedications(prev => [...prev, '']);
  }, [setMedications]);

  const removeMedication = useCallback((index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  }, [setMedications]);

  const updateMedication = useCallback((index: number, value: string) => {
    setMedications(prev => {
      const newMedications = [...prev];
      newMedications[index] = value;
      return newMedications;
    });
    setUnsavedChanges(true);
  }, [setMedications, setUnsavedChanges]);

  // Funciones para manejar listas médicas de anamnesis - memoizadas
  const addToMedicalList = useCallback((
    listName: 'pathologicalHistory' | 'previousDiseases' | 'previousOperations' | 'allergiesList',
    value: string,
    setter: (value: string) => void
  ) => {
    if (value.trim()) {
      setCurrentRecord((prev: any) => {
        if (prev[listName]?.includes(value.trim())) return prev;
        return {
          ...prev,
          [listName]: [...(prev[listName] || []), value.trim()]
        };
      });
      setter('');
      setUnsavedChanges(true);
    }
  }, [setCurrentRecord, setUnsavedChanges]);

  const removeFromMedicalList = useCallback((
    listName: 'pathologicalHistory' | 'previousDiseases' | 'previousOperations' | 'allergiesList',
    value: string
  ) => {
    setCurrentRecord((prev: any) => ({
      ...prev,
      [listName]: prev[listName]?.filter((item: string) => item !== value) || []
    }));
    setUnsavedChanges(true);
  }, [setCurrentRecord, setUnsavedChanges]);

  // Funciones para manejar servicios adicionales del plan de tratamiento - memoizadas
  const addAdditionalService = useCallback(() => {
    setAdditionalServices(prev => [...prev, '']);
  }, [setAdditionalServices]);

  const removeAdditionalService = useCallback((index: number) => {
    setAdditionalServices(prev => prev.filter((_, i) => i !== index));
  }, [setAdditionalServices]);

  const updateAdditionalService = useCallback((index: number, value: string) => {
    setAdditionalServices(prev => {
      const newServices = [...prev];
      newServices[index] = value;
      return newServices;
    });
    setUnsavedChanges(true);
  }, [setAdditionalServices, setUnsavedChanges]);

  // Funciones para prescripciones - memoizadas
  const addPrescription = useCallback((currentPrescription: any, setCurrentPrescription: Dispatch<SetStateAction<any>>) => {
    if (currentPrescription.medication && currentPrescription.dosage) {
      setCurrentRecord((prev: any) => ({
        ...prev,
        prescriptions: [...(prev.prescriptions || []), currentPrescription]
      }));
      setCurrentPrescription({
        medication: '',
        dosage: '',
        frequency: '',
        duration: ''
      });
      setUnsavedChanges(true);
    }
  }, [setCurrentRecord, setUnsavedChanges]);

  const removePrescription = useCallback((index: number) => {
    setCurrentRecord((prev: any) => ({
      ...prev,
      prescriptions: prev.prescriptions?.filter((_: any, i: number) => i !== index) || []
    }));
    setUnsavedChanges(true);
  }, [setCurrentRecord, setUnsavedChanges]);

  // Funciones para procedimientos del tratamiento - memoizadas
  const addProcedure = useCallback(() => {
    const newProcedure: TreatmentProcedure = {
      procedureName: '',
      price: 0,
      status: 'pending'
    };

    setCurrentTreatment((prev: any) => ({
      ...prev,
      procedures: [...prev.procedures, newProcedure]
    }));
    setUnsavedChanges(true);
  }, [setCurrentTreatment, setUnsavedChanges]);

  const updateProcedure = useCallback((index: number, field: string, value: any) => {
    setCurrentTreatment((prev: any) => {
      const updatedProcedures = [...prev.procedures];
      updatedProcedures[index] = { ...updatedProcedures[index], [field]: value };

      const totalCost = updatedProcedures.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

      return {
        ...prev,
        procedures: updatedProcedures,
        totalCost
      };
    });
    setUnsavedChanges(true);
  }, [setCurrentTreatment, setUnsavedChanges]);

  const removeProcedure = useCallback((index: number) => {
    setCurrentTreatment((prev: any) => {
      const updatedProcedures = prev.procedures.filter((_: any, i: number) => i !== index);
      const totalCost = updatedProcedures.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

      return {
        ...prev,
        procedures: updatedProcedures,
        totalCost
      };
    });
    setUnsavedChanges(true);
  }, [setCurrentTreatment, setUnsavedChanges]);

  // Función para manejar cambios en el odontograma - memoizada
  const handleOdontogramChange = useCallback((toothData: any) => {
    setCurrentOdontogram((prev: any[]) => [...prev, toothData]);

    if (toothData.treatments) {
      const procedures = toothData.treatments.map((t: any) => ({
        toothNumber: toothData.toothNumber,
        procedureName: t.name,
        surfaces: t.surfaces,
        price: t.price || 0,
        status: 'pending'
      }));

      setCurrentTreatment((prev: any) => ({
        ...prev,
        procedures: [...prev.procedures, ...procedures],
        totalCost: prev.totalCost + procedures.reduce((sum: number, p: any) => sum + p.price, 0)
      }));
    }

    setUnsavedChanges(true);
  }, [setCurrentOdontogram, setCurrentTreatment, setUnsavedChanges]);

  return {
    // Handlers de síntomas
    addSymptom,
    removeSymptom,
    updateSymptom,

    // Handlers de medicamentos
    addMedication,
    removeMedication,
    updateMedication,

    // Handlers de listas médicas
    addToMedicalList,
    removeFromMedicalList,

    // Handlers de servicios adicionales
    addAdditionalService,
    removeAdditionalService,
    updateAdditionalService,

    // Handlers de prescripciones
    addPrescription,
    removePrescription,

    // Handlers de procedimientos
    addProcedure,
    updateProcedure,
    removeProcedure,

    // Handler de odontograma
    handleOdontogramChange
  };
};
