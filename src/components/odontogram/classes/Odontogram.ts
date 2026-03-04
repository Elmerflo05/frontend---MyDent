import { Tooth, type ToothType, type ToothPosition } from './Tooth';
import { PriceCalculator } from './PriceCalculator';
import type { ToothCondition } from '@/store/odontogramStore';

export interface OdontogramStatistics {
  totalTeeth: number;
  healthyTeeth: number;
  treatedTeeth: number;
  missingTeeth: number;
  teethWithConditions: number;
  totalBudget: number;
}

export class Odontogram {
  private teeth: Map<string, Tooth>;
  public readonly patientId: string;

  constructor(patientId: string) {
    this.patientId = patientId;
    this.teeth = new Map();
    this.initializeTeeth();
  }

  // Inicializar los 32 dientes permanentes
  private initializeTeeth(): void {
    const teethData: Array<{ number: string; type: ToothType; position: ToothPosition }> = [
      // Upper Right Quadrant (1)
      { number: '18', type: 'molar', position: { x: 150, y: 270 } },
      { number: '17', type: 'molar', position: { x: 250, y: 245 } },
      { number: '16', type: 'molar', position: { x: 350, y: 225 } },
      { number: '15', type: 'premolar', position: { x: 450, y: 210 } },
      { number: '14', type: 'premolar', position: { x: 550, y: 200 } },
      { number: '13', type: 'canine', position: { x: 650, y: 195 } },
      { number: '12', type: 'incisor', position: { x: 750, y: 193 } },
      { number: '11', type: 'incisor', position: { x: 850, y: 192 } },
      // Upper Left Quadrant (2)
      { number: '21', type: 'incisor', position: { x: 950, y: 192 } },
      { number: '22', type: 'incisor', position: { x: 1050, y: 193 } },
      { number: '23', type: 'canine', position: { x: 1150, y: 195 } },
      { number: '24', type: 'premolar', position: { x: 1250, y: 200 } },
      { number: '25', type: 'premolar', position: { x: 1350, y: 210 } },
      { number: '26', type: 'molar', position: { x: 1450, y: 225 } },
      { number: '27', type: 'molar', position: { x: 1550, y: 245 } },
      { number: '28', type: 'molar', position: { x: 1650, y: 270 } },
      // Lower Left Quadrant (3)
      { number: '38', type: 'molar', position: { x: 1650, y: 430 } },
      { number: '37', type: 'molar', position: { x: 1550, y: 455 } },
      { number: '36', type: 'molar', position: { x: 1450, y: 475 } },
      { number: '35', type: 'premolar', position: { x: 1350, y: 490 } },
      { number: '34', type: 'premolar', position: { x: 1250, y: 500 } },
      { number: '33', type: 'canine', position: { x: 1150, y: 505 } },
      { number: '32', type: 'incisor', position: { x: 1050, y: 507 } },
      { number: '31', type: 'incisor', position: { x: 950, y: 508 } },
      // Lower Right Quadrant (4)
      { number: '41', type: 'incisor', position: { x: 850, y: 508 } },
      { number: '42', type: 'incisor', position: { x: 750, y: 507 } },
      { number: '43', type: 'canine', position: { x: 650, y: 505 } },
      { number: '44', type: 'premolar', position: { x: 550, y: 500 } },
      { number: '45', type: 'premolar', position: { x: 450, y: 490 } },
      { number: '46', type: 'molar', position: { x: 350, y: 475 } },
      { number: '47', type: 'molar', position: { x: 250, y: 455 } },
      { number: '48', type: 'molar', position: { x: 150, y: 430 } }
    ];

    teethData.forEach(data => {
      const tooth = new Tooth(data.number, data.type, data.position);
      this.teeth.set(data.number, tooth);
    });
  }

  // Obtener un diente por su número
  getTooth(toothNumber: string): Tooth | undefined {
    return this.teeth.get(toothNumber);
  }

  // Obtener todos los dientes
  getAllTeeth(): Tooth[] {
    return Array.from(this.teeth.values());
  }

  // Obtener números de todos los dientes
  getToothNumbers(): string[] {
    return Array.from(this.teeth.keys());
  }

  // Agregar condición a un diente
  addCondition(toothNumber: string, condition: ToothCondition): void {
    const tooth = this.getTooth(toothNumber);
    if (tooth) {
      tooth.addCondition(condition);
    }
  }

  // Remover condición de un diente
  removeCondition(toothNumber: string, sectionId: string, conditionId?: string): void {
    const tooth = this.getTooth(toothNumber);
    if (tooth) {
      tooth.removeCondition(sectionId, conditionId);
    }
  }

  // Actualizar precio de condición
  updateConditionPrice(toothNumber: string, sectionId: string, conditionId: string, price: number): void {
    const tooth = this.getTooth(toothNumber);
    if (tooth) {
      tooth.updateConditionPrice(sectionId, conditionId, price);
    }
  }

  // Actualizar precio total de un diente (distribución proporcional)
  updateToothTotalPrice(toothNumber: string, newTotal: number): void {
    const tooth = this.getTooth(toothNumber);
    if (tooth) {
      tooth.updatePriceProportionally(newTotal);
    }
  }

  // Obtener todas las condiciones del odontograma
  getAllConditions(): ToothCondition[] {
    const allConditions: ToothCondition[] = [];

    this.teeth.forEach(tooth => {
      allConditions.push(...tooth.getConditions());
    });

    return allConditions;
  }

  // Cargar condiciones desde un array (desde store)
  loadConditions(conditions: ToothCondition[]): void {
    // Limpiar condiciones existentes
    this.teeth.forEach(tooth => tooth.removeAllConditions());

    // Agregar nuevas condiciones
    conditions.forEach(condition => {
      this.addCondition(condition.toothNumber, condition);
    });
  }

  // Limpiar todas las condiciones
  clearAllConditions(): void {
    this.teeth.forEach(tooth => tooth.removeAllConditions());
  }

  // Calcular presupuesto total
  getTotalBudget(): number {
    return PriceCalculator.calculateTotal(this.getAllConditions());
  }

  // Obtener estadísticas del odontograma
  getStatistics(): OdontogramStatistics {
    const allConditions = this.getAllConditions();
    const teethWithConditions = new Set(allConditions.map(c => c.toothNumber));

    // Contar dientes según condiciones específicas
    const missingTeethConditions = allConditions.filter(c =>
      c.condition === 'ausente' || c.condition === 'missing'
    );
    const missingTeethSet = new Set(missingTeethConditions.map(c => c.toothNumber));

    const treatedTeethConditions = allConditions.filter(c =>
      c.condition === 'obturado' || c.condition === 'corona' || c.condition === 'endodoncia'
    );
    const treatedTeethSet = new Set(treatedTeethConditions.map(c => c.toothNumber));

    return {
      totalTeeth: 32,
      healthyTeeth: 32 - teethWithConditions.size,
      treatedTeeth: treatedTeethSet.size,
      missingTeeth: missingTeethSet.size,
      teethWithConditions: teethWithConditions.size,
      totalBudget: this.getTotalBudget()
    };
  }

  // Exportar odontograma a JSON
  export(): string {
    const data = {
      patientId: this.patientId,
      conditions: this.getAllConditions(),
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  // Importar odontograma desde JSON
  import(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);

      if (!data.conditions || !Array.isArray(data.conditions)) {
        return false;
      }

      this.loadConditions(data.conditions);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Clonar odontograma
  clone(): Odontogram {
    const newOdontogram = new Odontogram(this.patientId);
    newOdontogram.loadConditions(this.getAllConditions());
    return newOdontogram;
  }
}
