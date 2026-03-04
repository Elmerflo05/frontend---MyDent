/**
 * HOOK: useConsentActions
 * Maneja las acciones sobre consentimientos (guardar, descargar, imprimir)
 * Versión actualizada para usar API en lugar de IndexedDB
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { ConsentFormData } from '@/components/consent';
import { consentsApiService, type ConsentTemplate, type SignedConsent, type CreateSignedConsentPayload } from '@/services/api/consentsApiService';
import { ConsentDocumentService } from '@/services/consent';

export const useConsentActions = () => {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Guardar un consentimiento firmado usando la API
   */
  const saveConsent = async (
    formData: ConsentFormData,
    selectedConsentimiento: ConsentTemplate | null,
    userId: string,
    onSuccess?: () => void
  ): Promise<boolean> => {
    if (!selectedConsentimiento) {
      toast.error('No hay consentimiento seleccionado');
      return false;
    }

    // Validar datos requeridos
    if (!formData.pacienteId || isNaN(parseInt(formData.pacienteId))) {
      toast.error('Debe seleccionar un paciente válido');
      return false;
    }

    if (!formData.firmaPaciente) {
      toast.error('Falta la firma del paciente');
      return false;
    }

    if (!formData.doctorNombre || !formData.doctorCop) {
      toast.error('Debe seleccionar un doctor');
      return false;
    }

    setIsSaving(true);

    try {
      // ====== LOGS DE DIAGNÓSTICO DE FECHA ======
      console.log('📅 [useConsentActions] DIAGNÓSTICO DE FECHA - INICIO:', {
        '1_fechaDelFormulario': formData.fecha,
        '1_tipoFechaFormulario': typeof formData.fecha,
        '2_formatDateToYMD_resultado': formatDateToYMD(new Date()),
        '3_fechaActualSistema': new Date().toISOString(),
        '4_timezoneOffset': new Date().getTimezoneOffset(),
        '5_timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      // Procesar el contenido del consentimiento con los datos del formulario
      const documentoHTML = ConsentDocumentService.processConsentContent(
        selectedConsentimiento.contenido,
        formData
      );

      // Determinar la fecha a usar
      const fechaFinal = formData.fecha || formatDateToYMD(new Date());
      console.log('📅 [useConsentActions] FECHA FINAL A ENVIAR:', {
        fechaFinal,
        tipoFechaFinal: typeof fechaFinal,
        usóFormDataFecha: !!formData.fecha,
        usóFallback: !formData.fecha
      });

      // Preparar payload para la API
      const payload: CreateSignedConsentPayload = {
        patient_id: parseInt(formData.pacienteId),
        consent_template_id: selectedConsentimiento.templateId || parseInt(selectedConsentimiento.id),
        consent_date: fechaFinal,
        consent_content: documentoHTML,
        signature_data: formData.firmaPaciente,
        signed_by: `Paciente: ${formData.pacienteNombre} | Doctor: ${formData.doctorNombre} COP: ${formData.doctorCop}`,
        witness_name: formData.doctorNombre,
        witness_signature_data: formData.firmaDoctor,
        notes: formData.observaciones
      };

      // Guardar usando la API
      console.log('📅 [useConsentActions] PAYLOAD COMPLETO:', {
        consent_date_en_payload: payload.consent_date,
        tipo_consent_date: typeof payload.consent_date
      });
      console.log('[useConsentActions] Enviando payload:', payload);
      const result = await consentsApiService.createSignedConsent(payload);
      console.log('📅 [useConsentActions] RESULTADO DE API:', {
        fechaConsentimiento_recibida: result.fechaConsentimiento,
        tipo_fechaConsentimiento: typeof result.fechaConsentimiento
      });
      console.log('[useConsentActions] Resultado:', result);

      toast.success('Consentimiento guardado exitosamente');

      // Ejecutar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error('Error al guardar consentimiento:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el consentimiento');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Descargar un consentimiento firmado como PDF
   */
  const downloadConsent = async (consent: SignedConsent) => {
    try {
      toast.loading('Generando PDF...');
      await ConsentDocumentService.downloadConsent(consent);
      toast.dismiss();
      toast.success('PDF descargado correctamente');
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Error al descargar el consentimiento');
    }
  };

  /**
   * Imprimir un consentimiento firmado (abre PDF en nueva ventana)
   */
  const printConsent = async (consent: SignedConsent) => {
    try {
      toast.loading('Preparando PDF...');
      await ConsentDocumentService.printConsent(consent);
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Error al imprimir el consentimiento');
    }
  };

  /**
   * Imprimir un consentimiento desde la plantilla procesada
   */
  const printConsentTemplate = (
    consentimiento: ConsentTemplate,
    formData: ConsentFormData
  ) => {
    try {
      const contenidoProcesado = ConsentDocumentService.processConsentContent(
        consentimiento.contenido,
        formData
      );

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Por favor, permite las ventanas emergentes para imprimir');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${consentimiento.nombre}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 40px;
                line-height: 1.6;
              }
              h1 {
                color: #1f2937;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 10px;
              }
              .content {
                margin-top: 20px;
              }
              @media print {
                body { margin: 20px; }
              }
            </style>
          </head>
          <body>
            <h1>${consentimiento.nombre}</h1>
            <div class="content">
              ${contenidoProcesado}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al imprimir el consentimiento');
    }
  };

  return {
    isSaving,
    saveConsent,
    downloadConsent,
    printConsent,
    printConsentTemplate
  };
};
