<?php

use App\Http\Controllers\Security\SessionController;
use App\Models\Security\Permission;
use App\Models\User;
use App\Services\Security\SessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Inserta una fila en la tabla `sessions` simulando una sesión abierta.
 */
function insert_user_session(
    User $user,
    string $id,
    string $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    string $ipAddress = '127.0.0.1',
    ?int $lastActivity = null,
): void {
    DB::table('sessions')->insert([
        'id' => $id,
        'user_id' => $user->id,
        'ip_address' => $ipAddress,
        'user_agent' => $userAgent,
        'payload' => base64_encode('test'),
        'last_activity' => $lastActivity ?? now()->subMinutes(5)->getTimestamp(),
    ]);
}

beforeEach(function () {
    foreach (['sesiones.listar', 'sesiones.revocar', 'sesiones.administrar'] as $permission) {
        Permission::create(['name' => $permission]);
    }

    $this->admin = User::factory()
        ->create()
        ->givePermissionTo(['sesiones.listar', 'sesiones.revocar', 'sesiones.administrar']);
});

/*
|--------------------------------------------------------------------------
| Índice
|--------------------------------------------------------------------------
*/

test('el índice de sesiones exige el permiso sesiones.listar', function () {
    $this->actingAs(User::factory()->create())
        ->get('/sesiones')
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->get('/sesiones')
        ->assertOk();
});

test('el índice marca y coloca primero la sesión actual en mis sesiones', function () {
    $this->actingAs($this->admin)
        ->get('/sesiones')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('security/sesiones/index')
            ->has('mySessions', 1)
            ->where('mySessions.0.id', session()->getId())
            ->where('mySessions.0.is_current', true)
            ->where('canManageAll', true)
        );
});

test('el índice lista todas las sesiones del sistema para el administrador', function () {
    insert_user_session($this->admin, 'session-windows', lastActivity: now()->subMinutes(30)->getTimestamp());

    insert_user_session(
        $this->admin,
        'session-android',
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        '10.0.0.25',
        now()->subMinutes(2)->getTimestamp()
    );

    $otroUsuario = User::factory()->create(['name' => 'Otro Usuario', 'email' => 'otro@example.com']);
    insert_user_session($otroUsuario, 'session-otro-usuario');

    $this->actingAs($this->admin)
        ->get('/sesiones')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('security/sesiones/index')
            ->has('mySessions', 3)
            ->has('allSessions', 4)
            ->where('canManageAll', true)
        );
});

