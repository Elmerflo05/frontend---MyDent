import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import type { User as UserType } from '@/types';
import type { AppointmentFormData } from './useAppointmentForm';

/**
 * Hook para manejar disponibilidad de citas, slots y doctores
 */

export interface TimeSlotWithDoctors {
  time: string;
  doctors: Array<{
    id: string;
    name: string;
    specialties: string[];
  }>;
}

interface UseAppointmentAvailabilityProps {
  isOpen: boolean;
  formData: AppointmentFormData;
  setFormData: Dispatch<SetStateAction<AppointmentFormData>>;
  doctors: UserType[];
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

interface UseAppointmentAvailabilityReturn {
  availableSlots: TimeSlotWithDoctors[];
  setAvailableSlots: Dispatch<SetStateAction<TimeSlotWithDoctors[]>>;
  loadingSlots: boolean;
  selectedSlotDoctors: Array<{ id: string; name: string; specialties: string[] }>;
  setSelectedSlotDoctors: Dispatch<SetStateAction<Array<{ id: string; name: string; specialties: string[] }>>>;
  loadAvailableSlots: () => Promise<void>;
  availableSpecialties: any[];
  availableDoctors: UserType[];
}

export const useAppointmentAvailability = ({
  isOpen,
  formData,
  setFormData,
  doctors,
  errors,
  setErrors
}: UseAppointmentAvailabilityProps): UseAppointmentAvailabilityReturn => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlotWithDoctors[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotDoctors, setSelectedSlotDoctors] = useState<Array<{ id: string; name: string; specialties: string[] }>>([]);

  // Cargar horarios disponibles basados en fecha, sede y especialidad
  const loadAvailableSlots = async () => {
    // Solo cargar si tenemos fecha, sede y especialidad
    if (!formData.date || !formData.sedeId || !formData.specialtyId) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const { getAvailableSlotsBySpecialty } = await import('@/services/doctorAvailability');

      const slots = await getAvailableSlotsBySpecialty(
        formData.date,
        formData.sedeId,
        formData.specialtyId,
        formData.duration
      );

      setAvailableSlots(slots);
    } catch (error) {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Cargar horarios cuando cambien los criterios de búsqueda
  useEffect(() => {
    if (isOpen && formData.date && formData.sedeId && formData.specialtyId) {
      loadAvailableSlots();
    }
  }, [isOpen, formData.date, formData.sedeId, formData.specialtyId, formData.duration]);

  // ✅ MEMOIZADO: Obtener especialidades disponibles en la sede seleccionada
  const availableSpecialties = useMemo(() => {
    if (!formData.sedeId) {
      return [];
    }

    // ✅ CORREGIDO: Filtrar doctores que tengan acceso a esta sede (usando sedesAcceso)
    const doctorsInSede = doctors.filter(doctor =>
      doctor.sedesAcceso?.includes(formData.sedeId) ||
      doctor.sedeId === formData.sedeId // Fallback para compatibilidad
    );

    // ✅ CORREGIDO: Obtener especialidades únicas como objetos (no solo nombres)
    const specialtiesMap = new Map();
    doctorsInSede.forEach(doctor => {
      doctor.specialties?.forEach(spec => {
        if (!specialtiesMap.has(spec.id)) {
          specialtiesMap.set(spec.id, spec);
        }
      });
    });

    const result = Array.from(specialtiesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [formData.sedeId, doctors]);

  // Resetear specialtyId cuando las especialidades disponibles cambian (ej: cambio de sede)
  useEffect(() => {
    if (formData.specialtyId) {
      const specialtyExists = availableSpecialties.some(
        (spec: any) => spec.id === formData.specialtyId
      );
      if (!specialtyExists) {
        setFormData(prev => ({ ...prev, specialtyId: '', time: '', doctorId: '' }));
        setAvailableSlots([]);
        setSelectedSlotDoctors([]);
        if (errors.specialtyId) {
          setErrors(prev => ({ ...prev, specialtyId: '' }));
        }
      }
    }
  }, [availableSpecialties, formData.specialtyId]);

  // ✅ MEMOIZADO: Filtrar doctores por sede y especialidad seleccionadas
  const availableDoctors = useMemo(() => {
    if (!formData.sedeId || !formData.specialtyId) return [];

    // ✅ CORREGIDO: Filtrar por sedesAcceso y specialty.id
    const filteredDoctors = doctors.filter(doctor =>
      (doctor.sedesAcceso?.includes(formData.sedeId) || doctor.sedeId === formData.sedeId) &&
      doctor.specialties?.some(spec => spec.id === formData.specialtyId)
    );

    // Eliminar duplicados por ID
    const uniqueDoctors = filteredDoctors.filter((doctor, index, arr) =>
      arr.findIndex(d => d.id === doctor.id) === index
    );

    return uniqueDoctors;
  }, [formData.sedeId, formData.specialtyId, doctors]);

  // Efecto para limpiar el doctor seleccionado cuando cambia la sede o especialidad
  useEffect(() => {
    if (formData.doctorId) {
      const doctorExists = availableDoctors.some(doctor => doctor.id === formData.doctorId);

      if (!doctorExists) {
        setFormData(prev => ({ ...prev, doctorId: '' }));
        if (errors.doctorId) {
          setErrors(prev => ({ ...prev, doctorId: '' }));
        }
      }
    }
  }, [availableDoctors, formData.doctorId]);

  return {
    availableSlots,
    setAvailableSlots,
    loadingSlots,
    selectedSlotDoctors,
    setSelectedSlotDoctors,
    loadAvailableSlots,
    availableSpecialties,
    availableDoctors
  };
};
