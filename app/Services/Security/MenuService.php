<?php

namespace App\Services\Security;

use App\Models\Security\Menu;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class MenuService
{
    public function getTreeForUser(User $user): Collection
    {
        $menus = Menu::query()
            ->with('permission')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $this->buildTree($menus, $user);
    }

    private function buildTree(
        EloquentCollection $menus,
        User $user,
        ?int $parentId = null
    ): Collection {
        return $menus
            ->where('parent_id', $parentId)
            ->map(function (Menu $menu) use ($menus, $user) {

                $children = $this->buildTree(
                    $menus,
                    $user,
                    $menu->id
                );

                $hasPermission = $menu->permission_id !== null
                    && $menu->permission !== null
                    && $user->can($menu->permission->name);

                if (!$hasPermission && $children->isEmpty()) {
                    return null;
                }

                $menu->setRelation('children', $children);

                return $menu;
            })
            ->filter()
            ->values();
    }
}
