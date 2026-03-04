import type { ToothCondition } from '@/store/odontogramStore';

export type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

export interface ToothPosition {
  x: number;
  y: number;
}

export class Tooth {
  public readonly number: string;
  public readonly type: ToothType;
  public readonly position: ToothPosition;
  private conditions: ToothCondition[];

  constructor(number: string, type: ToothType, position: ToothPosition, conditions: ToothCondition[] = []) {
    this.number = number;
    this.type = type;
    this.position = position;
    this.conditions = conditions;
  }

  // Gestión de condiciones
  addCondition(condition: ToothCondition): void {
    // Verificar si ya existe una condición en esa sección
    const existingIndex = this.conditions.findIndex(
      c => c.sectionId === condition.sectionId && c.condition === condition.condition
    );

    if (existingIndex >= 0) {
      // Reemplazar condición existente
      this.conditions[existingIndex] = condition;
    } else {
      // Agregar nueva condición
      this.conditions.push(condition);
    }
  }

  removeCondition(sectionId: string, conditionId?: string): void {
    if (conditionId) {
      this.conditions = this.conditions.filter(
        c => !(c.sectionId === sectionId && c.condition === conditionId)
      );
    } else {
      // Remover todas las condiciones de esa sección
      this.conditions = this.conditions.filter(c => c.sectionId !== sectionId);
    }
  }

  removeAllConditions(): void {
    this.conditions = [];
  }

  getConditions(): ToothCondition[] {
    return [...this.conditions];
  }

  getConditionsBySection(sectionId: string): ToothCondition[] {
    return this.conditions.filter(c => c.sectionId === sectionId);
  }

  hasConditions(): boolean {
    return this.conditions.length > 0;
  }

  hasConditionInSection(sectionId: string): boolean {
    return this.conditions.some(c => c.sectionId === sectionId);
  }

  // Gestión de precios
  getTotalPrice(): number {
    return this.conditions.reduce((sum, c) => sum + (c.price || 0), 0);
  }

  getPricedConditions(): ToothCondition[] {
    return this.conditions.filter(c => (c.price || 0) > 0);
  }

  hasPricedConditions(): boolean {
    return this.getPricedConditions().length > 0;
  }

  updatePriceProportionally(newTotal: number): void {
    const pricedConditions = this.getPricedConditions();

    if (pricedConditions.length === 0) return;

    const currentTotal = this.getTotalPrice();

    if (currentTotal === 0) {
      // Distribuir equitativamente
      const pricePerCondition = newTotal / pricedConditions.length;
      pricedConditions.forEach(condition => {
        condition.price = pricePerCondition;
      });
    } else {
      // Distribuir proporcionalmente según precio actual
      const ratio = newTotal / currentTotal;
      pricedConditions.forEach(condition => {
        if (condition.price) {
          condition.price = condition.price * ratio;
        }
      });
    }
  }

  updateConditionPrice(sectionId: string, conditionId: string, price: number): void {
    const condition = this.conditions.find(
      c => c.sectionId === sectionId && c.condition === conditionId
    );

    if (condition) {
      condition.price = price;
    }
  }

  // Obtener color de una sección
  getSectionColor(sectionId: string, dentalConditions: any[], customConditions: any[]): string {
    const condition = this.conditions.find(c => c.sectionId === sectionId);

    if (!condition) return '#ffffff';

    // Buscar el color en las condiciones configuradas
    const allConditions = [...dentalConditions, ...customConditions];
    const conditionConfig = allConditions.find(c => c.id === condition.condition);

    return conditionConfig?.color || condition.color || '#ffffff';
  }

  // Verificar si es diente superior
  isUpper(): boolean {
    return parseInt(this.number) < 30;
  }

  // Obtener cuadrante (1, 2, 3, 4)
  getQuadrant(): number {
    const num = parseInt(this.number);
    if (num >= 11 && num <= 18) return 1;
    if (num >= 21 && num <= 28) return 2;
    if (num >= 31 && num <= 38) return 3;
    if (num >= 41 && num <= 48) return 4;
    return 0;
  }

  // Clonar diente
  clone(): Tooth {
    return new Tooth(
      this.number,
      this.type,
      { ...this.position },
      this.conditions.map(c => ({ ...c }))
    );
  }

  // Serializar para almacenamiento
  toJSON() {
    return {
      number: this.number,
      type: this.type,
      position: this.position,
      conditions: this.conditions
    };
  }

  // Crear desde JSON
  static fromJSON(data: any): Tooth {
    return new Tooth(
      data.number,
      data.type,
      data.position,
      data.conditions || []
    );
  }
}
