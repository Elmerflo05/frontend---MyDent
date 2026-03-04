import type { Appointment, User, Sede } from '@/types';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  sedeName: string;
  sedeAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  specialty: string;
  notes?: string;
}

/**
 * Servicio de envío de emails
 *
 * NOTA: Esta es una implementación simulada para desarrollo.
 * En producción, esto debería conectarse a un servicio real de email
 * como SendGrid, AWS SES, Mailgun, etc.
 */
export class EmailService {
  /**
   * Envía un email de confirmación de cita al paciente
   */
  static async sendAppointmentConfirmation(
    appointment: any,
    patient: User,
    doctor: User,
    sede: Sede
  ): Promise<boolean> {
    try {
      const appointmentDate = new Date(appointment.date);

      const emailData: AppointmentEmailData = {
        patientName: `${patient.profile.firstName} ${patient.profile.lastName}`,
        patientEmail: patient.email,
        doctorName: `Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`,
        sedeName: sede.nombre,
        sedeAddress: sede.direccion,
        appointmentDate: appointmentDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        appointmentTime: appointmentDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        specialty: doctor.profile.specialties?.[0] || 'Odontología General',
        notes: appointment.notes
      };

      const html = this.generateAppointmentConfirmationTemplate(emailData);

      // Simular envío de email
      console.log(`
Estimado(a) ${emailData.patientName},

¡Su cita ha sido solicitada exitosamente!

DETALLES DE LA CITA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha: ${emailData.appointmentDate}
⏰ Hora: ${emailData.appointmentTime}
👨‍⚕️ Doctor: ${emailData.doctorName}
🏥 Especialidad: ${emailData.specialty}
📍 Sede: ${emailData.sedeName}
   ${emailData.sedeAddress}
${emailData.notes ? `📝 Notas: ${emailData.notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE:
• Su cita está pendiente de confirmación por parte de nuestro equipo
• Recibirá una confirmación final una vez revisado su pago
• Por favor llegue 10 minutos antes de su cita
• Traiga su DNI y voucher de pago

Si tiene alguna pregunta, no dude en contactarnos.

Saludos cordiales,
Centro Odontológico
      `);

      // En producción, aquí iría la llamada real al servicio de email:
      // await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ to: emailData.patientEmail, subject: '...', html })
      // });

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera el template HTML para el email de confirmación de cita
   */
  private static generateAppointmentConfirmationTemplate(data: AppointmentEmailData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Cita</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f7f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
    }
    .appointment-card {
      background: #f0fdfa;
      border: 2px solid #14b8a6;
      border-radius: 10px;
      padding: 25px;
      margin: 25px 0;
    }
    .appointment-card h2 {
      color: #0d9488;
      font-size: 20px;
      margin: 0 0 20px;
      font-weight: 600;
    }
    .detail-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #ccfbf1;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-icon {
      font-size: 20px;
      margin-right: 12px;
      width: 24px;
    }
    .detail-label {
      font-weight: 600;
      color: #0d9488;
      margin-right: 8px;
    }
    .detail-value {
      color: #1f2937;
    }
    .important-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 20px;
      margin: 25px 0;
    }
    .important-box h3 {
      color: #d97706;
      font-size: 18px;
      margin: 0 0 15px;
      font-weight: 600;
    }
    .important-box ul {
      margin: 0;
      padding-left: 20px;
      color: #78350f;
    }
    .important-box li {
      margin: 8px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .footer strong {
      color: #0d9488;
    }
    .status-badge {
      display: inline-block;
      background: #fef3c7;
      color: #d97706;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🦷 Centro Odontológico</h1>
      <p>Confirmación de Cita</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Estimado(a) <strong>${data.patientName}</strong>,
      </div>

      <div class="message">
        ¡Su cita ha sido solicitada exitosamente! A continuación encontrará los detalles de su reserva:
      </div>

      <div class="status-badge">
        ⏳ Pendiente de confirmación
      </div>

      <!-- Appointment Details -->
      <div class="appointment-card">
        <h2>📋 Detalles de la Cita</h2>

        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span class="detail-label">Fecha:</span>
          <span class="detail-value">${data.appointmentDate}</span>
        </div>

        <div class="detail-row">
          <span class="detail-icon">⏰</span>
          <span class="detail-label">Hora:</span>
          <span class="detail-value">${data.appointmentTime}</span>
        </div>

        <div class="detail-row">
          <span class="detail-icon">👨‍⚕️</span>
          <span class="detail-label">Doctor:</span>
          <span class="detail-value">${data.doctorName}</span>
        </div>

        <div class="detail-row">
          <span class="detail-icon">🏥</span>
          <span class="detail-label">Especialidad:</span>
          <span class="detail-value">${data.specialty}</span>
        </div>

        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <span class="detail-label">Sede:</span>
          <span class="detail-value">${data.sedeName}</span>
        </div>

        <div class="detail-row">
          <span class="detail-icon">🗺️</span>
          <span class="detail-label">Dirección:</span>
          <span class="detail-value">${data.sedeAddress}</span>
        </div>

        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-icon">📝</span>
          <span class="detail-label">Notas:</span>
          <span class="detail-value">${data.notes}</span>
        </div>
        ` : ''}
      </div>

      <!-- Important Information -->
      <div class="important-box">
        <h3>⚠️ Información Importante</h3>
        <ul>
          <li>Su cita está <strong>pendiente de confirmación</strong> por parte de nuestro equipo</li>
          <li>Recibirá una <strong>confirmación final</strong> una vez revisado su pago</li>
          <li>Por favor llegue <strong>10 minutos antes</strong> de su cita</li>
          <li>Traiga su <strong>DNI</strong> y <strong>voucher de pago</strong></li>
        </ul>
      </div>

      <div class="message">
        Si tiene alguna pregunta o necesita modificar su cita, no dude en contactarnos.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Centro Odontológico</strong></p>
      <p>${data.sedeName}</p>
      <p>${data.sedeAddress}</p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Envía un email de confirmación cuando la cita es aprobada
   */
  static async sendAppointmentApproved(
    appointment: any,
    patient: User,
    doctor: User,
    sede: Sede
  ): Promise<boolean> {
    console.log('📧 [Futuro] Envío de email de cita aprobada:', {
      patient: patient.email,
      appointment: appointment.id
    });
    return true;
  }

  /**
   * Envía un email de recordatorio de cita
   */
  static async sendAppointmentReminder(
    appointment: any,
    patient: User,
    doctor: User,
    sede: Sede
  ): Promise<boolean> {
    console.log('📧 [Futuro] Envío de recordatorio de cita:', {
      patient: patient.email,
      appointment: appointment.id
    });
    return true;
  }

  /**
   * Envía un email de cancelación de cita
   */
  static async sendAppointmentCancelled(
    appointment: any,
    patient: User,
    reason?: string
  ): Promise<boolean> {
    console.log('📧 [Futuro] Envío de email de cita cancelada:', {
      patient: patient.email,
      appointment: appointment.id,
      reason
    });
    return true;
  }
}
