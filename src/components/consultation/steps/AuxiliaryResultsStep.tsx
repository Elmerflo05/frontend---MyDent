/**
 * Step 6: Resultados de Examenes Auxiliares
 *
 * Componente para revisar resultados de radiografia subidos por el tecnico de imagenes.
 * Esta seccion es OPCIONAL y no bloquea el avance del tratamiento.
 *
 * Incluye:
 * - Resultados de Radiografia (subidos por tecnico de imagenes desde solicitudes internas)
 * - Archivos de Centros Externos (subidos por el doctor)
 * - Observaciones del doctor sobre los resultados
 *
 * INTEGRACION: Usa la API real auxiliaryExamResultsApi para persistir archivos y observaciones.
 */

import { Image, User, AlertCircle, ChevronLeft, ChevronRight, Save, Upload, X, FileText, Eye, AlertTriangle, Clock, ZoomIn, Loader2 } from 'lucide-react';
import { formatTimestampToLima } from '@/utils/dateUtils';
import { StepHeader, SectionCard, EmptyState } from '@/components/consultation/shared';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { radiographyApi, type RadiographyRequestData, type RadiographyResult } from '@/services/api/radiographyApi';
import {
  auxiliaryExamResultsApi,
  type ExternalFile,
  type AuxiliaryExamResultData,
  type PatientExternalExam
} from '@/services/api/auxiliaryExamResultsApi';

// Interface para archivo del lightbox (imagenes y PDFs)
interface LightboxFile {
  url: string;
  name: string;
  type: 'image' | 'pdf';
}

// Interface para archivo local (antes de subir o con URL de objeto)
interface LocalUploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  file?: File; // Archivo original para subir
  isUploading?: boolean;
  uploadError?: string;
  path?: string; // Ruta en servidor (despues de subir)
}

interface AuxiliaryResultsStepProps {
  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Handlers
  setUnsavedChanges: (val: boolean) => void;

  // Control de acceso
  readOnly?: boolean;

  // Navegacion
  onBack: () => void;
  onSave: () => void;
  onContinue: () => void;
}

/**
 * Componente del Step 6: Resultados Auxiliares
 */
