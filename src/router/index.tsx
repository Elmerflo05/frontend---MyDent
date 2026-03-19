import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { AutoRedirect } from '@/components/auth/AutoRedirect';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

// Lazy load components con retry automático ante deploy (ChunkLoadError)
const LoginPage = lazyWithRetry(() => import('@/app/auth/LoginPage'));
const HomePage = lazyWithRetry(() => import('@/app/HomePage'));

// Clinic Portal
const ClinicLayout = lazyWithRetry(() => import('@/app/clinic/ClinicLayout'));
const ClinicDashboard = lazyWithRetry(() => import('@/app/clinic/pages/Dashboard'));
const PatientConsultation = lazyWithRetry(() => import('@/app/clinic/pages/PatientConsultation'));
const ClinicPatients = lazyWithRetry(() => import('@/app/clinic/pages/Patients'));
const ClinicAppointments = lazyWithRetry(() => import('@/app/clinic/pages/Appointments'));
const ClinicMedicalRecords = lazyWithRetry(() => import('@/app/clinic/pages/MedicalRecords'));
const ClinicPayments = lazyWithRetry(() => import('@/app/clinic/pages/Payments'));

// Laboratory Portal
const LaboratoryLayout = lazyWithRetry(() => import('@/app/laboratory/LaboratoryLayout'));
const LaboratoryDashboard = lazyWithRetry(() => import('@/app/laboratory/pages/Dashboard'));
const LaboratoryCalendar = lazyWithRetry(() => import('@/app/laboratory/pages/Calendar'));
const LaboratoryRequests = lazyWithRetry(() => import('@/app/laboratory/pages/Requests'));
const LaboratoryResults = lazyWithRetry(() => import('@/app/laboratory/pages/Results'));
// Prosthesis Laboratory Portal
const ProsthesisLabLayout = lazyWithRetry(() => import('@/app/prosthesis-lab/ProsthesisLabLayout'));
const ProsthesisLabDashboard = lazyWithRetry(() => import('@/app/prosthesis-lab/pages/Dashboard'));
const ProsthesisLabRequests = lazyWithRetry(() => import('@/app/prosthesis-lab/pages/Requests'));
const ProsthesisLabReception = lazyWithRetry(() => import('@/app/prosthesis-lab/pages/Reception'));

// Patient Portal
const PatientLayout = lazyWithRetry(() => import('@/app/patient/PatientLayout'));
const PatientDashboard = lazyWithRetry(() => import('@/app/patient/pages/Dashboard'));
const PatientAppointments = lazyWithRetry(() => import('@/app/patient/pages/Appointments'));
const PatientMedicalHistory = lazyWithRetry(() => import('@/app/patient/pages/MedicalHistory'));
const PatientTreatments = lazyWithRetry(() => import('@/app/patient/pages/Treatments'));
const PatientBilling = lazyWithRetry(() => import('@/app/patient/pages/Billing'));
const PatientProfile = lazyWithRetry(() => import('@/app/patient/pages/Profile'));
const PatientOdontogram = lazyWithRetry(() => import('@/app/patient/pages/Odontogram'));
const PatientExternalExams = lazyWithRetry(() => import('@/app/patient/pages/ExternalExams'));
const PatientPromotions = lazyWithRetry(() => import('@/app/patient/pages/Promotions'));
const PatientContracts = lazyWithRetry(() => import('@/app/patient/pages/Contracts'));
const PatientHealthPlans = lazyWithRetry(() => import('@/app/patient/pages/HealthPlans'));
const HealthPlanSubscription = lazyWithRetry(() => import('@/app/patient/pages/HealthPlanSubscription'));
const MyHealthPlan = lazyWithRetry(() => import('@/app/patient/pages/MyHealthPlan'));

