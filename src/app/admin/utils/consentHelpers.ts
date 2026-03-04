import type { SignedConsent } from '@/types';
import { ConsentDocumentService } from '@/services/consent';
import { toast } from 'sonner';

/**
 * Abre el PDF del consentimiento firmado en una nueva ventana
 */
export const handleViewConsent = async (consent: SignedConsent) => {
  try {
    toast.loading('Generando PDF...');
    await ConsentDocumentService.printConsent(consent);
    toast.dismiss();
  } catch (error) {
    toast.dismiss();
    toast.error('Error al abrir el documento');
    console.error('Error al ver consentimiento:', error);
  }
};

/**
 * Imprime el PDF del consentimiento firmado
 */
export const handlePrintConsent = async (consent: SignedConsent) => {
  try {
    toast.loading('Preparando PDF...');
    await ConsentDocumentService.printConsent(consent);
    toast.dismiss();
  } catch (error) {
    toast.dismiss();
    toast.error('Error al imprimir el documento');
    console.error('Error al imprimir consentimiento:', error);
  }
};

/**
 * Descarga el PDF del consentimiento firmado
 */
export const handleDownloadConsent = async (consent: SignedConsent) => {
  try {
    toast.loading('Generando PDF...');
    await ConsentDocumentService.downloadConsent(consent);
    toast.dismiss();
    toast.success('PDF descargado');
  } catch (error) {
    toast.dismiss();
    toast.error('Error al descargar el documento');
    console.error('Error al descargar consentimiento:', error);
  }
};
