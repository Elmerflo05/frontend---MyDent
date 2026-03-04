export interface ReportData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    monthlyData: { month: string; count: number }[];
  };
  patients: {
    total: number;
    new: number;
    continuing: number;
    ageGroups: { range: string; count: number }[];
  };
  revenue: {
    total: number;
    monthly: number;
    services: { name: string; amount: number }[];
  };
  services: {
    clinic: { name: string; count: number }[];
    laboratory: { name: string; count: number }[];
  };
}

/**
 * Get date range based on selected period
 * Incluye tanto citas pasadas como futuras dentro del rango seleccionado
 */
export const obtenerRangoFechas = (dateRange: string): { inicio: Date; fin: Date } => {
  const hoy = new Date();
  let inicio = new Date(hoy);
  let fin = new Date(hoy);

  switch (dateRange) {
    case 'week':
      // Última semana: 7 días atrás hasta fin de la semana actual
      inicio.setDate(hoy.getDate() - 7);
      fin.setDate(hoy.getDate() + 7); // Incluir próximos 7 días
      break;
    case 'month':
      // Último mes: desde hace 1 mes hasta fin del mes actual
      inicio.setMonth(hoy.getMonth() - 1);
      // Fin del mes actual
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      break;
    case 'quarter':
      // Último trimestre: desde hace 3 meses hasta fin del mes actual
      inicio.setMonth(hoy.getMonth() - 3);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      break;
    case 'year':
      // Último año: desde hace 1 año hasta fin del mes actual
      inicio.setFullYear(hoy.getFullYear() - 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      break;
    default:
      inicio.setMonth(hoy.getMonth() - 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  }

  inicio.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
};
