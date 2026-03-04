import { motion } from 'framer-motion';
import { Stethoscope, Activity, CheckCircle, DollarSign } from 'lucide-react';

interface Stats {
  total: number;
  active: number;
  completed: number;
  totalRevenue: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total de Planes',
      value: stats.total,
      icon: Stethoscope,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'En Progreso',
      value: stats.active,
      icon: Activity,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Completados',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Ingresos Totales',
      value: `S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.bgLight} p-3 rounded-lg`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
