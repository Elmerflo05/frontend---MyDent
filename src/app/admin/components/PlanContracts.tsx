import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { planTemplates, type PlanContract } from '@/data/contracts/planTemplates';
import jsPDF from 'jspdf';

// ============================================================================
// PDF GENERATION HELPERS
// ============================================================================

let cachedLogoBase64: string | null = null;
let logoLoadAttempted = false;

async function loadMyDentLogo(): Promise<string | null> {
  if (logoLoadAttempted) return cachedLogoBase64;
  try {
    const response = await fetch('/mydentLogo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result as string;
        logoLoadAttempted = true;
        resolve(cachedLogoBase64);
      };
      reader.onerror = () => {
        logoLoadAttempted = true;
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    logoLoadAttempted = true;
    return null;
  }
}

const PLAN_ACCENT_COLORS: Record<string, {
  primary: [number, number, number];
  light: [number, number, number];
}> = {
  personal: { primary: [13, 148, 136], light: [20, 184, 166] },
  familiar: { primary: [190, 24, 93], light: [236, 72, 153] },
  planitium: { primary: [109, 40, 217], light: [139, 92, 246] },
  gold: { primary: [180, 83, 9], light: [217, 119, 6] },
};

const PLAN_LABELS: Record<string, string> = {
  personal: 'PLAN PERSONAL',
  familiar: 'PLAN FAMILIAR',
  planitium: 'PLAN PLANITIUM',
  gold: 'PLAN GOLD',
};

interface PdfElement {
  type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list-item' | 'spacing' | 'signature-block';
  text: string;
  bulletType?: 'check' | 'diamond' | 'cross' | 'star' | 'disc';
  indent?: number;
}

function parseContractHtml(html: string): PdfElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const elements: PdfElement[] = [];

  for (const node of Array.from(root.children)) {
    const tag = node.tagName.toLowerCase();
    const text = (node.textContent || '').trim();

    if (!text) {
      if (tag === 'p') elements.push({ type: 'spacing', text: '' });
      continue;
    }

    switch (tag) {
      case 'h2':
        break;

      case 'h3':
        elements.push({ type: 'heading', text });
        break;

      case 'p': {
        if (text.includes('___')) {
          elements.push({ type: 'signature-block', text });
          break;
        }

        const strong = node.querySelector('strong');
        const underline = node.querySelector('u');

        const isAllStrong = strong &&
          text === (strong.textContent || '').trim();
        const isAllUnderline = underline &&
          text === (underline.textContent || '').trim();

        if (isAllStrong || isAllUnderline) {
          elements.push({ type: 'subheading', text });
        } else {
          elements.push({ type: 'paragraph', text });
        }
        break;
      }

      case 'ul': {
        const lis = node.querySelectorAll('li');
        for (const li of Array.from(lis)) {
          const liText = (li.textContent || '').trim();
          if (!liText) continue;

          let bulletType: PdfElement['bulletType'] = 'disc';
          let cleanText = liText;

          const bulletMatch = liText.match(/^([✓✔◆◇✗✘×★⭐✦☆•·])\s*/);
          if (bulletMatch) {
            const sym = bulletMatch[1];
            cleanText = liText.substring(bulletMatch[0].length);
            if ('✓✔'.includes(sym)) bulletType = 'check';
            else if ('◆◇'.includes(sym)) bulletType = 'diamond';
            else if ('✗✘×'.includes(sym)) bulletType = 'cross';
            else if ('★⭐✦☆'.includes(sym)) bulletType = 'star';
            else bulletType = 'disc';
          }

          const style = li.getAttribute('style') || '';
          const indent = style.includes('margin-left') ? 1 : 0;

          elements.push({ type: 'list-item', text: cleanText, bulletType, indent });
        }
        break;
      }
    }
  }

  return elements;
}

const BULLET_COLORS: Record<string, [number, number, number]> = {
  check: [16, 185, 129],
  diamond: [59, 130, 246],
  cross: [239, 68, 68],
  star: [245, 158, 11],
  disc: [107, 114, 128],
};

