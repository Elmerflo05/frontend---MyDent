// Promociones - Constantes configurables
// Siguiendo política anti-hardcodeo

export const PROMOTION_DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
} as const;

export const PROMOTION_DISCOUNT_TYPE_CONFIG = {
  [PROMOTION_DISCOUNT_TYPES.PERCENTAGE]: {
    label: 'Porcentaje',
    symbol: '%',
    step: '1',
    icon: 'percent'
  },
  [PROMOTION_DISCOUNT_TYPES.FIXED]: {
    label: 'Monto Fijo',
    symbol: 'S/',
    step: '0.01',
    icon: 'dollar-sign'
  }
};

export const PROMOTION_SERVICE_TYPES = {
  CLINIC: 'clinic',
  ALL: 'all'
} as const;

export const PROMOTION_SERVICE_TYPE_CONFIG = {
  [PROMOTION_SERVICE_TYPES.CLINIC]: {
    label: 'Solo Clínica Odontológica',
    description: 'Promociones aplicables únicamente a consultas y tratamientos de la clínica. NO aplica para Centro de Imágenes.',
    icon: 'activity',
    color: 'blue'
  },
  [PROMOTION_SERVICE_TYPES.ALL]: {
    label: 'Todos los servicios (Deprecated)',
    description: 'No usar - mantener por compatibilidad',
    icon: 'globe',
    color: 'gray'
  }
};

export const PROMOTION_STATUS_CONFIG = {
  active: {
    label: 'Activa',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'check-circle'
  },
  inactive: {
    label: 'Inactiva',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: 'x-circle'
  },
  expired: {
    label: 'Expirada',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: 'clock'
  },
  scheduled: {
    label: 'Programada',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: 'calendar'
  },
  exhausted: {
    label: 'Agotada',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: 'alert-circle'
  }
};

export const PROMOTION_FORM_FIELDS = {
  title: {
    label: 'Título',
    placeholder: 'Ej: Descuento de Verano',
    required: true,
    maxLength: 100
  },
  description: {
    label: 'Descripción',
    placeholder: 'Describe los beneficios de esta promoción...',
    required: true,
    maxLength: 500
  },
  code: {
    label: 'Código de Promoción',
    placeholder: 'Ej: VERANO2024',
    required: false,
    maxLength: 20
  },
  discountType: {
    label: 'Tipo de Descuento',
    required: true
  },
  discountValue: {
    label: 'Valor del Descuento',
    required: true,
    min: 0
  },
  startDate: {
    label: 'Fecha de Inicio',
    required: true
  },
  endDate: {
    label: 'Fecha de Fin',
    required: true
  },
  usageLimit: {
    label: 'Límite de Usos',
    placeholder: 'Sin límite',
    required: false,
    min: 1
  },
  minimumAmount: {
    label: 'Monto Mínimo',
    placeholder: 'Sin mínimo',
    required: false,
    min: 0,
    step: '0.01'
  },
  services: {
    label: 'Servicios Aplicables',
    placeholder: 'Deja sin seleccionar para aplicar a todos los servicios',
    required: false
  },
  conditions: {
    label: 'Términos y Condiciones',
    placeholder: 'Agregar condición...',
    required: false
  },
  isActive: {
    label: 'Promoción activa',
    required: false
  }
};

export const PROMOTION_VALIDATION_MESSAGES = {
  TITLE_REQUIRED: 'El título es requerido',
  DESCRIPTION_REQUIRED: 'La descripción es requerida',
  DISCOUNT_VALUE_REQUIRED: 'El valor del descuento es requerido',
  DISCOUNT_VALUE_POSITIVE: 'El valor del descuento debe ser mayor a 0',
  START_DATE_REQUIRED: 'La fecha de inicio es requerida',
  END_DATE_REQUIRED: 'La fecha de fin es requerida',
  END_DATE_AFTER_START: 'La fecha de fin debe ser posterior a la fecha de inicio',
  CODE_EXISTS: 'Ya existe una promoción con este código',
  USAGE_LIMIT_POSITIVE: 'El límite de usos debe ser mayor a 0',
  MINIMUM_AMOUNT_POSITIVE: 'El monto mínimo debe ser mayor o igual a 0',
  NOT_APPLICABLE_FOR_IMAGING: 'Las promociones NO se aplican a servicios del Centro de Imágenes'
};

export const PROMOTION_CURRENCY_CONFIG = {
  CURRENCY_CODE: 'PEN',
  CURRENCY_SYMBOL: 'S/',
  DECIMAL_PLACES: 2,
  THOUSANDS_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.'
};