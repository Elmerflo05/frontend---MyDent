/**
 * Utilidades para manejo seguro de fechas sin problemas de timezone
 *
 * PROBLEMA RESUELTO:
 * PostgreSQL almacena fechas tipo DATE que se devuelven como ISO strings UTC (ej: "2026-01-07T05:00:00.000Z")
 * Al usar new Date(string), JavaScript puede interpretar incorrectamente la zona horaria,
 * causando que las fechas se muestren un día antes.
 *
 * SOLUCION:
 * Usar el constructor new Date(year, month, day, hours, minutes) que siempre
 * crea fechas en la zona horaria local del cliente.
 */

/**
 * Parsea una fecha ISO string a un objeto Date en zona horaria local
 * Evita el problema de desfase de un día causado por interpretación UTC
 *
 * @param isoDateString - Fecha en formato ISO (ej: "2026-01-07T05:00:00.000Z" o "2026-01-07")
 * @param timeString - Hora opcional en formato "HH:MM" o "HH:MM:SS" (default: "00:00")
 * @returns Date object en zona horaria local
 *
 * @example
 * // Backend envía: "2026-01-07T05:00:00.000Z"
 * const date = parseLocalDate("2026-01-07T05:00:00.000Z", "10:00");
 * // Resultado: 7 de enero 2026 a las 10:00 hora local
 */
export function parseLocalDate(isoDateString: string | Date | null | undefined, timeString?: string): Date {
  if (!isoDateString) {
    return new Date();
  }

  // Si es un objeto Date, convertirlo a string ISO primero
  const dateStr = isoDateString instanceof Date
    ? isoDateString.toISOString()
    : String(isoDateString);

  // Extraer solo la parte de la fecha (YYYY-MM-DD)
  const dateOnly = dateStr.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);

  // Parsear la hora (HH:MM o HH:MM:SS)
  const timeParts = (timeString || '00:00').split(':').map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;

  // Crear fecha en zona horaria LOCAL (mes es 0-indexed)
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Formatea una fecha a string YYYY-MM-DD sin problemas de timezone
 *
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 *
 * @example
 * const dateStr = formatDateToYMD(new Date(2026, 0, 7)); // "2026-01-07"
 */
export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compara dos fechas por solo la parte de fecha (ignorando hora)
 *
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns true si ambas fechas son el mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Obtiene el inicio del día (medianoche) para una fecha
 *
 * @param date - Fecha de entrada
 * @returns Nueva fecha con hora 00:00:00.000
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Obtiene el fin del día (23:59:59.999) para una fecha
 *
 * @param date - Fecha de entrada
 * @returns Nueva fecha con hora 23:59:59.999
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

// ============================================================================
// MANEJO DE TIMESTAMPS CON ZONA HORARIA (TIMESTAMPTZ)
// ============================================================================

/**
 * Zona horaria por defecto del sistema (Perú)
 */
const DEFAULT_TIMEZONE = 'America/Lima';

/**
 * Detecta si un string de fecha es solo DATE (sin hora) o TIMESTAMP (con hora)
 * Fechas DATE: "2026-01-12" o "2026-01-12T00:00:00" (sin Z o offset)
 * Fechas TIMESTAMP: "2026-01-12T13:26:00.000Z" o "2026-01-12T08:26:00-05:00"
 */
function isDateOnly(dateString: string): boolean {
  // Si no tiene 'T', es solo fecha
  if (!dateString.includes('T')) return true;

  // Si tiene 'T' pero termina en T00:00:00 sin Z ni offset, es DATE
  const hasTimezone = dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString);
  return !hasTimezone;
}

/**
 * Formatea una fecha/timestamp a string legible
 *
 * IMPORTANTE: Esta función maneja DOS tipos de datos de PostgreSQL:
 *
 * 1. DATE (solo fecha, ej: "2026-01-12"):
 *    - Se formatea SIN conversión de zona horaria
 *    - La fecha se muestra tal cual está en la BD
 *
 * 2. TIMESTAMPTZ (fecha+hora con zona, ej: "2026-01-17T13:26:00.000Z"):
 *    - Se convierte a zona horaria Lima antes de formatear
 *    - Garantiza consistencia entre local y Railway
 *
 * @param isoTimestamp - Fecha o timestamp del backend
 * @param format - Formato de salida: 'datetime' | 'date' | 'time'
 * @returns String formateado
 *
 * @example
 * // DATE de PostgreSQL - sin conversión de timezone
 * formatTimestampToLima("2026-01-12", 'date')           // "12/01/2026"
 *
 * // TIMESTAMPTZ de PostgreSQL - con conversión a Lima
 * formatTimestampToLima("2026-01-17T13:26:00.000Z", 'datetime') // "17/01/2026 08:26"
 */
export function formatTimestampToLima(
  isoTimestamp: string | null | undefined,
  format: 'datetime' | 'date' | 'time' = 'datetime'
): string {
  if (!isoTimestamp) return '-';

  try {
    // Detectar si es solo DATE (sin hora/timezone) o TIMESTAMP con zona horaria
    const dateOnly = isDateOnly(isoTimestamp);

    let date: Date;

    if (dateOnly) {
      // Para fechas DATE: parsear sin conversión UTC
      // Esto evita el problema de desfase de un día
      const datePart = isoTimestamp.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de DST
    } else {
      // Para TIMESTAMP con zona horaria: usar new Date() que parsea correctamente
      date = new Date(isoTimestamp);
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return '-';

    // Para DATE, no aplicamos timeZone porque ya está en hora local
    // Para TIMESTAMP, aplicamos timeZone Lima para conversión correcta
    const options: Intl.DateTimeFormatOptions = dateOnly ? {} : { timeZone: DEFAULT_TIMEZONE };

    switch (format) {
      case 'date':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
        break;
      case 'datetime':
      default:
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
        break;
    }

    return date.toLocaleString('es-PE', options);
  } catch {
    return '-';
  }
}

/**
 * Obtiene la fecha/hora actual en zona horaria Lima como string ISO
 * Útil para enviar al backend con la hora correcta del cliente
 *
 * @returns String ISO de la fecha/hora actual
 */
export function getCurrentTimestampLima(): string {
  return new Date().toISOString();
}

/**
 * Formatea una fecha DATE de PostgreSQL con formato largo (incluye día de la semana)
 * Diseñado específicamente para fechas tipo DATE que NO deben tener conversión de timezone
 *
 * @param dateString - Fecha del backend (ej: "2026-01-12")
 * @param includeWeekday - Si incluir el día de la semana
 * @returns String formateado (ej: "domingo, 12 de enero de 2026" o "12 de enero de 2026")
 *
 * @example
 * formatDateLong("2026-01-12", true)  // "domingo, 12 de enero de 2026"
 * formatDateLong("2026-01-12", false) // "12 de enero de 2026"
 */
export function formatDateLong(
  dateString: string | null | undefined,
  includeWeekday: boolean = true
): string {
  if (!dateString) return '-';

  try {
    // Parsear la fecha sin conversión UTC
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    // Crear fecha en hora local (mediodía para evitar problemas de DST)
    const date = new Date(year, month - 1, day, 12, 0, 0);

    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };

    if (includeWeekday) {
      options.weekday = 'long';
    }

    return date.toLocaleDateString('es-PE', options);
  } catch {
    return '-';
  }
}
