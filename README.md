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
