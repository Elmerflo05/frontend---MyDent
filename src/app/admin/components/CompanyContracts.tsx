import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Search,
  X,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { mydentContractTemplate } from '@/data/companyContractTemplate';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CompanyContract {
  id: string;
  nombre: string;
  descripcion: string;
  nombreEmpresa: string;
  ruc: string;
  contenido: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyContracts = () => {
  const [contracts, setContracts] = useState<CompanyContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<CompanyContract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nombreEmpresa: '',
    ruc: '',
    contenido: '',
    activo: true
  });

  // Actualizar el contenido del editor solo cuando se abre el modal o cambia el contrato
  useEffect(() => {
    if (showModal && editorRef.current && formData.contenido) {
      editorRef.current.innerHTML = formData.contenido;
    }
  }, [showModal]);

  // Cargar contratos desde IndexedDB
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      // Inicializar con template (TODO: migrar a API cuando esté disponible)
      const templateContract = initializeTemplateContract();
      setContracts([templateContract]);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const initializeTemplateContract = (): CompanyContract => {
    return {
      id: `company_contract_template_${Date.now()}`,
      nombre: mydentContractTemplate.nombre,
      descripcion: mydentContractTemplate.descripcion,
      nombreEmpresa: mydentContractTemplate.nombreEmpresa,
      ruc: mydentContractTemplate.ruc,
      contenido: mydentContractTemplate.contenido,
      activo: mydentContractTemplate.activo,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  // Filtrar contratos por búsqueda
  const filteredContracts = contracts.filter(contract =>
    contract.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.ruc.includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      nombreEmpresa: '',
      ruc: '',
      contenido: '',
      activo: true
    });
    setSelectedContract(null);
    setIsEditing(false);
  };

  const handleOpenNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (contract: CompanyContract) => {
    setSelectedContract(contract);
    setFormData({
      nombre: contract.nombre,
      descripcion: contract.descripcion,
      nombreEmpresa: contract.nombreEmpresa,
      ruc: contract.ruc,
      contenido: contract.contenido,
      activo: contract.activo
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (contract: CompanyContract) => {
    setSelectedContract(contract);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.nombreEmpresa || !formData.ruc) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      const contractData: CompanyContract = {
        id: isEditing ? selectedContract!.id : `company_contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        nombreEmpresa: formData.nombreEmpresa,
        ruc: formData.ruc,
        contenido: formData.contenido,
        activo: formData.activo,
        createdAt: isEditing ? selectedContract!.createdAt : new Date(),
        updatedAt: new Date()
      };

      // Actualizar estado local (TODO: migrar a API cuando esté disponible)
      if (isEditing) {
        setContracts(prev => prev.map(c => c.id === contractData.id ? contractData : c));
        toast.success('Contrato actualizado');
      } else {
        setContracts(prev => [...prev, contractData]);
        toast.success('Contrato creado');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error al guardar el contrato:', error);
      toast.error('Error al guardar el contrato');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este contrato?')) {
      try {
        // Actualizar estado local (TODO: migrar a API cuando esté disponible)
        setContracts(prev => prev.filter(c => c.id !== id));
        toast.success('Contrato eliminado');
      } catch (error) {
        console.error('Error al eliminar el contrato:', error);
        toast.error('Error al eliminar el contrato');
      }
    }
  };

  const handleDownload = async (contract: CompanyContract) => {
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
      doc.setFillColor(30, 58, 138); // Blue
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(contract.nombre, 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 25, { align: 'center' });

      yPosition = 45;
      doc.setTextColor(0, 0, 0);

      // Información de la empresa
      if (contract.nombreEmpresa || contract.ruc) {
        doc.setFillColor(239, 246, 255);
        doc.rect(10, yPosition, 190, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DE LA EMPRESA', 15, yPosition + 6);
        yPosition += 15;

        const companyInfo = [];
        if (contract.nombreEmpresa) {
          companyInfo.push(['Empresa:', contract.nombreEmpresa]);
        }
        if (contract.ruc) {
          companyInfo.push(['RUC:', contract.ruc]);
        }
        if (contract.descripcion) {
          companyInfo.push(['Descripción:', contract.descripcion]);
        }

        if (companyInfo.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            head: [],
            body: companyInfo,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 40 },
              1: { cellWidth: 140 },
            },
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Parsear y renderizar el contenido HTML
      checkNewPage(30);
      doc.setFillColor(239, 246, 255);
      doc.rect(10, yPosition, 190, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTENIDO DEL CONTRATO', 15, yPosition + 6);
      yPosition += 15;

      // Procesar el HTML del contenido
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contract.contenido || '';

      // Función para renderizar texto plano
      const renderText = (text: string, isBold = false, fontSize = 10) => {
        if (!text || text.trim() === '') return;
        checkNewPage(10);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text.trim(), 180);
        doc.text(lines, 15, yPosition);
        yPosition += lines.length * (fontSize * 0.5) + 3;
      };

      // Extraer y renderizar el contenido
      const processNode = (node: Node) => {
        // Si es un nodo de texto, renderizarlo
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || '';
          if (text) {
            renderText(text);
          }
          return;
        }

        // Si no es un elemento, salir
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as HTMLElement;
        const tagName = element.tagName?.toLowerCase();

        if (tagName === 'h1') {
          checkNewPage(15);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          const text = element.textContent || '';
          const lines = doc.splitTextToSize(text, 180);
          doc.text(lines, 15, yPosition);
          yPosition += lines.length * 8 + 5;
          doc.setTextColor(0, 0, 0);
        } else if (tagName === 'h2' || tagName === 'h3') {
          checkNewPage(12);
          doc.setFontSize(tagName === 'h2' ? 14 : 12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          const text = element.textContent || '';
          const lines = doc.splitTextToSize(text, 180);
          doc.text(lines, 15, yPosition);
          yPosition += lines.length * 6 + 4;
          doc.setTextColor(0, 0, 0);
        } else if (tagName === 'p') {
          checkNewPage(10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const text = element.textContent || '';
          if (text.trim()) {
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 15, yPosition);
            yPosition += lines.length * 5 + 3;
          }
        } else if (tagName === 'strong' || tagName === 'b') {
          const text = element.textContent || '';
          if (text.trim()) {
            renderText(text, true);
          }
        } else if (tagName === 'br') {
          yPosition += 3;
        } else if (tagName === 'ul' || tagName === 'ol') {
          const items = Array.from(element.querySelectorAll(':scope > li'));
          items.forEach((item, index) => {
            checkNewPage(8);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const text = item.textContent || '';
            const lines = doc.splitTextToSize(text, 170);
            const bullet = tagName === 'ol' ? `${index + 1}.` : '•';
            doc.text(bullet, 18, yPosition);
            doc.text(lines, 25, yPosition);
            yPosition += lines.length * 5 + 2;
          });
          yPosition += 3;
        } else if (tagName === 'table') {
          const rows: any[] = [];
          const thead = element.querySelector('thead');
          const tbody = element.querySelector('tbody') || element;

          let headers: string[] = [];
          if (thead) {
            const headerCells = thead.querySelectorAll('th');
            headers = Array.from(headerCells).map(cell => cell.textContent || '');
          }

          const bodyRows = tbody.querySelectorAll('tr');
          bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length > 0) {
              const rowData = Array.from(cells).map(cell => cell.textContent || '');
              if (!row.closest('thead')) {
                rows.push(rowData);
              }
            }
          });

          if (rows.length > 0 || headers.length > 0) {
            checkNewPage(40);
            autoTable(doc, {
              startY: yPosition,
              head: headers.length > 0 ? [headers] : [],
              body: rows,
              theme: 'striped',
              styles: { fontSize: 8, cellPadding: 2 },
              headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
              alternateRowStyles: { fillColor: [249, 250, 251] },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 10;
          }
        } else if (tagName === 'div' || tagName === 'span' || tagName === 'section' || tagName === 'article') {
          // Para contenedores, procesar sus hijos
          processChildren(element);
        }
      };

      // Función para procesar todos los hijos de un elemento
      const processChildren = (element: HTMLElement) => {
        const children = Array.from(element.childNodes);
        children.forEach(child => {
          processNode(child);
        });
      };

      // Si el contenido está vacío, mostrar mensaje
      if (!contract.contenido || contract.contenido.trim() === '') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('(Sin contenido definido)', 15, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);
      } else {
        // Iniciar procesamiento desde el contenedor raíz
        processChildren(tempDiv);
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
      const fileName = `${contract.nombre.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      alert('Error al generar el PDF del contrato');
    }
  };

  return (
    <div>
      {/* Header con búsqueda y botón nuevo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Botón nuevo */}
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            Nuevo Contrato Empresarial
          </button>
        </div>
      </motion.div>

      {/* Lista de contratos */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No se encontraron contratos' : 'No hay contratos empresariales creados'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Crea contratos personalizados para empresas y clínicas corporativas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {contract.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {contract.descripcion}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {contract.nombreEmpresa}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                        contract.activo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">RUC:</span>
                    <span className="font-medium text-gray-900">
                      {contract.ruc}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleView(contract)}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(contract)}
                    className="flex items-center gap-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDownload(contract)}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Editar Contrato Empresarial' : 'Nuevo Contrato Empresarial'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Contrato *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Contrato de Atención Dental Corporativa"
                  />
                </div>

                {/* Datos de la empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.nombreEmpresa}
                      onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Empresa ABC S.A.C."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUC *
                    </label>
                    <input
                      type="text"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20123456789"
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción breve del contrato empresarial"
                  />
                </div>

                {/* Contenido del contrato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido del Contrato (Editor Visual)
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Toolbar simple */}
                    <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => document.execCommand('bold')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold"
                        title="Negrita"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('italic')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm italic"
                        title="Cursiva"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('underline')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm underline"
                        title="Subrayado"
                      >
                        U
                      </button>
                      <div className="border-l border-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => document.execCommand('formatBlock', false, 'h2')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-semibold"
                        title="Título"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('formatBlock', false, 'p')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Párrafo"
                      >
                        P
                      </button>
                      <div className="border-l border-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => document.execCommand('insertUnorderedList')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Lista"
                      >
                        • Lista
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('insertOrderedList')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Lista numerada"
                      >
                        1. Numerada
                      </button>
                      <div className="border-l border-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          const rows = prompt('Número de filas:', '3');
                          const cols = prompt('Número de columnas:', '3');
                          if (rows && cols) {
                            let table = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;"><thead><tr>';
                            for (let i = 0; i < parseInt(cols); i++) {
                              table += '<th style="border: 1px solid #ddd; padding: 8px; background-color: #1e3a8a; color: white;">Columna ' + (i + 1) + '</th>';
                            }
                            table += '</tr></thead><tbody>';
                            for (let i = 0; i < parseInt(rows); i++) {
                              table += '<tr>';
                              for (let j = 0; j < parseInt(cols); j++) {
                                table += '<td style="border: 1px solid #ddd; padding: 8px;">Dato</td>';
                              }
                              table += '</tr>';
                            }
                            table += '</tbody></table>';
                            document.execCommand('insertHTML', false, table);
                          }
                        }}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Insertar tabla"
                      >
                        📊 Tabla
                      </button>
                    </div>
                    {/* Editor contentEditable */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        setFormData({ ...formData, contenido: e.currentTarget.innerHTML });
                      }}
                      className="w-full px-4 py-3 min-h-[400px] max-h-[600px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-sm max-w-none"
                      style={{
                        background: 'white',
                        lineHeight: '1.6'
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Edita el contenido visualmente. Las tablas y formatos se mantendrán en el PDF.
                  </p>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                    Contrato activo
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de visualización */}
      {showViewModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedContract.nombre}</h2>
                <p className="text-green-100">Vista del Contrato Empresarial</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                  <p className="text-gray-900">{selectedContract.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Empresa</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedContract.nombreEmpresa}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">RUC</h3>
                    <p className="text-gray-900">{selectedContract.ruc}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contenido del Contrato</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px]">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedContract.contenido }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => handleDownload(selectedContract)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
              <button
                onClick={() => setShowViewModal(false)}
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

export default CompanyContracts;
