// UI Constants - Textos configurables
export const UI_TEXTS = {
  // General
  APP_NAME: 'Centro Odontológico Integral',
  LAB_NAME: 'DentalLab Pro',

  // Contact Information
  CONTACT: {
    WHATSAPP_NUMBER: '51999999999', // Número de WhatsApp del laboratorio (incluir código de país sin +)
    WHATSAPP_MESSAGE: 'Hola, tengo dudas sobre mi solicitud de estudios radiológicos.',
    SUPPORT_EMAIL: 'laboratorio@clinica.com',
    SUPPORT_PHONE: '+51 999 999 999'
  },
  
  // Navigation
  NAV: {
    DASHBOARD: 'Dashboard',
    PATIENTS: 'Pacientes',
    APPOINTMENTS: 'Citas',
    MEDICAL_RECORDS: 'Historiales',
    TREATMENTS: 'Tratamientos',
    LABORATORY: 'Laboratorio',
    PAYMENTS: 'Pagos',
    REPORTS: 'Reportes',
    SETTINGS: 'Configuración',
    PROFILE: 'Perfil',
    LOGOUT: 'Cerrar Sesión'
  },
  
  // Buttons
  BUTTONS: {
    SAVE: 'Guardar',
    CANCEL: 'Cancelar',
    EDIT: 'Editar',
    DELETE: 'Eliminar',
    CREATE: 'Crear',
    VIEW: 'Ver',
    DOWNLOAD: 'Descargar',
    UPLOAD: 'Subir',
    SEARCH: 'Buscar',
    FILTER: 'Filtrar',
    EXPORT: 'Exportar',
    IMPORT: 'Importar',
    PRINT: 'Imprimir',
    BACK: 'Volver',
    NEXT: 'Siguiente',
    PREVIOUS: 'Anterior',
    CONFIRM: 'Confirmar',
    RETRY: 'Reintentar'
  },
  
  // Forms
  FORMS: {
    REQUIRED: 'Campo requerido',
    INVALID_EMAIL: 'Email inválido',
    INVALID_PHONE: 'Teléfono inválido',
    INVALID_DNI: 'DNI inválido',
    PASSWORD_MIN: 'Mínimo 8 caracteres',
    PASSWORDS_MATCH: 'Las contraseñas no coinciden',
    DATE_FUTURE: 'La fecha debe ser futura',
    DATE_PAST: 'La fecha debe ser pasada'
  },
  
  // Status
  STATUS: {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    SUSPENDED: 'Suspendido',
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    IN_PROGRESS: 'En Progreso',
    SCHEDULED: 'Programado',
    CONFIRMED: 'Confirmado',
    NO_SHOW: 'No Asistió'
  },
  
  // Messages
  MESSAGES: {
    SUCCESS: {
      SAVE: 'Guardado exitosamente',
      DELETE: 'Eliminado exitosamente',
      UPDATE: 'Actualizado exitosamente',
      CREATE: 'Creado exitosamente',
      LOGIN: 'Inicio de sesión exitoso',
      LOGOUT: 'Sesión cerrada exitosamente'
    },
    ERROR: {
      GENERIC: 'Ha ocurrido un error',
      NETWORK: 'Error de conexión',
      AUTH: 'Error de autenticación',
      PERMISSION: 'No tienes permisos para esta acción',
      NOT_FOUND: 'Registro no encontrado',
      VALIDATION: 'Error de validación'
    },
    CONFIRM: {
      DELETE: '¿Estás seguro de que deseas eliminar este registro?',
      CANCEL: '¿Estás seguro de que deseas cancelar?',
      SAVE: '¿Deseas guardar los cambios?'
    }
  },
  
  // Placeholders
  PLACEHOLDERS: {
    SEARCH: 'Buscar...',
    EMAIL: 'correo@ejemplo.com',
    PHONE: '999 888 777',
    DNI: '12345678',
    NAME: 'Nombre completo',
    ADDRESS: 'Dirección completa',
    NOTES: 'Notas adicionales...',
    PASSWORD: 'Contraseña',
    CONFIRM_PASSWORD: 'Confirmar contraseña'
  },
  
  // Labels
  LABELS: {
    EMAIL: 'Email',
    PASSWORD: 'Contraseña',
    CONFIRM_PASSWORD: 'Confirmar Contraseña',
    FIRST_NAME: 'Nombres',
    LAST_NAME: 'Apellidos',
    PHONE: 'Teléfono',
    DNI: 'DNI',
    BIRTH_DATE: 'Fecha de Nacimiento',
    GENDER: 'Género',
    ADDRESS: 'Dirección',
    DATE: 'Fecha',
    TIME: 'Hora',
    DURATION: 'Duración',
    SERVICES: 'Servicios',
    NOTES: 'Notas',
    STATUS: 'Estado',
    PATIENT: 'Paciente',
    DOCTOR: 'Doctor',
    AMOUNT: 'Monto',
    PAYMENT_METHOD: 'Método de Pago',
    CREATED_AT: 'Creado el',
    UPDATED_AT: 'Actualizado el'
  },
  
  // Tooltips
  TOOLTIPS: {
    EDIT: 'Editar registro',
    DELETE: 'Eliminar registro',
    VIEW: 'Ver detalles',
    DOWNLOAD: 'Descargar archivo',
    PRINT: 'Imprimir documento',
    REFRESH: 'Actualizar datos',
    FILTER: 'Aplicar filtros',
    EXPORT: 'Exportar datos',
    SETTINGS: 'Configuraciones'
  }
};

// Medical Constants
export const MEDICAL_DATA = {
  BLOOD_TYPES: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  GENDERS: [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'O', label: 'Otro' }
  ],
  COMMON_ALLERGIES: [
    'Penicilina',
    'Sulfonamidas',
    'Anestesia local',
    'Látex',
    'Metales',
    'Ninguna'
  ],
  DENTAL_CONDITIONS: [
    'Bruxismo',
    'Gingivitis',
    'Periodontitis',
    'Sensibilidad dental',
    'Maloclusión',
    'TMJ',
    'Ninguna'
  ],
  SPECIALTIES: [
    'Odontología General',
    'Ortodoncía',
    'Endodoncia',
    'Periodoncia',
    'Cirugía Oral',
    'Odontopediatría',
    'Implantología',
    'Estética Dental'
  ]
};

// System Constants
export const SYSTEM_CONFIG = {
  APPOINTMENT_DURATION: {
    MIN: 15,
    MAX: 240,
    DEFAULT: 30
  },
  BUSINESS_HOURS: {
    START: '08:00',
    END: '20:00',
    LUNCH_START: '13:00',
    LUNCH_END: '14:00'
  },
  WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZES: [10, 20, 50, 100]
  }
};

// Payment Methods (Simple list)
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: 'banknote' },
  { value: 'card', label: 'Tarjeta', icon: 'credit-card' },
  { value: 'yape', label: 'Yape', icon: 'smartphone' },
  { value: 'plin', label: 'Plin', icon: 'smartphone' },
  { value: 'transfer', label: 'Transferencia', icon: 'bank' }
];

// Payment Methods (Detailed - for patient appointments)
export const PAYMENT_METHODS_DETAILED = [
  {
    id: 'yape',
    name: 'Yape',
    icon: '📱',
    qr: '/images/qr-yape.png',
    number: '987-654-321',
    instructions: 'Escanea el código QR o transfiere al número mostrado'
  },
  {
    id: 'plin',
    name: 'Plin',
    icon: '💳',
    qr: '/images/qr-plin.png',
    number: '987-654-321',
    instructions: 'Escanea el código QR o transfiere al número mostrado'
  },
  {
    id: 'bcp',
    name: 'BCP',
    icon: '🏦',
    accountNumber: '123-456789-0-12',
    accountHolder: 'Clínica Dental S.A.C.',
    instructions: 'Transferencia bancaria a la cuenta mostrada'
  },
  {
    id: 'interbank',
    name: 'Interbank',
    icon: '🏛️',
    accountNumber: '987-654321-1-00',
    accountHolder: 'Clínica Dental S.A.C.',
    instructions: 'Transferencia interbancaria a la cuenta mostrada'
  }
];

// Colors and Themes
export const COLORS = {
  CLINIC: {
    PRIMARY: '#0891b2',
    SECONDARY: '#06b6d4',
    ACCENT: '#22d3ee',
    GRADIENT: 'from-cyan-500 to-blue-600'
  },
  LABORATORY: {
    PRIMARY: '#7c3aed',
    SECONDARY: '#8b5cf6',
    ACCENT: '#a78bfa',
    GRADIENT: 'from-violet-500 to-purple-600'
  },
  STATUS: {
    SUCCESS: '#22c55e',
    WARNING: '#eab308',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
    GRAY: '#6b7280'
  }
};

// Chart Colors
export const CHART_COLORS = [
  '#0891b2', '#06b6d4', '#22d3ee', '#7c3aed', 
  '#8b5cf6', '#a78bfa', '#22c55e', '#eab308', 
  '#ef4444', '#3b82f6'
];

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm'
};

// Contact Information
export const CONTACT_INFO = {
  WHATSAPP: {
    NUMBER: '51987654321', // Número con código de país (sin +)
    DISPLAY: '+51 987 654 321', // Formato para mostrar
    URL: 'https://wa.me/51987654321' // URL base para WhatsApp
  },
  PHONE: {
    MAIN: '+51 01 234 5678',
    EMERGENCY: '+51 987 654 321'
  },
  EMAIL: {
    INFO: 'info@clinicadental.com',
    APPOINTMENTS: 'citas@clinicadental.com',
    SUPPORT: 'soporte@clinicadental.com'
  },
  ADDRESS: {
    MAIN: 'Av. Larco 345, Miraflores, Lima'
  },
  SOCIAL: {
    FACEBOOK: 'https://facebook.com/clinicadental',
    INSTAGRAM: 'https://instagram.com/clinicadental',
    TWITTER: 'https://twitter.com/clinicadental'
  }
};

// Inventory Categories
export const INVENTORY_CATEGORIES = [
  { value: 'material_limpieza', label: 'Material de Limpieza' },
  { value: 'material_odontologico', label: 'Material Odontológico' },
  { value: 'material_oficina', label: 'Material de Oficina' },
  { value: 'insumos_esterilizacion', label: 'Insumos de Esterilización' },
  { value: 'material_descartable', label: 'Material Descartable' },
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'otro', label: 'Otro' }
] as const;