# 📋 Resumen de Estado del Proyecto — Sentinel Security (Handover & Restauración)

> Este documento contiene el estado completo del proyecto **Sentinel Security**, el historial de avance de todos los componentes, las decisiones de arquitectura y la guía paso a paso para respaldar antes de formatear y restaurar después.

---

## 📌 Datos Generales del Proyecto

- **Nombre:** Sentinel Security
- **Ruta de trabajo:** `C:\laragon\www\SentinelSecurity` (o `C:\laragon\www\PetShop`)
- **Stack Tecnológico:**
  - **Backend:** Laravel 12 (PHP 8.2)
  - **Frontend:** Inertia.js v2 + React 18 + TypeScript + Tailwind CSS + Lucide Icons + Radix UI (shadcn/ui)
  - **Autorización:** Spatie Laravel Permission con extensión tri-estado (`allow` / `deny` / `inherited`)
  - **Base de Datos:** MySQL (Laragon)
  - **Testing:** Pest PHP (100% de la suite pasando en verde)
  - **Estilo de Código:** Laravel Pint

---

## 🛡️ Estado de los Módulos de Seguridad

```
Security
│
├── 01 Authentication ················ 🟡   (Login, logout, session cerrados; pendiente verificación email si aplica)
├── 02 Authorization ················· ✅   COMPLETADO (Usuarios, Roles, Permisos, Prioridad Allow/Deny Tri-estado)
├── 03 Menus ·························· ✅   COMPLETADO (Gestor de árbol jerárquico, sidebar recursivo dinámico)
├── 04 Sessions ······················· ✅   COMPLETADO (Monitor global, parseo de UserAgent, revocación multi-dispositivo)
├── 05 Failed Attempts / Bloqueos ···· ✅   COMPLETADO (Registro de intentos, búsqueda por email, desbloqueo de IP, purga, métricas)
├── 06 Audit (Auditoría) ············· ⬜   SIGUIENTE PASO EN LA COLA
├── 07 MFA / 2FA (TOTP) ·············· ⬜   PENDIENTE
├── 08 JWT (API) ······················ 🔮   FUTURO / OPCIONAL
└── 09 OAuth / OIDC ·················· 🔮   FUTURO / OPCIONAL
```

---

## 🔍 Detalle del Componente 05 (Recién Finalizado)

- **Backend:**
  - `App\Services\Security\FailedLoginService::getLockStatusByEmail($email)` agrupa todos los intentos de inicio de sesión por dirección IP y consulta el `RateLimiter` para cada una.
  - Endpoint JSON `GET /intentos-fallidos/estado?email=...` protegido con permiso `intentos_fallidos.desbloquear`.
  - Acción de desbloqueo `POST /intentos-fallidos/desbloquear` con `email` e `ip`.
  - Acción de purga `DELETE /intentos-fallidos/limpiar` con parámetro opcional de días.
- **Frontend (`resources/js/pages/security/intentos-fallidos/index.tsx`):**
  - Panel "Gestión de bloqueos": el admin solo ingresa el **Email**; el sistema descubre y lista todas las IPs asociadas con sus respectivos intentos, tiempos de espera restantes y botones individuales de desbloqueo.
  - Tabla histórica paginada de solo lectura con badges de estado, desglose de dispositivo y usuario asociado.
  - Tarjetas métricas 24h: Emails únicos, Intentos últimas 24h, Geografía (IPs únicas).
- **Tests (`tests/Feature/Security/FailedAttemptTest.php`):**
  - 15 tests pasando (58 assertions).


---

## 🚀 Siguiente Tarea Pendiente: Componente 06 · Auditoría (Audit Logs)

Cuando restaures tu PC, el siguiente paso inmediato es implementar el **Componente 06**:

1. **Migración `security_audit_logs`:**
   - `id`, `user_id` (nullable), `event` (string), `auditable_type` (nullable), `auditable_id` (nullable), `ip_address`, `user_agent`, `old_values` (json), `new_values` (json), `url`, `created_at`.
2. **Modelo y Servicio:**
   - `App\Models\Security\AuditLog`
   - `App\Services\Security\AuditService` (métodos `log()`, `getLogs()`, `getMetrics()`, `clearOldLogs()`).
3. **Listeners / Observers:**
   - Eventos Auth: `Login`, `Logout`, `Lockout`, `PasswordReset`.
   - Observers de modelos clave (`User`, `Role`, `Permission`, `Menu`).
4. **Controlador y UI:**
   - `AuditController` en `/auditoria`.
   - Página React `resources/js/pages/security/auditoria/index.tsx` con filtros, buscador, métricas y modal de diff JSON.
   - Permisos: `auditoria.listar`, `auditoria.limpiar`.

---

## 💾 PASO A PASO ANTES DE FORMATEAR TU PC

### 1. Guardar tus archivos de entorno
Copia tu archivo `.env` a una memoria USB o nube:
```bash
# Especialmente guarda las variables APP_KEY, DB_*, etc.
```

### 2. Confirmar y subir todo a tu repositorio Git
Ejecuta en tu terminal:
```bash
git add .
git commit -m "feat(security): finalizar componente 05 intentos fallidos y preparar handover para formateo"
git push origin main
```

*(Si no tienes repositorio remoto configurado, copia la carpeta completa `C:\laragon\www\PetShop` a tu disco externo o USB).*

### 3. (Opcional) Backup de Base de Datos
Si tienes datos manuales que quieras conservar:
- Abre HeidiSQL / DBeaver o la consola de Laragon.
- Exporta la base de datos `petshop` como archivo `.sql`.
*(Nota: Toda la estructura y datos iniciales de seguridad se pueden regenerar con `php artisan migrate:fresh --seed`).*

---

## 🛠️ PASO A PASO DESPUÉS DE FORMATEAR TU PC

### 1. Requisitos a Instalar
1. **Laragon** (con PHP 8.2+ y MySQL).
2. **Git** para Windows.
3. **Node.js** (versión 20+ LTS).
4. **Composer** (viene con Laragon o instalable).
5. **VS Code** con extensiones habituales.

### 2. Restaurar el Proyecto
Abre tu terminal en `C:\laragon\www\` y ejecuta:
```bash
# 1. Clonar tu repositorio
git clone <URL_DE_TU_REPOSITORIO> PetShop
cd PetShop

# 2. Configurar entorno
cp .env.example .env
# (O copia el archivo .env que respaldaste en tu USB)

# 3. Instalar dependencias PHP
composer install

# 4. Generar clave de aplicación (si creaste .env desde example)
php artisan key:generate

# 5. Instalar dependencias Node / Frontend
npm install

# 6. Crear la base de datos en MySQL (nombre: petshop) y correr migraciones + seeders
php artisan migrate:fresh --seed

# 7. Ejecutar Pint y la suite de tests para comprobar que todo está 100% verde
php artisan test

# 8. Compilar los assets frontend
npm run build
```

### 3. Cómo reanudar con la IA (Cline / Asistente)
Cuando abras el proyecto en VS Code con Cline, simplemente envía el siguiente mensaje:

> *"Hola, acabo de restaurar mi PC. Revisa `HANDOVER_ESTADO_ACTUAL.md` y `SECURITY_ARCHITECTURE.md`. El componente 05 está listo. Vamos a comenzar con el Componente 06 · Auditoría."*
