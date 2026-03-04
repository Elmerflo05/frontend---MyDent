import { useCallback } from 'react';
import type { Odontogram } from '../classes';
import type { ToothCondition } from '@/store/odontogramStore';

interface UseOdontogramInteractionsProps {
  odontogram: Odontogram | null;
  dentalConditions: any[];
  customConditions: any[];
  setContextMenu: (menu: any) => void;
  setPriceConfirmModal: (modal: any) => void;
  setHoverPriceModal: (modal: any) => void;
  setEditConditionModal: (modal: any) => void;
  onAddCondition: (toothNumber: string, condition: ToothCondition) => void;
}

export const useOdontogramInteractions = ({
  odontogram,
  dentalConditions,
  customConditions,
  setContextMenu,
  setPriceConfirmModal,
  setHoverPriceModal,
  setEditConditionModal,
  onAddCondition
}: UseOdontogramInteractionsProps) => {

  // Manejar click en sección de diente
  const handleToothSectionClick = useCallback((
    event: React.MouseEvent,
    toothNumber: string,
    sectionId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!odontogram) return;

    const tooth = odontogram.getTooth(toothNumber);
    if (!tooth) return;

    const existingConditions = tooth.getConditionsBySection(sectionId);

    if (existingConditions.length > 1) {
      // Múltiples condiciones: abrir modal de edición
      setEditConditionModal({
        visible: true,
        toothNumber,
        sectionId,
        conditions: existingConditions
      });
    } else if (existingConditions.length === 1) {
      // Una condición: mostrar menú contextual con opción de quitar
      const rect = (event.target as Element).getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        toothNumber,
        sectionId
      });
    } else {
      // Sin condiciones: mostrar menú contextual para agregar
      const rect = (event.target as Element).getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        toothNumber,
        sectionId
      });
    }
  }, [odontogram, setContextMenu, setEditConditionModal]);

  // Manejar hover sobre diente
  const handleToothHover = useCallback((
    event: React.MouseEvent,
    toothNumber: string
  ) => {
    if (!odontogram) return;

    const tooth = odontogram.getTooth(toothNumber);
    if (!tooth || !tooth.hasPricedConditions()) return;

    const rect = (event.currentTarget as Element).getBoundingClientRect();
    setHoverPriceModal({
      visible: true,
      toothNumber,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  }, [odontogram, setHoverPriceModal]);

  // Manejar cuando el mouse sale del diente
  const handleToothHoverLeave = useCallback(() => {
    setHoverPriceModal(null);
  }, [setHoverPriceModal]);

  // Manejar selección de condición desde el menú contextual
  const handleConditionSelect = useCallback((
    conditionId: string,
    toothNumber: string,
    sectionId: string
  ) => {
    if (!odontogram) return;

    const allConditions = [...dentalConditions, ...customConditions];
    const selectedCondition = allConditions.find(c => c.id === conditionId);

    if (!selectedCondition) return;

    // Si tiene precio, mostrar modal de confirmación
    if (selectedCondition.price && selectedCondition.price > 0) {
      setPriceConfirmModal({
        visible: true,
        conditionId,
        conditionLabel: selectedCondition.label,
        defaultPrice: selectedCondition.price,
        toothNumber,
        sectionId
      });
    } else {
      // Sin precio, agregar directamente
      const newCondition: ToothCondition = {
        toothNumber,
        sectionId,
        condition: conditionId,
        color: selectedCondition.color,
        patientId: odontogram.patientId,
        date: new Date(),
        price: 0
      };

      onAddCondition(toothNumber, newCondition);
    }

    // Cerrar menú contextual
    setContextMenu(null);
  }, [odontogram, dentalConditions, customConditions, setPriceConfirmModal, setContextMenu, onAddCondition]);

  // Confirmar precio y aplicar condición
  const handleConfirmPrice = useCallback((
    conditionId: string,
    toothNumber: string,
    sectionId: string,
    price: number
  ) => {
    if (!odontogram) return;

    const allConditions = [...dentalConditions, ...customConditions];
    const selectedCondition = allConditions.find(c => c.id === conditionId);

    if (!selectedCondition) return;

    const newCondition: ToothCondition = {
      toothNumber,
      sectionId,
      condition: conditionId,
      color: selectedCondition.color,
      patientId: odontogram.patientId,
      date: new Date(),
      price
    };

    onAddCondition(toothNumber, newCondition);
    setPriceConfirmModal(null);
  }, [odontogram, dentalConditions, customConditions, onAddCondition, setPriceConfirmModal]);

  // Cerrar menú contextual
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, [setContextMenu]);

  return {
    handleToothSectionClick,
    handleToothHover,
    handleToothHoverLeave,
    handleConditionSelect,
    handleConfirmPrice,
    handleCloseContextMenu
  };
};
