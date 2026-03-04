import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Calendar, Phone, AlertCircle, Check } from 'lucide-react';
import { patientsApi } from '@/services/api/patientsApi';
import type { Patient } from '@/types';
import { UI_TEXTS } from '@/constants/ui';

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  className?: string;
}

const PatientSelector = ({ selectedPatient, onPatientSelect, className = '' }: PatientSelectorProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientsApi.getPatients({ limit: 1000 });

      // Mapear datos del backend al formato del frontend
      const mappedPatients: Patient[] = response.data.map((p: any) => ({
        id: p.patient_id?.toString() || '',
        dni: p.identification_number || '',
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        email: p.email || '',
        phone: p.mobile || p.phone || '',
        birthDate: p.birth_date ? new Date(p.birth_date) : new Date(),
        gender: p.gender_id === 1 ? 'M' : p.gender_id === 2 ? 'F' : 'O',
        address: p.address || '',
        allergies: p.allergies ? (typeof p.allergies === 'string' ? JSON.parse(p.allergies) : p.allergies) : [],
        registrationDate: p.date_time_registration ? new Date(p.date_time_registration) : new Date(),
        isActive: p.is_active !== false
      }));

      setPatients(mappedPatients);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.dni.includes(term) ||
      patient.email.toLowerCase().includes(term)
    );
  });

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onPatientSelect(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Selección de Paciente</h2>
              <p className="text-sm text-gray-600">Seleccione el paciente para crear su odontograma</p>
            </div>
          </div>
          {selectedPatient && (
            <button
              onClick={clearSelection}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cambiar Paciente
            </button>
          )}
        </div>

        {selectedPatient ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{selectedPatient.dni}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{calculateAge(selectedPatient.birthDate)} años</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedPatient.phone}</span>
                  </div>
                </div>
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-700">
                      Alergias: {selectedPatient.allergies.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={UI_TEXTS.PLACEHOLDERS.SEARCH + " pacientes por nombre, DNI o email..."}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
              >
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Cargando pacientes...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <motion.button
                        key={patient.id}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span>DNI: {patient.dni}</span>
                            <span>{calculateAge(patient.birthDate)} años</span>
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    {filteredPatients.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                        Mostrando 10 de {filteredPatients.length} resultados. Refine su búsqueda.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Overlay to close dropdown */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSelector;