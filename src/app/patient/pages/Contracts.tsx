import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, Download, Eye, AlertCircle, Building, Paperclip, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { contractTemplatesApi, type PatientContract } from '@/services/api/contractTemplatesApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaz local para manejo de estado
interface ContractDisplay {
  id: number;
  patientId: number;
  patientName: string;
  branchName: string;
  contractNumber: string | null;
  contractType: string;
  contractDate: Date;
  startDate: Date;
  endDate: Date | null;
  amount: number | null;
  content: string | null;
  fileUrl: string | null;
  isSigned: boolean;
  signedDate: Date | null;
  signatureData: string | null;
  notes: string | null;
  assignedBy: string | null;
}

export const Contracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ContractDisplay | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending'>('all');

  useEffect(() => {
    loadContracts();
  }, [user]);

  const loadContracts = async () => {
    if (!user || user.role !== 'patient') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Usar el nuevo endpoint para obtener los contratos del paciente
      const { contracts: patientContracts } = await contractTemplatesApi.getMyContracts({
        limit: 100
      });

      // Mapear a estructura de display
      const mappedContracts: ContractDisplay[] = patientContracts.map(contract => ({
        id: contract.id,
        patientId: contract.patientId,
        patientName: contract.patientName,
        branchName: contract.branchName,
        contractNumber: contract.contractNumber,
        contractType: contract.contractType,
        contractDate: contract.contractDate,
        startDate: contract.startDate,
        endDate: contract.endDate,
        amount: contract.amount,
        content: contract.content,
        fileUrl: contract.fileUrl,
        isSigned: contract.isSigned,
        signedDate: contract.signedDate,
        signatureData: contract.signatureData,
        notes: contract.notes,
        assignedBy: contract.assignedBy
      }))
      .sort((a, b) => new Date(b.contractDate).getTime() - new Date(a.contractDate).getTime());

      setContracts(mappedContracts);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('Error al cargar los contratos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContract = (contract: ContractDisplay) => {
    setSelectedContract(contract);
    setShowViewModal(true);
  };

  // Generar PDF del contrato
  const handleDownloadContract = (contract: ContractDisplay) => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Helper para verificar si necesitamos nueva página
      const checkNewPage = (neededSpace: number = 20) => {
        if (yPosition + neededSpace > 270) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Header principal
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('CONTRATO DE SERVICIO', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Número: ${contract.contractNumber || 'N/A'}`, 105, 25, { align: 'center' });

      yPosition = 45;
      doc.setTextColor(0, 0, 0);

      // Información del contrato
      doc.setFillColor(239, 246, 255);
      doc.rect(10, yPosition, 190, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CONTRATO', 15, yPosition + 6);
      yPosition += 15;

      const contractInfo = [
        ['Tipo de Contrato:', contract.contractType.replace('_', ' ').toUpperCase()],
        ['Fecha de Contrato:', format(new Date(contract.contractDate), 'dd/MM/yyyy', { locale: es })],
        ['Fecha de Inicio:', format(new Date(contract.startDate), 'dd/MM/yyyy', { locale: es })],
        ['Fecha de Fin:', contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy', { locale: es }) : 'Indefinido'],
        ['Monto:', contract.amount ? `S/ ${contract.amount.toFixed(2)}` : 'No especificado'],
        ['Sede:', contract.branchName],
        ['Estado:', contract.isSigned ? 'Firmado' : 'Pendiente'],
        ['Asignado por:', contract.assignedBy || 'Sistema']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: contractInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 130 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Contenido del contrato
      if (contract.content) {
        checkNewPage(30);
        doc.setFillColor(239, 246, 255);
        doc.rect(10, yPosition, 190, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CONTENIDO DEL CONTRATO', 15, yPosition + 6);
        yPosition += 15;

        // Procesar el HTML del contenido
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contract.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(textContent, 180);

        for (const line of lines) {
          checkNewPage(6);
          doc.text(line, 15, yPosition);
          yPosition += 6;
        }
      }

      // Firma Digital
      if (contract.signatureData) {
        checkNewPage(60);
        yPosition += 10;
        doc.setFillColor(239, 246, 255);
        doc.rect(10, yPosition, 190, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('FIRMA DIGITAL', 15, yPosition + 6);
        yPosition += 15;

        // Agregar la imagen de la firma
        try {
          doc.addImage(contract.signatureData, 'PNG', 15, yPosition, 60, 30);
          yPosition += 35;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          if (contract.signedDate) {
            doc.text(`Fecha de firma: ${format(new Date(contract.signedDate), 'dd/MM/yyyy', { locale: es })}`, 15, yPosition);
          }
        } catch (imgError) {
          console.error('Error al agregar firma al PDF:', imgError);
        }
      }

      // Footer en todas las páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
        doc.text('Sistema de Gestión Odontológica - MYDENT', 105, 285, { align: 'center' });
      }

      // Guardar el PDF
      const fileName = `Contrato_${contract.contractNumber || contract.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      toast.error('Error al generar el PDF del contrato');
    }
  };

  const getStatusBadge = (isSigned: boolean) => {
    if (isSigned) {
      return {
        icon: CheckCircle,
        text: 'Firmado',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return {
      icon: Clock,
      text: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  };

  const getContractTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      ortodoncia: 'Ortodoncia',
      implantes: 'Implantes Dentales',
      rehabilitacion_oral: 'Rehabilitación Oral',
      plan_personal: 'Plan Personal',
      plan_familiar: 'Plan Familiar',
      tratamiento: 'Tratamiento',
      servicios: 'Servicios',
      otro: 'Otro'
    };
    return types[type?.toLowerCase() || 'otro'] || type || 'Otro';
  };

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'all') return true;
    if (filter === 'signed') return contract.isSigned;
    if (filter === 'pending') return !contract.isSigned;
    return true;
  });

  const signedCount = contracts.filter(c => c.isSigned).length;
  const pendingCount = contracts.filter(c => !c.isSigned).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
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
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Contratos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tus contratos y documentos del centro odontológico
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-700 font-medium">Total</p>
                <p className="text-2xl font-bold text-teal-900">{contracts.length}</p>
              </div>
              <FileText className="w-8 h-8 text-teal-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Firmados</p>
                <p className="text-2xl font-bold text-green-900">{signedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert for pending contracts */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-900">
              Tienes {pendingCount} contrato{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de firma
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Por favor, revisa y firma los contratos pendientes para continuar con tu tratamiento.
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('signed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'signed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Firmados ({signedCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
        </div>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No hay contratos' : filter === 'signed' ? 'No hay contratos firmados' : 'No hay contratos pendientes'}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Aún no tienes contratos asignados.'
              : filter === 'signed'
                ? 'Aún no tienes contratos firmados.'
                : 'No tienes contratos pendientes de firma.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map((contract) => {
            const statusBadge = getStatusBadge(contract.isSigned);
            const StatusIcon = statusBadge.icon;

            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {getContractTypeLabel(contract.contractType)}
                        {contract.contractNumber && (
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            ({contract.contractNumber})
                          </span>
                        )}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.text}
                        </span>
                        {contract.amount && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            S/ {contract.amount.toFixed(2)}
                          </span>
                        )}
                        {contract.fileUrl && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            <Paperclip className="w-3 h-3" />
                            Archivo adjunto
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Sede:</span> {contract.branchName}
                        </p>
                        <p>
                          <span className="font-medium">Fecha:</span>{' '}
                          {format(new Date(contract.contractDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                        {contract.isSigned && contract.signedDate && (
                          <p>
                            <span className="font-medium">Firmado:</span>{' '}
                            {format(new Date(contract.signedDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                        )}
                        {contract.assignedBy && (
                          <p>
                            <span className="font-medium">Asignado por:</span> {contract.assignedBy}
                          </p>
                        )}
                        {contract.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            Notas: {contract.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewContract(contract)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => handleDownloadContract(contract)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View Contract Modal */}
      {selectedContract && showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {getContractTypeLabel(selectedContract.contractType)}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {selectedContract.contractNumber || 'Contrato de servicio'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedContract(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Información del contrato */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 mb-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Información del Contrato</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tipo de Contrato</p>
                    <p className="font-semibold text-gray-900">{getContractTypeLabel(selectedContract.contractType)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de Contrato</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedContract.contractDate), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de Inicio</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedContract.startDate), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de Fin</p>
                    <p className="font-semibold text-gray-900">
                      {selectedContract.endDate
                        ? format(new Date(selectedContract.endDate), "dd/MM/yyyy", { locale: es })
                        : 'Indefinido'}
                    </p>
                  </div>
                  {selectedContract.amount && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto</p>
                      <p className="font-bold text-teal-600 text-lg">S/ {selectedContract.amount.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sede</p>
                    <p className="font-semibold text-blue-600">{selectedContract.branchName}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Estado</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedContract.isSigned
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedContract.isSigned ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {selectedContract.isSigned ? 'Firmado' : 'Pendiente'}
                    </span>
                  </div>
                  {selectedContract.assignedBy && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Asignado por</p>
                      <p className="font-semibold text-gray-900">{selectedContract.assignedBy}</p>
                    </div>
                  )}
                </div>
                {selectedContract.notes && (
                  <div className="mt-4 bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1">Notas</p>
                    <p className="text-gray-700 italic">{selectedContract.notes}</p>
                  </div>
                )}
              </div>

              {/* Contenido del contrato */}
              {selectedContract.content && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Contenido del Contrato</h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div
                      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-600"
                      dangerouslySetInnerHTML={{ __html: selectedContract.content }}
                    />
                  </div>
                </div>
              )}

              {/* Firma Digital */}
              {selectedContract.signatureData && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Firma Digital</h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center gap-6">
                      <div className="bg-white border-2 border-green-300 rounded-xl p-3 shadow-sm">
                        <img
                          src={selectedContract.signatureData}
                          alt="Firma digital"
                          className="max-h-24 w-auto"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="font-semibold text-green-800">Documento firmado digitalmente</p>
                        </div>
                        {selectedContract.signedDate && (
                          <p className="text-sm text-green-700">
                            Firmado el {format(new Date(selectedContract.signedDate), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Archivo Adjunto */}
              {selectedContract.fileUrl && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Archivo Adjunto</h3>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-purple-200">
                          {selectedContract.fileUrl.toLowerCase().endsWith('.pdf') ? (
                            <FileText className="w-7 h-7 text-red-500" />
                          ) : (
                            <Eye className="w-7 h-7 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Documento del contrato</p>
                          <p className="text-sm text-purple-600">
                            {selectedContract.fileUrl.toLowerCase().endsWith('.pdf') ? 'Archivo PDF' : 'Imagen adjunta'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:4015'}${selectedContract.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver Archivo
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
              <button
                onClick={() => handleDownloadContract(selectedContract)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md shadow-teal-200"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedContract(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-white transition-colors font-medium"
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

export default Contracts;
