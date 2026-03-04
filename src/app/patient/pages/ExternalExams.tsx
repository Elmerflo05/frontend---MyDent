import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  TestTube,
  Upload,
  Link2,
  FileText,
  Image,
  Trash2,
  ExternalLink,
  Loader2,
  Plus,
  X,
  File,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { patientPortalApi, PatientExternalExam } from '@/services/api/patientPortalApi';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

const ExternalExams = () => {
  const [exams, setExams] = useState<PatientExternalExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [selectedExam, setSelectedExam] = useState<PatientExternalExam | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setIsLoading(true);
      const response = await patientPortalApi.getMyExternalExams();
      if (response.success) {
        setExams(response.data);
      }
    } catch (error: any) {
      console.error('Error cargando examenes:', error);
      toast.error(error.message || 'Error al cargar examenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      try {
        await patientPortalApi.uploadExternalExamFile(file);
        successCount++;
      } catch (error: any) {
        console.error('Error subiendo archivo:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} archivo(s) subido(s) correctamente`);
    }
    if (errorCount > 0) {
      toast.error(`Error al subir ${errorCount} archivo(s)`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(false);
    loadExams();
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) {
      toast.error('Ingrese un URL valido');
      return;
    }

    // Validar URL
    try {
      new URL(linkUrl);
    } catch {
      toast.error('El URL ingresado no es valido');
      return;
    }

    setIsAddingLink(true);
    try {
      await patientPortalApi.addExternalExamLink(linkUrl);
      toast.success('Link agregado correctamente');
      setLinkUrl('');
      setShowLinkModal(false);
      loadExams();
    } catch (error: any) {
      console.error('Error agregando link:', error);
      toast.error(error.message || 'Error al agregar link');
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (!confirm('¿Esta seguro de eliminar este examen?')) return;

    try {
      await patientPortalApi.deleteExternalExam(examId);
      toast.success('Examen eliminado correctamente');
      loadExams();
    } catch (error: any) {
      console.error('Error eliminando examen:', error);
      toast.error(error.message || 'Error al eliminar examen');
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="w-8 h-8 text-gray-400" />;
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilePreviewUrl = (exam: PatientExternalExam) => {
    if (exam.file_name) {
      return `${API_BASE_URL}/uploads/patient_external_exams/${exam.file_name}`;
    }
    return null;
  };

  const isImageFile = (mimeType: string | null) => {
    return mimeType?.startsWith('image/') || false;
  };

  const isPdfFile = (mimeType: string | null) => {
    return mimeType === 'application/pdf';
  };

  const handleViewExam = (exam: PatientExternalExam) => {
    if (exam.exam_type === 'link') {
      window.open(exam.external_url || '', '_blank');
    } else {
      setSelectedExam(exam);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-gray-600">Cargando examenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <TestTube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Examenes Externos</h1>
                <p className="text-gray-500">Sube tus exámenes realizados en otros laboratorios</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md shadow-teal-200 disabled:opacity-50 font-medium"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Subir Archivo
              </button>
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-200 font-medium"
              >
                <Link2 className="w-4 h-4" />
                Agregar Link
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Total Exámenes</p>
                  <p className="text-2xl font-bold text-orange-900">{exams.length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Archivos</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {exams.filter(e => e.exam_type === 'file').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-teal-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Links</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {exams.filter(e => e.exam_type === 'link').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Mis Exámenes
              </h2>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                {exams.length}
              </span>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TestTube className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes exámenes externos</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Puedes subir archivos (PDF, imágenes) o agregar links de exámenes realizados en otros laboratorios para tenerlos siempre disponibles.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md shadow-teal-200 font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Subir Archivo
                </button>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-200 font-medium"
                >
                  <Link2 className="w-4 h-4" />
                  Agregar Link
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
              {exams.map((exam) => (
                <motion.div
                  key={exam.external_exam_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all group"
                >
                  {/* Preview Area */}
                  <div
                    className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
                    onClick={() => handleViewExam(exam)}
                  >
                    {exam.exam_type === 'file' && isImageFile(exam.mime_type) ? (
                      <img
                        src={getFilePreviewUrl(exam) || ''}
                        alt={exam.original_name || 'Examen'}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : exam.exam_type === 'file' && isPdfFile(exam.mime_type) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-3">
                          <FileText className="w-8 h-8 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Documento PDF</span>
                      </div>
                    ) : exam.exam_type === 'link' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                          <Link2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Link Externo</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-3">
                          <File className="w-8 h-8 text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Archivo</span>
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        exam.exam_type === 'file'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {exam.exam_type === 'file' ? 'Archivo' : 'Link'}
                      </span>
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-6">
                      <div className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Eye className="w-5 h-5" />
                        <span className="font-medium">Ver examen</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 truncate mb-1" title={exam.exam_type === 'file' ? (exam.original_name || exam.file_name || '') : (exam.external_url || '')}>
                      {exam.exam_type === 'file'
                        ? (exam.original_name || exam.file_name)
                        : exam.external_url}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      {exam.exam_type === 'file' && (
                        <>
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                            {formatFileSize(exam.file_size)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatDate(exam.date_time_registration)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewExam(exam)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 rounded-xl hover:from-teal-100 hover:to-teal-200 transition-all text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      {exam.exam_type === 'file' && (
                        <a
                          href={getFilePreviewUrl(exam) || '#'}
                          download={exam.original_name || exam.file_name}
                          className="flex items-center justify-center p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteExam(exam.external_exam_id)}
                        className="flex items-center justify-center p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal para agregar link - Usando Portal para evitar problemas con transform */}
      {showLinkModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Link2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Agregar Link</h2>
                    <p className="text-sm text-gray-500">Agrega un enlace a tu examen externo</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkUrl('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL del examen
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mi-examen"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Ingresa el link donde se encuentra tu examen (Google Drive, Dropbox, etc.)
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkUrl('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={isAddingLink || !linkUrl.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md shadow-blue-200"
                >
                  {isAddingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Agregar Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Modal visor de archivos - Split View - Usando Portal */}
      {selectedExam && selectedExam.exam_type === 'file' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex z-50">
          {/* Panel izquierdo - Preview */}
          <div className="flex-1 flex flex-col bg-gray-900">
            {/* Header del preview */}
            <div className="p-4 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  {isPdfFile(selectedExam.mime_type) ? (
                    <FileText className="w-5 h-5 text-red-400" />
                  ) : isImageFile(selectedExam.mime_type) ? (
                    <Image className="w-5 h-5 text-blue-400" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white truncate max-w-md">
                    {selectedExam.original_name || selectedExam.file_name}
                  </p>
                  <p className="text-sm text-gray-400">{formatFileSize(selectedExam.file_size)}</p>
                </div>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              {isImageFile(selectedExam.mime_type) ? (
                <img
                  src={getFilePreviewUrl(selectedExam) || ''}
                  alt={selectedExam.original_name || 'Examen'}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : isPdfFile(selectedExam.mime_type) ? (
                <iframe
                  src={getFilePreviewUrl(selectedExam) || ''}
                  className="w-full h-full bg-white rounded-lg shadow-2xl"
                  title={selectedExam.original_name || 'PDF'}
                />
              ) : (
                <div className="bg-gray-800 rounded-2xl p-12 text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <File className="w-12 h-12 text-gray-500" />
                  </div>
                  <p className="text-white font-medium mb-2">
                    {selectedExam.original_name || selectedExam.file_name}
                  </p>
                  <p className="text-gray-400 mb-6">
                    Este tipo de archivo no se puede previsualizar
                  </p>
                  <a
                    href={getFilePreviewUrl(selectedExam) || '#'}
                    download={selectedExam.original_name || selectedExam.file_name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Información */}
          <div className="w-96 bg-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="font-bold text-gray-900">Información</h2>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Detalles del archivo */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre del archivo</p>
                  <p className="font-semibold text-gray-900 break-words">
                    {selectedExam.original_name || selectedExam.file_name}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo de archivo</p>
                  <div className="flex items-center gap-2">
                    {isPdfFile(selectedExam.mime_type) ? (
                      <>
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="font-semibold text-gray-900">Documento PDF</span>
                      </>
                    ) : isImageFile(selectedExam.mime_type) ? (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Image className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-gray-900">Imagen</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <File className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-semibold text-gray-900">Archivo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tamaño</p>
                  <p className="font-semibold text-gray-900">{formatFileSize(selectedExam.file_size)}</p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de subida</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedExam.date_time_registration)}</p>
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <a
                href={getFilePreviewUrl(selectedExam) || '#'}
                download={selectedExam.original_name || selectedExam.file_name}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md shadow-teal-200"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
              <a
                href={getFilePreviewUrl(selectedExam) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExternalExams;
