// PRECIOS Y ADELANTOS DE SERVICIOS CLÍNICOS
// Reglas de negocio para tipos de servicios:
// 1. Consulta General: Precio fijo 50 soles, adelanto configurable
// 2. Consulta Especialidad: Precio configurable, adelanto fijo 50 soles
// 3. Tratamiento: Precio y adelanto configurables

export const CONSULTATION_ADVANCE_PAYMENT = 50; // Adelanto fijo para consultas
export const GENERAL_CONSULTATION_PRICE = 50; // Precio fijo para consulta general

export const SERVICE_TYPES = {
  GENERAL_CONSULTATION: 'general_consultation',
  SPECIALTY_CONSULTATION: 'specialty_consultation',
  TREATMENT: 'treatment'
} as const;

export const SERVICE_TYPE_CONFIG = {
  [SERVICE_TYPES.GENERAL_CONSULTATION]: {
    label: 'Consulta de Odontología General',
    description: 'Precio fijo de S/. 50.00, adelanto configurable',
    priceEditable: false,
    advanceEditable: true,
    defaultPrice: GENERAL_CONSULTATION_PRICE,
    defaultAdvance: CONSULTATION_ADVANCE_PAYMENT,
    icon: 'stethoscope',
    color: 'blue'
  },
  [SERVICE_TYPES.SPECIALTY_CONSULTATION]: {
    label: 'Consulta de Especialidad',
    description: 'Precio configurable, adelanto fijo de S/. 50.00',
    priceEditable: true,
    advanceEditable: false,
    defaultPrice: 100,
    defaultAdvance: CONSULTATION_ADVANCE_PAYMENT,
    icon: 'user-check',
    color: 'purple'
  },
  [SERVICE_TYPES.TREATMENT]: {
    label: 'Tratamiento/Servicio',
    description: 'Precio y adelanto completamente configurables',
    priceEditable: true,
    advanceEditable: true,
    defaultPrice: 0,
    defaultAdvance: 0,
    icon: 'activity',
    color: 'green'
  }
};

export const CLINIC_SERVICE_CATEGORIES = [
  'Odontología General',
  'Endodoncia',
  'Ortodoncia',
  'Periodoncia',
  'Cirugía Oral',
  'Implantología',
  'Prostodoncia',
  'Odontopediatría',
  'Estética Dental',
  'Emergencias'
];

export const LABORATORY_SERVICE_CATEGORIES = [
  'Radiografías Panorámicas',
  'Radiografías Periapicales',
  'Tomografías 3D',
  'Radiografías Especiales',
  'Estudios Especializados'
];

export const SERVICE_STATUS_CONFIG = {
  active: {
    label: 'Activo',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: 'CheckCircle'
  },
  inactive: {
    label: 'Inactivo',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'XCircle'
  },
  maintenance: {
    label: 'Mantenimiento',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: 'AlertCircle'
  }
};

export const CLINIC_SERVICE_FORM_FIELDS = {
  serviceType: {
    label: 'Tipo de Servicio',
    required: true,
    description: 'Selecciona el tipo de servicio para aplicar las reglas de precios correspondientes'
  },
  name: {
    label: 'Nombre del Servicio',
    placeholder: 'Ej: Limpieza Dental',
    required: true
  },
  description: {
    label: 'Descripción',
    placeholder: 'Descripción detallada del servicio',
    required: true
  },
  category: {
    label: 'Categoría',
    required: true
  },
  price: {
    label: 'Precio Total (S/.)',
    placeholder: '0.00',
    required: true,
    description: 'Para Consulta General: Fijo S/. 50.00 | Para Especialidad y Tratamientos: Configurable'
  },
  advancePayment: {
    label: 'Adelanto para Reserva (S/.)',
    placeholder: '50.00',
    required: true,
    description: 'Para Consultas (General y Especialidad): Fijo S/. 50.00 | Para Tratamientos: Configurable'
  },
  duration: {
    label: 'Duración (minutos)',
    placeholder: '30',
    required: true
  },
  requiresSpecialist: {
    label: 'Requiere Especialista',
    required: false
  },
  isEmergency: {
    label: 'Servicio de Emergencia',
    required: false
  }
};

export const LABORATORY_SERVICE_FORM_FIELDS = {
  name: {
    label: 'Nombre del Estudio',
    placeholder: 'Ej: Radiografía Panorámica',
    required: true
  },
  description: {
    label: 'Descripción',
    placeholder: 'Descripción detallada del estudio radiológico',
    required: true
  },
  category: {
    label: 'Categoría',
    required: true
  },
  price: {
    label: 'Precio (S/.)',
    placeholder: '0.00',
    required: true
  },
  sampleType: {
    label: 'Tipo de Estudio',
    placeholder: 'Ej: Rayos X, Tomografía',
    required: true
  },
  processingTime: {
    label: 'Tiempo de Procesamiento (horas)',
    placeholder: '1',
    required: true
  },
  fastingRequired: {
    label: 'Requiere Preparación Especial',
    required: false
  },
  homeCollection: {
    label: 'Servicio Móvil Disponible',
    required: false
  }
};

export const SERVICE_TABLE_HEADERS = {
  clinic: [
    { key: 'name', label: 'Servicio', sortable: true },
    { key: 'category', label: 'Categoría', sortable: true },
    { key: 'price', label: 'Precio', sortable: true },
    { key: 'advancePayment', label: 'Adelanto', sortable: true },
    { key: 'duration', label: 'Duración', sortable: false },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'actions', label: 'Acciones', sortable: false }
  ],
  laboratory: [
    { key: 'name', label: 'Análisis', sortable: true },
    { key: 'category', label: 'Categoría', sortable: true },
    { key: 'price', label: 'Precio', sortable: true },
    { key: 'processingTime', label: 'Tiempo', sortable: false },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'actions', label: 'Acciones', sortable: false }
  ]
};