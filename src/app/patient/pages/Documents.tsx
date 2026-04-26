import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Download, ExternalLink, FolderOpen, Image as ImageIcon, File } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { patientPortalApi, type PatientDocument } from '@/services/api/patientPortalApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4015';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [user]);

  useEffect(() => {
    const patientId = user?.profile?.patientId;
    if (!patientId) return;

    const socket: Socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('join-patient', patientId);
    });

    const onChanged = () => loadDocuments();
    socket.on('document-deleted', onChanged);
    socket.on('document-updated', onChanged);

    return () => {
      socket.off('document-deleted', onChanged);
      socket.off('document-updated', onChanged);
      socket.disconnect();
    };
  }, [user?.profile?.patientId]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadDocuments();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.profile?.patientId]);

  const loadDocuments = async () => {
    if (!user || user.role !== 'patient') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await patientPortalApi.getMyDocuments({ limit: 200 });
      setDocuments(response.data || []);
    } catch (error: any) {
      console.error('Error al cargar documentos:', error);
      toast.error(error.message || 'Error al cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = documents.filter((doc) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      doc.document_name.toLowerCase().includes(q) ||
      (doc.description || '').toLowerCase().includes(q) ||
      (doc.document_type || '').toLowerCase().includes(q)
    );
  });

  const buildFileUrl = (filePath: string | null) => {
    if (!filePath) return '';
    return filePath.startsWith('http') ? filePath : `${API_BASE_URL}${filePath}`;
  };

  const getDocumentIcon = (mimeType: string | null, filePath: string | null) => {
    const path = (filePath || '').toLowerCase();
    if ((mimeType && mimeType.startsWith('image/')) || /\.(png|jpe?g|gif|webp|bmp)$/.test(path)) {
      return ImageIcon;
    }
    if (mimeType === 'application/pdf' || path.endsWith('.pdf')) {
      return FileText;
    }
    return File;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-100 rounded-lg">
            <FolderOpen className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Documentos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Documentos clínicos y administrativos asociados a tu historia clínica.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700 font-medium">Total</p>
                <p className="text-2xl font-bold text-teal-900">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-teal-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, tipo o descripción..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {documents.length === 0 ? 'No hay documentos' : 'Sin coincidencias'}
          </h3>
          <p className="text-gray-600">
            {documents.length === 0
              ? 'Aún no tienes documentos registrados.'
              : 'No se encontraron documentos con ese criterio de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((doc) => {
            const Icon = getDocumentIcon(doc.mime_type, doc.file_path);
            const fileUrl = buildFileUrl(doc.file_path);
            return (
              <motion.div
                key={doc.patient_document_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 break-words">
                        {doc.document_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {doc.document_type && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            {doc.document_type}
                          </span>
                        )}
                        {doc.file_size != null && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {formatSize(doc.file_size)}
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-1">{doc.description}</p>
                      )}
                      {doc.upload_date && (
                        <p className="text-sm text-gray-500">
                          Subido el {format(new Date(doc.upload_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {fileUrl && (
                      <>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver
                        </a>
                        <a
                          href={fileUrl}
                          download={doc.document_name}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Documents;
