import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Building,
  MessageCircle,
  Clock,
  Stethoscope,
  Bell,
  Shield,
  Loader2,
  Eye,
  Lock
} from 'lucide-react';

// Import hooks
import {
  useClinicSettings,
  useContactSettings,
  useAppointmentSettings,
  useSpecialtyManagement,
  useNotificationSettings,
  useSecuritySettings
} from './settings/hooks';

// Import components
import {
  ClinicSettingsSection,
  ContactSettingsSection,
  AppointmentSettingsSection,
  SpecialtiesSettingsSection,
  NotificationSettingsSection,
  SecuritySettingsSection
} from './settings/components';

// Import store para cargar settings
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clinic');

  // Solo super_admin puede editar, admin solo lectura
  const isReadOnly = user?.role !== 'super_admin';

  // Cargar settings desde la API al montar el componente
  const { loadSettings, isLoading: isLoadingSettings } = useAppSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize all hooks
  const clinicSettings = useClinicSettings();
  const contactSettings = useContactSettings();
  const appointmentSettings = useAppointmentSettings();
  const specialtyManagement = useSpecialtyManagement();
  const notificationSettings = useNotificationSettings();
  const securitySettings = useSecuritySettings();

  const tabs = [
    { id: 'clinic', label: 'Información de la Clínica', icon: Building },
    { id: 'contact', label: 'Contacto y Redes', icon: MessageCircle },
    { id: 'appointments', label: 'Configuración de Citas', icon: Clock },
    { id: 'specialties', label: 'Especialidades Médicas', icon: Stethoscope },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield }
  ];

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6" />
              Configuración del Sistema
            </h1>
            <p className="text-gray-600">Gestiona las configuraciones generales de la clínica</p>
          </div>
        </div>

        {/* Banner de solo lectura para administradores */}
        {isReadOnly && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Modo Solo Lectura</h3>
                <p className="text-sm text-amber-700">
                  Como administrador de sede, puedes visualizar la configuración del sistema pero no modificarla.
                  Contacta al Super Administrador si necesitas realizar cambios.
                </p>
              </div>
              <div className="flex-shrink-0 ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Eye className="w-3 h-3 mr-1" />
                  Solo lectura
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoadingSettings && (
          <div className="flex items-center justify-center py-4 mb-4 bg-blue-50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Cargando configuración...</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'clinic' && (
              <ClinicSettingsSection
                settings={clinicSettings.clinicSettings}
                setSettings={clinicSettings.setClinicSettings}
                isEditing={isReadOnly ? false : clinicSettings.isEditing}
                onEdit={clinicSettings.handleEdit}
                onSave={clinicSettings.handleSave}
                onCancel={clinicSettings.handleCancel}
                readOnly={isReadOnly}
              />
            )}

            {activeTab === 'contact' && (
              <ContactSettingsSection
                settings={contactSettings.contactSettings}
                setSettings={contactSettings.setContactSettings}
                isEditing={isReadOnly ? false : contactSettings.isEditing}
                onEdit={contactSettings.handleEdit}
                onSave={contactSettings.handleSave}
                onCancel={contactSettings.handleCancel}
                readOnly={isReadOnly}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentSettingsSection
                settings={appointmentSettings.appointmentSettings}
                setSettings={appointmentSettings.setAppointmentSettings}
                isEditing={isReadOnly ? false : appointmentSettings.isEditing}
                onEdit={appointmentSettings.handleEdit}
                onSave={appointmentSettings.handleSave}
                onCancel={appointmentSettings.handleCancel}
                readOnly={isReadOnly}
              />
            )}

            {activeTab === 'specialties' && (
              <SpecialtiesSettingsSection
                specialties={specialtyManagement.specialties}
                loading={specialtyManagement.loading}
                newSpecialty={specialtyManagement.newSpecialty}
                setNewSpecialty={specialtyManagement.setNewSpecialty}
                onAdd={specialtyManagement.handleAddSpecialty}
                onDelete={specialtyManagement.handleDeleteSpecialty}
                onToggle={specialtyManagement.handleToggleSpecialty}
                readOnly={isReadOnly}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettingsSection
                settings={notificationSettings.notificationSettings}
                setSettings={notificationSettings.setNotificationSettings}
                isEditing={isReadOnly ? false : notificationSettings.isEditing}
                onEdit={notificationSettings.handleEdit}
                onSave={notificationSettings.handleSave}
                onCancel={notificationSettings.handleCancel}
                readOnly={isReadOnly}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySettingsSection
                settings={securitySettings.securitySettings}
                setSettings={securitySettings.setSecuritySettings}
                isEditing={isReadOnly ? false : securitySettings.isEditing}
                onEdit={securitySettings.handleEdit}
                onSave={securitySettings.handleSave}
                onCancel={securitySettings.handleCancel}
                readOnly={isReadOnly}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
