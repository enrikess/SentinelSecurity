<?php

namespace App\Http\Controllers\Security;

use App\Enums\Security\MenuType;
use App\Http\Controllers\Controller;
use App\Models\Security\Menu;
use App\Services\Security\MenuService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuService $menuService
    ) {}

    /**
     * Árbol completo del menú para su gestión.
     */
    public function index(): Response
    {
        $menus = $this->menuService->getFullTree();

        $permissions = Permission::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
            ]);

        return Inertia::render('security/menu/index', [
            'menus' => $menus,
            'permissions' => $permissions,
            'routeSuggestions' => $this->routeSuggestions(),
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
                'nullable',
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
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        /*
         * Las secciones y grupos son elementos raíz.
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
            ! empty($validated['parent_id'])
        ) {
            $parent = Menu::find($validated['parent_id']);

            if (
                ! $parent ||
                ! in_array(
                    $parent->type->value,
                    [MenuType::SECTION->value, MenuType::GROUP->value],
                    true
                )
            ) {
                return back()
                    ->withErrors([
                        'parent_id' => 'El padre seleccionado debe ser una sección o grupo.',
                    ])
                    ->withInput();
            }
        }

        $validated = $this->normalize($validated);

        /*
         * Si no se indica, se coloca al final
         * dentro de sus hermanos.
         */
        if (! isset($validated['sort_order'])) {
            $validated['sort_order'] = $this->nextSortOrder(
                $validated['parent_id'] ?? null
            );
        }

        Menu::create($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú creado correctamente.');
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
                'nullable',
                'string',
                'max:255',
                'unique:security_menus,slug,'.$menu->id,
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
                'nullable',
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
            ! empty($validated['parent_id']) &&
            (int) $validated['parent_id'] === $menu->id
        ) {
            return back()
                ->withErrors([
                    'parent_id' => 'El menú no puede ser su propio padre.',
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
            ! empty($validated['parent_id'])
        ) {
            $parent = Menu::find($validated['parent_id']);

            if (
                ! $parent ||
                ! in_array(
                    $parent->type->value,
                    [MenuType::SECTION->value, MenuType::GROUP->value],
                    true
                )
            ) {
                return back()
                    ->withErrors([
                        'parent_id' => 'El padre seleccionado debe ser una sección o grupo.',
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
                    'type' => 'No puedes convertir este grupo en menú porque tiene elementos hijos.',
                ])
                ->withInput();
        }

        $validated = $this->normalize($validated);

        if (! isset($validated['sort_order'])) {
            $validated['sort_order'] = $menu->sort_order;
        }

        $menu->update($validated);

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú actualizado correctamente.');
    }

    /**
     * Reordenar un menú dentro de sus hermanos.
     */
    public function move(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'direction' => [
                'required',
                'string',
                'in:up,down',
            ],
        ]);

        $siblings = Menu::query()
            ->where('parent_id', $menu->parent_id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $index = $siblings->search(
            fn (Menu $sibling) => $sibling->id === $menu->id
        );

        if ($index === false) {
            return back()
                ->withErrors([
                    'move' => 'No se pudo encontrar el elemento a mover.',
                ]);
        }

        $neighborIndex = $validated['direction'] === 'up'
            ? $index - 1
            : $index + 1;

        if ($neighborIndex < 0 || $neighborIndex >= $siblings->count()) {
            return back();
        }

        $neighbor = $siblings[$neighborIndex];

        DB::transaction(function () use ($menu, $neighbor) {
            Menu::where('id', $menu->id)->update([
                'sort_order' => $neighbor->sort_order,
            ]);

            Menu::where('id', $neighbor->id)->update([
                'sort_order' => $menu->sort_order,
            ]);
        });

        return redirect()
            ->route('menus.index')
            ->with('success', 'Orden del menú actualizado correctamente.');
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
                    'delete' => 'No puedes eliminar este grupo porque contiene menús.',
                ]);
        }

        $menu->delete();

        return redirect()
            ->route('menus.index')
            ->with('success', 'Menú eliminado correctamente.');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Normaliza el slug y la ruta antes de guardar:
     * el slug se genera a partir del nombre si viene vacío
     * y la ruta siempre inicia con "/".
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function normalize(array $validated): array
    {
        $validated['slug'] = blank($validated['slug'])
            ? Str::slug($validated['name'])
            : $validated['slug'];

        if (blank($validated['route'] ?? null)) {
            $validated['route'] = null;
        } else {
            $validated['route'] = '/'.ltrim($validated['route'], '/');
        }

        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        return $validated;
    }

    /**
     * Siguiente posición disponible dentro de un mismo padre.
     */
    private function nextSortOrder(?int $parentId): int
    {
        return (Menu::query()
            ->where('parent_id', $parentId)
            ->max('sort_order') ?? -1) + 1;
    }

    /**
     * Sugerencias de rutas al crear/editar un menú:
     * combina las rutas registradas de la aplicación
     * con las rutas ya usadas por otros menús.
     *
     * @return array<int, string>
     */
    private function routeSuggestions(): array
    {
        $registeredRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(
                fn ($route) => in_array('GET', $route->methods(), true)
            )
            ->map(fn ($route) => '/'.ltrim($route->uri(), '/'))
            ->filter(
                fn (string $uri) => ! str_contains($uri, '{')
                    && ! str_contains($uri, '_')
            )
            ->values();

        $menuRoutes = Menu::query()
            ->whereNotNull('route')
            ->pluck('route');

        $excluded = [
            '/',
            '/login',
            '/register',
            '/forgot-password',
            '/confirm-password',
            '/verify-email',
            '/dashboard',
        ];

        return collect($registeredRoutes)
            ->concat($menuRoutes)
            ->filter(
                fn (string $route) => ! in_array($route, $excluded, true)
            )
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
