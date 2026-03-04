/**
 * Modal de Detalles de Cita - Portal Clinic
 * Diseño profesional con animaciones suaves y UX optimizada
 */

import { CheckCircle, XCircle, Play, MessageCircle, Receipt, ExternalLink, FileText, ZoomIn, User, Stethoscope, Calendar, Clock, Phone, Mail, DollarSign, UserX, RefreshCcw, Upload, X, AlertTriangle, Ban, IdCard, Smartphone, ClipboardList, HelpCircle, Activity, Pill, FileCheck, Syringe, Building2 } from 'lucide-react';
import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';
import { SPECIALTIES } from './constants';
import type { Appointment, Patient } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { consultationsApi, type ConsultationData } from '@/services/api/consultationsApi';
import { procedureIncomeApi, type ProcedureIncomeData } from '@/services/api/procedureIncomeApi';
import {
  MarkNoShowModal,
  ApproveRescheduleModal,
  ResubmitVoucherModal
} from '@/components/appointments';
import { Modal } from '@/components/common/Modal';

// Obtener la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

// Configuración de colores por estado
const STATUS_THEME = {
  pending_approval: {
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: Clock
  },
  scheduled: {
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: Calendar
  },
  confirmed: {
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle
  },
  in_progress: {
    gradient: 'from-violet-500 via-purple-500 to-indigo-600',
    lightBg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    icon: Play
  },
  completed: {
    gradient: 'from-slate-500 via-gray-500 to-slate-600',
    lightBg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    icon: CheckCircle
  },
  cancelled: {
    gradient: 'from-red-500 via-rose-500 to-red-600',
    lightBg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: Ban
  },
  rejected: {
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    lightBg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: XCircle
  },
  no_show: {
    gradient: 'from-orange-500 via-amber-500 to-orange-600',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: UserX
  },
  rescheduled: {
    gradient: 'from-indigo-500 via-purple-500 to-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: RefreshCcw
  }
} as const;

// Modal de Visualización del Voucher
const VoucherViewModal = ({
  isOpen,
  onClose,
  voucherUrl,
  voucherPath
}: {
  isOpen: boolean;
  onClose: () => void;
  voucherUrl: string | null;
  voucherPath: string | null;
}) => {
  if (!isOpen || !voucherUrl) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" className="bg-gray-900">
      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2.5">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Voucher de Pago</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <Modal.Body className="flex items-center justify-center bg-gray-900 p-8">
        {voucherPath?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
          <img
            src={voucherUrl}
            alt="Voucher de pago"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : voucherPath?.match(/\.pdf$/i) ? (
          <iframe
            src={voucherUrl}
            className="w-full h-full rounded-lg"
            title="Voucher PDF"
          />
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-2xl backdrop-blur-sm">
            <FileText className="w-20 h-20 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-300 mb-4">Formato no soportado para vista previa</p>
            <a
              href={voucherUrl}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Descargar archivo
            </a>
          </div>
        )}
      </Modal.Body>

      <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
        <div className="flex justify-center">
          <a
            href={voucherUrl}
            download
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Descargar
          </a>
        </div>
      </div>
    </Modal>
  );
};

