import { Users, Calendar } from 'lucide-react';

interface PatientStats {
  total: number;
  male: number;
  female: number;
  thisMonth: number;
}

interface PatientsStatsProps {
  stats: PatientStats;
}

export const PatientsStats = ({ stats }: PatientsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Hombres</p>
            <p className="text-2xl font-bold text-blue-700">{stats.male}</p>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">♂</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Mujeres</p>
            <p className="text-2xl font-bold text-pink-700">{stats.female}</p>
          </div>
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-pink-600 font-bold">♀</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Nuevos este mes</p>
            <p className="text-2xl font-bold text-green-700">{stats.thisMonth}</p>
          </div>
          <Calendar className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  );
};
