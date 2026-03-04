import { toast } from 'sonner';
import type { Patient } from '@/types';
import { consultationsApi, ConsultationTreatmentPlanData } from '@/services/api/consultationsApi';
import { medicalHistoriesApi } from '@/services/api/medicalHistoriesApi';
import { odontogramsApi } from '@/services/api/odontogramsApi';
import { prescriptionsApi } from '@/services/api/prescriptionsApi';
import { laboratoryApi, LaboratoryRequestData } from '@/services/api/laboratoryApi';
import { radiographyApi } from '@/services/api/radiographyApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Servicio para manejar operaciones de consulta de pacientes
 */

interface SaveProgressParams {
  selectedPatient: Patient;
  currentRecord: any;
  symptoms: string[];
  medications: string[];
  prescriptionMedications: any[];
  currentTreatment: any;
  currentOdontogram: any[];
  user: any;
  createRecord: (record: any) => string;
  updateRecord: (id: string, record: any) => void;
  createTreatment: (treatment: any) => string;
  updateTreatment: (id: string, treatment: any) => void;
  setPatientOdontogram: (patientId: string, odontogram: any[]) => void;
  setCurrentRecord: (record: any) => void;
  setCurrentTreatment: (treatment: any) => void;
  // Función para limpiar medicamentos después de guardar receta
  setPrescriptionMedications?: (meds: any[]) => void;
}

// Tipo de retorno con información sobre la prescripción guardada
export interface SaveProgressResult {
  success: boolean;
  prescriptionSaved?: boolean;
  prescriptionId?: number;
}