// Componente de tarjeta de información
const InfoCard = ({
  icon: Icon,
  title,
  children,
  theme = 'blue'
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  theme?: 'blue' | 'green' | 'purple' | 'amber' | 'teal';
}) => {
  const themes = {
    blue: 'from-blue-50 to-sky-50 border-blue-100 hover:border-blue-200',
    green: 'from-emerald-50 to-green-50 border-emerald-100 hover:border-emerald-200',
    purple: 'from-violet-50 to-purple-50 border-violet-100 hover:border-violet-200',
    amber: 'from-amber-50 to-yellow-50 border-amber-100 hover:border-amber-200',
    teal: 'from-teal-50 to-cyan-50 border-teal-100 hover:border-teal-200'
  };

  const iconThemes = {
    blue: 'from-blue-500 to-blue-600 text-white',
    green: 'from-emerald-500 to-green-600 text-white',
    purple: 'from-violet-500 to-purple-600 text-white',
    amber: 'from-amber-500 to-orange-500 text-white',
    teal: 'from-teal-500 to-cyan-600 text-white'
  };

  const titleThemes = {
    blue: 'text-blue-900',
    green: 'text-emerald-900',
    purple: 'text-violet-900',
    amber: 'text-amber-900',
    teal: 'text-teal-900'
  };

  return (
    <div className={`bg-gradient-to-br ${themes[theme]} rounded-2xl p-5 border transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-gradient-to-br ${iconThemes[theme]} rounded-xl p-2.5 shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className={`font-semibold ${titleThemes[theme]}`}>{title}</h4>
      </div>
      {children}
    </div>
  );
};

// Componente de item de información
const InfoItem = ({
  icon: Icon,
  label,
  value,
  theme = 'blue'
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  theme?: 'blue' | 'green' | 'purple' | 'amber' | 'teal';
}) => {
  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-emerald-500',
    purple: 'text-violet-500',
    amber: 'text-amber-500',
    teal: 'text-teal-500'
  };

  const labelColors = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    purple: 'text-violet-600',
    amber: 'text-amber-600',
    teal: 'text-teal-600'
  };

  return (
    <div className="flex items-center gap-3 group">
      <div className="bg-white rounded-xl p-2 shadow-sm group-hover:shadow-md transition-shadow">
        <Icon className={`w-4 h-4 ${iconColors[theme]}`} />
      </div>
      <div>
        <p className={`text-xs font-medium ${labelColors[theme]}`}>{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  userRole?: string;
  getPatientInfo: (patientId: string) => Patient | null;
  getPatientName: (patientId: string) => string;
  getDoctorName: (doctorId: string) => string;
  isAppointmentReady: (appointment: Appointment) => boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancel: (appointment: Appointment) => void;
  onStartConsultation: (appointment: Appointment) => void;
  onApprove?: (appointment: Appointment) => void;
  onReject?: (appointment: Appointment) => void;
  onRefresh?: () => void;
}

export const AppointmentDetailsModal = ({
  appointment,
  userRole,
  getPatientInfo,
  getPatientName,
  getDoctorName,
  isAppointmentReady,
  onClose,
  onEdit,
  onCancel,
  onStartConsultation,
  onApprove,
  onReject,
  onRefresh
}: AppointmentDetailsModalProps) => {
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showMarkNoShowModal, setShowMarkNoShowModal] = useState(false);
  const [showApproveRescheduleModal, setShowApproveRescheduleModal] = useState(false);
  const [showResubmitVoucherModal, setShowResubmitVoucherModal] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  const [treatments, setTreatments] = useState<ProcedureIncomeData[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);

  const patient = getPatientInfo(appointment.patientId);

  // Cargar datos de consulta cuando la cita está en proceso o completada
  useEffect(() => {
    const fetchConsultation = async () => {
      if ((appointment.status === 'in_progress' || appointment.status === 'completed') && (appointment as any).appointment_id) {
        setLoadingConsultation(true);
        try {
          const response = await consultationsApi.getConsultations({
            appointment_id: (appointment as any).appointment_id
          });
          if (response.data && response.data.length > 0) {
            setConsultationData(response.data[0]);
          }
        } catch (error) {
          console.error('Error al cargar datos de consulta:', error);
        } finally {
          setLoadingConsultation(false);
        }
      }
    };
    fetchConsultation();
  }, [appointment.status, (appointment as any).appointment_id]);

  // Cargar tratamientos cuando hay datos de consulta
  useEffect(() => {
    const fetchTreatments = async () => {
      if (consultationData?.consultation_id) {
        setLoadingTreatments(true);
        try {
          const response = await procedureIncomeApi.getProcedureIncomes({
            consultation_id: consultationData.consultation_id,
            limit: 100
          });
          if (response.data) {
            // Filtrar solo los activos y agrupar por tipo
            const activeTreatments = response.data.filter(t => t.status === 'active');
            setTreatments(activeTreatments);
          }
        } catch (error) {
          console.error('Error al cargar tratamientos:', error);
        } finally {
          setLoadingTreatments(false);
        }
      }
    };
    fetchTreatments();
  }, [consultationData?.consultation_id]);

  const specialtyConfig = SPECIALTIES[(appointment as any).specialty as keyof typeof SPECIALTIES];
  const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status as keyof typeof APPOINTMENT_STATUS_CONFIG];

  // Tema basado en el estado
  const theme = useMemo(() => {
    return STATUS_THEME[appointment.status as keyof typeof STATUS_THEME] || STATUS_THEME.scheduled;
  }, [appointment.status]);

  const voucherUrl = (appointment as any)?.voucher
    ? `${API_BASE_URL.replace('/api', '')}${(appointment as any).voucher}`
    : null;

  const handleSuccess = () => {
    onRefresh?.();
    onClose();
  };

  // Formatear fecha de forma elegante
  const formattedDate = useMemo(() => {
    return new Date(appointment.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [appointment.date]);

  // Verificar permisos para voucher
  const canViewVoucher = useMemo(() => {
    const voucher = (appointment as any)?.voucher;
    const hasVoucher = voucher && typeof voucher === 'string' && voucher.trim() !== '';
    const allowedRoles = ['super_admin', 'admin', 'receptionist', 'superadmin', 'administrador', 'recepcionista'];
    const currentRole = userRole ? String(userRole).toLowerCase() : '';
    return hasVoucher && allowedRoles.includes(currentRole);
  }, [appointment, userRole]);

  const StatusIcon = theme.icon;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="xl"
      closeOnEscape
      showCloseButton={false}
    >
      {/* Header con gradiente dinámico */}
      <div className={`flex-shrink-0 bg-gradient-to-r ${theme.gradient} px-6 py-6 rounded-t-xl relative overflow-hidden`}>
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-white/10 transform -skew-y-12 -translate-y-full animate-pulse" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
              <StatusIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Detalles de la Cita
              </h3>
              <p className="text-white/80 text-sm font-medium capitalize">
                {formattedDate}
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
          <div className="mt-4 flex justify-center gap-2">
            <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-white/95 shadow-lg ${theme.text}`}>
              <span className="text-base">{statusConfig.icon}</span>
              {statusConfig.label || appointment.status}
            </span>
            {(appointment as any).rescheduleCount > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 shadow-lg">
                <RefreshCcw className="w-3 h-3" />
                Reprogramada
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <Modal.Body className="bg-gradient-to-b from-gray-50/50 to-white">
        {/* Alerta de Rechazo */}
        {appointment.status === 'rejected' && (appointment as any).rejection_reason && (
          <div className="mb-6 bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl p-[2px] shadow-lg">
            <div className="bg-white rounded-[14px] p-5">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-3 shadow-md">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-rose-900 text-lg mb-2">
                    Cita Rechazada
                  </h4>
                  <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                    <p className="text-xs text-rose-600 font-semibold mb-1">Motivo:</p>
                    <p className="text-sm text-gray-800">{(appointment as any).rejection_reason}</p>
                  </div>
                  {(appointment as any).rejected_at && (
                    <p className="text-xs text-rose-500 mt-3 font-medium">
                      {new Date((appointment as any).rejected_at).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Cancelación */}
        {appointment.status === 'cancelled' && (appointment as any).cancellation_reason && (
          <div className="mb-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-[2px] shadow-lg">
            <div className="bg-white rounded-[14px] p-5">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-3 shadow-md">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-orange-900 text-lg mb-2">
                    Cita Cancelada
                  </h4>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-xs text-orange-600 font-semibold mb-1">Motivo:</p>
                    <p className="text-sm text-gray-800">{(appointment as any).cancellation_reason}</p>
                  </div>
                  {(appointment as any).cancelled_at && (
                    <p className="text-xs text-orange-500 mt-3 font-medium">
                      {new Date((appointment as any).cancelled_at).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Información de Fecha y Hora */}
          <InfoCard icon={Calendar} title="Fecha y Hora" theme="blue">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={Calendar}
                label="Fecha"
                value={new Date(appointment.date).toLocaleDateString('es-ES')}
                theme="blue"
              />
              <InfoItem
                icon={Clock}
                label="Hora"
                value={`${appointment.time} • ${(appointment as any).duration || 30} min`}
                theme="blue"
              />
              <InfoItem
                icon={Building2}
                label="Sede"
                value={(appointment as any).branch_name || (appointment as any).sede || 'Sin asignar'}
                theme="blue"
              />
              {(appointment as any).price && (
                <InfoItem
                  icon={DollarSign}
                  label="Precio"
                  value={`S/ ${typeof (appointment as any).price === 'number'
                    ? (appointment as any).price.toFixed(2)
                    : parseFloat((appointment as any).price).toFixed(2)}`}
                  theme="blue"
                />
              )}
            </div>
          </InfoCard>

          {/* Información del Paciente */}
          <InfoCard icon={User} title="Paciente" theme="green">
            <div className="space-y-3">
              <InfoItem
                icon={User}
                label="Nombre completo"
                value={getPatientName(appointment.patientId)}
                theme="green"
              />
              {/* DNI del paciente */}
              {(patient as any)?.identification_number && (
                <InfoItem
                  icon={IdCard}
                  label="DNI"
                  value={(patient as any).identification_number}
                  theme="green"
                />
              )}
              {/* Historia Clínica */}
              {(patient as any)?.medical_record_number && (
                <InfoItem
                  icon={ClipboardList}
                  label="Historia Clínica"
                  value={(patient as any).medical_record_number}
                  theme="green"
                />
              )}
              {patient?.phone && (
                <InfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={patient.phone}
                  theme="green"
                />
              )}
              {/* Celular */}
              {(patient as any)?.mobile && (patient as any).mobile !== patient?.phone && (
                <InfoItem
                  icon={Smartphone}
                  label="Celular"
                  value={(patient as any).mobile}
                  theme="green"
                />
              )}
              {patient?.email && (
                <InfoItem
                  icon={Mail}
                  label="Correo electrónico"
                  value={patient.email}
                  theme="green"
                />
              )}
            </div>
          </InfoCard>

          {/* Información del Doctor */}
          <InfoCard icon={Stethoscope} title="Doctor y Especialidad" theme="purple">
            <div className="space-y-3">
              <InfoItem
                icon={Stethoscope}
                label="Doctor asignado"
                value={getDoctorName(appointment.doctorId)}
                theme="purple"
              />
              {specialtyConfig && (
                <InfoItem
                  icon={specialtyConfig.icon}
                  label="Especialidad"
                  value={specialtyConfig.label}
                  theme="purple"
                />
              )}
            </div>
          </InfoCard>

          {/* Motivo de Consulta */}
          {(appointment as any).reason && (
            <InfoCard icon={HelpCircle} title="Motivo de Consulta" theme="amber">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                <p className="text-sm text-gray-700 leading-relaxed">{(appointment as any).reason}</p>
              </div>
            </InfoCard>
          )}

          {/* Tratamiento/Consulta Realizada - Solo visible en citas en proceso o completadas */}
          {(appointment.status === 'in_progress' || appointment.status === 'completed') && (
            <InfoCard icon={Activity} title="Atención Médica" theme="purple">
              {loadingConsultation ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                  <span className="ml-2 text-sm text-violet-600">Cargando datos...</span>
                </div>
              ) : consultationData ? (
                <div className="space-y-4">
                  {/* Estado de la atención */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-violet-100 text-violet-700'
                    }`}>
                      {appointment.status === 'completed' ? '✓ Consulta Finalizada' : '● En Atención'}
                    </div>
                  </div>

                  {/* Motivo de consulta registrado */}
                  {consultationData.chief_complaint && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <p className="text-xs text-violet-600 font-semibold mb-1">Motivo Principal</p>
                      <p className="text-sm text-gray-800">{consultationData.chief_complaint}</p>
                    </div>
                  )}

                  {/* Síntomas/Enfermedad actual */}
                  {consultationData.present_illness && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <p className="text-xs text-violet-600 font-semibold mb-1">Síntomas</p>
                      <p className="text-sm text-gray-800">{consultationData.present_illness}</p>
                    </div>
                  )}

                  {/* Diagnóstico */}
                  {consultationData.diagnosis && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <p className="text-xs text-violet-600 font-semibold mb-1">Diagnóstico</p>
                      <p className="text-sm text-gray-800">{consultationData.diagnosis}</p>
                    </div>
                  )}

                  {/* Plan de tratamiento */}
                  {consultationData.treatment_plan && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <p className="text-xs text-violet-600 font-semibold mb-1">Plan de Tratamiento</p>
                      <p className="text-sm text-gray-800">{consultationData.treatment_plan}</p>
                    </div>
                  )}

                  {/* Medicamentos recetados */}
                  {consultationData.prescriptions_given && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-4 h-4 text-violet-500" />
                        <p className="text-xs text-violet-600 font-semibold">Medicamentos Recetados</p>
                      </div>
                      <p className="text-sm text-gray-800">{consultationData.prescriptions_given}</p>
                    </div>
                  )}

                  {/* Recomendaciones */}
                  {consultationData.recommendations && (
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-4 h-4 text-violet-500" />
                        <p className="text-xs text-violet-600 font-semibold">Recomendaciones</p>
                      </div>
                      <p className="text-sm text-gray-800">{consultationData.recommendations}</p>
                    </div>
                  )}

                  {/* Próxima visita */}
                  {consultationData.next_visit_date && (
                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-violet-600" />
                        <p className="text-xs text-violet-600 font-semibold">Próxima Cita</p>
                      </div>
                      <p className="text-sm font-medium text-violet-800 mt-1">
                        {new Date(consultationData.next_visit_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 text-center">
                  <Activity className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                  <p className="text-sm text-violet-600">
                    {appointment.status === 'in_progress'
                      ? 'Consulta en curso - Los datos se mostrarán al guardar'
                      : 'No hay datos de consulta registrados'}
                  </p>
                </div>
              )}
            </InfoCard>
          )}

          {/* Tratamientos/Servicios Realizados */}
          {(appointment.status === 'in_progress' || appointment.status === 'completed') && (
            <InfoCard icon={Syringe} title="Tratamientos y Servicios" theme="teal">
              {loadingTreatments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span className="ml-2 text-sm text-teal-600">Cargando tratamientos...</span>
                </div>
              ) : treatments.length > 0 ? (
                <div className="space-y-3">
                  {/* Resumen de totales */}
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-teal-600 font-semibold">Total de Tratamientos</p>
                        <p className="text-2xl font-bold text-teal-800">
                          S/ {treatments.reduce((sum, t) => sum + (t.final_amount || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-teal-600 font-semibold">Cantidad</p>
                        <p className="text-lg font-bold text-teal-800">{treatments.length} items</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de tratamientos agrupados */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {/* Procedimientos del Odontograma */}
                    {treatments.filter(t => t.income_type === 'odontogram_procedure').length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-teal-100">
                        <p className="text-xs font-semibold text-teal-700 mb-2">🦷 Procedimientos Dentales</p>
                        {treatments.filter(t => t.income_type === 'odontogram_procedure').map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 text-sm border-b border-gray-100 last:border-0">
                            <span className="text-gray-700 truncate flex-1">{t.item_name}</span>
                            <span className="text-teal-700 font-medium ml-2">S/ {(t.final_amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tratamientos */}
                    {treatments.filter(t => t.income_type === 'treatment').length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-teal-100">
                        <p className="text-xs font-semibold text-teal-700 mb-2">💊 Tratamientos</p>
                        {treatments.filter(t => t.income_type === 'treatment').map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 text-sm border-b border-gray-100 last:border-0">
                            <span className="text-gray-700 truncate flex-1">{t.item_name}</span>
                            <span className="text-teal-700 font-medium ml-2">S/ {(t.final_amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Servicios Adicionales */}
                    {treatments.filter(t => t.income_type?.includes('additional_service')).length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-teal-100">
                        <p className="text-xs font-semibold text-teal-700 mb-2">✨ Servicios Adicionales</p>
                        {treatments.filter(t => t.income_type?.includes('additional_service')).map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1 text-sm border-b border-gray-100 last:border-0">
                            <span className="text-gray-700 truncate flex-1">{t.item_name}</span>
                            <span className="text-teal-700 font-medium ml-2">S/ {(t.final_amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 text-center">
                  <Syringe className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <p className="text-sm text-teal-600">
                    No hay tratamientos registrados para esta cita
                  </p>
                </div>
              )}
            </InfoCard>
          )}

          {/* Notas */}
          {appointment.notes && (
            <InfoCard icon={FileText} title="Notas" theme="amber">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                <p className="text-sm text-gray-700 leading-relaxed">{appointment.notes}</p>
              </div>
            </InfoCard>
          )}

          {/* Voucher */}
          {canViewVoucher && (
            <InfoCard icon={Receipt} title="Comprobante de Pago" theme="teal">
              <div className="space-y-4">
                {(appointment as any).price && (
                  <InfoItem
                    icon={DollarSign}
                    label="Monto pagado"
                    value={`S/ ${typeof (appointment as any).price === 'number'
                      ? (appointment as any).price.toFixed(2)
                      : parseFloat((appointment as any).price).toFixed(2)}`}
                    theme="teal"
                  />
                )}

                <div>
                  <p className="text-sm text-teal-700 font-medium mb-3">Comprobante:</p>
                  {(appointment as any).voucher?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-teal-200 bg-white shadow-sm group">
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}${(appointment as any).voucher}`}
                        alt="Voucher de pago"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border-2 border-teal-200 flex items-center gap-3">
                      <div className="bg-teal-100 rounded-xl p-3">
                        <FileText className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Documento adjunto</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {(appointment as any).voucher}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowVoucherModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Ver en pantalla completa
                  </button>
                </div>
              </div>
            </InfoCard>
          )}
        </div>
      </Modal.Body>

      {/* Footer con acciones */}
      <Modal.Footer className="bg-white border-t-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* Mensaje para citas rechazadas */}
        {appointment.status === 'rejected' && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-800">Cita rechazada</p>
                <p className="text-xs text-rose-600">No se pueden realizar más acciones</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje para citas en progreso */}
        {appointment.status === 'in_progress' && (
          <div className="mb-4 bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-violet-800">Consulta en curso</p>
                <p className="text-xs text-violet-600">El doctor está atendiendo a este paciente</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción - Ocultos cuando la cita está en progreso, rechazada, cancelada o completada */}
        {appointment.status !== 'rejected' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'in_progress' && (
          <div className="flex flex-wrap gap-2">
            {/* WhatsApp */}
            {patient?.phone && (
              <button
                onClick={() => {
                  const phone = patient.phone.replace(/\D/g, '');
                  const message = `Hola ${patient.firstName}, le escribo de la clínica dental para recordarle su cita programada para el ${new Date(appointment.date).toLocaleDateString('es-ES')} a las ${appointment.time}.`;
                  window.open(`https://wa.me/51${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            )}

            {/* Reprogramar - Disponible para todas las citas */}
            <button
              onClick={onEdit}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reprogramar
            </button>

            {/* Aprobar/Rechazar para pending_approval */}
            {appointment.status === 'pending_approval' && onApprove && onReject && (
              <>
                <button
                  onClick={() => onApprove(appointment)}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprobar
                </button>
                <button
                  onClick={() => onReject(appointment)}
                  className="flex-1 min-w-[140px] bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-400 px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar
                </button>
              </>
            )}

            {/* Cancelar - Solo para citas ya aprobadas (no pending_approval) */}
            {appointment.status !== 'pending_approval' && (
              <button
                onClick={() => onCancel(appointment)}
                className="flex-1 min-w-[140px] bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-300 px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
            )}

            {/* Marcar No-Show */}
            {appointment.status === 'scheduled' && ['admin', 'receptionist', 'super_admin'].includes(userRole || '') && (
              <button
                onClick={() => setShowMarkNoShowModal(true)}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" />
                No Asistió
              </button>
            )}

            {/* Aprobar Reprogramación */}
            {appointment.status === 'rescheduled' && ['admin', 'receptionist', 'super_admin'].includes(userRole || '') && (
              <button
                onClick={() => setShowApproveRescheduleModal(true)}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Revisar
              </button>
            )}

            {/* Iniciar Consulta - Solo visible para doctores */}
            {appointment.status === 'scheduled' && isAppointmentReady(appointment) && userRole === 'doctor' && (
              <button
                onClick={() => {
                  onStartConsultation(appointment);
                  onClose();
                }}
                className="flex-1 min-w-[160px] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Iniciar Consulta
              </button>
            )}
          </div>
        )}

        {/* Reenviar Voucher para pacientes con cita rechazada */}
        {appointment.status === 'rejected' && userRole === 'patient' && (
          <button
            onClick={() => setShowResubmitVoucherModal(true)}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Reenviar Comprobante
          </button>
        )}
      </Modal.Footer>

      {/* Modales anidados */}
      <VoucherViewModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        voucherUrl={voucherUrl}
        voucherPath={(appointment as any)?.voucher}
      />

      {showMarkNoShowModal && (
        <MarkNoShowModal
          isOpen={showMarkNoShowModal}
          onClose={() => setShowMarkNoShowModal(false)}
          appointment={{
            appointment_id: parseInt(appointment.id),
            appointment_date: appointment.date,
            start_time: appointment.startTime || (appointment as any).time || '00:00:00',
            patient_name: getPatientName(appointment.patientId)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showApproveRescheduleModal && (appointment as any).reschedule_proposal && (
        <ApproveRescheduleModal
          isOpen={showApproveRescheduleModal}
          onClose={() => setShowApproveRescheduleModal(false)}
          appointment={{
            appointment_id: parseInt(appointment.id),
            appointment_date: appointment.date,
            start_time: appointment.startTime || (appointment as any).time || '00:00:00',
            end_time: appointment.endTime || (appointment as any).end_time || '00:30:00',
            patient_name: getPatientName(appointment.patientId),
            dentist_name: getDoctorName(appointment.doctorId)
          }}
          proposal={(appointment as any).reschedule_proposal}
          onSuccess={handleSuccess}
        />
      )}

      {showResubmitVoucherModal && (
        <ResubmitVoucherModal
          isOpen={showResubmitVoucherModal}
          onClose={() => setShowResubmitVoucherModal(false)}
          appointment={{
            appointment_id: parseInt(appointment.id),
            appointment_date: appointment.date,
            start_time: appointment.startTime || (appointment as any).time || '00:00:00',
            patient_name: getPatientName(appointment.patientId),
            rejection_reason: (appointment as any).rejection_reason
          }}
          onSuccess={handleSuccess}
        />
      )}
    </Modal>
  );
};
