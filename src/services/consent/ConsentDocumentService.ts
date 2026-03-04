/**
 * CONSENT DOCUMENT SERVICE
 * Servicio para procesar y generar documentos de consentimientos
 * Maneja el reemplazo de plantillas, generación de HTML y creación de PDFs
 */

import type { SignedConsent } from '@/types';
import type { ConsentFormData } from '@/components/consent';
import jsPDF from 'jspdf';

/**
 * Parsea una fecha string sin conversión de timezone
 * Evita el problema de desfase que ocurre con new Date() en strings "YYYY-MM-DD"
 */
function parseDateWithoutTimezone(dateString: string): { dia: number; mes: string; año: number } | null {
  if (!dateString) return null;

  // Meses en español
  const mesesEspañol = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Si viene en formato YYYY-MM-DD (del input date)
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const año = parseInt(isoMatch[1], 10);
    const mesIndex = parseInt(isoMatch[2], 10) - 1; // 0-indexed
    const dia = parseInt(isoMatch[3], 10);

    if (mesIndex >= 0 && mesIndex < 12 && dia >= 1 && dia <= 31 && año > 1900) {
      return { dia, mes: mesesEspañol[mesIndex], año };
    }
  }

  // Si viene en formato ISO completo (2026-01-21T00:00:00.000Z)
  const isoFullMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoFullMatch) {
    const año = parseInt(isoFullMatch[1], 10);
    const mesIndex = parseInt(isoFullMatch[2], 10) - 1;
    const dia = parseInt(isoFullMatch[3], 10);

    if (mesIndex >= 0 && mesIndex < 12 && dia >= 1 && dia <= 31 && año > 1900) {
      return { dia, mes: mesesEspañol[mesIndex], año };
    }
  }

  return null;
}

/**
 * Formatea una fecha string a formato legible sin desfase de timezone
 * Retorna formato: "21 de enero de 2026"
 */
function formatDateWithoutTimezone(dateString: string): string {
  const parsed = parseDateWithoutTimezone(dateString);
  if (parsed) {
    return `${parsed.dia} de ${parsed.mes} de ${parsed.año}`;
  }
  // Fallback: si no se puede parsear, usar el string original
  return dateString;
}

