<?php

use App\Models\Security\FailedLoginAttempt;
use App\Models\Security\Permission;
use App\Models\User;
use App\Services\Security\FailedLoginService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    foreach (['intentos_fallidos.listar', 'intentos_fallidos.desbloquear', 'intentos_fallidos.limpiar'] as $permission) {
        Permission::create(['name' => $permission]);
    }

    $this->admin = User::factory()
        ->create(['email' => 'admin@test.com'])
        ->givePermissionTo(['intentos_fallidos.listar', 'intentos_fallidos.desbloquear', 'intentos_fallidos.limpiar']);
});

test('el listener registra un intento fallido cuando falla la autenticación', function () {
    Event::fake(Failed::class);

    expect(FailedLoginAttempt::count())->toBe(0);

    $this->post('/login', [
        'email' => 'usuario@test.com',
        'password' => 'incorrecta',
    ]);

    Event::assertDispatched(Failed::class);
});

test('el intento fallido se vincula al usuario si existe', function () {
    $user = User::factory()->create(['email' => 'existente@test.com']);
    $service = app(FailedLoginService::class);

    $attempt = $service->recordAttempt(
        email: 'existente@test.com',
        ip: '10.0.0.1',
        userAgent: null
    );

    expect($attempt->user_id)->toBe($user->id)
        ->and($attempt->user->email)->toBe('existente@test.com');
});

test('el intento fallido no tiene user_id si el email no existe', function () {
    $service = app(FailedLoginService::class);

    $attempt = $service->recordAttempt(
        email: 'noexiste@test.com',
        ip: '10.0.0.2',
        userAgent: null
    );

    expect($attempt->user_id)->toBeNull();
});

test('el índice de intentos fallidos exige el permiso intentos_fallidos.listar', function () {
    $this->actingAs(User::factory()->create())
        ->get('/intentos-fallidos')
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->get('/intentos-fallidos')
        ->assertOk();
});

test('el índice muestra la lista paginada de intentos fallidos', function () {
    $service = app(FailedLoginService::class);

    for ($i = 0; $i < 3; $i++) {
        $service->recordAttempt(
            email: "user{$i}@test.com",
            ip: "192.168.1.{$i}",
            userAgent: 'Mozilla/5.0'
        );
    }

    $this->actingAs($this->admin)
        ->get('/intentos-fallidos')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('security/intentos-fallidos/index')
            ->has('attempts.data', 3)
            ->has('metrics')
            ->where('metrics.total_24h', 3)
        );
});

test('consultar estado exige el permiso intentos_fallidos.desbloquear', function () {
    $user = User::factory()->create()->givePermissionTo('intentos_fallidos.listar');

    $this->actingAs($user)
        ->getJson('/intentos-fallidos/estado?email=test@test.com')
        ->assertForbidden();
});

test('consultar estado retorna IPs asociadas con intentos y estado de bloqueo', function () {
    $service = app(FailedLoginService::class);
    $email = 'bloqueado@test.com';
    $ip = '192.168.1.50';

    // Registrar intentos en la tabla
    for ($i = 0; $i < 3; $i++) {
        $service->recordAttempt($email, $ip);
    }

    // Bloquear el rate limiter
    for ($i = 0; $i < 6; $i++) {
        RateLimiter::hit($service->throttleKey($email, $ip), 60);
    }

    // Agregar otra IP con solo 2 intentos (no bloqueada)
    $ip2 = '10.0.0.1';
    $service->recordAttempt($email, $ip2);
    $service->recordAttempt($email, $ip2);

    $response = $this->actingAs($this->admin)
        ->getJson("/intentos-fallidos/estado?email={$email}");

    $response->assertOk()
        ->assertJsonPath('email', $email)
        ->assertJsonPath('total_attempts', 5)
        ->assertJsonCount(2, 'ips')
        ->assertJsonPath('locked_count', 1);

    // Verificar la IP bloqueada
    $ipData = collect($response->json('ips'))->first(fn ($ip) => $ip['ip'] === '192.168.1.50');
    expect($ipData['is_locked'])->toBeTrue();
});

