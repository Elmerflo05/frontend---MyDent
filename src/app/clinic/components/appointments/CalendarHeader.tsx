import { Calendar, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface CalendarHeaderProps {
  onTodayClick: () => void;
  onNewAppointment: () => void;
  isConnected?: boolean;
  userRole?: string;
}

export const CalendarHeader = ({ onTodayClick, onNewAppointment, isConnected = false, userRole }: CalendarHeaderProps) => {
  // El dentista no debe poder crear citas directamente
  const canCreateAppointment = userRole !== 'doctor';
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
            <p className="text-gray-600">Gestión completa de citas y horarios</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de conexión en tiempo real */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
            title={isConnected ? 'Conectado - Actualizaciones en tiempo real' : 'Desconectado'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>En vivo</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          <button
            onClick={onTodayClick}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Hoy
          </button>

          {canCreateAppointment && (
            <button
              onClick={onNewAppointment}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Cita
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
