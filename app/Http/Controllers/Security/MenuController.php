<?php

namespace App\Http\Controllers\Security;

use App\Enums\Security\MenuType;
use App\Http\Controllers\Controller;
use App\Models\Security\Menu;
use App\Services\Security\MenuService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuService $menuService
    ) {
    }

    /**
     * Árbol de menú para el usuario autenticado.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $menus = $this->menuService->getTreeForUser($user);

        return Inertia::render('security/menu/index', [
            'menus' => $menus,
        ]);
    }

    /**
     * Formulario para crear un menú.
     */
    public function create(): Response
    {
        $groups = Menu::query()
            ->where('type', MenuType::GROUP->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        $permissions = Permission::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        return Inertia::render('security/menu/create', [
            'groups' => $groups,
            'permissions' => $permissions,
            'types' => [
                [
                    'value' => MenuType::GROUP->value,
                    'label' => 'Grupo',
                ],
                [
                    'value' => MenuType::MENU->value,
                    'label' => 'Menú',
                ],
            ],
        ]);
    }

    /**
     * Guardar un menú.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => [
                'nullable',
                'integer',
                'exists:security_menus,id',
            ],

            'permission_id' => [
                'nullable',
                'integer',
                'exists:security_permissions,id',
            ],

            'name' => [
                'required',
                'string',
                'max:100',
            ],

            'slug' => [
                'required',
                'string',
                'max:255',
                'unique:security_menus,slug',
            ],

            'route' => [
                'nullable',
                'string',
                'max:255',
            ],

            'icon' => [
                'nullable',
                'string',
                'max:100',
            ],

            'type' => [
                'required',
                'string',
                'in:section,group,menu',
            ],

            'sort_order' => [
                'required',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        /*
         * Los grupos son elementos raíz.
         */
        if (
            in_array(
                $validated['type'],
                [MenuType::SECTION->value, MenuType::GROUP->value],
                true
            )
        ) {
            $validated['parent_id'] = null;
            $validated['permission_id'] = null;
            $validated['route'] = null;
        }

        /*
         * Si es un menú, su padre solamente
         * puede ser una SECTION o GROUP.
         */
        if (
            $validated['type'] === MenuType::MENU->value &&
            !empty($validated['parent_id'])
        ) {
            $parent = Menu::find($validated['parent_id']);

            if (
                !$parent ||
                !in_array(
                    $parent->type->value,
                    [MenuType::SECTION->value, MenuType::GROUP->value],
                    true
                )
            ) {
                return back()
                    ->withErrors([
                        'parent_id' =>
                            'El padre seleccionado debe ser una sección o grupo.',
                    ])
                    ->withInput();
            }
        }

        Menu::create($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú creado correctamente.');
    }

    /**
     * Formulario para editar un menú.
     */
    public function edit(Menu $menu): Response
    {
        $groups = Menu::query()
            ->where('type', MenuType::GROUP->value)
            ->where('id', '!=', $menu->id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        $permissions = Permission::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        return Inertia::render('security/menu/edit', [
            'menu' => [
                'id' => $menu->id,
                'parent_id' => $menu->parent_id,
                'permission_id' => $menu->permission_id,
                'name' => $menu->name,
                'slug' => $menu->slug,
                'route' => $menu->route,
                'icon' => $menu->icon,
                'type' => $menu->type->value,
                'sort_order' => $menu->sort_order,
                'is_active' => $menu->is_active,
            ],

            'groups' => $groups,

            'permissions' => $permissions,

            'types' => [
                [
                    'value' => MenuType::GROUP->value,
                    'label' => 'Grupo',
                ],
                [
                    'value' => MenuType::MENU->value,
                    'label' => 'Menú',
                ],
            ],
        ]);
    }

    /**
     * Actualizar un menú.
     */
    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'parent_id' => [
                'nullable',
                'integer',
                'exists:security_menus,id',
            ],

            'permission_id' => [
                'nullable',
                'integer',
                'exists:security_permissions,id',
            ],

            'name' => [
                'required',
                'string',
                'max:100',
            ],

            'slug' => [
                'required',
                'string',
                'max:255',
                'unique:security_menus,slug,' . $menu->id,
            ],

            'route' => [
                'nullable',
                'string',
                'max:255',
            ],

            'icon' => [
                'nullable',
                'string',
                'max:100',
            ],

            'type' => [
                'required',
                'string',
                'in:section,group,menu',
            ],

            'sort_order' => [
                'required',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        /*
         * Un menú no puede ser su propio padre.
         */
        if (
            !empty($validated['parent_id']) &&
            (int) $validated['parent_id'] === $menu->id
        ) {
            return back()
                ->withErrors([
                    'parent_id' =>
                        'El menú no puede ser su propio padre.',
                ])
                ->withInput();
        }

        /*
         * Los grupos no tienen padre,
         * permiso ni ruta.
         */
        if (
            in_array(
                $validated['type'],
                [MenuType::SECTION->value, MenuType::GROUP->value],
                true
            )
        ) {
            $validated['parent_id'] = null;
            $validated['permission_id'] = null;
            $validated['route'] = null;
        }

        /*
         * El padre de un MENU solamente puede
         * ser una SECTION o GROUP.
         */
        if (
            $validated['type'] === MenuType::MENU->value &&
            !empty($validated['parent_id'])
        ) {
            $parent = Menu::find($validated['parent_id']);

            if (
                !$parent ||
                !in_array(
                    $parent->type->value,
                    [MenuType::SECTION->value, MenuType::GROUP->value],
                    true
                )
            ) {
                return back()
                    ->withErrors([
                        'parent_id' =>
                            'El padre seleccionado debe ser una sección o grupo.',
                    ])
                    ->withInput();
            }
        }

        /*
         * No permitir convertir un GROUP con hijos
         * en MENU.
         */
        if (
            in_array(
                $menu->type->value,
                [MenuType::SECTION->value, MenuType::GROUP->value],
                true
            ) &&
            $validated['type'] === MenuType::MENU->value &&
            $menu->children()->exists()
        ) {
            return back()
                ->withErrors([
                    'type' =>
                        'No puedes convertir este grupo en menú porque tiene elementos hijos.',
                ])
                ->withInput();
        }

        $menu->update($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú actualizado correctamente.');
    }

    /**
     * Eliminar un menú.
     */
    public function destroy(Menu $menu)
    {
        /*
         * No permitir eliminar un grupo
         * que tenga menús hijos.
         */
        if ($menu->children()->exists()) {
            return back()
                ->withErrors([
                    'delete' =>
                        'No puedes eliminar este grupo porque contiene menús.',
                ]);
        }

        $menu->delete();

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú eliminado correctamente.');
    }
}
