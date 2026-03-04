import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { User as UserType } from '@/types';
import { dentistsApi, type DentistData } from '@/services/api/dentistsApi';
import { pricingApi } from '@/services/api/pricingApi';
import { appointmentsApi } from '@/services/api/appointmentsApi';

/**
 * Hook para manejar la carga de datos iniciales de la cita
 */

interface UseAppointmentDataProps {
  isOpen: boolean;
  user: UserType | null;
}

interface PrimeraConsultaGratis {
  available: boolean;
  plan_name?: string;
  subscription_id?: number;
}

interface UseAppointmentDataReturn {
  doctors: UserType[];
  setDoctors: Dispatch<SetStateAction<UserType[]>>;
  isLoading: boolean;
  esClienteNuevo: boolean;
  setEsClienteNuevo: Dispatch<SetStateAction<boolean>>;
  tienePlanSalud: boolean;
  primeraConsultaGratis: PrimeraConsultaGratis | null;
}

export const useAppointmentData = ({
  isOpen,
  user
}: UseAppointmentDataProps): UseAppointmentDataReturn => {
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [esClienteNuevo, setEsClienteNuevo] = useState(true); // Por defecto cliente nuevo
  const [tienePlanSalud, setTienePlanSalud] = useState(false); // Por defecto sin plan
  const [primeraConsultaGratis, setPrimeraConsultaGratis] = useState<PrimeraConsultaGratis | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      checkHealthPlan();
      checkIfNewClient();
    }
  }, [isOpen, user]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      const dentistsData = await dentistsApi.getAllDentists();

      // Mapear DentistData a UserType usando dentist_id para FK en appointments
      const mappedDoctors: UserType[] = dentistsData.map((dentist: DentistData) => {
        const id = dentist.dentist_id?.toString() || dentist.user_id?.toString() || '';

        return {
        id: id,
        email: dentist.email,
        firstName: dentist.first_name,
        lastName: dentist.last_name,
        role: 'doctor',
        sedeId: dentist.branch_id?.toString() || null,
        sedesAcceso: dentist.branches_access?.map(b => b.toString()) || [],
        phone: dentist.phone || '',
        specialties: dentist.specialties?.map(s => ({
          id: s.specialty_id.toString(),
          name: s.specialty_name
        })) || [],
        profile: {
          firstName: dentist.first_name,
          lastName: dentist.last_name,
          dni: '',
          phone: dentist.phone || '',
          specialties: dentist.specialties?.map(s => s.specialty_name) || []
        },
        password: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
        };
      });

      setDoctors(mappedDoctors);
    } catch (error) {
      console.error('Error cargando doctores:', error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si el paciente tiene plan de salud activo y primera consulta gratis
  const checkHealthPlan = async () => {
    if (!user?.id) {
      setTienePlanSalud(false);
      setPrimeraConsultaGratis(null);
      return;
    }

    try {
      const patientId = parseInt(user.id, 10);
      if (isNaN(patientId)) {
        setTienePlanSalud(false);
        setPrimeraConsultaGratis(null);
        return;
      }

      const response = await pricingApi.getPatientCoverageSummary(patientId);
      if (response.success && response.data?.has_coverage) {
        setTienePlanSalud(true);
        // Guardar datos de primera consulta gratis
        const firstFree = response.data.first_free_consultation;
        if (firstFree) {
          setPrimeraConsultaGratis({
            available: firstFree.available === true,
            plan_name: firstFree.plan_name || response.data.plan?.plan_name,
            subscription_id: firstFree.subscription_id
          });
        } else {
          setPrimeraConsultaGratis({ available: false });
        }
      } else {
        setTienePlanSalud(false);
        setPrimeraConsultaGratis(null);
      }
    } catch (error) {
      console.error('Error verificando plan de salud:', error);
      setTienePlanSalud(false);
      setPrimeraConsultaGratis(null);
    }
  };

  /**
   * Verifica si el paciente es cliente nuevo (sin citas completadas/atendidas)
   * appointment_status_id: 3 = completada, 4 = atendida
   */
  const checkIfNewClient = async () => {
    if (!user?.id) {
      setEsClienteNuevo(true);
      return;
    }

    try {
      const patientId = parseInt(user.id, 10);
      if (isNaN(patientId)) {
        setEsClienteNuevo(true);
        return;
      }

      // Obtener citas del paciente
      const appointments = await appointmentsApi.getPatientAppointments(patientId);

      // Cliente nuevo si NO tiene citas con estado completada (3) o atendida (4)
      const completedAppointments = appointments.filter(
        (apt) => apt.appointment_status_id === 3 || apt.appointment_status_id === 4
      );

      const isNew = completedAppointments.length === 0;
      setEsClienteNuevo(isNew);

    } catch (error) {
      console.error('Error verificando tipo de cliente:', error);
      setEsClienteNuevo(true); // Por defecto nuevo si hay error
    }
  };

  return {
    doctors,
    setDoctors,
    isLoading,
    esClienteNuevo,
    setEsClienteNuevo,
    tienePlanSalud,
    primeraConsultaGratis
  };
};
