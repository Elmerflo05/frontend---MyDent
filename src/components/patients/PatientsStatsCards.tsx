import { Users, Calendar } from 'lucide-react';

interface PatientsStatsCardsProps {
  stats: {
    total: number;
    male: number;
    female: number;
    thisMonth: number;
  };
}

export const PatientsStatsCards = ({ stats }: PatientsStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Total Pacientes</p>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Hombres</p>
            <p className="text-2xl font-bold text-green-900">{stats.male}</p>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold">♂</span>
          </div>
        </div>
      </div>

      <div className="bg-pink-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-pink-600">Mujeres</p>
            <p className="text-2xl font-bold text-pink-900">{stats.female}</p>
          </div>
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-pink-600 font-bold">♀</span>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">Nuevos este mes</p>
            <p className="text-2xl font-bold text-purple-900">{stats.thisMonth}</p>
          </div>
          <Calendar className="w-8 h-8 text-purple-600" />
        </div>
      </div>
    </div>
  );
};
