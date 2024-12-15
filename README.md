# Diferencias entre desarrollo y producción en tu backend

## Entorno (`NODE_ENV`)

### Desarrollo (`development`):
- Configuración más permisiva para depurar errores.
- CORS habilitado para localhost.
- Mensajes de error más detallados.
- Logs en consola para monitoreo.

### Producción (`production`):
- Configuración más estricta (cookies seguras, CORS limitado).
- Mensajes de error genéricos para evitar revelar información sensible.
- Configuraciones optimizadas para rendimiento y seguridad (e.g., `helmet`).

---

## CORS (Cross-Origin Resource Sharing)

- **Desarrollo:** Acepta peticiones desde `http://localhost:3000` para permitir pruebas desde herramientas locales como Postman o el frontend en React.
- **Producción:** Solo acepta peticiones desde tu dominio (`https://tu-dominio.com`).

---

## Cookies y CSRF

- **Desarrollo:** Cookies configuradas sin `Secure` y políticas `SameSite` relajadas.
- **Producción:** Cookies marcadas como `HttpOnly`, `Secure` (solo HTTPS), y con una política de `SameSite` estricta.

---

## Logs y errores

- **Desarrollo:** Los errores completos (`stack trace`) se muestran en las respuestas y la consola.
- **Producción:** Los errores se limitan a mensajes genéricos.

---

## Límite de solicitudes (`rateLimiter`)

- **Desarrollo:** Puede configurarse con límites más amplios para facilitar pruebas.
- **Producción:** Límite estricto (e.g., 100 solicitudes por 15 minutos por IP).

---

# Endpoints creados

## Autenticación
- `POST /auth/register` - Registro de un usuario.
- `POST /auth/login` - Inicio de sesión.
- `POST /auth/refresh` - Refresh token.

## Seguridad
- `GET /csrf-token` - Obtener un token CSRF.

## Usuarios
- `GET /users` - Listar todos los usuarios (solo admin).
- `GET /users/:id` - Obtener información de un usuario específico (autenticado).
- `PUT /users/:id` - Actualizar información de un usuario (autenticado o admin).
- `DELETE /users/:id` - Eliminar un usuario (autenticado o admin).

---

# Checklist seguridad
- Token JWT enviado como cookie HttpOnly.
- Cookie marcada como Secure en producción.
- Cookie configurada con SameSite: strict o lax.
- Middleware de autenticación lee el token de la cookie.
- Token CSRF implementado y validado.
- CORS configurado para permitir cookies.
- Endpoint /auth/logout elimina la cookie.


---

## Protección CSRF

Este proyecto implementa protección contra ataques **CSRF (Cross-Site Request Forgery)**, asegurando que todas las solicitudes sensibles sean legítimas y provengan de usuarios autenticados. 

Puedes encontrar más información y detalles sobre cómo funciona el token CSRF en el archivo dedicado:  
👉 [Guía de CSRF](https://github.com/juanisidoro/back-node/blob/main/README_CSRF.md)
