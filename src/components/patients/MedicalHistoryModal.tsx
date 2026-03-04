import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { formatTimestampToLima } from '@/utils/dateUtils';
import {
  FileText,
  X,
  AlertTriangle,
  Heart,
  Pill,
  Scissors,
  Droplets,
  Baby,
  Cigarette,
  Wine,
  Calendar,
  CheckCircle,
  XCircle,
  ClipboardList
} from 'lucide-react';
import type { Patient } from '@/types';
import type { MedicalHistoryData } from '@/services/api/medicalHistoriesApi';

interface MedicalHistoryModalProps {
  isOpen: boolean;
  patient: Patient | null;
  medicalHistory: MedicalHistoryData | null;
  onClose: () => void;
}

export const MedicalHistoryModal = ({
  isOpen,
  patient,
  medicalHistory,
  onClose
}: MedicalHistoryModalProps) => {
  if (!isOpen || !patient) return null;

  const patientFullName = `${patient.firstName} ${patient.lastName}`;

  // Helper para mostrar estado booleano con icono
  const BooleanStatus = ({ value, label }: { value?: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      {value ? (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          <CheckCircle className="w-4 h-4" />
          Sí
        </span>
      ) : (
        <span className="flex items-center gap-1 text-green-600 font-medium">
          <XCircle className="w-4 h-4" />
          No
        </span>
      )}
    </div>
  );

  // Helper para mostrar descripción si existe
  const DescriptionItem = ({
    hasCondition,
    description,
    label,
    icon: Icon,
    bgColor = 'bg-red-50',
    textColor = 'text-red-800'
  }: {
    hasCondition?: boolean;
    description?: string;
    label: string;
    icon: any;
    bgColor?: string;
    textColor?: string;
  }) => {
    if (!hasCondition || !description) return null;

    return (
      <div className={`${bgColor} rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${textColor}`} />
          <h4 className={`font-semibold ${textColor}`}>{label}</h4>
        </div>
        <p className={`text-sm ${textColor}`}>{description}</p>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Antecedentes Médicos</h3>
              <p className="text-sm text-gray-600">{patientFullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {!medicalHistory ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin antecedentes médicos</h3>
              <p className="text-sm text-gray-600">No se han registrado antecedentes médicos para este paciente</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Fecha de registro */}
              {medicalHistory.date_time_registration && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Registrado el {formatTimestampToLima(medicalHistory.date_time_registration, 'date')}</span>
                </div>
              )}

              {/* Sección de Alergias */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-900">Alergias</h4>
                </div>
                <BooleanStatus value={medicalHistory.has_allergies} label="¿Tiene alergias?" />
                {medicalHistory.has_allergies && medicalHistory.allergies_description && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-3">
                    <p className="text-sm text-orange-800">{medicalHistory.allergies_description}</p>
                  </div>
                )}
              </div>

              {/* Grid de condiciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enfermedades Crónicas */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <h4 className="font-semibold text-gray-900">Enfermedades Crónicas</h4>
                  </div>
                  <BooleanStatus value={medicalHistory.has_chronic_diseases} label="¿Tiene enfermedades crónicas?" />
                  {medicalHistory.has_chronic_diseases && medicalHistory.chronic_diseases_description && (
                    <div className="mt-3 bg-red-50 rounded-lg p-3">
                      <p className="text-sm text-red-800">{medicalHistory.chronic_diseases_description}</p>
                    </div>
                  )}
                </div>

                {/* Medicamentos Actuales */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="w-5 h-5 text-green-500" />
                    <h4 className="font-semibold text-gray-900">Medicamentos Actuales</h4>
                  </div>
                  <BooleanStatus value={medicalHistory.has_medications} label="¿Toma medicamentos?" />
                  {medicalHistory.has_medications && medicalHistory.current_medications && (
                    <div className="mt-3 bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-800">{medicalHistory.current_medications}</p>
                    </div>
                  )}
                </div>

                {/* Cirugías Previas */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Scissors className="w-5 h-5 text-purple-500" />
                    <h4 className="font-semibold text-gray-900">Cirugías Previas</h4>
                  </div>
                  <BooleanStatus value={medicalHistory.has_surgeries} label="¿Ha tenido cirugías?" />
                  {medicalHistory.has_surgeries && medicalHistory.surgeries_description && (
                    <div className="mt-3 bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-purple-800">{medicalHistory.surgeries_description}</p>
                    </div>
                  )}
                </div>

                {/* Trastornos de Sangrado */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-5 h-5 text-red-500" />
                    <h4 className="font-semibold text-gray-900">Trastornos de Sangrado</h4>
                  </div>
                  <BooleanStatus value={medicalHistory.has_bleeding_disorders} label="¿Tiene trastornos de sangrado?" />
                  {medicalHistory.has_bleeding_disorders && medicalHistory.bleeding_disorders_description && (
                    <div className="mt-3 bg-red-50 rounded-lg p-3">
                      <p className="text-sm text-red-800">{medicalHistory.bleeding_disorders_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Condiciones específicas */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-gray-900">Condiciones Específicas</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <BooleanStatus value={medicalHistory.has_diabetes} label="Diabetes" />
                  <BooleanStatus value={medicalHistory.has_hypertension} label="Hipertensión" />
                  <BooleanStatus value={medicalHistory.has_heart_disease} label="Enfermedad Cardíaca" />
                </div>
                {medicalHistory.has_heart_disease && medicalHistory.heart_disease_description && (
                  <div className="mt-3 bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-800">{medicalHistory.heart_disease_description}</p>
                  </div>
                )}
              </div>

              {/* Embarazo/Lactancia (si aplica) */}
              {(medicalHistory.is_pregnant || medicalHistory.is_breastfeeding) && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Baby className="w-5 h-5 text-pink-500" />
                    <h4 className="font-semibold text-pink-900">Estado Maternal</h4>
                  </div>
                  {medicalHistory.is_pregnant && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-pink-800">Embarazada</span>
                      <span className="font-medium text-pink-900">
                        {medicalHistory.pregnancy_months ? `${medicalHistory.pregnancy_months} meses` : 'Sí'}
                      </span>
                    </div>
                  )}
                  {medicalHistory.is_breastfeeding && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-pink-800">En período de lactancia</span>
                      <span className="font-medium text-pink-900">Sí</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hábitos */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Hábitos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Cigarette className={`w-5 h-5 ${medicalHistory.smokes ? 'text-orange-500' : 'text-gray-400'}`} />
                    <div>
                      <span className="text-gray-700 block">Tabaco</span>
                      <span className={`text-sm font-medium ${medicalHistory.smokes ? 'text-orange-600' : 'text-green-600'}`}>
                        {medicalHistory.smokes
                          ? (medicalHistory.smoking_frequency || 'Sí')
                          : 'No fuma'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Wine className={`w-5 h-5 ${medicalHistory.drinks_alcohol ? 'text-purple-500' : 'text-gray-400'}`} />
                    <div>
                      <span className="text-gray-700 block">Alcohol</span>
                      <span className={`text-sm font-medium ${medicalHistory.drinks_alcohol ? 'text-purple-600' : 'text-green-600'}`}>
                        {medicalHistory.drinks_alcohol
                          ? (medicalHistory.alcohol_frequency || 'Sí')
                          : 'No bebe'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Última visita dental */}
              {medicalHistory.last_dental_visit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-blue-900">Última Visita Dental</h4>
                  </div>
                  <p className="text-sm text-blue-800">
                    {new Date(medicalHistory.last_dental_visit).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {medicalHistory.dental_visit_reason && (
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Motivo:</strong> {medicalHistory.dental_visit_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Antecedentes Patológicos */}
              {medicalHistory.pathological_background && medicalHistory.pathological_background.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Antecedentes Patológicos</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.pathological_background.map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas Adicionales */}
              {medicalHistory.additional_notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <h4 className="font-semibold text-gray-900">Notas Adicionales</h4>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{medicalHistory.additional_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
