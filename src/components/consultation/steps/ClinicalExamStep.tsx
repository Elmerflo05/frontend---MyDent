/**
 * Step 1: Examen Clinico
 *
 * Componente para registrar el examen clinico completo del paciente.
 * Incluye:
 * - Motivo de consulta
 * - Antecedentes medicos (patologicos, enfermedades, operaciones, alergias)
 * - Historia estomatologica
 * - Funciones vitales (presion arterial, frecuencia cardiaca, respiratoria, peso, talla)
 * - Estado general
 * - Examen extraoral (con soporte para imagenes)
 * - Examen intraoral (con soporte para imagenes)
 */

import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Stethoscope,
  FileText,
  Activity,
  Heart,
  User,
  Search,
  Plus,
  X,
  AlertTriangle,
  Save,
  Upload,
  Trash2,
  Loader2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { StepHeader } from '@/components/consultation/shared';
import { toast } from 'sonner';
import { consultationsApi } from '@/services/api/consultationsApi';

interface ClinicalExamStepProps {
  // Estado del registro
  currentRecord: any;
  setCurrentRecord: (record: any) => void;

  // Estados locales para inputs de listas medicas
  newPathological: string;
  setNewPathological: (value: string) => void;
  newDisease: string;
  setNewDisease: (value: string) => void;
  newOperation: string;
  setNewOperation: (value: string) => void;
  newAllergy: string;
  setNewAllergy: (value: string) => void;

  // Handlers para listas medicas
  addToMedicalList: (
    listName: 'pathologicalHistory' | 'previousDiseases' | 'previousOperations' | 'allergiesList',
    value: string,
    setter: (value: string) => void
  ) => void;
  removeFromMedicalList: (
    listName: 'pathologicalHistory' | 'previousDiseases' | 'previousOperations' | 'allergiesList',
    value: string
  ) => void;

  // Handlers generales
  setUnsavedChanges: (val: boolean) => void;
  handleSaveProgress: () => Promise<void>;
  markStepCompleted: (step: number) => void;

  // Navegacion
  onBack: () => void;

  // Control de acceso
  readOnly?: boolean;
}

// Tipo para imagen pendiente (local, aún no subida al servidor)
interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

// Componente para mostrar y subir imagenes del examen clinico
interface ClinicalExamImagesProps {
  title: string;
  type: 'extraoral' | 'intraoral';
  images: string[];  // Imágenes ya subidas al servidor (rutas)
  pendingImages: PendingImage[];  // Imágenes pendientes (locales)
  consultationId?: number;
  onImagesChange: (images: string[]) => void;
  onPendingImagesChange: (files: PendingImage[]) => void;
  readOnly?: boolean;
}

