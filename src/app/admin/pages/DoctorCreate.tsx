import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  CreditCard,
  Building2,
  Stethoscope,
  Clock,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import useSedeStore from '@/store/sedeStore';
import type { User as UserType, DoctorSchedule, Sede } from '@/types';
import { dentistsApi } from '@/services/api/dentistsApi';
import { specialtiesApi, type Specialty } from '@/services/api/specialtiesApi';

interface DoctorFormData {
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  licenseNumber: string;
  specialties: number[];
  selectedBranches: string[]; // Changed from sedeId to selectedBranches array
  commissionPercentage: number;
}

interface ScheduleDay {
  dayOfWeek: number;
  dayName: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BranchSchedules {
  [branchId: string]: ScheduleDay[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const createEmptySchedule = (): ScheduleDay[] =>
  DAYS_OF_WEEK.map(day => ({
    dayOfWeek: day.value,
    dayName: day.label,
    enabled: false,
    startTime: '09:00',
    endTime: '17:00'
  }));

const DoctorCreate = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const isEditMode = Boolean(doctorId);

  const { user } = useAuth();
  const { obtenerSedesActivas, cargarSedesDesdeDB } = useSedeStore();
  const sedes = obtenerSedesActivas();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [formData, setFormData] = useState<DoctorFormData>({
    email: '',
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    licenseNumber: '',
    specialties: [],
    selectedBranches: [],
    commissionPercentage: 50
  });

  // Map of schedules per branch
  const [branchSchedules, setBranchSchedules] = useState<BranchSchedules>({});
  const [activeBranchTab, setActiveBranchTab] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scheduleConflicts, setScheduleConflicts] = useState<string[]>([]);

  // Cargar especialidades y sedes al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [specialtiesResponse, sedesResponse] = await Promise.all([
          specialtiesApi.getSpecialties(),
          cargarSedesDesdeDB()
        ]);

        setSpecialties(specialtiesResponse.data);

        if (isEditMode && doctorId) {
          await loadDoctorData();
        }
      } catch (error) {
        toast.error('Error al cargar datos iniciales');
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [cargarSedesDesdeDB, isEditMode, doctorId]);

  const loadDoctorData = async () => {
    try {
      const response = await dentistsApi.getDentistById(parseInt(doctorId!));
      const dentistData = response.data;

      if (!dentistData) {
        toast.error('Médico no encontrado');
        navigate('/admin/doctors');
        return;
      }

      const specialtyIds = dentistData.specialties && Array.isArray(dentistData.specialties)
        ? dentistData.specialties.map((s: any) => s.specialty_id)
        : dentistData.specialty_id
        ? [dentistData.specialty_id]
        : [];

      const branchesAccess = dentistData.branches_access || [];

      setFormData({
        firstName: dentistData.first_name || '',
        lastName: dentistData.last_name || '',
        dni: dentistData.profile?.dni || '',
        email: dentistData.email || '',
        phone: dentistData.phone || '',
        licenseNumber: dentistData.professional_license || '',
        specialties: specialtyIds,
        selectedBranches: branchesAccess.map((id: number) => id.toString()),
        commissionPercentage: 50
      });

      // Load schedules grouped by branch (siempre inicializar aunque no haya horarios)
      const schedulesByBranch: BranchSchedules = {};
      const schedules = dentistData.schedules || [];

      branchesAccess.forEach((branchId: number) => {
        const branchIdStr = branchId.toString();
        const branchSchedule = DAYS_OF_WEEK.map(day => {
          const existingSchedule = schedules.find(
            (s: any) => s.day_of_week === day.value && s.branch_id === branchId
          );
          if (existingSchedule) {
            return {
              dayOfWeek: day.value,
              dayName: day.label,
              enabled: existingSchedule.is_available !== false,
              startTime: existingSchedule.start_time || '09:00',
              endTime: existingSchedule.end_time || '17:00'
            };
          }
          return {
            dayOfWeek: day.value,
            dayName: day.label,
            enabled: false,
            startTime: '09:00',
            endTime: '17:00'
          };
        });
        schedulesByBranch[branchIdStr] = branchSchedule;
      });

      setBranchSchedules(schedulesByBranch);
      if (branchesAccess.length > 0) {
        setActiveBranchTab(branchesAccess[0].toString());
      }
    } catch (error) {
      console.error('Error al cargar médico:', error);
      toast.error('Error al cargar los datos del médico');
      navigate('/admin/doctors');
    }
  };

  // Validate schedule overlaps across branches
  const validateScheduleOverlaps = (): boolean => {
    const conflicts: string[] = [];
    const allEnabledSchedules: Array<{
      branchId: string;
      branchName: string;
      dayOfWeek: number;
      dayName: string;
      startTime: string;
      endTime: string;
    }> = [];

    // Collect all enabled schedules from all branches
    formData.selectedBranches.forEach(branchId => {
      const branchSchedule = branchSchedules[branchId] || [];
      const branch = sedes.find(s => s.id === branchId);

      branchSchedule
        .filter(day => day.enabled)
        .forEach(day => {
          allEnabledSchedules.push({
            branchId,
            branchName: branch?.nombre || 'Sede desconocida',
            dayOfWeek: day.dayOfWeek,
            dayName: day.dayName,
            startTime: day.startTime,
            endTime: day.endTime
          });
        });
    });

    // Check for overlaps
    for (let i = 0; i < allEnabledSchedules.length; i++) {
      for (let j = i + 1; j < allEnabledSchedules.length; j++) {
        const schedule1 = allEnabledSchedules[i];
        const schedule2 = allEnabledSchedules[j];

        // Same day of week
        if (schedule1.dayOfWeek === schedule2.dayOfWeek) {
          const start1 = parseTime(schedule1.startTime);
          const end1 = parseTime(schedule1.endTime);
          const start2 = parseTime(schedule2.startTime);
          const end2 = parseTime(schedule2.endTime);

          // Check for time overlap
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push(
              `${schedule1.dayName}: ${schedule1.branchName} (${schedule1.startTime}-${schedule1.endTime}) se traslapa con ${schedule2.branchName} (${schedule2.startTime}-${schedule2.endTime})`
            );
          }
        }
      }
    }

    setScheduleConflicts(conflicts);
    return conflicts.length === 0;
  };

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'El número de colegiatura es requerido';
    }

    if (formData.selectedBranches.length === 0) {
      newErrors.selectedBranches = 'Debe seleccionar al menos una sede';
    }

    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Debe seleccionar al menos una especialidad';
    }

    // Validate that each selected branch has at least one scheduled day
    const branchesWithoutSchedule: string[] = [];
    formData.selectedBranches.forEach(branchId => {
      const schedule = branchSchedules[branchId] || [];
      const hasSchedule = schedule.some(day => day.enabled);
      if (!hasSchedule) {
        const branch = sedes.find(s => s.id === branchId);
        branchesWithoutSchedule.push(branch?.nombre || 'Sede desconocida');
      }
    });

    if (branchesWithoutSchedule.length > 0) {
      newErrors.schedule = `Debe configurar horarios para: ${branchesWithoutSchedule.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permite números y máximo 9 caracteres
    if (value === '' || /^\d{0,9}$/.test(value)) {
      setFormData({ ...formData, phone: value });
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedBranches.includes(branchId);
      const newSelectedBranches = isSelected
        ? prev.selectedBranches.filter(id => id !== branchId)
        : [...prev.selectedBranches, branchId];

      // Initialize schedule for newly selected branch
      if (!isSelected && !branchSchedules[branchId]) {
        setBranchSchedules(prevSchedules => ({
          ...prevSchedules,
          [branchId]: createEmptySchedule()
        }));
      }

      // Set active tab to first selected branch
      if (newSelectedBranches.length > 0 && (isSelected || activeBranchTab === '')) {
        setActiveBranchTab(newSelectedBranches[0]);
      }

      return { ...prev, selectedBranches: newSelectedBranches };
    });

    // Clear schedule conflicts when branches change
    setScheduleConflicts([]);
  };

  const handleSpecialtyToggle = (specialtyId: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialtyId)
        ? prev.specialties.filter(id => id !== specialtyId)
        : [...prev.specialties, specialtyId]
    }));
  };

  const handleScheduleToggle = (branchId: string, dayOfWeek: number) => {
    setBranchSchedules(prev => ({
      ...prev,
      [branchId]: (prev[branchId] || createEmptySchedule()).map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, enabled: !day.enabled }
          : day
      )
    }));
    setScheduleConflicts([]);
  };

  const handleScheduleTimeChange = (
    branchId: string,
    dayOfWeek: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setBranchSchedules(prev => ({
      ...prev,
      [branchId]: (prev[branchId] || createEmptySchedule()).map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, [field]: value }
          : day
      )
    }));
    setScheduleConflicts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    // Validate schedule overlaps
    if (!validateScheduleOverlaps()) {
      toast.error('Hay conflictos de horarios entre sedes');
      return;
    }

    setLoading(true);

    try {
      // Collect all schedules from all branches
      const allSchedules = formData.selectedBranches.flatMap(branchId => {
        const schedule = branchSchedules[branchId] || [];
        return schedule
          .filter(day => day.enabled)
          .map(day => ({
            branch_id: parseInt(branchId),
            day_of_week: day.dayOfWeek,
            start_time: day.startTime,
            end_time: day.endTime,
            is_active: true
          }));
      });

      if (isEditMode && doctorId) {
        const updateData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          dni: formData.dni,
          phone: formData.phone,
          mobile: formData.phone,
          branches_access: formData.selectedBranches.map(id => parseInt(id)),
          professional_license: formData.licenseNumber,
          specialties: formData.specialties,
          schedules: allSchedules
        };

        await dentistsApi.updateDentist(parseInt(doctorId), updateData);
        toast.success('Médico actualizado exitosamente');
      } else {
        await dentistsApi.createCompleteDentist({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          dni: formData.dni,
          password: formData.dni,
          phone: formData.phone.trim(),
          mobile: formData.phone.trim(),
          branches_access: formData.selectedBranches.map(id => parseInt(id)),
          professional_license: formData.licenseNumber,
          specialties: formData.specialties,
          schedules: allSchedules
        });

        toast.success('Médico agregado exitosamente');
      }

      navigate('/admin/doctors');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isEditMode ? 'Error al actualizar el médico' : 'Error al crear el médico');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/doctors')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Médicos
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Médico' : 'Agregar Nuevo Médico'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? 'Modifique la información del médico y configure horarios por sede'
            : 'Complete la información del médico y configure horarios por cada sede asignada'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Juan"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Pérez"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DNI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={8}
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.dni ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345678"
                />
              </div>
              {errors.dni && <p className="mt-1 text-sm text-red-600">{errors.dni}</p>}
              <p className="mt-1 text-xs text-gray-500">El DNI se usará como contraseña por defecto</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="999 999 999"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="doctor@ejemplo.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>
        </motion.div>

        {/* Información Profesional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Información Profesional</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Colegiatura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="COP-12345"
                />
                {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sedes Asignadas <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {sedes.map(sede => (
                    <label
                      key={sede.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedBranches.includes(sede.id)}
                        onChange={() => handleBranchToggle(sede.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{sede.nombre}</span>
                    </label>
                  ))}
                </div>
                {errors.selectedBranches && <p className="mt-1 text-sm text-red-600">{errors.selectedBranches}</p>}
                {sedes.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">
                    No se encontraron sedes activas. Por favor, cree una sede primero en Gestión de Sedes.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de Comisión (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionPercentage}
                  onChange={(e) => setFormData({ ...formData, commissionPercentage: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Porcentaje de comisión sobre tratamientos realizados</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidades <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {specialties.map(specialty => (
                  <label
                    key={specialty.specialty_id}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty.specialty_id)}
                      onChange={() => handleSpecialtyToggle(specialty.specialty_id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{specialty.specialty_name}</span>
                  </label>
                ))}
              </div>
              {errors.specialties && <p className="mt-1 text-sm text-red-600">{errors.specialties}</p>}
            </div>
          </div>
        </motion.div>

        {/* Configuración de Horarios por Sede */}
        {formData.selectedBranches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Horarios por Sede</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure los horarios de atención para cada sede asignada. El sistema valida automáticamente que no haya traslapes.
            </p>

            {/* Schedule Conflicts Warning */}
            {scheduleConflicts.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">Conflictos de Horario Detectados</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {scheduleConflicts.map((conflict, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <X className="w-3 h-3 mt-1 flex-shrink-0" />
                          <span>{conflict}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Branch Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
              {formData.selectedBranches.map(branchId => {
                const branch = sedes.find(s => s.id === branchId);
                return (
                  <button
                    key={branchId}
                    type="button"
                    onClick={() => setActiveBranchTab(branchId)}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                      activeBranchTab === branchId
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {branch?.nombre || 'Sede desconocida'}
                  </button>
                );
              })}
            </div>

            {/* Schedule for Active Branch */}
            {activeBranchTab && (
              <div className="space-y-3">
                {(branchSchedules[activeBranchTab] || createEmptySchedule()).map(day => (
                  <div
                    key={day.dayOfWeek}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      day.enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={() => handleScheduleToggle(activeBranchTab, day.dayOfWeek)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{day.dayName}</span>
                    </label>

                    {day.enabled && (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Desde:</label>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => handleScheduleTimeChange(activeBranchTab, day.dayOfWeek, 'startTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Hasta:</label>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => handleScheduleTimeChange(activeBranchTab, day.dayOfWeek, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {errors.schedule && <p className="mt-2 text-sm text-red-600">{errors.schedule}</p>}
          </motion.div>
        )}

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/doctors')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : isEditMode ? 'Actualizar Médico' : 'Guardar Médico'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorCreate;
