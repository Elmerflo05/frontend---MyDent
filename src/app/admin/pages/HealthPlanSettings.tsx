// ============================================================================
// HEALTH PLAN SETTINGS - Configuración del Sistema de Planes (SuperAdmin)
// ============================================================================

import { useState, useEffect } from 'react';
import { useHealthPlanStore } from '@/store/healthPlanStore';
import { useAuthStore } from '@/store/authStore';
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Bell,
  Mail,
  Shield
} from 'lucide-react';
import type { HealthPlanSettings } from '@/types/healthPlans';

export default function HealthPlanSettingsPage() {
  const { user } = useAuthStore();
  const { settings, loadSettings, updateSettings, loading, error } = useHealthPlanStore();

  const [formData, setFormData] = useState<HealthPlanSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!formData || !user) return;

    try {
      await updateSettings(
        {
          graceDays: formData.graceDays,
          reminderDaysBefore: formData.reminderDaysBefore,
          enableEmailNotifications: formData.enableEmailNotifications,
          enableInAppNotifications: formData.enableInAppNotifications,
          voucherRequired: formData.voucherRequired
        },
        user.id
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar configuración');
    }
  };

  const addReminderDay = () => {
    if (!formData) return;
    const newDay = prompt('¿Cuántos días antes del pago deseas enviar recordatorio? (1-30)');
    if (newDay) {
      const day = parseInt(newDay);
      if (day > 0 && day <= 30 && !formData.reminderDaysBefore.includes(day)) {
        setFormData({
          ...formData,
          reminderDaysBefore: [...formData.reminderDaysBefore, day].sort((a, b) => b - a)
        });
      }
    }
  };

  const removeReminderDay = (day: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      reminderDaysBefore: formData.reminderDaysBefore.filter(d => d !== day)
    });
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración de Planes de Salud</h1>
          </div>
          <p className="text-gray-600">
            Configura los parámetros del sistema de pagos y recordatorios
          </p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Configuración guardada exitosamente</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Grace Days Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Días de Gracia</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cantidad de días adicionales después de la fecha de corte antes de suspender el plan
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de gracia (0-30)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.graceDays}
                  onChange={(e) => setFormData({ ...formData, graceDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">Ejemplo:</p>
                <p className="text-xs text-blue-700">
                  Si el pago vence el día 5 y hay {formData.graceDays} días de gracia,
                  el plan se suspenderá el día {5 + formData.graceDays}
                </p>
              </div>
            </div>
          </div>

          {/* Reminder Days Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Recordatorios de Pago</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Días antes del vencimiento en los que se enviarán recordatorios automáticos
            </p>

            <div className="space-y-3">
              {formData.reminderDaysBefore.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {day} {day === 1 ? 'día' : 'días'} antes
                    </span>
                  </div>
                  <button
                    onClick={() => removeReminderDay(day)}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                onClick={addReminderDay}
                className="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm"
              >
                + Agregar Recordatorio
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configura los canales de notificación para alertas de pago
            </p>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.enableInAppNotifications}
                  onChange={(e) => setFormData({ ...formData, enableInAppNotifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Notificaciones in-app</p>
                  <p className="text-sm text-gray-600">Mostrar alertas dentro de la aplicación</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.enableEmailNotifications}
                  onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Notificaciones por email</p>
                  <p className="text-sm text-gray-600">Enviar correos electrónicos de recordatorio</p>
                </div>
              </label>
            </div>
          </div>

          {/* Voucher Settings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Requisitos de Pago</h2>
            </div>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.voucherRequired}
                onChange={(e) => setFormData({ ...formData, voucherRequired: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Requerir voucher de pago</p>
                <p className="text-sm text-gray-600">
                  Los pacientes deben subir comprobante de pago para todos los pagos mensuales
                </p>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
