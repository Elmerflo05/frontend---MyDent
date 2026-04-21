/**
 * Utilidades para exportar tratamientos realizados
 * - Exportar tratamiento completo como PDF
 * - Exportar odontograma como imagen
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatDateToYMD } from '@/utils/dateUtils';
import { getEffectiveProcedurePrice } from '@/components/consultation/final-diagnosis';

// ========== MAPEOS Y HELPERS PARA EXPORTACIÓN ==========

/**
 * Mapeo de identification_type_id a nombre legible
 */
const IDENTIFICATION_TYPE_NAMES: Record<number, string> = {
  1: 'DNI',
  2: 'Carnet de Extranjería',
  3: 'Pasaporte',
  4: 'RUC'
};

/**
 * Mapeo de tipos de servicio adicional (inglés → español)
 */
const SERVICE_TYPE_LABELS: Record<string, string> = {
  'orthodontic': 'Ortodoncia',
  'implant': 'Implante',
  'prosthesis': 'Prótesis',
  'other': 'Otro'
};

/**
 * Obtiene el nombre del tipo de documento desde el paciente
 * Soporta múltiples formatos de datos (BD directa, API transformada, mock)
 */
const getDocumentTypeName = (patient: any): string => {
  // Si tiene documentType como string (datos mock o ya transformados)
  if (patient?.documentType && typeof patient.documentType === 'string' && isNaN(Number(patient.documentType))) {
    return patient.documentType;
  }

  // Si tiene identification_type_id (datos de BD)
  if (patient?.identification_type_id) {
    return IDENTIFICATION_TYPE_NAMES[patient.identification_type_id] || 'DNI';
  }

  // Si documentType es un número (ID en lugar de nombre)
  if (patient?.documentType && !isNaN(Number(patient.documentType))) {
    return IDENTIFICATION_TYPE_NAMES[Number(patient.documentType)] || 'DNI';
  }

  // Si tiene identification_type como objeto con name
  if (patient?.identification_type?.type_name) {
    return patient.identification_type.type_name;
  }

  return 'DNI'; // Default
};

/**
 * Obtiene el número de documento del paciente
 */
const getDocumentNumber = (patient: any): string => {
  return patient?.documentNumber ||
         patient?.dni ||
         patient?.identification_number ||
         'N/A';
};

/**
 * Obtiene el número de historia clínica del paciente
 */
const getMedicalRecordNumber = (patient: any): string => {
  return patient?.medicalRecordNumber ||
         patient?.medical_record_number ||
         patient?.hc ||
         patient?.historiaClinica ||
         'N/A';
};

/**
 * Obtiene el nombre completo del paciente
 */
const getPatientFullName = (patient: any): string => {
  const firstName = patient?.firstName || patient?.first_name || '';
  const lastName = patient?.lastName || patient?.last_name || '';
  const secondLastName = patient?.secondLastName || patient?.second_last_name || '';

  return `${firstName} ${lastName} ${secondLastName}`.trim() || 'N/A';
};

/**
 * Traduce el tipo de servicio adicional al español
 */
const getServiceTypeLabel = (serviceType: string): string => {
  return SERVICE_TYPE_LABELS[serviceType?.toLowerCase()] ||
         SERVICE_TYPE_LABELS[serviceType] ||
         serviceType ||
         'Servicio';
};

/**
 * Obtiene el precio de un tratamiento (soporta múltiples estructuras)
 */
const getTreatmentPrice = (treatment: any): number => {
  // Primero intentar total_amount (estructura de BD)
  if (treatment?.total_amount !== undefined && treatment.total_amount !== null) {
    return Number(treatment.total_amount) || 0;
  }

  // Luego intentar price directo
  if (treatment?.price !== undefined && treatment.price !== null) {
    return Number(treatment.price) || 0;
  }

  // Calcular desde conditions si existen
  if (treatment?.conditions && Array.isArray(treatment.conditions)) {
    return treatment.conditions.reduce((sum: number, cond: any) => {
      return sum + (Number(cond.subtotal) || Number(cond.price) || 0);
    }, 0);
  }

  return 0;
};

/**
 * Obtiene el precio de un servicio adicional (soporta múltiples estructuras)
 */
const getAdditionalServicePrice = (service: any): number => {
  // Primero intentar edited_monto_total (estructura de BD)
  if (service?.edited_monto_total !== undefined && service.edited_monto_total !== null) {
    return Number(service.edited_monto_total) || 0;
  }

  // Luego intentar editedFields.montoTotal
  if (service?.editedFields?.montoTotal !== undefined) {
    return Number(service.editedFields.montoTotal) || 0;
  }

  // Luego original_monto_total
  if (service?.original_monto_total !== undefined && service.original_monto_total !== null) {
    return Number(service.original_monto_total) || 0;
  }

  // Luego originalFields.montoTotal
  if (service?.originalFields?.montoTotal !== undefined) {
    return Number(service.originalFields.montoTotal) || 0;
  }

  // Finalmente price directo
  return Number(service?.price) || 0;
};

/**
 * Obtiene el nombre del procedimiento de una condición de diagnóstico
 */
const getProcedureName = (condition: any): string => {
  return condition?.selected_procedure_name ||
         condition?.procedure_name ||
         condition?.procedureName ||
         '-';
};

interface ExportTreatmentData {
  patient: any;
  currentRecord: any;
  odontogramConditions: any[];
  diagnosticExams: any[];
  customExams: any[];
  medications: any[];
  consolidatedTotal: number;
  completedTreatments?: Record<string, boolean>;
  // Nuevos datos del backend
  treatmentPlan?: any;
  definitiveDiagnosis?: {
    conditions: any[];
    summary: {
      total_conditions: number;
      total_price: number;
    };
  };
  budget?: any;
  treatments?: any[];
  additionalServices?: any[];
  evolutionOdontogramData?: any[];
  // Totales desglosados
  definitiveDiagnosisTotal?: number;
  treatmentsTotal?: number;
  additionalServicesTotal?: number;
  examsTotal?: number;
  advancePayment?: number;
  balance?: number;
  planName?: string;
}

/**
 * Exporta el odontograma como imagen PNG
 */
