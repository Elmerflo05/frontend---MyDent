import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  Printer,
  Search,
  Filter,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Patient } from '@/types';
import type { ToothCondition } from '@/store/odontogramStore';
import useOdontogramConfigStore from '@/store/odontogramConfigStore';
import useOdontogramStore from '@/store/odontogramStore';
import { getConditionPrice } from '@/utils/dentalPricing';
import { UI_TEXTS } from '@/constants/ui';

interface DetailedReportPanelProps {
  patient: Patient | null;
  conditions: ToothCondition[];
  className?: string;
}

interface ProcessedCondition {
  toothNumber: string;
  toothName: string;
  sectionId: string;
  sectionName: string;
  condition: string;
  conditionLabel: string;
  color: string;
  notes?: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'in_progress' | 'completed' | 'review';
  price: number;
  hasCustomPrice?: boolean;  // Indicador de precio personalizado (cuando hay múltiples condiciones en el mismo diente)
}

const DetailedReportPanel = ({ patient, conditions, className = '' }: DetailedReportPanelProps) => {
  const { dentalConditions, customConditions } = useOdontogramConfigStore();
  const { removeConditionFromPatient } = useOdontogramStore();

  // Combinar todas las condiciones disponibles
  const allConditions = useMemo(() => {
    return [...dentalConditions, ...customConditions];
  }, [dentalConditions, customConditions]);

  // SINCRONIZACIÓN CON TreatmentCostSummary: Mapa de dientes con precio personalizado
  // Reutilizable en todo el componente (render, generateDetailedReport, generatePDFReport)
  const teethWithCustomPrice = useMemo(() => {
    const priceMap = new Map<string, number>();
    conditions.forEach(condition => {
      const customPrice = (condition as any).custom_tooth_price;
      if (customPrice !== undefined && customPrice !== null) {
        if (!priceMap.has(condition.toothNumber)) {
          priceMap.set(condition.toothNumber, customPrice);
        }
      }
    });
    return priceMap;
  }, [conditions]);

  // Función helper para calcular el total (igual que TreatmentCostSummary)
  const calculateTotalCost = (processedConds: ProcessedCondition[]) => {
    const totalFromConditions = processedConds.reduce((sum, c) => sum + c.price, 0);
    const totalFromCustomPrices = Array.from(teethWithCustomPrice.values()).reduce((sum, price) => sum + price, 0);
    return totalFromConditions + totalFromCustomPrices;
  };

  // Mapeo de números de dientes a nombres
  const toothNames = {
    // Cuadrante Superior Derecho (1)
    '18': 'Tercer Molar Superior Derecho',
    '17': 'Segundo Molar Superior Derecho',
    '16': 'Primer Molar Superior Derecho',
    '15': 'Segundo Premolar Superior Derecho',
    '14': 'Primer Premolar Superior Derecho',
    '13': 'Canino Superior Derecho',
    '12': 'Incisivo Lateral Superior Derecho',
    '11': 'Incisivo Central Superior Derecho',

    // Cuadrante Superior Izquierdo (2)
    '21': 'Incisivo Central Superior Izquierdo',
    '22': 'Incisivo Lateral Superior Izquierdo',
    '23': 'Canino Superior Izquierdo',
    '24': 'Primer Premolar Superior Izquierdo',
    '25': 'Segundo Premolar Superior Izquierdo',
    '26': 'Primer Molar Superior Izquierdo',
    '27': 'Segundo Molar Superior Izquierdo',
    '28': 'Tercer Molar Superior Izquierdo',

    // Cuadrante Inferior Izquierdo (3)
    '38': 'Tercer Molar Inferior Izquierdo',
    '37': 'Segundo Molar Inferior Izquierdo',
    '36': 'Primer Molar Inferior Izquierdo',
    '35': 'Segundo Premolar Inferior Izquierdo',
    '34': 'Primer Premolar Inferior Izquierdo',
    '33': 'Canino Inferior Izquierdo',
    '32': 'Incisivo Lateral Inferior Izquierdo',
    '31': 'Incisivo Central Inferior Izquierdo',

    // Cuadrante Inferior Derecho (4)
    '41': 'Incisivo Central Inferior Derecho',
    '42': 'Incisivo Lateral Inferior Derecho',
    '43': 'Canino Inferior Derecho',
    '44': 'Primer Premolar Inferior Derecho',
    '45': 'Segundo Premolar Inferior Derecho',
    '46': 'Primer Molar Inferior Derecho',
    '47': 'Segundo Molar Inferior Derecho',
    '48': 'Tercer Molar Inferior Derecho'
  };

  // Mapeo de secciones
  const sectionNames: Record<string, string> = {
    // Caras principales
    mesial: 'Mesial',
    distal: 'Distal',
    oclusal: 'Oclusal/Incisal',
    vestibular: 'Vestibular',
    lingual: 'Lingual/Palatino',
    palatino: 'Palatino',
    incisal: 'Incisal',
    // Raíces
    raiz: 'Raíz',
    'raiz-mv': 'Raíz Mesio-Vestibular',
    'raiz-dv': 'Raíz Disto-Vestibular',
    'raiz-palatina': 'Raíz Palatina',
    'raiz-distal': 'Raíz Distal',
    // Partes del diente
    corona: 'Corona',
    cervical: 'Cervical',
    cuello: 'Cuello',
    // Secciones completas
    completo: 'Diente Completo',
    todo: 'Todo el Diente',
    full: 'Completo'
  };

  // Procesar condiciones para el reporte
  const processedConditions = useMemo(() => {
    if (!conditions.length) return [];

    // Filtrar condiciones sin datos válidos
    const validConditions = conditions.filter(c => c.toothNumber);

    // SINCRONIZACIÓN CON TreatmentCostSummary: Identificar dientes con precio personalizado
    // Un diente tiene precio personalizado si custom_tooth_price está definido en cualquiera de sus condiciones
    const teethWithCustomPrice = new Map<string, number>();
    validConditions.forEach(condition => {
      const customPrice = (condition as any).custom_tooth_price;
      if (customPrice !== undefined && customPrice !== null) {
        // Solo guardar si aún no existe (el valor es el mismo para todas las condiciones del diente)
        if (!teethWithCustomPrice.has(condition.toothNumber)) {
          teethWithCustomPrice.set(condition.toothNumber, customPrice);
        }
      }
    });

    return validConditions.map((condition) => {
      // SINCRONIZACIÓN: Usar conditionId (como TreatmentCostSummary) o condition como fallback
      const searchId = (condition as any).conditionId || condition.condition;

      // Buscar la configuración de la condición de varias formas
      let conditionConfig = allConditions.find(c => c.id === searchId);

      // Si no se encuentra por ID exacto, buscar por código de condición
      if (!conditionConfig) {
        conditionConfig = allConditions.find(c => c.condition_code === searchId);
      }

      // Si aún no se encuentra, buscar por label parcial (case insensitive)
      if (!conditionConfig && searchId) {
        const conditionLower = searchId.toLowerCase();
        conditionConfig = allConditions.find(c =>
          c.label?.toLowerCase().includes(conditionLower) ||
          c.id?.toLowerCase().includes(conditionLower)
        );
      }

      // Determinar prioridad basada en la condición
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (conditionConfig) {
        if (['caries', 'infection', 'fracture', 'trauma', 'periapical_lesion'].includes(conditionConfig.id)) {
          priority = 'high';
        } else if (['crown', 'restoration', 'filling', 'endodontics'].includes(conditionConfig.id)) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
      }

      // Determinar estado
      let status: 'planned' | 'in_progress' | 'completed' | 'review' = 'planned';
      if (conditionConfig) {
        if (['crown', 'restoration', 'filling'].includes(conditionConfig.id)) {
          status = 'completed';
        } else if (['caries', 'infection'].includes(conditionConfig.id)) {
          status = 'in_progress';
        } else if (['extracted', 'missing'].includes(conditionConfig.id)) {
          status = 'review';
        }
      }

      // SINCRONIZACIÓN CON TreatmentCostSummary: Calcular precio considerando custom_tooth_price
      // Si el diente tiene precio personalizado, el precio de esta condición individual es 0
      // El precio personalizado se sumará por separado al total (igual que en TreatmentCostSummary)
      const hasCustomPrice = teethWithCustomPrice.has(condition.toothNumber);
      const conditionPrice = hasCustomPrice
        ? 0
        : getConditionPrice(
            searchId,  // Usar searchId (conditionId || condition) para consistencia
            condition.abbreviation,
            condition.initialState
          );

      // Formatear el nombre de la condición si no se encuentra en el config
      const formatConditionName = (name: string): string => {
        if (!name) return 'Sin especificar';
        // Convertir snake_case o kebab-case a texto legible
        return name
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      };

      return {
        toothNumber: condition.toothNumber,
        toothName: toothNames[condition.toothNumber as keyof typeof toothNames] || `Diente ${condition.toothNumber}`,
        sectionId: condition.sectionId,
        sectionName: sectionNames[condition.sectionId] || formatConditionName(condition.sectionId),
        condition: searchId,  // Usar searchId para consistencia con la búsqueda
        conditionLabel: conditionConfig?.label || formatConditionName(searchId),
        color: condition.color,
        notes: condition.notes,
        date: condition.date,
        priority,
        status,
        price: conditionPrice,
        hasCustomPrice  // Indicador para mostrar que este diente usa precio combinado
      } as ProcessedCondition;
    }).sort((a, b) => {
      // Ordenar por número de diente
      return parseInt(a.toothNumber) - parseInt(b.toothNumber);
    });
  }, [conditions, allConditions]);

  const handleRemoveCondition = (toothNumber: string, sectionId: string) => {
    if (!patient) return;

    if (confirm('¿Está seguro de que desea eliminar esta condición?')) {
      removeConditionFromPatient(patient.id, toothNumber, sectionId);
      toast.success('Condición eliminada exitosamente');
    }
  };

  // Helper para cargar imagen como base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Genera el documento PDF landscape con odontograma + lista de condiciones
  const generatePDFDoc = async (): Promise<jsPDF | null> => {
    if (!patient) return null;

    // 1. Capturar SVG del odontograma como imagen
    const odontogramElement = document.querySelector('.odontogram-svg-container');
    let odontogramImageData: string | null = null;
    let imgNaturalWidth = 0;
    let imgNaturalHeight = 0;

    if (odontogramElement) {
      const canvas = await html2canvas(odontogramElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        ignoreElements: (el) => {
          return el.classList?.contains('zoom-controls') ||
                 el.classList?.contains('fullscreen-controls');
        }
      });
      odontogramImageData = canvas.toDataURL('image/png');
      imgNaturalWidth = canvas.width;
      imgNaturalHeight = canvas.height;
    }

    // 2. Crear PDF en landscape (A4: 297 x 210 mm)
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colores
    const primaryColor: [number, number, number] = [14, 116, 144];
    const accentColor: [number, number, number] = [217, 70, 239];
    const textDark: [number, number, number] = [15, 23, 42];
    const textMuted: [number, number, number] = [100, 116, 139];
    const borderColor: [number, number, number] = [226, 232, 240];
    const dangerColor: [number, number, number] = [239, 68, 68];
    const warningColor: [number, number, number] = [245, 158, 11];
    const successColor: [number, number, number] = [34, 197, 94];

    // Cargar logo
    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64('/mydentLogo.png');
    } catch {
      // Logo no disponible
    }

    // 3. Header con banda de color
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, 3, pageWidth, 1, 'F');

    let yPos = 8;

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 10, yPos, 40, 14);
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('HISTORIA CLÍNICA DENTAL', pageWidth / 2, yPos + 7, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 10, yPos + 7, { align: 'right' });

    yPos += 18;

    // Info del paciente
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    const patientDoc = (patient as any).documentNumber || patient.dni || 'N/A';
    doc.text(`Paciente: ${patient.firstName} ${patient.lastName}`, 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`DNI: ${patientDoc}`, 130, yPos);

    yPos += 3;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 4;

    // 4. Área de contenido lado a lado
    const contentStartY = yPos;
    const contentHeight = pageHeight - contentStartY - 15;
    const margin = 10;
    const gap = 6;
    const leftWidth = (pageWidth - 2 * margin - gap) * 0.58;
    const rightWidth = (pageWidth - 2 * margin - gap) * 0.42;
    const leftX = margin;
    const rightX = margin + leftWidth + gap;

    // 5. IZQUIERDA: Imagen del odontograma
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftX, contentStartY, leftWidth, contentHeight, 2, 2, 'D');

    if (odontogramImageData) {
      const imgPadding = 3;
      const availableWidth = leftWidth - 2 * imgPadding;
      const availableHeight = contentHeight - 2 * imgPadding;
      const ratio = Math.min(availableWidth / imgNaturalWidth, availableHeight / imgNaturalHeight);
      const finalImgWidth = imgNaturalWidth * ratio;
      const finalImgHeight = imgNaturalHeight * ratio;

      const imgX = leftX + imgPadding + (availableWidth - finalImgWidth) / 2;
      const imgY = contentStartY + imgPadding + (availableHeight - finalImgHeight) / 2;

      doc.addImage(odontogramImageData, 'PNG', imgX, imgY, finalImgWidth, finalImgHeight);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(leftX + 0.5, contentStartY + 0.5, leftWidth - 1, contentHeight - 1, 2, 2, 'F');
      doc.setTextColor(...textMuted);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Odontograma no disponible', leftX + leftWidth / 2, contentStartY + contentHeight / 2, { align: 'center' });
    }

    // 6. DERECHA: Tabla de condiciones
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CONDICIONES DETECTADAS', rightX, contentStartY + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`${processedConditions.length} condiciones registradas`, rightX, contentStartY + 10);

    const tableData = processedConditions.map(cond => [
      cond.toothNumber,
      cond.toothName.split(' ').slice(0, 3).join(' '),
      cond.sectionName,
      cond.conditionLabel
    ]);

    autoTable(doc, {
      startY: contentStartY + 14,
      margin: { left: rightX, right: margin, bottom: 18 },
      head: [['Pieza', 'Diente', 'Cara', 'Condición']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      bodyStyles: {
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 10 }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    // Footer en todas las páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 8;
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.line(10, footerY - 3, pageWidth - 10, footerY - 3);
      doc.setTextColor(...textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión Odontológica - MyDent', 10, footerY);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - 10, footerY, { align: 'right' });
    }

    return doc;
  };

  const generatePDFReport = async () => {
    const loadingToast = toast.loading('Generando PDF...');
    try {
      const doc = await generatePDFDoc();
      if (doc) {
        doc.save(`historia-clinica-dental-${patient!.firstName}-${patient!.lastName}-${Date.now()}.pdf`);
        toast.dismiss(loadingToast);
        toast.success('PDF descargado exitosamente');
      } else {
        toast.dismiss(loadingToast);
        toast.error('No hay paciente seleccionado');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const printPDFReport = async () => {
    const loadingToast = toast.loading('Preparando impresión...');
    try {
      const doc = await generatePDFDoc();
      if (doc) {
        doc.autoPrint();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url);
        toast.dismiss(loadingToast);
        toast.success('Documento enviado a impresora');
      } else {
        toast.dismiss(loadingToast);
        toast.error('No hay paciente seleccionado');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error al preparar impresión:', error);
      toast.error('Error al preparar la impresión');
    }
  };

  const getPriorityIcon = (priority: ProcessedCondition['priority']) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: ProcessedCondition['status']) => {
    const configs = {
      planned: { label: 'Planificado', color: 'blue' },
      in_progress: { label: 'En Progreso', color: 'yellow' },
      completed: { label: 'Completado', color: 'green' },
      review: { label: 'Revisión', color: 'red' }
    };

    const config = configs[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        {config.label}
      </span>
    );
  };

  if (!patient) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Historia Clínica Dental</h3>
        <p className="text-gray-600">Seleccione un paciente para ver el reporte detallado.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Historia Clínica Dental</h2>
              <p className="text-sm text-gray-600">
                {patient.firstName} {patient.lastName} - DNI: {(patient as any).documentNumber || patient.dni || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={printPDFReport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en el reporte..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Información del paciente */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Fecha del reporte:</span>
            <span className="ml-2 text-gray-600">{new Date().toLocaleDateString('es-ES')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total de condiciones:</span>
            <span className="ml-2 text-gray-600">{processedConditions.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Costo total estimado:</span>
            <span className="ml-2 text-gray-900 font-semibold">
              S/ {calculateTotalCost(processedConditions).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de condiciones */}
      <div className="max-h-96 overflow-y-auto">
        {processedConditions.length === 0 ? (
          <div className="p-8 text-center">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin condiciones registradas</h3>
            <p className="text-gray-600">No hay condiciones dentales registradas para este paciente.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {processedConditions.map((condition, index) => (
              <motion.div
                key={`${condition.toothNumber || 'tooth'}-${condition.sectionId || 'section'}-${condition.condition || 'cond'}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Número y nombre del diente */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: condition.color }}
                      >
                        {condition.toothNumber}
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            ({condition.toothNumber}) {condition.toothName}
                          </h4>
                          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            S/ {condition.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {condition.sectionName} - {condition.conditionLabel}
                        </p>
                      </div>
                    </div>

                    {/* Estado y prioridad */}
                    <div className="flex items-center gap-3 mb-2">
                      {getPriorityIcon(condition.priority)}
                      {getStatusBadge(condition.status)}
                    </div>

                    {/* Notas si existen */}
                    {condition.notes && (
                      <p className="text-sm text-gray-700 italic bg-gray-100 p-2 rounded mt-2">
                        "{condition.notes}"
                      </p>
                    )}

                    {/* Fecha */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Registrado: {condition.date instanceof Date ? condition.date.toLocaleDateString('es-ES') : new Date(condition.date || Date.now()).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleRemoveCondition(condition.toothNumber, condition.sectionId)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar condición"
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

      {/* Resumen estadístico */}
      {processedConditions.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumen por Prioridad</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">
                {processedConditions.filter(c => c.priority === 'high').length}
              </div>
              <div className="text-xs text-red-600 font-medium">Alta Prioridad</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-600">
                {processedConditions.filter(c => c.priority === 'medium').length}
              </div>
              <div className="text-xs text-yellow-600 font-medium">Media Prioridad</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">
                {processedConditions.filter(c => c.priority === 'low').length}
              </div>
              <div className="text-xs text-green-600 font-medium">Baja Prioridad</div>
            </div>
          </div>

          {/* Progreso general */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Estado general del tratamiento</span>
              <span>
                {Math.round((processedConditions.filter(c => c.status === 'completed').length / processedConditions.length) * 100)}% completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(processedConditions.filter(c => c.status === 'completed').length / processedConditions.length) * 100}%`
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedReportPanel;