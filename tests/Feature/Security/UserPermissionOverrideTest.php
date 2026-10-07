<?php

use App\Models\Security\Permission;
use App\Models\Security\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    foreach ([
        'usuarios.listar',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.eliminar',
        'productos.listar',
        'productos.editar',
    ] as $permission) {
        Permission::create(['name' => $permission]);
    }

    $this->admin = User::factory()
        ->create()
        ->givePermissionTo([
            'usuarios.listar',
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',
        ]);
});

test('sin roles ni asignación directa el usuario no tiene el permiso', function () {
    $usuario = User::factory()->create();

    expect($usuario->can('productos.listar'))->toBeFalse();
});

test('el permiso del rol se respeta cuando no hay override', function () {
    $rol = Role::create(['name' => 'Vendedor']);
    $rol->syncPermissions(['productos.listar', 'productos.editar']);

    $usuario = User::factory()->create();
    $usuario->assignRole($rol);

    expect($usuario->can('productos.listar'))->toBeTrue()
        ->and($usuario->can('productos.editar'))->toBeTrue();
});

test('el allow directo otorga un permiso que el rol no tiene', function () {
    $usuario = User::factory()->create();
    $usuario->givePermissionTo('productos.editar');

    expect($usuario->can('productos.editar'))->toBeTrue()
        ->and($usuario->can('productos.listar'))->toBeFalse();
});

test('el deny directo anula el permiso otorgado por el rol', function () {
    $rol = Role::create(['name' => 'Vendedor']);
    $rol->syncPermissions(['productos.listar']);

    $usuario = User::factory()->create();
    $usuario->assignRole($rol);

    expect($usuario->can('productos.listar'))->toBeTrue();

    $usuario->syncPermissionsWithStatus(
        [],
        [Permission::where('name', 'productos.listar')->value('id')]
    );

    expect($usuario->can('productos.listar'))->toBeFalse()
        ->and($usuario->deniedPermissionIds())->toHaveCount(1);
});

test('hasDirectPermission ignora los permisos denegados', function () {
    $usuario = User::factory()->create();

    $usuario->syncPermissionsWithStatus(
        [Permission::where('name', 'productos.listar')->value('id')],
        [Permission::where('name', 'productos.editar')->value('id')]
    );

    expect($usuario->fresh()->hasDirectPermission('productos.listar'))->toBeTrue()
        ->and($usuario->fresh()->hasDirectPermission('productos.editar'))->toBeFalse();
});

test('el deny gana cuando el permiso llega como allow y deny a la vez', function () {
    $usuario = User::factory()->create();
    $permission = Permission::where('name', 'productos.listar')->first();

    $usuario->syncPermissionsWithStatus([$permission->id], [$permission->id]);

    expect($usuario->permissions()->count())->toBe(1)
        ->and($usuario->permissionStatus($permission->id))->toBeTrue()
        ->and($usuario->can('productos.listar'))->toBeFalse();
});

test('getAllPermissions excluye los denegados y conserva los demás', function () {
    $rol = Role::create(['name' => 'Supervisor']);
    $rol->syncPermissions(['productos.listar', 'productos.editar']);

    $usuario = User::factory()->create();
    $usuario->assignRole($rol);

    $usuario->syncPermissionsWithStatus(
        [Permission::where('name', 'usuarios.listar')->value('id')],
        [Permission::where('name', 'productos.editar')->value('id')]
    );

    $nombres = $usuario->getAllPermissions()->pluck('name');

    expect($nombres)->toContain('usuarios.listar')
        ->toContain('productos.listar')
        ->not->toContain('productos.editar');
});

