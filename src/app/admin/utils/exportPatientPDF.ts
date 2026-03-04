/**
 * Exportador de PDF - Atención Integral del Paciente
 * Formato empresarial profesional con branding MyDent
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Patient, TreatmentPlan, SignedConsent, PatientContract, User as UserType } from '@/types';

// Interface para appointments del backend (puede tener formato diferente al tipo Appointment)
interface BackendAppointment {
  appointment_id?: number;
  id?: string;
  appointment_date?: string;
  date?: Date;
  start_time?: string;
  time?: string;
  dentist_id?: number;
  doctorId?: string;
  status_code?: string;
  appointment_status_name?: string;
  status?: string;
  reason?: string;
  notes?: string;
  service?: string;
  services?: string[];
  diagnosis?: string;
  treatment?: string;
}

interface ExportPatientPDFProps {
  patient: Patient;
  appointments: BackendAppointment[];
  treatmentPlans: TreatmentPlan[];
  consents: SignedConsent[];
  contracts: PatientContract[];
  doctorsMap: Record<string, UserType>;
}

// Colores corporativos MyDent
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],      // Azul principal
  primaryDark: [29, 78, 216] as [number, number, number],  // Azul oscuro
  secondary: [16, 185, 129] as [number, number, number],   // Verde
  accent: [139, 92, 246] as [number, number, number],      // Violeta
  dark: [31, 41, 55] as [number, number, number],          // Gris oscuro
  gray: [107, 114, 128] as [number, number, number],       // Gris medio
  lightGray: [243, 244, 246] as [number, number, number],  // Gris claro
  white: [255, 255, 255] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],     // Amarillo
  danger: [239, 68, 68] as [number, number, number],       // Rojo
};

// Helpers

/**
 * Formatea una fecha string (YYYY-MM-DD) a formato dd/MM/yyyy sin desfase de timezone
 */
const formatConsentDateWithoutTimezone = (dateString: string | Date): string => {
  // Si es un objeto Date, convertir a string ISO
  const strDate = dateString instanceof Date ? dateString.toISOString() : String(dateString || '');

  // Parsear formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  const match = strDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const day = match[3];
    const month = match[2];
    const year = match[1];
    return `${day}/${month}/${year}`;
  }

  // Fallback: intentar con date-fns si no se pudo parsear
  try {
    return format(new Date(), 'dd/MM/yyyy');
  } catch {
    return 'Fecha no disponible';
  }
};

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getDoctorName = (doctorId: string | number | undefined, doctorsMap: Record<string, UserType>): string => {
  if (!doctorId) return 'No asignado';
  const id = doctorId.toString();
  const doctor = doctorsMap[id];
  if (!doctor) return 'No asignado';
  // Intentar obtener el nombre de diferentes formas según la estructura
  const firstName = doctor.profile?.firstName || doctor.firstName || (doctor as any).first_name || (doctor as any).name?.split(' ')[0] || '';
  const lastName = doctor.profile?.lastName || doctor.lastName || (doctor as any).last_name || (doctor as any).name?.split(' ').slice(1).join(' ') || '';
  if (!firstName && !lastName && (doctor as any).name) {
    return `Dr(a). ${(doctor as any).name}`.trim();
  }
  return `Dr(a). ${firstName} ${lastName}`.trim() || 'No asignado';
};

const getGenderLabel = (gender: string): string => {
  const labels: Record<string, string> = {
    male: 'Masculino',
    female: 'Femenino',
    other: 'Otro',
    M: 'Masculino',
    F: 'Femenino',
    O: 'Otro'
  };
  return labels[gender] || gender || 'No especificado';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    pending: 'Pendiente',
    pending_approval: 'Pendiente de Aprobación',
    in_progress: 'En Progreso',
    no_show: 'No Asistió',
    rejected: 'Rechazada',
    rescheduled: 'Reprogramada'
  };
  return labels[status] || status;
};

// Cargar imagen como base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
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
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = url;
  });
};

