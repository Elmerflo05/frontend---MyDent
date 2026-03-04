import { jsPDF } from 'jspdf';
import type { AppointmentFormData } from '@/components/patient/hooks/useAppointmentForm';
import type { User as UserType } from '@/types';
import { PAYMENT_METHODS_DETAILED } from '@/constants/ui';

/**
 * Convierte una imagen a base64
 */
const getImageBase64 = async (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = imagePath;
  });
};

interface PDFData {
  formData: AppointmentFormData;
  user: UserType | null;
  doctorName: string;
  sedeName: string;
  specialtyName: string;
}

/**
 * Genera un PDF de confirmación de cita
 */
export const generateAppointmentPDF = async ({
  formData,
  user,
  doctorName,
  sedeName,
  specialtyName
}: PDFData): Promise<void> => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colores del tema
    const primaryColor = '#0891b2'; // teal-600
    const secondaryColor = '#06b6d4'; // cyan-500
    const textDark = '#1f2937';
    const textGray = '#6b7280';

    // Margen y posición inicial
    let yPos = 20;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // =============================================
    // HEADER - Logo y título
    // =============================================

    // Fondo del header (gradiente simulado con rectángulos)
    doc.setFillColor(8, 145, 178); // teal-600
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setFillColor(6, 182, 212); // cyan-500 más claro
    doc.rect(0, 40, pageWidth, 10, 'F');

    // Logo MyDent
    try {
      const logoBase64 = await getImageBase64('/mydentLogo.png');
      doc.addImage(logoBase64, 'PNG', marginLeft, 15, 40, 20);
    } catch (error) {
      console.error('Error cargando logo:', error);
      // Fallback: usar texto si el logo no carga
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Mydent', marginLeft, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('RED DENTAL', marginLeft, 32);
    }

    // Título del documento
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Confirmación de Cita', pageWidth - marginRight, 30, { align: 'right' });

    yPos = 60;

    // =============================================
    // INFORMACIÓN DEL PACIENTE
    // =============================================

    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(marginLeft, yPos, contentWidth, 35, 'F');

    yPos += 10;

    doc.setFontSize(14);
    doc.setTextColor(8, 145, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Paciente', marginLeft + 5, yPos);

    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');

    // Nombre
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user?.firstName || ''} ${user?.lastName || ''}`, marginLeft + 30, yPos);

    yPos += 6;

    // Email
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.email || '', marginLeft + 30, yPos);

    yPos += 6;

    // Teléfono
    if (user?.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono:', marginLeft + 5, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(user.phone, marginLeft + 30, yPos);
    }

    yPos += 15;

    // =============================================
    // DETALLES DE LA CITA
    // =============================================

    doc.setFillColor(240, 253, 250); // teal-50
    doc.rect(marginLeft, yPos, contentWidth, 60, 'F');

    yPos += 10;

    doc.setFontSize(14);
    doc.setTextColor(8, 145, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalles de la Cita', marginLeft + 5, yPos);

    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);

    // Fecha
    const formattedDate = formData.date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formattedDate, marginLeft + 30, yPos);

    yPos += 6;

    // Hora
    doc.setFont('helvetica', 'bold');
    doc.text('Hora:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formData.time, marginLeft + 30, yPos);

    yPos += 6;

    // Sede
    doc.setFont('helvetica', 'bold');
    doc.text('Sede:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(sedeName, marginLeft + 30, yPos);

    yPos += 6;

    // Especialidad
    doc.setFont('helvetica', 'bold');
    doc.text('Especialidad:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(specialtyName, marginLeft + 30, yPos);

    yPos += 6;

    // Doctor
    doc.setFont('helvetica', 'bold');
    doc.text('Doctor:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(doctorName, marginLeft + 30, yPos);

    yPos += 6;

    // Duración
    doc.setFont('helvetica', 'bold');
    doc.text('Duración:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formData.duration || 30} minutos`, marginLeft + 30, yPos);

    yPos += 15;

    // =============================================
    // INFORMACIÓN DE PAGO
    // =============================================

    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(marginLeft, yPos, contentWidth, 25, 'F');

    yPos += 10;

    doc.setFontSize(14);
    doc.setTextColor(8, 145, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Información de Pago', marginLeft + 5, yPos);

    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);

    // Método de pago
    const paymentMethod = PAYMENT_METHODS_DETAILED.find(m => m.id === formData.paymentMethod);
    doc.setFont('helvetica', 'bold');
    doc.text('Método de Pago:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(paymentMethod?.name || 'No especificado', marginLeft + 40, yPos);

    yPos += 6;

    // Monto
    doc.setFont('helvetica', 'bold');
    doc.text('Monto:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`S/ ${formData.price || '0.00'}`, marginLeft + 40, yPos);

    yPos += 15;

    // =============================================
    // NOTAS ADICIONALES
    // =============================================

    if (formData.notes) {
      doc.setFillColor(254, 252, 232); // yellow-50
      doc.rect(marginLeft, yPos, contentWidth, 20, 'F');

      yPos += 10;

      doc.setFontSize(12);
      doc.setTextColor(8, 145, 178);
      doc.setFont('helvetica', 'bold');
      doc.text('Notas', marginLeft + 5, yPos);

      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'normal');

      // Dividir notas en múltiples líneas si es necesario
      const splitNotes = doc.splitTextToSize(formData.notes, contentWidth - 10);
      doc.text(splitNotes, marginLeft + 5, yPos);

      yPos += splitNotes.length * 4 + 10;
    }

    // =============================================
    // INSTRUCCIONES
    // =============================================

    yPos += 5;

    doc.setFillColor(239, 246, 255); // blue-50
    doc.rect(marginLeft, yPos, contentWidth, 35, 'F');

    yPos += 8;

    doc.setFontSize(12);
    doc.setTextColor(8, 145, 178);
    doc.setFont('helvetica', 'bold');
    doc.text('Instrucciones Importantes', marginLeft + 5, yPos);

    yPos += 7;

    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');

    const instructions = [
      '• Por favor, llegar 10 minutos antes de tu cita',
      '• Traer tu DNI o documento de identidad',
      '• Si necesitas cancelar o reprogramar, contactarnos con 24 horas de anticipación',
      '• Para consultas, comunícate al +51 987 654 321'
    ];

    instructions.forEach((instruction) => {
      doc.text(instruction, marginLeft + 5, yPos);
      yPos += 5;
    });

    // =============================================
    // FOOTER
    // =============================================

    const footerY = pageHeight - 25;

    doc.setFillColor(8, 145, 178);
    doc.rect(0, footerY, pageWidth, 25, 'F');

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');

    doc.text('Mydent Red Dental', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('Av. Larco 345, Miraflores, Lima', pageWidth / 2, footerY + 13, { align: 'center' });
    doc.text('Tel: +51 987 654 321 | info@clinicadental.com', pageWidth / 2, footerY + 18, { align: 'center' });

    // Número de confirmación (basado en timestamp)
    const confirmationNumber = `CONF-${Date.now().toString().slice(-8)}`;
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº Confirmación: ${confirmationNumber}`, marginLeft, pageHeight - 5);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - marginRight, pageHeight - 5, { align: 'right' });

    // Guardar el PDF
    const fileName = `Cita_${formattedDate.replace(/ /g, '_')}_${formData.time.replace(':', '')}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('No se pudo generar el PDF de confirmación');
  }
};
