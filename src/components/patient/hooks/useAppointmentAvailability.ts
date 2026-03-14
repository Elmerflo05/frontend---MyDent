import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import type { User as UserType, Specialty } from '@/types';
import type { AppointmentFormData } from './useAppointmentForm';
import { specialtiesApi } from '@/services/api/specialtiesApi';

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
  availableSpecialties: Specialty[];
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
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);

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

  // Cargar especialidades desde el backend cuando cambia la sede
  // Usa el endpoint que filtra por doctores con HORARIOS configurados en la sede
  useEffect(() => {
    if (!formData.sedeId) {
      setAvailableSpecialties([]);
      return;
    }

    const loadSpecialties = async () => {
      try {
        const branchId = parseInt(formData.sedeId, 10);
        if (isNaN(branchId)) {
          setAvailableSpecialties([]);
          return;
        }

        const apiSpecialties = await specialtiesApi.getSpecialtiesByBranch(branchId);

        // Mapear de formato API { specialty_id, specialty_name } a formato frontend { id, name }
        const mapped: Specialty[] = apiSpecialties.map(s => ({
          id: s.specialty_id.toString(),
          name: s.specialty_name
        }));

        setAvailableSpecialties(mapped);
      } catch {
        setAvailableSpecialties([]);
      }
    };

    loadSpecialties();
  }, [formData.sedeId]);

  // Resetear specialtyId cuando las especialidades disponibles cambian (ej: cambio de sede)
  useEffect(() => {
    if (formData.specialtyId) {
      const specialtyExists = availableSpecialties.some(
        (spec) => spec.id === formData.specialtyId
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

  // Filtrar doctores por sede y especialidad seleccionadas
  const availableDoctors = useMemo(() => {
    if (!formData.sedeId || !formData.specialtyId) return [];

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
