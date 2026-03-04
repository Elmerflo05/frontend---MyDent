import { APPOINTMENT_STATUS_CONFIG } from '@/constants/appointments';

interface AppointmentStatsCardsProps {
  stats: Record<string, number>;
  selectedStatus: string;
  onStatusClick: (status: string) => void;
}

export const AppointmentStatsCards = ({ stats, selectedStatus, onStatusClick }: AppointmentStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([status, config]) => {
        // No mostrar el card de citas rechazadas (se filtran del calendario, siempre mostraría 0)
        if (status === 'rejected') return null;

        // Defensive check to ensure config exists
        if (!config) {
          return null;
        }

        return (
          <div
            key={status}
            className={`${config.bgColor || 'bg-gray-100'} ${config.borderColor || 'border-gray-200'} border rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow ${
              selectedStatus === status ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onStatusClick(selectedStatus === status ? 'all' : status)}
          >
            <div className="text-2xl mb-1">{config.icon || '📄'}</div>
            <div className={`text-2xl font-bold ${config.textColor || 'text-gray-700'}`}>
              {stats[status] || 0}
            </div>
            <div className={`text-sm ${config.textColor || 'text-gray-700'}`}>
              {config.label || status}
            </div>
          </div>
        );
      })}
    </div>
  );
};