// Admin Portal
const AdminLayout = lazyWithRetry(() => import('@/app/admin/AdminLayout'));
const AdminDashboard = lazyWithRetry(() => import('@/app/admin/pages/Dashboard'));
const AdminSedes = lazyWithRetry(() => import('@/components/sedes/SedesList'));
const AdminCompanies = lazyWithRetry(() => import('@/app/admin/pages/Companies'));
const AdminAppointmentsCalendar = lazyWithRetry(() => import('@/app/admin/pages/AppointmentsCalendar'));
const AdminDoctors = lazyWithRetry(() => import('@/app/admin/pages/Doctors'));
const DoctorCreate = lazyWithRetry(() => import('@/app/admin/pages/DoctorCreate'));
const AdminPatients = lazyWithRetry(() => import('@/app/admin/pages/Patients'));
const CreatePatient = lazyWithRetry(() => import('@/app/admin/pages/CreatePatient'));
const AdminLaboratoryServices = lazyWithRetry(() => import('@/app/admin/pages/LaboratoryServices'));
const AdminLaboratoryRequests = lazyWithRetry(() => import('@/app/admin/pages/LaboratoryRequests'));
const AdminSettings = lazyWithRetry(() => import('@/app/admin/pages/Settings'));
const AdminReports = lazyWithRetry(() => import('@/app/admin/pages/Reports'));
const AdminOdontogramConfig = lazyWithRetry(() => import('@/app/admin/pages/OdontogramConfig'));
const AdminPromotions = lazyWithRetry(() => import('@/app/admin/pages/Promotions'));
const AdminUsers = lazyWithRetry(() => import('@/app/admin/pages/Users'));
const AdminPublicForms = lazyWithRetry(() => import('@/app/admin/pages/PublicForms'));
const AdminConsultorios = lazyWithRetry(() => import('@/app/admin/pages/Consultorios'));
const CollaboratorManagement = lazyWithRetry(() => import('@/app/admin/pages/CollaboratorManagement'));
const MedicationManagement = lazyWithRetry(() => import('@/app/admin/pages/MedicationManagement'));
const TreatmentManagement = lazyWithRetry(() => import('@/app/admin/pages/TreatmentManagement'));
const InventoryManagement = lazyWithRetry(() => import('@/app/admin/pages/InventoryManagement'));
const HealthPlansManagement = lazyWithRetry(() => import('@/app/admin/pages/HealthPlansManagement'));
const VoucherApproval = lazyWithRetry(() => import('@/app/admin/pages/VoucherApproval'));
const TreatmentAudit = lazyWithRetry(() => import('@/app/admin/pages/TreatmentAudit'));
const SubProceduresManagement = lazyWithRetry(() => import('@/app/admin/pages/SubProceduresManagement'));
const BranchPaymentMethodsConfig = lazyWithRetry(() => import('@/app/admin/pages/BranchPaymentMethodsConfig'));

// Laboratory Submissions (Solicitudes Externas - para external_client y staff)
const LaboratorySubmissions = lazyWithRetry(() => import('@/app/laboratory/pages/Submissions'));

// Laboratory (Nuevo)
const PriceCatalog = lazyWithRetry(() => import('@/app/laboratory/pages/PriceCatalog'));
const LaboratoryNewRequest = lazyWithRetry(() => import('@/app/laboratory/pages/NewRequest'));

// Public Pages (No login required)
const PublicFormPage = lazyWithRetry(() => import('@/app/public/PublicFormPage'));
const PromoRedirect = lazyWithRetry(() => import('@/app/public/PromoRedirect'));

// Error Pages
const NotFoundPage = lazyWithRetry(() => import('@/app/errors/NotFoundPage'));
const UnauthorizedPage = lazyWithRetry(() => import('@/app/errors/UnauthorizedPage'));
const ServerErrorPage = lazyWithRetry(() => import('@/app/errors/ServerErrorPage'));

