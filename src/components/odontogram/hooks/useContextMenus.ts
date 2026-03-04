/**
 * HOOK: useContextMenus
 *
 * Gestiona el menú contextual principal y los 7 submenús del odontograma
 *
 * Características:
 * - Gestión unificada de 8 estados (1 menú + 7 submenús)
 * - Cierre automático con ESC o click fuera
 * - Interfaz consistente para abrir/cerrar menús
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

/** Objeto plano con las propiedades de un DOMRect (serializable en React state) */
export interface ToothRectData {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId?: string;
  clickPosition?: { x: number; y: number };
  type?: string;
  /** Posición del diente clickeado (para posicionar popovers) - objeto plano */
  toothRect?: ToothRectData;
}

export interface SubmenuState {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  clickPosition: { x: number; y: number };
}

export interface FractureSubmenuState extends SubmenuState {
  sectionId?: string;
}

export interface TratamientoPulparSubmenuState extends SubmenuState {
  sectionId?: string;
  state: 'good' | 'bad';
}

export interface UseContextMenusReturn {
  // Estados
  contextMenu: ContextMenuState | null;
  fractureSubmenu: FractureSubmenuState | null;
  supernumerarySubmenu: SubmenuState | null;
  diastemaSubmenu: SubmenuState | null;
  giroversionSubmenu: SubmenuState | null;
  fusionSubmenu: SubmenuState | null;
  migracionSubmenu: SubmenuState | null;
  tratamientoPulparSubmenu: TratamientoPulparSubmenuState | null;

  // Handlers
  setContextMenu: (menu: ContextMenuState | null) => void;
  setFractureSubmenu: (submenu: FractureSubmenuState | null) => void;
  setSupernumerarySubmenu: (submenu: SubmenuState | null) => void;
  setDiastemaSubmenu: (submenu: SubmenuState | null) => void;
  setGiroversionSubmenu: (submenu: SubmenuState | null) => void;
  setFusionSubmenu: (submenu: SubmenuState | null) => void;
  setMigracionSubmenu: (submenu: SubmenuState | null) => void;
  setTratamientoPulparSubmenu: (submenu: TratamientoPulparSubmenuState | null) => void;

  // Utilidades
  closeAllMenus: () => void;
  hasAnyMenuOpen: () => boolean;
}

/**
 * Hook para gestión de menús contextuales del odontograma
 *
 * Maneja el menú principal y los 7 submenús con cierre automático
 * al presionar ESC o hacer click fuera
 *
 * @returns Estados y handlers para todos los menús
 *
 * @example
 * ```tsx
 * const {
 *   contextMenu,
 *   setContextMenu,
 *   fractureSubmenu,
 *   setFractureSubmenu,
 *   closeAllMenus
 * } = useContextMenus();
 *
 * // Abrir menú contextual
 * const handleToothClick = (toothNumber: string, x: number, y: number) => {
 *   setContextMenu({
 *     visible: true,
 *     x,
 *     y,
 *     toothNumber,
 *     type: 'tooth'
 *   });
 * };
 *
 * // Abrir submenu de fractura desde el menú principal
 * const handleFractureSelect = () => {
 *   if (!contextMenu) return;
 *
 *   setFractureSubmenu({
 *     visible: true,
 *     x: contextMenu.x,
 *     y: contextMenu.y,
 *     toothNumber: contextMenu.toothNumber,
 *     sectionId: contextMenu.sectionId,
 *     clickPosition: contextMenu.clickPosition || { x: 0, y: 0 }
 *   });
 *   setContextMenu(null);
 * };
 * ```
 */
export const useContextMenus = (): UseContextMenusReturn => {
  // ============================================================================
  // ESTADOS DE MENÚS
  // ============================================================================

  // Menú contextual principal
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // 7 submenús especializados
  const [fractureSubmenu, setFractureSubmenu] = useState<FractureSubmenuState | null>(null);
  const [supernumerarySubmenu, setSupernumerarySubmenu] = useState<SubmenuState | null>(null);
  const [diastemaSubmenu, setDiastemaSubmenu] = useState<SubmenuState | null>(null);
  const [giroversionSubmenu, setGiroversionSubmenu] = useState<SubmenuState | null>(null);
  const [fusionSubmenu, setFusionSubmenu] = useState<SubmenuState | null>(null);
  const [migracionSubmenu, setMigracionSubmenu] = useState<SubmenuState | null>(null);
  const [tratamientoPulparSubmenu, setTratamientoPulparSubmenu] =
    useState<TratamientoPulparSubmenuState | null>(null);

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Cierra todos los menús y submenús
   */
  const closeAllMenus = (): void => {
    setContextMenu(null);
    setFractureSubmenu(null);
    setSupernumerarySubmenu(null);
    setDiastemaSubmenu(null);
    setGiroversionSubmenu(null);
    setFusionSubmenu(null);
    setMigracionSubmenu(null);
    setTratamientoPulparSubmenu(null);
    logger.db('Todos los menús cerrados', 'ui', {});
  };

  /**
   * Verifica si hay algún menú abierto
   */
  const hasAnyMenuOpen = (): boolean => {
    return !!(
      contextMenu?.visible ||
      fractureSubmenu?.visible ||
      supernumerarySubmenu?.visible ||
      diastemaSubmenu?.visible ||
      giroversionSubmenu?.visible ||
      fusionSubmenu?.visible ||
      migracionSubmenu?.visible ||
      tratamientoPulparSubmenu?.visible
    );
  };

  // ============================================================================
  // EFFECTS - Cierre con ESC y click fuera
  // ============================================================================

  /**
   * Effect para cerrar menús con ESC o click fuera
   * Se sincroniza con el estado del menú contextual principal
   */
  useEffect(() => {
    // Handler para ESC
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && contextMenu?.visible) {
        setContextMenu(null);
        logger.db('Menú cerrado con ESC', 'ui', {});
      }
    };

    // Handler para click fuera
    const handleClickOutside = (e: MouseEvent): void => {
      if (contextMenu?.visible) {
        const target = e.target as HTMLElement;

        // No cerrar si el click fue dentro del menú o submenús
        if (
          !target.closest('.treatment-mode-menu') &&
          !target.closest('.official-conditions-menu') &&
          !target.closest('.condition-submenu')
        ) {
          setContextMenu(null);
          logger.db('Menú cerrado por click fuera', 'ui', {});
        }
      }
    };

    // Agregar listeners si el menú está visible
    if (contextMenu?.visible) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Estados
    contextMenu,
    fractureSubmenu,
    supernumerarySubmenu,
    diastemaSubmenu,
    giroversionSubmenu,
    fusionSubmenu,
    migracionSubmenu,
    tratamientoPulparSubmenu,

    // Handlers (setters)
    setContextMenu,
    setFractureSubmenu,
    setSupernumerarySubmenu,
    setDiastemaSubmenu,
    setGiroversionSubmenu,
    setFusionSubmenu,
    setMigracionSubmenu,
    setTratamientoPulparSubmenu,

    // Utilidades
    closeAllMenus,
    hasAnyMenuOpen
  };
};
