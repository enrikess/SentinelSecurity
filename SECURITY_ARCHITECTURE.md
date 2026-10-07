# 🛡️ Sentinel Security — Sistema de Seguridad Integral & Control de Acceso

> Mapa de arquitectura del núcleo **Sentinel Security** (Laravel 12 + Inertia + React + TypeScript + Tailwind CSS + shadcn/ui + Spatie).
> Construido componente por componente: primero se implementa, se prueba y se cierra un bloque, antes de pasar al siguiente.

## Leyenda de estado

| Símbolo | Significado |
|---|---|
| ✅ | Implementado (código en el repo) |
| 🟡 | Parcial — base lista, falta un aspecto o validación |
| ⬜ | Pendiente — siguiente en la cola |
| 🔮 | Futuro / opcional — solo si hace falta |

---

## Árbol de bloques y progreso

```
Security
│
├── 01 Authentication ················ 🟡   (sólo falta verificación de email exigida)
│   └── Session (inicio/cierre) ····· ✅
├── 02 Authorization ················· ✅   (allow/deny cerrado en código)
│   ├── Users ························ ✅
│   ├── Roles ························ ✅
│   ├── Permissions ·················· ✅
│   └── User Denials (allow/deny) ···· ✅
├── 03 Menus ·························· ✅   (gestor de árbol single-page terminado)
├── 04 Sessions (sesiones activas) ··· ✅   ← COMPLETADO (lista y revocación por dispositivo)
├── 05 Failed Attempts / bloqueo ····· ✅   ← COMPLETADO (registro + admin unlock + métricas)
├── 06 Audit ·························· ⬜
├── 07 MFA / 2FA ······················ ⬜
├── 08 JWT (opcional, API) ············ 🔮
└── 09 OAuth / OIDC (futuro) ·········· 🔮
```

**Dónde estamos:** componente **05 Failed Attempts / bloqueo temporal** completado y probado. El siguiente paso del plan es **06 Audit** (auditoría de eventos de seguridad).

---

## 05 · Failed Attempts / Rate Limiting

**Estado: ✅ COMPLETADO**

| Artefacto | Ubicación |
|---|---|
| Tabla | `security_failed_login_attempts` (migración `database/migrations/2026_09_17_070000_create_security_failed_login_attempts_table.php`) |
| Modelo | `App\Models\Security\FailedLoginAttempt` |
| Servicio | `App\Services\Security\FailedLoginService` (record/throttle/unlock/list/metrics/clear) |
| Listener | `App\Listeners\Security\LogFailedLoginAttempt` (evento `Illuminate\Auth\Events\Failed`) |
| Controlador | `App\Http\Controllers\Security\FailedAttemptController` (index/status/unlock/clearHistory) |
| Rutas | `routes/security.php` (GET `/intentos-fallidos`, GET `/intentos-fallidos/estado`, POST `/intentos-fallidos/desbloquear`, DELETE `/intentos-fallidos/limpiar`) |
| Permisos | `intentos_fallidos.listar`, `intentos_fallidos.desbloquear`, `intentos_fallidos.limpiar` |
| Menú | Configuración → Intentos Fallidos (`/intentos-fallidos`, icono `shield-alert`) |
| Página React | `resources/js/pages/security/intentos-fallidos/index.tsx` |
| Tests | `tests/Feature/Security/FailedAttemptTest.php` (15 tests / 58 assertions) |

### Características implementadas

- **Registro automático**: cada intento de login fallido dispara el evento `Failed` → listener persiste en BD.
- **Vinculación de usuario**: si el email existe en la BD, el registro se asocia al `user_id`.
- **Rate limiting**: integrado con `RateLimiter` de Laravel (5 intentos/min, throttle key = `email|ip` transliterada).
- **Gestión de bloqueos por Email**: panel de consulta que busca por email del usuario y lista automáticamente todas las IPs asociadas con sus respectivos intentos, tiempos restantes y botón de desbloqueo individual.
- **Métricas 24h**: total de intentos, emails únicos, IPs únicas, top IP y top email con más intentos.
- **Filtros**: búsqueda por email/IP/nombre de usuario, rango de fechas (desde/hasta).
- **Purga de historial**: eliminación de registros antiguos (por días) o todo el historial.
- **UI React**: tabla paginada de solo lectura con estado de bloqueo, avatar de usuario, info de dispositivo, y panel interactivo superior para consultar/desbloquear y purgar.

