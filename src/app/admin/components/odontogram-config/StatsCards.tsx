import { Stethoscope, Calculator, Activity, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  allConditions: any[];
}

export const StatsCards = ({ allConditions }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Condiciones Activas</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {allConditions.filter(c => c.active).length}
        </div>
        <p className="text-sm text-gray-600">
          De {allConditions.length} condiciones totales
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calculator className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Condiciones con Precio</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {allConditions.filter(c => (c.price_base !== undefined && c.price_base > 0) || (c.price !== undefined && c.price > 0)).length}
        </div>
        <p className="text-sm text-gray-600">
          Condiciones con costo configurado
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Precio Promedio</h3>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          S/ {(() => {
            const conditionsWithPrice = allConditions.filter(c => (c.price_base && c.price_base > 0) || (c.price && c.price > 0));
            const totalPrice = conditionsWithPrice.reduce((sum, c) => sum + (c.price_base || c.price || 0), 0);
            return conditionsWithPrice.length > 0 ? (totalPrice / conditionsWithPrice.length).toFixed(0) : '0';
          })()}
        </div>
        <p className="text-sm text-gray-600">
          Promedio de tratamientos
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Estado del Sistema</h3>
        </div>
        {(() => {
          const total = allConditions.length;
          const withPrice = allConditions.filter(c => (c.price_base !== undefined && c.price_base !== null && c.price_base > 0) || (c.price !== undefined && c.price !== null && c.price > 0)).length;
          const isComplete = withPrice === total && total > 0;
          const percentage = total > 0 ? Math.round((withPrice / total) * 100) : 0;

          return (
            <>
              <div className={`text-xl font-bold mb-2 ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                {isComplete ? 'Completo' : 'Pendiente'}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {withPrice}/{total}
              </div>
              <p className="text-sm text-gray-600">
                {isComplete
                  ? 'Todas las condiciones tienen precio'
                  : `${total - withPrice} condiciones sin precio (${percentage}% configurado)`
                }
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
};
