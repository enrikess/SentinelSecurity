<?php

namespace Database\Seeders;

use App\Enums\Security\MenuType;
use App\Models\Security\Menu;
use App\Models\Security\Permission;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = Permission::pluck('id', 'name');

        /*
        |--------------------------------------------------------------------------
        | ADMINISTRACIÓN
        |--------------------------------------------------------------------------
        */

        $administracion = Menu::create([
            'parent_id' => null,
            'name' => 'Administración',
            'slug' => 'administracion',
            'type' => MenuType::SECTION,
            'route' => null,
            'icon' => null,
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => null,
        ]);

        Menu::create([
            'parent_id' => $administracion->id,
            'name' => 'Usuarios',
            'slug' => 'usuarios',
            'type' => MenuType::MENU,
            'route' => '/usuarios',
            'icon' => 'users',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => $permissions['usuarios.listar'],
        ]);

        Menu::create([
            'parent_id' => $administracion->id,
            'name' => 'Roles',
            'slug' => 'roles',
            'type' => MenuType::MENU,
            'route' => '/roles',
            'icon' => 'shield',
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => $permissions['roles.listar'],
        ]);

        Menu::create([
            'parent_id' => $administracion->id,
            'name' => 'Permisos',
            'slug' => 'permisos',
            'type' => MenuType::MENU,
            'route' => '/permisos',
            'icon' => 'key',
            'sort_order' => 3,
            'is_active' => true,
            'permission_id' => $permissions['permisos.listar'],
        ]);

        Menu::create([
            'parent_id' => $administracion->id,
            'name' => 'Menús',
            'slug' => 'menus',
            'type' => MenuType::MENU,
            'route' => '/menus',
            'icon' => 'menus',
            'sort_order' => 4,
            'is_active' => true,
            'permission_id' => $permissions['menus.listar'],
        ]);
        /*
        |--------------------------------------------------------------------------
        | CATÁLOGO
        |--------------------------------------------------------------------------
        */

        $catalogo = Menu::create([
            'parent_id' => null,
            'name' => 'Catálogo',
            'slug' => 'catalogo',
            'type' => MenuType::SECTION,
            'route' => null,
            'icon' => null,
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => null,
        ]);

        Menu::create([
            'parent_id' => $catalogo->id,
            'name' => 'Productos',
            'slug' => 'productos',
            'type' => MenuType::MENU,
            'route' => '/productos',
            'icon' => 'box',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => $permissions['productos.listar'],
        ]);

        Menu::create([
            'parent_id' => $catalogo->id,
            'name' => 'Categorías',
            'slug' => 'categorias',
            'type' => MenuType::MENU,
            'route' => '/categorias',
            'icon' => 'tags',
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => $permissions['categorias.listar'],
        ]);

        Menu::create([
            'parent_id' => $catalogo->id,
            'name' => 'Marcas',
            'slug' => 'marcas',
            'type' => MenuType::MENU,
            'route' => '/marcas',
            'icon' => 'bookmark',
            'sort_order' => 3,
            'is_active' => true,
            'permission_id' => $permissions['marcas.listar'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | INVENTARIO
        |--------------------------------------------------------------------------
        */

        $inventario = Menu::create([
            'parent_id' => null,
            'name' => 'Inventario',
            'slug' => 'inventario',
            'type' => MenuType::SECTION,
            'route' => null,
            'icon' => null,
            'sort_order' => 3,
            'is_active' => true,
            'permission_id' => null,
        ]);

        $gestionInventario = Menu::create([
            'parent_id' => $inventario->id,
            'name' => 'Gestión de inventario',
            'slug' => 'gestion-inventario',
            'type' => MenuType::GROUP,
            'route' => null,
            'icon' => 'boxes',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => null,
        ]);

        Menu::create([
            'parent_id' => $gestionInventario->id,
            'name' => 'Stock',
            'slug' => 'stock',
            'type' => MenuType::MENU,
            'route' => '/stock',
            'icon' => 'layers',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => $permissions['stock.listar'],
        ]);

        Menu::create([
            'parent_id' => $gestionInventario->id,
            'name' => 'Movimientos',
            'slug' => 'movimientos',
            'type' => MenuType::MENU,
            'route' => '/movimientos',
            'icon' => 'arrow-left-right',
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => $permissions['movimientos.listar'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | REPORTES
        |--------------------------------------------------------------------------
        */

        $reportes = Menu::create([
            'parent_id' => null,
            'name' => 'Reportes',
            'slug' => 'reportes',
            'type' => MenuType::SECTION,
            'route' => null,
            'icon' => null,
            'sort_order' => 4,
            'is_active' => true,
            'permission_id' => null,
        ]);

        Menu::create([
            'parent_id' => $reportes->id,
            'name' => 'Ventas',
            'slug' => 'reporte-ventas',
            'type' => MenuType::MENU,
            'route' => '/reportes/ventas',
            'icon' => 'chart-line',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => $permissions['reportes.ventas'],
        ]);

        Menu::create([
            'parent_id' => $reportes->id,
            'name' => 'Inventario',
            'slug' => 'reporte-inventario',
            'type' => MenuType::MENU,
            'route' => '/reportes/inventario',
            'icon' => 'chart-bar',
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => $permissions['reportes.inventario'],
        ]);

        Menu::create([
            'parent_id' => $reportes->id,
            'name' => 'Usuarios',
            'slug' => 'reporte-usuarios',
            'type' => MenuType::MENU,
            'route' => '/reportes/usuarios',
            'icon' => 'users-round',
            'sort_order' => 3,
            'is_active' => true,
            'permission_id' => $permissions['reportes.usuarios'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | CONFIGURACIÓN
        |--------------------------------------------------------------------------
        */

        $configuracion = Menu::create([
            'parent_id' => null,
            'name' => 'Configuración',
            'slug' => 'configuracion',
            'type' => MenuType::SECTION,
            'route' => null,
            'icon' => null,
            'sort_order' => 5,
            'is_active' => true,
            'permission_id' => null,
        ]);

        Menu::create([
            'parent_id' => $configuracion->id,
            'name' => 'Sistema',
            'slug' => 'sistema',
            'type' => MenuType::MENU,
            'route' => '/configuracion/sistema',
            'icon' => 'sliders-horizontal',
            'sort_order' => 1,
            'is_active' => true,
            'permission_id' => $permissions['configuracion.ver'],
        ]);

        Menu::create([
            'parent_id' => $configuracion->id,
            'name' => 'Sesiones',
            'slug' => 'sesiones',
            'type' => MenuType::MENU,
            'route' => '/sesiones',
            'icon' => 'monitor-smartphone',
            'sort_order' => 2,
            'is_active' => true,
            'permission_id' => $permissions['sesiones.listar'],
        ]);

        Menu::create([
            'parent_id' => $configuracion->id,
            'name' => 'Intentos Fallidos',
            'slug' => 'intentos-fallidos',
            'type' => MenuType::MENU,
            'route' => '/intentos-fallidos',
            'icon' => 'shield-alert',
            'sort_order' => 3,
            'is_active' => true,
            'permission_id' => $permissions['intentos_fallidos.listar'],
        ]);
    }
}