### Throttle key coherente

La clave del rate limiter en `FailedLoginService::throttleKey()` coincide exactamente con la de `LoginRequest::throttleKey()`:

```php
Str::transliterate(Str::lower($email).'|'.$ip)
```

Esto garantiza que el desbloqueo administrativo (`RateLimiter::clear()`) opere sobre la misma clave que el bloqueo original.

### Tests implementados

- Registro de intento fallido cuando falla la autenticación
- Vinculación al usuario existente o `user_id` null
- Permisos para listar/desbloquear/limpiar
- Listado paginado con filtros (búsqueda, fechas)
- Desbloqueo limpia el rate limiter y permite nuevos intentos
- Purga de historial completo o por días
- Métricas calculan correctamente totales 24h e identifican top IP/email

---

## Stack de base

| Pieza | Valor |
|---|---|
| Paquete | `spatie/laravel-permission` ^6.25 |
| Guard | `web` (único por ahora) |
| Prefijo de tablas | `security_` |
| Modelos | `App\Models\Security\Role`, `App\Models\Security\Permission` |
| Middleware | alias `permission` → `Spatie\Permission\Middleware\PermissionMiddleware` (`bootstrap/app.php`) |
| Frontend | Inertia v2 + React, páginas bajo `resources/js/pages/security/` |

---

## 01 · Autenticación (Authentication / Session)

**Estado: 🟡** — login/logout y recuperación de contraseña ✅; verificación de correo 🟡 (rutas y UI listas, pero `User` no implementa `MustVerifyEmail`); sesiones activas ⬜ (bloque 04).

| Artefacto | Ubicación |
|---|---|
| Rutas | `routes/auth.php` |
| Controladores | `app/Http/Controllers/Auth/` (`AuthenticatedSession`, `PasswordResetLink`, `NewPassword`, `EmailVerificationPrompt/Notification/Verify`, `ConfirmablePassword`) |
| Request | `app/Http/Requests/Auth/LoginRequest.php` (rate-limit 5 intentos) |
| Páginas React | `resources/js/pages/auth/` |
| Tablas | `users` (estándar), `password_reset_tokens`, `sessions` (estándar de Laravel) |
| Modelos | `App\Models\User` (usado como `Authenticatable` + permisos) |

**Pendiente del bloque:** decidir si exigir `email_verified_at` (`MustVerifyEmail`) y sumar la gestión de sesiones activas (movida al bloque 04).

---

## 02 · Autorización (Users / Roles / Permissions / User Denials)

**Estado: ✅** — overrides de allow/deny por usuario ya funcionando.

### Tablas (prefijo `security_`)

| Tabla | Propósito |
|---|---|
| `security_permissions` | Catálogo de permisos (convención `modulo.accion`) |
| `security_roles` | Roles + `syncPermissions` |
| `security_role_has_permissions` | Permisos otorgados a cada rol |
| `security_model_has_roles` | Roles asignados a usuarios |
| `security_model_has_permissions` | **Permisos directos por usuario con columna `is_denied`** — declarada en la migración base `2026_08_25_000328_create_permission_tables.php` (línea 56). Sin migración aditiva: siempre se migra desde 0 |

### Modelos

| Clase | Rol |
|---|---|
| `App\Models\Security\Permission` | Sobre `Spatie\Permission\Models\Permission` (tabla `security_permissions`) |
| `App\Models\Security\Role` | Sobre `Spatie\Permission\Models\Role` (tabla `security_roles`) |
| `App\Models\User` | Trait `HasRoles` + `HasPermissions` con overrides |

### Resolución de prioridad (implementada en `User::hasPermissionTo()`)

```
1. Deny directo del usuario   → niega siempre (is_denied = true)
2. Allow directo del usuario  → otorga   (is_denied = false)
3. Permiso del rol            → otorga
4. Sin asignación             → niega (por defecto)
```

### API del modelo `User`

| Método | Función |
|---|---|
| `hasPermissionTo()` / `can()` | Aplica prioridad allow/deny |
| `hasDirectPermission()` | Solo filas `is_denied = false` |
| `getAllPermissions()` | Directas + rol, excluyendo las denegadas |
| `getPermissionNames()` / `getDirectPermissions()` | Nombres / solo directas |
| `deniedPermissionIds()` | IDs de denegaciones explícitas |
| `permissionStatus(int $id)` | `null` = sin asignar, `false` = allow, `true` = deny |
| `syncPermissionsWithStatus($allowed, $denied)` | Reemplazo atómico con estado (deny gana si hay conflicto) |

