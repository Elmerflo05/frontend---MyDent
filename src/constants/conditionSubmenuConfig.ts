/**
 * Configuración de submenús para condiciones dentales
 * Centraliza la lógica de qué condiciones requieren submenús y cómo manejarlos
 */

export type SubmenuType =
  | 'fracture'
  | 'supernumerary'
  | 'diastema'
  | 'giroversion'
  | 'fusion'
  | 'migracion'
  | 'tratamientoPulpar'
  | 'aparatoFijo'
  | 'aparatoRemovible'
  | 'transposicion'
  | 'protesisFija'
  | 'protesisTotal'
  | 'protesisRemovible'
  | 'edentuloTotal';

export interface SubmenuConfig {
  requiresSubmenu: boolean;
  submenuType: SubmenuType;
  // Indica si la condición requiere selección multi-diente (en lugar de submenú)
  requiresMultiToothSelection?: boolean;
}

/**
 * Mapa de configuración para condiciones que requieren submenús o selecciones multi-diente
 */
export const CONDITION_SUBMENU_CONFIG: Record<string, SubmenuConfig> = {
  'fractura': {
    requiresSubmenu: true,
    submenuType: 'fracture'
  },
  'supernumerario': {
    requiresSubmenu: true,
    submenuType: 'supernumerary'
  },
  'diastema': {
    requiresSubmenu: true,
    submenuType: 'diastema'
  },
  'giroversion': {
    requiresSubmenu: true,
    submenuType: 'giroversion'
  },
  'fusion': {
    requiresSubmenu: true,
    submenuType: 'fusion'
  },
  'migracion': {
    requiresSubmenu: true,
    submenuType: 'migracion'
  },
  'tratamiento-pulpar': {
    requiresSubmenu: true,
    submenuType: 'tratamientoPulpar'
  },
  'aparato-fijo': {
    requiresSubmenu: false,
    submenuType: 'aparatoFijo',
    requiresMultiToothSelection: true
  },
  'aparato-removible': {
    requiresSubmenu: false,
    submenuType: 'aparatoRemovible',
    requiresMultiToothSelection: true
  },
  'transposicion': {
    requiresSubmenu: false,
    submenuType: 'transposicion',
    requiresMultiToothSelection: true
  },
  'protesis-fija': {
    requiresSubmenu: false,
    submenuType: 'protesisFija',
    requiresMultiToothSelection: true
  },
  'protesis-total': {
    requiresSubmenu: false,
    submenuType: 'protesisTotal',
    requiresMultiToothSelection: true
  },
  'protesis-removible': {
    requiresSubmenu: false,
    submenuType: 'protesisRemovible',
    requiresMultiToothSelection: true
  },
  'edentulo-total': {
    requiresSubmenu: false,
    submenuType: 'edentuloTotal',
    requiresMultiToothSelection: true
  }
};
