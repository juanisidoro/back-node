  Flujo de CSRF y Cookies HttpOnly body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; } h1, h2, h3 { color: #333; } pre { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; border-radius: 5px; overflow-x: auto; } code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } table th, table td { border: 1px solid #ddd; padding: 8px; text-align: left; } table th { background-color: #f2f2f2; }

Flujo correcto en el cliente
============================

1\. Obtener el token CSRF
-------------------------

Antes de cualquier interacción sensible con el backend (como el login), se debe realizar un `GET` a `/csrf-token` para obtener el token CSRF. Este token se usará como un valor en el encabezado `X-CSRF-Token` de todas las solicitudes sensibles.

    async function getCsrfToken() {
      const response = await fetch('http://localhost:3000/csrf-token', {
        credentials: 'include', // Importante para enviar las cookies automáticamente
      });
      const data = await response.json();
      return data.csrfToken;
    }

2\. Realizar el login
---------------------

Una vez que tienes el token CSRF, úsalo en la cabecera `X-CSRF-Token` para hacer el login. La cookie `HttpOnly` con el token JWT se establecerá automáticamente desde el backend.

    async function login(email, password) {
      const csrfToken = await getCsrfToken();
    
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // Incluye el token CSRF
        },
        credentials: 'include', // Para enviar y recibir cookies automáticamente
        body: JSON.stringify({ email, password }),
      });
    
      if (response.ok) {
        console.log('Login exitoso');
      } else {
        console.error('Error en el login:', await response.json());
      }
    }

3\. Logout
----------

Para cerrar sesión, simplemente haces un `POST` al endpoint `/auth/logout` con el token CSRF. El backend eliminará la cookie `HttpOnly` que contiene el token JWT. Una vez eliminada, la cookie desaparece del navegador automáticamente (en un navegador, no en Postman).

    async function logout() {
      const csrfToken = await getCsrfToken();
    
      const response = await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken, // Incluye el token CSRF
        },
        credentials: 'include', // Asegúrate de incluir cookies
      });
    
      if (response.ok) {
        console.log('Sesión cerrada exitosamente');
      } else {
        console.error('Error al cerrar sesión:', await response.json());
      }
    }

¿Por qué el token CSRF debe estar vinculado al login?
-----------------------------------------------------

*   **Evitar solicitudes maliciosas:** Antes de iniciar sesión, el cliente debe demostrar que tiene acceso legítimo a la aplicación obteniendo un token CSRF válido.
*   **Protección contra ataques CSRF:** Aunque el token JWT se envía automáticamente como cookie `HttpOnly`, el token CSRF actúa como una segunda capa de validación.

¿Es necesario repetir `GET /csrf-token` para cada solicitud sensible?
---------------------------------------------------------------------

**No necesariamente.** Una vez que tienes un token CSRF, puedes usarlo en varias solicitudes mientras la sesión esté activa. Sin embargo, si el token CSRF tiene un tiempo de vida limitado o se regenera al actualizar la sesión, necesitarás solicitar un nuevo token.

Checklist del flujo correcto en el frontend
-------------------------------------------

Paso

Acción requerida

Obtener token CSRF

`GET /csrf-token`, usar `credentials: 'include'` para enviar cookies automáticamente.

Login

`POST /auth/login` con el token CSRF en el header `X-CSRF-Token`.

Usar endpoints protegidos

Incluir el token CSRF en `X-CSRF-Token` y las cookies se envían automáticamente.

Logout

`POST /auth/logout`, el backend elimina la cookie JWT automáticamente.

Este flujo asegura que las cookies `HttpOnly` y el token CSRF trabajen juntas para proteger la aplicación.