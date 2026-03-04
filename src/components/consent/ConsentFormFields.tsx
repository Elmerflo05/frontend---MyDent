/**
 * Componente de campos de formulario para consentimientos informados
 * Incluye comboboxes para seleccionar paciente, representante legal y doctor
 * Migrado para usar API real en lugar de IndexedDB
 */

import { useState, useEffect } from 'react';
import { User, UserCheck, Stethoscope, Calendar, PenLine } from 'lucide-react';
import patientsApi, { PatientData } from '@/services/api/patientsApi';
import dentistsApi, { DentistData } from '@/services/api/dentistsApi';
import { SignaturePad } from './SignaturePad';

export interface ConsentFormData {
  // Datos del paciente
  pacienteId?: string;
  pacienteNombre: string;
  pacienteDni: string;
  pacienteDomicilio: string;

  // Datos del representante legal (si aplica)
  tieneRepresentante: boolean;
  representanteId?: string;
  representanteNombre: string;
  representanteDni: string;
  representanteDomicilio: string;

  // Datos del doctor
  doctorId?: string;
  doctorNombre: string;
  doctorCop: string;

  // Fecha del consentimiento
  fecha: string;

  // Observaciones adicionales
  observaciones?: string;

  // Firmas digitales
  firmaPaciente: string; // Base64 de la firma del paciente/representante
  firmaDoctor: string; // Base64 de la firma del doctor
}

interface ConsentFormFieldsProps {
  data: ConsentFormData;
  onChange: (data: ConsentFormData) => void;
}