// Wrapper component for lazy-loaded routes
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  // Public Routes - Con AutoRedirect para prevenir bucles infinitos
  {
    path: '/',
    element: (
      <AutoRedirect>
        <LazyWrapper>
          <HomePage />
        </LazyWrapper>
      </AutoRedirect>
    )
  },

  // Public Form Route (No login required) - Sin AutoRedirect porque pueden ser formularios públicos
  {
    path: '/public/form/:formId',
    element: (
      <LazyWrapper>
        <PublicFormPage />
      </LazyWrapper>
    )
  },

  // Promotion Redirect Route (No login required)
  {
    path: '/promo/:code',
    element: (
      <LazyWrapper>
        <PromoRedirect />
      </LazyWrapper>
    )
  },

  // Authentication Routes
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LazyWrapper>
          <LoginPage />
        </LazyWrapper>
      </GuestRoute>
    )
  },

  // Clinic Portal Routes
  {
    path: '/clinic',
    element: (
      <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}>
        <LazyWrapper>
          <ClinicLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <ClinicDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'consultation',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}>
            <LazyWrapper>
              <PatientConsultation />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'patients',
        element: (
          <LazyWrapper>
            <ClinicPatients />
          </LazyWrapper>
        )
      },
      {
        path: 'patients/:patientId/complete',
        element: (
          <ProtectedRoute requiredRoles={['doctor']}>
            <LazyWrapper>
              <CreatePatient />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'patients/:patientId/edit',
        element: (
          <LazyWrapper>
            <CreatePatient />
          </LazyWrapper>
        )
      },
      {
        path: 'appointments',
        element: (
          <LazyWrapper>
            <ClinicAppointments />
          </LazyWrapper>
        )
      },
      {
        path: 'medical-records',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'doctor']}>
            <LazyWrapper>
              <ClinicMedicalRecords />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
            <LazyWrapper>
              <ClinicPayments />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'formularios-publicos',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'doctor', 'receptionist']}>
            <LazyWrapper>
              <AdminPublicForms />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'receptionist']}>
            <LazyWrapper>
              <InventoryManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      }
    ]
  },

  // Laboratory Portal Routes (Ahora usado para Técnicos de Imágenes)
  {
    path: '/laboratory',
    element: (
      <ProtectedRoute requiredRoles={['super_admin', 'admin', 'doctor', 'imaging_technician', 'external_client']}>
        <LazyWrapper>
          <LaboratoryLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <LaboratoryDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'imaging_technician']}>
            <LazyWrapper>
              <LaboratoryCalendar />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'requests',
        element: (
          <LazyWrapper>
            <LaboratoryRequests />
          </LazyWrapper>
        )
      },
      {
        path: 'new-request',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'imaging_technician', 'external_client']}>
            <LazyWrapper>
              <LaboratoryNewRequest />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'results',
        element: (
          <LazyWrapper>
            <LaboratoryResults />
          </LazyWrapper>
        )
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'imaging_technician', 'external_client']}>
            <LazyWrapper>
              <PriceCatalog />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'submissions',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'imaging_technician', 'external_client']}>
            <LazyWrapper>
              <LaboratorySubmissions />
            </LazyWrapper>
          </ProtectedRoute>
        )
      }
    ]
  },

  // Prosthesis Laboratory Portal Routes
  {
    path: '/prosthesis-lab',
    element: (
      <ProtectedRoute requiredRoles={['super_admin', 'admin', 'doctor', 'receptionist', 'prosthesis_technician']}>
        <LazyWrapper>
          <ProsthesisLabLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <ProsthesisLabDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'requests',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'doctor', 'receptionist', 'prosthesis_technician']}>
            <LazyWrapper>
              <ProsthesisLabRequests />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'reception',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'receptionist']}>
            <LazyWrapper>
              <ProsthesisLabReception />
            </LazyWrapper>
          </ProtectedRoute>
        )
      }
    ]
  },

  // Admin Portal Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
        <LazyWrapper>
          <AdminLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <AdminDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'sedes',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <AdminSedes />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'companies',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <AdminCompanies />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <AdminUsers />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'appointments',
        element: (
          <LazyWrapper>
            <AdminAppointmentsCalendar />
          </LazyWrapper>
        )
      },
      {
        path: 'payments',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <ClinicPayments />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'doctors',
        element: (
          <LazyWrapper>
            <AdminDoctors />
          </LazyWrapper>
        )
      },
      {
        path: 'doctors/create',
        element: (
          <LazyWrapper>
            <DoctorCreate />
          </LazyWrapper>
        )
      },
      {
        path: 'doctors/:doctorId/edit',
        element: (
          <LazyWrapper>
            <DoctorCreate />
          </LazyWrapper>
        )
      },
      {
        path: 'patients',
        element: (
          <LazyWrapper>
            <AdminPatients />
          </LazyWrapper>
        )
      },
      {
        path: 'patients/:patientId/edit',
        element: (
          <LazyWrapper>
            <CreatePatient />
          </LazyWrapper>
        )
      },
      {
        path: 'laboratory-services',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <AdminLaboratoryServices />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'laboratory-requests',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <AdminLaboratoryRequests />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <LazyWrapper>
            <AdminSettings />
          </LazyWrapper>
        )
      },
      {
        path: 'reports',
        element: (
          <LazyWrapper>
            <AdminReports />
          </LazyWrapper>
        )
      },
      {
        path: 'treatment-audit',
        element: (
          <LazyWrapper>
            <TreatmentAudit />
          </LazyWrapper>
        )
      },
      {
        path: 'consultorios',
        element: (
          <LazyWrapper>
            <AdminConsultorios />
          </LazyWrapper>
        )
      },
      {
        path: 'odontogram',
        element: (
          <LazyWrapper>
            <AdminOdontogramConfig />
          </LazyWrapper>
        )
      },
      {
        path: 'promotions',
        element: (
          <LazyWrapper>
            <AdminPromotions />
          </LazyWrapper>
        )
      },
      {
        path: 'payment-methods',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <BranchPaymentMethodsConfig />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'health-plans',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <HealthPlansManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'vouchers',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <VoucherApproval />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'sub-procedures',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <SubProceduresManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'public-forms',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <AdminPublicForms />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'collaborators',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <CollaboratorManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'medications',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
            <LazyWrapper>
              <MedicationManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'treatments',
        element: (
          <ProtectedRoute requiredRoles={['super_admin']}>
            <LazyWrapper>
              <TreatmentManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute requiredRoles={['super_admin', 'admin', 'receptionist']}>
            <LazyWrapper>
              <InventoryManagement />
            </LazyWrapper>
          </ProtectedRoute>
        )
      },
    ]
  },

  // Patient Portal Routes
  {
    path: '/patient',
    element: (
      <ProtectedRoute requiredRoles={['patient']}>
        <LazyWrapper>
          <PatientLayout />
        </LazyWrapper>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <PatientDashboard />
          </LazyWrapper>
        )
      },
      {
        path: 'appointments',
        element: (
          <LazyWrapper>
            <PatientAppointments />
          </LazyWrapper>
        )
      },
      {
        path: 'medical-history',
        element: (
          <LazyWrapper>
            <PatientMedicalHistory />
          </LazyWrapper>
        )
      },
      {
        path: 'treatments',
        element: (
          <LazyWrapper>
            <PatientTreatments />
          </LazyWrapper>
        )
      },
      {
        path: 'billing',
        element: (
          <LazyWrapper>
            <PatientBilling />
          </LazyWrapper>
        )
      },
      {
        path: 'profile',
        element: (
          <LazyWrapper>
            <PatientProfile />
          </LazyWrapper>
        )
      },
      {
        path: 'odontogram',
        element: (
          <LazyWrapper>
            <PatientOdontogram />
          </LazyWrapper>
        )
      },
      {
        path: 'external-exams',
        element: (
          <LazyWrapper>
            <PatientExternalExams />
          </LazyWrapper>
        )
      },
      {
        path: 'promotions',
        element: (
          <LazyWrapper>
            <PatientPromotions />
          </LazyWrapper>
        )
      },
      {
        path: 'contracts',
        element: (
          <LazyWrapper>
            <PatientContracts />
          </LazyWrapper>
        )
      },
      {
        path: 'health-plans',
        element: (
          <LazyWrapper>
            <PatientHealthPlans />
          </LazyWrapper>
        )
      },
      {
        path: 'health-plan-subscription',
        element: (
          <LazyWrapper>
            <HealthPlanSubscription />
          </LazyWrapper>
        )
      },
      {
        path: 'my-health-plan',
        element: (
          <LazyWrapper>
            <MyHealthPlan />
          </LazyWrapper>
        )
      },
      {
        path: 'formularios-publicos',
        element: (
          <LazyWrapper>
            <AdminPublicForms />
          </LazyWrapper>
        )
      }
    ]
  },

  // Error Routes
  {
    path: '/unauthorized',
    element: (
      <LazyWrapper>
        <UnauthorizedPage />
      </LazyWrapper>
    )
  },
  {
    path: '/server-error',
    element: (
      <LazyWrapper>
        <ServerErrorPage />
      </LazyWrapper>
    )
  },
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFoundPage />
      </LazyWrapper>
    )
  }
]);

// Route configuration for navigation
export const routeConfig = {
  patient: [
    { path: '/patient/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/patient/appointments', label: 'Mis Citas', icon: 'Calendar' },
    { path: '/patient/my-health-plan', label: 'Mi Plan de Salud', icon: 'Shield' },
    { path: '/patient/health-plan-subscription', label: 'Afiliarme a un Plan', icon: 'Heart' },
    { path: '/patient/promotions', label: 'Promociones', icon: 'Gift' },
    { path: '/patient/odontogram', label: 'Mi Odontograma', icon: 'Stethoscope' },
    { path: '/patient/medical-history', label: 'Historial Medico', icon: 'FileText' },
    { path: '/patient/treatments', label: 'Tratamientos', icon: 'Activity' },
    { path: '/patient/external-exams', label: 'Examenes Externos', icon: 'TestTube' },
    { path: '/patient/contracts', label: 'Mis Contratos', icon: 'FileText' },
    { path: '/patient/formularios-publicos', label: 'Mis Consentimientos', icon: 'FileCheck' },
    { path: '/patient/billing', label: 'Facturacion', icon: 'CreditCard' },
    { path: '/patient/profile', label: 'Mi Perfil', icon: 'User' }
  ]
};

export type RouteConfig = typeof routeConfig;