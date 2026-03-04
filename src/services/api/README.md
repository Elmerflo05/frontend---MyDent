# Integración con API Real - Documentación

## Descripción General

Esta carpeta contiene la **nueva infraestructura** para conectar el frontend con las APIs reales del backend, reemplazando el uso de IndexedDB (Dexie) por llamadas HTTP con autenticación JWT.

## Arquitectura

```
src/services/api/
├── httpClient.ts       # Cliente HTTP base con interceptores JWT
├── authApi.ts          # API de autenticación (login, logout)
├── authService.ts      # Servicio de autenticación de alto nivel
├── index.ts            # Exportaciones centralizadas
└── README.md           # Esta documentación
```

## Componentes Principales

### 1. httpClient.ts

Cliente HTTP centralizado que maneja:
- Configuración de headers automática
- Inyección de tokens JWT en cada request
- Manejo de errores HTTP
- Interceptores para 401 (no autorizado) y 403 (prohibido)
- Redirección automática al login cuando el token expira

**Uso básico:**

```typescript
import { httpClient } from '@/services/api';

// GET request
const response = await httpClient.get('/patients');

// POST request
const response = await httpClient.post('/patients', {
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@example.com'
});

// PUT request
const response = await httpClient.put('/patients/123', {
  phone: '999888777'
});

// DELETE request
const response = await httpClient.delete('/patients/123');
```

### 2. authApi.ts

Maneja las operaciones de autenticación con la API:
- Login con credenciales
- Logout
- Verificación de token válido
- Extracción de datos del usuario desde el token JWT

**Uso básico:**

```typescript
import { authApi } from '@/services/api';

// Login
const response = await authApi.login({
  email: 'admin@clinica.com',
  password: '12345678'
});

if (response.success) {
  console.log('Usuario:', response.user);
  console.log('Token:', response.token);
}

// Logout
await authApi.logout();

// Verificar si hay token válido
const isValid = authApi.hasValidToken();

// Obtener usuario desde el token
const user = authApi.getUserFromToken();
```

### 3. authService.ts

Servicio de alto nivel que integra authApi con la lógica del frontend:
- Mapeo de datos de la API al formato del frontend
- Gestión de localStorage
- Verificaciones de roles y permisos
- Métodos de utilidad (isAdmin, isDoctor, etc.)

**Uso básico:**

```typescript
import ApiAuthService from '@/services/api/authService';

// Login
const response = await ApiAuthService.login({
  email: 'admin@clinica.com',
  password: '12345678'
});

// Obtener usuario actual
const user = ApiAuthService.getCurrentUser();

// Verificar autenticación
const isAuth = ApiAuthService.isAuthenticated();

// Verificar roles
const isAdmin = ApiAuthService.isAdmin();
const isDoctor = ApiAuthService.isDoctor();

// Verificar acceso a sede
const canAccess = ApiAuthService.canAccessSede('sede-123');
```

## Integración con el Frontend

### Store de Zustand

Se creó un **nuevo store** (`apiAuthStore.ts`) que usa `ApiAuthService` en lugar del `AuthService` antiguo (IndexedDB).

```typescript
import { useApiAuthStore } from '@/store/apiAuthStore';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useApiAuthStore();

  // ... resto del componente
}
```

### Hook useApiAuth

Se creó un **nuevo hook** (`useApiAuth.ts`) que facilita el uso del store y agrega lógica de navegación.

```typescript
import { useApiAuth } from '@/hooks/useApiAuth';

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    isAdmin,
    isDoctor
  } = useApiAuth();

  // ... resto del componente
}
```

## Migración desde IndexedDB a API Real

### Paso 1: Importar el nuevo hook

```typescript
// ANTES (usando IndexedDB)
import { useAuth } from '@/hooks/useAuth';

// DESPUÉS (usando API real)
import { useApiAuth as useAuth } from '@/hooks/useApiAuth';
```

### Paso 2: Usar el hook normalmente