### Controladores y frontend

| Ámbito | Controlador | Página React |
|---|---|---|
| Usuarios | `Security\UserController` | `pages/security/usuarios/` (selector de permisos tri-estado +/−/∅ por grupos de color) |
| Roles    | `Security\RoleController` | `pages/security/roles/` |
| Permisos | `Security\PermissionController` | `pages/security/permisos/` |

**Pendiente del bloque:**
- ✅ Allow/deny en código + `tests/Feature/Security/UserPermissionOverrideTest.php` (15 tests / 56 aserciones de la prioridad deny > allow > rol). Falta solo la validación manual en navegador.
- Estado del usuario (`is_active`/bloqueo de cuenta) aún no está en la tabla `users` — no implementado.

---

## 03 · Gestión de Menús

**Estado: ✅** — gestor de árbol single-page, integrado con el sidebar.

| Artefacto | Ubicación |
|---|---|
| Tabla | `security_menus` (`parent_id` recursivo, `sort_order`, `permission_id`, `is_active`, `type`, `route`, `icon`, `slug`) |
| Modelo | `App\Models\Security\Menu` (`HasFactory`; relación `permission`) |
| Enum | `App\Enums\Security\MenuType` → `SECTION` / `GROUP` / `MENU` |
| Servicio | `App\Services\Security\MenuService` — `getTreeForUser()` (sidebar filtrado) y `getFullTree()` (gestión) |
| Controlador | `Security\MenuController` — `index`, `store`, `update`, `move` (↑/↓), `destroy` (guard de hijos) |
| Rutas | `routes/security.php` (`/menus`, protegidas con `permission:menus.*`) |
| Páginas React | `pages/security/menu/` (`index.tsx` árbol + `menu-form-sheet.tsx` por sección/grupo/menú) |
| Sidebar | `components/security/recursive-menu.tsx` + `components/security/icon-map.tsx`; props compartidas `security.menus` / `security.permissions` en `HandleInertiaRequests` |
| Seed | `Database\Seeders\MenuSeeder` — secciones Administración / Catálogo / Inventario / Reportes / Configuración |

**Reglas del gestor:**
- Secciones y grupos no llevan ruta ni permiso y se crean siempre en la raíz.
- Un menú solo puede anidar bajo sección o grupo; un grupo con hijos no puede convertirse en menú.
- `slug` y `route` siempre normalizados (`Str::slug`, `/` inicial y sin barra final).
- `sort_order` se auto-asigna al final de los hermanos; el reordenamiento intercambia posiciones en transacción.

---

## 04 · Sessions (sesiones activas, monitor global y revocación)

**Estado: 🟢 implementado y testeado.**

| Artefacto | Descripción |
|---|---|
| Tabla | `sessions` (estándar de Laravel) con `id`, `user_id`, `ip_address`, `user_agent`, `last_activity` |
| Servicio | `App\Services\Security\SessionService` — `forUser()` para el usuario autenticado y `allSessions()` para el monitor global del administrador |
| Parser UA | `App\Services\Security\UserAgentParser` — detecta navegador, plataforma y tipo de dispositivo (escritorio/móvil/tablet) sin librerías externas |
| Controlador | `App\Http\Controllers\Security\SessionController` — `index` (pestañas "Todas las sesiones" y "Mis dispositivos"), `revoke` (individual, con control RBAC multiusuario) y `revokeAll` (`Auth::logoutOtherDevices` + confirmación de contraseña) |
| Rutas & Permisos | `routes/security.php` (`/sesiones`, `/sesiones/{session}/revocar`, `/sesiones/revocar-todas`) con permisos `sesiones.listar`, `sesiones.revocar` y `sesiones.administrar` |
| Menú | Ítem "Sesiones" (`/sesiones`, icono `monitor-smartphone`) bajo sección Configuración |
| Página React | `resources/js/pages/security/sesiones/index.tsx` — tarjetas métricas (sesiones activas, usuarios conectados, mis dispositivos), buscador reactivo, tabla global con avatar y datos de usuario, y gestión de dispositivos propios |
| Tests | `tests/Feature/Security/SessionTest.php` (13 tests / 82 assertions) + `tests/Unit/Services/Security/UserAgentParserTest.php` (9 datasets / 27 assertions) |