function generateContractPdf(contract: PlanContract, logo: string | null): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 20;
  const contentWidth = pageWidth - marginLeft - 20;
  const footerHeight = 12;
  const maxY = pageHeight - footerHeight - 10;

  const colors = PLAN_ACCENT_COLORS[contract.tipo] || PLAN_ACCENT_COLORS.personal;
  const darkText: [number, number, number] = [31, 41, 55];
  const grayText: [number, number, number] = [107, 114, 128];

  let y = 0;

  function ensureSpace(needed: number) {
    if (y + needed > maxY) {
      pdf.addPage();
      pdf.setFillColor(...colors.primary);
      pdf.rect(0, 0, pageWidth, 2.5, 'F');
      y = 15;
    }
  }

  // ============ FIRST PAGE HEADER ============
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 4, pageWidth, 50, 'F');

  pdf.setFillColor(...colors.light);
  pdf.rect(0, 53.5, pageWidth, 0.5, 'F');

  if (logo) {
    try {
      pdf.addImage(logo, 'PNG', (pageWidth - 42) / 2, 8, 42, 14);
    } catch {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...colors.primary);
      pdf.text('MyDent', pageWidth / 2, 18, { align: 'center' });
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.primary);
    pdf.text('MyDent', pageWidth / 2, 18, { align: 'center' });
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...grayText);
  pdf.text('CLINICA DENTAL', pageWidth / 2, 25, { align: 'center' });

  const planLabel = PLAN_LABELS[contract.tipo] || contract.nombre.toUpperCase();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(...colors.primary);
  pdf.text(planLabel, pageWidth / 2, 35, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...grayText);
  const infoText = `Precio mensual: S/ ${contract.precio.toFixed(2)}  |  Duracion: ${contract.duracion}`;
  pdf.text(infoText, pageWidth / 2, 42, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  const descLines = pdf.splitTextToSize(contract.descripcion, contentWidth - 20);
  pdf.text(descLines, pageWidth / 2, 48, { align: 'center' });

  y = 60;

  // ============ RENDER CONTENT ============
  const elements = parseContractHtml(contract.contenido);

  for (const el of elements) {
    switch (el.type) {
      case 'heading': {
        ensureSpace(14);
        y += 4;

        pdf.setFillColor(...colors.primary);
        pdf.rect(marginLeft, y - 3, 2.5, 7, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(...colors.primary);
        pdf.text(el.text, marginLeft + 6, y + 1.5);

        y += 9;
        break;
      }

      case 'subheading': {
        ensureSpace(10);
        y += 2;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...darkText);
        const subLines = pdf.splitTextToSize(el.text, contentWidth);
        for (const line of subLines) {
          ensureSpace(5);
          pdf.text(line, marginLeft, y);
          y += 4.5;
        }
        y += 1;
        break;
      }

      case 'paragraph': {
        ensureSpace(8);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...darkText);

        const paraLines = pdf.splitTextToSize(el.text, contentWidth);
        for (const line of paraLines) {
          ensureSpace(5);
          pdf.text(line, marginLeft, y);
          y += 4.5;
        }
        y += 2;
        break;
      }

      case 'list-item': {
        ensureSpace(6);

        const indentX = marginLeft + (el.indent ? 10 : 0) + 4;
        const bulletX = marginLeft + (el.indent ? 10 : 0);
        const textX = indentX + 3;
        const availWidth = contentWidth - (textX - marginLeft);

        const bColor = BULLET_COLORS[el.bulletType || 'disc'] || BULLET_COLORS.disc;
        pdf.setFillColor(...bColor);
        pdf.circle(bulletX + 1.2, y - 1, 1, 'F');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...darkText);

        const itemLines = pdf.splitTextToSize(el.text, availWidth);
        for (let i = 0; i < itemLines.length; i++) {
          if (i > 0) ensureSpace(4.5);
          pdf.text(itemLines[i], textX, y);
          if (i < itemLines.length - 1) y += 4;
        }
        y += 4.5;
        break;
      }

      case 'signature-block': {
        ensureSpace(12);
        y += 3;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...darkText);
        pdf.text(el.text, marginLeft, y);
        y += 5;
        break;
      }

      case 'spacing': {
        y += 4;
        break;
      }
    }
  }

  // ============ FOOTER ON ALL PAGES ============
  const totalPages = pdf.getNumberOfPages();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    pdf.setFillColor(...colors.primary);
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `MyDent - Clinica Dental  |  Documento generado el ${dateStr}`,
      pageWidth / 2,
      pageHeight - footerHeight + 5,
      { align: 'center' }
    );
    pdf.text(
      `Pagina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - footerHeight + 9,
      { align: 'center' }
    );
  }

  return pdf;
}

// ============================================================================

const PlanContracts = () => {
  const [contracts, setContracts] = useState<PlanContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<PlanContract | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'personal' as 'personal' | 'familiar' | 'planitium' | 'gold',
    descripcion: '',
    precio: '',
    duracion: '',
    contenido: '',
    activo: true
  });

  // Cargar contratos desde plantillas (TODO: migrar a API cuando esté disponible)
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      // Usar plantillas como fuente de datos hasta que exista API
      setContracts(planTemplates);
    } catch (error) {
      console.error('Error al cargar contratos:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contratos por búsqueda
  const filteredContracts = contracts.filter(contract =>
    contract.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'personal',
      descripcion: '',
      precio: '',
      duracion: '',
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

  const handleEdit = (contract: PlanContract) => {
    setSelectedContract(contract);
    setFormData({
      nombre: contract.nombre,
      tipo: contract.tipo,
      descripcion: contract.descripcion,
      precio: contract.precio.toString(),
      duracion: contract.duracion,
      contenido: contract.contenido,
      activo: contract.activo
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (contract: PlanContract) => {
    setSelectedContract(contract);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.precio) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    try {
      const contractData: PlanContract = {
        id: isEditing ? selectedContract!.id : `plan_contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        duracion: formData.duracion,
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

  const handleDownload = async (contract: PlanContract) => {
    const toastId = toast.loading('Generando PDF del contrato...');
    try {
      const logo = await loadMyDentLogo();
      const pdf = generateContractPdf(contract, logo);
      const fileName = `${contract.nombre.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      toast.success('PDF descargado exitosamente', { id: toastId });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF', { id: toastId });
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
              placeholder="Buscar contratos de planes..."
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
            Nuevo Contrato de Plan
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
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No se encontraron contratos' : 'No hay contratos creados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <span className="text-gray-600">Precio mensual:</span>
                    <span className="font-semibold text-gray-900">
                      S/ {contract.precio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium text-gray-900">
                      {contract.duracion}
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
                {isEditing ? 'Editar Contrato de Plan' : 'Nuevo Contrato de Plan'}
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
                    placeholder="Ej: Contrato Plan Personal"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Plan *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="personal">Personal</option>
                    <option value="familiar">Familiar</option>
                    <option value="planitium">Planitium</option>
                    <option value="gold">Gold</option>
                  </select>
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
                    placeholder="Descripción breve del plan"
                  />
                </div>

                {/* Precio y Duración */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Mensual (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración
                    </label>
                    <input
                      type="text"
                      value={formData.duracion}
                      onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 12 meses"
                    />
                  </div>
                </div>

                {/* Contenido del contrato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido del Contrato
                  </label>
                  <textarea
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Contenido detallado del contrato..."
                  />
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
                <p className="text-green-100">Vista del Contrato de Plan</p>
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
                    <h3 className="text-sm font-medium text-gray-500">Precio Mensual</h3>
                    <p className="text-lg font-bold text-gray-900">
                      S/ {selectedContract.precio.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duración</h3>
                    <p className="text-gray-900">{selectedContract.duracion}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contenido del Contrato</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div
                      className="prose max-w-none"
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

export default PlanContracts;