test('permissionStatus distingue sin asignar, permitido y denegado', function () {
    $permitido = Permission::where('name', 'productos.listar')->first();
    $denegado = Permission::where('name', 'productos.editar')->first();
    $sinAsignar = Permission::where('name', 'usuarios.eliminar')->first();

    $usuario = User::factory()->create();
    $usuario->syncPermissionsWithStatus([$permitido->id], [$denegado->id]);

    expect($usuario->permissionStatus($permitido->id))->toBeFalse()
        ->and($usuario->permissionStatus($denegado->id))->toBeTrue()
        ->and($usuario->permissionStatus($sinAsignar->id))->toBeNull();
});
test('deniedPermissionIds devuelve solo los permisos denegados', function () {
    $usuario = User::factory()->create();

    $usuario->syncPermissionsWithStatus(
        [Permission::where('name', 'productos.listar')->value('id')],
        [Permission::where('name', 'productos.editar')->value('id')]
    );

    expect($usuario->deniedPermissionIds())
        ->toHaveCount(1)
        ->toContain(Permission::where('name', 'productos.editar')->value('id'))
        ->not->toContain(Permission::where('name', 'productos.listar')->value('id'));
});

test('syncPermissionsWithStatus reemplaza los permisos directos anteriores', function () {
    $usuario = User::factory()->create();
    $usuario->givePermissionTo('productos.listar');

    expect($usuario->fresh()->hasDirectPermission('productos.listar'))->toBeTrue();

    $usuario->syncPermissionsWithStatus(
        [Permission::where('name', 'productos.editar')->value('id')],
        [Permission::where('name', 'productos.listar')->value('id')]
    );

    expect($usuario->permissions()->count())->toBe(2)
        ->and($usuario->fresh()->can('productos.listar'))->toBeFalse()
        ->and($usuario->fresh()->can('productos.editar'))->toBeTrue();
});

test('el índice de usuarios exige el permiso usuarios.listar', function () {
    $this->actingAs(User::factory()->create())
        ->get('/usuarios')
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->get('/usuarios')
        ->assertOk();
});

test('store sincroniza los permisos directos con su estado allow/deny', function () {
    $permitido = Permission::where('name', 'productos.listar')->first();
    $denegado = Permission::where('name', 'productos.editar')->first();

    $this->actingAs($this->admin)->post('/usuarios', [
        'name' => 'Nuevo Usuario',
        'email' => 'nuevo@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'permissions' => [$permitido->id],
        'denied_permissions' => [$denegado->id],
    ])->assertRedirect('/usuarios');

    $usuario = User::where('email', 'nuevo@example.com')->firstOrFail();

    expect($usuario->permissionStatus($permitido->id))->toBeFalse()
        ->and($usuario->permissionStatus($denegado->id))->toBeTrue()
        ->and($usuario->can('productos.listar'))->toBeTrue()
        ->and($usuario->can('productos.editar'))->toBeFalse();
});

test('store rechaza un permiso inexistente', function () {
    $this->actingAs($this->admin)->post('/usuarios', [
        'name' => 'Nuevo Usuario',
        'email' => 'nuevo@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'permissions' => [999999],
    ])->assertSessionHasErrors('permissions.0');
});

test('update reemplaza los permisos directos del usuario', function () {
    $permitido = Permission::where('name', 'productos.listar')->first();
    $denegado = Permission::where('name', 'productos.editar')->first();
    $usuario = User::factory()->create();
    $usuario->givePermissionTo('productos.listar');

    $this->actingAs($this->admin)->put("/usuarios/{$usuario->id}", [
        'name' => $usuario->name,
        'email' => $usuario->email,
        'permissions' => [$permitido->id],
        'denied_permissions' => [$denegado->id],
    ])->assertRedirect('/usuarios');

    $usuario->refresh();

    expect($usuario->permissionStatus($permitido->id))->toBeFalse()
        ->and($usuario->permissionStatus($denegado->id))->toBeTrue()
        ->and($usuario->can('productos.listar'))->toBeTrue()
        ->and($usuario->can('productos.editar'))->toBeFalse();
});

test('edit expone los permisos denegados para el selector triestado', function () {
    $permitido = Permission::where('name', 'productos.listar')->first();
    $denegado = Permission::where('name', 'productos.editar')->first();
    $usuario = User::factory()->create();
    $usuario->syncPermissionsWithStatus([$permitido->id], [$denegado->id]);

    $this->actingAs($this->admin)
        ->get("/usuarios/{$usuario->id}/edit")
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('security/usuarios/edit')
                ->has('deniedPermissions', 1)
                ->has('selectedPermissions', 2)
        );
});
