import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, User, Stethoscope, AlertCircle, X, Printer } from 'lucide-react';
import { consentsApiService, type SignedConsent } from '@/services/api/consentsApiService';

/**
 * Parsea una fecha string (YYYY-MM-DD) sin conversión de timezone
 * Evita el problema de desfase que ocurre con new Date() en strings de fecha
 */
function parseDateStringWithoutTimezone(dateString: string): { day: number; month: number; year: number } | null {
  if (!dateString) return null;

  // Si viene en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) - 1, // 0-indexed para compatibilidad
      day: parseInt(match[3], 10)
    };
  }
  return null;
}

/**
 * Formatea una fecha string a formato legible sin desfase de timezone
 */
function formatDateWithoutTimezone(dateString: string, formatType: 'full' | 'short' | 'datetime' = 'full'): string {
  const mesesEspañol = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const parsed = parseDateStringWithoutTimezone(dateString);
  if (!parsed) return dateString;

  const { day, month, year } = parsed;

  switch (formatType) {
    case 'full':
      return `${day} de ${mesesEspañol[month]} de ${year}`;
    case 'short':
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    case 'datetime':
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    default:
      return `${day} de ${mesesEspañol[month]} de ${year}`;
  }
}

/**
 * Obtiene un timestamp para ordenamiento sin problemas de timezone
 */
function getDateTimestamp(dateString: string): number {
  const parsed = parseDateStringWithoutTimezone(dateString);
  if (!parsed) return 0;
  // Crear timestamp usando Date.UTC para evitar timezone
  return Date.UTC(parsed.year, parsed.month, parsed.day);
}

interface ConsentsListProps {
  patientId: string;
  showAddButton?: boolean;
  onAddConsent?: () => void;
}

