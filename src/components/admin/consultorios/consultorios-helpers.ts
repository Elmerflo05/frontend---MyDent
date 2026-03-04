/**
 * Funciones de utilidad para la gestión de consultorios
 */

import { CheckCircle2, Activity, Wrench, XCircle } from 'lucide-react';
import type { Consultorio, Appointment } from '@/types';

/**
 * Calcular estadísticas generales de consultorios
 */
export const calcularEstadisticasGenerales = (consultorios: Consultorio[]) => {
  const total = consultorios.length;
  const disponibles = consultorios.filter(c => c.estado === 'disponible').length;
  const ocupados = consultorios.filter(c => c.estado === 'ocupado').length;
  const mantenimiento = consultorios.filter(c => c.estado === 'mantenimiento').length;
  const inactivos = consultorios.filter(c => c.estado === 'inactivo').length;

  return {
    total,
    disponibles,
    ocupados,
    mantenimiento,
    inactivos,
    porcentajeDisponible: total > 0 ? ((disponibles / total) * 100).toFixed(1) : '0'
  };
};

/**
 * Calcular estadísticas específicas de un consultorio
 */
export const calcularEstadisticasConsultorio = (appointments: Appointment[]) => {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  const citasMes = appointments.filter(a => {
    const fecha = new Date(a.date);
    return fecha >= inicioMes && fecha <= finMes;
  });

  const completadas = citasMes.filter(a => a.status === 'completed').length;
  const canceladas = citasMes.filter(a => a.status === 'cancelled').length;
  const pendientes = citasMes.filter(a => a.status === 'scheduled').length;

  // Calcular ocupación
  const diasLaborables = 22; // Promedio de días laborables en un mes
  const horasPorDia = 8;
  const horasDisponibles = diasLaborables * horasPorDia;
  const horasUtilizadas = completadas * 1; // Asumiendo 1 hora por cita
  const ocupacion = (horasUtilizadas / horasDisponibles) * 100;

  return {
    totalCitas: citasMes.length,
    completadas,
    canceladas,
    pendientes,
    ocupacion: ocupacion.toFixed(1),
    promediosDiarios: (citasMes.length / diasLaborables).toFixed(1)
  };
};

/**
 * Obtener icono según el estado del consultorio
 */
export const getEstadoIcon = (estado: Consultorio['estado']) => {
  switch (estado) {
    case 'disponible':
      return CheckCircle2;
    case 'ocupado':
      return Activity;
    case 'mantenimiento':
      return Wrench;
    case 'inactivo':
      return XCircle;
  }
};

/**
 * Obtener clases CSS para el badge de estado
 */
export const getEstadoBadgeClass = (estado: Consultorio['estado']) => {
  switch (estado) {
    case 'disponible':
      return 'bg-green-100 text-green-800';
    case 'ocupado':
      return 'bg-blue-100 text-blue-800';
    case 'mantenimiento':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactivo':
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Filtrar consultorios según criterios
 */
export const filtrarConsultorios = (
  consultorios: Consultorio[],
  selectedSede: string,
  searchTerm: string,
  filterEstado: string
) => {
  return consultorios.filter(c => {
    const matchesSede = selectedSede === 'all' || c.sedeId === selectedSede;
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.numero.includes(searchTerm);
    const matchesEstado = filterEstado === 'all' || c.estado === filterEstado;

    return matchesSede && matchesSearch && matchesEstado;
  });
};

/**
 * Obtener datos iniciales del formulario
 */
export const getInitialFormData = (sedeId?: string) => ({
  nombre: '',
  numero: '',
  sedeId: sedeId || '',
  piso: '',
  capacidad: 1,
  equipamiento: [] as string[],
  horaApertura: '08:00',
  horaCierre: '18:00',
  color: '#3B82F6',
  observaciones: ''
});

/**
 * Convertir consultorio a datos de formulario
 */
export const consultorioToFormData = (consultorio: Consultorio) => ({
  nombre: consultorio.nombre,
  numero: consultorio.numero,
  sedeId: consultorio.sedeId,
  piso: consultorio.piso || '',
  capacidad: consultorio.capacidad,
  equipamiento: consultorio.equipamiento || [],
  horaApertura: consultorio.horaApertura,
  horaCierre: consultorio.horaCierre,
  color: consultorio.color || '#3B82F6',
  observaciones: consultorio.observaciones || ''
});
