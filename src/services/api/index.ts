/**
 * API Services - Punto de exportación central
 * Todos los servicios de API se exportan desde aquí
 */

// Servicios
export { httpClient, default as http } from './httpClient';
export { authApi, default as auth } from './authApi';
export { patientsApi, default as patients } from './patientsApi';
export { appointmentsApi, default as appointments } from './appointmentsApi';
export { treatmentsApi, default as treatments } from './treatmentsApi';
export { paymentsApi, default as payments } from './paymentsApi';
export { budgetsApi, default as budgets } from './budgetsApi';
export { dentistsApi, default as dentists } from './dentistsApi';
export { usersApi, default as users } from './usersApi';
export { branchesApi, default as branches } from './branchesApi';
export { dentalProceduresApi, default as dentalProcedures } from './dentalProceduresApi';
export { consultationsApi, default as consultations } from './consultationsApi';
export { catalogsApi, default as catalogs } from './catalogsApi';
export { medicalHistoriesApi, default as medicalHistories } from './medicalHistoriesApi';
export { prescriptionsApi, default as prescriptions } from './prescriptionsApi';
export { procedureHistoryApi, default as procedureHistory } from './procedureHistoryApi';
export { procedureIncomeApi, default as procedureIncome } from './procedureIncomeApi';
export { evolutionOdontogramApi, default as evolutionOdontogram } from './evolutionOdontogramApi';
export { serviceMonthlyPaymentsApi, default as serviceMonthlyPayments } from './serviceMonthlyPaymentsApi';

// Tipos base
export type { ApiResponse, RequestConfig } from './httpClient';

// Tipos de autenticación
export type {
  LoginCredentials,
  UserData,
  LoginResponse,
  AuthApiResponse,
} from './authApi';

// Tipos de pacientes
export type {
  PatientData,
  PatientFilters,
  PatientsListResponse,
  PatientResponse,
} from './patientsApi';

// Tipos de citas
export type {
  AppointmentData,
  AppointmentFilters,
  AppointmentsListResponse,
  AppointmentResponse,
} from './appointmentsApi';

// Tipos de tratamientos
export type {
  TreatmentData,
  TreatmentFilters,
  TreatmentsListResponse,
  TreatmentResponse,
} from './treatmentsApi';

// Tipos de pagos
export type {
  PaymentData,
  PaymentFilters,
  PaymentsListResponse,
  PaymentResponse,
  PaymentVoucherData,
  VoucherResponse,
} from './paymentsApi';

// Tipos de presupuestos
export type {
  BudgetData,
  BudgetFilters,
  BudgetsListResponse,
  BudgetResponse,
  BudgetDetailData,
  BudgetDetailResponse,
} from './budgetsApi';

// Tipos de dentistas
export type {
  DentistData,
  DentistFilters,
  DentistsListResponse,
  DentistResponse,
  DentistScheduleData,
  DentistExceptionData,
  ScheduleResponse,
  ExceptionResponse,
} from './dentistsApi';

// Tipos de usuarios
export type {
  UserData,
  UserFilters,
  UsersListResponse,
  UserResponse,
} from './usersApi';

// Tipos de sedes
export type {
  BranchData,
  BranchFilters,
  BranchesListResponse,
  BranchResponse,
} from './branchesApi';

// Tipos de procedimientos dentales
export type {
  DentalProcedureData,
  DentalProcedureFilters,
  DentalProceduresListResponse,
  DentalProcedureResponse,
} from './dentalProceduresApi';

// Tipos de consultas
export type {
  ConsultationData,
  ConsultationFilters,
  ConsultationsListResponse,
  ConsultationResponse,
  ConsultationRoomData,
  RoomsListResponse,
  RoomResponse,
  DiagnosticConditionData,
  DiagnosticResponse,
  // Tipos de plan de tratamiento de consulta
  ConsultationTreatmentPlanData,
  ConsultationTreatmentPlanResponse,
  ConsultationTreatmentPlanSummaryResponse,
  ConsultationTreatmentPlanFullData,
  ConsultationTreatmentItem,
  ConsultationTreatmentItemCondition,
  ConsultationAdditionalService,
  ConsultationAdditionalServiceEditableFields,
} from './consultationsApi';

// Tipos de catálogos
export type {
  CatalogItem,
  CatalogResponse,
  CatalogItemResponse,
  GenderData,
  BloodTypeData,
  DocumentTypeData,
  MaritalStatusData,
  IdentificationTypeData,
  MedicationUnitData,
  UserStatusData,
  DiagnosisOptionData,
  AppointmentStatusData,
  BudgetStatusData,
  TreatmentStatusData,
  TreatmentPlanStatusData,
  ReminderTypeData,
  PaymentMethodData,
  SpecialtyData,
  ToothPositionData,
  ToothSurfaceData,
  PrescriptionFrequencyData,
  PrescriptionDurationData,
} from './catalogsApi';

// Tipos de historias médicas
export type {
  MedicalHistoryData,
  MedicalHistoryFilters,
  MedicalHistoriesListResponse,
  MedicalHistoryResponse,
} from './medicalHistoriesApi';

// Tipos de prescripciones
export type {
  PrescriptionData,
  PrescriptionFilters,
  PrescriptionsListResponse,
  PrescriptionResponse,
  MedicationData,
  MedicationFilters,
  MedicationsListResponse,
  MedicationResponse,
} from './prescriptionsApi';

// Tipos de historial de procedimientos
export type {
  ProcedureHistoryData,
  ProcedureHistoryFilters,
  ProcedureHistoryListResponse,
  ProcedureHistoryResponse,
} from './procedureHistoryApi';

// Tipos de ingresos por procedimientos
export type {
  ProcedureIncomeData,
  ProcedureIncomeFilters,
  ProcedureIncomeListResponse,
  ProcedureIncomeResponse,
  DentistIncomeSummary,
  DentistIncomeSummaryResponse,
} from './procedureIncomeApi';

// Tipos de odontograma de evolucion
export type {
  EvolutionOdontogramData,
  EvolutionOdontogramFilters,
  EvolutionOdontogramListResponse,
  EvolutionOdontogramResponse,
  EvolutionGroupedByTooth,
  EvolutionSummary,
  EvolutionSummaryResponse,
} from './evolutionOdontogramApi';

// Tipos de pagos mensuales de servicios
export type {
  ServiceMonthlyPaymentData,
  CreatePaymentData,
  ServicePaymentStatus,
  PaymentCount,
  DentistPaymentsSummary,
  DentistPaymentsResponse,
  FinalizeServiceData,
  PaymentsFilters,
} from './serviceMonthlyPaymentsApi';
