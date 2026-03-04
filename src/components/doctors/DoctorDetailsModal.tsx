/**
 * Modal de Detalles del Médico
 * Vista de solo lectura con diseño visual distintivo
 * Sigue la línea gráfica del aplicativo con gradientes y tarjetas informativas
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Building2,
  Stethoscope,
  Clock,
  Calendar,
  Edit,
  Shield,
  Award,
  MapPin,
  CheckCircle,
  XCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/common/Modal';
import { dentistsApi, type DentistData, type DentistScheduleData } from '@/services/api/dentistsApi';
import { DOCTOR_STATUS_CONFIG } from '@/constants/doctors';
import type { User as UserType } from '@/types';

interface DoctorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: UserType | null;
  branches: Array<{ id: string; nombre: string }>;
}

// Componente de tarjeta de información con tema de colores
const InfoCard = ({
  icon: Icon,
  title,
  children,
  theme = 'teal',
  className = ''
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  theme?: 'teal' | 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';
  className?: string;
}) => {
  const themes = {
    teal: {
      card: 'from-teal-50 to-cyan-50 border-teal-100 hover:border-teal-200',
      icon: 'from-teal-500 to-cyan-600',
      title: 'text-teal-900'
    },
    blue: {
      card: 'from-blue-50 to-sky-50 border-blue-100 hover:border-blue-200',
      icon: 'from-blue-500 to-blue-600',
      title: 'text-blue-900'
    },
    purple: {
      card: 'from-violet-50 to-purple-50 border-violet-100 hover:border-violet-200',
      icon: 'from-violet-500 to-purple-600',
      title: 'text-violet-900'
    },
    amber: {
      card: 'from-amber-50 to-yellow-50 border-amber-100 hover:border-amber-200',
      icon: 'from-amber-500 to-orange-500',
      title: 'text-amber-900'
    },
    emerald: {
      card: 'from-emerald-50 to-green-50 border-emerald-100 hover:border-emerald-200',
      icon: 'from-emerald-500 to-green-600',
      title: 'text-emerald-900'
    },
    rose: {
      card: 'from-rose-50 to-pink-50 border-rose-100 hover:border-rose-200',
      icon: 'from-rose-500 to-pink-600',
      title: 'text-rose-900'
    }
  };

  const t = themes[theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${t.card} rounded-2xl p-5 border transition-all duration-300 hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-gradient-to-br ${t.icon} rounded-xl p-2.5 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h4 className={`font-semibold ${t.title}`}>{title}</h4>
      </div>
      {children}
    </motion.div>
  );
};

// Componente de item de información
const InfoItem = ({
  icon: Icon,
  label,
  value,
  theme = 'teal'
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  theme?: 'teal' | 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';
}) => {
  const iconColors = {
    teal: 'text-teal-500',
    blue: 'text-blue-500',
    purple: 'text-violet-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500'
  };

  const labelColors = {
    teal: 'text-teal-600',
    blue: 'text-blue-600',
    purple: 'text-violet-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600'
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className="bg-white rounded-xl p-2 shadow-sm group-hover:shadow-md transition-shadow">
        <Icon className={`w-4 h-4 ${iconColors[theme]}`} />
      </div>
      <div>
        <p className={`text-xs font-medium ${labelColors[theme]}`}>{label}</p>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
};

// Días de la semana
const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'L' },
  { value: 2, label: 'Martes', short: 'M' },
  { value: 3, label: 'Miércoles', short: 'X' },
  { value: 4, label: 'Jueves', short: 'J' },
  { value: 5, label: 'Viernes', short: 'V' },
  { value: 6, label: 'Sábado', short: 'S' },
  { value: 0, label: 'Domingo', short: 'D' }
];

export const DoctorDetailsModal = ({
  isOpen,
  onClose,
  doctor,
  branches
}: DoctorDetailsModalProps) => {
  const navigate = useNavigate();
  const [dentistDetails, setDentistDetails] = useState<DentistData | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar detalles completos del médico incluyendo horarios
  useEffect(() => {
    const loadDentistDetails = async () => {
      if (!isOpen || !doctor?.id) return;

      setLoading(true);
      try {
        const response = await dentistsApi.getDentistById(parseInt(doctor.id));
        setDentistDetails(response.data);
      } catch (error) {
        console.error('Error al cargar detalles del médico:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDentistDetails();
  }, [isOpen, doctor?.id]);

  // Obtener nombre de sede por ID
  const getBranchName = (branchId: string | number) => {
    const branch = branches.find(b => b.id === branchId.toString());
    return branch?.nombre || `Sede #${branchId}`;
  };

  // Agrupar horarios por sede
  const schedulesByBranch = useMemo(() => {
    if (!dentistDetails?.schedules) return {};

    const grouped: Record<number, DentistScheduleData[]> = {};
    dentistDetails.schedules.forEach(schedule => {
      const branchId = schedule.branch_id || 0;
      if (!grouped[branchId]) {
        grouped[branchId] = [];
      }
      grouped[branchId].push(schedule);
    });
    return grouped;
  }, [dentistDetails?.schedules]);

  // Estado del médico
  const statusConfig = useMemo(() => {
    if (!doctor?.status) return null;
    return DOCTOR_STATUS_CONFIG[doctor.status as keyof typeof DOCTOR_STATUS_CONFIG];
  }, [doctor?.status]);

  if (!doctor) return null;

  const handleEdit = () => {
    onClose();
    navigate(`/admin/doctors/${doctor.id}/edit`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      closeOnEscape
      showCloseButton={false}
    >
      {/* Header con gradiente distintivo teal/cyan */}
      <div className="flex-shrink-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 px-6 py-6 rounded-t-xl relative overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar del médico */}
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30">
                {doctor.profile?.avatar ? (
                  <img
                    src={doctor.profile.avatar}
                    alt={`Dr. ${doctor.profile.firstName}`}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <Stethoscope className="w-8 h-8 text-white" />
                )}
              </div>
              {/* Indicador de estado */}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                doctor.status === 'active' ? 'bg-emerald-500' :
                doctor.status === 'suspended' ? 'bg-red-500' : 'bg-gray-400'
              }`}>
                {doctor.status === 'active' ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : (
                  <XCircle className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Dr. {doctor.profile.firstName} {doctor.profile.lastName}
              </h3>
              <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4" />
                {doctor.profile.licenseNumber || 'Sin colegiatura'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Badge de estado */}
        {statusConfig && (
          <div className="mt-4 flex justify-center">
            <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-white/95 shadow-lg ${statusConfig.textColor}`}>
              <span className="text-base">{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <Modal.Body className="bg-gradient-to-b from-gray-50/50 to-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Cargando detalles...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Información Personal */}
            <InfoCard icon={User} title="Información Personal" theme="teal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={User}
                  label="Nombre completo"
                  value={`Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}`}
                  theme="teal"
                />
                <InfoItem
                  icon={CreditCard}
                  label="DNI"
                  value={dentistDetails?.dni || dentistDetails?.profile?.dni || 'No registrado'}
                  theme="teal"
                />
                <InfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={doctor.profile.phone || 'No registrado'}
                  theme="teal"
                />
                <InfoItem
                  icon={Mail}
                  label="Correo electrónico"
                  value={doctor.email}
                  theme="teal"
                />
              </div>
            </InfoCard>

            {/* Información Profesional */}
            <InfoCard icon={Briefcase} title="Información Profesional" theme="purple">
              <div className="space-y-4">
                <InfoItem
                  icon={Award}
                  label="Número de Colegiatura"
                  value={dentistDetails?.professional_license || doctor.profile.licenseNumber || 'No registrado'}
                  theme="purple"
                />

                {/* Especialidades */}
                <div>
                  <p className="text-xs font-medium text-violet-600 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Especialidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doctor.profile.specialties && doctor.profile.specialties.length > 0 ? (
                      doctor.profile.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-200 shadow-sm"
                        >
                          <Stethoscope className="w-3 h-3" />
                          {typeof specialty === 'string' ? specialty : (specialty as any).specialty_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">Sin especialidades asignadas</span>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Sedes Asignadas */}
            <InfoCard icon={Building2} title="Sedes Asignadas" theme="blue">
              <div className="flex flex-wrap gap-2">
                {doctor.sedesAcceso && doctor.sedesAcceso.length > 0 ? (
                  doctor.sedesAcceso.map((sedeId, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border border-blue-200 shadow-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      {getBranchName(sedeId)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">Sin sedes asignadas</span>
                )}
              </div>
            </InfoCard>

            {/* Horarios por Sede */}
            <InfoCard icon={Clock} title="Horarios de Atención" theme="emerald">
              {Object.keys(schedulesByBranch).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(schedulesByBranch).map(([branchId, schedules]) => (
                    <div key={branchId} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-800">
                          {getBranchName(branchId)}
                        </span>
                      </div>

                      {/* Grid de días de la semana */}
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const schedule = schedules.find(s => s.day_of_week === day.value);
                          const isActive = schedule && schedule.is_active !== false;

                          return (
                            <div
                              key={day.value}
                              className={`text-center p-2 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-gradient-to-b from-emerald-100 to-green-100 border border-emerald-200'
                                  : 'bg-gray-50 border border-gray-200 opacity-50'
                              }`}
                            >
                              <p className={`text-xs font-bold mb-1 ${
                                isActive ? 'text-emerald-700' : 'text-gray-400'
                              }`}>
                                {day.short}
                              </p>
                              {isActive && schedule ? (
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  <p>{schedule.start_time?.slice(0, 5)}</p>
                                  <p>{schedule.end_time?.slice(0, 5)}</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-400">-</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                  <Clock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-600">
                    No hay horarios configurados para este médico
                  </p>
                </div>
              )}
            </InfoCard>

            {/* Información de Registro */}
            <InfoCard icon={Calendar} title="Información de Registro" theme="amber">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={Calendar}
                  label="Fecha de registro"
                  value={doctor.createdAt ? new Date(doctor.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No disponible'}
                  theme="amber"
                />
                <InfoItem
                  icon={Shield}
                  label="Estado de cuenta"
                  value={
                    <span className={`inline-flex items-center gap-1 ${
                      doctor.status === 'active' ? 'text-emerald-600' :
                      doctor.status === 'suspended' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {doctor.status === 'active' ? (
                        <><CheckCircle className="w-4 h-4" /> Activo</>
                      ) : doctor.status === 'suspended' ? (
                        <><XCircle className="w-4 h-4" /> Suspendido</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Inactivo</>
                      )}
                    </span>
                  }
                  theme="amber"
                />
              </div>
            </InfoCard>
          </div>
        )}
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer className="bg-white border-t-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={handleEdit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar Médico
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DoctorDetailsModal;
