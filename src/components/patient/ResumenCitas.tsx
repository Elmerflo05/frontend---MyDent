import { Calendar, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface ResumenProps {
  proximas: number;
  completadas: number;
  pendientes: number;
  total: number;
}

const ResumenCitas = ({ proximas, completadas, pendientes, total }: ResumenProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-teal-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">Próximas</p>
            <p className="text-2xl font-bold text-teal-900">{proximas}</p>
          </div>
          <Calendar className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Completadas</p>
            <p className="text-2xl font-bold text-blue-900">{completadas}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-900">{pendientes}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <Eye className="w-8 h-8 text-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default ResumenCitas;