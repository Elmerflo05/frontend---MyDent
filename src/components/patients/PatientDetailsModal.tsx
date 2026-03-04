import { createPortal } from 'react-dom';
import { FileText, DollarSign, Eye, Download, Printer, X, User, Phone, Mail, MapPin, Calendar, Heart, AlertCircle, Pill, Droplet } from 'lucide-react';
import { calculateAge, getGenderLabel } from './patient-helpers';
import type { Patient } from '@/types';
import type { ConsentData } from '@/services/api/consentsApi';

/**
 * Formatea una fecha string (YYYY-MM-DD) sin desfase de timezone
 */
const formatConsentDate = (dateString: string, formatType: 'full' | 'short' = 'short'): string => {
  const mesesEspañol = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const match = String(dateString || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);

    if (formatType === 'full') {
      return `${day} de ${mesesEspañol[monthIndex]} de ${year}`;
    }
    return `${day.toString().padStart(2, '0')}/${(monthIndex + 1).toString().padStart(2, '0')}/${year}`;
  }

  return String(dateString || 'Fecha no disponible');
};

interface PatientDetailsModalProps {
  patient: Patient | null;
  canEditMedicalInfo: boolean;
  canViewMedicalHistory?: boolean;
  isReceptionist: boolean;
  patientConsents?: ConsentData[];
  isLoadingConsents?: boolean;
  onClose: () => void;
  onViewMedicalHistory: () => void;
  onViewPaymentHistory: () => void;
}

export const PatientDetailsModal = ({
  patient,
  canEditMedicalInfo,
  canViewMedicalHistory,
  isReceptionist,
  patientConsents = [],
  isLoadingConsents = false,
  onClose,
  onViewMedicalHistory,
  onViewPaymentHistory
}: PatientDetailsModalProps) => {
  const showMedicalHistoryButton = canViewMedicalHistory ?? canEditMedicalInfo;
  if (!patient) return null;

  const handleViewConsent = (consent: ConsentData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${consent.consent_title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
            .meta { background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .meta p { margin: 5px 0; }
            .content { line-height: 1.6; text-align: justify; }
            .signature { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .notes { background: #fffbeb; padding: 15px; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${consent.consent_title}</h1>
          <div class="meta">
            <p><strong>Tipo:</strong> ${consent.consent_type}</p>
            <p><strong>Paciente:</strong> ${consent.patient_name || patient.firstName + ' ' + patient.lastName}</p>
            <p><strong>Fecha:</strong> ${formatConsentDate(consent.consent_date, 'full')}</p>
            <p><strong>Estado:</strong> ${consent.is_signed ? '✅ Firmado' : '⏳ Pendiente'}</p>
            ${consent.signed_by_name ? `<p><strong>Firmado por:</strong> ${consent.signed_by_name}</p>` : ''}
          </div>
          <div class="content">${consent.consent_content}</div>
          ${consent.notes ? `<div class="notes"><strong>Notas:</strong><br/>${consent.notes.replace(/\\n/g, '<br/>')}</div>` : ''}
          <div class="signature">
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintConsent = (consent: ConsentData) => {
    handleViewConsent(consent);
  };

  const handleDownloadConsent = (consent: ConsentData) => {
    const content = `
CONSENTIMIENTO INFORMADO
========================

Título: ${consent.consent_title}
Tipo: ${consent.consent_type}
Paciente: ${consent.patient_name || patient.firstName + ' ' + patient.lastName}
Fecha: ${formatConsentDate(consent.consent_date, 'short')}
Estado: ${consent.is_signed ? 'Firmado' : 'Pendiente'}
${consent.signed_by_name ? `Firmado por: ${consent.signed_by_name}` : ''}

CONTENIDO:
----------
${consent.consent_content.replace(/<[^>]*>/g, '')}

${consent.notes ? `NOTAS:\n------\n${consent.notes}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consentimiento_${consent.consent_id}_${patient.dni}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-gray-500">DNI: {patient.dni}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  Información Personal
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(patient.birthDate).toLocaleDateString('es-ES')} ({calculateAge(patient.birthDate)} años)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{getGenderLabel(patient.gender)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{patient.email || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{patient.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{patient.address || 'No especificado'}</span>
                  </div>
                </div>
              </div>

              {/* Historia Médica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Historia Médica
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-red-400" />
                    <span className="text-gray-600">Tipo de Sangre:</span>
                    <span className="font-medium">{patient.medicalHistory.bloodType || 'No especificado'}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600">Alergias:</span>
                    </div>
                    {patient.medicalHistory.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 ml-6">
                        {patient.medicalHistory.allergies.map((allergy, index) => (
                          <span key={index} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 ml-6 text-xs">Ninguna</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">Condiciones:</span>
                    </div>
                    {patient.medicalHistory.conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1 ml-6">
                        {patient.medicalHistory.conditions.map((condition, index) => (
                          <span key={index} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                            {condition}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 ml-6 text-xs">Ninguna</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Medicamentos:</span>
                    </div>
                    {patient.medicalHistory.medications.length > 0 ? (
                      <div className="flex flex-wrap gap-1 ml-6">
                        {patient.medicalHistory.medications.map((medication, index) => (
                          <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {medication}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 ml-6 text-xs">Ninguno</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              {patient.emergencyContact && patient.emergencyContact.name && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Phone className="w-4 h-4 text-red-500" />
                    Contacto de Emergencia
                  </h4>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Nombre:</span>
                        <p className="font-medium">{patient.emergencyContact.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Relación:</span>
                        <p className="font-medium">{patient.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Teléfono:</span>
                        <p className="font-medium">{patient.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos Firmados */}
              <div className="md:col-span-2 pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">Documentos Firmados</h4>
                </div>

                {isLoadingConsents ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Cargando documentos...</span>
                  </div>
                ) : patientConsents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-2">No hay documentos firmados para este paciente.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {patientConsents.map((consent) => (
                      <div
                        key={consent.consent_id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">{consent.consent_title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                consent.is_signed
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {consent.is_signed ? 'Firmado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatConsentDate(consent.consent_date, 'short')} • {consent.consent_type}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleViewConsent(consent)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Ver documento"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadConsent(consent)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Descargar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintConsent(consent)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
            </button>
            {showMedicalHistoryButton && (
              <button
                onClick={onViewMedicalHistory}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FileText className="w-4 h-4" />
                Historial Médico
              </button>
            )}
            {isReceptionist && (
              <button
                onClick={onViewPaymentHistory}
                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <DollarSign className="w-4 h-4" />
                Historial de Pagos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