// Función principal de exportación
export const exportPatientIntegralPDF = async (props: ExportPatientPDFProps) => {
  // Validar que el paciente exista
  if (!props.patient) {
    throw new Error('No se proporcionó información del paciente');
  }

  const patient = props.patient;
  const appointments = props.appointments || [];
  const treatmentPlans = props.treatmentPlans || [];
  const consents = props.consents || [];
  const contracts = props.contracts || [];
  const doctorsMap = props.doctorsMap || {};

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 0;

  // Intentar cargar el logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64('/mydentLogo.png');
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // Helper para nueva página si es necesario
  const checkNewPage = (neededSpace: number = 25): boolean => {
    if (yPosition + neededSpace > pageHeight - 30) {
      doc.addPage();
      addHeader();
      return true;
    }
    return false;
  };

  // Header corporativo con logo
  const addHeader = () => {
    yPosition = 0;
    const headerHeight = 45; // Más alto para mejor presentación

    // Fondo del header con gradiente simulado (dos rectángulos)
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Línea decorativa inferior (más gruesa)
    doc.setFillColor(...COLORS.secondary);
    doc.rect(0, headerHeight, pageWidth, 4, 'F');

    // Logo - proporciones correctas (el logo es horizontal ~3:1)
    const logoWidth = 42;
    const logoHeight = 16;
    const logoX = margin;
    const logoY = (headerHeight - logoHeight) / 2; // Centrado verticalmente

    if (logoBase64) {
      try {
        // Fondo blanco redondeado para el logo
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(logoX - 2, logoY - 2, logoWidth + 4, logoHeight + 4, 3, 3, 'F');

        // Agregar el logo con proporciones correctas
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (e) {
        // Si falla, mostrar texto estilizado
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('MYDENT', logoX, headerHeight / 2 + 3);
      }
    } else {
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('MYDENT', logoX, headerHeight / 2 + 3);
    }

    // Contenido del header - desplazado a la derecha del logo
    const contentStartX = logoX + logoWidth + 12; // Espacio después del logo

    // Título del documento - más grande y prominente
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIA CLÍNICA INTEGRAL', contentStartX, 18);

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Odontológica', contentStartX, 28);

    // Fecha de generación - alineada a la derecha
    doc.setFontSize(8);
    doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, contentStartX, 38);

    yPosition = 55; // Ajustado para el header más alto
  };

  // Footer corporativo
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15;

    // Línea separadora
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Información de la empresa
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.text('MYDENT - Sistema de Gestión Odontológica | Documento confidencial', margin, footerY);

    // Número de página
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // Sección con título estilizado
  const addSectionTitle = (title: string, icon?: string) => {
    checkNewPage(20);

    // Fondo de la sección
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 10, 2, 2, 'F');

    // Texto del título
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon ? icon + ' ' : ''}${title.toUpperCase()}`, margin + 5, yPosition + 7);

    yPosition += 15;
  };

  // Subsección
  const addSubsectionTitle = (title: string) => {
    checkNewPage(15);

    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 8, 1, 1, 'F');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPosition + 5.5);

    yPosition += 12;
  };

  // Información en dos columnas
  const addInfoRow = (label: string, value: string, highlight = false) => {
    checkNewPage(8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text(label, margin + 3, yPosition);

    doc.setFont('helvetica', 'normal');
    const textColor = highlight ? COLORS.primary : COLORS.dark;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const maxWidth = pageWidth - margin - 70;
    const splitValue = doc.splitTextToSize(value || 'No especificado', maxWidth);
    doc.text(splitValue, 70, yPosition);

    yPosition += Math.max(6, splitValue.length * 5);
  };

  // Card para elementos de lista
  const addCard = (content: () => void) => {
    const startY = yPosition;

    // Guardar posición para dibujar el fondo después
    content();

    // El fondo se dibuja implícitamente por el contenido
  };

  // ==================== PÁGINA 1: DATOS DEL PACIENTE ====================
  addHeader();

  // Extraer propiedades con compatibilidad backend/frontend
  const patientAnyData = patient as any;

  // Debug: ver todas las propiedades del paciente relacionadas con dirección
  console.log('[exportPatientPDF] Datos de dirección del paciente:', {
    address: patient.address,
    'patientAnyData.address': patientAnyData.address,
    district: patientAnyData.district,
    province: patientAnyData.province,
    department: patientAnyData.department,
    // Ver todas las keys del objeto
    allKeys: Object.keys(patient)
  });

  const patientName = `${patient.firstName || patientAnyData.first_name || ''} ${patient.lastName || patientAnyData.last_name || ''}`.trim() || 'Nombre no especificado';
  const patientDni = patient.dni || patientAnyData.identification_number || 'No especificado';
  const patientBirthDate = patient.birthDate || patientAnyData.birth_date;
  const patientGender = patient.gender || patientAnyData.gender_id || 'O';
  const patientEmail = patient.email || 'No especificado';
  const patientPhone = patient.phone || patientAnyData.mobile || 'No especificado';

  // Construir dirección completa desde las diferentes propiedades
  const addressParts = [
    patient.address || patientAnyData.address || '',
    patientAnyData.district || '',
    patientAnyData.province || '',
    patientAnyData.department || ''
  ].filter(part => part && part.trim() !== '');
  const patientAddress = addressParts.length > 0 ? addressParts.join(', ') : 'No especificada';

  // Ficha del paciente destacada
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 25, 3, 3, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(patientName, margin + 5, yPosition + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  const ageText = patientBirthDate ? `${calculateAge(patientBirthDate)} años` : 'Edad no especificada';
  doc.text(`DNI: ${patientDni} | ${ageText} | ${getGenderLabel(patientGender)}`, margin + 5, yPosition + 18);

  // Badge de estado
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(pageWidth - margin - 35, yPosition + 5, 30, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTIVO', pageWidth - margin - 20, yPosition + 10.5, { align: 'center' });

  yPosition += 32;

  // Información Personal
  addSectionTitle('Información Personal');

  if (patientBirthDate) {
    addInfoRow('Fecha de Nacimiento:', format(new Date(patientBirthDate), "dd 'de' MMMM 'de' yyyy", { locale: es }));
  } else {
    addInfoRow('Fecha de Nacimiento:', 'No especificada');
  }
  addInfoRow('Correo Electrónico:', patientEmail);
  addInfoRow('Teléfono:', patientPhone);
  addInfoRow('Dirección:', patientAddress);

  yPosition += 5;

  // Historia Médica
  const medicalHistory = patient.medicalHistory || {
    bloodType: null,
    allergies: [],
    conditions: [],
    medications: [],
    notes: null
  };

  addSectionTitle('Historia Médica');

  addInfoRow('Tipo de Sangre:', medicalHistory.bloodType || 'No especificado', true);

  // Alergias
  yPosition += 3;
  addSubsectionTitle('Alergias');
  const allergies = medicalHistory.allergies || [];
  if (allergies.length > 0) {
    allergies.forEach((allergy) => {
      checkNewPage(6);
      doc.setFillColor(254, 243, 199); // Amarillo claro
      doc.roundedRect(margin + 3, yPosition - 3, pageWidth - (margin * 2) - 6, 6, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.warning);
      doc.setFont('helvetica', 'normal');
      doc.text(`⚠ ${allergy}`, margin + 6, yPosition);
      yPosition += 8;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text('Sin alergias registradas', margin + 5, yPosition);
    yPosition += 6;
  }

  // Condiciones Médicas
  yPosition += 3;
  addSubsectionTitle('Condiciones Médicas');
  const conditions = medicalHistory.conditions || [];
  if (conditions.length > 0) {
    conditions.forEach((condition) => {
      checkNewPage(6);
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.text(`• ${condition}`, margin + 5, yPosition);
      yPosition += 6;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text('Sin condiciones médicas registradas', margin + 5, yPosition);
    yPosition += 6;
  }

  // Medicamentos
  yPosition += 3;
  addSubsectionTitle('Medicamentos Actuales');
  const medications = medicalHistory.medications || [];
  if (medications.length > 0) {
    medications.forEach((medication) => {
      checkNewPage(6);
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.text(`💊 ${medication}`, margin + 5, yPosition);
      yPosition += 6;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text('Sin medicamentos registrados', margin + 5, yPosition);
    yPosition += 6;
  }

  // Notas médicas
  if (medicalHistory.notes) {
    yPosition += 3;
    addSubsectionTitle('Observaciones Médicas');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    const splitNotes = doc.splitTextToSize(medicalHistory.notes, pageWidth - (margin * 2) - 10);
    doc.text(splitNotes, margin + 5, yPosition);
    yPosition += splitNotes.length * 5 + 5;
  }

  // Contacto de Emergencia
  // Puede venir como objeto o como string del backend
  const emergencyContact = patient.emergencyContact;
  const patientAny = patient as any;
  if (emergencyContact || patientAny.emergency_contact_name || patientAny.emergencyContactName) {
    yPosition += 5;
    addSectionTitle('Contacto de Emergencia');

    // Manejar ambos formatos: objeto o propiedades separadas
    if (typeof emergencyContact === 'object' && emergencyContact !== null) {
      addInfoRow('Nombre:', emergencyContact.name || 'No especificado');
      addInfoRow('Relación:', emergencyContact.relationship || 'No especificada');
      addInfoRow('Teléfono:', emergencyContact.phone || 'No especificado');
    } else {
      // Formato de propiedades separadas del backend
      addInfoRow('Nombre:', emergencyContact || patientAny.emergency_contact_name || patientAny.emergencyContactName || 'No especificado');
      addInfoRow('Relación:', patientAny.emergency_contact_relationship || patientAny.emergencyContactRelationship || 'No especificada');
      addInfoRow('Teléfono:', patientAny.emergency_contact_phone || patientAny.emergencyPhone || 'No especificado');
    }
  }

  // ==================== PÁGINA 2: HISTORIAL DE CITAS ====================
  doc.addPage();
  addHeader();

  addSectionTitle('Historial de Atenciones');

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Total de atenciones registradas: ${appointments.length}`, margin + 5, yPosition);
  yPosition += 8;

  if (appointments.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay atenciones registradas para este paciente.', margin + 5, yPosition);
    yPosition += 10;
  } else {
    // Tabla de citas - usar propiedades del backend
    const appointmentData = appointments.map((apt, index) => {
      // Obtener fecha (puede venir como appointment_date o date)
      const dateValue = apt.appointment_date || apt.date;
      const formattedDate = dateValue ? format(new Date(dateValue), 'dd/MM/yyyy') : '-';

      // Obtener hora (puede venir como start_time o time)
      const timeValue = apt.start_time || apt.time || '-';

      // Obtener doctor ID (puede venir como dentist_id o doctorId)
      const doctorIdValue = apt.dentist_id || apt.doctorId;

      // Obtener estado (puede venir como status_code, appointment_status_name o status)
      const statusValue = apt.status_code || apt.appointment_status_name || apt.status || 'pending';

      // Obtener servicio/notas (puede venir como reason, notes, service o services)
      const serviceValue = apt.reason || apt.service || (apt.services && apt.services.length > 0 ? apt.services.join(', ') : '') || apt.notes || '-';

      return [
        (index + 1).toString(),
        formattedDate,
        timeValue,
        getDoctorName(doctorIdValue, doctorsMap),
        getStatusLabel(statusValue),
        serviceValue
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Fecha', 'Hora', 'Doctor', 'Estado', 'Servicio/Notas']],
      body: appointmentData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 18 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30 },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Detalles de citas (si hay espacio)
  appointments.slice(0, 5).forEach((appointment, index) => {
    if (checkNewPage(35)) {
      addSectionTitle('Historial de Atenciones (continuación)');
    }

    // Obtener propiedades usando nombres del backend
    const dateValue = appointment.appointment_date || appointment.date;
    const timeValue = appointment.start_time || appointment.time || 'No especificada';
    const doctorIdValue = appointment.dentist_id || appointment.doctorId;

    // Card de cita
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 28, 2, 2, 'F');

    // Número y fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`Atención #${index + 1}`, margin + 5, yPosition + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    if (dateValue) {
      doc.text(format(new Date(dateValue), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es }), margin + 40, yPosition + 7);
    } else {
      doc.text('Fecha no especificada', margin + 40, yPosition + 7);
    }

    // Detalles
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`Doctor: ${getDoctorName(doctorIdValue, doctorsMap)}`, margin + 5, yPosition + 14);
    doc.text(`Hora: ${timeValue}`, margin + 90, yPosition + 14);

    if (appointment.diagnosis) {
      doc.text(`Diagnóstico: ${appointment.diagnosis.substring(0, 60)}${appointment.diagnosis.length > 60 ? '...' : ''}`, margin + 5, yPosition + 21);
    }
    if (appointment.treatment) {
      doc.text(`Tratamiento: ${appointment.treatment.substring(0, 60)}${appointment.treatment.length > 60 ? '...' : ''}`, margin + 5, yPosition + 26);
    }

    yPosition += 32;
  });

  // ==================== PÁGINA 3: PLANES Y DOCUMENTOS ====================
  doc.addPage();
  addHeader();

  // Planes de Tratamiento
  addSectionTitle('Planes de Tratamiento');

  if (treatmentPlans.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay planes de tratamiento registrados.', margin + 5, yPosition);
    yPosition += 15;
  } else {
    treatmentPlans.forEach((plan, index) => {
      checkNewPage(30);

      // Extraer propiedades con compatibilidad backend/frontend
      const planAny = plan as any;
      const planName = plan.title || planAny.name || planAny.plan_name || 'Sin nombre';
      const planStatus = plan.status || planAny.plan_status || 'Pendiente';
      const planCost = plan.totalCost || planAny.estimatedCost || planAny.total_cost || planAny.estimated_cost || 0;
      const planDescription = plan.description || planAny.diagnosis || planAny.notes || '';
      const planCreatedAt = plan.createdAt || planAny.created_at || planAny.date_time_registration;

      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 22, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.accent);
      doc.text(`Plan #${index + 1} - ${planName}`, margin + 5, yPosition + 7);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      if (planCreatedAt) {
        doc.text(`Creado: ${format(new Date(planCreatedAt), 'dd/MM/yyyy')}`, margin + 5, yPosition + 13);
      }
      doc.text(`Estado: ${planStatus}`, margin + 60, yPosition + 13);

      if (planCost > 0) {
        doc.setTextColor(...COLORS.secondary);
        doc.setFont('helvetica', 'bold');
        doc.text(`Costo: S/. ${planCost.toFixed(2)}`, margin + 120, yPosition + 13);
      }

      if (planDescription) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        const descText = planDescription.length > 80 ? `${planDescription.substring(0, 80)}...` : planDescription;
        doc.text(`Descripción: ${descText}`, margin + 5, yPosition + 19);
      }

      yPosition += 26;
    });
  }

  yPosition += 5;

  // Consentimientos Firmados
  addSectionTitle('Consentimientos Firmados');

  if (consents.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray);
    doc.setFont('helvetica', 'italic');
    doc.text('No hay consentimientos firmados.', margin + 5, yPosition);
    yPosition += 15;
  } else {
    const consentData = consents.map((consent, index) => {
      const consentAny = consent as any;
      // Manejar propiedades con compatibilidad backend/frontend
      const consentName = consent.consentimientoNombre || consentAny.template_name || consentAny.consent_name || 'Sin nombre';
      const consentCategory = consent.consentimientoCategoria || consentAny.template_category || consentAny.category || 'General';
      const doctorName = consent.doctorNombre || consentAny.signed_by || consentAny.doctor_name || 'No especificado';
      const consentDate = consent.fechaConsentimiento || consentAny.consent_date || consentAny.date_time_registration || '';

      return [
        (index + 1).toString(),
        consentName,
        consentCategory,
        doctorName,
        formatConsentDateWithoutTimezone(consentDate),
        '✓ Firmado'
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Consentimiento', 'Categoría', 'Doctor', 'Fecha', 'Estado']],
      body: consentData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.accent,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 20, halign: 'center', textColor: COLORS.secondary },
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Contratos
  if (contracts.length > 0) {
    checkNewPage(30);
    addSectionTitle('Contratos');

    contracts.forEach((contract, index) => {
      checkNewPage(15);

      doc.setFillColor(...COLORS.lightGray);
      doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 12, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text(`${index + 1}. ${contract.contractName}`, margin + 5, yPosition + 7);

      // Estado del contrato
      const statusColors: Record<string, [number, number, number]> = {
        signed: COLORS.secondary,
        pending: COLORS.warning,
        rejected: COLORS.danger,
      };
      const statusLabels: Record<string, string> = {
        signed: 'Firmado',
        pending: 'Pendiente',
        rejected: 'Rechazado',
      };

      doc.setFillColor(...(statusColors[contract.status] || COLORS.gray));
      doc.roundedRect(pageWidth - margin - 25, yPosition + 2, 20, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.white);
      doc.text(statusLabels[contract.status] || contract.status, pageWidth - margin - 15, yPosition + 6, { align: 'center' });

      yPosition += 15;
    });
  }

  // ==================== AGREGAR FOOTERS ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Guardar el PDF
  const patientDniForFilename = patient.dni || (patient as any).identification_number || 'SinDNI';
  const fileName = `historia-clinica-${patientDniForFilename}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
  doc.save(fileName);
};
