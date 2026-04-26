import {
  Stethoscope,
  Activity,
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock
} from 'lucide-react';

// Specialty types for filtering and display
export const SPECIALTIES = {
  general: { label: 'Odontología General', icon: Stethoscope, color: 'bg-blue-100 text-blue-800' },
  orthodontics: { label: 'Ortodoncia', icon: Activity, color: 'bg-purple-100 text-purple-800' },
  pediatric: { label: 'Odontopediatría', icon: Users, color: 'bg-pink-100 text-pink-800' },
  surgery: { label: 'Cirugía Oral', icon: UserCheck, color: 'bg-red-100 text-red-800' },
  cosmetic: { label: 'Estética Dental', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  endodontics: { label: 'Endodoncia', icon: Activity, color: 'bg-orange-100 text-orange-800' }
} as const;

export const CALENDAR_VIEWS = {
  month: { label: 'Mes', icon: Calendar },
  week: { label: 'Semana', icon: CalendarDays },
  day: { label: 'Día', icon: Clock }
} as const;

// Helper function to map doctor specialty label to specialty key
export const mapDoctorSpecialtyToKey = (doctorSpecialty: string): keyof typeof SPECIALTIES => {
  const specialtyMap: Record<string, keyof typeof SPECIALTIES> = {
    'Odontología General': 'general',
    'Ortodoncia': 'orthodontics',
    'Odontopediatría': 'pediatric',
    'Cirugía Oral': 'surgery',
    'Estética Dental': 'cosmetic',
    'Endodoncia': 'endodontics'
  };

  return specialtyMap[doctorSpecialty] || 'general';
};

// Helper to get specialty from doctor
export const getSpecialtyFromDoctor = (doctorId: string, doctors: any[]): keyof typeof SPECIALTIES => {
  const doctor = doctors.find(d => d.id === doctorId);
  const doctorSpecialty = doctor?.profile?.specialties?.[0];

  if (!doctorSpecialty) return 'general';

  return mapDoctorSpecialtyToKey(doctorSpecialty);
};

// Shape devuelto por getSpecialtyConfigFromAppointment (acepta especialidades de BD
// que no estén en el enum hardcodeado SPECIALTIES — etiqueta libre)
export interface SpecialtyConfig {
  label: string;
  icon: typeof Stethoscope;
  color: string;
}

// Resuelve la especialidad REAL registrada en la cita (specialty_name desde BD).
// Acepta tanto claves del enum SPECIALTIES (legacy) como nombres humanos
// ("Implantes", "Periodoncia", "Odontología General", etc.). Si la especialidad
// no coincide con el enum, devuelve un config genérico con el nombre real.
export const getSpecialtyConfigFromAppointment = (appointment: any): SpecialtyConfig => {
  const raw = appointment?.specialty || appointment?.specialty_name || '';

  if (!raw) {
    return { label: 'Sin especialidad', icon: Stethoscope, color: 'bg-slate-100 text-slate-700' };
  }

  // Caso 1: ya es una clave del enum (e.g. 'general', 'orthodontics')
  if (Object.prototype.hasOwnProperty.call(SPECIALTIES, raw)) {
    return SPECIALTIES[raw as keyof typeof SPECIALTIES];
  }

  // Caso 2: es un nombre humano del enum (e.g. 'Odontología General')
  const specialtyMap: Record<string, keyof typeof SPECIALTIES> = {
    'Odontología General': 'general',
    'Ortodoncia': 'orthodontics',
    'Odontopediatría': 'pediatric',
    'Cirugía Oral': 'surgery',
    'Estética Dental': 'cosmetic',
    'Endodoncia': 'endodontics'
  };
  const enumKey = specialtyMap[raw];
  if (enumKey) {
    return SPECIALTIES[enumKey];
  }

  // Caso 3: especialidad real de BD no representada en el enum (e.g. "Implantes").
  // Mostrar el nombre tal cual con un estilo neutro.
  return { label: raw, icon: Stethoscope, color: 'bg-blue-50 text-blue-700' };
};