// OPTIMIZACIÓN: Memoizar componente de imágenes para evitar re-renders
const ClinicalExamImages = memo(({
  title,
  type,
  images,
  pendingImages,
  consultationId,
  onImagesChange,
  onPendingImagesChange,
  readOnly = false
}: ClinicalExamImagesProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; isPending: boolean; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Construir lista combinada de imágenes para el lightbox
  useEffect(() => {
    const allImages: { url: string; isPending: boolean; name: string }[] = [];

    // Agregar imágenes subidas
    images.forEach((imagePath, index) => {
      allImages.push({
        url: getImageUrl(imagePath),
        isPending: false,
        name: `${type} ${index + 1}`
      });
    });

    // Agregar imágenes pendientes
    pendingImages.forEach((pending) => {
      allImages.push({
        url: pending.previewUrl,
        isPending: true,
        name: pending.file.name
      });
    });

    setLightboxImages(allImages);
  }, [images, pendingImages, type]);

  // Construir URL base para las imagenes del servidor
  const getImageUrl = (imagePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));
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
  }, [lightboxOpen, lightboxImages.length]);

  // Bloquear scroll del body cuando el lightbox está abierto
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    if (consultationId) {
      setIsUploading(true);
      try {
        let response;
        if (type === 'extraoral') {
          response = await consultationsApi.uploadExtraoralImages(consultationId, filesArray);
        } else {
          response = await consultationsApi.uploadIntraoralImages(consultationId, filesArray);
        }

        if (response.success) {
          const newImages = type === 'extraoral'
            ? (response.data as { extraoral_exam_images?: string[] }).extraoral_exam_images
            : (response.data as { intraoral_exam_images?: string[] }).intraoral_exam_images;
          onImagesChange(newImages || []);
          toast.success(`${filesArray.length} imagen(es) subida(s) exitosamente`);
        }
      } catch (error) {
        console.error('Error al subir imagenes:', error);
        toast.error('Error al subir las imagenes');
      } finally {
        setIsUploading(false);
      }
    } else {
      const newPendingImages: PendingImage[] = filesArray.map(file => ({
        id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      onPendingImagesChange([...pendingImages, ...newPendingImages]);
      toast.success(`${filesArray.length} imagen(es) agregada(s). Se subirán al guardar.`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (imagePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!consultationId) return;

    try {
      let response;
      if (type === 'extraoral') {
        response = await consultationsApi.deleteExtraoralImage(consultationId, imagePath);
      } else {
        response = await consultationsApi.deleteIntraoralImage(consultationId, imagePath);
      }

      if (response.success) {
        const updatedImages = images.filter(img => img !== imagePath);
        onImagesChange(updatedImages);
        toast.success('Imagen eliminada');
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast.error('Error al eliminar la imagen');
    }
  };

  const handleDeletePendingImage = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const imageToRemove = pendingImages.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    const updatedPending = pendingImages.filter(img => img.id !== imageId);
    onPendingImagesChange(updatedPending);
    toast.success('Imagen eliminada');
  };

  const totalImages = images.length + pendingImages.length;

  return (
    <>
      {/* Contenedor de imágenes */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${type === 'extraoral' ? 'bg-purple-100' : 'bg-orange-100'}`}>
              <Camera className={`w-4 h-4 ${type === 'extraoral' ? 'text-purple-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-gray-800">{title}</h5>
              <p className="text-xs text-gray-500">
                {totalImages > 0 ? `${totalImages} imagen(es)` : 'Sin imágenes'}
              </p>
            </div>
          </div>
          {!readOnly && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id={`upload-${type}`}
              />
              <label
                htmlFor={`upload-${type}`}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl cursor-pointer
                  shadow-sm transition-all duration-200
                  ${isUploading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : type === 'extraoral'
                      ? 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-md'
                      : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md'
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {totalImages > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {/* Imágenes subidas */}
            {images.map((imagePath, index) => (
              <div
                key={`uploaded-${index}`}
                className="relative group aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 hover:shadow-lg"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={getImageUrl(imagePath)}
                  alt={`${type} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {/* Overlay con zoom */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                {/* Botón eliminar */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteImage(imagePath, e)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {/* Imágenes pendientes */}
            {pendingImages.map((pending, index) => (
              <div
                key={pending.id}
                className="relative group aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 hover:border-amber-500 transition-all duration-200"
                onClick={() => openLightbox(images.length + index)}
              >
                <img
                  src={pending.previewUrl}
                  alt={pending.file.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {/* Badge pendiente */}
                <div className="absolute bottom-1 left-1 right-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-medium rounded-md">
                    <Loader2 className="w-2.5 h-2.5" />
                    Pendiente
                  </span>
                </div>
                {/* Overlay con zoom */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                {/* Botón eliminar */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePendingImage(pending.id, e)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed ${
            type === 'extraoral' ? 'border-purple-200 bg-purple-50/50' : 'border-orange-200 bg-orange-50/50'
          }`}>
            <Camera className={`w-10 h-10 mb-2 ${type === 'extraoral' ? 'text-purple-300' : 'text-orange-300'}`} />
            <p className="text-sm text-gray-500 text-center">
              No hay imágenes
            </p>
            {!readOnly && (
              <p className="text-xs text-gray-400 mt-1">
                Haga clic en "Subir" para agregar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal Lightbox - Renderizado en Portal para centrado perfecto */}
      {lightboxOpen && lightboxImages.length > 0 && createPortal(
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
          {/* Botón cerrar - Esquina superior derecha */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navegación izquierda */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 z-10 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Contenedor de imagen - centrado */}
          <div
            className="relative"
            style={{
              maxWidth: 'calc(100vw - 120px)',
              maxHeight: 'calc(100vh - 100px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightboxIndex]?.url}
              alt={lightboxImages[lightboxIndex]?.name}
              className="rounded-lg shadow-2xl"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 100px)',
                objectFit: 'contain',
                display: 'block'
              }}
            />

            {/* Info de la imagen - Parte inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lightboxImages[lightboxIndex]?.name}</span>
                  {lightboxImages[lightboxIndex]?.isPending && (
                    <span className="px-2 py-0.5 bg-amber-500 text-xs font-medium rounded">
                      Pendiente
                    </span>
                  )}
                </div>
                <span className="text-sm text-white/70">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navegación derecha */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 z-10 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnails - Parte inferior */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-2 bg-black/60 rounded-xl max-w-[90vw] overflow-x-auto">
              {lightboxImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === lightboxIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}); // Cierre de memo para ClinicalExamImages

/**
 * Componente del Step 1: Examen Clínico
 * OPTIMIZACIÓN: Envuelto en React.memo para evitar re-renders innecesarios
 */
const ClinicalExamStepComponent = ({
  currentRecord,
  setCurrentRecord,
  newPathological,
  setNewPathological,
  newDisease,
  setNewDisease,
  newOperation,
  setNewOperation,
  newAllergy,
  setNewAllergy,
  addToMedicalList,
  removeFromMedicalList,
  setUnsavedChanges,
  handleSaveProgress,
  markStepCompleted,
  onBack,
  readOnly = false
}: ClinicalExamStepProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <StepHeader
        icon={Stethoscope}
        title="Examen Clínico"
        description="Registro de funciones vitales y evaluación física"
        color="blue"
        className="mb-6"
      />

      <div className="space-y-8">
        {/* Motivo de Consulta */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Motivo de Consulta
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la Consulta *
            </label>
            <textarea
              value={currentRecord.consultationReason}
              onChange={(e) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, consultationReason: e.target.value }));
                setUnsavedChanges(true);
              }}
              placeholder="Describe el motivo por el cual el paciente acude a consulta..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Antecedentes Médicos */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-500" />
            Antecedentes Médicos
          </h4>

          {/* Antecedentes Patológicos */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Antecedentes Patológicos
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPathological}
                onChange={(e) => setNewPathological(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar antecedente patológico"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToMedicalList('pathologicalHistory', newPathological, setNewPathological))}
                disabled={readOnly}
              />
              <button
                type="button"
                onClick={() => addToMedicalList('pathologicalHistory', newPathological, setNewPathological)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={readOnly}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentRecord.pathologicalHistory.map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeFromMedicalList('pathologicalHistory', item)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Enfermedades Anteriores */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enfermedades Anteriores (TBC, Diabetes, Hipertensión, etc.)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDisease}
                onChange={(e) => setNewDisease(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar enfermedad anterior"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToMedicalList('previousDiseases', newDisease, setNewDisease))}
                disabled={readOnly}
              />
              <button
                type="button"
                onClick={() => addToMedicalList('previousDiseases', newDisease, setNewDisease)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={readOnly}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentRecord.previousDiseases.map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeFromMedicalList('previousDiseases', item)}
                    className="ml-2 text-red-600 hover:text-red-800"
                    disabled={readOnly}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Historial de Operaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historial de Operaciones
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newOperation}
                onChange={(e) => setNewOperation(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar operación anterior"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToMedicalList('previousOperations', newOperation, setNewOperation))}
                disabled={readOnly}
              />
              <button
                type="button"
                onClick={() => addToMedicalList('previousOperations', newOperation, setNewOperation)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={readOnly}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentRecord.previousOperations.map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeFromMedicalList('previousOperations', item)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    disabled={readOnly}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Alergias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Alergias
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar alergia"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToMedicalList('allergiesList', newAllergy, setNewAllergy))}
                disabled={readOnly}
              />
              <button
                type="button"
                onClick={() => addToMedicalList('allergiesList', newAllergy, setNewAllergy)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={readOnly}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentRecord.allergiesList.map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeFromMedicalList('allergiesList', item)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                    disabled={readOnly}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Historia Estomatológica */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Historia Estomatológica
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Historia Estomatológica Pasada
            </label>
            <textarea
              value={currentRecord.stomatologicalHistory}
              onChange={(e) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, stomatologicalHistory: e.target.value }));
                setUnsavedChanges(true);
              }}
              placeholder="Describe la historia dental y estomatológica del paciente..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Funciones Vitales */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Funciones Vitales
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presión Arterial (mmHg)
              </label>
              <input
                type="text"
                value={currentRecord.bloodPressure}
                onChange={(e) => {
                  setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, bloodPressure: e.target.value }));
                  setUnsavedChanges(true);
                }}
                placeholder="120/80"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia Cardíaca (ppm)
              </label>
              <input
                type="number"
                value={currentRecord.heartRate}
                onChange={(e) => {
                  setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, heartRate: e.target.value }));
                  setUnsavedChanges(true);
                }}
                placeholder="72"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia Respiratoria (rpm)
              </label>
              <input
                type="number"
                value={currentRecord.respiratoryRate}
                onChange={(e) => {
                  setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, respiratoryRate: e.target.value }));
                  setUnsavedChanges(true);
                }}
                placeholder="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={currentRecord.weight}
                onChange={(e) => {
                  setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, weight: e.target.value }));
                  setUnsavedChanges(true);
                }}
                placeholder="70.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talla (cm)
              </label>
              <input
                type="number"
                value={currentRecord.height}
                onChange={(e) => {
                  setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, height: e.target.value }));
                  setUnsavedChanges(true);
                }}
                placeholder="170"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>

        {/* Estado General */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-green-500" />
            Estado General
          </h4>
          <textarea
            value={currentRecord.generalCondition}
            onChange={(e) => {
              setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, generalCondition: e.target.value }));
              setUnsavedChanges(true);
            }}
            placeholder="Describa el estado general del paciente..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={readOnly}
          />
        </div>

        {/* Sección de Exámenes Clínicos con Imágenes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Examen Extraoral */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Examen Clínico Extraoral</h4>
                <p className="text-xs text-gray-500">Evaluación externa de cabeza y cuello</p>
              </div>
            </div>
            <textarea
              value={currentRecord.extraoralExam}
              onChange={(e) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, extraoralExam: e.target.value }));
                setUnsavedChanges(true);
              }}
              placeholder="Describa los hallazgos del examen extraoral: simetría facial, ATM, ganglios, piel, labios..."
              className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/80 placeholder:text-gray-400"
              rows={4}
              disabled={readOnly}
            />

            {/* Sección de imágenes extraorales */}
            <ClinicalExamImages
              title="Fotografías extraorales"
              type="extraoral"
              images={currentRecord.extraoralExamImages || []}
              pendingImages={currentRecord.pendingExtraoralImages || []}
              consultationId={currentRecord.consultationId}
              onImagesChange={(images) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, extraoralExamImages: images }));
                setUnsavedChanges(true);
              }}
              onPendingImagesChange={(pending) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, pendingExtraoralImages: pending }));
                setUnsavedChanges(true);
              }}
              readOnly={readOnly}
            />
          </div>

          {/* Examen Intraoral */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-orange-100 rounded-xl">
                <Stethoscope className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Examen Clínico Intraoral</h4>
                <p className="text-xs text-gray-500">Evaluación de tejidos blandos y duros</p>
              </div>
            </div>
            <textarea
              value={currentRecord.intraoralExam}
              onChange={(e) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, intraoralExam: e.target.value }));
                setUnsavedChanges(true);
              }}
              placeholder="Describa los hallazgos del examen intraoral: mucosa, encías, lengua, piso de boca, paladar..."
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white/80 placeholder:text-gray-400"
              rows={4}
              disabled={readOnly}
            />

            {/* Sección de imágenes intraorales */}
            <ClinicalExamImages
              title="Fotografías intraorales"
              type="intraoral"
              images={currentRecord.intraoralExamImages || []}
              pendingImages={currentRecord.pendingIntraoralImages || []}
              consultationId={currentRecord.consultationId}
              onImagesChange={(images) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, intraoralExamImages: images }));
                setUnsavedChanges(true);
              }}
              onPendingImagesChange={(pending) => {
                setCurrentRecord((prev: typeof currentRecord) => ({ ...prev, pendingIntraoralImages: pending }));
                setUnsavedChanges(true);
              }}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Volver
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSaveProgress}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={() => markStepCompleted(1)}
            className="px-6 py-2 bg-clinic-primary text-white rounded-lg hover:bg-clinic-dark transition-colors"
          >
            Continuar a Odontograma
          </button>
        </div>
      </div>
    </div>
  );
};

// OPTIMIZACIÓN: Exportar versión memoizada
export const ClinicalExamStep = memo(ClinicalExamStepComponent);
