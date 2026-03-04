import { CheckCircle, Clock, Calendar, XCircle } from 'lucide-react';
import type { Patient, TreatmentPlan, User as UserType } from '@/types';

/**
 * Calculate patient's age from birth date
 */
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get gender label in Spanish
 */
export const getGenderLabel = (gender: string): string => {
  switch (gender) {
    case 'M': return 'Masculino';
    case 'F': return 'Femenino';
    case 'O': return 'Otro';
    default: return 'No especificado';
  }
};

/**
 * Get appointment status information (label, color, icon)
 */
export const getAppointmentStatusInfo = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'in_progress':
      return { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock };
    case 'scheduled':
      return { label: 'Programado', color: 'bg-yellow-100 text-yellow-800', icon: Calendar };
    case 'confirmed':
      return { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'cancelled':
      return { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle };
    case 'no_show':
      return { label: 'No Asistió', color: 'bg-gray-100 text-gray-800', icon: XCircle };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
};

/**
 * Get payment status information (label, color)
 */
export const getPaymentStatusInfo = (status: string) => {
  switch (status) {
    case 'paid':
      return { label: 'Pagado', color: 'text-green-600' };
    case 'partial':
      return { label: 'Parcial', color: 'text-yellow-600' };
    case 'pending':
      return { label: 'Pendiente', color: 'text-red-600' };
    default:
      return { label: status, color: 'text-gray-600' };
  }
};

/**
 * Get treatment plan status information (label, color)
 */
export const getTreatmentStatusInfo = (status: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Completado', color: 'bg-green-100 text-green-800' };
    case 'in_progress':
      return { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' };
    case 'approved':
      return { label: 'Aprobado', color: 'bg-purple-100 text-purple-800' };
    case 'draft':
      return { label: 'Borrador', color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Get doctor name from doctors map
 */
export const getDoctorName = (doctorId: string | number | undefined, doctorsMap: Record<string, UserType>): string => {
  if (!doctorId) return 'Doctor no disponible';
  const doctor = doctorsMap[doctorId.toString()];
  if (!doctor) return 'Doctor no disponible';
  // El doctorsMap puede tener diferentes estructuras:
  // - name: string (desde patientApiService)
  // - profile.firstName + profile.lastName (estructura legacy)
  if (doctor.name) {
    return doctor.name;
  }
  if ((doctor as any).profile?.firstName) {
    return `${(doctor as any).profile.firstName} ${(doctor as any).profile.lastName}`;
  }
  return 'Doctor no disponible';
};

/**
 * Calculate patient statistics
 */
export const getPatientStats = (patients: Patient[]) => {
  const total = patients.length;
  const male = patients.filter(p => p.gender === 'M').length;
  const female = patients.filter(p => p.gender === 'F').length;
  const thisMonth = patients.filter(p => {
    const patientDate = new Date(p.createdAt);
    const now = new Date();
    return patientDate.getMonth() === now.getMonth() &&
           patientDate.getFullYear() === now.getFullYear();
  }).length;

  return { total, male, female, thisMonth };
};

/**
 * Check if patient has a specific treatment type
 */
export const patientHasTreatmentType = (
  patientId: string,
  treatmentType: 'ortodoncia' | 'rehabilitacion' | 'implantes',
  allTreatmentPlans: TreatmentPlan[]
): boolean => {
  const patientPlans = allTreatmentPlans.filter(plan => plan.patientId === patientId);

  if (patientPlans.length === 0) return false;

  // Keywords for each treatment type
  const keywords = {
    ortodoncia: ['ortodoncia', 'orthodont', 'brackets', 'frenillos', 'alineadores', 'aparato'],
    rehabilitacion: ['rehabilitación', 'rehabilitacion', 'prótesis', 'protesis', 'corona', 'puente', 'restauración'],
    implantes: ['implante', 'implantes', 'implant', 'oseointegr']
  };

  const searchKeywords = keywords[treatmentType];

  // Search in all procedures of all patient plans
  return patientPlans.some(plan =>
    plan.procedures.some(procedure =>
      searchKeywords.some(keyword =>
        procedure.name.toLowerCase().includes(keyword.toLowerCase())
      )
    )
  );
};
