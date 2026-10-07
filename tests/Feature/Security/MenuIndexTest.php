<?php

use App\Enums\Security\MenuType;
use App\Models\Security\Menu;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    foreach (['menus.listar', 'menus.crear', 'menus.editar', 'menus.eliminar'] as $permission) {
        Permission::create(['name' => $permission]);
    }

    $user = User::factory()->create()->givePermissionTo([
        'menus.listar',
        'menus.crear',
        'menus.editar',
        'menus.eliminar',
    ]);

    $this->actingAs($user);
});

test('el índice muestra el árbol completo de menús', function () {
    $section = Menu::factory()->section()->create(['name' => 'Sistema']);
    Menu::factory()->create(['name' => 'Usuarios', 'parent_id' => $section->id]);
    Menu::factory()->group()->create(['name' => 'Reportes']);

    $this->get('/menus')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('security/menu/index')
                ->has('menus', 2)
                ->where('menus.0.name', 'Sistema')
                ->has('permissions')
                ->has('routeSuggestions')
        );
});

test('store crea un menú y normaliza slug y ruta', function () {
    $section = Menu::factory()->section()->create();

    $this->from('/menus')->post('/menus', [
        'name' => 'Productos',
        'slug' => '',
        'route' => 'productos',
        'type' => MenuType::MENU->value,
        'parent_id' => $section->id,
    ])->assertRedirect('/menus');

    $menu = Menu::where('name', 'Productos')->first();

    expect($menu)->not->toBeNull()
        ->and($menu->slug)->toBe('productos')
        ->and($menu->route)->toBe('/productos')
        ->and($menu->sort_order)->toBe(0)
        ->and($menu->parent_id)->toBe($section->id);
});

test('store coloca el menú al final de sus hermanos', function () {
    $section = Menu::factory()->section()->create();

    Menu::factory()->create(['parent_id' => $section->id, 'sort_order' => 1]);
    Menu::factory()->create(['parent_id' => $section->id, 'sort_order' => 2]);

    $this->from('/menus')->post('/menus', [
        'name' => 'Último',
        'slug' => 'ultimo',
        'route' => '/ultimo',
        'type' => MenuType::MENU->value,
        'parent_id' => $section->id,
    ])->assertRedirect('/menus');

    expect(Menu::where('name', 'Último')->first()->sort_order)->toBe(3);
});

test('store rechaza un menú cuyo padre es un menú', function () {
    $parent = Menu::factory()->create();

    $this->from('/menus')->post('/menus', [
        'name' => 'Inválido',
        'slug' => 'invalido',
        'route' => '/invalido',
        'type' => MenuType::MENU->value,
        'parent_id' => $parent->id,
    ])->assertRedirect('/menus')
        ->assertSessionHasErrors('parent_id');
});

test('update normaliza la ruta y conserva el orden actual', function () {
    $menu = Menu::factory()->route('/usuarios')->create(['sort_order' => 2]);

    $this->from('/menus')->put("/menus/{$menu->id}", [
        'name' => 'Roles',
        'slug' => 'roles',
        'route' => 'roles',
        'type' => MenuType::MENU->value,
        'parent_id' => null,
        'is_active' => true,
    ])->assertRedirect('/menus');

    $menu->refresh();

    expect($menu->route)->toBe('/roles')
        ->and($menu->sort_order)->toBe(2);
});

test('move intercambia la posición con su hermano', function () {
    $group = Menu::factory()->group()->create();
    $first = Menu::factory()->create(['parent_id' => $group->id, 'sort_order' => 1]);
    $second = Menu::factory()->create(['parent_id' => $group->id, 'sort_order' => 2]);

    $this->from('/menus')->patch("/menus/{$second->id}/move", [
        'direction' => 'up',
    ])->assertRedirect('/menus');

    expect($first->fresh()->sort_order)->toBe(2)
        ->and($second->fresh()->sort_order)->toBe(1);
});

test('move no modifica el orden en los extremos', function () {
    $menu = Menu::factory()->create(['sort_order' => 1]);

    $this->from('/menus')->patch("/menus/{$menu->id}/move", [
        'direction' => 'up',
    ])->assertRedirect('/menus');

    expect($menu->fresh()->sort_order)->toBe(1);
});

test('no permite eliminar un grupo con hijos', function () {
    $group = Menu::factory()->group()->create();
    Menu::factory()->create(['parent_id' => $group->id]);

    $this->from('/menus')->delete("/menus/{$group->id}")
        ->assertRedirect('/menus')
        ->assertSessionHasErrors('delete');

    expect(Menu::find($group->id))->not->toBeNull();
});

test('permite eliminar un menú hoja', function () {
    $menu = Menu::factory()->create();

    $this->from('/menus')->delete("/menus/{$menu->id}")->assertRedirect('/menus');

    expect(Menu::find($menu->id))->toBeNull();
});
