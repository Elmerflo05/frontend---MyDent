/**
 * CONSENT SERVICE
 * Servicio para manejar la lógica de negocio de consentimientos informados
 *
 * NOTA: Este servicio actualmente usa almacenamiento en memoria como stub.
 * Requiere implementación de API real en el backend.
 */

import type { SignedConsent } from '@/types';
import type { ConsentFormData } from '@/components/consent';

// Almacenamiento temporal en memoria (stub)
let signedConsentsStore: SignedConsent[] = [];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SaveConsentResult {
  success: boolean;
  consent?: SignedConsent;
  error?: string;
}

export class ConsentService {
  /**
   * Obtiene consentimientos firmados según el rol del usuario
   */
  static async getSignedConsents(
    userId: string,
    userRole: string
  ): Promise<SignedConsent[]> {
    console.warn('⚠️ ConsentService.getSignedConsents: Usando almacenamiento en memoria (stub)');

    if (userRole === 'patient') {
      return signedConsentsStore.filter(c => c.pacienteId === userId);
    }
    return signedConsentsStore;
  }

  /**
   * Obtiene consentimientos firmados por paciente específico
   */
  static async getConsentsByPatient(
    patientId: string
  ): Promise<SignedConsent[]> {
    console.warn('⚠️ ConsentService.getConsentsByPatient: Usando almacenamiento en memoria (stub)');
    return signedConsentsStore.filter(c => c.pacienteId === patientId);
  }

  /**
   * Obtiene consentimientos firmados por doctor específico
   */
  static async getConsentsByDoctor(
    doctorId: string
  ): Promise<SignedConsent[]> {
    console.warn('⚠️ ConsentService.getConsentsByDoctor: Usando almacenamiento en memoria (stub)');
    return signedConsentsStore.filter(c => c.doctorId === doctorId);
  }

  /**
   * Obtiene un consentimiento firmado por ID
   */
  static async getConsentById(
    id: string
  ): Promise<SignedConsent | undefined> {
    console.warn('⚠️ ConsentService.getConsentById: Usando almacenamiento en memoria (stub)');
    return signedConsentsStore.find(c => c.id === id);
  }

  /**
   * Valida los datos del formulario antes de guardar
   */
  static validateConsentData(
    formData: ConsentFormData,
    consentimientoId?: string,
    consentimientoNombre?: string
  ): ValidationResult {
    const errors: string[] = [];

    // Validar consentimiento seleccionado
    if (!consentimientoId || !consentimientoNombre) {
      errors.push('No hay consentimiento seleccionado');
    }

    // Validar datos del paciente
    if (!formData.pacienteId || !formData.pacienteNombre) {
      errors.push('Debe seleccionar un paciente');
    }

    // Validar datos del doctor
    if (!formData.doctorNombre || !formData.doctorCop) {
      errors.push('Debe seleccionar un doctor');
    }

    // Validar firmas
    if (!formData.firmaPaciente) {
      errors.push('Falta la firma del paciente/representante');
    }

    if (!formData.firmaDoctor) {
      errors.push('Falta la firma del doctor');
    }

    // Validar fecha
    if (!formData.fecha) {
      errors.push('Debe especificar una fecha');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Guarda un consentimiento firmado
   */
  static async saveSignedConsent(
    formData: ConsentFormData,
    consentimientoId: string,
    consentimientoNombre: string,
    consentimientoCategoria: string,
    documentoHTML: string,
    createdBy: string
  ): Promise<SaveConsentResult> {
    console.warn('⚠️ ConsentService.saveSignedConsent: Usando almacenamiento en memoria (stub)');

    // Validar datos
    const validation = this.validateConsentData(
      formData,
      consentimientoId,
      consentimientoNombre
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0]
      };
    }

    // Crear el consentimiento
    const consent: SignedConsent = {
      id: `CONSENT-${Date.now()}`,
      pacienteId: formData.pacienteId!,
      consentimientoId,
      consentimientoNombre,
      consentimientoCategoria,

      // Datos del doctor
      doctorId: formData.doctorId,
      doctorNombre: formData.doctorNombre,
      doctorCop: formData.doctorCop,

      // Datos del paciente
      pacienteNombre: formData.pacienteNombre,
      pacienteDni: formData.pacienteDni,
      pacienteDomicilio: formData.pacienteDomicilio,

      // Representante legal
      tieneRepresentante: formData.tieneRepresentante || false,
      representanteNombre: formData.representanteNombre,
      representanteDni: formData.representanteDni,
      representanteDomicilio: formData.representanteDomicilio,

      // Firmas
      firmaPaciente: formData.firmaPaciente,
      firmaDoctor: formData.firmaDoctor,

      // Fecha y observaciones - Mantener como string para evitar desfase de timezone
      fechaConsentimiento: formData.fecha || new Date().toISOString().split('T')[0],
      observaciones: formData.observaciones,

      // HTML procesado
      documentoHTML,

      // Metadata
      estado: 'firmado',
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    signedConsentsStore.push(consent);

    return {
      success: true,
      consent
    };
  }

  /**
   * Filtra consentimientos por término de búsqueda
   */
  static filterConsents(
    consents: SignedConsent[],
    searchTerm: string
  ): SignedConsent[] {
    if (searchTerm === '') {
      return consents;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return consents.filter(consent =>
      consent.consentimientoNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.pacienteNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.pacienteDni.includes(searchTerm) ||
      consent.doctorNombre.toLowerCase().includes(lowerSearchTerm) ||
      consent.consentimientoCategoria.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Formatea una fecha para mostrar en español
   */
  static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