const AuxiliaryResultsStepComponent = ({
  currentRecord,
  setCurrentRecord,
  setUnsavedChanges,
  readOnly = false,
  onBack,
  onSave,
  onContinue
}: AuxiliaryResultsStepProps) => {
  // Estado para archivos externos subidos por el medico
  const [externalFiles, setExternalFiles] = useState<LocalUploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para carga de datos existentes
  const [loadingExistingData, setLoadingExistingData] = useState(true);
  const [auxiliaryExamResultId, setAuxiliaryExamResultId] = useState<number | null>(null);

  // Estado para solicitud de radiografia y sus resultados
  const [radiographyRequest, setRadiographyRequest] = useState<RadiographyRequestData | null>(null);
  const [radiographyResults, setRadiographyResults] = useState<RadiographyResult[]>([]);
  const [loadingRequest, setLoadingRequest] = useState(true);

  // Estado para examenes externos subidos por el paciente desde su portal
  const [patientExternalExams, setPatientExternalExams] = useState<PatientExternalExam[]>([]);
  const [loadingPatientExams, setLoadingPatientExams] = useState(true);

  // Estado para el lightbox de visualizacion de archivos (imagenes y PDFs)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxFiles, setLightboxFiles] = useState<LightboxFile[]>([]);

  // Obtener IDs necesarios
  const consultationId = currentRecord?.consultationId || currentRecord?.consultation_id;
  const patientId = currentRecord?.patientId || currentRecord?.patient_id;
  const dentistId = currentRecord?.dentistId || currentRecord?.dentist_id;

  // Cargar datos existentes de examenes auxiliares al montar
  useEffect(() => {
    const loadExistingData = async () => {
      if (!consultationId) {
        setLoadingExistingData(false);
        return;
      }

      try {
        const response = await auxiliaryExamResultsApi.getByConsultationId(parseInt(consultationId));

        if (response.success && response.data) {
          const data = response.data as AuxiliaryExamResultData;
          setAuxiliaryExamResultId(data.auxiliary_exam_result_id);

          // Cargar observaciones del doctor
          if (data.doctor_observations) {
            setCurrentRecord((prev: any) => ({
              ...prev,
              auxiliaryResults: data.doctor_observations
            }));
          }

          // Cargar archivos externos
          if (data.external_files && Array.isArray(data.external_files)) {
            const serverFiles: LocalUploadedFile[] = data.external_files.map((file: ExternalFile) => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
              url: auxiliaryExamResultsApi.getFileUrl(file.path),
              uploadedAt: file.uploadedAt,
              path: file.path
            }));
            setExternalFiles(serverFiles);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de examenes auxiliares:', error);
      } finally {
        setLoadingExistingData(false);
      }
    };

    loadExistingData();
  }, [consultationId]);

  // Cargar examenes externos subidos por el paciente desde su portal
  useEffect(() => {
    const loadPatientExternalExams = async () => {
      if (!patientId) {
        setLoadingPatientExams(false);
        return;
      }

      try {
        const response = await auxiliaryExamResultsApi.getPatientExternalExams(parseInt(patientId));

        if (response.success && response.data) {
          setPatientExternalExams(response.data);
        }
      } catch (error) {
        console.error('Error al cargar examenes externos del paciente:', error);
      } finally {
        setLoadingPatientExams(false);
      }
    };

    loadPatientExternalExams();
  }, [patientId]);

  // Construir lista de archivos para el lightbox cuando cambien los resultados
  useEffect(() => {
    const allFiles: LightboxFile[] = [];

    // Agregar imagenes de radiografia
    radiographyResults
      .filter(r => r.result_type === 'image')
      .forEach((result, index) => {
        if (result.file_path) {
          allFiles.push({
            url: `${(import.meta.env.VITE_API_URL || 'http://localhost:4015/api').replace('/api', '')}${result.file_path}`,
            name: result.original_name || `Radiografia ${index + 1}`,
            type: 'image'
          });
        }
      });

    // Agregar documentos PDF de radiografia
    radiographyResults
      .filter(r => r.result_type === 'document')
      .forEach((result, index) => {
        if (result.file_path) {
          allFiles.push({
            url: `${(import.meta.env.VITE_API_URL || 'http://localhost:4015/api').replace('/api', '')}${result.file_path}`,
            name: result.original_name || `Documento ${index + 1}`,
            type: 'pdf'
          });
        }
      });

    // Agregar archivos externos (imagenes y PDFs)
    externalFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        allFiles.push({
          url: file.url,
          name: file.name,
          type: 'image'
        });
      } else if (file.type === 'application/pdf') {
        allFiles.push({
          url: file.url,
          name: file.name,
          type: 'pdf'
        });
      }
    });

    setLightboxFiles(allFiles);
  }, [radiographyResults, externalFiles]);

  // Funciones del lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? lightboxFiles.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === lightboxFiles.length - 1 ? 0 : prev + 1));
  };

  // Manejar teclas en el lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxFiles.length]);

  // Bloquear scroll del body cuando el lightbox esta abierto
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  // Buscar solicitud de radiografia al montar el componente
  useEffect(() => {
    const loadRadiographyRequest = async () => {
      if (!consultationId) {
        setLoadingRequest(false);
        return;
      }

      try {
        const response = await radiographyApi.getRadiographyRequests({
          consultation_id: parseInt(consultationId),
          limit: 1
        });

        if (response.success && response.data && response.data.length > 0) {
          const request = response.data[0];
          setRadiographyRequest(request);

          const requestId = request.radiography_request_id || request.request_id;
          if (requestId) {
            try {
              const resultsResponse = await radiographyApi.getResults(requestId);
              if (resultsResponse.success && resultsResponse.data?.results) {
                setRadiographyResults(resultsResponse.data.results);
              }
            } catch (resultsError) {
              console.error('Error al cargar resultados:', resultsError);
            }
          }
        } else {
          setRadiographyRequest(null);
        }
      } catch (error) {
        console.error('Error al cargar solicitud de radiografia:', error);
        setRadiographyRequest(null);
      } finally {
        setLoadingRequest(false);
      }
    };

    loadRadiographyRequest();
  }, [consultationId]);

  // Tipos de archivo permitidos
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Estado local para observaciones - permite escritura fluida
  const [localObservations, setLocalObservations] = useState(
    currentRecord.auxiliaryResults || ''
  );

  // Sincronizar estado local cuando cambie el valor del padre (ej: al cargar datos)
  useEffect(() => {
    const parentValue = currentRecord.auxiliaryResults || '';
    if (parentValue !== localObservations && parentValue !== '') {
      setLocalObservations(parentValue);
    }
  }, [currentRecord.auxiliaryResults]);

  // Debounce para sincronizar con el estado padre
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentValue = currentRecord.auxiliaryResults || '';
      if (localObservations !== currentValue) {
        setCurrentRecord((prev: typeof currentRecord) => ({
          ...prev,
          auxiliaryResults: localObservations
        }));
        setUnsavedChanges(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localObservations]);

  // Asegurar que existe el registro antes de subir archivos
  const ensureRecordExists = useCallback(async (): Promise<boolean> => {
    if (auxiliaryExamResultId) return true;

    if (!consultationId || !patientId || !dentistId) {
      console.error('Faltan IDs necesarios para crear registro');
      return false;
    }

    try {
      const response = await auxiliaryExamResultsApi.upsertResult({
        consultation_id: parseInt(consultationId),
        patient_id: parseInt(patientId),
        dentist_id: parseInt(dentistId),
        doctor_observations: currentRecord.auxiliaryResults || ''
      });

      if (response.success && response.data) {
        setAuxiliaryExamResultId(response.data.auxiliary_exam_result_id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al crear registro:', error);
      return false;
    }
  }, [auxiliaryExamResultId, consultationId, patientId, dentistId, currentRecord.auxiliaryResults]);

  // Handler para procesar archivos - SUBIDA REAL AL SERVIDOR
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Primero asegurar que existe el registro
    const recordExists = await ensureRecordExists();
    if (!recordExists) {
      alert('Error: No se pudo crear el registro. Verifique que la consulta tenga paciente y dentista asignados.');
      return;
    }

    for (const file of Array.from(files)) {
      // Validar tipo de archivo
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Archivo "${file.name}" no permitido. Solo se permiten imagenes (JPG, PNG, GIF) y PDF.`);
        continue;
      }

      // Validar tamano
      if (file.size > MAX_FILE_SIZE) {
        alert(`Archivo "${file.name}" es demasiado grande. Tamano maximo: 10MB.`);
        continue;
      }

      // Crear entrada temporal con estado de carga
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempFile: LocalUploadedFile = {
        id: tempId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        file: file,
        isUploading: true
      };

      setExternalFiles(prev => [...prev, tempFile]);

      // Subir archivo al servidor
      try {
        const response = await auxiliaryExamResultsApi.uploadExternalFile(
          parseInt(consultationId),
          file,
          patientId ? parseInt(patientId) : undefined,
          dentistId ? parseInt(dentistId) : undefined
        );

        if (response.success && response.data?.file) {
          // Reemplazar archivo temporal con el del servidor
          setExternalFiles(prev => prev.map(f =>
            f.id === tempId
              ? {
                  ...f,
                  id: response.data!.file.id,
                  url: auxiliaryExamResultsApi.getFileUrl(response.data!.file.path),
                  path: response.data!.file.path,
                  isUploading: false
                }
              : f
          ));
        } else {
          throw new Error('Error en respuesta del servidor');
        }
      } catch (error: any) {
        console.error('Error al subir archivo:', error);
        // Marcar archivo con error
        setExternalFiles(prev => prev.map(f =>
          f.id === tempId
            ? { ...f, isUploading: false, uploadError: error.message || 'Error al subir' }
            : f
        ));
      }
    }

    setUnsavedChanges(true);
  };

  // Handler para eliminar archivo - ELIMINACION REAL DEL SERVIDOR
  const handleRemoveFile = async (fileId: string) => {
    const file = externalFiles.find(f => f.id === fileId);
    if (!file) return;

    // Si tiene path, eliminar del servidor
    if (file.path && consultationId) {
      try {
        await auxiliaryExamResultsApi.deleteExternalFile(parseInt(consultationId), fileId);
      } catch (error) {
        console.error('Error al eliminar archivo del servidor:', error);
        alert('Error al eliminar el archivo del servidor');
        return;
      }
    }

    // Revocar URL de objeto si existe
    if (file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }

    // Eliminar de la lista local
    setExternalFiles(prev => prev.filter(f => f.id !== fileId));
    setUnsavedChanges(true);
  };

  // Handlers para drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Handler para abrir selector de archivos
  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  // Handler para visualizar archivo
  const handleViewFile = (file: LocalUploadedFile) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const fileIndex = lightboxFiles.findIndex(f => f.url === file.url);
      if (fileIndex !== -1) {
        openLightbox(fileIndex);
      }
    } else {
      window.open(file.url, '_blank');
    }
  };

  // Formatear tamano de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handler para guardar observaciones
  const handleSaveObservations = async () => {
    if (!consultationId) return;

    try {
      // Asegurar que existe el registro
      await ensureRecordExists();

      // Actualizar observaciones
      await auxiliaryExamResultsApi.updateObservations(
        parseInt(consultationId),
        currentRecord.auxiliaryResults || ''
      );
    } catch (error) {
      console.error('Error al guardar observaciones:', error);
    }
  };

  // Guardar observaciones al llamar onSave
  const handleSave = async () => {
    await handleSaveObservations();
    onSave();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <StepHeader
        icon={Image}
        title="Resultados de Examenes Auxiliares"
        description="Revise los resultados de radiografia subidos por el tecnico de imagenes (OPCIONAL)"
        color="cyan"
        className="mb-6"
      />

      {/* Loading inicial */}
      {loadingExistingData && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <span className="ml-2 text-gray-600">Cargando datos...</span>
        </div>
      )}

      {!loadingExistingData && (
        <>
          {/* Alertas de Solicitud de Radiografia */}
          {!loadingRequest && radiographyRequest && (
            <div className="mb-6">
              {radiographyRequest.request_status === 'no_show' && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-900 mb-1">Inasistencia a Examenes</h4>
                      <p className="text-sm text-red-700">
                        El paciente no asistio a realizarse los examenes solicitados en el Plan de Diagnostico.
                        Han transcurrido mas de 30 dias desde la solicitud.
                      </p>
                      <p className="text-xs text-red-600 mt-2">
                        Solicitud creada: {radiographyRequest.request_date ? new Date(radiographyRequest.request_date).toLocaleDateString('es-PE') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(radiographyRequest.request_status === 'pending' || radiographyRequest.request_status === 'in_progress') && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-yellow-900 mb-1">Esperando Resultados</h4>
                      <p className="text-sm text-yellow-700">
                        Los examenes fueron solicitados y estan pendientes de procesamiento.
                        Los resultados apareceran aqui una vez que el tecnico de imagenes los suba al sistema.
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        Solicitud enviada: {radiographyRequest.request_date ? new Date(radiographyRequest.request_date).toLocaleDateString('es-PE') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(radiographyRequest.request_status === 'completed' || radiographyRequest.request_status === 'delivered') && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-900 mb-1">Resultados Disponibles</h4>
                      <p className="text-sm text-green-700">
                        Los examenes han sido completados. {radiographyResults.length > 0 ? `Se encontraron ${radiographyResults.length} resultado(s).` : 'Los resultados estan disponibles abajo.'}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Completado: {radiographyRequest.actual_exam_date ? new Date(radiographyRequest.actual_exam_date).toLocaleDateString('es-PE') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-8">
            {/* Seccion de Resultados de Radiografia - Cargados del Backend */}
            <SectionCard
              icon={Image}
              title="Resultados de Radiografia"
              subtitle="Imagenes y documentos subidos por el tecnico de imagenes"
              colorScheme="cyan"
              gradientTo="teal"
              animationDelay={0.05}
            >
              {radiographyResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Imagenes */}
                  {radiographyResults.filter(r => r.result_type === 'image').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Imagenes ({radiographyResults.filter(r => r.result_type === 'image').length})
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {radiographyResults
                          .filter(r => r.result_type === 'image')
                          .map((result, idx) => (
                            <div
                              key={result.result_id || idx}
                              className="border border-cyan-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                            >
                              <div
                                className="aspect-square bg-gray-100 flex items-center justify-center relative group cursor-pointer"
                                onClick={() => openLightbox(idx)}
                              >
                                {result.file_path ? (
                                  <>
                                    <img
                                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4015/api').replace('/api', '')}${result.file_path}`}
                                      alt={result.original_name || 'Imagen de radiografia'}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="w-8 h-8 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <Image className="w-12 h-12 text-gray-300" />
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-xs text-gray-700 truncate" title={result.original_name || ''}>
                                  {result.original_name || 'Imagen'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {result.uploaded_at ? new Date(result.uploaded_at).toLocaleDateString('es-PE') : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Documentos */}
                  {radiographyResults.filter(r => r.result_type === 'document').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documentos ({radiographyResults.filter(r => r.result_type === 'document').length})
                      </h5>
                      <div className="space-y-2">
                        {radiographyResults
                          .filter(r => r.result_type === 'document')
                          .map((result, idx) => (
                            <div
                              key={result.result_id || idx}
                              className="flex items-center gap-3 p-3 bg-white border border-cyan-200 rounded-lg hover:border-cyan-400 transition-colors"
                            >
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {result.original_name || 'Documento'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {result.uploaded_at ? new Date(result.uploaded_at).toLocaleDateString('es-PE') : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const imageCount = radiographyResults.filter(r => r.result_type === 'image').length;
                                  openLightbox(imageCount + idx);
                                }}
                                className="flex items-center gap-1 bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Enlaces externos */}
                  {radiographyResults.filter(r => r.result_type === 'external_link').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Enlaces Externos ({radiographyResults.filter(r => r.result_type === 'external_link').length})
                      </h5>
                      <div className="space-y-2">
                        {radiographyResults
                          .filter(r => r.result_type === 'external_link')
                          .map((result, idx) => (
                            <div
                              key={result.result_id || idx}
                              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-blue-600 truncate">
                                  {result.external_url || 'Enlace externo'}
                                </p>
                              </div>
                              <a
                                href={result.external_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Abrir
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Image}
                  message="Los resultados de radiografia apareceran aqui una vez que el tecnico de imagenes los suba al sistema"
                />
              )}
            </SectionCard>

            {/* Seccion de Examenes Externos Subidos por el Paciente */}
            <SectionCard
              icon={FileText}
              title="Examenes Subidos por el Paciente"
              subtitle="Documentos e imagenes subidos por el paciente desde su portal"
              colorScheme="blue"
              gradientTo="indigo"
              animationDelay={0.1}
            >
              {loadingPatientExams ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Cargando examenes del paciente...</span>
                </div>
              ) : patientExternalExams.length > 0 ? (
                <div className="space-y-4">
                  {/* Archivos (imagenes y documentos) */}
                  {patientExternalExams.filter(e => e.exam_type === 'file').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Archivos ({patientExternalExams.filter(e => e.exam_type === 'file').length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {patientExternalExams
                          .filter(e => e.exam_type === 'file')
                          .map((exam) => {
                            const isImage = exam.mime_type?.startsWith('image/');
                            const isPdf = exam.mime_type === 'application/pdf';
                            const fileUrl = exam.file_name
                              ? auxiliaryExamResultsApi.getPatientExternalExamFileUrl(exam.file_name)
                              : '';

                            return (
                              <div
                                key={exam.external_exam_id}
                                className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Thumbnail o icono */}
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-50 flex-shrink-0 flex items-center justify-center">
                                    {isImage && fileUrl ? (
                                      <img
                                        src={fileUrl}
                                        alt={exam.original_name || 'Imagen'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : isPdf ? (
                                      <FileText className="w-8 h-8 text-red-600" />
                                    ) : (
                                      <FileText className="w-8 h-8 text-blue-600" />
                                    )}
                                  </div>

                                  {/* Info del archivo */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate" title={exam.original_name || ''}>
                                      {exam.original_name || 'Archivo'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {exam.file_size ? `${(exam.file_size / 1024).toFixed(1)} KB` : ''}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      Subido: {formatTimestampToLima(exam.date_time_registration, 'date')}
                                    </p>
                                  </div>

                                  {/* Boton ver */}
                                  {fileUrl && (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex-shrink-0"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Ver
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Enlaces externos */}
                  {patientExternalExams.filter(e => e.exam_type === 'link').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Enlaces Externos ({patientExternalExams.filter(e => e.exam_type === 'link').length})
                      </h5>
                      <div className="space-y-2">
                        {patientExternalExams
                          .filter(e => e.exam_type === 'link')
                          .map((exam) => (
                            <div
                              key={exam.external_exam_id}
                              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-blue-600 truncate" title={exam.external_url || ''}>
                                  {exam.external_url || 'Enlace externo'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Agregado: {formatTimestampToLima(exam.date_time_registration, 'date')}
                                </p>
                              </div>
                              {exam.external_url && (
                                <a
                                  href={exam.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  Abrir
                                </a>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  message="El paciente aun no ha subido examenes externos desde su portal"
                />
              )}

              {/* Nota informativa */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-blue-700">Nota:</span> Estos son examenes que el paciente ha subido desde su portal personal. Pueden incluir resultados de laboratorios externos, radiografias de otros centros, etc.
                </p>
              </div>
            </SectionCard>

            {/* Seccion para Subir Archivos de Centros Externos */}
            <SectionCard
              icon={Upload}
              title="Subir Archivos de Centros Externos"
              subtitle="Suba imagenes o documentos de estudios realizados en otros centros medicos"
              colorScheme="purple"
              gradientTo="indigo"
              animationDelay={0.15}
            >
              {!readOnly && (
                <>
                  {/* Input oculto para seleccionar archivos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />

                  {/* Zona de Drag & Drop */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleSelectFiles}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-300 mb-6
                      ${isDragging
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        ${isDragging ? 'bg-purple-100' : 'bg-gray-100'}
                      `}>
                        <Upload className={`w-8 h-8 ${isDragging ? 'text-purple-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-1">
                          {isDragging ? 'Suelte los archivos aqui' : 'Arrastre archivos aqui o haga clic para seleccionar'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Formatos permitidos: JPG, PNG, GIF, PDF (Max. 10MB por archivo)
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Lista de archivos subidos */}
              {externalFiles.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-700 mb-3">
                    Archivos Subidos ({externalFiles.length})
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {externalFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          file.uploadError ? 'border-red-300' : 'border-purple-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Thumbnail o icono */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-purple-50 flex-shrink-0 flex items-center justify-center relative">
                            {file.isUploading && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                              </div>
                            )}
                            {file.type.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-8 h-8 text-purple-600" />
                            )}
                          </div>

                          {/* Informacion del archivo */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatFileSize(file.size)}
                            </p>
                            {file.uploadError && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {file.uploadError}
                              </p>
                            )}
                            {file.isUploading && (
                              <p className="text-xs text-purple-600 mt-1">
                                Subiendo...
                              </p>
                            )}
                            {!file.isUploading && !file.uploadError && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(file.uploadedAt).toLocaleString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>

                          {/* Botones de accion */}
                          <div className="flex gap-2 flex-shrink-0">
                            {!file.isUploading && !file.uploadError && (
                              <button
                                onClick={() => handleViewFile(file)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Ver archivo"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {!readOnly && (
                              <button
                                onClick={() => handleRemoveFile(file.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar archivo"
                                disabled={file.isUploading}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {readOnly
                    ? 'No se han subido archivos de centros externos'
                    : 'Aun no hay archivos subidos. Arrastre o seleccione archivos para comenzar.'
                  }
                </div>
              )}

              {/* Nota informativa */}
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-purple-700">Nota:</span> Los archivos subidos aqui se guardaran en el historial del paciente y estaran disponibles para futuras consultas.
                </p>
              </div>
            </SectionCard>

            {/* Observaciones del Doctor */}
            <SectionCard
              icon={User}
              title="Observaciones del Doctor sobre los Resultados"
              colorScheme="amber"
              gradientTo="orange"
              animationDelay={0.2}
            >
              <textarea
                value={localObservations}
                onChange={(e) => setLocalObservations(e.target.value)}
                placeholder="Ingrese sus observaciones y analisis de los resultados de examenes auxiliares..."
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all placeholder-gray-400 resize-none"
                disabled={readOnly}
              />
            </SectionCard>

            {/* Mensaje informativo */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-1">Informacion</h5>
                  <p className="text-sm text-gray-600">
                    Los resultados de examenes auxiliares apareceran aqui una vez que sean subidos por el personal correspondiente.
                    Esta seccion es opcional y no bloquea el avance del tratamiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de Navegacion */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 active:scale-98 transition-all font-medium shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                Volver a Plan Diagnostico
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 active:scale-98 text-white rounded-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={onContinue}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 active:scale-98 transition-all font-medium shadow-lg shadow-teal-200"
                >
                  Continuar a Diagnostico Definitivo
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Lightbox - Renderizado en Portal para centrado perfecto */}
      {lightboxOpen && lightboxFiles.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/95"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeLightbox}
        >
          {/* Boton cerrar - Esquina superior derecha */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navegacion izquierda */}
          {lightboxFiles.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 z-10 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Contenedor de contenido - centrado */}
          <div
            className="relative"
            style={{
              width: lightboxFiles[lightboxIndex]?.type === 'pdf' ? 'calc(100vw - 80px)' : 'auto',
              maxWidth: 'calc(100vw - 80px)',
              height: lightboxFiles[lightboxIndex]?.type === 'pdf' ? 'calc(100vh - 80px)' : 'auto',
              maxHeight: 'calc(100vh - 80px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mostrar imagen o PDF segun el tipo */}
            {lightboxFiles[lightboxIndex]?.type === 'image' ? (
              <img
                src={lightboxFiles[lightboxIndex]?.url}
                alt={lightboxFiles[lightboxIndex]?.name}
                className="rounded-lg shadow-2xl"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 100px)',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <iframe
                src={lightboxFiles[lightboxIndex]?.url}
                title={lightboxFiles[lightboxIndex]?.name}
                className="w-full h-full rounded-lg shadow-2xl bg-white"
                style={{
                  minHeight: 'calc(100vh - 100px)'
                }}
              />
            )}

            {/* Info del archivo - Parte inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  {lightboxFiles[lightboxIndex]?.type === 'pdf' && (
                    <FileText className="w-4 h-4 text-red-400" />
                  )}
                  {lightboxFiles[lightboxIndex]?.type === 'image' && (
                    <Image className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-sm font-medium">{lightboxFiles[lightboxIndex]?.name}</span>
                </div>
                <span className="text-sm text-white/70">
                  {lightboxIndex + 1} / {lightboxFiles.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navegacion derecha */}
          {lightboxFiles.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 z-10 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnails - Parte inferior */}
          {lightboxFiles.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 bg-black/60 rounded-xl max-w-[90vw] overflow-x-auto">
              {lightboxFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === lightboxIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {file.type === 'image' ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-red-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// Exportar el componente memoizado
export const AuxiliaryResultsStep = memo(AuxiliaryResultsStepComponent);
