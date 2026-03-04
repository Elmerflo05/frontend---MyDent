import type { ToothCondition } from '@/store/odontogramStore';

export class PriceCalculator {
  /**
   * Calcula el precio total de un array de condiciones
   */
  static calculateTotal(conditions: ToothCondition[]): number {
    return conditions.reduce((sum, condition) => sum + (condition.price || 0), 0);
  }

  /**
   * Distribuye un nuevo precio total proporcionalmente entre las condiciones
   */
  static distributeProportionally(
    conditions: ToothCondition[],
    newTotal: number
  ): ToothCondition[] {
    const pricedConditions = conditions.filter(c => (c.price || 0) > 0);

    if (pricedConditions.length === 0) {
      return conditions;
    }

    const currentTotal = this.calculateTotal(pricedConditions);

    if (currentTotal === 0) {
      // Si el total actual es 0, distribuir equitativamente
      const pricePerCondition = newTotal / pricedConditions.length;

      return conditions.map(condition => {
        if (pricedConditions.includes(condition)) {
          return { ...condition, price: pricePerCondition };
        }
        return condition;
      });
    } else {
      // Distribuir proporcionalmente según precio actual
      const ratio = newTotal / currentTotal;

      return conditions.map(condition => {
        if (pricedConditions.includes(condition) && condition.price) {
          return { ...condition, price: condition.price * ratio };
        }
        return condition;
      });
    }
  }

  /**
   * Aplica descuento a un precio
   */
  static applyDiscount(price: number, discountPercent: number): number {
    if (discountPercent <= 0 || discountPercent > 100) {
      return price;
    }
    return price * (1 - discountPercent / 100);
  }

  /**
   * Calcula el precio con impuesto
   */
  static applyTax(price: number, taxPercent: number): number {
    return price * (1 + taxPercent / 100);
  }

  /**
   * Obtiene solo las condiciones con precio mayor a 0
   */
  static getPricedConditions(conditions: ToothCondition[]): ToothCondition[] {
    return conditions.filter(c => (c.price || 0) > 0);
  }

  /**
   * Calcula estadísticas de precios de un grupo de condiciones
   */
  static calculatePriceStatistics(conditions: ToothCondition[]) {
    const pricedConditions = this.getPricedConditions(conditions);
    const prices = pricedConditions.map(c => c.price || 0);

    if (prices.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0
      };
    }

    return {
      total: this.calculateTotal(pricedConditions),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: pricedConditions.length
    };
  }

  /**
   * Formatea un precio para mostrar en la UI
   */
  static formatPrice(price: number, currency: string = 'S/'): string {
    return `${currency} ${price.toFixed(2)}`;
  }

  /**
   * Redondea un precio a 2 decimales
   */
  static roundPrice(price: number): number {
    return Math.round(price * 100) / 100;
  }
}