export const saveConsultationProgress = async (params: SaveProgressParams): Promise<boolean> => {
  const {
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
    setPrescriptionMedications
  } = params;

  try {
    const patientIdNumeric = parseInt(selectedPatient.id, 10);
    const userIdNumeric = user?.id ? parseInt(user.id, 10) : undefined;

    // Obtener branch_id: primero el directo, luego el primer elemento de sedesAcceso
    // (definido aquí para que esté disponible en todos los bloques)
    const effectiveBranchId = user?.branch_id ||
      (user?.sedesAcceso && user.sedesAcceso.length > 0 ? parseInt(user.sedesAcceso[0], 10) : undefined);

    // 1. GUARDAR CONSULTA EN LA BASE DE DATOS
    try {
      // Validaciones previas del frontend
      if (!user?.dentist_id) {
        console.error('Error: dentist_id no disponible en el usuario', { user });
        toast.error('Error: No se encontró información del doctor. Por favor, cierre sesión e inicie nuevamente.');
        return false;
      }

      if (!effectiveBranchId) {
        console.error('Error: branch_id no disponible en el usuario', { user, effectiveBranchId });
        toast.error('Error: No se encontró información de la sede. Por favor, cierre sesión e inicie nuevamente.');
        return false;
      }

      if (isNaN(patientIdNumeric)) {
        toast.error('Error: ID de paciente inválido');
        return false;
      }

      // Construir signos vitales (JSONB)
      const vitalSigns = {
        blood_pressure: currentRecord.bloodPressure || null,
        heart_rate: currentRecord.heartRate || null,
        respiratory_rate: currentRecord.respiratoryRate || null,
        weight: currentRecord.weight || null,
        height: currentRecord.height || null,
        temperature: currentRecord.temperature || null
      };

      // Los campos del examen clinico ahora se envian por separado
      // physical_examination se mantiene por compatibilidad pero se prefieren los campos separados
      const physicalExamParts: string[] = [];
      if (currentRecord.generalCondition) {
        physicalExamParts.push(`Condicion general: ${currentRecord.generalCondition}`);
      }
      if (currentRecord.extraoralExam) {
        physicalExamParts.push(`Examen extraoral: ${currentRecord.extraoralExam}`);
      }
      if (currentRecord.intraoralExam) {
        physicalExamParts.push(`Examen intraoral: ${currentRecord.intraoralExam}`);
      }
      const physicalExamination = physicalExamParts.join('\n\n') || null;

      const consultationData = {
        // IMPORTANTE: Si ya existe una consulta cargada, enviar su ID para actualizar en lugar de crear nueva
        consultation_id: currentRecord.consultationId || currentRecord.lastConsultationId || null,
        patient_id: patientIdNumeric,
        dentist_id: user.dentist_id,
        branch_id: effectiveBranchId,
        appointment_id: currentRecord.appointmentId || null, // Vincular con la cita seleccionada
        // Fecha local sin conversión a UTC para evitar desplazamiento de día
        consultation_date: (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        })(),
        consultation_time: new Date().toTimeString().split(' ')[0],
        // Campos correctos del backend
        chief_complaint: currentRecord.consultationReason || '',
        present_illness: symptoms.filter(s => s.trim() !== '').join(', ') || currentRecord.symptoms || '',
        vital_signs: vitalSigns,
        physical_examination: physicalExamination, // @deprecated - mantener por compatibilidad
        // Nuevos campos separados para examen clinico
        general_condition: currentRecord.generalCondition || null,
        extraoral_exam: currentRecord.extraoralExam || null,
        extraoral_exam_images: currentRecord.extraoralExamImages || [],
        intraoral_exam: currentRecord.intraoralExam || null,
        intraoral_exam_images: currentRecord.intraoralExamImages || [],
        diagnosis: currentRecord.presumptiveDiagnosis?.observacionesDiagnostico || currentRecord.diagnosis || '',
        treatment_plan: currentRecord.treatmentPlan || '',
        // Tratamiento realizado - Paso 10 Atencion Integral
        treatment_performed: currentRecord.treatmentPerformed || null,
        // Ya no guardamos prescripciones como JSON aqui - se guardan en tabla prescriptions/prescription_items
        prescriptions_given: prescriptionMedications?.length > 0 ? 'Ver receta medica adjunta' : '',
        recommendations: currentRecord.recommendations || '',
        notes: currentRecord.notes || currentRecord.generalObservations || '',
        next_visit_date: currentRecord.nextVisitDate || null,
        user_id_registration: userIdNumeric
      };

      // Usar upsert: Si existe una consulta con el mismo appointment_id, la actualiza.
      // Si no existe, crea una nueva. Esto evita duplicados.
      const savedConsultation = await consultationsApi.upsertConsultation(consultationData);

      if (savedConsultation.success && savedConsultation.data) {
        const consultationId = savedConsultation.data.consultation_id;

        // Subir imágenes pendientes extraorales
        if (currentRecord.pendingExtraoralImages && currentRecord.pendingExtraoralImages.length > 0) {
          try {
            const extraoralFiles = currentRecord.pendingExtraoralImages.map((img: any) => img.file);
            const extraoralResponse = await consultationsApi.uploadExtraoralImages(consultationId, extraoralFiles);
            if (extraoralResponse.success) {
              // Limpiar las imágenes pendientes y actualizar las subidas
              setCurrentRecord((prev: any) => ({
                ...prev,
                extraoralExamImages: extraoralResponse.data.extraoral_exam_images || [],
                pendingExtraoralImages: []
              }));
              // Liberar URLs de objetos
              currentRecord.pendingExtraoralImages.forEach((img: any) => URL.revokeObjectURL(img.previewUrl));
            }
          } catch (imgError) {
            console.error('Error al subir imágenes extraorales:', imgError);
            toast.warning('Algunas imágenes extraorales no se pudieron subir');
          }
        }

        // Subir imágenes pendientes intraorales
        if (currentRecord.pendingIntraoralImages && currentRecord.pendingIntraoralImages.length > 0) {
          try {
            const intraoralFiles = currentRecord.pendingIntraoralImages.map((img: any) => img.file);
            const intraoralResponse = await consultationsApi.uploadIntraoralImages(consultationId, intraoralFiles);
            if (intraoralResponse.success) {
              // Limpiar las imágenes pendientes y actualizar las subidas
              setCurrentRecord((prev: any) => ({
                ...prev,
                intraoralExamImages: intraoralResponse.data.intraoral_exam_images || [],
                pendingIntraoralImages: []
              }));
              // Liberar URLs de objetos
              currentRecord.pendingIntraoralImages.forEach((img: any) => URL.revokeObjectURL(img.previewUrl));
            }
          } catch (imgError) {
            console.error('Error al subir imágenes intraorales:', imgError);
            toast.warning('Algunas imágenes intraorales no se pudieron subir');
          }
        }

        setCurrentRecord((prev: any) => ({
          ...prev,
          consultationId: consultationId
        }));

        // GUARDAR PRESCRIPCION MEDICA (si hay medicamentos)
        if (prescriptionMedications && prescriptionMedications.length > 0) {
          try {
            // Convertir medicamentos del formato del componente al formato del API
            const prescriptionItems = prescriptionMedications.map((med: any) => ({
              medication_id: med.medication_id || null, // Si viene del catalogo
              medication_name: med.name || med.medication_name,
              concentration: med.concentracion || med.concentration || '',
              quantity: med.cantidad || med.quantity,
              instructions: med.indicaciones || med.instructions
            }));

            const prescriptionData = {
              patient_id: patientIdNumeric,
              dentist_id: user.dentist_id,
              branch_id: effectiveBranchId,
              appointment_id: currentRecord.appointmentId || undefined,
              consultation_id: consultationId,
              prescription_date: formatDateToYMD(new Date()),
              signature: currentRecord.prescriptionSignature || null,
              notes: '',
              items: prescriptionItems
            };

            const savedPrescription = await prescriptionsApi.createPrescriptionWithItems(prescriptionData);

            if (savedPrescription.success && savedPrescription.data) {
              // Limpiar el formulario de prescripción para permitir crear nuevas recetas
              if (setPrescriptionMedications) {
                setPrescriptionMedications([]);
              }

              // Limpiar la firma del formulario y actualizar el ID
              setCurrentRecord((prev: any) => ({
                ...prev,
                prescriptionId: savedPrescription.data.prescription_id,
                prescriptionSignature: null // Limpiar firma para nueva receta
              }));

              toast.success('Receta médica guardada exitosamente');
            }
          } catch (prescriptionError) {
            console.error('Error al guardar prescripcion:', prescriptionError);
            toast.warning('La consulta se guardo pero hubo un error al guardar la receta medica');
          }
        }

        // Mensaje diferenciado segun si se creo o actualizo (silencioso)
      } else {
        toast.error('No se pudo guardar la consulta');
        return false;
      }
    } catch (error: any) {
      console.error('Error al guardar consulta:', error);

      // Manejo de errores específicos del backend
      const errorMessage = error?.data?.error || error?.message || 'Error desconocido';
      const errorDetail = error?.data?.detail || '';

      if (error?.status === 404) {
        toast.error(`Error de validación: ${errorMessage}`);
      } else if (error?.status === 400) {
        toast.error(`Datos inválidos: ${errorMessage}${errorDetail ? ` - ${errorDetail}` : ''}`);
      } else {
        toast.error(`Error al guardar consulta: ${errorMessage}${errorDetail ? ` - ${errorDetail}` : ''}`);
      }

      return false;
    }

    // 2. GUARDAR/ACTUALIZAR HISTORIA MÉDICA (usando upsert)
    try {
      const hasMedicalData =
        currentRecord.pathologicalHistory?.length > 0 ||
        currentRecord.previousDiseases?.length > 0 ||
        currentRecord.previousOperations?.length > 0 ||
        currentRecord.allergiesList?.length > 0 ||
        currentRecord.hasAllergies !== undefined ||
        currentRecord.hasChronicDiseases !== undefined;

      if (hasMedicalData) {
        // Helper para convertir a string de forma segura (arrays o strings)
        const toSafeString = (value: any): string => {
          if (!value) return '';
          if (Array.isArray(value)) return value.filter(v => v && String(v).trim() !== '').join(', ');
          if (typeof value === 'string') return value;
          return String(value);
        };

        // Calcular booleanos automáticamente basado en si hay datos en las listas
        const hasAllergiesData = Array.isArray(currentRecord.allergiesList) && currentRecord.allergiesList.length > 0;
        const hasChronicDiseasesData = Array.isArray(currentRecord.previousDiseases) && currentRecord.previousDiseases.length > 0;
        const hasSurgeriesData = Array.isArray(currentRecord.previousOperations) && currentRecord.previousOperations.length > 0;
        const hasMedicationsData = Array.isArray(currentRecord.currentMedications)
          ? currentRecord.currentMedications.length > 0
          : !!currentRecord.currentMedications;

        const medicalHistoryData = {
          patient_id: patientIdNumeric,
          // Campos booleanos calculados automáticamente
          has_allergies: hasAllergiesData || currentRecord.hasAllergies || false,
          allergies_description: toSafeString(currentRecord.allergiesList),
          has_chronic_diseases: hasChronicDiseasesData || currentRecord.hasChronicDiseases || false,
          chronic_diseases_description: toSafeString(currentRecord.previousDiseases),
          has_medications: hasMedicationsData,
          current_medications: toSafeString(currentRecord.currentMedications) || medications.filter(m => m.trim() !== '').join(', ') || '',
          has_surgeries: hasSurgeriesData,
          surgeries_description: toSafeString(currentRecord.previousOperations),
          has_diabetes: currentRecord.hasDiabetes || false,
          has_hypertension: currentRecord.hasHypertension || false,
          has_heart_disease: currentRecord.hasHeartDisease || false,
          is_pregnant: currentRecord.isPregnant || null,
          pregnancy_months: currentRecord.pregnancyMonths || null,
          is_breastfeeding: currentRecord.isBreastfeeding || null,
          smokes: currentRecord.smokes || false,
          smoking_frequency: currentRecord.smokingFrequency || null,
          drinks_alcohol: currentRecord.drinksAlcohol || false,
          alcohol_frequency: currentRecord.alcoholFrequency || null,
          last_dental_visit: currentRecord.lastDentalVisit || null,
          additional_notes: currentRecord.stomatologicalHistory || currentRecord.additionalMedicalNotes || '',
          user_id_registration: userIdNumeric,
          // Campo de antecedentes patologicos (array de strings)
          pathological_background: Array.isArray(currentRecord.pathologicalHistory)
            ? currentRecord.pathologicalHistory.filter((item: string) => item && item.trim() !== '')
            : []
        };

        // Usar upsert: Si existe historia médica para el paciente, la actualiza. Si no, crea una nueva.
        const savedHistory = await medicalHistoriesApi.upsertMedicalHistory(medicalHistoryData);
        if (savedHistory.success && savedHistory.data) {
          setCurrentRecord((prev: any) => ({
            ...prev,
            medicalHistoryId: savedHistory.data.medical_history_id
          }));
        }
      }
    } catch (error: any) {
      // Error silencioso - el historial médico es opcional
    }

    // 3. GUARDAR ODONTOGRAMA - Usando API relacional
    try {
      if (currentOdontogram && currentOdontogram.length > 0) {

        // Obtener catálogo de condiciones dentales del store
        const { dentalConditions, customConditions } = useOdontogramConfigStore.getState();
        const allConditions = [...dentalConditions, ...customConditions];

        // Convertir condiciones del formato del componente al formato del backend
        // El componente puede enviar 'conditionId' o 'condition' como identificador
        const conditionsForDB = currentOdontogram.map((condition: any) => {
          // Buscar la condición en el catálogo para obtener datos completos
          const conditionId = condition.conditionId || condition.condition;
          const catalogCondition = allConditions.find(c => c.id === conditionId);

          return {
            tooth_number: condition.toothNumber,
            tooth_position_id: condition.tooth_position_id,
            surface_section: condition.sectionId,
            // Obtener dental_condition_id del catálogo si no viene en la condición
            dental_condition_id: condition.dental_condition_id || catalogCondition?.condition_id,
            condition_name: condition.condition_name || catalogCondition?.label || conditionId,
            tooth_surface_id: condition.tooth_surface_id,
            // Obtener precio del catálogo si no viene en la condición
            price: condition.price || catalogCondition?.price_base || catalogCondition?.default_price || 0,
            notes: condition.notes,
            description: condition.notes,
            // Diente conectado (para prótesis, aparatos ortodónticos, transposición)
            connected_tooth_number: condition.connectedToothNumber
          };
        });

        // Usar upsertPatientOdontogram para crear o actualizar el odontograma
        // con las condiciones de forma relacional
        const savedOdontogram = await odontogramsApi.upsertPatientOdontogram(
          patientIdNumeric,
          {
            dentist_id: user?.dentist_id,
            branch_id: effectiveBranchId,
            appointment_id: currentRecord.appointmentId || undefined,
            consultation_id: currentRecord.consultationId || undefined,
            odontogram_type: 'adult',
            general_observations: currentRecord.odontogramObservations || '',
            conditions: conditionsForDB
          }
        );

        if (savedOdontogram && savedOdontogram.odontogram_id) {
          setCurrentRecord((prev: any) => ({
            ...prev,
            odontogramId: savedOdontogram.odontogram_id
          }));
        }

        // También actualizar el store local para compatibilidad inmediata en UI
        setPatientOdontogram(selectedPatient.id, currentOdontogram);
      }
    } catch (error: any) {
      console.error('Error al guardar odontograma:', error);

      // Manejo de errores específicos
      const errorMessage = error?.response?.data?.error || error?.message;
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        console.warn(`Error de validación al guardar odontograma: ${errorMessage}`);
      }
      // No bloquear el flujo - el odontograma es opcional
    }

    // 4. MANTENER COMPATIBILIDAD CON STORES LOCALES (para backward compatibility)
    const updatedRecord = {
      ...currentRecord,
      symptoms: symptoms.filter(s => s.trim() !== ''),
      medications: medications.filter(m => m.trim() !== ''),
      prescriptionMedications: prescriptionMedications
    };

    if (!updatedRecord.id) {
      const recordId = createRecord(updatedRecord);
      setCurrentRecord((prev: any) => ({ ...prev, id: recordId }));
    } else {
      updateRecord(updatedRecord.id, updatedRecord);
    }

    if (currentTreatment && currentTreatment.procedures && currentTreatment.procedures.length > 0) {
      if (!currentTreatment.id) {
        const treatmentId = createTreatment(currentTreatment);
        setCurrentTreatment((prev: any) => ({ ...prev, id: treatmentId }));
      } else {
        updateTreatment(currentTreatment.id, currentTreatment);
      }
    }

    // 5. MARCAR CITA COMO COMPLETADA (si hay appointmentId)
    if (currentRecord.appointmentId) {
      try {
        await appointmentsApi.markAppointmentAsCompleted(currentRecord.appointmentId);
        console.log('✅ Cita marcada como completada:', currentRecord.appointmentId);
      } catch (appointmentError) {
        console.warn('No se pudo marcar la cita como completada:', appointmentError);
        // No bloquear el flujo - la consulta ya se guardó
      }
    }

    toast.success('Progreso guardado exitosamente en la base de datos');
    return true;
  } catch (error) {
    console.error('Error al guardar el progreso:', error);
    toast.error('Error al guardar el progreso');
    return false;
  }
};

