<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'email_verified_at',
                'created_at',
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('security/usuarios/index', [
            'users' => $users,
        ]);
    }


    public function create(): Response
    {
        return Inertia::render('security/usuarios/create', [
            'roles' => Role::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                ]),

            'permissions' => Permission::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                ]),
        ]);
    }


    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'roles' => [
                'nullable',
                'array',
            ],

            'roles.*' => [
                'integer',
                'exists:security_roles,id',
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

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        /*
         * ROLES
         *
         * Son independientes de los permisos directos.
         */
        $user->syncRoles(
            Role::whereIn(
                'id',
                $validated['roles'] ?? []
            )->get()
        );

        /*
         * PERMISOS DIRECTOS
         *
         * También son independientes de los roles.
         */
        $user->syncPermissions(
            Permission::whereIn(
                'id',
                $validated['permissions'] ?? []
            )->get()
        );

        return to_route('usuarios.index')
            ->with('success', 'Usuario creado correctamente.');
    }

    public function edit(User $usuario): Response
    {
        return Inertia::render('security/usuarios/edit', [
            'user' => [
                'id' => $usuario->id,
                'name' => $usuario->name,
                'email' => $usuario->email,
            ],

            'roles' => Role::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                ]),

            'permissions' => Permission::query()
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                ]),

            'selectedRoles' => $usuario->roles
                ->pluck('id')
                ->values(),

            'selectedPermissions' => $usuario->permissions
                ->pluck('id')
                ->values(),
        ]);
    }

    public function update(
        Request $request,
        User $usuario
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email,' . $usuario->id,
            ],

            'password' => [
                'nullable',
                'string',
                'min:8',
                'confirmed',
            ],

            'roles' => [
                'nullable',
                'array',
            ],

            'roles.*' => [
                'integer',
                'exists:security_roles,id',
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

        $usuario->name = $validated['name'];
        $usuario->email = $validated['email'];

        if (!empty($validated['password'])) {
            $usuario->password = Hash::make(
                $validated['password']
            );
        }

        $usuario->save();

        $usuario->syncRoles(
            Role::whereIn(
                'id',
                $validated['roles'] ?? []
            )->get()
        );

        $usuario->syncPermissions(
            Permission::whereIn(
                'id',
                $validated['permissions'] ?? []
            )->get()
        );

        return to_route('usuarios.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(User $usuario): RedirectResponse
    {
        $usuario->delete();

        return to_route('usuarios.index')
            ->with('success', 'Usuario eliminado correctamente.');
    }

    /**
     * Agrupa los permisos por módulo.
     *
     * Ejemplo:
     *
     * usuarios.listar
     * usuarios.crear
     * usuarios.editar
     *
     * se convierte en:
     *
     * usuarios => [
     *     usuarios.listar,
     *     usuarios.crear,
     *     usuarios.editar
     * ]
     */
    private function groupPermissions($permissions): array
    {
        return $permissions
            ->groupBy(function ($permission) {
                return explode('.', $permission->name)[0];
            })
            ->map(function ($items, $module) {
                return [
                    'module' => $module,
                    'permissions' => $items
                        ->map(fn ($permission) => [
                            'id' => $permission->id,
                            'name' => $permission->name,
                        ])
                        ->values()
                        ->toArray(),
                ];
            })
            ->values()
            ->toArray();
    }
}
