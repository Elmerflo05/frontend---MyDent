import { useState } from 'react';
import type { ToothCondition } from '@/store/odontogramStore';

interface HoverPriceModal {
  visible: boolean;
  toothNumber: string;
  x: number;
  y: number;
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  toothNumber: string;
  sectionId: string;
}

interface EditConditionModal {
  visible: boolean;
  toothNumber: string;
  sectionId: string;
  conditions: ToothCondition[];
}

interface PriceConfirmModal {
  visible: boolean;
  conditionId: string;
  conditionLabel: string;
  defaultPrice: number;
  toothNumber: string;
  sectionId: string;
}

interface CustomConditionModal {
  visible: boolean;
  toothNumber: string;
  sectionId: string;
}

interface NewCustomCondition {
  label: string;
  description: string;
  color: string;
  price: number;
}

export const useOdontogramState = (visualSettings: any) => {
  const [patientConditions, setPatientConditions] = useState<ToothCondition[]>([]);
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(visualSettings.showToothNumbers);
  const [showRoots, setShowRoots] = useState(true);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [hoverPriceModal, setHoverPriceModal] = useState<HoverPriceModal | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editConditionModal, setEditConditionModal] = useState<EditConditionModal | null>(null);
  const [priceConfirmModal, setPriceConfirmModal] = useState<PriceConfirmModal | null>(null);
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [customConditionModal, setCustomConditionModal] = useState<CustomConditionModal | null>(null);
  const [newCustomCondition, setNewCustomCondition] = useState<NewCustomCondition>({
    label: '',
    description: '',
    color: '#3B82F6',
    price: 0
  });

  return {
    patientConditions,
    setPatientConditions,
    hoveredTooth,
    setHoveredTooth,
    showLabels,
    setShowLabels,
    showRoots,
    setShowRoots,
    showServicesModal,
    setShowServicesModal,
    hoverPriceModal,
    setHoverPriceModal,
    contextMenu,
    setContextMenu,
    editConditionModal,
    setEditConditionModal,
    priceConfirmModal,
    setPriceConfirmModal,
    editablePrice,
    setEditablePrice,
    customConditionModal,
    setCustomConditionModal,
    newCustomCondition,
    setNewCustomCondition
  };
};

export type {
  HoverPriceModal,
  ContextMenu,
  EditConditionModal,
  PriceConfirmModal,
  CustomConditionModal,
  NewCustomCondition
};