export const ConsentFormFields = ({ data, onChange }: ConsentFormFieldsProps) => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [doctors, setDoctors] = useState<DentistData[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  // Cargar pacientes y doctores al montar el componente desde API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar pacientes desde API
        const patientsResponse = await patientsApi.getPatients({ limit: 500 });
        if (patientsResponse.success && patientsResponse.data) {
          setPatients(patientsResponse.data);
        }
        setIsLoadingPatients(false);

        // Cargar doctores desde API
        const dentistsResponse = await dentistsApi.getDentists({ limit: 100, is_active: true });
        if (dentistsResponse.success && dentistsResponse.data) {
          setDoctors(dentistsResponse.data);
        }
        setIsLoadingDoctors(false);
      } catch (error) {
        console.error('[ConsentFormFields] Error cargando datos:', error);
        setIsLoadingPatients(false);
        setIsLoadingDoctors(false);
      }
    };

    loadData();
  }, []);

  // Calcular edad desde fecha de nacimiento
  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Manejar selección de paciente
  const handlePatientSelect = (patientId: string) => {
    if (!patientId) {
      onChange({
        ...data,
        pacienteId: undefined,
        pacienteNombre: '',
        pacienteDni: '',
        pacienteDomicilio: ''
      });
      return;
    }

    const selectedPatient = patients.find(p => p.patient_id?.toString() === patientId);
    if (selectedPatient) {
      const age = selectedPatient.birth_date ? calculateAge(new Date(selectedPatient.birth_date)) : 18;
      onChange({
        ...data,
        pacienteId: selectedPatient.patient_id?.toString(),
        pacienteNombre: `${selectedPatient.first_name} ${selectedPatient.last_name}${selectedPatient.second_last_name ? ' ' + selectedPatient.second_last_name : ''}`,
        pacienteDni: selectedPatient.identification_number || '',
        pacienteDomicilio: selectedPatient.address || '',
        // Si es menor de edad, activar campo de representante
        tieneRepresentante: age < 18
      });
    }
  };

  // Manejar selección de representante
  const handleRepresentanteSelect = (patientId: string) => {
    if (!patientId) {
      onChange({
        ...data,
        representanteId: undefined,
        representanteNombre: '',
        representanteDni: '',
        representanteDomicilio: ''
      });
      return;
    }

    const selectedPatient = patients.find(p => p.patient_id?.toString() === patientId);
    if (selectedPatient) {
      onChange({
        ...data,
        representanteId: selectedPatient.patient_id?.toString(),
        representanteNombre: `${selectedPatient.first_name} ${selectedPatient.last_name}${selectedPatient.second_last_name ? ' ' + selectedPatient.second_last_name : ''}`,
        representanteDni: selectedPatient.identification_number || '',
        representanteDomicilio: selectedPatient.address || ''
      });
    }
  };

  // Manejar selección de doctor
  const handleDoctorSelect = (doctorId: string) => {
    if (!doctorId) {
      onChange({
        ...data,
        doctorId: undefined,
        doctorNombre: '',
        doctorCop: ''
      });
      return;
    }

    const selectedDoctor = doctors.find(d => d.dentist_id?.toString() === doctorId);
    if (selectedDoctor) {
      onChange({
        ...data,
        doctorId: selectedDoctor.dentist_id?.toString(),
        doctorNombre: `${selectedDoctor.first_name || ''} ${selectedDoctor.last_name || ''}`.trim(),
        doctorCop: selectedDoctor.professional_license || selectedDoctor.license_number || ''
      });
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Datos del Consentimiento</h3>
      </div>

      {/* DATOS DEL PACIENTE */}
      <div className="bg-white rounded-lg p-5 border border-blue-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Datos del Paciente</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Paciente <span className="text-red-500">*</span>
            </label>
            <select
              value={data.pacienteId || ''}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoadingPatients}
            >
              <option value="">
                {isLoadingPatients ? 'Cargando pacientes...' : 'Seleccione un paciente o ingrese datos manualmente'}
              </option>
              {patients.map((patient) => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.first_name} {patient.last_name}{patient.second_last_name ? ' ' + patient.second_last_name : ''} - DNI: {patient.identification_number || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pacienteNombre}
              onChange={(e) => onChange({ ...data, pacienteNombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del paciente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pacienteDni}
              onChange={(e) => onChange({ ...data, pacienteDni: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="DNI del paciente"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pacienteDomicilio}
              onChange={(e) => onChange({ ...data, pacienteDomicilio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección del paciente"
              required
            />
          </div>
        </div>
      </div>

      {/* REPRESENTANTE LEGAL */}
      <div className="bg-white rounded-lg p-5 border border-amber-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Representante Legal (Opcional)</h4>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.tieneRepresentante}
              onChange={(e) => onChange({ ...data, tieneRepresentante: e.target.checked })}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Requiere representante</span>
          </label>
        </div>

        {data.tieneRepresentante && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Representante
              </label>
              <select
                value={data.representanteId || ''}
                onChange={(e) => handleRepresentanteSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={isLoadingPatients}
              >
                <option value="">
                  {isLoadingPatients ? 'Cargando...' : 'Seleccione un representante o ingrese datos manualmente'}
                </option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.first_name} {patient.last_name}{patient.second_last_name ? ' ' + patient.second_last_name : ''} - DNI: {patient.identification_number || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={data.representanteNombre}
                onChange={(e) => onChange({ ...data, representanteNombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Nombre del representante"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI
              </label>
              <input
                type="text"
                value={data.representanteDni}
                onChange={(e) => onChange({ ...data, representanteDni: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="DNI del representante"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio
              </label>
              <input
                type="text"
                value={data.representanteDomicilio}
                onChange={(e) => onChange({ ...data, representanteDomicilio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Dirección del representante"
              />
            </div>
          </div>
        )}
      </div>

      {/* DATOS DEL DOCTOR */}
      <div className="bg-white rounded-lg p-5 border border-green-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Datos del Odontólogo(a)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Odontólogo(a) <span className="text-red-500">*</span>
            </label>
            <select
              value={data.doctorId || ''}
              onChange={(e) => handleDoctorSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoadingDoctors}
            >
              <option value="">
                {isLoadingDoctors ? 'Cargando doctores...' : 'Seleccione un odontólogo o ingrese datos manualmente'}
              </option>
              {doctors.map((doctor) => (
                <option key={doctor.dentist_id} value={doctor.dentist_id}>
                  {doctor.first_name} {doctor.last_name} {doctor.professional_license ? `- COP: ${doctor.professional_license}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dr(a) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.doctorNombre}
              onChange={(e) => onChange({ ...data, doctorNombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nombre del odontólogo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              COP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.doctorCop}
              onChange={(e) => onChange({ ...data, doctorCop: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Número de colegiatura"
              required
            />
          </div>
        </div>
      </div>

      {/* FECHA Y OBSERVACIONES */}
      <div className="bg-white rounded-lg p-5 border border-purple-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Información Adicional</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Consentimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.fecha}
              onChange={(e) => {
                const newFecha = e.target.value;
                console.log('📅 [ConsentFormFields] FECHA SELECCIONADA:', {
                  valorInput: newFecha,
                  tipoValor: typeof newFecha,
                  fechaActualSistema: new Date().toISOString(),
                  timezoneOffset: new Date().getTimezoneOffset(),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });
                onChange({ ...data, fecha: newFecha });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              value={data.observaciones || ''}
              onChange={(e) => onChange({ ...data, observaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>
      </div>

      {/* FIRMAS DIGITALES */}
      <div className="bg-white rounded-lg p-5 border border-indigo-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-900">Firmas Digitales</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Firma del Paciente/Representante */}
          <div>
            <SignaturePad
              value={data.firmaPaciente}
              onChange={(signature) => onChange({ ...data, firmaPaciente: signature })}
              label={data.tieneRepresentante ? "Firma del Representante Legal" : "Firma del Paciente"}
              required
            />
          </div>

          {/* Firma del Doctor */}
          <div>
            <SignaturePad
              value={data.firmaDoctor}
              onChange={(signature) => onChange({ ...data, firmaDoctor: signature })}
              label="Firma del Cirujano-Dentista"
              required
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Las firmas digitales son legalmente vinculantes. Al firmar, usted declara que ha leído y comprendido el contenido del consentimiento informado.
          </p>
        </div>
      </div>
    </div>
  );
};