---

## 06 · Auditoría

**Estado: ⬜** — `spatie/laravel-permission` tiene `events_enabled => false`; no hay rastro de cambios de usuarios, roles o permisos.

| Pieza | Descripción |
|---|---|
| Tabla | `security_audit_logs` (`user_id`, `event`, `auditable_type/id`, `ip`, `user_agent`, `metadata` JSON, timestamps) |
| Servicio | `App\Services\Security\AuditService` — escritura centralizada |
| Soporte | Listener de eventos (login/logout, `RoleAttached/Dettached`, cambios en `security_model_has_permissions`, CRUD de usuarios/roles/permisos/menús) |
| UI | Vista de log con filtros (futuro) |

---

## 07 · MFA / 2FA (TOTP)

**Estado: ⬜** — sin paquete ni tablas.

| Pieza | Descripción |
|---|---|
| Tabla | `security_user_totp` (`user_id`, `secret`, `recovery_codes`, `activated_at`) |
| Flujo | Activar/desactivar desde `settings` → escanear QR → códigos de respaldo → verificar en login después de la contraseña |
| Paquete sugerido | `pragmarx/google2fa` (TOTP) o implementación propia sobre `otp` |

**Decisión pendiente:** hacerlo con paquete vs. propio; también si aplica exigirlo por rol o por usuario.

---

## 08 · JWT (opcional, API)

**Estado: 🔮** — lo dejamos fuera de la base Inertia (como acordamos). Solo si aparecen apps móviles o integraciones API. Entonces evaluar Sanctum/Passport por tokens vs. JWT puro (`tymon/jwt-auth`).

---

## 09 · OAuth / OIDC

**Estado: 🔮** — futuro. `laravel/socialite` con providers (Google, Microsoft). No planificado ahora.

---

## 10 · Configuración central

**Estado: 🟡 parcial**

- ✅ Prefijo `security_` en tablas (`config/permission.php`).
- ✅ Guard configurable (`guard_name = web`; el paquete soporta varios).
- ⬜ Funcionalidades activables/desactivables (p. ej. toggle de MFA, auditoría) centralizado en `config/security.php`.

---

## Decisiones y convenciones registradas

1. **Prefijo `security_`** para todo lo del módulo (tablas y modelos Spatie).
2. **Convención de permisos:** `modulo.accion` → `usuarios.listar/crear/editar/eliminar`, `menus.*`, `productos.*`, etc.
3. **Prioridad de resolución:** deny > allow directo > rol > sin asignar (implementada en `User`).
4. **Guard único `web`** por ahora; `security_roles` y `security_permissions` no usan teams.
5. **Menús:** tipos `SECTION`/`GROUP`/`MENU`, permiso opcional `permission_id`, orden por `sort_order` entre hermanos, jerarquía vía `parent_id` sin límite de niveles.
6. **Sidebar dinámico** alimentado desde `HandleInertiaRequests` (`security.menus`, `security.permissions`).
7. **Interfaz 100% Inertia + React** (incluido el gestor de menús single-page; sin páginas Blade de gestión).

## Estado de pruebas

| Ámbito | Tests |
|---|---|
| Gestor de menús | ✅ `tests/Feature/Security/MenuIndexTest.php` — 9 tests / 49 aserciones |
| Autorización allow/deny | ✅ `tests/Feature/Security/UserPermissionOverrideTest.php` — 15 tests / 56 aserciones |
| Sesiones activas y revocación | ✅ `tests/Feature/Security/SessionTest.php` + `tests/Unit/Services/Security/UserAgentParserTest.php` — 20 tests / 61 aserciones |
| Suite completa del proyecto | ✅ 71 tests / 313 aserciones (100% verde) |

## Siguiente paso según el plan incremental

1. **05 Failed Attempts / bloqueo temporal:**
   - Tabla de intentos fallidos / bloqueo por IP o usuario persistente.
   - Event listeners en `Illuminate\Auth\Events\Failed` y `Lockout`.
   - Política configurable (máximo de intentos, ventana de tiempo, tiempo de bloqueo).
2. **06 Auditoría:** registro de eventos de seguridad (logins, logouts, cambios de rol, etc.).
3. **07 MFA / 2FA (TOTP)** → **08 JWT / 09 OAuth** (opcionales).