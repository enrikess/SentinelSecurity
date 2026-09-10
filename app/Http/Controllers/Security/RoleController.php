<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Listado de roles.
     */
    public function index()
    {
        $roles = Role::orderBy('name')->get();

        return Inertia::render('security/roles/index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Formulario para crear un rol.
     */
    public function create()
    {
        $permissions = $this->getGroupedPermissions();

        return Inertia::render('security/roles/create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Guardar un nuevo rol.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:security_roles,name',
            ],
            'permissions' => [
                'nullable',
                'array',
            ],
            'permissions.*' => [
                'integer',
                'exists:security_permissions,id',
            ],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $permissions = Permission::query()
                ->whereIn('id', $validated['permissions'])
                ->get();

            $role->syncPermissions($permissions);
        }

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol creado correctamente.');
    }

    /**
     * Formulario para editar un rol.
     */
    public function edit(Role $role)
    {
        $role->load('permissions:id,name');

        $permissions = $this->getGroupedPermissions();

        return Inertia::render('security/roles/edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions
                    ->pluck('id')
                    ->values()
                    ->toArray(),
            ],
            'permissions' => $permissions,
        ]);
    }

    /**
     * Actualizar un rol.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:security_roles,name,'.$role->id,
            ],
            'permissions' => [
                'nullable',
                'array',
            ],
            'permissions.*' => [
                'integer',
                'exists:security_permissions,id',
            ],
        ]);

        $role->update([
            'name' => $validated['name'],
        ]);

        $permissions = Permission::query()
            ->whereIn(
                'id',
                $validated['permissions'] ?? []
            )
            ->get();

        $role->syncPermissions($permissions);

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol actualizado correctamente.');
    }

    /**
     * Eliminar un rol.
     */
    public function destroy(Role $role)
    {
        $role->permissions()->detach();

        $role->delete();

        return redirect()
            ->route('roles.index')
            ->with('success', 'Rol eliminado correctamente.');
    }

    /**
     * Obtener permisos agrupados por el texto
     * anterior al punto.
     *
     * Ejemplo:
     *
     * usuarios.listar
     * usuarios.crear
     * usuarios.editar
     *
     * se agrupan como:
     *
     * usuarios
     * ├── usuarios.listar
     * ├── usuarios.crear
     * └── usuarios.editar
     */
    private function getGroupedPermissions()
    {
        return Permission::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ])
            ->groupBy(function (Permission $permission) {
                return explode('.', $permission->name, 2)[0];
            })
            ->map(function ($permissions, $group) {
                return [
                    'name' => $group,
                    'permissions' => $permissions
                        ->map(function (Permission $permission) {
                            return [
                                'id' => $permission->id,
                                'name' => $permission->name,
                                'action' => explode(
                                    '.',
                                    $permission->name,
                                    2
                                )[1] ?? $permission->name,
                            ];
                        })
                        ->values()
                        ->toArray(),
                ];
            })
            ->values()
            ->toArray();
    }
}
