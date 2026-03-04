// Configuración para gestión de médicos
// Siguiendo política anti-hardcodeo

export const DOCTOR_STATUS_CONFIG = {
  active: {
    label: 'Activo',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅'
  },
  inactive: {
    label: 'Inactivo',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '⏸️'
  },
  suspended: {
    label: 'Suspendido',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '🚫'
  }
};

export const MEDICAL_SPECIALTIES = [
  'Odontología General',
  'Endodoncia',
  'Periodoncia',
  'Ortodoncia',
  'Cirugía Oral',
  'Odontopediatría',
  'Prostodoncia',
  'Implantología',
  'Estética Dental',
  'Patología Oral',
  'Radiología Oral',
  'Anestesiología Dental'
];

export const DOCTOR_TABLE_COLUMNS = [
  { key: 'profile.firstName', label: 'Nombre', sortable: true },
  { key: 'profile.lastName', label: 'Apellido', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'profile.phone', label: 'Teléfono', sortable: false },
  { key: 'profile.specialties', label: 'Especialidades', sortable: false },
  { key: 'profile.licenseNumber', label: 'Licencia', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'createdAt', label: 'Fecha Registro', sortable: true },
  { key: 'actions', label: 'Acciones', sortable: false }
];

export const DOCTOR_FORM_FIELDS = [
  {
    name: 'firstName',
    label: 'Nombre',
    type: 'text',
    required: true,
    placeholder: 'Juan'
  },
  {
    name: 'lastName',
    label: 'Apellido',
    type: 'text',
    required: true,
    placeholder: 'Pérez'
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'doctor@clinica.com'
  },
  {
    name: 'phone',
    label: 'Teléfono',
    type: 'tel',
    required: true,
    placeholder: '987654321'
  },
  {
    name: 'licenseNumber',
    label: 'Número de Licencia',
    type: 'text',
    required: true,
    placeholder: 'DOC001'
  },
  {
    name: 'specialties',
    label: 'Especialidades',
    type: 'multiselect',
    required: true,
    options: MEDICAL_SPECIALTIES
  }
];

export const DOCTOR_FILTERS = {
  status: {
    label: 'Estado',
    options: [
      { value: 'all', label: 'Todos los estados' },
      { value: 'active', label: 'Activos' },
      { value: 'suspended', label: 'Suspendidos' }
    ]
  },
  specialty: {
    label: 'Especialidad',
    options: [
      { value: 'all', label: 'Todas las especialidades' },
      ...MEDICAL_SPECIALTIES.map(specialty => ({
        value: specialty,
        label: specialty
      }))
    ]
  }
};

export const DOCTOR_ACTIONS = {
  view: {
    label: 'Ver Detalles',
    icon: 'Eye',
    color: 'blue'
  },
  edit: {
    label: 'Editar',
    icon: 'Edit',
    color: 'green'
  },
  suspend: {
    label: 'Suspender',
    icon: 'Ban',
    color: 'orange'
  },
  activate: {
    label: 'Activar',
    icon: 'CheckCircle',
    color: 'green'
  },
  delete: {
    label: 'Eliminar',
    icon: 'Trash2',
    color: 'red'
  }
};