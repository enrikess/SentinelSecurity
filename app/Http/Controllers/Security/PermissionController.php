<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\Security\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Mostrar listado de permisos.
     */
    public function index()
    {
        $permissions = Permission::query()
            ->select([
                'id',
                'name',
                'guard_name',
                'created_at',
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('security/permisos/index', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Mostrar formulario de creación.
     */
    public function create()
    {
        return Inertia::render('security/permisos/create');
    }

    /**
     * Registrar un nuevo permiso.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/',
                Rule::unique('security_permissions', 'name'),
            ],
            'guard_name' => [
                'required',
                'string',
                'max:255',
            ],
        ], [
            'name.required' => 'El nombre del permiso es obligatorio.',
            'name.regex' => 'El permiso debe tener el formato grupo.accion.',
            'name.unique' => 'Este permiso ya existe.',
            'guard_name.required' => 'El guard es obligatorio.',
        ]);

        Permission::create($validated);

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso creado correctamente.');
    }

    /**
     * Mostrar formulario de edición.
     */
    public function edit(Permission $permiso)
    {
        return Inertia::render('security/permisos/edit', [
            'permission' => $permiso,
        ]);
    }

    /**
     * Actualizar permiso.
     */
    public function update(Request $request, Permission $permiso)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/',
                Rule::unique('security_permissions', 'name')
                    ->ignore($permiso->id),
            ],
            'guard_name' => [
                'required',
                'string',
                'max:255',
            ],
        ], [
            'name.required' => 'El nombre del permiso es obligatorio.',
            'name.regex' => 'El permiso debe tener el formato grupo.accion.',
            'name.unique' => 'Este permiso ya existe.',
            'guard_name.required' => 'El guard es obligatorio.',
        ]);

        $permiso->update($validated);

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso actualizado correctamente.');
    }

    /**
     * Eliminar permiso físicamente.
     */
    public function destroy(Permission $permiso)
    {
        $permiso->delete();

        return redirect()
            ->route('permisos.index')
            ->with('success', 'Permiso eliminado correctamente.');
    }
}

