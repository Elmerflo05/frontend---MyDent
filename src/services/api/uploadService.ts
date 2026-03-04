/**
 * Servicio de Upload de Archivos
 * Maneja la subida de archivos al backend
 */

import { ApiResponse } from './httpClient';

// Obtener la URL base de la API desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4015/api';

// Clave del token en localStorage (debe ser la misma que httpClient)
const TOKEN_KEY = 'dental_clinic_token';

/**
 * Obtener token de localStorage
 */
const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error al obtener token de localStorage:', error);
    return null;
  }
};

/**
 * Interfaz para la respuesta del upload de voucher
 */
export interface UploadVoucherResponse extends ApiResponse {
  data?: {
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * Subir un archivo de voucher de pago
 *
 * @param file - Archivo a subir (File object)
 * @returns Promesa con la respuesta del servidor incluyendo la ruta del archivo
 * @throws Error si falla la subida o no hay token de autenticación
 */
export const uploadVoucher = async (file: File): Promise<UploadVoucherResponse> => {
  try {
    console.log('📤 [UPLOAD] Iniciando upload de voucher:', file.name);

    // Obtener el token de autenticación
    const token = getToken();

    console.log('🔑 [UPLOAD] Token presente:', token ? 'Sí' : 'No');

    if (!token) {
      console.error('❌ [UPLOAD] No se encontró token en localStorage');
      console.error('🔍 [UPLOAD] Contenido de localStorage:', Object.keys(localStorage));
      throw new Error('No se encontró token de autenticación. Por favor inicia sesión nuevamente.');
    }

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('voucher', file);

    // Realizar la petición
    const response = await fetch(`${API_BASE_URL}/uploads/voucher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // NO incluir 'Content-Type' - el navegador lo establece automáticamente con el boundary
      },
      body: formData
    });

    // Parsear la respuesta
    const data: UploadVoucherResponse = await response.json();

    // Verificar si la respuesta fue exitosa
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al subir el voucher');
    }

    return data;
  } catch (error: any) {
    console.error('Error al subir voucher:', error);
    throw new Error(error.message || 'Error al subir el archivo. Por favor intenta nuevamente.');
  }
};

/**
 * Eliminar un archivo de voucher
 *
 * @param filename - Nombre del archivo a eliminar
 * @returns Promesa con la respuesta del servidor
 * @throws Error si falla la eliminación
 */
export const deleteVoucher = async (filename: string): Promise<ApiResponse> => {
  try {
    // Obtener el token de autenticación
    const token = localStorage.getItem('dental_clinic_token');

    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    // Realizar la petición DELETE
    const response = await fetch(`${API_BASE_URL}/uploads/voucher/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Parsear la respuesta
    const data: ApiResponse = await response.json();

    // Verificar si la respuesta fue exitosa
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al eliminar el voucher');
    }

    return data;
  } catch (error: any) {
    console.error('Error al eliminar voucher:', error);
    throw new Error(error.message || 'Error al eliminar el archivo. Por favor intenta nuevamente.');
  }
};

/**
 * Validar que el archivo sea del tipo correcto para vouchers
 *
 * @param file - Archivo a validar
 * @returns true si el archivo es válido
 * @throws Error si el archivo no es válido
 */
export const validateVoucherFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG o PDF.');
  }

  if (file.size > maxSize) {
    throw new Error('El archivo no puede ser mayor a 5MB.');
  }

  return true;
};