export function ConsentsList({ patientId, showAddButton = false, onAddConsent }: ConsentsListProps) {
  const [consents, setConsents] = useState<SignedConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsent, setSelectedConsent] = useState<SignedConsent | null>(null);

  useEffect(() => {
    loadConsents();
  }, [patientId]);

  const loadConsents = async () => {
    try {
      setLoading(true);
      const response = await consentsApiService.getSignedConsents({
        patient_id: parseInt(patientId),
        limit: 1000
      });

      // ====== LOGS DE DIAGNÓSTICO DE FECHA ======
      console.log('📅 [ConsentsList] FECHAS RECIBIDAS DE API:', {
        total_consents: response.consents.length,
        primeros_3: response.consents.slice(0, 3).map(c => ({
          id: c.id,
          fechaConsentimiento: c.fechaConsentimiento,
          tipo: typeof c.fechaConsentimiento
        }))
      });

      // Ordenar por fecha descendente - Usando función sin timezone
      const sortedConsents = response.consents.sort((a, b) =>
        getDateTimestamp(b.fechaConsentimiento) - getDateTimestamp(a.fechaConsentimiento)
      );
      setConsents(sortedConsents);
    } catch (error) {
      console.error('Error al cargar consentimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (consent: SignedConsent) => {
    // ====== LOG DE DIAGNÓSTICO DE FECHA ======
    console.log('📅 [ConsentsList] VISUALIZAR CONSENTIMIENTO:', {
      id: consent.id,
      fechaConsentimiento_raw: consent.fechaConsentimiento,
      tipo_fechaConsentimiento: typeof consent.fechaConsentimiento,
      fechaFormateada: formatDateWithoutTimezone(consent.fechaConsentimiento, 'full')
    });
    setSelectedConsent(consent);
  };

  const handleDownload = async (consent: SignedConsent) => {
    // Crear un HTML completo del consentimiento para descargar como PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${consent.consentimientoNombre}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .content {
            line-height: 1.6;
            text-align: justify;
          }
          .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-block {
            text-align: center;
          }
          .info-box {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${consent.consentimientoNombre}</h1>
          <p><strong>Categoría:</strong> ${consent.consentimientoCategoria}</p>
        </div>

        <div class="info-box">
          <p><strong>Paciente:</strong> ${consent.pacienteNombre}</p>
          <p><strong>DNI:</strong> ${consent.pacienteDni}</p>
          <p><strong>Domicilio:</strong> ${consent.pacienteDomicilio}</p>
          <p><strong>Fecha:</strong> ${formatDateWithoutTimezone(consent.fechaConsentimiento, 'full')}</p>
        </div>

        ${consent.tieneRepresentante ? `
          <div class="info-box">
            <p><strong>Representante Legal:</strong> ${consent.representanteNombre}</p>
            <p><strong>DNI Representante:</strong> ${consent.representanteDni}</p>
            <p><strong>Domicilio Representante:</strong> ${consent.representanteDomicilio}</p>
          </div>
        ` : ''}

        <div class="content">
          ${consent.documentoHTML}
        </div>

        ${consent.observaciones ? `
          <div class="info-box">
            <p><strong>Observaciones:</strong></p>
            <p>${consent.observaciones}</p>
          </div>
        ` : ''}

        <div class="footer">
          <div class="signature-block">
            <p>El Paciente o</p>
            <p>Representante Legal</p>
            <p>_________________________</p>
            <p>${consent.tieneRepresentante ? consent.representanteNombre : consent.pacienteNombre}</p>
          </div>
          <div class="signature-block">
            <p>El Odontólogo / Estomatólogo</p>
            <p>_________________________</p>
            <p>${consent.doctorNombre}</p>
            <p>COP ${consent.doctorCop}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Crear un blob y descargar
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consentimiento-${consent.consentimientoId}-${consent.pacienteDni}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = (consent: SignedConsent) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${consent.consentimientoNombre}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .content {
              line-height: 1.6;
              text-align: justify;
            }
            .footer {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .signature-block {
              text-align: center;
            }
            .info-box {
              background-color: #f5f5f5;
              padding: 15px;
              margin: 20px 0;
              border-left: 4px solid #3b82f6;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${consent.consentimientoNombre}</h1>
            <p><strong>Categoría:</strong> ${consent.consentimientoCategoria}</p>
          </div>

          <div class="info-box">
            <p><strong>Paciente:</strong> ${consent.pacienteNombre}</p>
            <p><strong>DNI:</strong> ${consent.pacienteDni}</p>
            <p><strong>Domicilio:</strong> ${consent.pacienteDomicilio}</p>
            <p><strong>Fecha:</strong> ${formatDateWithoutTimezone(consent.fechaConsentimiento, 'full')}</p>
          </div>

          ${consent.tieneRepresentante ? `
            <div class="info-box">
              <p><strong>Representante Legal:</strong> ${consent.representanteNombre}</p>
              <p><strong>DNI Representante:</strong> ${consent.representanteDni}</p>
              <p><strong>Domicilio Representante:</strong> ${consent.representanteDomicilio}</p>
            </div>
          ` : ''}

          <div class="content">
            ${consent.documentoHTML}
          </div>

          ${consent.observaciones ? `
            <div class="info-box">
              <p><strong>Observaciones:</strong></p>
              <p>${consent.observaciones}</p>
            </div>
          ` : ''}

          <div class="footer">
            <div class="signature-block">
              <p>El Paciente o</p>
              <p>Representante Legal</p>
              <p style="margin-top: 40px;">_________________________</p>
              <p>${consent.tieneRepresentante ? consent.representanteNombre : consent.pacienteNombre}</p>
            </div>
            <div class="signature-block">
              <p>El Odontólogo / Estomatólogo</p>
              <p style="margin-top: 40px;">_________________________</p>
              <p>${consent.doctorNombre}</p>
              <p>COP ${consent.doctorCop}</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      {showAddButton && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Consentimientos Informados</h3>
          <button
            onClick={onAddConsent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Nuevo Consentimiento
          </button>
        </div>
      )}

      {/* Lista de consentimientos */}
      {consents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No hay consentimientos firmados</p>
          <p className="text-sm text-gray-500 mt-1">
            Los consentimientos informados aparecerán aquí una vez firmados
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{consent.consentimientoNombre}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {consent.consentimientoCategoria}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {formatDateWithoutTimezone(consent.fechaConsentimiento, 'short')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span>Dr. {consent.doctorNombre}</span>
                    </div>
                    {consent.tieneRepresentante && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Representante: {consent.representanteNombre}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleView(consent)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Ver consentimiento"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handlePrint(consent)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Imprimir"
                  >
                    <FileText className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDownload(consent)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualización con patrón común */}
      {selectedConsent && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-black/50 overflow-y-auto"
          onClick={() => setSelectedConsent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedConsent.consentimientoNombre}</h3>
                    <p className="text-sm text-white/80">{selectedConsent.consentimientoCategoria}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConsent(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {/* Información del paciente */}
              <div className="bg-white rounded-lg border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Datos del Paciente</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p><span className="font-medium text-gray-600">Nombre:</span> {selectedConsent.pacienteNombre}</p>
                  <p><span className="font-medium text-gray-600">DNI:</span> {selectedConsent.pacienteDni}</p>
                  <p className="col-span-2"><span className="font-medium text-gray-600">Domicilio:</span> {selectedConsent.pacienteDomicilio}</p>
                  <p className="col-span-2">
                    <span className="font-medium text-gray-600">Fecha:</span>{' '}
                    {formatDateWithoutTimezone(selectedConsent.fechaConsentimiento, 'full')}
                  </p>
                </div>
              </div>

              {/* Representante legal si existe */}
              {selectedConsent.tieneRepresentante && (
                <div className="bg-white rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Representante Legal</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium text-gray-600">Nombre:</span> {selectedConsent.representanteNombre}</p>
                    <p><span className="font-medium text-gray-600">DNI:</span> {selectedConsent.representanteDni}</p>
                    <p className="col-span-2">
                      <span className="font-medium text-gray-600">Domicilio:</span> {selectedConsent.representanteDomicilio}
                    </p>
                  </div>
                </div>
              )}

              {/* Contenido del consentimiento */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedConsent.documentoHTML }}
                />
              </div>

              {/* Observaciones */}
              {selectedConsent.observaciones && (
                <div className="bg-white rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-gray-900">Observaciones</h4>
                  </div>
                  <p className="text-sm text-gray-700">{selectedConsent.observaciones}</p>
                </div>
              )}

              {/* Datos del doctor */}
              <div className="bg-white rounded-lg border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Cirujano Dentista</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p><span className="font-medium text-gray-600">Nombre:</span> {selectedConsent.doctorNombre}</p>
                  <p><span className="font-medium text-gray-600">COP:</span> {selectedConsent.doctorCop}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedConsent(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => handlePrint(selectedConsent)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => handleDownload(selectedConsent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
