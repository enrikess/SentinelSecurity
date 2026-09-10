<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Overrides de permisos (allow / deny)
    |--------------------------------------------------------------------------
    |
    | Cada fila de `security_model_has_permissions` guarda un estado en la
    | columna `is_denied`:
    |
    |   is_denied = false  -> permiso directo otorgado (allow)
    |   is_denied = true   -> permiso denegado explícitamente (deny)
    |
    | Prioridad al evaluar un permiso:
    |
    |   1. Deny directo    -> niega siempre
    |   2. Allow directo   -> otorga
    |   3. Permiso por rol -> otorga
    |   4. Sin asignar     -> niega (valor por defecto)
    |
    */

    /**
     * Relación con permisos directos, incluyendo el estado `is_denied`
     * en el pivot para poder distinguir allow de deny.
     */
    public function permissions(): BelongsToMany
    {
        return parent::permissions()
            ->withPivot('is_denied');
    }

    /**
     * Determina si el modelo puede realizar el permiso dado.
     *
     * Un deny directo siempre anula cualquier allow directo o rol.
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        if ($this->getWildcardClass()) {
            return $this->hasWildcardPermission($permission, $guardName);
        }

        $permission = $this->filterPermission($permission, $guardName);

        if ($this->isDirectPermissionDenied($permission)) {
            return false;
        }

        return $this->hasDirectPermission($permission)
            || $this->hasPermissionViaRole($permission);
    }

    /**
     * Determina si el modelo tiene el permiso de forma directa.
     *
     * Solo cuenta como "otorgado" si existe una fila con `is_denied = false`.
     */
    public function hasDirectPermission($permission): bool
    {
        $permission = $this->filterPermission($permission);

        return $this->loadMissing('permissions')
            ->permissions
            ->contains(
                fn ($item) => $item->getKey() === $permission->getKey()
                    && ! (bool) $item->pivot->is_denied
            );
    }

    /**
     * Determina si el permiso está denegado explícitamente para el modelo.
     */
    public function isDirectPermissionDenied($permission): bool
    {
        $permission = $this->filterPermission($permission);

        return $this->loadMissing('permissions')
            ->permissions
            ->contains(
                fn ($item) => $item->getKey() === $permission->getKey()
                    && (bool) $item->pivot->is_denied
            );
    }

    /**
     * Todos los permisos efectivos del modelo (allow directo + rol),
     * excluyendo los denegados explícitamente.
     */
    public function getAllPermissions(): Collection
    {
        $permissions = $this->permissions
            ->reject(fn ($permission) => (bool) $permission->pivot->is_denied);

        if (! is_a($this, PermissionContract::class)) {
            $permissions = $permissions->merge(
                $this->getPermissionsViaRoles()
                    ->reject(fn ($permission) => $this->deniedPermissionIds()->contains($permission->getKey()))
            );
        }

        return $permissions->sort()->values();
    }

    /**
     * Nombres de permisos otorgados directamente, sin los denegados.
     */
    public function getPermissionNames(): Collection
    {
        return $this->permissions
            ->reject(fn ($permission) => (bool) $permission->pivot->is_denied)
            ->pluck('name');
    }

    /**
     * Permisos directamente otorgados al modelo, sin los denegados.
     */
    public function getDirectPermissions(): Collection
    {
        return $this->permissions
            ->reject(fn ($permission) => (bool) $permission->pivot->is_denied)
            ->values();
    }

    /**
     * IDs de los permisos denegados explícitamente.
     */
    public function deniedPermissionIds(): Collection
    {
        return $this->loadMissing('permissions')
            ->permissions
            ->filter(fn ($permission) => (bool) $permission->pivot->is_denied)
            ->pluck('id')
            ->values();
    }

    /**
     * Estado del permiso para este usuario.
     *
     * @return bool|null null = sin asignar, false = permitido, true = denegado
     */
    public function permissionStatus(int $permissionId): ?bool
    {
        $permission = $this->loadMissing('permissions')
            ->permissions
            ->firstWhere('id', $permissionId);

        if ($permission === null) {
            return null;
        }

        return (bool) $permission->pivot->is_denied;
    }

    /**
     * Reemplaza los permisos directos del modelo con estado allow/deny.
     *
     * @param  list<int>  $allowed  IDs de permisos a otorgar (allow)
     * @param  list<int>  $denied   IDs de permisos a denegar (deny)
     */
    public function syncPermissionsWithStatus(array $allowed = [], array $denied = []): static
    {
        $permissionClass = $this->getPermissionClass();

        $allowedIds = $permissionClass::query()
            ->whereIn('id', $allowed)
            ->pluck('id')
            ->all();

        $deniedIds = $permissionClass::query()
            ->whereIn('id', $denied)
            ->pluck('id')
            ->all();

        if (! $this->exists) {
            return $this;
        }

        $this->permissions()->detach();

        $pivots = [];

        foreach ($allowedIds as $permissionId) {
            $pivots[$permissionId] = ['is_denied' => false];
        }

        // Si un permiso llega en ambas listas, gana el deny.
        foreach ($deniedIds as $permissionId) {
            $pivots[$permissionId] = ['is_denied' => true];
        }

        if ($pivots !== []) {
            $this->permissions()->attach($pivots);
        }

        $this->unsetRelation('permissions');
        $this->forgetCachedPermissions();
        $this->forgetWildcardPermissionIndex();

        return $this;
    }
}
