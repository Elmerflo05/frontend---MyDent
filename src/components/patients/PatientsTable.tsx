import { Eye, Edit, Mail, Phone, AlertTriangle, Heart, Activity, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateAge, getGenderLabel } from './patient-helpers';
import type { Patient } from '@/types';

interface PatientsTableProps {
  patients: Patient[];
  canEditMedicalInfo: boolean;
  canViewMedicalHistory?: boolean;
  onViewDetails: (patient: Patient) => void;
  onViewMedicalHistory: (patient: Patient) => void;
}

export const PatientsTable = ({
  patients,
  canEditMedicalInfo,
  canViewMedicalHistory,
  onViewDetails,
  onViewMedicalHistory
}: PatientsTableProps) => {
  // Use canViewMedicalHistory if provided, otherwise fall back to canEditMedicalInfo
  const showMedicalHistoryButton = canViewMedicalHistory ?? canEditMedicalInfo;
  const navigate = useNavigate();

  if (patients.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron pacientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Intenta ajustar los filtros o agregar un nuevo paciente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Información
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => {
              const age = calculateAge(patient.birthDate);
              const hasAllergies = patient.medicalHistory.allergies.length > 0;
              const hasConditions = patient.medicalHistory.conditions.length > 0;

              return (
                <tr key={patient.id} className="hover:bg-gray-50">
                  {/* Patient */}
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

                  {/* Contact */}
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

                  {/* Information */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {age} años • {getGenderLabel(patient.gender)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(patient.birthDate).toLocaleDateString('es-ES')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {patient.isBasicRegistration !== false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Información Incompleta
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Información Completa
                          </span>
                          {patient.medicalHistory.bloodType && (
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

                  {/* Registration Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.createdAt).toLocaleDateString('es-ES')}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(patient)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {patient.isBasicRegistration !== false ? (
                        canEditMedicalInfo && (
                          <button
                            onClick={() => navigate(`/clinic/patients/${patient.id}/complete`)}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Completar información"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <>
                          {showMedicalHistoryButton && (
                            <button
                              onClick={() => onViewMedicalHistory(patient)}
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                              title="Ver historial médico"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                          )}

                          {canEditMedicalInfo && (
                            <button
                              onClick={() => navigate(`/clinic/patients/${patient.id}/edit`)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Editar información básica"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
