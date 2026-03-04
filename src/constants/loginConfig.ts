// Configuración de botones de acceso rápido para login (SOLO desarrollo)
// Credenciales del seed.js - contraseña por defecto: 123456

import {
  Shield,
  UserCog,
  Stethoscope,
  UserCheck,
  TestTube,
  User,
  Building2
} from 'lucide-react';

export interface QuickLoginButton {
  id: string;
  email: string;
  password: string;
  role: string;
  displayName: string;
  description: string;
  icon: any;
  colorScheme: {
    bg: string;
    hover: string;
    border: string;
    iconBg: string;
    textPrimary: string;
    textSecondary: string;
  };
  priority: number; // Para ordenar por importancia
}

export const QUICK_LOGIN_BUTTONS: QuickLoginButton[] = [
  {
    id: 'super_admin',
    email: 'admin@mydent.pe',
    password: '123456',
    role: 'super_admin',
    displayName: 'Super Admin',
    description: 'Carlos Mendoza - Todas las sedes',
    icon: Shield,
    colorScheme: {
      bg: 'from-indigo-50 to-indigo-100',
      hover: 'hover:from-indigo-100 hover:to-indigo-150',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-600',
      textPrimary: 'text-indigo-700',
      textSecondary: 'text-indigo-600'
    },
    priority: 1
  },
  {
    id: 'admin',
    email: 'admin.miraflores@mydent.pe',
    password: '123456',
    role: 'admin',
    displayName: 'Admin Sede',
    description: 'Luis Ramírez - Miraflores',
    icon: UserCog,
    colorScheme: {
      bg: 'from-red-50 to-red-100',
      hover: 'hover:from-red-100 hover:to-red-150',
      border: 'border-red-200',
      iconBg: 'bg-red-500',
      textPrimary: 'text-red-700',
      textSecondary: 'text-red-600'
    },
    priority: 2
  },
  {
    id: 'doctor',
    email: 'dr.garcia@mydent.pe',
    password: '123456',
    role: 'doctor',
    displayName: 'Doctor',
    description: 'Jorge García - Miraflores',
    icon: Stethoscope,
    colorScheme: {
      bg: 'from-blue-50 to-blue-100',
      hover: 'hover:from-blue-100 hover:to-blue-150',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      textPrimary: 'text-blue-700',
      textSecondary: 'text-blue-600'
    },
    priority: 3
  },
  {
    id: 'receptionist',
    email: 'recepcion.miraflores@mydent.pe',
    password: '123456',
    role: 'receptionist',
    displayName: 'Recepcionista',
    description: 'Laura Vargas - Miraflores',
    icon: UserCheck,
    colorScheme: {
      bg: 'from-green-50 to-green-100',
      hover: 'hover:from-green-100 hover:to-green-150',
      border: 'border-green-200',
      iconBg: 'bg-green-500',
      textPrimary: 'text-green-700',
      textSecondary: 'text-green-600'
    },
    priority: 4
  },
  {
    id: 'imaging_technician',
    email: 'tecnico.imagen@mydent.pe',
    password: '123456',
    role: 'imaging_technician',
    displayName: 'Téc. Imágenes',
    description: 'Carlos Mendoza - Global',
    icon: TestTube,
    colorScheme: {
      bg: 'from-purple-50 to-purple-100',
      hover: 'hover:from-purple-100 hover:to-purple-150',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500',
      textPrimary: 'text-purple-700',
      textSecondary: 'text-purple-600'
    },
    priority: 5
  },
  {
    id: 'patient',
    email: 'jcperez@gmail.com',
    password: '123456',
    role: 'patient',
    displayName: 'Paciente',
    description: 'Juan Carlos Pérez',
    icon: User,
    colorScheme: {
      bg: 'from-yellow-50 to-yellow-100',
      hover: 'hover:from-yellow-100 hover:to-yellow-150',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-500',
      textPrimary: 'text-yellow-700',
      textSecondary: 'text-yellow-600'
    },
    priority: 6
  },
  {
    id: 'external_client',
    email: 'cliente.externo@dental.com',
    password: '123456',
    role: 'external_client',
    displayName: 'Cliente Externo',
    description: 'Dr. Carlos Rodríguez',
    icon: Building2,
    colorScheme: {
      bg: 'from-gray-50 to-gray-100',
      hover: 'hover:from-gray-100 hover:to-gray-150',
      border: 'border-gray-200',
      iconBg: 'bg-gray-500',
      textPrimary: 'text-gray-700',
      textSecondary: 'text-gray-600'
    },
    priority: 7
  }
];

// Configuración de cuántos botones mostrar por defecto
export const DEFAULT_VISIBLE_BUTTONS = 3;

// Función para obtener botones prioritarios
export const getQuickLoginButtons = (limit?: number): QuickLoginButton[] => {
  const sortedButtons = QUICK_LOGIN_BUTTONS.sort((a, b) => a.priority - b.priority);
  return limit ? sortedButtons.slice(0, limit) : sortedButtons;
};

// Función para obtener todos los botones
export const getAllQuickLoginButtons = (): QuickLoginButton[] => {
  return QUICK_LOGIN_BUTTONS.sort((a, b) => a.priority - b.priority);
};