export const exportOdontogramAsImage = async (): Promise<void> => {
  try {
    // Buscar el SVG del odontograma específicamente (solo el gráfico, sin UI adicional)
    const odontogramContainer = document.querySelector('.treatment-mode-odontogram .odontogram-svg-container');
    const odontogramElement = odontogramContainer || document.querySelector('.odontogram-svg-container');

    if (!odontogramElement) {
      throw new Error('No se encontró el odontograma para exportar');
    }

    // Convertir el elemento a canvas
    const canvas = await html2canvas(odontogramElement as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Mayor calidad
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        // Ignorar elementos de UI que no son parte del odontograma
        return element.classList?.contains('zoom-controls') ||
               element.classList?.contains('fullscreen-controls');
      }
    });

    // Convertir canvas a blob y descargar
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = formatDateToYMD(new Date());
        link.download = `odontograma-${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');

  } catch (error) {
    throw error;
  }
};

interface ExportOdontogramPDFData {
  patient: any;
  odontogramConditions?: any[];
  doctorName?: string;
  doctorLicense?: string;
}

/**
 * Exporta el odontograma de evolución como PDF con formato corporativo MyDent PREMIUM
 * Diseño profesional y distintivo con mejor jerarquía visual
 * Incluye DOS odontogramas: INICIAL (rojo) y ACTUAL (azul) en layout vertical
 */
export const exportOdontogramAsPDF = async (data: ExportOdontogramPDFData): Promise<void> => {
  try {
    const { patient, odontogramConditions = [], doctorName, doctorLicense } = data;

    // Crear nuevo documento PDF en orientación vertical
    const pdf = new jsPDF('portrait');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 0;

    // ========== PALETA DE COLORES PREMIUM ==========
    const colors = {
      primary: [14, 116, 144] as [number, number, number],     // Teal-700
      primaryLight: [207, 250, 254] as [number, number, number], // Cyan-100
      primaryDark: [21, 94, 117] as [number, number, number],   // Cyan-800
      accent: [217, 70, 239] as [number, number, number],       // Fuchsia-500
      success: [34, 197, 94] as [number, number, number],       // Green-500
      warning: [251, 146, 60] as [number, number, number],      // Orange-400
      danger: [239, 68, 68] as [number, number, number],        // Red-500
      info: [59, 130, 246] as [number, number, number],         // Blue-500
      textDark: [15, 23, 42] as [number, number, number],       // Slate-900
      textMuted: [100, 116, 139] as [number, number, number],   // Slate-500
      bgLight: [248, 250, 252] as [number, number, number],     // Slate-50
      border: [226, 232, 240] as [number, number, number]       // Slate-200
    };

    // ========== CARGAR LOGO ==========
    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64('/mydentLogo.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo');
    }

    // ========== HEADER CON BANDA DE COLOR ==========
    // Banda superior decorativa
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 3, 'F');

    // Línea de acento
    pdf.setFillColor(...colors.accent);
    pdf.rect(0, 3, pageWidth, 1, 'F');

    yPosition = 12;

    // Logo centrado con marco sutil
    if (logoBase64) {
      const logoWidth = 55;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;

      // Marco sutil detrás del logo
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(logoX - 4, yPosition - 2, logoWidth + 8, logoHeight + 4, 3, 3, 'FD');

      pdf.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
    }

    yPosition += 28;

    // ========== TÍTULO DEL DOCUMENTO ==========
    // Línea decorativa antes del título
    const lineWidth = 60;
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line((pageWidth - lineWidth) / 2, yPosition, (pageWidth + lineWidth) / 2, yPosition);

    yPosition += 8;

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primaryDark);
    pdf.text('ODONTOGRAMA', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 7;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.accent);
    pdf.text('DE EVOLUCIÓN', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 6;

    // Línea decorativa después del título
    pdf.setDrawColor(...colors.primary);
    pdf.line((pageWidth - lineWidth) / 2, yPosition, (pageWidth + lineWidth) / 2, yPosition);

    yPosition += 8;

    // Fecha elegante
    const fecha = new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(fecha.charAt(0).toUpperCase() + fecha.slice(1), pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;

    // ========== INFORMACIÓN DEL PACIENTE Y DOCTOR (DISEÑO PREMIUM) ==========
    const columnWidth = (pageWidth - 38) / 2;
    const leftColumnX = 16;
    const rightColumnX = leftColumnX + columnWidth + 6;
    const cardHeight = 28;

    // === TARJETA PACIENTE ===
    // Sombra sutil
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(leftColumnX + 1, yPosition + 1, columnWidth, cardHeight, 4, 4, 'F');

    // Fondo principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(leftColumnX, yPosition, columnWidth, cardHeight, 4, 4, 'FD');

    // Banda de color en la tarjeta
    pdf.setFillColor(...colors.primary);
    pdf.roundedRect(leftColumnX, yPosition, columnWidth, 8, 4, 4, 'F');
    pdf.rect(leftColumnX, yPosition + 4, columnWidth, 4, 'F'); // Cubrir esquinas inferiores

    // Icono de paciente (círculo)
    pdf.setFillColor(255, 255, 255);
    pdf.circle(leftColumnX + 10, yPosition + 4, 3, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('P', leftColumnX + 8.5, yPosition + 5.5);

    // Título de la tarjeta
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('PACIENTE', leftColumnX + 17, yPosition + 5.5);

    // Información del paciente (usando helpers robustos)
    const patientFullName = getPatientFullName(patient);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(patientFullName, leftColumnX + 6, yPosition + 15);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    const docType = getDocumentTypeName(patient);
    const docNumber = getDocumentNumber(patient);
    const hcNumber = getMedicalRecordNumber(patient);
    pdf.text(`${docType}: ${docNumber}`, leftColumnX + 6, yPosition + 21);
    pdf.text(`HC: ${hcNumber}`, leftColumnX + 6, yPosition + 25);

    // === TARJETA DOCTOR ===
    // Sombra sutil
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(rightColumnX + 1, yPosition + 1, columnWidth, cardHeight, 4, 4, 'F');

    // Fondo principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...colors.accent);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(rightColumnX, yPosition, columnWidth, cardHeight, 4, 4, 'FD');

    // Banda de color en la tarjeta
    pdf.setFillColor(...colors.accent);
    pdf.roundedRect(rightColumnX, yPosition, columnWidth, 8, 4, 4, 'F');
    pdf.rect(rightColumnX, yPosition + 4, columnWidth, 4, 'F');

    // Icono de doctor (círculo)
    pdf.setFillColor(255, 255, 255);
    pdf.circle(rightColumnX + 10, yPosition + 4, 3, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.accent);
    pdf.text('D', rightColumnX + 8.5, yPosition + 5.5);

    // Título de la tarjeta
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('ODONTÓLOGO', rightColumnX + 17, yPosition + 5.5);

    // Información del doctor
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(doctorName || 'N/A', rightColumnX + 6, yPosition + 15);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(`COP: ${doctorLicense || 'N/A'}`, rightColumnX + 6, yPosition + 21);

    yPosition += cardHeight + 10;

    // ========== CAPTURAR AMBOS ODONTOGRAMAS (LAYOUT VERTICAL PREMIUM) ==========
    // Selectores con múltiples fallbacks para mayor robustez
    const initialOdontogramContainer =
      document.querySelector('.treatment-mode-odontogram-initial .odontogram-svg-container') ||
      document.querySelector('.odontogram-initial-container .odontogram-svg-container') ||
      document.querySelector('.evolution-odontogram-readonly.treatment-mode-odontogram-initial .odontogram-svg-container') ||
      document.querySelector('[class*="odontogram-initial"] .odontogram-svg-container');

    const finalOdontogramContainer =
      document.querySelector('.treatment-mode-odontogram .odontogram-svg-container') ||
      document.querySelector('.odontogram-final-container .odontogram-svg-container') ||
      document.querySelector('.evolution-odontogram-readonly.treatment-mode-odontogram:not(.treatment-mode-odontogram-initial) .odontogram-svg-container') ||
      document.querySelector('[class*="odontogram-final"] .odontogram-svg-container');

    const odontogramFullWidth = pageWidth - 32;
    const maxOdontogramHeight = 70;

    // Función auxiliar para capturar y renderizar odontograma con diseño premium
    const captureAndRenderOdontogramPremium = async (
      element: Element | null,
      label: string,
      subtitle: string,
      headerColor: [number, number, number],
      iconLetter: string
    ): Promise<number> => {
      if (!element) {
        // Placeholder elegante
        pdf.setFillColor(...colors.bgLight);
        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(1);
        pdf.setLineDashPattern([3, 2], 0);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, 45, 4, 4, 'FD');
        pdf.setLineDashPattern([], 0);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.textMuted);
        pdf.text('Odontograma no disponible', 16 + odontogramFullWidth / 2, yPosition + 25, { align: 'center' });
        return 45;
      }

      try {
        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2.5,
          logging: false,
          useCORS: true,
          ignoreElements: (el) => {
            return el.classList?.contains('zoom-controls') ||
                   el.classList?.contains('fullscreen-controls');
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(odontogramFullWidth / imgWidth, maxOdontogramHeight / imgHeight);
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        // Contenedor con sombra
        pdf.setFillColor(200, 200, 200);
        pdf.roundedRect(17, yPosition + 1.5, odontogramFullWidth, finalHeight + 20, 4, 4, 'F');

        // Contenedor principal blanco
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...headerColor);
        pdf.setLineWidth(1);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, finalHeight + 20, 4, 4, 'FD');

        // Header con gradiente simulado (múltiples rectángulos)
        const headerHeight = 12;
        pdf.setFillColor(...headerColor);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, headerHeight, 4, 4, 'F');
        pdf.rect(16, yPosition + 4, odontogramFullWidth, headerHeight - 4, 'F');

        // Icono circular
        pdf.setFillColor(255, 255, 255);
        pdf.circle(28, yPosition + headerHeight / 2, 4.5, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...headerColor);
        pdf.text(iconLetter, 26, yPosition + headerHeight / 2 + 2);

        // Título del header
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(label, 38, yPosition + headerHeight / 2 + 1);

        // Subtítulo
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const subtitleWidth = pdf.getTextWidth(subtitle);
        pdf.text(subtitle, 16 + odontogramFullWidth - subtitleWidth - 6, yPosition + headerHeight / 2 + 1);

        // Imagen del odontograma centrada
        const imgX = 16 + (odontogramFullWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'PNG', imgX, yPosition + headerHeight + 4, finalWidth, finalHeight);

        return finalHeight + 20;
      } catch (error) {
        console.error(`Error capturando odontograma ${label}:`, error);
        pdf.setFillColor(...colors.bgLight);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, 45, 4, 4, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.textMuted);
        pdf.text('Error al capturar el odontograma', 16 + odontogramFullWidth / 2, yPosition + 25, { align: 'center' });
        return 45;
      }
    };

    // Capturar ODONTOGRAMA INICIAL
    const initialHeight = await captureAndRenderOdontogramPremium(
      initialOdontogramContainer,
      'ODONTOGRAMA INICIAL',
      'Estado al comenzar',
      colors.danger,
      'I'
    );
    yPosition += initialHeight + 3;

    // Flecha de evolución elegante
    const arrowY = yPosition + 3;
    pdf.setFillColor(...colors.accent);
    pdf.circle(pageWidth / 2, arrowY, 6, 'F');

    // Flecha interior
    pdf.setFillColor(255, 255, 255);
    pdf.triangle(
      pageWidth / 2, arrowY + 3,
      pageWidth / 2 - 3, arrowY - 1,
      pageWidth / 2 + 3, arrowY - 1,
      'F'
    );

    // Texto "EVOLUCIÓN"
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.accent);
    pdf.text('EVOLUCIÓN', pageWidth / 2 - 18, arrowY + 2);
    pdf.text('DEL TRATAMIENTO', pageWidth / 2 + 10, arrowY + 2);

    yPosition += 12;

    // Capturar ODONTOGRAMA ACTUAL
    const finalHeight = await captureAndRenderOdontogramPremium(
      finalOdontogramContainer,
      'ODONTOGRAMA ACTUAL',
      'Después del tratamiento',
      colors.info,
      'F'
    );
    yPosition += finalHeight + 6;

    // ========== LEYENDA DE COLORES PREMIUM ==========
    if (yPosition < pageHeight - 30) {
      // Caja de leyenda
      const legendWidth = 140;
      const legendX = (pageWidth - legendWidth) / 2;

      pdf.setFillColor(...colors.bgLight);
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(legendX, yPosition, legendWidth, 14, 3, 3, 'FD');

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.textDark);
      pdf.text('LEYENDA:', legendX + 6, yPosition + 9);

      // Rojo - Pendiente
      pdf.setFillColor(...colors.danger);
      pdf.circle(legendX + 35, yPosition + 7, 3, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Pendiente', legendX + 40, yPosition + 9);

      // Azul - Completado
      pdf.setFillColor(...colors.info);
      pdf.circle(legendX + 70, yPosition + 7, 3, 'F');
      pdf.text('Completado', legendX + 75, yPosition + 9);

      // Amarillo - En progreso
      pdf.setFillColor(...colors.warning);
      pdf.circle(legendX + 110, yPosition + 7, 3, 'F');
      pdf.text('En progreso', legendX + 115, yPosition + 9);
    }

    // ========== PIE DE PÁGINA PREMIUM ==========
    const footerY = pageHeight - 15;

    // Línea decorativa del footer
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(16, footerY - 3, pageWidth - 16, footerY - 3);

    // Punto decorativo
    pdf.setFillColor(...colors.accent);
    pdf.circle(pageWidth / 2, footerY - 3, 2, 'F');

    // Logo pequeño en footer
    if (logoBase64) {
      pdf.addImage(logoBase64, 'PNG', 16, footerY, 25, 9);
    }

    // Información del centro
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Centro Odontológico MyDent', pageWidth / 2, footerY + 3, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('www.mydent.com', pageWidth / 2, footerY + 7, { align: 'center' });

    // Fecha de generación
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7);
    pdf.text(
      `Generado: ${new Date().toLocaleString('es-PE')}`,
      pageWidth - 16,
      footerY + 5,
      { align: 'right' }
    );

    // Banda inferior decorativa
    pdf.setFillColor(...colors.accent);
    pdf.rect(0, pageHeight - 2, pageWidth, 2, 'F');

    // ========== DESCARGAR PDF ==========
    const timestamp = formatDateToYMD(new Date());
    const patientId = patient?.dni || patient?.identification_number || patient?.id || 'paciente';
    const fileName = `odontograma-evolucion-${patientId}-${timestamp}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error exportando odontograma como PDF:', error);
    throw error;
  }
};

