export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consultorio {
  id: string;
  nombre: string;
  numero: string;
  sedeId: string;
  piso?: string;
  capacidad: number;
  equipamiento?: string[];
  estado: 'disponible' | 'ocupado' | 'mantenimiento' | 'inactivo';
  especialidades?: string[]; // IDs de especialidades que se atienden en este consultorio
  horaApertura: string; // Formato "HH:MM"
  horaCierre: string; // Formato "HH:MM"
  color?: string; // Para identificación visual en el calendario
  observaciones?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ NUEVO: Interface para especialidades
export interface Specialty {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'doctor' | 'receptionist' | 'patient' | 'external_client' | 'imaging_technician' | 'prosthesis_technician';
  status: 'active' | 'inactive' | 'suspended';
  sedeId?: string; // ID de la sede a la que pertenece (null para super_admin, pacientes y clientes externos)
  sedesAcceso?: string[]; // IDs de sedes a las que puede acceder (para usuarios multi-sede)
  // IDs numéricos para operaciones con el backend
  dentist_id?: number; // ID del dentista (solo para doctores)
  patient_id?: number; // ID del paciente (solo para rol paciente)
  branch_id?: number; // ID numérico de la sede
  profile: UserProfile;
  specialties?: Specialty[]; // ✅ MIGRADO: Ahora array de objetos con id y name (para doctores)
  firstName?: string; // ✅ NUEVO: Para acceso directo (compatibilidad)
  lastName?: string; // ✅ NUEVO: Para acceso directo (compatibilidad)
  phone?: string; // ✅ NUEVO: Para acceso directo (compatibilidad)
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionConfig {
  percentage: number; // Porcentaje de comisión por defecto (0-100)
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dni: string; // Número de DNI (usado como contraseña por defecto)
  phone: string;
  avatar?: string;
  patientId?: number; // ID del paciente (para rol paciente)
  specialties?: string[]; // ✅ DEPRECATED: Mantener por compatibilidad, usar User.specialties en su lugar
  licenseNumber?: string;
  department?: string;
  commissionPercentage?: number; // Porcentaje de comisión para médicos (0-100) - DEPRECATED, usar commissionConfig
  commissionConfig?: CommissionConfig; // Configuración detallada de comisión
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  sedeId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // Formato "HH:MM" (ej: "09:00")
  endTime: string; // Formato "HH:MM" (ej: "17:00")
  isActive: boolean;
  effectiveFrom?: Date; // Fecha desde la cual aplica este horario
  effectiveUntil?: Date; // Fecha hasta la cual aplica (null = indefinido)
  exceptions?: ScheduleException[]; // Excepciones para fechas específicas
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleException {
  date: Date; // Fecha específica de la excepción
  reason: string; // Motivo (vacaciones, feriado, etc.)
  isAvailable: boolean; // false = no disponible, true = disponible excepcionalmente
  startTime?: string; // Si está disponible, hora de inicio
  endTime?: string; // Si está disponible, hora de fin
}

export interface Sede {
  id: string;
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  email: string;
  ciudad: string;
  departamento: string;
  estado: 'activa' | 'inactiva' | 'suspendida';
  configuracion: SedeConfiguracion;
  estadisticas?: SedeEstadisticas;
  serviciosDisponibles?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SedeConfiguracion {
  horarioApertura: string;
  horarioCierre: string;
  diasLaborales: string[];
  duracionCitaDefecto?: number; // Duración por defecto de las citas en minutos
  tiempoBuffer?: number; // Tiempo de buffer entre citas en minutos
  diasMaximosReserva?: number; // Días máximos para reservar con anticipación
  moneda: string;
  timezone: string;
}

export interface SedeEstadisticas {
  totalPacientes: number;
  totalDoctores: number;
  totalPersonal: number;
  citasDelDia: number;
  ingresosMes: number;
}

export interface Company {
  id: string;
  nombre: string; // Nombre de la empresa
  ruc: string; // RUC de la empresa
  contactoPrincipal: {
    nombre: string;
    cargo: string;
    telefono: string;
    email: string;
  };
  direccion: string;
  telefono: string;
  planId?: string; // ID del plan de salud asignado (healthPlan)
  contratoId?: string; // ID del contrato de empresa (companyContract)
  vigenciaInicio: Date; // Fecha de inicio del convenio
  vigenciaFin: Date; // Fecha de fin del convenio
  estado: 'activa' | 'suspendida' | 'vencida' | 'inactiva' | 'eliminada';
  employeeCount?: number; // Cantidad de pacientes afiliados
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // ID del admin que creó la empresa
}

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: 'M' | 'F' | 'O';
  address: string;
  medicalHistory: MedicalHistory;
  emergencyContact?: EmergencyContact;
  // Nuevos campos para el flujo de registro en dos etapas
  medicalRecordNumber?: string; // Número de historia clínica
  isBasicRegistration?: boolean; // true = solo registro básico, false = información completa
  completedAt?: Date; // Fecha cuando se completó la información
  medicalInfoCompleted?: boolean; // true = cuando el médico haya completado Antecedentes Médicos e Historia Estomatológica
  esClienteNuevo: boolean; // true = cliente nuevo (debe pagar consulta), false = cliente continuador
  companyId?: string; // ID de la empresa a la que pertenece (si es empleado corporativo)
  companyName?: string; // Nombre de la empresa (viene del JOIN)
  // Plan de salud activo
  healthPlan?: {
    id: number;
    name: string;
    code: string;
    type: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalHistory {
  allergies: string[];
  conditions: string[];
  medications: string[];
  bloodType: string;
  notes?: string;
  // Campos extendidos para el flujo completo de recepción
  consultationReason?: string; // Motivo de consulta
  medicalBackground?: {
    pathological: string[]; // Antecedentes patológicos
    previousDiseases: string[]; // Enfermedades anteriores (TBC, diabetes, etc.)
    previousOperations: string[]; // Historial de operaciones
    allergies: string[]; // Alergias (duplicado por compatibilidad)
  };
  stomatologicalHistory?: string; // Historia estomatológica pasada
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending_approval' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'rejected';
  services: string[];
  notes?: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalAmount: number;
  // Imaging study fields
  type?: 'consultation' | 'imaging_study'; // Tipo de cita
  imagingStudy?: ImagingStudy; // Información del estudio de imágenes
  // Promotion applied
  rescheduleCount?: number;
  promotionApplied?: {
    promotionId: string;
    promotionName: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ImagingStudy {
  studyType: 'rayos_x' | 'panoramica' | 'tomografia' | 'cefalometria' | 'periapical' | 'oclusal'; // Tipo de estudio
  assignedTechnicianId?: string; // ID del técnico asignado
  studyStatus: 'pending' | 'completed' | 'delivered'; // Estados automáticos: pending=recién ingresada, completed=resultados subidos, delivered=cliente visualizó
  requestedBy: string; // ID del doctor que solicitó el estudio
  findings?: string; // Hallazgos del estudio
  images?: string[]; // URLs de las imágenes tomadas
  completedAt?: Date; // Fecha de completación del estudio
  deliveredAt?: Date; // Fecha de entrega de resultados
  technicianNotes?: string; // Notas del técnico
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  date: Date;
  diagnosis: string;
  treatment: string;
  prescription?: Prescription[];
  odontogram?: OdontogramState;
  documents: Document[];
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  medication: string;
  presentation?: string; // Ej: Tabletas 500mg
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  createdAt: Date | string; // Fecha de creación de la receta
  prescribedBy?: string; // ID del médico que prescribió
  prescribedByName?: string; // Nombre del médico
  patientId?: string; // ID del paciente
  patientName?: string; // Nombre del paciente
}

export interface OdontogramState {
  teeth: Record<string, ToothState>;
  notes?: string;
  lastUpdated: Date;
  isIncomplete?: boolean; // Flag para marcar odontograma como incompleto
  completedInTreatment?: boolean; // Flag para marcar si se completó en tratamiento
}

export interface ToothState {
  id: string;
  number: number;
  conditions: string[];
  treatments: string[];
  status: 'healthy' | 'caries' | 'filled' | 'crown' | 'missing' | 'implant';
  color: string;
  notes?: string;
  initialState?: 'good' | 'bad'; // Estado inicial antes del tratamiento
  finalState?: 'good' | 'bad'; // Estado final después del tratamiento
  treatmentCompleted?: boolean; // Si el tratamiento se completó
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  description: string;
  procedures: TreatmentProcedure[];
  totalCost: number;
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentProcedure {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  status: 'pending' | 'in_progress' | 'completed';
  toothNumbers?: number[];
}

export interface LabRequest {
  id: string;
  requesterId: string;
  patientId?: string;
  clientId?: string;
  type: 'internal' | 'external';
  services: LabService[];
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sampleInfo: SampleInfo;
  dueDate: Date;
  completedDate?: Date;
  results?: LabResult[];
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  requirements: string[];
}

export interface SampleInfo {
  type: string;
  quantity: number;
  collectionDate: Date;
  conditions: string;
  storageRequirements: string;
}

export interface LabResult {
  id: string;
  serviceId: string;
  result: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  notes?: string;
  attachments?: string[];
  verifiedBy: string;
  verifiedAt: Date;
}

// Solicitud de Prótesis Dental al Laboratorio
export interface ProsthesisRequest {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicalRecordId?: string;

  // Descripción del trabajo protésico
  description: string; // Qué se va a enviar al laboratorio
  prosthesisName: string; // Nombre del trabajo (ej: "Corona de porcelana")
  color?: string; // Color de la prótesis
  specifications?: string; // Especificaciones técnicas adicionales

  // Dientes afectados
  toothNumbers?: string[]; // Números de dientes relacionados

  // Fechas
  deliveryDate: Date; // Fecha de entrega al laboratorio
  tentativeDate: Date; // Fecha tentativa de recepción
  receptionDate?: Date; // Fecha real de recepción (se llena cuando se recibe)

  // Estado
  status: 'pending' | 'sent' | 'in_progress' | 'received' | 'cancelled';

  // Metadata
  createdBy: string; // ID del doctor o recepcionista que lo creó
  sedeId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Radiography Request Types (PanoCef)
export interface RadiographyRequest {
  id: string;
  requesterId: string; // external_client ID
  type: 'radiography';
  radiographyType?: string; // Tipo de estudio (Panorámica, Tomografía, etc.)
  status: 'pending' | 'price_pending' | 'price_approved' | 'completed' | 'delivered' | 'cancelled' | 'no_show'; // Estados automáticos: pending=recién ingresada, completed=resultados subidos, delivered=cliente visualizó

  // Vinculación con consultas médicas (para Atención Integral)
  patientId?: string; // ID del paciente (para consultas desde la clínica)
  medicalRecordId?: string; // ID del historial médico (para consultas desde la clínica)
  doctorId?: string; // ID del doctor que creó la solicitud

  // Datos del Paciente
  patientData: {
    nombre: string;
    edad?: string;
    dni: string;
    telefono?: string;
    motivoConsulta?: string;
  };

  // Datos del Odontólogo
  doctorData: {
    doctor: string;
    cop?: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  };

  // Radiografías solicitadas
  radiography: {
    intraorales?: IntraoralRadiography;
    extraorales?: ExtraoralRadiography;
    asesoriaOrtodoncia?: OrthodoticPackage;
    analisisCefalometricos?: string[]; // Array de análisis seleccionados
  };

  // Gestión de precio detallada
  pricing?: {
    // Desglose detallado de cada check seleccionado con su precio
    breakdown: Array<{
      category: 'intraoral' | 'extraoral' | 'ortodoncias' | 'analisis'; // Categoría del servicio
      itemName: string; // Nombre del check (ej: "Panorámica", "Cefalométrica")
      itemKey: string; // Clave técnica (ej: "panoramica", "cefalometrica")
      basePrice: number; // Precio base configurado en admin
      quantity?: number; // Cantidad (para dientes periapicales)
      subtotal: number; // basePrice * quantity (o basePrice si no hay cantidad)
    }>;

    // Precios totales
    suggestedPrice: number; // Suma de todos los subtotals del breakdown
    finalPrice?: number; // Precio final ajustado por el técnico (inicialmente = suggestedPrice)
    discount?: number; // Descuento aplicado (finalPrice - suggestedPrice)
    discountPercentage?: number; // Porcentaje de descuento

    // Aprobación
    status: 'pending' | 'sent_to_client' | 'approved_by_client' | 'rejected_by_client'; // Estado del precio
    approvedBy?: string; // ID del técnico que envió la cotización
    approvedAt?: Date; // Fecha de envío de cotización
    clientApprovedAt?: Date; // Fecha de aprobación del cliente
    notes?: string; // Notas del técnico sobre el precio
  };

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  notes?: string;

  // Flag de solicitud de descuento/promoción
  requestedDiscount?: boolean; // true si el cliente pidió consultar por promociones

  // Resultados subidos por el técnico
  externalLinks?: string[]; // Enlaces externos (WeTransfer, Google Drive, etc.)
  images?: string[]; // Array de imágenes en Base64
  reportDocuments?: string[]; // Array de documentos/informes en Base64 (PDFs, DOCX)
  reportDocument?: string; // DEPRECATED: Mantener por compatibilidad con datos antiguos
}

export interface IntraoralRadiography {
  tipo: ('periapical' | 'fisico' | 'digital')[]; // Tipos seleccionados

  // Dientes seleccionados (notación FDI)
  dientesSuperiores?: string[]; // ej: ['1.8', '1.7', '2.1', '2.2']
  dientesInferiores?: string[]; // ej: ['4.8', '4.7', '3.1']
  dientesTemporales?: string[]; // ej: ['5.5', '6.1', '7.1']

  // Bitewing
  bitewing?: {
    molares?: { derecha: boolean; izquierda: boolean };
    premolares?: { derecha: boolean; izquierda: boolean };
  };

  // Oclusal
  oclusal?: {
    superiores: boolean;
    inferiores: boolean;
  };

  // Opciones adicionales
  seriada?: boolean;
  fotografiaIntraoral?: boolean;
  fotografiaExtraoral?: boolean;
}

export interface ExtraoralRadiography {
  tipo: ('fisico' | 'digital')[]; // Array para permitir selección múltiple

  estudios: {
    panoramica?: boolean;
    cefalometrica?: boolean;
    carpal?: boolean; // Edad ósea
    carpalFishman?: boolean; // Sub-opción de Carpal
    carpalTtw2?: boolean; // Sub-opción de Carpal
    posteriorAnterior?: boolean; // Frontal
    posteriorAnteriorRicketts?: boolean; // Sub-opción de Posterior Anterior
    atmBocaAbierta?: boolean;
    atmBocaCerrada?: boolean;
    fotografiaExtraoral?: boolean;
  };
}

export interface OrthodoticPackage {
  tipo: ('fisico' | 'digital')[]; // Array para permitir selección múltiple
  paquete?: 1 | 2 | 3; // Número de paquete seleccionado

  // Plan de tratamiento (solo cuando hay paquete seleccionado)
  planTratamiento?: 'con' | 'sin' | '';

  // Servicios adicionales
  alineadoresInvisibles?: boolean;
  // Sub-opciones de Alineadores Invisibles
  alineadoresPlanificacion?: boolean; // Planificación de tratamiento (en archivo digital: STL)
  alineadoresImpresion?: boolean; // Impresión y plastificado
  escaneoBucal?: boolean; // ESCANEO INTRAORAL DIGITAL
  // Sub-opciones de Escaneo Intraoral Digital
  escaneoIntraoral?: boolean; // Escaneo Intraoral
  escaneoIntraoralZocalo?: boolean; // Escaneo Intraoral con zócalo
  escaneoIntraoralInforme?: boolean; // Escaneo Intraoral con informe
  impresionDigital?: boolean; // MODELOS DE ESTUDIO 3D
  // Sub-opciones de Modelos de Estudio 3D
  modelosDigitalesConInforme?: boolean; // Modelos Digitales con informe
  modelosDigitalesSinInforme?: boolean; // Modelos Digitales sin informe
  modelosImpresionDigital?: boolean; // Impresión digital

  // Opciones de guía
  conGuia?: 'con' | 'sin' | '';
  guiaImpresa?: 'impreso' | 'digital' | '';
}

export interface Payment {
  id: string;
  patientId?: string;
  clientId?: string;
  appointmentId?: string;
  labRequestId?: string;
  amount: number;
  method: 'cash' | 'card' | 'yape' | 'plin' | 'transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  voucher?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientContract {
  id: string;
  patientId: string;
  uploadedBy: string; // userId del admin/recepcionista que adjuntó
  contractName: string; // Nombre descriptivo del contrato
  contractType?: string; // Tipo: 'tratamiento', 'pago', 'confidencialidad', etc.
  contractFile: string; // PDF en base64 o URL
  status: 'pending' | 'signed' | 'rejected';
  digitalSignature?: string; // Firma digital del paciente en base64 (imagen canvas)
  signedAt?: Date; // Fecha de firma
  signedBy?: string; // userId del paciente que firmó
  notes?: string; // Notas adicionales
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'payment' | 'lab_result' | 'system' | 'reminder' | 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'medium';
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  status: 'active' | 'inactive';
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface simplificada de Medication - Catálogo básico para recetas médicas
 * Solo contiene los campos que se usan en el formulario y coinciden con la BD
 */
export interface Medication {
  id: string;
  nombre: string;
  concentracion: string; // Ej: "500mg", "10mg/ml"
  formaFarmaceutica: string; // Presentación: tableta, cápsula, jarabe, etc.
  viaAdministracion: string; // Oral, tópica, intravenosa, etc.
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  color?: string; // Color hexadecimal para el badge
  icon?: string; // Nombre del icono (opcional)
  activo: boolean; // Si la categoría está activa
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface InventoryItem {
  id: string;
  nombre: string;
  descripcion: string;
  categoryId: string; // ID de la categoría (relación con InventoryCategory)
  cantidad: number;
  fechaVencimiento: Date;
  sedeId: string; // Siempre obligatorio - asociado a una sede
  status: 'disponible' | 'por_vencer' | 'vencido' | 'agotado'; // Auto-calculado
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Usuario que creó el ítem
  updatedBy?: string; // Usuario que actualizó el ítem
}

export interface InventoryAlertSettings {
  diasAntes: number; // Días antes del vencimiento para alertar (default: 30)
}

// Diagnostic Condition interface (for final diagnosis step)
export interface DiagnosticCondition {
  id: string;
  toothNumber: string;
  toothPositionId?: number;
  toothSurfaceId?: number | null;
  odontogramConditionId?: number | null;
  conditionId: string;
  dentalConditionId?: number | null;
  conditionLabel: string;
  cie10?: string;
  price: number;
  notes?: string;
  surfaces?: string[];
  surfaceCode?: string;
  surfaceName?: string;
}

// Treatment condition interface
export interface TreatmentCondition {
  id: string; // ID de la condición oficial del odontograma
  label: string; // Nombre de la condición (ej: "Carillas", "Caries")
  price: number; // Precio de esta condición
  editable?: boolean; // Si el nombre puede ser editado manualmente
  observations?: string; // Observaciones adicionales sobre esta condición
}

// Treatment interface (Catálogo de tratamientos del SuperAdmin)
export interface Treatment {
  id: string;
  nombre: string; // Nombre del tratamiento (ej: "Levantamiento de mordida", "Ortodoncia")
  descripcion?: string; // Descripción opcional del tratamiento
  conditions: TreatmentCondition[]; // Lista de condiciones que componen el tratamiento
  precioTotal: number; // Suma automática de los precios de todas las condiciones
  status: 'activo' | 'inactivo'; // Estado del tratamiento
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // ID del usuario que creó el tratamiento
  updatedBy?: string; // ID del usuario que actualizó el tratamiento
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Utility Types
export type UserRole = User['role'];
export type AppointmentStatus = Appointment['status'];
export type PaymentStatus = Payment['status'];
export type NotificationStatus = Notification['status'];

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PatientFormData {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  address: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export interface AppointmentFormData {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  services: string[];
  notes?: string;
}

// Store Types
export interface AppStore {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

export interface PatientsStore {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
}

export interface AppointmentsStore {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  filters: AppointmentFilters;
}

export interface AppointmentFilters {
  date?: string;
  doctor?: string;
  status?: AppointmentStatus[];
  patient?: string;
}

export interface ClinicServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ClinicService {
  id: string;
  name: string;
  description: string;
  category: string;
  serviceType: 'general_consultation' | 'specialty_consultation' | 'treatment'; // Tipo de servicio
  price: number; // Precio total del servicio
  advancePayment: number; // Adelanto para reservar la cita
  duration: number;
  status: 'active' | 'inactive' | 'maintenance';
  requiresSpecialist: boolean;
  isEmergency: boolean;
  createdBy: string; // ID del usuario que creó el servicio (solo super_admin puede crear)
  availableForAllSedes: boolean; // true = disponible para todas las sedes
  createdAt: Date;
  updatedAt: Date;

  // Campos para Servicios Adicionales con Financiamiento
  financingType?: 'none' | 'installments' | 'itemized'; // Tipo de financiamiento
  totalAmount?: number; // Monto total (ortodoncia/implantes)
  initialPayment?: number; // Pago inicial (ortodoncia/implantes)
  monthlyPayment?: number; // Pago mensual (ortodoncia/implantes)
  items?: ClinicServiceItem[]; // Items individuales (rehabilitación)
}

export interface LaboratoryServiceOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  isDefault?: boolean; // Si esta opción viene marcada por defecto
}

export interface LaboratoryService {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // Precio base (puede ser 0 si se usa sistema de opciones)
  sampleType: string;
  processingTime: number;
  status: 'active' | 'inactive' | 'maintenance';
  fastingRequired: boolean;
  homeCollection: boolean;
  // NUEVO: Sistema de precios por opciones (como el formulario de solicitudes)
  priceByOptions?: boolean; // true = usa opciones, false = usa precio único
  options?: LaboratoryServiceOption[]; // Lista de opciones disponibles con sus precios
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  categories: Record<string, number>;
}

// Public Forms Types
export interface PublicForm {
  id: string;
  code: string; // Código único para el link (ej: abc123)
  title: string;
  description?: string;
  createdBy: string; // ID del super_admin que lo creó
  active: boolean;
  services: string[]; // IDs de servicios disponibles
  requiredFields: FormFieldConfig[];
  optionalFields: FormFieldConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  options?: string[]; // Para select
}

export interface PublicFormSubmission {
  id: string;
  formId: string; // ID del formulario público usado
  formCode: string; // Código del formulario para referencia
  formTitle: string; // Título del formulario
  status: 'nuevo' | 'contactado' | 'agendado' | 'completado' | 'archivado';

  // Tipo de formulario (simple o radiografía completa)
  formType?: 'simple' | 'radiography';

  // Datos para formularios simples
  data?: {
    nombre: string;
    telefono: string;
    email?: string;
    edad?: string;
    dni?: string;
    motivoConsulta?: string;
    serviciosSolicitados: string[]; // Nombres de servicios
    [key: string]: any; // Campos adicionales dinámicos
  };

  // Datos para formularios de radiografía (estructura completa como RadiographyRequest)
  radiographyData?: {
    // Datos del Paciente
    patientData: {
      nombre: string;
      edad?: string;
      dni: string;
      telefono?: string;
      motivoConsulta?: string;
    };

    // Datos del Odontólogo
    doctorData: {
      doctor: string;
      cop?: string;
      direccion?: string;
      email?: string;
      telefono?: string;
    };

    // Tomografía 3D
    tomography?: {
      entregaSinInforme: boolean;
      entregaConInforme: boolean;
      entregaDicom: boolean;
      entregaUsb: boolean;
      campoEstudio: 'pequeño' | 'mediano' | 'grande';
      campoEstudioDetalle?: string;
    };

    // Radiografías solicitadas
    radiography?: {
      intraorales?: IntraoralRadiography;
      extraorales?: ExtraoralRadiography;
      asesoriaOrtodoncia?: OrthodoticPackage;
      analisisCefalometricos?: string[];
    };
  };

  submittedAt: Date;
  contactedAt?: Date;
  contactedBy?: string; // ID del técnico que contactó
  notes?: string; // Notas internas del técnico

  // Resultados subidos por el técnico
  images?: string[]; // Array de imágenes en Base64
  reportDocument?: string; // Documento/informe en Base64
}

// Consentimientos Informados Firmados
export interface SignedConsent {
  id: string;
  pacienteId: string; // ID del paciente
  consentimientoId: string; // ID del tipo de consentimiento (ej: 'apicectomia')
  consentimientoNombre: string; // Nombre del consentimiento (ej: 'Apicectomía')
  consentimientoCategoria: string; // Categoría (ej: 'Cirugía')

  // Datos del doctor
  doctorId?: string;
  doctorNombre: string;
  doctorCop: string;

  // Datos del paciente en el momento de la firma
  pacienteNombre: string;
  pacienteDni: string;
  pacienteDomicilio: string;

  // Representante legal (si aplica)
  tieneRepresentante: boolean;
  representanteNombre?: string;
  representanteDni?: string;
  representanteDomicilio?: string;

  // Firmas digitales (Base64)
  firmaPaciente: string;
  firmaDoctor: string;

  // Fecha y observaciones
  fechaConsentimiento: string; // Fecha especificada en el formulario (YYYY-MM-DD) - string para evitar desfase de timezone
  observaciones?: string;

  // HTML del documento procesado con datos
  documentoHTML: string;

  // Metadata
  estado: 'firmado' | 'pendiente';
  createdBy: string; // ID del usuario que lo creó
  createdAt: Date;
  updatedAt: Date;
}

// Configuraciones Globales de la Aplicación
export interface AppSettings {
  id: string; // Siempre '1' (solo hay un registro)

  // Información de la Clínica
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  clinicLogo?: string;
  timezone: string;
  currency: string;
  language: string;

  // Información de Contacto
  whatsappNumber: string; // Formato: código país + número sin + (WhatsApp General)
  whatsappDisplay: string; // Formato: +51 987 654 321 (WhatsApp General)
  whatsappImaging?: string; // WhatsApp específico del Centro de Imágenes (PanoCef)
  whatsappImagingDisplay?: string; // Formato display para Centro de Imágenes
  phoneMain: string;
  phoneEmergency: string;
  emailInfo: string;
  emailAppointments: string;
  emailSupport: string;
  addressMain: string;

  // Redes Sociales
  facebook?: string;
  instagram?: string;
  twitter?: string;

  // Configuración de Notificaciones
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  reminderTime: number; // Horas antes
  systemAlerts: boolean;

  // Configuración de Seguridad
  sessionTimeout: number; // Minutos
  passwordExpiry: number; // Días
  maxLoginAttempts: number;
  auditLog: boolean;

  // Configuración de Alertas de Inventario
  inventoryAlertSettings: InventoryAlertSettings;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Configuración específica de citas
export interface AppointmentSettings {
  maxDurationForRegularUsers: number; // Duración máxima en minutos para usuarios regulares (por defecto 30)
  defaultDuration: number; // Duración por defecto en minutos (por defecto 30)
  allowedRolesForLongAppointments: number[]; // role_ids que pueden crear citas largas (1=Super Admin, 4=Recepcionista)
}

// ============================================================
// PAYMENT PLANS (Planes de Pago)
// ============================================================

export type PaymentPlanType = 'single' | 'monthly' | 'installments';

export interface PaymentPlan {
  id: string;
  patientId: string;
  treatmentPlanId?: string; // ID del plan de tratamiento asociado
  conditionId: string; // ID de la condición dental (ej: ortodoncia, implante)
  conditionName: string; // Nombre de la condición
  toothNumber?: string; // Número del diente (si aplica)

  // Tipo de plan
  type: PaymentPlanType;

  // Montos
  totalAmount: number; // Monto total del tratamiento
  downPayment: number; // Pago inicial/anticipo
  remainingAmount: number; // Monto restante a pagar

  // Configuración según tipo
  monthlyConfig?: MonthlyPaymentConfig;
  installmentsConfig?: InstallmentsPaymentConfig;
  singlePaymentConfig?: SinglePaymentConfig;

  // Estado y seguimiento
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'defaulted';
  paidAmount: number; // Monto pagado hasta el momento
  pendingAmount: number; // Monto pendiente de pago
  nextPaymentDate?: Date; // Próxima fecha de pago

  // Metadata
  createdBy: string; // ID del doctor o recepcionista que lo creó
  sedeId: string; // Sede donde se creó
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Configuración para pago mensual
export interface MonthlyPaymentConfig {
  numberOfMonths: number; // Duración en meses (3-24)
  monthlyAmount: number; // Monto mensual fijo
  startDate: Date; // Fecha de inicio de pagos
  paymentDay: number; // Día del mes para pagar (1-31)
  interestRate?: number; // Tasa de interés (opcional)
  earlyPaymentDiscount?: number; // Descuento por pago anticipado (%)
}

// Configuración para pago por cuotas personalizadas
export interface InstallmentsPaymentConfig {
  numberOfInstallments: number; // Número de cuotas (2-12)
  installments: PaymentInstallment[]; // Detalles de cada cuota
  flexibleAmounts: boolean; // true = cuotas con montos diferentes, false = cuotas iguales
}

export interface PaymentInstallment {
  id: string;
  installmentNumber: number; // Número de cuota (1, 2, 3...)
  amount: number; // Monto de esta cuota
  dueDate: Date; // Fecha de vencimiento
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: Date; // Fecha en que se pagó
  paidAmount?: number; // Monto pagado (puede ser parcial)
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check';
  notes?: string;
}

// Configuración para pago único
export interface SinglePaymentConfig {
  dueDate: Date; // Fecha límite de pago
  discount?: number; // Descuento por pago único (%)
  discountedAmount?: number; // Monto con descuento aplicado
  earlyPaymentBonus?: number; // Bonificación adicional por pago anticipado
}

// ========== HISTORIAL DE TRATAMIENTOS REALIZADOS ==========

// Entrada de historial de tratamiento realizado
export interface TreatmentHistoryEntry {
  id: string;
  patientId: string; // ID del paciente
  doctorId: string; // ID del médico que realizó el tratamiento
  appointmentId?: string; // ID de la cita asociada (opcional)
  date: Date; // Fecha en que se realizó el tratamiento

  // Datos del tratamiento realizado (snapshot del momento)
  treatmentData: {
    appliedTreatments?: any[]; // Tratamientos aplicados del catálogo
    performedProcedures?: any[]; // Procedimientos realizados
    odontogramState?: OdontogramState; // Estado del odontograma en ese momento
    observations?: string; // Observaciones del tratamiento
    complications?: string; // Complicaciones si las hubo
    nextAppointment?: Date; // Próxima cita sugerida
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // ID del usuario que creó el registro
}

// Resumen de historial para visualización rápida
export interface TreatmentHistorySummary {
  patientId: string;
  totalEntries: number; // Total de tratamientos realizados
  firstTreatment: Date; // Fecha del primer tratamiento
  lastTreatment: Date; // Fecha del último tratamiento
  totalProcedures: number; // Total de procedimientos realizados
  lastDoctor?: string; // Último médico que atendió
}