interface SendLabRequestParams {
  selectedPatient: Patient | null;
  user: any;
  currentRecord: any;
}

export const sendLabRequest = async (params: SendLabRequestParams): Promise<void> => {
  const { selectedPatient, user, currentRecord } = params;

  if (!selectedPatient) {
    toast.error('No hay paciente seleccionado');
    return;
  }

  if (!user) {
    toast.error('Usuario no autenticado');
    return;
  }

  const patientIdNumeric = parseInt(selectedPatient.id, 10);
  if (isNaN(patientIdNumeric)) {
    toast.error('Error: ID de paciente invalido');
    return;
  }

  if (!user?.dentist_id) {
    toast.error('Error: Informacion del doctor incompleta');
    return;
  }

  // Obtener branch_id: primero el directo, luego el primer elemento de sedesAcceso
  const effectiveBranchId = user?.branch_id ||
    (user?.sedesAcceso && user.sedesAcceso.length > 0 ? parseInt(user.sedesAcceso[0], 10) : undefined);

  if (!effectiveBranchId) {
    toast.error('Error: No se encontró información de la sede');
    return;
  }

  const allExamsSelected = [
    ...(currentRecord.diagnosticPlan?.selectedExams || []),
    ...(currentRecord.diagnosticPlan?.customExams || [])
  ];

  if (allExamsSelected.length === 0) {
    toast.error('Debe seleccionar al menos un servicio de imagenes');
    return;
  }

  try {
    let successCount = 0;
    let errorCount = 0;

    // Crear solicitudes de laboratorio para cada examen seleccionado
    for (const exam of allExamsSelected) {
      try {
        const requestData: LaboratoryRequestData = {
          patient_id: patientIdNumeric,
          dentist_id: user.dentist_id,
          branch_id: effectiveBranchId,
          service_id: exam.service_id || exam.id,
          request_date: formatDateToYMD(new Date()),
          requested_delivery_date: formatDateToYMD(new Date(Date.now() + (exam.isInternal ? 7 : 14) * 24 * 60 * 60 * 1000)),
          priority: 'normal',
          status: 'pending',
          clinical_indications: currentRecord.diagnosticPlan?.observations || '',
          special_instructions: exam.isInternal ? 'Examen interno' : 'Examen externo - paciente debe realizarlo en laboratorio',
          notes: exam.description || exam.name
        };

        const response = await laboratoryApi.createLaboratoryRequest(requestData);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (examError) {
        console.error('Error al crear solicitud de laboratorio:', examError);
        errorCount++;
      }
    }

    // Mensaje de resultado
    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} solicitud(es) de laboratorio enviada(s) exitosamente`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`${successCount} solicitud(es) enviada(s), ${errorCount} con error`);
    } else {
      toast.error('Error al enviar las solicitudes de laboratorio');
    }
  } catch (error) {
    console.error('Error al enviar solicitud de laboratorio:', error);
    toast.error('Error al enviar la solicitud');
  }
};

export const loadLaboratoryServices = async (): Promise<any[]> => {
  try {
    const response = await laboratoryApi.getLaboratoryServices();
    if (response.success && response.data) {
      // Filtrar solo servicios activos
      const filteredServices = response.data.filter((service: any) =>
        service.is_active !== false && service.status !== 'inactive'
      );
      return filteredServices;
    }
    return [];
  } catch (error) {
    console.error('Error al cargar servicios de laboratorio:', error);
    toast.error('Error al cargar servicios de laboratorio');
    return [];
  }
};

export const loadPanocefRequests = async (patientId: string | null): Promise<any[]> => {
  if (!patientId) {
    return [];
  }

  try {
    const patientIdNumeric = parseInt(patientId, 10);
    if (isNaN(patientIdNumeric)) {
      return [];
    }

    // Obtener solicitudes de laboratorio del paciente via API
    const response = await laboratoryApi.getLaboratoryRequests({
      patient_id: patientIdNumeric
    });

    if (response.success && response.data) {
      // Filtrar por cliente PANOCEF si aplica (adaptar segun logica de negocio)
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error al cargar solicitudes de laboratorio:', error);
    return [];
  }
};

export const loadPatientLabResults = async (selectedPatient: Patient | null): Promise<{
  internalResults: any[];
  externalResults: any[];
}> => {
  if (!selectedPatient) {
    return { internalResults: [], externalResults: [] };
  }

  try {
    const patientIdNumeric = parseInt(selectedPatient.id, 10);
    if (isNaN(patientIdNumeric)) {
      return { internalResults: [], externalResults: [] };
    }

    // Obtener todas las solicitudes de laboratorio del paciente via API
    const response = await laboratoryApi.getLaboratoryRequests({
      patient_id: patientIdNumeric,
      status: 'completed'
    });

    if (!response.success || !response.data) {
      return { internalResults: [], externalResults: [] };
    }

    const patientLabRequests = response.data;

    // Separar resultados internos y externos basados en special_instructions
    const internalRequests = patientLabRequests.filter((req: any) =>
      req.special_instructions?.includes('interno') || !req.special_instructions?.includes('externo')
    );
    const externalRequests = patientLabRequests.filter((req: any) =>
      req.special_instructions?.includes('externo')
    );

    // Helper para formatear fecha
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'Sin fecha';
      try {
        return new Date(dateStr).toLocaleDateString('es-ES');
      } catch {
        return dateStr;
      }
    };

    // Formatear resultados internos
    const internalResults = internalRequests.map((request: any) => ({
      id: request.request_id,
      nombre: request.service_name || request.notes || 'Estudio Radiologico',
      fecha: formatDate(request.actual_delivery_date || request.request_date),
      tipo: 'Imagen',
      archivo: request.results_file_url || 'resultado.pdf',
      estado: request.status === 'completed' ? 'Disponible' : request.status,
      categoria: request.service_category || 'Radiologia',
      request: request
    }));

    // Formatear resultados externos
    const externalResults = externalRequests.map((request: any) => ({
      id: request.request_id,
      nombre: request.service_name || request.notes || 'Examen Externo',
      fecha: formatDate(request.actual_delivery_date || request.request_date),
      tipo: 'Analisis',
      archivo: request.results_file_url || 'resultado.pdf',
      estado: request.status === 'completed' ? 'Disponible' : request.status,
      categoria: 'Externo',
      request: request
    }));

    return { internalResults, externalResults };
  } catch (error) {
    console.error('Error al cargar resultados de laboratorio:', error);
    return { internalResults: [], externalResults: [] };
  }
};

/**
 * Cargar solicitudes de radiografia del paciente o de una consulta especifica
 * Usa la API real del backend en lugar de IndexedDB
 */
export const loadPatientRadiographyRequests = async (
  patientId?: string | number | null,
  consultationId?: string | number | null
): Promise<any[]> => {
  try {
    // Construir filtros basados en los parametros
    const filters: any = {};

    if (patientId) {
      filters.patient_id = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    }

    if (consultationId) {
      filters.consultation_id = typeof consultationId === 'string' ? parseInt(consultationId, 10) : consultationId;
    }

    // Si no hay filtros validos, retornar vacio
    if (!filters.patient_id && !filters.consultation_id) {
      return [];
    }

    // Llamar a la API real del backend
    const response = await radiographyApi.getRadiographyRequests(filters);

    if (response.success && response.data) {
      // Cargar los resultados para cada solicitud completada
      const requestsWithResults = await Promise.all(
        response.data.map(async (request: any) => {
          const requestId = request.radiography_request_id || request.request_id;

          // Si la solicitud esta completada, cargar sus resultados
          if (request.request_status === 'completed' || request.request_status === 'delivered') {
            try {
              const resultsResponse = await radiographyApi.getResults(requestId);
              if (resultsResponse.success && resultsResponse.data) {
                return {
                  ...request,
                  results: resultsResponse.data.results || [],
                  resultsCounts: resultsResponse.data.counts || {}
                };
              }
            } catch (err) {
              console.error(`Error al cargar resultados para solicitud ${requestId}:`, err);
            }
          }

          return { ...request, results: [], resultsCounts: {} };
        })
      );

      return requestsWithResults;
    }

    return [];
  } catch (error) {
    console.error('Error al cargar solicitudes de radiografia:', error);
    return [];
  }
};

// ==================== PLAN DE TRATAMIENTO (Paso 8) ====================

interface SaveTreatmentPlanParams {
  consultationId: number;
  currentRecord: any;
  treatmentObservations?: string;
  user: any;
}

export interface SaveTreatmentPlanResult {
  success: boolean;
  wasUpdated?: boolean;
  planId?: number;
}

/**
 * Guarda el plan de tratamiento de una consulta (Paso 8)
 * Incluye tratamientos aplicados, servicios adicionales y configuracion de precios
 */
export const saveConsultationTreatmentPlan = async (
  params: SaveTreatmentPlanParams
): Promise<SaveTreatmentPlanResult> => {
  const { consultationId, currentRecord, treatmentObservations, user } = params;

  if (!consultationId) {
    toast.error('Error: No hay consulta activa para guardar el plan de tratamiento');
    return { success: false };
  }

  try {
    // Calcular totales
    const definitiveConditionsTotal = calculateDefinitiveConditionsTotal(currentRecord);
    const treatmentsTotal = calculateTreatmentsTotal(currentRecord);
    const additionalServicesTotal = calculateAdditionalServicesTotal(currentRecord);
    const grandTotal = definitiveConditionsTotal + treatmentsTotal + additionalServicesTotal;

    // Preparar datos para la API
    const treatmentPlanData: ConsultationTreatmentPlanData = {
      planName: `Plan de Tratamiento - ${new Date().toLocaleDateString('es-ES')}`,
      definitiveConditionsTotal,
      treatmentsTotal,
      additionalServicesTotal,
      grandTotal,
      hasInitialPayment: currentRecord.treatmentPlanHasInitial !== false,
      initialPayment: parseFloat(currentRecord.treatmentPlanInitialPayment) || 0,
      monthlyPayment: parseFloat(currentRecord.treatmentPlanMonthlyPayment) || 0,
      observations: treatmentObservations || currentRecord.treatmentObservations || '',
      appliedTreatments: (currentRecord.appliedTreatments || []).map((treatment: any) => ({
        treatmentId: treatment.treatmentId,
        treatmentName: treatment.treatmentName,
        totalAmount: treatment.totalAmount || 0,
        conditions: (treatment.conditions || []).map((cond: any) => ({
          id: cond.id,
          label: cond.label,
          price: cond.price || 0,
          quantity: cond.quantity || 1,
          definitiveConditionId: cond.definitiveConditionId || cond.definitive_condition_id || null
        }))
      })),
      selectedAdditionalServices: (currentRecord.selectedAdditionalServices || []).map((service: any) => ({
        id: service.id,
        type: service.type,
        name: service.name,
        modality: service.modality || null,
        description: service.description || null,
        originalFields: service.originalFields || { montoTotal: 0, inicial: 0, mensual: 0 },
        editedFields: service.editedFields || { montoTotal: 0, inicial: 0, mensual: 0 }
      }))
    };

    // Llamar a la API para guardar
    const response = await consultationsApi.upsertConsultationTreatmentPlan(
      consultationId,
      treatmentPlanData
    );

    if (response.success && response.data) {
      return {
        success: true,
        wasUpdated: response.wasUpdated,
        planId: response.data.consultation_treatment_plan_id
      };
    }

    return { success: false };
  } catch (error: any) {
    console.error('Error al guardar plan de tratamiento:', error);
    const errorMessage = error?.response?.data?.error || error?.message || 'Error desconocido';
    toast.error(`Error al guardar plan de tratamiento: ${errorMessage}`);
    return { success: false };
  }
};

/**
 * Carga el plan de tratamiento de una consulta
 */
export const loadConsultationTreatmentPlan = async (consultationId: number): Promise<any | null> => {
  if (!consultationId) {
    return null;
  }

  try {
    const response = await consultationsApi.getConsultationTreatmentPlan(consultationId);

    if (response.success && response.data) {
      // Mapear datos de la API al formato del frontend
      const plan = response.data;

      return {
        consultationTreatmentPlanId: plan.consultation_treatment_plan_id,
        planName: plan.plan_name,
        definitiveConditionsTotal: plan.definitive_diagnosis_total,
        treatmentsTotal: plan.treatments_total,
        additionalServicesTotal: plan.additional_services_total,
        grandTotal: plan.grand_total,
        treatmentPlanHasInitial: plan.has_initial_payment,
        treatmentPlanInitialPayment: String(plan.initial_payment || ''),
        treatmentPlanMonthlyPayment: String(plan.monthly_payment || ''),
        treatmentObservations: plan.observations || '',
        appliedTreatments: (plan.treatments || []).map((treatment: any) => ({
          id: `treatment-${treatment.consultation_treatment_item_id}`,
          treatmentId: String(treatment.treatment_id || ''),
          treatmentName: treatment.treatment_name,
          totalAmount: Number(treatment.total_amount) || 0,
          conditions: (treatment.conditions || []).map((cond: any) => ({
            id: `cond-${cond.condition_id}`,
            label: cond.label,
            price: Number(cond.price) || 0,
            quantity: cond.quantity || 1,
            definitiveConditionId: cond.definitive_condition_id || null,
            // Datos enriquecidos del diagnostico definitivo
            toothNumber: cond.tooth_number || null,
            selectedProcedureId: cond.selected_procedure_id || null,
            procedurePrice: cond.procedure_price || null,
            selectedProcedureName: cond.selected_procedure_name || null
          }))
        })),
        selectedAdditionalServices: (plan.additionalServices || []).map((service: any) => {
          // Reconstruir el ID basado en el tipo
          let serviceId = service.id;
          if (!serviceId) {
            if (service.orthodontic_plan_id) {
              serviceId = `ortho-${service.orthodontic_plan_id}`;
            } else if (service.implant_plan_id) {
              serviceId = `implant-${service.implant_plan_id}`;
            } else if (service.prosthesis_item_id) {
              serviceId = `prosthesis-${service.prosthesis_item_id}`;
            }
          }

          return {
            id: serviceId,
            type: service.service_type || service.type,
            name: service.service_name || service.name,
            modality: service.modality || null,
            description: service.description || null,
            originalFields: {
              montoTotal: Number(service.original_monto_total) || 0,
              inicial: Number(service.original_inicial) || 0,
              mensual: Number(service.original_mensual) || 0
            },
            editedFields: {
              montoTotal: Number(service.edited_monto_total) || 0,
              inicial: Number(service.edited_inicial) || 0,
              mensual: Number(service.edited_mensual) || 0
            }
          };
        })
      };
    }

    return null;
  } catch (error) {
    // Solo loguear si es un error real, no si simplemente no existe el plan
    if (error instanceof Error && !error.message.includes('No se encontro')) {
      console.error('Error al cargar plan de tratamiento:', error);
    }
    return null;
  }
};

// ==================== HELPERS PARA CALCULOS ====================

/**
 * Calcula el total del diagnostico definitivo
 */
const calculateDefinitiveConditionsTotal = (currentRecord: any): number => {
  const definitiveConditions = currentRecord.definitiveConditions || [];

  if (definitiveConditions.length === 0) {
    return 0;
  }

  return definitiveConditions.reduce((total: number, cond: any) => {
    // Priorizar procedure_price (precio del procedimiento asignado en Paso 6)
    // Si no hay procedimiento asignado, usar el precio base de la condición
    const price = Number(cond.procedure_price) ||
                  Number(cond.definitive?.procedure_price) ||
                  Number(cond.definitive?.price) ||
                  Number(cond.price) || 0;
    return total + price;
  }, 0);
};

/**
 * Calcula el total de tratamientos aplicados
 */
const calculateTreatmentsTotal = (currentRecord: any): number => {
  const appliedTreatments = currentRecord.appliedTreatments || [];

  if (appliedTreatments.length === 0) {
    return 0;
  }

  return appliedTreatments.reduce((total: number, treatment: any) => {
    return total + (Number(treatment.totalAmount) || 0);
  }, 0);
};

/**
 * Calcula el total de servicios adicionales
 */
const calculateAdditionalServicesTotal = (currentRecord: any): number => {
  const selectedServices = currentRecord.selectedAdditionalServices || [];

  if (selectedServices.length === 0) {
    return 0;
  }

  return selectedServices.reduce((total: number, service: any) => {
    const montoTotal = service.editedFields?.montoTotal || 0;
    return total + montoTotal;
  }, 0);
};