/**
 * Carga una imagen y la convierte a base64
 */
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('No se pudo obtener el contexto del canvas'));
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = url;
  });
};

/**
 * Formatea un número como precio en formato peruano (S/ 1,234.50)
 */
const formatPrice = (value: number): string => {
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Exporta el tratamiento completo como PDF con diseño PREMIUM profesional
 * Incluye: Logo, datos del paciente, doctor, diagnóstico, tratamientos, servicios adicionales,
 * medicamentos, observaciones, odontograma de evolución y resumen financiero
 */
export const exportTreatmentAsPDF = async (data: ExportTreatmentData): Promise<void> => {
  try {
    const {
      patient,
      currentRecord,
      odontogramConditions,
      diagnosticExams,
      customExams,
      medications,
      consolidatedTotal,
      completedTreatments = {},
      // Nuevos datos
      definitiveDiagnosis,
      treatments = [],
      additionalServices = [],
      evolutionOdontogramData = [],
      definitiveDiagnosisTotal = 0,
      treatmentsTotal = 0,
      additionalServicesTotal = 0,
      examsTotal = 0,
      advancePayment = 0,
      balance = 0,
      planName = 'Plan de Tratamiento'
    } = data;

    // Crear nuevo documento PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 0;

    // ========== PALETA DE COLORES PREMIUM ==========
    const colors = {
      primary: [14, 116, 144] as [number, number, number],      // Teal-700
      primaryLight: [207, 250, 254] as [number, number, number],// Cyan-100
      primaryDark: [21, 94, 117] as [number, number, number],   // Cyan-800
      accent: [217, 70, 239] as [number, number, number],       // Fuchsia-500
      success: [34, 197, 94] as [number, number, number],       // Green-500
      successLight: [220, 252, 231] as [number, number, number],// Green-100
      warning: [251, 146, 60] as [number, number, number],      // Orange-400
      warningLight: [255, 237, 213] as [number, number, number],// Orange-100
      danger: [239, 68, 68] as [number, number, number],        // Red-500
      dangerLight: [254, 226, 226] as [number, number, number], // Red-100
      info: [59, 130, 246] as [number, number, number],         // Blue-500
      infoLight: [219, 234, 254] as [number, number, number],   // Blue-100
      purple: [147, 51, 234] as [number, number, number],       // Purple-600
      purpleLight: [243, 232, 255] as [number, number, number], // Purple-100
      textDark: [15, 23, 42] as [number, number, number],       // Slate-900
      textMuted: [100, 116, 139] as [number, number, number],   // Slate-500
      bgLight: [248, 250, 252] as [number, number, number],     // Slate-50
      border: [226, 232, 240] as [number, number, number]       // Slate-200
    };

    // ========== CARGAR LOGO ==========
    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64('/mydentLogo.png');
    } catch (error) {
      console.warn('No se pudo cargar el logo');
    }

    // ========== FUNCIÓN HELPER PARA VERIFICAR NUEVA PÁGINA ==========
    const checkNewPage = (requiredSpace: number = 40): void => {
      if (yPosition > pageHeight - requiredSpace) {
        pdf.addPage();
        yPosition = 20;

        // Header minimalista en páginas adicionales
        pdf.setFillColor(...colors.primary);
        pdf.rect(0, 0, pageWidth, 2, 'F');
        pdf.setFillColor(...colors.accent);
        pdf.rect(0, 2, pageWidth, 0.5, 'F');

        // Logo pequeño en páginas adicionales
        if (logoBase64) {
          pdf.addImage(logoBase64, 'PNG', 14, 5, 30, 10);
        }
      }
    };

    // ========== FUNCIÓN HELPER PARA CREAR ENCABEZADO DE SECCIÓN ==========
    const drawSectionHeader = (
      title: string,
      color: [number, number, number],
      count?: number
    ): void => {
      // Línea decorativa antes
      pdf.setDrawColor(...color);
      pdf.setLineWidth(0.5);
      pdf.line(16, yPosition, 26, yPosition);

      // Círculo decorativo
      pdf.setFillColor(...color);
      pdf.circle(30, yPosition, 2, 'F');

      // Título
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...color);
      pdf.text(title, 36, yPosition + 1);

      // Contador si existe
      if (count !== undefined) {
        const titleWidth = pdf.getTextWidth(title);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.textMuted);
        pdf.text(`(${count})`, 36 + titleWidth + 3, yPosition + 1);
      }

      // Línea decorativa después
      pdf.setDrawColor(...color);
      const titleEnd = 36 + pdf.getTextWidth(title) + (count !== undefined ? 20 : 5);
      pdf.line(titleEnd, yPosition, pageWidth - 16, yPosition);

      yPosition += 8;
    };

    // ========== HEADER CON BANDA DE COLOR ==========
    // Banda superior decorativa
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 4, 'F');

    // Línea de acento
    pdf.setFillColor(...colors.accent);
    pdf.rect(0, 4, pageWidth, 1.5, 'F');

    yPosition = 14;

    // Logo a la izquierda
    if (logoBase64) {
      pdf.addImage(logoBase64, 'PNG', 16, yPosition - 2, 48, 17);
    }

    // Información del centro a la derecha (en una caja elegante)
    const infoBoxWidth = 75;
    const infoBoxX = pageWidth - infoBoxWidth - 16;
    pdf.setFillColor(...colors.bgLight);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(infoBoxX, yPosition - 4, infoBoxWidth, 20, 2, 2, 'FD');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primaryDark);
    pdf.text('CENTRO ODONTOLÓGICO MYDENT', infoBoxX + infoBoxWidth / 2, yPosition + 2, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Av. Principal 123, Lima - Perú', infoBoxX + infoBoxWidth / 2, yPosition + 7, { align: 'center' });
    pdf.text('Tel: (01) 234-5678 | www.mydent.com', infoBoxX + infoBoxWidth / 2, yPosition + 12, { align: 'center' });

    yPosition += 24;

    // ========== TÍTULO DEL DOCUMENTO ==========
    // Línea decorativa
    const titleLineWidth = 50;
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line((pageWidth - titleLineWidth) / 2, yPosition, (pageWidth + titleLineWidth) / 2, yPosition);

    yPosition += 7;

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primaryDark);
    pdf.text('REPORTE DE TRATAMIENTO', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 6;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.accent);
    pdf.text('REALIZADO', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 5;

    // Línea decorativa
    pdf.setDrawColor(...colors.primary);
    pdf.line((pageWidth - titleLineWidth) / 2, yPosition, (pageWidth + titleLineWidth) / 2, yPosition);

    yPosition += 6;

    // Fecha elegante
    const fecha = new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...colors.textMuted);
    pdf.text(fecha.charAt(0).toUpperCase() + fecha.slice(1), pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;

    // ========== INFORMACIÓN DEL PACIENTE Y DOCTOR (DOS COLUMNAS PREMIUM) ==========
    const columnWidth = (pageWidth - 38) / 2;
    const leftColumnX = 16;
    const rightColumnX = leftColumnX + columnWidth + 6;
    const cardHeight = 38;

    // === TARJETA PACIENTE ===
    // Sombra
    pdf.setFillColor(210, 210, 210);
    pdf.roundedRect(leftColumnX + 1.5, yPosition + 1.5, columnWidth, cardHeight, 4, 4, 'F');

    // Fondo principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(1);
    pdf.roundedRect(leftColumnX, yPosition, columnWidth, cardHeight, 4, 4, 'FD');

    // Banda de color
    pdf.setFillColor(...colors.primary);
    pdf.roundedRect(leftColumnX, yPosition, columnWidth, 10, 4, 4, 'F');
    pdf.rect(leftColumnX, yPosition + 5, columnWidth, 5, 'F');

    // Icono de paciente
    pdf.setFillColor(255, 255, 255);
    pdf.circle(leftColumnX + 12, yPosition + 5, 3.5, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('P', leftColumnX + 10.2, yPosition + 6.5);

    // Título
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('DATOS DEL PACIENTE', leftColumnX + 20, yPosition + 6.5);

    // Información del paciente (usando helpers robustos)
    const documentType = getDocumentTypeName(patient);
    const documentNumber = getDocumentNumber(patient);
    const patientFullName = getPatientFullName(patient);
    const medicalRecord = getMedicalRecordNumber(patient);

    let patientY = yPosition + 16;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(patientFullName, leftColumnX + 6, patientY);
    patientY += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textMuted);
    pdf.text(`${documentType}: ${documentNumber}`, leftColumnX + 6, patientY);
    patientY += 5;
    pdf.text(`HC: ${medicalRecord}`, leftColumnX + 6, patientY);
    patientY += 5;
    pdf.text(`Tel: ${patient?.phone || patient?.cellphone || patient?.mobile || 'N/A'}`, leftColumnX + 6, patientY);

    // === TARJETA DOCTOR ===
    // Sombra
    pdf.setFillColor(210, 210, 210);
    pdf.roundedRect(rightColumnX + 1.5, yPosition + 1.5, columnWidth, cardHeight, 4, 4, 'F');

    // Fondo principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...colors.accent);
    pdf.setLineWidth(1);
    pdf.roundedRect(rightColumnX, yPosition, columnWidth, cardHeight, 4, 4, 'FD');

    // Banda de color
    pdf.setFillColor(...colors.accent);
    pdf.roundedRect(rightColumnX, yPosition, columnWidth, 10, 4, 4, 'F');
    pdf.rect(rightColumnX, yPosition + 5, columnWidth, 5, 'F');

    // Icono de doctor
    pdf.setFillColor(255, 255, 255);
    pdf.circle(rightColumnX + 12, yPosition + 5, 3.5, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.accent);
    pdf.text('D', rightColumnX + 10.2, yPosition + 6.5);

    // Título
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('ODONTÓLOGO TRATANTE', rightColumnX + 20, yPosition + 6.5);

    // Información
    const doctorName = currentRecord.doctorName || currentRecord.dentistName || 'N/A';
    const doctorInfo = currentRecord.doctorInfo || {};

    let doctorY = yPosition + 16;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(doctorName, rightColumnX + 6, doctorY);
    doctorY += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.textMuted);
    if (doctorInfo.licenseNumber) {
      pdf.text(`COP: ${doctorInfo.licenseNumber}`, rightColumnX + 6, doctorY);
      doctorY += 5;
    }

    if (doctorInfo.specialties && doctorInfo.specialties.length > 0) {
      const specialtiesText = doctorInfo.specialties.join(', ');
      const truncatedSpecialties = specialtiesText.length > 35
        ? specialtiesText.substring(0, 35) + '...'
        : specialtiesText;
      pdf.text(truncatedSpecialties, rightColumnX + 6, doctorY);
    }

    yPosition += cardHeight + 12;

    // ========== DIAGNÓSTICO DEFINITIVO ==========
    const diagnosisConditions = definitiveDiagnosis?.conditions || [];
    if (diagnosisConditions.length > 0) {
      checkNewPage(60);

      // Encabezado de sección premium
      drawSectionHeader('DIAGNÓSTICO DEFINITIVO', colors.info, diagnosisConditions.length);

      // Tabla de diagnóstico con estilo premium (usando helpers para datos correctos)
      const diagnosisRows = diagnosisConditions.map((cond: any, index: number) => {
        return [
          (index + 1).toString(),
          cond.tooth_number || 'General',
          cond.condition_label || cond.label || cond.condition_name || 'N/A',
          getProcedureName(cond),
          formatPrice(getEffectiveProcedurePrice(cond))
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Pieza', 'Condición', 'Procedimiento', 'Precio']],
        body: diagnosisRows,
        theme: 'plain',
        headStyles: {
          fillColor: colors.info,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4,
          lineWidth: 0
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: colors.textDark,
          lineWidth: 0.1,
          lineColor: colors.border
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'left', cellWidth: 55 },
          3: { halign: 'left' },
          4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
        },
        margin: { left: 16, right: 16 },
        alternateRowStyles: { fillColor: colors.infoLight }
      });

      yPosition = (pdf as any).lastAutoTable?.finalY + 3 || yPosition + 40;

      // Subtotal elegante
      const diagTotal = definitiveDiagnosisTotal || definitiveDiagnosis?.summary?.total_price || 0;
      pdf.setFillColor(...colors.infoLight);
      pdf.roundedRect(pageWidth - 70, yPosition, 54, 10, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.info);
      pdf.text(`Subtotal: ${formatPrice(diagTotal)}`, pageWidth - 18, yPosition + 6.5, { align: 'right' });

      yPosition += 16;
    }

    // ========== TRATAMIENTOS DEL PLAN ==========
    if (treatments && treatments.length > 0) {
      checkNewPage(60);

      drawSectionHeader('PLAN DE TRATAMIENTO', colors.success, treatments.length);

      if (planName && planName !== 'Plan de Tratamiento') {
        yPosition -= 5;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...colors.textMuted);
        pdf.text(`Tipo de plan: ${planName}`, 36, yPosition);
        yPosition += 5;
      }

      const treatmentRows = treatments.map((treat: any, index: number) => {
        // Crear descripción desde las condiciones si no hay descripción directa
        const description = treat.description ||
          (treat.conditions && treat.conditions.length > 0
            ? treat.conditions.map((c: any) => c.label || c.condition_label).filter(Boolean).join(', ')
            : '-');

        return [
          (index + 1).toString(),
          treat.treatment_name || treat.name || 'N/A',
          description.length > 50 ? description.substring(0, 50) + '...' : description,
          formatPrice(getTreatmentPrice(treat))
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Tratamiento', 'Descripción', 'Precio']],
        body: treatmentRows,
        theme: 'plain',
        headStyles: {
          fillColor: colors.success,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4,
          lineWidth: 0
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: colors.textDark,
          lineWidth: 0.1,
          lineColor: colors.border
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left', cellWidth: 50 },
          2: { halign: 'left' },
          3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
        },
        margin: { left: 16, right: 16 },
        alternateRowStyles: { fillColor: colors.successLight }
      });

      yPosition = (pdf as any).lastAutoTable?.finalY + 3 || yPosition + 40;

      // Subtotal elegante
      pdf.setFillColor(...colors.successLight);
      pdf.roundedRect(pageWidth - 70, yPosition, 54, 10, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.success);
      pdf.text(`Subtotal: ${formatPrice(treatmentsTotal)}`, pageWidth - 18, yPosition + 6.5, { align: 'right' });

      yPosition += 16;
    }

    // ========== SERVICIOS ADICIONALES ==========
    if (additionalServices && additionalServices.length > 0) {
      checkNewPage(60);

      drawSectionHeader('SERVICIOS ADICIONALES', colors.purple, additionalServices.length);

      const servicesRows = additionalServices.map((service: any, index: number) => {
        // Usar helper para traducir tipo de servicio y obtener precio correcto
        const serviceType = getServiceTypeLabel(service.service_type || service.type);
        const serviceName = service.service_name || service.name || '';
        const displayName = serviceName ? `${serviceType}: ${serviceName}` : serviceType;

        return [
          (index + 1).toString(),
          displayName,
          service.description || service.modality || '-',
          formatPrice(getAdditionalServicePrice(service))
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Tipo', 'Descripción', 'Precio']],
        body: servicesRows,
        theme: 'plain',
        headStyles: {
          fillColor: colors.purple,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4,
          lineWidth: 0
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: colors.textDark,
          lineWidth: 0.1,
          lineColor: colors.border
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left', cellWidth: 45 },
          2: { halign: 'left' },
          3: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
        },
        margin: { left: 16, right: 16 },
        alternateRowStyles: { fillColor: colors.purpleLight }
      });

      yPosition = (pdf as any).lastAutoTable?.finalY + 3 || yPosition + 40;

      // Subtotal elegante
      pdf.setFillColor(...colors.purpleLight);
      pdf.roundedRect(pageWidth - 70, yPosition, 54, 10, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.purple);
      pdf.text(`Subtotal: ${formatPrice(additionalServicesTotal)}`, pageWidth - 18, yPosition + 6.5, { align: 'right' });

      yPosition += 16;
    }

    // ========== EXÁMENES DIAGNÓSTICOS ==========
    const allExams = [
      ...(diagnosticExams || []),
      ...(customExams || [])
    ];

    if (allExams.length > 0) {
      checkNewPage(60);

      drawSectionHeader('EXÁMENES DIAGNÓSTICOS', colors.warning, allExams.length);

      const examRows = allExams.map((exam: any, index: number) => {
        const isCompleted = completedTreatments[`exam-${index}`];
        return [
          (index + 1).toString(),
          exam.name || exam.label || exam.exam_name || 'N/A',
          exam.type || exam.category || '-',
          isCompleted ? '✓ Realizado' : '○ Pendiente',
          formatPrice(exam.price || 0)
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Examen', 'Tipo', 'Estado', 'Precio']],
        body: examRows,
        theme: 'plain',
        headStyles: {
          fillColor: colors.warning,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4,
          lineWidth: 0
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: colors.textDark,
          lineWidth: 0.1,
          lineColor: colors.border
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 35 },
          3: { halign: 'center', cellWidth: 28 },
          4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
        },
        margin: { left: 16, right: 16 },
        alternateRowStyles: { fillColor: colors.warningLight },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const cellText = data.cell.raw as string;
            if (cellText.includes('Realizado')) {
              data.cell.styles.textColor = colors.success;
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = colors.warning;
            }
          }
        }
      });

      yPosition = (pdf as any).lastAutoTable?.finalY + 3 || yPosition + 40;

      // Subtotal elegante
      pdf.setFillColor(...colors.warningLight);
      pdf.roundedRect(pageWidth - 70, yPosition, 54, 10, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.warning);
      pdf.text(`Subtotal: ${formatPrice(examsTotal)}`, pageWidth - 18, yPosition + 6.5, { align: 'right' });

      yPosition += 16;
    }

    // ========== MEDICAMENTOS PRESCRITOS ==========
    if (medications && medications.length > 0) {
      checkNewPage(60);

      drawSectionHeader('RECETA MÉDICA', colors.danger, medications.length);

      const medicationRows = medications.map((med: any, index: number) => {
        return [
          (index + 1).toString(),
          med.name || med.medication_name || 'N/A',
          med.concentracion || med.concentration || med.dosage || '-',
          med.cantidad || med.quantity || '-',
          med.indicaciones || med.instructions || med.frequency || 'Según indicación médica'
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Medicamento', 'Concentración', 'Cantidad', 'Indicaciones']],
        body: medicationRows,
        theme: 'plain',
        headStyles: {
          fillColor: colors.danger,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          cellPadding: 4,
          lineWidth: 0
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: colors.textDark,
          lineWidth: 0.1,
          lineColor: colors.border
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 42, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 28 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'left' }
        },
        margin: { left: 16, right: 16 },
        alternateRowStyles: { fillColor: colors.dangerLight }
      });

      yPosition = (pdf as any).lastAutoTable?.finalY + 10 || yPosition + 40;
    }

    // ========== ODONTOGRAMAS DE EVOLUCIÓN (INICIAL Y FINAL - LAYOUT VERTICAL PREMIUM) ==========
    checkNewPage(120);

    drawSectionHeader('ODONTOGRAMAS DE EVOLUCIÓN', colors.primary);

    // Buscar ambos odontogramas (con múltiples fallbacks para mayor robustez)
    const initialOdontogramContainer =
      document.querySelector('.treatment-mode-odontogram-initial .odontogram-svg-container') ||
      document.querySelector('.odontogram-initial-container .odontogram-svg-container') ||
      document.querySelector('.evolution-odontogram-readonly.treatment-mode-odontogram-initial .odontogram-svg-container') ||
      document.querySelector('[class*="odontogram-initial"] .odontogram-svg-container');

    const finalOdontogramContainer =
      document.querySelector('.treatment-mode-odontogram .odontogram-svg-container') ||
      document.querySelector('.odontogram-final-container .odontogram-svg-container') ||
      document.querySelector('.evolution-odontogram-readonly.treatment-mode-odontogram:not(.treatment-mode-odontogram-initial) .odontogram-svg-container') ||
      document.querySelector('[class*="odontogram-final"] .odontogram-svg-container');

    // Ancho completo para cada odontograma (layout vertical)
    const odontogramFullWidth = pageWidth - 32;
    const maxOdontogramHeight = 48;

    // Función auxiliar para capturar y renderizar odontograma verticalmente con diseño premium
    const captureAndRenderOdontogram = async (
      element: Element | null,
      label: string,
      subtitle: string,
      headerColor: [number, number, number],
      iconLetter: string
    ): Promise<number> => {
      if (!element) {
        // Placeholder elegante
        pdf.setFillColor(...colors.bgLight);
        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(1);
        pdf.setLineDashPattern([3, 2], 0);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, 40, 4, 4, 'FD');
        pdf.setLineDashPattern([], 0);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.textMuted);
        pdf.text('Odontograma no disponible', 16 + odontogramFullWidth / 2, yPosition + 22, { align: 'center' });
        return 40;
      }

      try {
        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2.5,
          logging: false,
          useCORS: true,
          ignoreElements: (el) => {
            return el.classList?.contains('zoom-controls') ||
                   el.classList?.contains('fullscreen-controls');
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(odontogramFullWidth / imgWidth, maxOdontogramHeight / imgHeight);
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        // Contenedor con sombra
        pdf.setFillColor(200, 200, 200);
        pdf.roundedRect(17.5, yPosition + 1.5, odontogramFullWidth, finalHeight + 18, 4, 4, 'F');

        // Contenedor principal
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...headerColor);
        pdf.setLineWidth(1);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, finalHeight + 18, 4, 4, 'FD');

        // Header del odontograma
        const headerHeight = 11;
        pdf.setFillColor(...headerColor);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, headerHeight, 4, 4, 'F');
        pdf.rect(16, yPosition + 5, odontogramFullWidth, headerHeight - 5, 'F');

        // Icono circular
        pdf.setFillColor(255, 255, 255);
        pdf.circle(28, yPosition + headerHeight / 2, 4, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...headerColor);
        pdf.text(iconLetter, 26.2, yPosition + headerHeight / 2 + 2);

        // Título
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(label, 36, yPosition + headerHeight / 2 + 1);

        // Subtítulo
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const subtitleWidth = pdf.getTextWidth(subtitle);
        pdf.text(subtitle, 16 + odontogramFullWidth - subtitleWidth - 6, yPosition + headerHeight / 2 + 1);

        // Imagen del odontograma centrada
        const imgX = 16 + (odontogramFullWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'PNG', imgX, yPosition + headerHeight + 3, finalWidth, finalHeight);

        return finalHeight + 18;
      } catch (error) {
        console.error(`Error capturando odontograma ${label}:`, error);
        pdf.setFillColor(...colors.bgLight);
        pdf.roundedRect(16, yPosition, odontogramFullWidth, 40, 4, 4, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.textMuted);
        pdf.text('Error al capturar', 16 + odontogramFullWidth / 2, yPosition + 22, { align: 'center' });
        return 40;
      }
    };

    // Capturar ODONTOGRAMA INICIAL
    const initialHeight = await captureAndRenderOdontogram(
      initialOdontogramContainer,
      'ODONTOGRAMA INICIAL',
      'Estado al comenzar',
      colors.danger,
      'I'
    );
    yPosition += initialHeight + 3;

    // Flecha de evolución elegante
    checkNewPage(80);
    const arrowY = yPosition + 3;
    pdf.setFillColor(...colors.accent);
    pdf.circle(pageWidth / 2, arrowY, 5, 'F');

    // Flecha interior
    pdf.setFillColor(255, 255, 255);
    pdf.triangle(
      pageWidth / 2, arrowY + 2.5,
      pageWidth / 2 - 2.5, arrowY - 0.5,
      pageWidth / 2 + 2.5, arrowY - 0.5,
      'F'
    );

    // Texto "EVOLUCIÓN"
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.accent);
    pdf.text('EVOLUCIÓN', pageWidth / 2 - 16, arrowY + 1.5);
    pdf.text('DEL TRATAMIENTO', pageWidth / 2 + 8, arrowY + 1.5);

    yPosition += 10;

    // Capturar ODONTOGRAMA ACTUAL
    const finalHeight = await captureAndRenderOdontogram(
      finalOdontogramContainer,
      'ODONTOGRAMA ACTUAL',
      'Después del tratamiento',
      colors.info,
      'F'
    );
    yPosition += finalHeight + 5;

    // Leyenda de colores premium
    const legendWidth = 130;
    const legendX = (pageWidth - legendWidth) / 2;

    pdf.setFillColor(...colors.bgLight);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(legendX, yPosition, legendWidth, 12, 3, 3, 'FD');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text('LEYENDA:', legendX + 5, yPosition + 7.5);

    // Rojo - Pendiente
    pdf.setFillColor(...colors.danger);
    pdf.circle(legendX + 32, yPosition + 6, 2.5, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Pendiente', legendX + 37, yPosition + 7.5);

    // Azul - Completado
    pdf.setFillColor(...colors.info);
    pdf.circle(legendX + 65, yPosition + 6, 2.5, 'F');
    pdf.text('Completado', legendX + 70, yPosition + 7.5);

    // Amarillo - En progreso
    pdf.setFillColor(...colors.warning);
    pdf.circle(legendX + 103, yPosition + 6, 2.5, 'F');
    pdf.text('En progreso', legendX + 108, yPosition + 7.5);

    yPosition += 18;

    // ========== OBSERVACIONES DEL TRATAMIENTO ==========
    if (currentRecord.treatmentPerformed) {
      checkNewPage(50);

      drawSectionHeader('OBSERVACIONES DEL TRATAMIENTO', colors.textMuted);

      // Caja de observaciones elegante
      const observationsText = pdf.splitTextToSize(currentRecord.treatmentPerformed, pageWidth - 44);
      const observationsHeight = Math.max((observationsText.length * 5) + 14, 25);

      // Sombra
      pdf.setFillColor(210, 210, 210);
      pdf.roundedRect(17.5, yPosition + 1.5, pageWidth - 32, observationsHeight, 4, 4, 'F');

      // Caja principal
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(16, yPosition, pageWidth - 32, observationsHeight, 4, 4, 'FD');

      // Barra lateral decorativa
      pdf.setFillColor(...colors.textMuted);
      pdf.roundedRect(16, yPosition, 3, observationsHeight, 2, 0, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textDark);
      pdf.text(observationsText, 24, yPosition + 8);

      yPosition += observationsHeight + 12;
    }

    // ========== RESUMEN FINANCIERO PREMIUM ==========
    checkNewPage(80);

    drawSectionHeader('RESUMEN FINANCIERO', colors.primaryDark);

    // Contenedor principal del resumen
    const summaryBoxHeight = 62;

    // Sombra
    pdf.setFillColor(200, 200, 200);
    pdf.roundedRect(17.5, yPosition + 1.5, pageWidth - 32, summaryBoxHeight, 5, 5, 'F');

    // Fondo principal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(1);
    pdf.roundedRect(16, yPosition, pageWidth - 32, summaryBoxHeight, 5, 5, 'FD');

    let summaryY = yPosition + 10;
    const summaryLeftX = 24;
    const summaryRightX = pageWidth / 2 + 10;
    const valueX = 85;
    const valueRightX = pageWidth - 24;

    // === COLUMNA IZQUIERDA - DESGLOSE ===
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('DESGLOSE', summaryLeftX, summaryY);
    summaryY += 7;

    pdf.setFontSize(9);

    // Diagnóstico
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Diagnóstico Definitivo:', summaryLeftX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(formatPrice(definitiveDiagnosisTotal), valueX, summaryY, { align: 'right' });

    summaryY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Tratamientos:', summaryLeftX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(formatPrice(treatmentsTotal), valueX, summaryY, { align: 'right' });

    summaryY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Servicios Adicionales:', summaryLeftX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(formatPrice(additionalServicesTotal), valueX, summaryY, { align: 'right' });

    summaryY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Exámenes:', summaryLeftX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.textDark);
    pdf.text(formatPrice(examsTotal), valueX, summaryY, { align: 'right' });

    // === COLUMNA DERECHA - PAGOS Y TOTAL ===
    summaryY = yPosition + 10;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.accent);
    pdf.text('PAGOS', summaryRightX, summaryY);
    summaryY += 7;

    pdf.setFontSize(9);

    // Adelanto
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);
    pdf.text('Adelanto Pagado:', summaryRightX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    pdf.text(formatPrice(advancePayment), valueRightX, summaryY, { align: 'right' });

    summaryY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.textMuted);

    // Manejar saldo negativo (saldo a favor del paciente)
    const isNegativeBalance = balance < 0;
    const balanceLabel = isNegativeBalance ? 'Saldo a Favor:' : 'Saldo Pendiente:';
    const balanceValue = isNegativeBalance ? Math.abs(balance) : balance;
    const balanceColor = isNegativeBalance ? colors.success : colors.danger;

    pdf.text(balanceLabel, summaryRightX, summaryY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...balanceColor);
    pdf.text(formatPrice(balanceValue), valueRightX, summaryY, { align: 'right' });

    // Línea separadora elegante
    summaryY += 8;
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.5);
    pdf.line(summaryRightX - 2, summaryY, valueRightX + 2, summaryY);

    // Total general destacado con gradiente simulado
    summaryY += 6;
    const totalBoxWidth = 78;
    const totalBoxX = summaryRightX - 4;

    // Sombra del total
    pdf.setFillColor(150, 150, 150);
    pdf.roundedRect(totalBoxX + 1.5, summaryY - 5 + 1.5, totalBoxWidth, 16, 3, 3, 'F');

    // Fondo del total con gradiente simulado
    pdf.setFillColor(...colors.primaryDark);
    pdf.roundedRect(totalBoxX, summaryY - 5, totalBoxWidth, 16, 3, 3, 'F');

    // Línea de acento en el borde
    pdf.setFillColor(...colors.accent);
    pdf.rect(totalBoxX, summaryY - 5, 3, 16, 'F');
    pdf.setFillColor(...colors.primary);
    pdf.roundedRect(totalBoxX, summaryY - 5, 3, 16, 3, 0, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL GENERAL', totalBoxX + 6, summaryY + 4);

    pdf.setFontSize(12);
    pdf.text(formatPrice(consolidatedTotal), totalBoxX + totalBoxWidth - 4, summaryY + 4.5, { align: 'right' });

    yPosition += summaryBoxHeight + 10;

    // ========== PIE DE PÁGINA PREMIUM ==========
    const pageCount = pdf.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      const footerY = pageHeight - 14;

      // Línea decorativa del footer
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(16, footerY - 2, pageWidth - 16, footerY - 2);

      // Punto decorativo central
      pdf.setFillColor(...colors.accent);
      pdf.circle(pageWidth / 2, footerY - 2, 2, 'F');

      // Logo pequeño en footer
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', 16, footerY + 1, 22, 8);
      }

      // Información del centro
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.textMuted);
      pdf.text('Centro Odontológico MyDent | Av. Principal 123, Lima | Tel: (01) 234-5678', pageWidth / 2, footerY + 4, { align: 'center' });
      pdf.text('www.mydent.com', pageWidth / 2, footerY + 8, { align: 'center' });

      // Numeración de página elegante
      pdf.setFillColor(...colors.bgLight);
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(pageWidth - 38, footerY, 22, 10, 2, 2, 'FD');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.textMuted);
      pdf.text(`${i}/${pageCount}`, pageWidth - 27, footerY + 6.5, { align: 'center' });

      // Banda inferior decorativa
      pdf.setFillColor(...colors.accent);
      pdf.rect(0, pageHeight - 2, pageWidth, 2, 'F');
    }

    // ========== DESCARGAR PDF ==========
    const timestamp = formatDateToYMD(new Date());
    const patientId = patient.documentNumber || patient.dni || patient.medicalRecordNumber || patient.id || 'paciente';
    const fileName = `reporte-tratamiento-${patientId}-${timestamp}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error exportando tratamiento como PDF:', error);
    throw error;
  }
};