test('consultar estado retorna array vacío cuando no hay intentos para el email', function () {
    $this->actingAs($this->admin)
        ->getJson('/intentos-fallidos/estado?email=noexiste@test.com')
        ->assertOk()
        ->assertJsonPath('email', 'noexiste@test.com')
        ->assertJsonPath('total_attempts', 0)
        ->assertJsonPath('locked_count', 0)
        ->assertJsonCount(0, 'ips');
});

test('desbloquear limpia el rate limiter para la combinación email e IP', function () {
    $service = app(FailedLoginService::class);
    $email = 'bloqueado@test.com';
    $ip = '192.168.1.50';

    for ($i = 0; $i < 6; $i++) {
        RateLimiter::hit($service->throttleKey($email, $ip), 60);
    }

    expect($service->isLocked($email, $ip))->toBeTrue();

    $this->actingAs($this->admin)
        ->post('/intentos-fallidos/desbloquear', ['email' => $email, 'ip' => $ip])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($service->isLocked($email, $ip))->toBeFalse();
});

test('desbloquear exige el permiso intentos_fallidos.desbloquear', function () {
    $user = User::factory()->create()->givePermissionTo('intentos_fallidos.listar');

    $this->actingAs($user)
        ->post('/intentos-fallidos/desbloquear', ['email' => 'test@test.com', 'ip' => '10.0.0.1'])
        ->assertForbidden();
});

test('limpiar historial elimina todos los registros si no se especifican días', function () {
    $service = app(FailedLoginService::class);

    for ($i = 0; $i < 5; $i++) {
        $service->recordAttempt(email: "user{$i}@test.com", ip: "10.0.0.{$i}", userAgent: null);
    }

    expect(FailedLoginAttempt::count())->toBe(5);

    $this->actingAs($this->admin)
        ->delete('/intentos-fallidos/limpiar')
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(FailedLoginAttempt::count())->toBe(0);
});

test('limpiar historial elimina solo registros anteriores a N días', function () {
    $service = app(FailedLoginService::class);

    $oldAttempt = $service->recordAttempt(email: 'old@test.com', ip: '10.0.0.1', userAgent: null);
    $oldAttempt->update(['created_at' => now()->subDays(10)]);

    $service->recordAttempt(email: 'recent@test.com', ip: '10.0.0.2', userAgent: null);

    expect(FailedLoginAttempt::count())->toBe(2);

    $this->actingAs($this->admin)
        ->delete('/intentos-fallidos/limpiar', ['days' => 7])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(FailedLoginAttempt::count())->toBe(1)
        ->and(FailedLoginAttempt::first()->email)->toBe('recent@test.com');
});

test('limpiar historial exige el permiso intentos_fallidos.limpiar', function () {
    $user = User::factory()->create()->givePermissionTo('intentos_fallidos.listar');

    $this->actingAs($user)
        ->delete('/intentos-fallidos/limpiar')
        ->assertForbidden();
});

test('las métricas calculan correctamente el total de intentos en 24h', function () {
    $service = app(FailedLoginService::class);

    for ($i = 0; $i < 3; $i++) {
        $service->recordAttempt(email: "user{$i}@test.com", ip: "10.0.0.{$i}", userAgent: null);
    }

    $oldAttempt = $service->recordAttempt(email: 'old@test.com', ip: '10.0.0.99', userAgent: null);
    $oldAttempt->update(['created_at' => now()->subHours(25)]);

    $metrics = $service->getMetrics();

    expect($metrics['total_24h'])->toBe(3)
        ->and($metrics['unique_emails_24h'])->toBe(3)
        ->and($metrics['unique_ips_24h'])->toBe(3);
});

test('las métricas identifican la IP y el email con más intentos', function () {
    $service = app(FailedLoginService::class);

    for ($i = 0; $i < 5; $i++) {
        $service->recordAttempt(email: 'atacante@test.com', ip: '192.168.1.100', userAgent: null);
    }

    $service->recordAttempt(email: 'otro@test.com', ip: '10.0.0.1', userAgent: null);

    $metrics = $service->getMetrics();

    expect($metrics['top_ip'])->not->toBeNull()
        ->and($metrics['top_ip']['ip'])->toBe('192.168.1.100')
        ->and($metrics['top_ip']['count'])->toBe(5)
        ->and($metrics['top_email'])->not->toBeNull()
        ->and($metrics['top_email']['email'])->toBe('atacante@test.com')
        ->and($metrics['top_email']['count'])->toBe(5);
});
