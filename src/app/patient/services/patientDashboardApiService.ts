/**
 * Servicio de integración con API real para Patient Dashboard
 * Reemplaza el uso de Mock Data por llamadas al backend
 *
 * IMPORTANTE: Este servicio NO debe ser reutilizado en otros módulos.
 * Es específico para el módulo de Patient Dashboard.
 */

import { appointmentsApi } from '@/services/api/appointmentsApi';
import { treatmentPlansApi } from '@/services/api/treatmentPlansApi';
import { promotionsApi } from '@/services/api/promotionsApi';
import { incomePaymentsApi } from '@/services/api/incomePaymentsApi';
import { formatDateToYMD } from '@/utils/dateUtils';

/**
 * Estados de cita que representan citas activas/pendientes para el paciente
 * Basado en la tabla appointment_statuses:
 *
 * INCLUIDOS (citas que el paciente debe ver como "próximas"):
 * - 0: PENDING_APPROVAL (Pendiente de Aprobación)
 * - 1: SCHEDULED (Programada)
 * - 2: CONFIRMED (Confirmada)
 * - 3: IN_PROGRESS (En Proceso)
 * - 7: RESCHEDULED (Reprogramada)
 *
 * EXCLUIDOS (estados finales, no deben aparecer como próximas):
 * - 4: COMPLETED (Completada)
 * - 5: CANCELLED (Cancelada)
 * - 6: NO_SHOW (No Asistió)
 * - 8: REJECTED (Rechazada)
 */
const ACTIVE_APPOINTMENT_STATES = [0, 1, 2, 3, 7];

/**
 * Interface para estadísticas del dashboard
 */
export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedTreatments: number;
  pendingPayments: number;
  totalVisits: number;
}

/**
 * Interface para cita próxima
 */
export interface UpcomingAppointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  specialty: string;
  location: string;
  status: 'confirmed' | 'pending';
}

/**
 * Interface para actividad reciente
 */
export interface RecentActivity {
  id: string;
  type: 'appointment' | 'payment' | 'treatment' | 'prescription';
  description: string;
  date: Date;
  status: 'success' | 'pending' | 'warning';
}

/**
 * Interface para promoción (simplificada)
 */
