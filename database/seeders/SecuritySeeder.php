<?php

namespace Database\Seeders;

use App\Models\Security\Permission;
use App\Models\Security\Role;
use Illuminate\Database\Seeder;

class SecuritySeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            /*
            |--------------------------------------------------------------------------
            | USUARIOS
            |--------------------------------------------------------------------------
            */
            'usuarios.listar',
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',

            /*
            |--------------------------------------------------------------------------
            | ROLES
            |--------------------------------------------------------------------------
            */
            'roles.listar',
            'roles.crear',
            'roles.editar',
            'roles.eliminar',

            /*
            |--------------------------------------------------------------------------
            | MENU
            |--------------------------------------------------------------------------
            */
            'menus.listar',
            'menus.crear',
            'menus.editar',
            'menus.eliminar',
            /*
            |--------------------------------------------------------------------------
            | PRODUCTOS
            |--------------------------------------------------------------------------
            */
            'productos.listar',
            'productos.crear',
            'productos.editar',
            'productos.eliminar',
            /*
            |--------------------------------------------------------------------------
            | PERMISOS
            |--------------------------------------------------------------------------
            */
            'permisos.listar',
            'permisos.crear',
            'permisos.editar',
            'permisos.eliminar',

            /*
            |--------------------------------------------------------------------------
            | CATEGORÍAS
            |--------------------------------------------------------------------------
            */
            'categorias.listar',
            'categorias.crear',
            'categorias.editar',
            'categorias.eliminar',

            /*
            |--------------------------------------------------------------------------
            | MARCAS
            |--------------------------------------------------------------------------
            */
            'marcas.listar',
            'marcas.crear',
            'marcas.editar',
            'marcas.eliminar',

            /*
            |--------------------------------------------------------------------------
            | INVENTARIO
            |--------------------------------------------------------------------------
            */
            'inventario.listar',
            'inventario.crear',
            'inventario.editar',
            'inventario.eliminar',

            /*
            |--------------------------------------------------------------------------
            | STOCK
            |--------------------------------------------------------------------------
            */
            'stock.listar',
            'stock.ajustar',

            /*
            |--------------------------------------------------------------------------
            | MOVIMIENTOS
            |--------------------------------------------------------------------------
            */
            'movimientos.listar',
            'movimientos.crear',

            /*
            |--------------------------------------------------------------------------
            | REPORTES
            |--------------------------------------------------------------------------
            */
            'reportes.ventas',
            'reportes.inventario',
            'reportes.usuarios',

            /*
            |--------------------------------------------------------------------------
            | SESIONES
            |--------------------------------------------------------------------------
            */
            'sesiones.listar',
            'sesiones.revocar',
            'sesiones.administrar',

            /*
            |--------------------------------------------------------------------------
            | INTENTOS FALLIDOS & BLOQUEOS
            |--------------------------------------------------------------------------
            */
            'intentos_fallidos.listar',
            'intentos_fallidos.desbloquear',
            'intentos_fallidos.limpiar',

            /*
            |--------------------------------------------------------------------------
            | CONFIGURACIÓN
            |--------------------------------------------------------------------------
            */
            'configuracion.ver',
            'configuracion.editar',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Administrador
        |--------------------------------------------------------------------------
        */

        $admin = Role::firstOrCreate([
            'name' => 'Administrador',
            'guard_name' => 'web',
        ]);

        $admin->syncPermissions($permissions);

        /*
        |--------------------------------------------------------------------------
        | Vendedor
        |--------------------------------------------------------------------------
        */

        $vendedor = Role::firstOrCreate([
            'name' => 'Vendedor',
            'guard_name' => 'web',
        ]);

        $vendedor->syncPermissions([
            'productos.listar',

            'categorias.listar',

            'marcas.listar',

            'inventario.listar',

            'stock.listar',

            'movimientos.listar',
            'movimientos.crear',

            'reportes.ventas',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Almacenero
        |--------------------------------------------------------------------------
        */

        $almacenero = Role::firstOrCreate([
            'name' => 'Almacenero',
            'guard_name' => 'web',
        ]);

        $almacenero->syncPermissions([
            'productos.listar',

            'categorias.listar',

            'marcas.listar',

            'inventario.listar',
            'inventario.editar',

            'stock.listar',
            'stock.ajustar',

            'movimientos.listar',
            'movimientos.crear',

            'reportes.inventario',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Supervisor
        |--------------------------------------------------------------------------
        */

        $supervisor = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
        ]);

        $supervisor->syncPermissions([
            'usuarios.listar',

            'roles.listar',

            'productos.listar',
            'productos.crear',
            'productos.editar',

            'categorias.listar',
            'categorias.crear',
            'categorias.editar',

            'marcas.listar',
            'marcas.crear',
            'marcas.editar',

            'inventario.listar',

            'stock.listar',
            'stock.ajustar',

            'movimientos.listar',
            'movimientos.crear',

            'reportes.ventas',
            'reportes.inventario',
        ]);
    }
}
