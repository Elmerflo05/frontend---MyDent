export const sedeModel = {
  id: '',
  nombre: '',
  codigo: '', // Código único de sede (ej: SEDE-001)
  direccion: '',
  telefono: '',
  email: '',
  ciudad: '',
  departamento: '',
  estado: 'activa', // 'activa' | 'inactiva' | 'suspendida'
  administradorId: null, // ID del administrador asignado a esta sede
  administrador: null, // Información del administrador asignado (se populará dinámicamente)
  configuracion: {
    horarioApertura: '08:00',
    horarioCierre: '18:00',
    diasLaborales: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
    duracionCitaDefecto: 30,
    tiempoBuffer: 15,
    diasMaximosReserva: 90,
    moneda: 'PEN',
    timezone: 'America/Lima'
  },
  estadisticas: {
    totalPacientes: 0,
    totalDoctores: 0,
    totalPersonal: 0,
    citasDelDia: 0,
    ingresosMes: 0
  },
  serviciosDisponibles: [], // IDs de servicios disponibles en esta sede
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const crearSede = (datos = {}) => ({
  ...sedeModel,
  ...datos,
  id: datos.id || `sede_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: datos.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const validarSede = (sede) => {
  const errores = [];

  if (!sede.nombre?.trim()) {
    errores.push('El nombre de la sede es requerido');
  }

  if (!sede.codigo?.trim()) {
    errores.push('El código de la sede es requerido');
  }

  if (!sede.direccion?.trim()) {
    errores.push('La dirección es requerida');
  }

  if (!sede.telefono?.trim()) {
    errores.push('El teléfono es requerido');
  }

  if (sede.email && !isValidEmail(sede.email)) {
    errores.push('El email no es válido');
  }

  return {
    esValido: errores.length === 0,
    errores
  };
};

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};