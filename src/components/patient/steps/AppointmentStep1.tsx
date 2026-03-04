import React from 'react';
import { AlertCircle, MapPin, Stethoscope, User } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/ui';
import { formatDateToYMD } from '@/utils/dateUtils';
import type { AppointmentFormData } from '../hooks/useAppointmentForm';
import type { TimeSlotWithDoctors } from '../hooks/useAppointmentAvailability';
import type { Specialty } from '@/types';

interface AppointmentStep1Props {
  formData: AppointmentFormData;
  errors: Record<string, string>;
  sedesDisponibles: any[];
  cargandoSedes: boolean;
  availableSlots: TimeSlotWithDoctors[];
  loadingSlots: boolean;
  selectedSlotDoctors: Array<{ id: string; name: string; specialties: string[] }>;
  canCreateLongAppointments: boolean;
  availableSpecialties: Specialty[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<AppointmentFormData>>;
  setSelectedSlotDoctors: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; specialties: string[] }>>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const AppointmentStep1: React.FC<AppointmentStep1Props> = ({
  formData,
  errors,
  sedesDisponibles,
  cargandoSedes,
  availableSlots,
  loadingSlots,
  selectedSlotDoctors,
  canCreateLongAppointments,
  availableSpecialties,
  handleInputChange,
  handleDateChange,
  setFormData,
  setSelectedSlotDoctors,
  setErrors
}) => {
  return (
    <div className="space-y-4">
      {/* WhatsApp Contact Button */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800 mb-3 text-center">
          ¿Necesitas ayuda para agendar tu cita?
        </p>
        <a
          href={`${CONTACT_INFO.WHATSAPP.URL}?text=${encodeURIComponent('Hola, necesito ayuda para agendar una cita')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <span>📱</span>
          Contactar por WhatsApp
        </a>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha de la Cita *
        </label>
        <input
          type="date"
          name="date"
          value={formatDateToYMD(formData.date)}
          onChange={handleDateChange}
          min={formatDateToYMD(new Date())}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Sede *
        </label>
        <select
          name="sedeId"
          value={formData.sedeId}
          onChange={handleInputChange}
          disabled={cargandoSedes || sedesDisponibles.length === 0}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            errors.sedeId ? 'border-red-500' : 'border-gray-300'
          } ${(cargandoSedes || sedesDisponibles.length === 0) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {cargandoSedes ? 'Cargando sedes...' : sedesDisponibles.length === 0 ? 'No hay sedes disponibles' : 'Seleccionar sede...'}
          </option>
          {sedesDisponibles.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre} - {sede.direccion}
            </option>
          ))}
        </select>
        {errors.sedeId && (
          <p className="mt-1 text-sm text-red-600">{errors.sedeId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Especialidad *
        </label>
        <select
          name="specialtyId"
          value={formData.specialtyId}
          onChange={handleInputChange}
          disabled={!formData.sedeId}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            errors.specialtyId ? 'border-red-500' : 'border-gray-300'
          } ${!formData.sedeId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {!formData.sedeId
              ? 'Selecciona primero una sede...'
              : availableSpecialties.length === 0
                ? 'No hay especialidades disponibles'
                : 'Seleccionar especialidad...'
            }
          </option>
          {availableSpecialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </select>
        {errors.specialtyId && (
          <p className="mt-1 text-sm text-red-600">{errors.specialtyId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hora Preferida *
        </label>
        {loadingSlots ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-3 text-gray-600">Cargando horarios disponibles...</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              No hay horarios disponibles para esta fecha, sede y especialidad.
              <br />
              Por favor, intenta con otra fecha o contacta por WhatsApp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {availableSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, time: slot.time }));
                  setSelectedSlotDoctors(slot.doctors);

                  // Si solo hay un médico, asignarlo automáticamente
                  if (slot.doctors.length === 1) {
                    setFormData(prev => ({ ...prev, doctorId: slot.doctors[0].id }));
                  } else {
                    // Si hay múltiples, resetear la selección para que el usuario elija
                    setFormData(prev => ({ ...prev, doctorId: '' }));
                  }
                }}
                className={`p-2 text-sm border rounded-lg transition-colors ${
                  formData.time === slot.time
                    ? 'bg-teal-100 border-teal-500 text-teal-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
        {errors.time && (
          <p className="mt-1 text-sm text-red-600">{errors.time}</p>
        )}
      </div>

      {/* ✅ DURACIÓN DE LA CITA - OCULTO
          La duración se obtiene automáticamente de app_settings.appointment_duration_config
          - defaultDuration: 60 minutos (configurado en la base de datos)
          - No es necesario que el usuario la seleccione manualmente
      */}

      {/* Mostrar doctores disponibles solo cuando se hayan seleccionado los campos anteriores */}
      {formData.time && selectedSlotDoctors.length > 0 && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Doctores Disponibles para esta Fecha y Hora
          </h4>

          {selectedSlotDoctors.length === 1 ? (
            // Solo un médico disponible - mostrar como información (asignación automática)
            <div className="p-3 rounded-lg border-2 border-teal-500 bg-teal-50">
              <div className="font-medium text-teal-900">
                {selectedSlotDoctors[0].name}
              </div>
              <div className="text-sm text-teal-700">
                {selectedSlotDoctors[0].specialties.join(', ')}
              </div>
              <p className="text-xs text-teal-600 mt-2">
                ✓ Médico asignado automáticamente
              </p>
            </div>
          ) : (
            // Múltiples médicos disponibles - permitir selección
            <>
              <p className="text-sm text-gray-600 mb-3">
                Hay {selectedSlotDoctors.length} médicos disponibles. Por favor selecciona uno:
              </p>
              <div className="grid gap-2">
                {selectedSlotDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, doctorId: doctor.id }))}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      formData.doctorId === doctor.id
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">
                      {doctor.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doctor.specialties.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
              {errors.doctorId && (
                <p className="mt-2 text-sm text-red-600">{errors.doctorId}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
