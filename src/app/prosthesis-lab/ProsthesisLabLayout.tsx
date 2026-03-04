import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ClipboardList,
  TrendingUp,
  Settings,
  LogOut,
  User,
  ChevronDown,
  TestTube2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import NotificationBell from '@/components/notifications/NotificationBell';
import { SessionTimeoutProvider } from '@/components/common/SessionTimeoutProvider';

const ProsthesisLabLayout = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Tema específico para laboratorio de prótesis (verde dental)
  const colors = {
    primary: 'emerald-600',
    primaryDark: 'emerald-700',
    primaryLight: 'emerald-50',
    primaryText: 'emerald-700',
    primaryBg: 'emerald-600',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-700',
    iconBg: 'emerald-100',
    iconText: 'emerald-600'
  };

  const menuItems = [
    {
      path: '/prosthesis-lab/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/prosthesis-lab/requests',
      label: 'Solicitudes',
      icon: ClipboardList,
      roles: ['super_admin', 'admin', 'doctor', 'receptionist', 'prosthesis_technician']
    },
    {
      path: '/prosthesis-lab/processing',
      label: 'En Proceso',
      icon: TestTube2,
      roles: ['super_admin', 'admin', 'prosthesis_technician']
    },
    {
      path: '/prosthesis-lab/reception',
      label: 'Recepción',
      icon: Package,
      roles: ['super_admin', 'admin', 'receptionist']
    },
    {
      path: '/prosthesis-lab/completed',
      label: 'Completados',
      icon: CheckCircle,
      roles: ['super_admin', 'admin', 'doctor', 'receptionist', 'prosthesis_technician']
    },
    {
      path: '/prosthesis-lab/analytics',
      label: 'Análisis',
      icon: TrendingUp,
      roles: ['super_admin', 'admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || '')
  );

  const handleLogout = async () => {
    await logout();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <SessionTimeoutProvider>
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          transition: { duration: 0.3, ease: 'easeInOut' }
        }}
        className={`bg-white shadow-xl flex flex-col border-r border-gray-200 relative z-40`}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              initial={false}
              animate={{
                opacity: sidebarOpen ? 1 : 0,
                transition: { duration: 0.2 }
              }}
            >
              <div className={`p-2 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} rounded-lg`}>
                <TestTube2 className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Lab Prótesis</h1>
                  <p className="text-sm text-gray-500">Sistema de Gestión</p>
                </div>
              )}
            </motion.div>

            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-3 py-3 rounded-lg transition-colors group
                  ${isActive
                    ? `bg-${colors.primary} text-white shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-white" />
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.role === 'prosthesis_technician' ? 'Técnico Prótesis' :
                       user?.role === 'receptionist' ? 'Recepcionista' :
                       user?.role === 'doctor' ? 'Doctor' :
                       user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Laboratorio de Prótesis Dental
                </h2>
                <p className="text-sm text-gray-500">
                  Gestión integral de solicitudes protésicas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />

              {/* Time indicator */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleString('es-ES')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-30"
          onClick={() => toggleSidebar()}
        />
      )}
    </div>
    </SessionTimeoutProvider>
  );
};

export default ProsthesisLabLayout;