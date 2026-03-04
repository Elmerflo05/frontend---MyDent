import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { AutoRedirect } from '@/components/auth/AutoRedirect';

// Lazy load components for better performance
const LoginPage = lazy(() => import('@/app/auth/LoginPage'));
const HomePage = lazy(() => import('@/app/HomePage'));

// Clinic Portal
const ClinicLayout = lazy(() => import('@/app/clinic/ClinicLayout'));
const ClinicDashboard = lazy(() => import('@/app/clinic/pages/Dashboard'));
const PatientConsultation = lazy(() => import('@/app/clinic/pages/PatientConsultation'));
const ClinicPatients = lazy(() => import('@/app/clinic/pages/Patients'));
const ClinicAppointments = lazy(() => import('@/app/clinic/pages/Appointments'));
const ClinicMedicalRecords = lazy(() => import('@/app/clinic/pages/MedicalRecords'));
const ClinicPayments = lazy(() => import('@/app/clinic/pages/Payments'));

// Laboratory Portal
const LaboratoryLayout = lazy(() => import('@/app/laboratory/LaboratoryLayout'));
const LaboratoryDashboard = lazy(() => import('@/app/laboratory/pages/Dashboard'));
const LaboratoryCalendar = lazy(() => import('@/app/laboratory/pages/Calendar'));
const LaboratoryRequests = lazy(() => import('@/app/laboratory/pages/Requests'));
const LaboratoryResults = lazy(() => import('@/app/laboratory/pages/Results'));
// Prosthesis Laboratory Portal
const ProsthesisLabLayout = lazy(() => import('@/app/prosthesis-lab/ProsthesisLabLayout'));
const ProsthesisLabDashboard = lazy(() => import('@/app/prosthesis-lab/pages/Dashboard'));
const ProsthesisLabRequests = lazy(() => import('@/app/prosthesis-lab/pages/Requests'));
const ProsthesisLabReception = lazy(() => import('@/app/prosthesis-lab/pages/Reception'));

// Patient Portal
const PatientLayout = lazy(() => import('@/app/patient/PatientLayout'));
const PatientDashboard = lazy(() => import('@/app/patient/pages/Dashboard'));
const PatientAppointments = lazy(() => import('@/app/patient/pages/Appointments'));
const PatientMedicalHistory = lazy(() => import('@/app/patient/pages/MedicalHistory'));
const PatientTreatments = lazy(() => import('@/app/patient/pages/Treatments'));
const PatientBilling = lazy(() => import('@/app/patient/pages/Billing'));
const PatientProfile = lazy(() => import('@/app/patient/pages/Profile'));
const PatientOdontogram = lazy(() => import('@/app/patient/pages/Odontogram'));
const PatientExternalExams = lazy(() => import('@/app/patient/pages/ExternalExams'));
const PatientPromotions = lazy(() => import('@/app/patient/pages/Promotions'));
const PatientContracts = lazy(() => import('@/app/patient/pages/Contracts'));
const PatientHealthPlans = lazy(() => import('@/app/patient/pages/HealthPlans'));
const HealthPlanSubscription = lazy(() => import('@/app/patient/pages/HealthPlanSubscription'));
const MyHealthPlan = lazy(() => import('@/app/patient/pages/MyHealthPlan'));

// Admin Portal
const AdminLayout = lazy(() => import('@/app/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/app/admin/pages/Dashboard'));
const AdminSedes = lazy(() => import('@/components/sedes/SedesList'));
const AdminCompanies = lazy(() => import('@/app/admin/pages/Companies'));
const AdminAppointmentsCalendar = lazy(() => import('@/app/admin/pages/AppointmentsCalendar'));
const AdminDoctors = lazy(() => import('@/app/admin/pages/Doctors'));
const DoctorCreate = lazy(() => import('@/app/admin/pages/DoctorCreate'));
const AdminPatients = lazy(() => import('@/app/admin/pages/Patients'));
const CreatePatient = lazy(() => import('@/app/admin/pages/CreatePatient'));
const AdminLaboratoryServices = lazy(() => import('@/app/admin/pages/LaboratoryServices'));
const AdminLaboratoryRequests = lazy(() => import('@/app/admin/pages/LaboratoryRequests'));
const AdminSettings = lazy(() => import('@/app/admin/pages/Settings'));
const AdminReports = lazy(() => import('@/app/admin/pages/Reports'));
const AdminOdontogramConfig = lazy(() => import('@/app/admin/pages/OdontogramConfig'));
const AdminPromotions = lazy(() => import('@/app/admin/pages/Promotions'));
const AdminUsers = lazy(() => import('@/app/admin/pages/Users'));
const AdminPublicForms = lazy(() => import('@/app/admin/pages/PublicForms'));
const AdminConsultorios = lazy(() => import('@/app/admin/pages/Consultorios'));
const CollaboratorManagement = lazy(() => import('@/app/admin/pages/CollaboratorManagement'));
const MedicationManagement = lazy(() => import('@/app/admin/pages/MedicationManagement'));
const TreatmentManagement = lazy(() => import('@/app/admin/pages/TreatmentManagement'));
const InventoryManagement = lazy(() => import('@/app/admin/pages/InventoryManagement'));
const HealthPlansManagement = lazy(() => import('@/app/admin/pages/HealthPlansManagement'));
const VoucherApproval = lazy(() => import('@/app/admin/pages/VoucherApproval'));
const TreatmentAudit = lazy(() => import('@/app/admin/pages/TreatmentAudit'));
const SubProceduresManagement = lazy(() => import('@/app/admin/pages/SubProceduresManagement'));
const BranchPaymentMethodsConfig = lazy(() => import('@/app/admin/pages/BranchPaymentMethodsConfig'));

// Laboratory Submissions (Solicitudes Externas - para external_client y staff)
const LaboratorySubmissions = lazy(() => import('@/app/laboratory/pages/Submissions'));

// Laboratory (Nuevo)
const PriceCatalog = lazy(() => import('@/app/laboratory/pages/PriceCatalog'));
const LaboratoryNewRequest = lazy(() => import('@/app/laboratory/pages/NewRequest'));

// Public Pages (No login required)
const PublicFormPage = lazy(() => import('@/app/public/PublicFormPage'));
const PromoRedirect = lazy(() => import('@/app/public/PromoRedirect'));

// Error Pages
const NotFoundPage = lazy(() => import('@/app/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/app/errors/UnauthorizedPage'));
const ServerErrorPage = lazy(() => import('@/app/errors/ServerErrorPage'));

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