El hook `useApiAuth` tiene la **misma interfaz** que `useAuth`, por lo que no necesitas cambiar el código del componente.

```typescript
function LoginPage() {
  const { login, isLoading, error } = useAuth(); // Funciona igual

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login({ email, password });
    // ... resto de la lógica
  };
}
```

### Paso 3: Actualizar el store en el componente raíz

En `src/App.tsx` o donde se inicialice la app:

```typescript
// ANTES
import { useAuthStore } from '@/store/authStore';

// DESPUÉS
import { useApiAuthStore as useAuthStore } from '@/store/apiAuthStore';
```

## Configuración del Backend

### Variables de entorno

Asegúrate de que el backend esté corriendo en el puerto correcto:

```
Backend API: http://localhost:4015/api
Frontend: http://localhost:3015
```

### Endpoints disponibles

```
POST   /api/auth/login          - Login con email y password
GET    /api/patients            - Obtener todos los pacientes
GET    /api/patients/:id        - Obtener un paciente
POST   /api/patients            - Crear paciente
PUT    /api/patients/:id        - Actualizar paciente
DELETE /api/patients/:id        - Eliminar paciente
... (más endpoints según la documentación del backend)
```

## Manejo de Errores

El `httpClient` maneja automáticamente los errores HTTP:

```typescript
try {
  const response = await httpClient.get('/patients');
  console.log(response.data);
} catch (error) {
  // Error ya procesado por httpClient
  console.error(error.message);

  // Código de estado HTTP disponible en error.status
  if (error.status === 404) {
    console.log('Paciente no encontrado');
  }
}
```

### Errores especiales

- **401 Unauthorized**: Token inválido o expirado → Redirige automáticamente a `/login`
- **403 Forbidden**: Usuario no tiene permisos → Dispara evento `auth:forbidden`

## Eventos Personalizados

El httpClient dispara eventos personalizados que puedes escuchar:

```typescript
// Escuchar cuando el usuario pierde autenticación
window.addEventListener('auth:unauthorized', () => {
  console.log('Token expirado, redirigiendo a login...');
});

// Escuchar cuando el usuario no tiene permisos
window.addEventListener('auth:forbidden', () => {
  console.log('Acceso denegado');
});
```

## Próximos Pasos

### APIs pendientes de integración:

1. **Pacientes** - CRUD completo
2. **Citas** - CRUD + confirmación, cancelación, estados
3. **Tratamientos** - Gestión de tratamientos y procedimientos
4. **Pagos** - Registro de pagos y vouchers
5. **Laboratorio** - Servicios y solicitudes
6. **Radiografía** - Estudios de imagen
7. **Inventario** - Stock y categorías
8. **Promociones** - Descuentos y ofertas

Cada módulo seguirá el mismo patrón:

```
src/services/api/
├── patientsApi.ts      # API de pacientes
├── appointmentsApi.ts  # API de citas
├── treatmentsApi.ts    # API de tratamientos
└── ... etc
```

## Notas Importantes

- **NO modificar** los servicios antiguos (`src/services/auth.ts`, `src/store/authStore.ts`, `src/hooks/useAuth.ts`)
- **Crear NUEVOS** archivos para evitar romper funcionalidad existente
- Cada módulo debe tener su propio archivo de API service
- Seguir el patrón de httpClient para todas las llamadas HTTP
- Mantener la misma interfaz en los hooks para facilitar migración

## Testing

Para probar la integración:

1. Asegúrate de que el backend esté corriendo: `http://localhost:4015`
2. Inicia el frontend: `npm run dev`
3. Intenta hacer login con credenciales válidas
4. Verifica en las DevTools que las llamadas HTTP se hacen correctamente
5. Verifica que el token JWT se guarda en localStorage

## Soporte

Para dudas o problemas con la integración, revisar:
- Backend: `backend_my_dent_sistema_odontologico/API_DOCUMENTATION.md`
- Logs del navegador (consola y red)
- Logs del backend