export class ConsentDocumentService {
  /**
   * Procesa el contenido del consentimiento reemplazando puntos suspensivos
   * con los datos del formulario
   */
  static processConsentContent(
    contenido: string,
    formData: ConsentFormData
  ): string {
    if (!formData.pacienteNombre) {
      return contenido; // Si no hay datos, devolver contenido original
    }

    let contenidoProcesado = contenido;

    // Reemplazar nombre del paciente
    contenidoProcesado = contenidoProcesado.replace(
      /Yo\s+\.+\s*\(como paciente\)/g,
      `Yo <strong>${formData.pacienteNombre}</strong> (como paciente)`
    );

    // Reemplazar DNI del paciente
    contenidoProcesado = contenidoProcesado.replace(
      /con DNI No\.\s+\.+,/g,
      `con DNI No. <strong>${formData.pacienteDni}</strong>,`
    );

    // Reemplazar domicilio del paciente
    contenidoProcesado = contenidoProcesado.replace(
      /con domicilio en\s+\.+\s+o Yo/g,
      `con domicilio en <strong>${formData.pacienteDomicilio}</strong> o Yo`
    );

    // Si tiene representante legal, reemplazar sus datos
    if (formData.tieneRepresentante && formData.representanteNombre) {
      // Segundo "Yo" (representante)
      const regex = /o Yo\s+\.+\s+con DNI No\.\s+\.+,\s+mayor de edad,\s+y con domicilio\s+en\s+\.+\s+en calidad de representante legal de/g;
      contenidoProcesado = contenidoProcesado.replace(
        regex,
        `o Yo <strong>${formData.representanteNombre}</strong> con DNI No. <strong>${formData.representanteDni}</strong>, mayor de edad, y con domicilio en <strong>${formData.representanteDomicilio}</strong> en calidad de representante legal de`
      );

      // Nombre del paciente después de "representante legal de"
      contenidoProcesado = contenidoProcesado.replace(
        /en calidad de representante legal de\s+\.+\s+<strong>DECLARO<\/strong>/g,
        `en calidad de representante legal de <strong>${formData.pacienteNombre}</strong> <strong>DECLARO</strong>`
      );
    }

    // Reemplazar fecha - Usar parseo sin timezone para evitar desfase
    if (formData.fecha) {
      // ====== LOG DE DIAGNÓSTICO DE FECHA ======
      console.log('📅 [ConsentDocumentService] PROCESANDO FECHA EN CONTENIDO:', {
        formData_fecha: formData.fecha,
        tipo_formData_fecha: typeof formData.fecha
      });

      const fechaParsed = parseDateWithoutTimezone(formData.fecha);

      console.log('📅 [ConsentDocumentService] FECHA PARSEADA:', {
        fechaParsed,
        formato_final: fechaParsed ? `${fechaParsed.dia} de ${fechaParsed.mes} de ${fechaParsed.año}` : 'N/A'
      });

      if (fechaParsed) {
        contenidoProcesado = contenidoProcesado.replace(
          /En Lima, a\s+\.+de\s+\.+de\.+/g,
          `En Lima, a <strong>${fechaParsed.dia}</strong> de <strong>${fechaParsed.mes}</strong> de <strong>${fechaParsed.año}</strong>`
        );
      }
    }

    // Reemplazar COP del doctor
    if (formData.doctorCop) {
      contenidoProcesado = contenidoProcesado.replace(
        /COP\s+\.+/g,
        `COP <strong>${formData.doctorCop}</strong>`
      );
    }

    // Reemplazar observaciones si existen
    if (formData.observaciones) {
      contenidoProcesado = contenidoProcesado.replace(
        /Observaciones\.+/g,
        `Observaciones: <strong>${formData.observaciones}</strong>`
      );
    }

    // Agregar firmas digitales si existen
    if (formData.firmaPaciente || formData.firmaDoctor) {
      const firmasHTML = this.generateSignaturesHTML(formData);

      // Reemplazar la sección de firmas original
      contenidoProcesado = contenidoProcesado.replace(
        /<div style="display: flex; justify-content: space-between; margin-top: 60px;">[\s\S]*?<\/div>/,
        firmasHTML
      );
    }

    return contenidoProcesado;
  }

