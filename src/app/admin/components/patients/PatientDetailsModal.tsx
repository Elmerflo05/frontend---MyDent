import { formatTimestampToLima } from '@/utils/dateUtils';
import {
  FileText,
  Eye,
  Printer,
  Activity,
  Calendar,
  Plus,
  Download,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/common/Modal';
import type {
  Patient,
  SignedConsent,
  Appointment,
  TreatmentPlan,
  PatientContract,
  User as UserType,
  MedicalRecord
} from '@/types';
import {
  calculateAge,
  getGenderLabel,
  getAppointmentStatusInfo,
  getPaymentStatusInfo,
  getTreatmentStatusInfo,
  getDoctorName
} from '../../utils/patientHelpers';
import { handleViewConsent, handlePrintConsent, handleDownloadConsent } from '../../utils/consentHelpers';
import { exportPatientIntegralPDF } from '../../utils/exportPatientPDF';
import type { PatientIntegralData } from '../../services/patientApiService';

/**
 * Formatea una fecha string (YYYY-MM-DD) a formato legible sin desfase de timezone
 */
function formatDateWithoutTimezone(dateString: string | Date): string {
  const mesesEspañol = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Si es un objeto Date, convertir a string ISO
  const strDate = dateString instanceof Date ? dateString.toISOString() : String(dateString);

  // Parsear formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  const match = strDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);

    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} de ${mesesEspañol[monthIndex]} de ${year}`;
    }
  }

  return String(dateString);
}

interface PatientDetailsModalProps {
  patient: Patient;
  patientConsents: SignedConsent[];
  patientAppointments: Appointment[];
  patientTreatmentPlans: TreatmentPlan[];
  patientMedicalRecords: MedicalRecord[];
  patientContracts: PatientContract[];
  doctorsMap: Record<string, UserType>;
  integralData?: PatientIntegralData;
  isLoadingHistory: boolean;
  userRole?: string;
  onClose: () => void;
  onUploadContract: () => void;
  onViewPaymentHistory?: () => void;
}

export const PatientDetailsModal = ({
  patient,
  patientConsents,
  patientAppointments,
  patientTreatmentPlans,
  patientMedicalRecords,
  patientContracts,
  doctorsMap,
  integralData,
  isLoadingHistory,
  userRole,
  onClose,
  onUploadContract,
  onViewPaymentHistory,
}: PatientDetailsModalProps) => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('[PatientDetailsModal] Exportando PDF para paciente:', patient?.firstName, patient?.lastName);
      console.log('[PatientDetailsModal] Datos disponibles:', {
        patient: !!patient,
        appointments: patientAppointments?.length || 0,
        treatmentPlans: patientTreatmentPlans?.length || 0,
        consents: patientConsents?.length || 0,
        contracts: patientContracts?.length || 0,
        doctors: Object.keys(doctorsMap || {}).length
      });

      await exportPatientIntegralPDF({
        patient,
        appointments: patientAppointments || [],
        treatmentPlans: patientTreatmentPlans || [],
        consents: patientConsents || [],
        contracts: patientContracts || [],
        doctorsMap: doctorsMap || {},
      });
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('[PatientDetailsModal] Error al exportar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al exportar PDF: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="xl" closeOnEscape>
      {/* Header con botón de exportar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Detalles del Paciente</h3>
        <div className="flex items-center gap-3 mr-8">
          {userRole === 'super_admin' && (
            <button
              onClick={() => {
                navigate(`/admin/patients/${patient.id}/integral-history`);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Ver Historial de Atención Integral Completo"
            >
              <Activity className="w-4 h-4" />
              Historial Integral
            </button>
          )}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Exportar Atención Integral en PDF"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Body - Scrolleable */}
      <Modal.Body>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Información Personal</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Nombre:</strong> {patient.firstName} {patient.lastName}</div>
              <div><strong>DNI:</strong> {patient.dni}</div>
              <div><strong>Fecha de Nacimiento:</strong> {new Date(patient.birthDate).toLocaleDateString('es-ES')}</div>
              <div><strong>Edad:</strong> {calculateAge(patient.birthDate)} años</div>
              <div><strong>Género:</strong> {getGenderLabel(patient.gender)}</div>
              <div><strong>Email:</strong> {patient.email}</div>
              <div><strong>Teléfono:</strong> {patient.phone}</div>
              <div><strong>Dirección:</strong> {patient.address}</div>
              {patient.companyId && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <strong>Empresa:</strong>
                    <span className="text-indigo-700 font-medium">{patient.companyName || `ID: ${patient.companyId}`}</span>
                  </div>
                  <p className="text-xs text-indigo-500 mt-0.5 ml-5">Precios corporativos aplicados</p>
                </div>
              )}
            </div>
          </div>

          {/* Historia Médica */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Historia Médica</h4>
            {(() => {
              // Obtener datos de historia médica desde patientMedicalRecords
              const medicalData = patientMedicalRecords?.[0] as any;
              const hasAllergies = medicalData?.has_allergies;
              const allergiesDesc = medicalData?.allergies_description;
              const hasChronicDiseases = medicalData?.has_chronic_diseases;
              const chronicDiseasesDesc = medicalData?.chronic_diseases_description;
              const hasMedications = medicalData?.has_medications;
              const currentMedications = medicalData?.current_medications;
              const additionalNotes = medicalData?.additional_notes;

              return (
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Tipo de Sangre:</strong> {patient.medicalHistory?.bloodType || 'No especificado'}
                  </div>

                  <div>
                    <strong>Alergias:</strong>
                    {hasAllergies && allergiesDesc ? (
                      <span className="text-yellow-700 ml-2">{allergiesDesc}</span>
                    ) : (
                      <span className="text-gray-500 ml-2">Ninguna</span>
                    )}
                  </div>

                  <div>
                    <strong>Condiciones:</strong>
                    {hasChronicDiseases && chronicDiseasesDesc ? (
                      <span className="text-orange-700 ml-2">{chronicDiseasesDesc}</span>
                    ) : (
                      <span className="text-gray-500 ml-2">Ninguna</span>
                    )}
                  </div>

                  <div>
                    <strong>Medicamentos:</strong>
                    {hasMedications && currentMedications ? (
                      <span className="text-blue-700 ml-2">{currentMedications}</span>
                    ) : (
                      <span className="text-gray-500 ml-2">Ninguno</span>
                    )}
                  </div>

                  {additionalNotes && (
                    <div>
                      <strong>Notas:</strong>
                      <p className="mt-1 text-gray-700">{additionalNotes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Atención Integral - Sección Completa */}
          {integralData?.has_integral_attention && (
            <div className="md:col-span-2 bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Atención Integral</h4>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  {integralData.total_consultations} consulta{integralData.total_consultations !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Contadores resumen */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-purple-600">{integralData.counts?.odontogram_procedures || 0}</p>
                  <p className="text-[10px] text-gray-500">Procedimientos</p>
                </div>
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-indigo-600">{integralData.counts?.sub_procedures || 0}</p>
                  <p className="text-[10px] text-gray-500">Sub-proced.</p>
                </div>
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-blue-600">{integralData.services_summary?.ortodoncia || 0}</p>
                  <p className="text-[10px] text-gray-500">Ortodoncia</p>
                </div>
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-green-600">{integralData.services_summary?.implantes || 0}</p>
                  <p className="text-[10px] text-gray-500">Implantes</p>
                </div>
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-orange-600">{integralData.services_summary?.protesis || 0}</p>
                  <p className="text-[10px] text-gray-500">Prótesis</p>
                </div>
                <div className="bg-white p-2 rounded-lg border text-center">
                  <p className="text-lg font-bold text-gray-600">{integralData.counts?.procedure_history || 0}</p>
                  <p className="text-[10px] text-gray-500">Historial</p>
                </div>
              </div>

              {/* Procedimientos del Odontograma */}
              {integralData.odontogram_procedures && integralData.odontogram_procedures.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-gray-700">Procedimientos del Odontograma</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {integralData.odontogram_procedures.map((proc) => (
                      <div key={proc.id} className="p-2 bg-white rounded-lg border border-purple-100 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{proc.procedure_name}</p>
                            <p className="text-xs text-gray-500">
                              Pieza {proc.tooth_number} {proc.surface && `• ${proc.surface}`}
                              {proc.procedure_code && ` • Cód: ${proc.procedure_code}`}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            proc.treatment_status === 'Completado' ? 'bg-green-100 text-green-700' :
                            proc.treatment_status === 'En progreso' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {proc.treatment_status}
                          </span>
                        </div>
                        {(proc.findings || proc.notes) && (
                          <p className="mt-1 text-xs text-gray-600 italic">
                            {proc.findings || proc.notes}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-gray-400">
                          {proc.dentist_name && `Dr. ${proc.dentist_name} • `}
                          {proc.treatment_date ? new Date(proc.treatment_date).toLocaleDateString('es-PE') :
                           proc.consultation_date ? new Date(proc.consultation_date).toLocaleDateString('es-PE') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de Procedimientos con Notas Clínicas */}
              {integralData.procedure_history && integralData.procedure_history.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Historial de Procedimientos</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {integralData.procedure_history.map((ph) => (
                      <div key={ph.id} className="p-2 bg-white rounded-lg border border-blue-100 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{ph.procedure_name}</p>
                            <p className="text-xs text-gray-500">
                              {ph.tooth_number && `Pieza ${ph.tooth_number}`}
                              {ph.procedure_type && ` • ${ph.procedure_type}`}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            ph.procedure_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ph.procedure_status === 'completed' ? 'Completado' : ph.procedure_status}
                          </span>
                        </div>
                        {ph.clinical_notes && (
                          <div className="mt-1 p-2 bg-blue-50 rounded text-xs text-gray-700">
                            <strong>Notas:</strong> {ph.clinical_notes}
                          </div>
                        )}
                        {ph.complications && (
                          <div className="mt-1 p-2 bg-red-50 rounded text-xs text-red-700">
                            <strong>Complicaciones:</strong> {ph.complications}
                          </div>
                        )}
                        {ph.next_steps && (
                          <div className="mt-1 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                            <strong>Siguientes pasos:</strong> {ph.next_steps}
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-gray-400">
                          {ph.dentist_name && `Dr. ${ph.dentist_name} • `}
                          {formatTimestampToLima(ph.performed_date, 'date')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Texto Manual de Consultas */}
              {integralData.consultations && integralData.consultations.some(c => c.diagnosis || c.treatment_performed || c.notes) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-gray-700">Notas y Diagnósticos</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {integralData.consultations.filter(c => c.diagnosis || c.treatment_performed || c.notes).map((c) => (
                      <div key={c.consultation_id} className="p-2 bg-white rounded-lg border border-green-100 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {new Date(c.consultation_date).toLocaleDateString('es-PE')}
                          </span>
                          <span className="text-xs text-gray-500">Dr. {c.dentist_name}</span>
                        </div>
                        {c.diagnosis && (
                          <p className="text-xs text-gray-700"><strong>Diagnóstico:</strong> {c.diagnosis}</p>
                        )}
                        {c.treatment_performed && (
                          <p className="text-xs text-gray-700"><strong>Tratamiento:</strong> {c.treatment_performed}</p>
                        )}
                        {c.notes && (
                          <p className="text-xs text-gray-600 italic mt-1">{c.notes}</p>
                        )}
                        {c.recommendations && (
                          <p className="text-xs text-blue-600 mt-1"><strong>Recomendaciones:</strong> {c.recommendations}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-procedimientos (Diagnóstico Definitivo) */}
              {integralData.sub_procedures && integralData.sub_procedures.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm font-medium text-gray-700">Sub-procedimientos</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {integralData.sub_procedures.map((sp) => (
                      <div key={sp.id} className="p-2 bg-white rounded-lg border border-indigo-100 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {sp.sub_procedure_name || sp.condition_label}
                            </p>
                            <p className="text-xs text-gray-500">
                              Pieza {sp.tooth_number} {sp.surface && `• ${sp.surface}`}
                              {sp.specialty && ` • ${sp.specialty}`}
                              {sp.sub_procedure_code && ` • Cód: ${sp.sub_procedure_code}`}
                            </p>
                          </div>
                          {(sp.procedure_price || sp.condition_price) && (
                            <span className="text-sm font-semibold text-green-700">
                              S/ {Number(sp.procedure_price || sp.condition_price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {sp.cie10_code && (
                          <p className="text-xs text-gray-500 mt-1">CIE-10: {sp.cie10_code}</p>
                        )}
                        {(sp.notes || sp.observations) && (
                          <p className="mt-1 text-xs text-gray-600 italic">
                            {sp.notes || sp.observations}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-gray-400">
                          {sp.dentist_name && `Dr. ${sp.dentist_name} • `}
                          {new Date(sp.consultation_date).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Servicios Adicionales (Ortodoncia, Implantes, Prótesis) */}
              {integralData.additional_services && integralData.additional_services.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-gray-700">Servicios Adicionales</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {integralData.additional_services.map((service) => (
                      <div
                        key={service.consultation_additional_service_id}
                        className="p-2 bg-white rounded-lg border border-orange-100 text-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{service.service_name}</p>
                            <p className="text-xs text-gray-500">
                              <span className="capitalize">{service.service_type}</span>
                              {service.modality && ` • ${service.modality}`}
                            </p>
                          </div>
                          {service.monto_total && Number(service.monto_total) > 0 && (
                            <span className="text-sm font-semibold text-green-700">
                              S/ {Number(service.monto_total).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          Dr. {service.dentist_name} • {new Date(service.consultation_date).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contacto de Emergencia */}
          {patient.emergencyContact && (
            <div className="md:col-span-2">
              <h4 className="font-semibold text-gray-900 mb-3">Contacto de Emergencia</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Nombre:</strong> {patient.emergencyContact.name}</div>
                <div><strong>Relación:</strong> {patient.emergencyContact.relationship}</div>
                <div><strong>Teléfono:</strong> {patient.emergencyContact.phone}</div>
              </div>
            </div>
          )}

          {/* Consentimientos Firmados */}
          <div className="md:col-span-2 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Consentimientos Firmados</h4>
            </div>

            {patientConsents.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay consentimientos firmados para este paciente.</p>
            ) : (
              <div className="space-y-3">
                {patientConsents.map((consent) => (
                  <div
                    key={consent.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{consent.consentimientoNombre}</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Firmado
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div><strong>Fecha:</strong> {formatDateWithoutTimezone(consent.fechaConsentimiento)}</div>
                          <div><strong>Doctor:</strong> {consent.doctorNombre} - COP: {consent.doctorCop}</div>
                          <div><strong>Categoría:</strong> {consent.consentimientoCategoria}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleViewConsent(consent)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadConsent(consent)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintConsent(consent)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Atenciones */}
          <div className="md:col-span-2 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Historial de Atenciones</h4>
            </div>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-sm text-gray-500">Cargando historial...</p>
              </div>
            ) : patientAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay atenciones registradas.</p>
            ) : (
              <div className="space-y-4">
                {/* Appointments */}
                {patientAppointments.map((appointment) => {
                  const statusInfo = getAppointmentStatusInfo(appointment.status);
                  const paymentInfo = getPaymentStatusInfo(appointment.paymentStatus || 'pending');

                  // Manejar diferentes formatos de fecha del backend
                  const appointmentDate = (appointment as any).appointment_date || appointment.date;
                  const appointmentTime = (appointment as any).start_time || appointment.startTime || appointment.time || '';
                  const doctorId = (appointment as any).dentist_id || appointment.doctorId;

                  // Formatear fecha de forma segura
                  let formattedDate = 'Fecha no disponible';
                  try {
                    if (appointmentDate) {
                      const dateObj = new Date(appointmentDate);
                      if (!isNaN(dateObj.getTime())) {
                        formattedDate = format(dateObj, "dd/MM/yyyy");
                      }
                    }
                  } catch {
                    formattedDate = 'Fecha no disponible';
                  }

                  return (
                    <div
                      key={appointment.id || (appointment as any).appointment_id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formattedDate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointmentTime} - {getDoctorName(doctorId, doctorsMap)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}
                          >
                            {paymentInfo.label}
                          </span>
                        </div>
                      </div>

                      {appointment.service && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Servicio:</span>
                          <span className="ml-2 text-sm text-gray-600">{appointment.service}</span>
                        </div>
                      )}

                      {appointment.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Diagnóstico:</span>
                          <p className="text-sm text-gray-600 mt-1">{appointment.diagnosis}</p>
                        </div>
                      )}

                      {appointment.treatment && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Tratamiento:</span>
                          <p className="text-sm text-gray-600 mt-1">{appointment.treatment}</p>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <span className="text-sm font-medium text-yellow-800">Notas:</span>
                          <p className="text-sm text-yellow-700 mt-1">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Treatment Plans */}
                {patientTreatmentPlans.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Planes de Tratamiento Activos
                    </h5>
                    <div className="space-y-3">
                      {patientTreatmentPlans.map((plan) => {
                        const statusInfo = getTreatmentStatusInfo(plan.status);
                        const completedProcedures = plan.procedures?.filter(p => p.completed).length || 0;
                        const totalProcedures = plan.procedures?.length || 0;
                        const progress = totalProcedures > 0 ? (completedProcedures / totalProcedures) * 100 : 0;

                        return (
                          <div
                            key={plan.id}
                            className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">Plan de Tratamiento</p>
                                <p className="text-sm text-gray-600">
                                  Creado: {format(new Date(plan.createdAt), 'dd/MM/yyyy')}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            {totalProcedures > 0 && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">
                                    Progreso: {completedProcedures} de {totalProcedures} procedimientos
                                  </span>
                                  <span className="text-xs font-medium text-purple-700">
                                    {Math.round(progress)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {plan.notes && (
                              <p className="text-sm text-gray-600 mt-2">{plan.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Contratos */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contratos
            </h4>
            {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'receptionist') && (
              <button
                onClick={onUploadContract}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adjuntar Contrato
              </button>
            )}
          </div>

          {patientContracts.length === 0 ? (
            <p className="text-sm text-gray-500">No hay contratos adjuntados</p>
          ) : (
            <div className="space-y-2">
              {patientContracts.map(contract => (
                <div key={contract.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{contract.contractName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {contract.contractType && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 capitalize">
                          {contract.contractType}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {contract.status === 'pending' && '⏳ Pendiente de firma'}
                        {contract.status === 'signed' && `✅ Firmado el ${new Date(contract.signedAt!).toLocaleDateString('es-PE')}`}
                        {contract.status === 'rejected' && '❌ Rechazado'}
                      </span>
                    </div>
                  </div>
                  <a
                    href={contract.contractFile}
                    download={`${contract.contractName}.pdf`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>

      {/* Footer - Fijo */}
      <Modal.Footer>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cerrar
          </button>
          {onViewPaymentHistory && (
            <button
              onClick={onViewPaymentHistory}
              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Historial de Pagos
            </button>
          )}
          <button
            onClick={() => {
              navigate(`/admin/patients/${patient.id}/edit`);
              onClose();
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Editar Paciente
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
