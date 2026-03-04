import { CheckCircle, Clock, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { TreatmentPlan } from '@/types';

/**
 * Get status badge component based on treatment status
 */
export const getStatusBadge = (status: string) => {
  const config = {
    draft: {
      color: 'bg-gray-100 text-gray-700',
      icon: Clock,
      label: 'Borrador'
    },
    active: {
      color: 'bg-blue-100 text-blue-700',
      icon: Clock,
      label: 'En Progreso'
    },
    paused: {
      color: 'bg-yellow-100 text-yellow-700',
      icon: AlertCircle,
      label: 'Pausado'
    },
    completed: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'Completado'
    },
    cancelled: {
      color: 'bg-red-100 text-red-700',
      icon: XCircle,
      label: 'Cancelado'
    }
  };

  const statusConfig = config[status as keyof typeof config] || config.draft;
  const Icon = statusConfig.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {statusConfig.label}
    </span>
  );
};

/**
 * Get priority badge component based on treatment priority
 */
export const getPriorityBadge = (priority: string) => {
  const config = {
    low: {
      color: 'bg-gray-100 text-gray-600',
      label: 'Baja'
    },
    normal: {
      color: 'bg-blue-100 text-blue-600',
      label: 'Normal'
    },
    high: {
      color: 'bg-orange-100 text-orange-600',
      label: 'Alta'
    },
    urgent: {
      color: 'bg-red-100 text-red-600',
      label: 'Urgente'
    }
  };

  const priorityConfig = config[priority as keyof typeof config] || config.normal;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
      {priority === 'urgent' && <AlertTriangle className="w-3.5 h-3.5" />}
      {priorityConfig.label}
    </span>
  );
};

/**
 * Calculate treatment progress percentage based on completed procedures
 */
export const getTreatmentProgress = (treatment: TreatmentPlan): number => {
  if (!treatment.procedures || treatment.procedures.length === 0) return 0;

  const completedProcedures = treatment.procedures.filter(p => p.status === 'completed').length;
  return Math.round((completedProcedures / treatment.procedures.length) * 100);
};
