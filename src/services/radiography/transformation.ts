/**
 * Servicios de transformación de datos para formularios de radiografía
 *
 * Este módulo centraliza la lógica de transformación de datos del formulario
 * al formato de submission que se envía al backend.
 *
 * MIGRADO: Usa tipos unificados de @/components/laboratory-form/types
 */

import type {
  PatientData,
  DoctorData,
  Tomografia3DFormData,
  RadiografiasFormData
} from '@/components/laboratory-form/types';
import type { PublicFormSubmission, PublicForm } from '@/types';
import {
  determineCampoEstudio,
  hasIntraoralSelected,
  hasExtraoralSelected,
  hasOrtodonciaSelected,
  buildAnalisisCefalometricos
} from './helpers';

/**
 * Transforma los datos del formulario al formato de submission
 *
 * Esta es la función crítica que convierte los datos del formulario
 * en el objeto que se envía al backend. Cualquier error aquí
 * resulta en datos corruptos.
 *
 * ACTUALIZADO: Ahora recibe tipos unificados separados (PatientData, DoctorData, Tomografia3DFormData)
 */
export const transformToSubmission = (
  patient: PatientData,
  doctor: DoctorData,
  tomografia: Tomografia3DFormData,
  radiografias: RadiografiasFormData,
  form: Pick<PublicForm, 'id' | 'code' | 'title'>
): Omit<PublicFormSubmission, 'submittedAt'> => {
  const hasIntraoral = hasIntraoralSelected(radiografias);
  const hasExtraoral = hasExtraoralSelected(radiografias);
  const hasOrtodoncia = hasOrtodonciaSelected(radiografias);
  const analisisCefalometricos = buildAnalisisCefalometricos(radiografias);
  const campoEstudio = determineCampoEstudio(tomografia);

  // Construir nombre completo del paciente
  const nombreCompleto = `${patient.nombres} ${patient.apellidos}`.trim();
  // Construir nombre completo del doctor
  const doctorNombreCompleto = `${doctor.nombres} ${doctor.apellidos}`.trim();

  return {
    id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    formId: form.id,
    formCode: form.code,
    formTitle: form.title,
    status: 'nuevo',
    formType: 'radiography',
    radiographyData: {
      patientData: {
        nombre: nombreCompleto,
        edad: patient.edad || undefined,
        dni: patient.dni,
        telefono: patient.telefono || undefined,
        motivoConsulta: patient.motivoConsulta || undefined
      },
      doctorData: {
        doctor: doctorNombreCompleto,
        cop: doctor.cop || undefined,
        direccion: doctor.direccion || undefined,
        email: doctor.email || undefined,
        telefono: doctor.telefono || undefined
      },
      tomography: {
        entregaSinInforme: tomografia.sinInforme,
        entregaConInforme: tomografia.conInforme,
        entregaDicom: tomografia.dicom,
        entregaUsb: tomografia.soloUsb,
        campoEstudio,
        campoEstudioDetalle: tomografia.otros || undefined
      },
      radiography: {
        ...(hasIntraoral && {
          intraorales: {
            tipo: radiografias.intraoralTipo,
            // Combinar dientes físicos y digitales para la submission
            dientesSuperiores: [...radiografias.dientesSuperioresFisico, ...radiografias.dientesSuperioresDigital].length > 0
              ? [...radiografias.dientesSuperioresFisico, ...radiografias.dientesSuperioresDigital]
              : undefined,
            dientesInferiores: [...radiografias.dientesInferioresFisico, ...radiografias.dientesInferioresDigital].length > 0
              ? [...radiografias.dientesInferioresFisico, ...radiografias.dientesInferioresDigital]
              : undefined,
            dientesTemporales: [...radiografias.dientesTemporalesFisico, ...radiografias.dientesTemporalesDigital].length > 0
              ? [...radiografias.dientesTemporalesFisico, ...radiografias.dientesTemporalesDigital]
              : undefined,
            ...(radiografias.bitewingMolaresDerecha || radiografias.bitewingMolaresIzquierda ||
                radiografias.bitewingPremolaresDerecha || radiografias.bitewingPremolaresIzquierda) && {
              bitewing: {
                ...(radiografias.bitewingMolaresDerecha || radiografias.bitewingMolaresIzquierda) && {
                  molares: {
                    derecha: radiografias.bitewingMolaresDerecha,
                    izquierda: radiografias.bitewingMolaresIzquierda
                  }
                },
                ...(radiografias.bitewingPremolaresDerecha || radiografias.bitewingPremolaresIzquierda) && {
                  premolares: {
                    derecha: radiografias.bitewingPremolaresDerecha,
                    izquierda: radiografias.bitewingPremolaresIzquierda
                  }
                }
              }
            },
            ...(radiografias.oclusalSuperiores || radiografias.oclusalInferiores) && {
              oclusal: {
                superiores: radiografias.oclusalSuperiores,
                inferiores: radiografias.oclusalInferiores
              }
            },
            seriada: radiografias.seriada || undefined,
            fotografiaIntraoral: radiografias.fotografiaIntraoral || undefined,
            fotografiaExtraoral: radiografias.fotografiaExtraoral || undefined
          }
        }),
        ...(hasExtraoral && {
          extraorales: {
            tipo: radiografias.extraoralTipo,
            estudios: {
              panoramica: radiografias.extraoralPanoramica || undefined,
              cefalometrica: radiografias.extraoralCefalometrica || undefined,
              carpal: radiografias.extraoralCarpal || undefined,
              carpalFishman: radiografias.carpalFishman || undefined,
              carpalTtw2: radiografias.carpalTtw2 || undefined,
              posteriorAnterior: radiografias.extraoralPosteriorAnterior || undefined,
              posteriorAnteriorRicketts: radiografias.posteriorAnteriorRicketts || undefined,
              atmBocaAbierta: radiografias.extraoralAtmAbierta || undefined,
              atmBocaCerrada: radiografias.extraoralAtmCerrada || undefined,
              fotografiaExtraoral: radiografias.extraoralFotografia || undefined
            }
          }
        }),
        ...(hasOrtodoncia && {
          asesoriaOrtodoncia: {
            tipo: radiografias.ortodonciaTipo,
            paquete: radiografias.ortodonciaPaquete > 0 ? radiografias.ortodonciaPaquete as 1 | 2 | 3 : undefined,
            planTratamiento: radiografias.ortodonciaPlanTratamiento || undefined,
            alineadoresInvisibles: radiografias.ortodonciaAlineadores || undefined,
            alineadoresPlanificacion: radiografias.alineadoresPlanificacion || undefined,
            alineadoresImpresion: radiografias.alineadoresImpresion || undefined,
            escaneoBucal: radiografias.ortodonciaEscaneo || undefined,
            escaneoIntraoral: radiografias.escaneoIntraoral || undefined,
            escaneoIntraoralZocalo: radiografias.escaneoIntraoralZocalo || undefined,
            escaneoIntraoralInforme: radiografias.escaneoIntraoralInforme || undefined,
            impresionDigital: radiografias.ortodonciaImpresion || undefined,
            modelosDigitalesConInforme: radiografias.modelosDigitalesConInforme || undefined,
            modelosDigitalesSinInforme: radiografias.modelosDigitalesSinInforme || undefined,
            modelosImpresionDigital: radiografias.modelosImpresionDigital || undefined,
            conGuia: radiografias.ortodonciaConGuia || undefined,
            guiaImpresa: radiografias.ortodonciaGuiaImpresa || undefined
          }
        }),
        ...(analisisCefalometricos.length > 0 && {
          analisisCefalometricos
        })
      }
    }
  };
};