test('no duplica la sesión actual cuando el driver la registra en la tabla', function () {
    $service = app(SessionService::class);
    $request = Request::create('/sesiones', 'GET');
    $request->setLaravelSession(session()->driver());

    $currentId = $request->session()->getId();

    insert_user_session($this->admin, $currentId);
    insert_user_session($this->admin, 'otra-sesion');

    $sessions = $service->forUser($this->admin, $request);

    expect($sessions)->toHaveCount(2)
        ->and($sessions->first()['id'])->toBe($currentId)
        ->and($sessions->first()['is_current'])->toBeTrue()
        ->and($sessions->last()['id'])->toBe('otra-sesion')
        ->and($sessions->last()['is_current'])->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Revocar una sesión
|--------------------------------------------------------------------------
*/

test('revocar una sesión elimina solo esa fila', function () {
    insert_user_session($this->admin, 'session-a', lastActivity: now()->subMinutes(10)->getTimestamp());
    insert_user_session($this->admin, 'session-b', lastActivity: now()->subMinutes(20)->getTimestamp());

    $otro = User::factory()->create();
    insert_user_session($otro, 'session-c');

    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/session-a/revocar')
        ->assertRedirect('/sesiones')
        ->assertSessionHasNoErrors();

    expect(DB::table('sessions')->where('id', 'session-a')->exists())->toBeFalse()
        ->and(DB::table('sessions')->where('id', 'session-b')->exists())->toBeTrue()
        ->and(DB::table('sessions')->where('id', 'session-c')->exists())->toBeTrue();
});

test('no se puede revocar la sesión actual', function () {
    $controller = app(SessionController::class);
    $request = Request::create('/sesiones/current/revocar', 'POST');
    $request->setLaravelSession(session()->driver());
    $request->setUserResolver(fn () => $this->admin);

    $currentId = $request->session()->getId();
    insert_user_session($this->admin, $currentId);

    $response = $controller->revoke($request, $currentId);

    expect($response->isRedirect())->toBeTrue()
        ->and(session('errors')->has('revoke'))->toBeTrue()
        ->and(DB::table('sessions')->where('id', $currentId)->exists())->toBeTrue();
});

test('un administrador puede revocar sesiones de otros usuarios', function () {
    $otro = User::factory()->create();
    insert_user_session($otro, 'session-ajena');

    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/session-ajena/revocar')
        ->assertRedirect('/sesiones')
        ->assertSessionHasNoErrors();

    expect(DB::table('sessions')->where('id', 'session-ajena')->exists())->toBeFalse();
});

test('un usuario sin permiso administrativo no puede revocar sesiones de otros usuarios', function () {
    $regularUser = User::factory()->create()->givePermissionTo(['sesiones.listar', 'sesiones.revocar']);
    $otro = User::factory()->create();
    insert_user_session($otro, 'session-ajena-2');

    $this->actingAs($regularUser)
        ->from('/sesiones')
        ->post('/sesiones/session-ajena-2/revocar')
        ->assertRedirect('/sesiones')
        ->assertSessionHasErrors('revoke');

    expect(DB::table('sessions')->where('id', 'session-ajena-2')->exists())->toBeTrue();
});

test('no se puede revocar una sesión inexistente', function () {
    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/session-inexistente/revocar')
        ->assertRedirect('/sesiones')
        ->assertSessionHasErrors('revoke');
});

test('revocar una sesión exige el permiso sesiones.revocar', function () {
    $usuario = User::factory()->create()->givePermissionTo('sesiones.listar');

    insert_user_session($usuario, 'session-a');

    $this->actingAs($usuario)
        ->get('/sesiones')
        ->assertOk();

    $this->actingAs($usuario)
        ->post('/sesiones/session-a/revocar')
        ->assertForbidden();

    expect(DB::table('sessions')->where('id', 'session-a')->exists())->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Revocar todas las demás sesiones
|--------------------------------------------------------------------------
*/

test('cerrar todas las sesiones exige la contraseña actual', function () {
    insert_user_session($this->admin, 'session-a');

    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/revocar-todas')
        ->assertRedirect('/sesiones')
        ->assertSessionHasErrors('current_password');

    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/revocar-todas', [
            'current_password' => 'contrasena-incorrecta',
        ])
        ->assertRedirect('/sesiones')
        ->assertSessionHasErrors('current_password');

    expect(DB::table('sessions')->where('id', 'session-a')->exists())->toBeTrue();
});

test('cerrar todas las sesiones elimina las demás y conserva la actual', function () {
    insert_user_session($this->admin, 'session-a');
    insert_user_session($this->admin, 'session-b');

    $otro = User::factory()->create();
    insert_user_session($otro, 'session-c');

    $this->actingAs($this->admin)
        ->from('/sesiones')
        ->post('/sesiones/revocar-todas', [
            'current_password' => 'password',
        ])
        ->assertRedirect('/sesiones')
        ->assertSessionHasNoErrors();

    expect(DB::table('sessions')->where('id', 'session-a')->exists())->toBeFalse()
        ->and(DB::table('sessions')->where('id', 'session-b')->exists())->toBeFalse()
        ->and(DB::table('sessions')->where('id', 'session-c')->exists())->toBeTrue();
});

test('cerrar todas las sesiones exige el permiso sesiones.revocar', function () {
    $usuario = User::factory()->create()->givePermissionTo('sesiones.listar');

    $this->actingAs($usuario)
        ->post('/sesiones/revocar-todas', [
            'current_password' => 'password',
        ])
        ->assertForbidden();
});
