import { Mail, Phone, AlertTriangle, Clock, Heart, Eye, Edit, Stethoscope, ClipboardEdit, Shield, Building2 } from 'lucide-react';
import type { Patient } from '@/types';
import { calculateAge, getGenderLabel } from '../../utils/patientHelpers';

// Configuración de colores por tipo de plan de salud
const HEALTH_PLAN_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  personal: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-600'
  },
  gold: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: 'text-amber-600'
  },
  planitium: {
    bg: 'bg-slate-200',
    text: 'text-slate-800',
    border: 'border-slate-400',
    icon: 'text-slate-600'
  },
  // Estilo por defecto para otros planes
  default: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: 'text-teal-600'
  }
};

export interface IntegralDataSummary {
  has_integral_attention: boolean;
  total_consultations: number;
  services_summary: {
    ortodoncia: number;
    implantes: number;
    protesis: number;
  };
}

interface PatientCardProps {
  patient: Patient;
  canCompleteMedicalInfo: boolean;
  canCompleteBasicInfo: boolean;
  integralData?: IntegralDataSummary;
  onViewDetails: (patient: Patient) => void;
  onToggleClienteNuevo: (patientId: string, currentStatus: boolean) => void;
  onNavigate: (path: string) => void;
  onCompleteInfo: (patient: Patient) => void;
}

export const PatientCard = ({
  patient,
  canCompleteMedicalInfo,
  canCompleteBasicInfo,
  integralData,
  onViewDetails,
  onToggleClienteNuevo,
  onNavigate,
  onCompleteInfo
}: PatientCardProps) => {
  const age = calculateAge(patient.birthDate);
  const hasAllergies = patient.medicalHistory?.allergies?.length > 0 || false;
  const hasConditions = patient.medicalHistory?.conditions?.length > 0 || false;
  const hasIntegralAttention = integralData?.has_integral_attention || false;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
              patient.gender === 'M' ? 'bg-blue-500' :
              patient.gender === 'F' ? 'bg-pink-500' : 'bg-gray-500'
            }`}>
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="text-sm text-gray-500">
              DNI: {patient.dni}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {patient.email}
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {patient.phone}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {age} años • {getGenderLabel(patient.gender)}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(patient.birthDate).toLocaleDateString('es-ES')}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge de Plan de Salud */}
          {patient.healthPlan && (
            (() => {
              const planType = patient.healthPlan.type?.toLowerCase() || 'default';
              const styles = HEALTH_PLAN_STYLES[planType] || HEALTH_PLAN_STYLES.default;
              return (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border}`}
                  title={`Plan: ${patient.healthPlan.name}`}
                >
                  <Shield className={`w-3 h-3 mr-1 ${styles.icon}`} />
                  {patient.healthPlan.name}
                </span>
              );
            })()
          )}

          {/* Badge de Empresa/Corporativo */}
          {patient.companyId && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
              title={`Empresa: ${patient.companyName || 'Corporativo'}`}
            >
              <Building2 className="w-3 h-3 mr-1 text-indigo-600" />
              {patient.companyName || 'Corporativo'}
            </span>
          )}

          {/* Badge de Atención Integral */}
          {hasIntegralAttention && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <Stethoscope className="w-3 h-3 mr-1" />
              Atención Integral
              {integralData && integralData.total_consultations > 0 && (
                <span className="ml-1 bg-purple-200 text-purple-900 px-1.5 rounded-full text-[10px]">
                  {integralData.total_consultations}
                </span>
              )}
            </span>
          )}

          {(patient as any).isBasicRegistration !== false ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Información Incompleta
            </span>
          ) : !patient.medicalInfoCompleted ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Clock className="w-3 h-3 mr-1" />
              Pendiente Historia Médica
            </span>
          ) : (
            <>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Información Completada
              </span>
              {patient.medicalHistory?.bloodType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {patient.medicalHistory.bloodType}
                </span>
              )}
              {hasAllergies && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Alergias
                </span>
              )}
              {hasConditions && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <Heart className="w-3 h-3 mr-1" />
                  Condiciones
                </span>
              )}
            </>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onToggleClienteNuevo(patient.id, patient.esClienteNuevo ?? true)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            patient.esClienteNuevo ?? true
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          title="Click para cambiar"
        >
          {patient.esClienteNuevo ?? true ? '🆕 Cliente Nuevo' : '🔄 Cliente Continuador'}
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(patient.createdAt).toLocaleDateString('es-ES')}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(patient)}
            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>

          {(patient as any).isBasicRegistration !== false ? (
            <>
              {/* Botón para completar información básica (Admin, Recepción, SuperAdmin) */}
              {canCompleteBasicInfo && (
                <button
                  onClick={() => onCompleteInfo(patient)}
                  className="text-amber-600 hover:text-amber-900 p-1 hover:bg-amber-50 rounded"
                  title="Completar información del paciente"
                >
                  <ClipboardEdit className="w-4 h-4" />
                </button>
              )}
              {/* Botón para completar info médica completa (Solo Doctor) */}
              {canCompleteMedicalInfo && (
                <button
                  onClick={() => onNavigate(`/admin/patients/${patient.id}/complete`)}
                  className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                  title="Completar historia médica completa (Solo Doctor)"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onNavigate(`/admin/patients/${patient.id}/edit`)}
              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
              title="Editar información"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
