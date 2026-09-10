<?php

use App\Http\Controllers\Security\MenuController;
use App\Http\Controllers\Security\PermissionController;
use App\Http\Controllers\Security\RoleController;
use App\Http\Controllers\Security\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    Route::get('/security/menus', [MenuController::class, 'index'])
        ->name('security.menus.index');

    Route::get('/security/menus', [MenuController::class, 'index'])
        ->middleware('permission:menus.listar')
        ->name('menus.index');

    Route::get('/security/menus/create', [MenuController::class, 'create'])
        ->middleware('permission:menus.crear')
        ->name('menus.create');

    Route::post('/security/menus', [MenuController::class, 'store'])
        ->middleware('permission:menus.crear')
        ->name('menus.store');

    Route::get('/security/menus/{menu}/edit', [MenuController::class, 'edit'])
        ->middleware('permission:menus.editar')
        ->name('menus.edit');

    Route::put('/security/menus/{menu}', [MenuController::class, 'update'])
        ->middleware('permission:menus.editar')
        ->name('menus.update');

    Route::delete('/security/menus/{menu}', [MenuController::class, 'destroy'])
        ->middleware('permission:menus.eliminar')
        ->name('menus.destroy');

    // Rutas para la gestión de usuarios
    Route::get('/usuarios', [UserController::class, 'index'])
        ->middleware('permission:usuarios.listar')
        ->name('usuarios.index');

    Route::get('/usuarios/create', [UserController::class, 'create'])
        ->middleware('permission:usuarios.crear')
        ->name('usuarios.create');

    Route::post('/usuarios', [UserController::class, 'store'])
        ->middleware('permission:usuarios.crear')
        ->name('usuarios.store');

    Route::get('/usuarios/{usuario}/edit', [UserController::class, 'edit'])
        ->middleware('permission:usuarios.editar')
        ->name('usuarios.edit');

    Route::put('/usuarios/{usuario}', [UserController::class, 'update'])
        ->middleware('permission:usuarios.editar')
        ->name('usuarios.update');

    Route::delete('/usuarios/{usuario}', [UserController::class, 'destroy'])
        ->middleware('permission:usuarios.eliminar')
        ->name('usuarios.destroy');

    // Rutas para la gestión de roles
    Route::get('/roles', [RoleController::class, 'index'])
        ->name('roles.index')
        ->middleware('permission:roles.listar');

    Route::get('/roles/create', [RoleController::class, 'create'])
        ->name('roles.create')
        ->middleware('permission:roles.crear');

    Route::post('/roles', [RoleController::class, 'store'])
        ->name('roles.store')
        ->middleware('permission:roles.crear');

    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])
        ->name('roles.edit')
        ->middleware('permission:roles.editar');

    Route::put('/roles/{role}', [RoleController::class, 'update'])
        ->name('roles.update')
        ->middleware('permission:roles.editar');

    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
        ->name('roles.destroy')
        ->middleware('permission:roles.eliminar');

    // Rutas para la gestión de permisos
    Route::get('/permisos', [PermissionController::class, 'index'])
        ->middleware('permission:permisos.listar')
        ->name('permisos.index');

    Route::get('/permisos/create', [PermissionController::class, 'create'])
        ->middleware('permission:permisos.crear')
        ->name('permisos.create');

    Route::post('/permisos', [PermissionController::class, 'store'])
        ->middleware('permission:permisos.crear')
        ->name('permisos.store');

    Route::get('/permisos/{permiso}/edit', [PermissionController::class, 'edit'])
        ->middleware('permission:permisos.editar')
        ->name('permisos.edit');

    Route::put('/permisos/{permiso}', [PermissionController::class, 'update'])
        ->middleware('permission:permisos.editar')
        ->name('permisos.update');

    Route::delete('/permisos/{permiso}', [PermissionController::class, 'destroy'])
        ->middleware('permission:permisos.eliminar')
        ->name('permisos.destroy');
});
