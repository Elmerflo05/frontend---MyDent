import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Settings,
  BarChart,
  LogOut,
  User,
  ChevronDown,
  Shield,
  Calendar,
  Stethoscope,
  UserCheck,
  Activity,
  TestTube,
  ClipboardList,
  FileImage,
  Tag,
  Building2,
  Link2,
  FileCheck,
  Clock,
  Pill,
  Package,
  Heart,
  CheckCircle,
  Layers,
  FileText,
  FileSpreadsheet,
  CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';
import NotificationBell from '@/components/notifications/NotificationBell';
import { SessionTimeoutProvider } from '@/components/common/SessionTimeoutProvider';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const location = useLocation();

  // Define menu sections based on user role
  const getMenuSections = () => {
    // Admin sections
    const operationsItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/appointments', label: 'Calendario de Citas', icon: Calendar },
      { path: '/admin/doctors', label: 'Médicos', icon: Stethoscope },
      { path: '/admin/patients', label: 'Pacientes', icon: UserCheck },
      { path: '/admin/payments', label: 'Pagos', icon: CreditCard },
      { path: '/admin/inventory', label: 'Inventario', icon: Package },
      { path: '/admin/medications', label: 'Medicamentos', icon: Pill },
      { path: '/admin/promotions', label: 'Promociones', icon: Tag },
      { path: '/admin/health-plans', label: 'Planes de Salud', icon: Heart }
    ];

    // Add super_admin only options
    if (user?.role === 'super_admin') {
      operationsItems.push(
        { path: '/admin/treatments', label: 'Tratamientos', icon: Layers },
        { path: '/admin/sub-procedures', label: 'Sub-Procedimientos', icon: FileSpreadsheet },
        { path: '/admin/vouchers', label: 'Aprobar Vouchers', icon: CheckCircle },
      );
    }

    const adminSections = [
      {
        title: 'OPERACIONES',
        items: operationsItems
      },
      {
        title: 'SERVICIOS',
        items: [
          { path: '/admin/laboratory-services', label: 'Servicios de Laboratorio', icon: TestTube, roles: ['super_admin'] },
          { path: '/admin/laboratory-requests', label: 'Solicitudes de Laboratorio', icon: ClipboardList, roles: ['super_admin'] }
        ]
      },
      {
        title: 'CONFIGURACIÓN',
        items: [
          { path: '/admin/payment-methods', label: 'Métodos de Pago', icon: CreditCard, roles: ['super_admin', 'admin'] },
          { path: '/admin/odontogram', label: 'Odontograma', icon: FileImage },
          { path: '/admin/public-forms', label: 'Formularios Públicos', icon: FileCheck },
          { path: '/admin/settings', label: 'Configuración', icon: Settings },
          { path: '/admin/reports', label: 'Reportes', icon: BarChart },
          { path: '/admin/treatment-audit', label: 'Auditoría de Tratamientos', icon: FileText, roles: ['super_admin'] }
        ]
      }
    ];

    // Super Admin - Add administration section at the beginning
    if (user?.role === 'super_admin') {
      return [
        {
          title: 'ADMINISTRACIÓN',
          items: [
            { path: '/admin/sedes', label: 'Gestión de Sedes', icon: Building2 },
            { path: '/admin/companies', label: 'Empresas', icon: Building2 },
            { path: '/admin/users', label: 'Administradores', icon: Users },
            { path: '/admin/collaborators', label: 'Colaboradores', icon: UserCheck }
          ]
        },
        ...adminSections
      ];
    }

    return adminSections;
  };

  const menuSections = getMenuSections();

  // Flatten for current page title
  const allMenuItems = menuSections.flatMap(section => section.items);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SessionTimeoutProvider>
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Collapsible on all screens */}
      <aside
        className={`
          bg-white shadow-lg flex flex-col h-full overflow-hidden flex-shrink-0 w-[280px] border-r border-gray-200
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src="/mydentLogo.png"
              alt="MyDent Logo"
              className="w-full h-auto max-h-20 object-contain"
            />
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="px-3 space-y-6">
            {menuSections
              .filter((section) => {
                // Filtrar secciones que tienen al menos un item visible para el usuario
                const visibleItems = section.items.filter((item) => {
                  if (item.roles && item.roles.length > 0) {
                    return item.roles.includes(user?.role || '');
                  }
                  return true;
                });
                return visibleItems.length > 0;
              })
              .map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Title */}
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items
                    .filter((item) => {
                      // Si el item tiene roles definidos, verificar que el usuario tenga uno de esos roles
                      if (item.roles && item.roles.length > 0) {
                        return item.roles.includes(user?.role || '');
                      }
                      // Si no tiene roles definidos, mostrar a todos
                      return true;
                    })
                    .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200 group relative
                          ${isActive
                            ? 'bg-cyan-50 text-cyan-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-600 rounded-r-full" />
                        )}

                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-cyan-600' : 'text-gray-500 group-hover:text-gray-700'
                        }`} />
                        <span className="text-sm truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.profile.firstName} {user?.profile.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content - Adjust margin based on sidebar state */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-[280px]' : 'ml-0'
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger button - Visible on all screens */}
              <motion.button
                onClick={toggleSidebar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-300"
                title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>

              <h2 className="text-xl font-semibold text-gray-900">
                {allMenuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.profile.firstName} {user?.profile.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1 capitalize">
                        {user?.role}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setChangePasswordModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Cambiar Contraseña
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />
    </div>
    </SessionTimeoutProvider>
  );
};

export default AdminLayout;