export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const PatientDashboardApiService = {
  /**
   * Carga las estadísticas del dashboard del paciente
   */
  async loadDashboardStats(patientId: number): Promise<DashboardStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener todas las citas del paciente (activas: estados 0,1,2,3)
      const appointmentsResponse = await appointmentsApi.getAppointments({
        patient_id: patientId,
        limit: 100
      });

      // Filtrar citas de hoy (estados activos)
      const todayAppointments = appointmentsResponse.data.filter(apt => {
        const aptDateStr = apt.appointment_date.split('T')[0];
        const todayStr = formatDateToYMD(today);
        const isToday = aptDateStr === todayStr;
        const isActive = ACTIVE_APPOINTMENT_STATES.includes(apt.appointment_status_id);
        return isToday && isActive;
      }).length;

      // Filtrar citas próximas (futuras, estados activos)
      const upcomingAppointments = appointmentsResponse.data.filter(apt => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const aptDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        const isFuture = aptDate >= tomorrow;
        const isActive = ACTIVE_APPOINTMENT_STATES.includes(apt.appointment_status_id);
        return isFuture && isActive;
      }).length;

      // Obtener tratamientos completados
      const treatmentsResponse = await treatmentPlansApi.getTreatmentPlans({
        patient_id: patientId,
        status_id: 3, // Completed
        limit: 100
      });

      const completedTreatments = treatmentsResponse.data.length;

      // Obtener pagos pendientes usando incomePaymentsApi
      const debtsResponse = await incomePaymentsApi.getPatientPendingDebts(patientId);
      // Filtrar solo deudas con balance > 0 y estados pendiente/parcial
      const pendingPayments = debtsResponse.debts.filter(
        d => (d.payment_status === 'pending' || d.payment_status === 'partial')
          && parseFloat(String(d.balance || 0)) > 0
      ).length;

      // Total de visitas (citas completadas - status 4)
      const allAppointmentsResponse = await appointmentsApi.getAppointments({
        patient_id: patientId,
        appointment_status_id: 4, // Completed
        limit: 1000
      });

      const totalVisits = allAppointmentsResponse.data.length;

      const stats: DashboardStats = {
        todayAppointments,
        upcomingAppointments,
        completedTreatments,
        pendingPayments,
        totalVisits
      };

      return stats;
    } catch (error) {
      // Return default stats on error
      return {
        todayAppointments: 0,
        upcomingAppointments: 0,
        completedTreatments: 0,
        pendingPayments: 0,
        totalVisits: 0
      };
    }
  },

  /**
   * Carga las citas próximas del paciente (incluyendo las de hoy)
   */
  async loadUpcomingAppointments(patientId: number, limit: number = 5): Promise<UpcomingAppointment[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await appointmentsApi.getAppointments({
        patient_id: patientId,
        limit: 50
      });

      const upcomingAppointments: UpcomingAppointment[] = response.data
        .filter(apt => {
          // IMPORTANTE: Parsear fecha sin problemas de timezone
          const dateOnly = (apt.appointment_date || '').split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          const aptDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          // Incluir citas de hoy y futuras con estados activos
          const isTodayOrFuture = aptDate >= today;
          const isActive = ACTIVE_APPOINTMENT_STATES.includes(apt.appointment_status_id);
          return isTodayOrFuture && isActive;
        })
        .sort((a, b) => {
          // Parsear fechas para ordenamiento
          const dateA = (a.appointment_date || '').split('T')[0];
          const dateB = (b.appointment_date || '').split('T')[0];
          return dateA.localeCompare(dateB);
        })
        .slice(0, limit)
        .map(apt => {
          // IMPORTANTE: Parsear fecha sin problemas de timezone
          const dateOnly = (apt.appointment_date || '').split('T')[0];
          const [year, month, day] = dateOnly.split('-').map(Number);
          const aptDate = new Date(year, month - 1, day);
          // Usar start_time (campo real del backend)
          const timeStr = apt.start_time || apt.appointment_time || '00:00:00';
          const timeParts = timeStr.split(':');
          const hours = timeParts[0]?.padStart(2, '0') || '00';
          const minutes = timeParts[1]?.padStart(2, '0') || '00';

          // Mapear estados correctamente
          let status: 'confirmed' | 'pending' = 'pending';
          if (apt.appointment_status_id === 2) status = 'confirmed'; // Confirmada
          else if (apt.appointment_status_id === 1) status = 'confirmed'; // Programada (también se considera confirmada para el paciente)

          return {
            id: apt.appointment_id?.toString() || '',
            date: aptDate,
            time: `${hours}:${minutes}`,
            doctorName: apt.dentist_name ? `Dr. ${apt.dentist_name}` : 'Doctor no asignado',
            specialty: apt.specialty_name || 'Odontología General',
            location: apt.branch_name || 'Sede principal',
            status
          };
        });

      return upcomingAppointments;
    } catch (error) {
      return [];
    }
  },

  /**
   * Carga la actividad reciente del paciente
   */
  async loadRecentActivity(patientId: number, limit: number = 10): Promise<RecentActivity[]> {
    try {

      const activities: RecentActivity[] = [];

      // Obtener citas recientes completadas
      const appointmentsResponse = await appointmentsApi.getAppointments({
        patient_id: patientId,
        appointment_status_id: 3, // Completed
        limit: 5
      });

      appointmentsResponse.data.slice(0, 3).forEach(apt => {
        // IMPORTANTE: Parsear fecha sin problemas de timezone
        const dateOnly = (apt.appointment_date || '').split('T')[0];
        const [year, month, day] = dateOnly.split('-').map(Number);
        const aptDate = new Date(year, month - 1, day);

        activities.push({
          id: `apt-${apt.appointment_id}`,
          type: 'appointment',
          description: `Cita completada con ${apt.dentist_name || 'Doctor'}`,
          date: aptDate,
          status: 'success'
        });
      });

      // Obtener pagos recientes
      const paymentsResponse = await paymentsApi.getPayments({
        patient_id: patientId,
        limit: 5
      });

      paymentsResponse.data.slice(0, 3).forEach(payment => {
        const status = payment.payment_status === 'paid' ? 'success' :
                      payment.payment_status === 'pending' ? 'warning' : 'pending';

        activities.push({
          id: `pay-${payment.payment_id}`,
          type: 'payment',
          description: `Pago ${payment.payment_status === 'paid' ? 'realizado' : 'pendiente'} - S/. ${payment.amount_paid || 0}`,
          date: new Date(payment.payment_date),
          status: status as 'success' | 'pending' | 'warning'
        });
      });

      // Ordenar por fecha descendente
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());

      const limitedActivities = activities.slice(0, limit);

      return limitedActivities;
    } catch (error) {
      return [];
    }
  },

  /**
   * Carga las promociones activas de la clínica
   */
  async loadActivePromotions(branchId?: number): Promise<Promotion[]> {
    try {

      const response = await promotionsApi.getActivePromotions(branchId);

      const promotions: Promotion[] = response.map(promo => ({
        id: promo.promotion_id?.toString() || '',
        title: promo.promotion_name || '',
        description: promo.description || '',
        code: `PROMO-${promo.promotion_id}`,
        discountType: (promo.discount_type === 'percentage' ? 'percentage' : 'fixed_amount') as 'percentage' | 'fixed_amount',
        discountValue: promo.discount_value || 0,
        startDate: promo.start_date || '',
        endDate: promo.end_date || '',
        isActive: promo.is_active !== false
      }));

      return promotions;
    } catch (error) {
      return [];
    }
  },

  /**
   * Obtiene información completa del paciente
   */
  async getPatientInfo(patientId: number) {
    try {
      const response = await patientsApi.getPatientById(patientId);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
