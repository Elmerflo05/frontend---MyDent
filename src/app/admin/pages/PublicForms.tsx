import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Eye,
  Download,
  Printer,
  Search,
  X,
  Save,
  User,
  Calendar,
  FileSignature,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ConsentFormFields } from '@/components/consent';
import { useAuthStore } from '@/store/authStore';
import { ConsentDocumentService } from '@/services/consent';
import { type ConsentTemplate, type SignedConsent } from '@/services/api/consentsApiService';
import {
  useConsentForm,
  useSignedConsents,
  useConsentActions,
  useConsentTemplates
} from '@/components/PublicForms/hooks';
import AdditionalServicesContracts from '@/app/admin/components/AdditionalServicesContracts';
import PlanContracts from '@/app/admin/components/PlanContracts';
import CompanyContracts from '@/app/admin/components/CompanyContracts';

const PublicForms = () => {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'patient';

  // Estado para el tab principal (sección)
  const [mainSection, setMainSection] = useState<'consentimientos' | 'contratos-servicios' | 'contratos-planes' | 'contratos-empresas'>('consentimientos');

  // Vista simplificada para pacientes - Solo muestra sus consentimientos firmados
  // Sin contenedor externo porque PatientLayout ya lo proporciona
  if (isPatient) {
    return (
      <>
        {/* Header para pacientes */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mis Consentimientos
              </h1>
              <p className="text-gray-600">
                Visualiza y descarga tus consentimientos informados firmados
              </p>
            </div>
          </div>
        </div>

        {/* Contenido directo - Solo consentimientos firmados */}
        <ConsentimientosInformadosPatient />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Formularios Públicos
              </h1>
              <p className="text-gray-600">
                Gestiona consentimientos informados y todos los tipos de contratos
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Principales */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => setMainSection('consentimientos')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                mainSection === 'consentimientos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden md:inline">Consentimientos</span>
              <span className="md:hidden">Consentimientos</span>
            </button>
            <button
              onClick={() => setMainSection('contratos-servicios')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                mainSection === 'contratos-servicios'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileSignature className="w-5 h-5" />
              <span className="hidden md:inline">Contratos Servicios</span>
              <span className="md:hidden text-xs">Servicios</span>
            </button>
            <button
              onClick={() => setMainSection('contratos-planes')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                mainSection === 'contratos-planes'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden md:inline">Contratos Planes</span>
              <span className="md:hidden text-xs">Planes</span>
            </button>
            <button
              onClick={() => setMainSection('contratos-empresas')}
              className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                mainSection === 'contratos-empresas'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileSignature className="w-5 h-5" />
              <span className="hidden md:inline">Contratos Empresas</span>
              <span className="md:hidden text-xs">Empresas</span>
            </button>
          </div>
        </div>

        {/* Contenido según sección */}
        {mainSection === 'consentimientos' ? (
          <ConsentimientosInformados />
        ) : mainSection === 'contratos-servicios' ? (
          <AdditionalServicesContracts />
        ) : mainSection === 'contratos-planes' ? (
          <PlanContracts />
        ) : (
          <CompanyContracts />
        )}
      </div>
    </div>
  );
};

const ConsentimientosInformados = () => {
  const { user } = useAuthStore();

  // Estados locales de UI
  const [selectedConsentimiento, setSelectedConsentimiento] = useState<ConsentTemplate | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedSignedConsent, setSelectedSignedConsent] = useState<SignedConsent | null>(null);
  const [showSignedViewer, setShowSignedViewer] = useState(false);

  // Ref para el contenido editable del consentimiento
  const contentRef = useRef<HTMLDivElement>(null);

  // Estado para tabs - Pacientes inician en firmados, otros en plantillas
  const isPatient = user?.role === 'patient';
  const [activeTab, setActiveTab] = useState<'plantillas' | 'firmados'>(isPatient ? 'firmados' : 'plantillas');

  // Custom hooks - Ahora usa API en lugar de hardcode
  const {
    templates: consentimientosFiltrados,
    categorias,
    selectedCategoria,
    setSelectedCategoria,
    loading: loadingTemplates
  } = useConsentTemplates();

  const {
    formData,
    setFormData,
    resetForm
  } = useConsentForm();

  const {
    consents: signedConsents,
    loading: loadingConsents,
    searchTerm,
    setSearchTerm,
    reload: reloadSignedConsents
  } = useSignedConsents(user);

  const {
    isSaving,
    saveConsent,
    downloadConsent,
    printConsent,
    printConsentTemplate
  } = useConsentActions();

  // Manejar visualización de plantilla
  const handleViewConsentimiento = (consentimiento: ConsentTemplate) => {
    setSelectedConsentimiento(consentimiento);
    setShowViewer(true);
  };

  // Establecer contenido inicial cuando se abre el visor
  useEffect(() => {
    if (showViewer && selectedConsentimiento && contentRef.current) {
      const processed = ConsentDocumentService.processConsentContent(
        selectedConsentimiento.contenido,
        formData
      );
      contentRef.current.innerHTML = processed;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showViewer, selectedConsentimiento]);

  // Actualizar el contenido del documento con los datos actuales del formulario
  const handleRefreshContent = () => {
    if (selectedConsentimiento && contentRef.current) {
      const processed = ConsentDocumentService.processConsentContent(
        selectedConsentimiento.contenido,
        formData
      );
      contentRef.current.innerHTML = processed;
    }
  };

  // Imprimir el contenido editado del documento
  const handlePrintEdited = () => {
    if (!selectedConsentimiento || !contentRef.current) return;
    const editedHTML = contentRef.current.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\bon\w+\s*=\s*'[^']*'/gi, '');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedConsentimiento.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .content { margin-top: 20px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${selectedConsentimiento.nombre}</h1>
          <div class="content">${editedHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // Manejar guardado de consentimiento
  const handleGuardarConsentimiento = async () => {
    if (!user?.id) return;

    const success = await saveConsent(
      formData,
      selectedConsentimiento,
      user.id,
      async () => {
        // Callback de éxito
        await reloadSignedConsents();
        setActiveTab('firmados');
        setShowViewer(false);
        resetForm();
      },
      contentRef.current?.innerHTML // Contenido editado manualmente
    );

    if (!success) {
    }
  };

  // Manejar visualización de consentimiento firmado
  const handleViewSignedConsent = (consent: SignedConsent) => {
    setSelectedSignedConsent(consent);
    setShowSignedViewer(true);
  };

  // Formatear fecha sin desfase de timezone
  const formatDate = (dateString: string | Date) => {
    // Si es un string en formato YYYY-MM-DD, parsearlo directamente sin new Date()
    if (typeof dateString === 'string') {
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const dia = parseInt(match[3], 10);
        const mes = meses[parseInt(match[2], 10) - 1];
        const año = match[1];
        return `${dia} de ${mes} de ${año}`;
      }
    }
    // Fallback para objetos Date (no debería usarse)
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'plantillas'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Plantillas de Consentimientos
          </button>
          <button
            onClick={() => setActiveTab('firmados')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'firmados'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Consentimientos Firmados
          </button>
        </div>
      </div>

        {/* Contenido según tab activo */}
        {activeTab === 'plantillas' ? (
          <>
            {/* Filtros y búsqueda */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por categoría
                  </label>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'Todas las categorías' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Loading state */}
            {loadingTemplates ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <p className="mt-4 text-gray-600">Cargando plantillas...</p>
              </div>
            ) : consentimientosFiltrados.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay plantillas disponibles</p>
              </div>
            ) : (
              /* Grid de consentimientos */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consentimientosFiltrados.map((consentimiento) => (
                  <motion.div
                    key={consentimiento.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {consentimiento.nombre}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {consentimiento.categoria}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        Última actualización:{' '}
                        {formatDate(consentimiento.ultimaActualizacion)}
                      </p>

                      <button
                        onClick={() => handleViewConsentimiento(consentimiento)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver y Firmar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Búsqueda de consentimientos firmados */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, doctor, DNI o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Lista de consentimientos firmados */}
            {loadingConsents ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Cargando consentimientos...</p>
              </div>
            ) : signedConsents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay consentimientos firmados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {signedConsents.map((consent, index) => (
                  <motion.div
                    key={consent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Consentimiento</p>
                        <p className="font-semibold text-gray-900">
                          {consent.consentimientoNombre}
                        </p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                          {consent.consentimientoCategoria}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          <User className="w-4 h-4 inline mr-1" />
                          Paciente
                        </p>
                        <p className="font-medium text-gray-900">
                          {consent.pacienteNombre}
                        </p>
                        <p className="text-sm text-gray-600">{consent.pacienteDni}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Doctor</p>
                        <p className="font-medium text-gray-900">
                          {consent.doctorNombre}
                        </p>
                        <p className="text-sm text-gray-600">COP: {consent.doctorCop}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Fecha
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(consent.fechaConsentimiento)}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewSignedConsent(consent)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => downloadConsent(consent)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                      <button
                        onClick={() => printConsent(consent)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

      {/* Modal para ver y firmar consentimiento */}
      {showViewer && selectedConsentimiento && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedConsentimiento.nombre}</h2>
                <p className="text-blue-100">Consentimiento Informado</p>
              </div>
              <button
                onClick={() => setShowViewer(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Formulario de datos */}
              <ConsentFormFields data={formData} onChange={setFormData} />

              {/* Documento del consentimiento - Editable */}
              <div className="mt-6 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documento del Consentimiento
                  </h3>
                  <button
                    type="button"
                    onClick={handleRefreshContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Volver a aplicar los datos del formulario al documento"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar con datos
                  </button>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Puede editar directamente el texto del documento. Use "Actualizar con datos" para re-aplicar los campos del formulario.
                </p>
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="prose max-w-none bg-white p-4 rounded-lg border-2 border-gray-300 focus:border-blue-400 outline-none min-h-[300px] cursor-text"
                />
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="bg-gray-50 p-6 flex flex-wrap gap-3">
              <button
                onClick={handleGuardarConsentimiento}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Consentimiento
                  </>
                )}
              </button>

              <button
                onClick={handlePrintEdited}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>

              <button
                onClick={() => setShowViewer(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal para ver consentimiento firmado */}
      {showSignedViewer && selectedSignedConsent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedSignedConsent.consentimientoNombre}
                </h2>
                <p className="text-green-100">Consentimiento Firmado</p>
              </div>
              <button
                onClick={() => setShowSignedViewer(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: selectedSignedConsent.documentoHTML
                }}
              />
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => downloadConsent(selectedSignedConsent)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={() => printConsent(selectedSignedConsent)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => setShowSignedViewer(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Componente simplificado para pacientes - Solo muestra consentimientos firmados
const ConsentimientosInformadosPatient = () => {
  const { user } = useAuthStore();
  const [selectedSignedConsent, setSelectedSignedConsent] = useState<SignedConsent | null>(null);
  const [showSignedViewer, setShowSignedViewer] = useState(false);

  const {
    consents: signedConsents,
    loading: loadingConsents,
    searchTerm,
    setSearchTerm
  } = useSignedConsents(user);

  const {
    downloadConsent,
    printConsent
  } = useConsentActions();

  const handleViewSignedConsent = (consent: SignedConsent) => {
    setSelectedSignedConsent(consent);
    setShowSignedViewer(true);
  };

  // Formatear fecha sin desfase de timezone
  const formatDate = (dateString: string | Date) => {
    // Si es un string en formato YYYY-MM-DD, parsearlo directamente sin new Date()
    if (typeof dateString === 'string') {
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const dia = parseInt(match[3], 10);
        const mes = meses[parseInt(match[2], 10) - 1];
        const año = match[1];
        return `${dia} de ${mes} de ${año}`;
      }
    }
    // Fallback para objetos Date (no debería usarse)
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, doctor o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de consentimientos */}
      {loadingConsents ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando tus consentimientos...</p>
        </div>
      ) : signedConsents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No tienes consentimientos firmados</p>
          <p className="text-sm text-gray-500 mt-2">
            Los consentimientos aparecerán aquí una vez que los firmes en la clínica
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signedConsents.map((consent, index) => (
            <motion.div
              key={consent.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Consentimiento</p>
                  <p className="font-semibold text-gray-900">{consent.consentimientoNombre}</p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                    {consent.consentimientoCategoria}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Doctor</p>
                  <p className="font-medium text-gray-900">{consent.doctorNombre}</p>
                  <p className="text-sm text-gray-600">COP: {consent.doctorCop}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de firma
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDate(consent.fechaConsentimiento)}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewSignedConsent(consent)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={() => downloadConsent(consent)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={() => printConsent(consent)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal para ver consentimiento firmado - Usa createPortal para cubrir toda la pantalla */}
      {showSignedViewer && selectedSignedConsent && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowSignedViewer(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedSignedConsent.consentimientoNombre}</h2>
                <p className="text-sm text-green-100">Consentimiento Firmado</p>
              </div>
              <button
                onClick={() => setShowSignedViewer(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div
                className="prose max-w-none bg-white p-6 rounded-lg border"
                dangerouslySetInnerHTML={{ __html: selectedSignedConsent.documentoHTML }}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t flex gap-3">
              <button
                onClick={() => setShowSignedViewer(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => printConsent(selectedSignedConsent)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => downloadConsent(selectedSignedConsent)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PublicForms;