  /**
   * Genera el HTML de las firmas digitales
   */
  private static generateSignaturesHTML(formData: ConsentFormData): string {
    return `
      <div style="display: flex; justify-content: space-between; margin-top: 60px; gap: 40px;">
        <div style="text-align: center; flex: 1;">
          ${formData.firmaPaciente ? `
            <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; min-height: 100px; display: flex; align-items: flex-end; justify-content: center;">
              <img src="${formData.firmaPaciente}" alt="Firma del ${formData.tieneRepresentante ? 'Representante Legal' : 'Paciente'}" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
            </div>
          ` : `
            <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; min-height: 100px;"></div>
          `}
          <p style="margin: 5px 0; font-size: 14px;"><strong>${formData.tieneRepresentante ? 'Representante Legal' : 'El Paciente'}</strong></p>
          ${formData.pacienteNombre ? `<p style="margin: 0; font-size: 12px; color: #666;">${formData.pacienteNombre}</p>` : ''}
        </div>
        <div style="text-align: center; flex: 1;">
          ${formData.firmaDoctor ? `
            <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; min-height: 100px; display: flex; align-items: flex-end; justify-content: center;">
              <img src="${formData.firmaDoctor}" alt="Firma del Doctor" style="max-width: 200px; max-height: 80px; object-fit: contain;" />
            </div>
          ` : `
            <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; min-height: 100px;"></div>
          `}
          <p style="margin: 5px 0; font-size: 14px;"><strong>Cirujano-Dentista</strong></p>
          ${formData.doctorNombre ? `<p style="margin: 0; font-size: 12px; color: #666;">${formData.doctorNombre}</p>` : ''}
          ${formData.doctorCop ? `<p style="margin: 0; font-size: 12px; color: #666;">COP: ${formData.doctorCop}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Genera un documento HTML completo para descarga
   */
  static generateHTMLDocument(consent: SignedConsent): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${consent.consentimientoNombre} - ${consent.pacienteNombre}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .signature { margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        ${consent.documentoHTML}
        <div class="signature">
          <p><strong>Firma del Paciente:</strong></p>
          <img src="${consent.firmaPaciente}" alt="Firma Paciente" style="max-width: 200px;">
        </div>
        <div class="signature">
          <p><strong>Firma del Doctor:</strong></p>
          <img src="${consent.firmaDoctor}" alt="Firma Doctor" style="max-width: 200px;">
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera un documento HTML para impresión
   */
  static generatePrintDocument(consent: SignedConsent): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${consent.consentimientoNombre}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          @media print {
            body { padding: 0; }
          }
          .signature { margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        ${consent.documentoHTML}
        <div class="signature">
          <p><strong>Firma del Paciente:</strong></p>
          <img src="${consent.firmaPaciente}" alt="Firma Paciente" style="max-width: 200px;">
        </div>
        <div class="signature">
          <p><strong>Firma del Doctor:</strong></p>
          <img src="${consent.firmaDoctor}" alt="Firma Doctor" style="max-width: 200px;">
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Descarga un consentimiento como archivo PDF
   */
  static async downloadConsent(consent: SignedConsent): Promise<void> {
    try {
      const pdf = await this.generatePDFAsync(consent);
      const fileName = `consentimiento-${consent.consentimientoNombre.toLowerCase().replace(/\s+/g, '-')}-${consent.pacienteDni}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw new Error('Error al descargar el consentimiento');
    }
  }

  // Logo en base64 (se cargará dinámicamente)
  private static logoBase64: string | null = null;
  private static logoLoaded = false;

  /**
   * Carga el logo de forma asíncrona
   */
  private static async loadLogo(): Promise<string | null> {
    if (this.logoLoaded) return this.logoBase64;

    try {
      const response = await fetch('/mydentLogo.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoBase64 = reader.result as string;
          this.logoLoaded = true;
          resolve(this.logoBase64);
        };
        reader.onerror = () => {
          this.logoLoaded = true;
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      this.logoLoaded = true;
      return null;
    }
  }

  /**
   * Genera un documento PDF del consentimiento con diseño profesional
   */
  static async generatePDFAsync(consent: SignedConsent): Promise<jsPDF> {
    // Cargar logo
    const logo = await this.loadLogo();
    return this.createPDF(consent, logo);
  }

  /**
   * Genera un documento PDF del consentimiento (versión síncrona)
   */
  static generatePDF(consent: SignedConsent): jsPDF {
    return this.createPDF(consent, this.logoBase64);
  }

  /**
   * Crea el PDF con diseño profesional
   */
  private static createPDF(consent: SignedConsent, logo: string | null): jsPDF {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Colores corporativos
    const primaryColor: [number, number, number] = [37, 99, 235]; // Azul
    const secondaryColor: [number, number, number] = [59, 130, 246]; // Azul claro
    const grayColor: [number, number, number] = [107, 114, 128];
    const darkColor: [number, number, number] = [31, 41, 55];

    // ========== HEADER CON LOGO ==========
    // Fondo del header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    // Linea decorativa superior
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 3, 'F');

    // Logo (horizontal: 50x15 aproximadamente para mantener proporcion)
    if (logo) {
      try {
        pdf.addImage(logo, 'PNG', margin, 10, 45, 15);
      } catch (e) {
        // Si falla, continuar sin logo
      }
    }

    // Si no hay logo, mostrar texto
    if (!logo) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(...primaryColor);
      pdf.text('MyDent', margin, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...grayColor);
      pdf.text('Red Dental', margin, 26);
    }

    // Fecha en el header (derecha) - Usar parseo sin timezone para evitar desfase
    // ====== LOG DE DIAGNÓSTICO DE FECHA ======
    console.log('📅 [ConsentDocumentService] CREANDO PDF - FECHA:', {
      fechaConsentimiento_raw: consent.fechaConsentimiento,
      tipo_fechaConsentimiento: typeof consent.fechaConsentimiento,
      signed_consent_id: consent.id
    });

    const fechaFormateada = formatDateWithoutTimezone(consent.fechaConsentimiento);

    console.log('📅 [ConsentDocumentService] PDF - FECHA FORMATEADA:', {
      fechaFormateada,
      fechaParsed: parseDateWithoutTimezone(consent.fechaConsentimiento)
    });

    pdf.setFontSize(9);
    pdf.setTextColor(...grayColor);
    pdf.text(`Fecha: ${fechaFormateada}`, pageWidth - margin, 15, { align: 'right' });

    // Categoria del consentimiento
    pdf.setFillColor(...secondaryColor);
    const categoriaText = consent.consentimientoCategoria || 'General';
    const categoriaWidth = pdf.getTextWidth(categoriaText) + 8;
    pdf.roundedRect(pageWidth - margin - categoriaWidth, 20, categoriaWidth, 7, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(categoriaText, pageWidth - margin - categoriaWidth + 4, 25);

    yPosition = 45;

    // ========== TITULO DEL CONSENTIMIENTO ==========
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...darkColor);
    const title = consent.consentimientoNombre.toUpperCase();
    const titleLines = pdf.splitTextToSize(title, contentWidth);
    pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += (titleLines.length * 7) + 5;

    pdf.setFontSize(11);
    pdf.setTextColor(...grayColor);
    pdf.text('CONSENTIMIENTO INFORMADO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // ========== DATOS EN COLUMNAS ==========
    // Caja de datos del paciente
    const boxHeight = 28;
    const boxWidth = (contentWidth - 5) / 2;

    // Box Paciente
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, yPosition, boxWidth, boxHeight, 3, 3, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...primaryColor);
    pdf.text('PACIENTE', margin + 4, yPosition + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...darkColor);
    pdf.text(consent.pacienteNombre, margin + 4, yPosition + 13);
    pdf.setTextColor(...grayColor);
    pdf.setFontSize(8);
    pdf.text(`DNI: ${consent.pacienteDni}`, margin + 4, yPosition + 19);
    if (consent.pacienteDomicilio) {
      const domicilio = consent.pacienteDomicilio.length > 35
        ? consent.pacienteDomicilio.substring(0, 35) + '...'
        : consent.pacienteDomicilio;
      pdf.text(domicilio, margin + 4, yPosition + 24);
    }

    // Box Doctor
    const doctorBoxX = margin + boxWidth + 5;
    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(34, 197, 94);
    pdf.roundedRect(doctorBoxX, yPosition, boxWidth, boxHeight, 3, 3, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(34, 197, 94);
    pdf.text('PROFESIONAL', doctorBoxX + 4, yPosition + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...darkColor);
    pdf.text(`Dr(a). ${consent.doctorNombre}`, doctorBoxX + 4, yPosition + 13);
    pdf.setTextColor(...grayColor);
    pdf.setFontSize(8);
    pdf.text(`COP: ${consent.doctorCop}`, doctorBoxX + 4, yPosition + 19);

    yPosition += boxHeight + 10;

    // ========== CONTENIDO DEL CONSENTIMIENTO ==========
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...darkColor);
    pdf.text('DECLARACION Y CONSENTIMIENTO', margin, yPosition);
    yPosition += 8;

    // Linea decorativa
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 8;

    // Contenido
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...darkColor);

    const plainText = this.htmlToPlainText(consent.documentoHTML);
    const textLines = pdf.splitTextToSize(plainText, contentWidth);

    for (const line of textLines) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin + 10;
        // Header minimo en paginas siguientes
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, 3, 'F');
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    }

    // ========== OBSERVACIONES ==========
    if (consent.observaciones) {
      yPosition += 8;
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        yPosition = margin + 10;
      }

      pdf.setFillColor(254, 249, 195);
      pdf.setDrawColor(234, 179, 8);
      pdf.setLineWidth(0.3);
      const obsLines = pdf.splitTextToSize(consent.observaciones, contentWidth - 8);
      const obsBoxHeight = 10 + (obsLines.length * 5);
      pdf.roundedRect(margin, yPosition, contentWidth, obsBoxHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(161, 98, 7);
      pdf.text('OBSERVACIONES:', margin + 4, yPosition + 6);

      pdf.setFont('helvetica', 'normal');
      let obsY = yPosition + 12;
      for (const line of obsLines) {
        pdf.text(line, margin + 4, obsY);
        obsY += 5;
      }
      yPosition += obsBoxHeight + 8;
    }

    // ========== SECCION DE FIRMAS ==========
    yPosition += 10;
    if (yPosition > pageHeight - 70) {
      pdf.addPage();
      yPosition = margin + 10;
    }

    // Linea separadora
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    pdf.setLineDashPattern([], 0);
    yPosition += 10;

    const signatureWidth = (contentWidth - 30) / 2;
    const signatureStartY = yPosition;

    // Firma del paciente (izquierda)
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(margin, signatureStartY, signatureWidth + 10, 45, 3, 3, 'FD');

    if (consent.firmaPaciente) {
      try {
        pdf.addImage(consent.firmaPaciente, 'PNG', margin + 15, signatureStartY + 3, 50, 22);
      } catch (e) {
        // Si falla, continuar
      }
    }

    pdf.setDrawColor(...darkColor);
    pdf.setLineWidth(0.3);
    pdf.line(margin + 5, signatureStartY + 30, margin + signatureWidth + 5, signatureStartY + 30);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...darkColor);
    pdf.text('Firma del Paciente', margin + (signatureWidth + 10) / 2, signatureStartY + 36, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...grayColor);
    pdf.text(consent.pacienteNombre, margin + (signatureWidth + 10) / 2, signatureStartY + 41, { align: 'center' });

    // Firma del doctor (derecha)
    const doctorSignX = margin + signatureWidth + 20;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(doctorSignX, signatureStartY, signatureWidth + 10, 45, 3, 3, 'FD');

    if (consent.firmaDoctor) {
      try {
        pdf.addImage(consent.firmaDoctor, 'PNG', doctorSignX + 15, signatureStartY + 3, 50, 22);
      } catch (e) {
        // Si falla, continuar
      }
    }

    pdf.line(doctorSignX + 5, signatureStartY + 30, doctorSignX + signatureWidth + 5, signatureStartY + 30);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...darkColor);
    pdf.text('Firma del Profesional', doctorSignX + (signatureWidth + 10) / 2, signatureStartY + 36, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...grayColor);
    pdf.text(`${consent.doctorNombre}`, doctorSignX + (signatureWidth + 10) / 2, signatureStartY + 41, { align: 'center' });

    // ========== PIE DE PAGINA ==========
    // Linea decorativa inferior
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `Documento generado el ${new Date().toLocaleDateString('es-PE')} | Sistema MyDent`,
      pageWidth / 2,
      pageHeight - 3,
      { align: 'center' }
    );

    return pdf;
  }

  /**
   * Convierte HTML a texto plano
   */
  private static htmlToPlainText(html: string): string {
    // Crear elemento temporal para extraer texto
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Reemplazar <br> y </p> con saltos de linea
    let text = temp.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ');

    // Remover todas las etiquetas HTML restantes
    temp.innerHTML = text;
    text = temp.textContent || temp.innerText || '';

    // Limpiar espacios multiples y lineas vacias
    text = text
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/  +/g, ' ')
      .trim();

    return text;
  }

  /**
   * Imprime un consentimiento abriendo el PDF en una nueva ventana
   */
  static async printConsent(consent: SignedConsent): Promise<void> {
    try {
      const pdf = await this.generatePDFAsync(consent);
      // Abrir PDF en nueva ventana para imprimir
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');

      if (!printWindow) {
        // Si no se puede abrir ventana, descargar directamente
        pdf.save(`consentimiento-${consent.pacienteDni}.pdf`);
        throw new Error('No se pudo abrir la ventana. El PDF se descargó automáticamente.');
      }

      // Limpiar URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error('Error al imprimir:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al imprimir el consentimiento');
    }
  }

  /**
   * Genera el nombre de archivo para un consentimiento
   */
  static generateFileName(consent: SignedConsent): string {
    return `consentimiento-${consent.consentimientoNombre.toLowerCase().replace(/\s+/g, '-')}-${consent.pacienteDni}`;
  }
}
