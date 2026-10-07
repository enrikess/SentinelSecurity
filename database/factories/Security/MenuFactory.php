<?php

namespace Database\Factories\Security;

use App\Enums\Security\MenuType;
use App\Models\Security\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    protected $model = Menu::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parent_id' => null,
            'name' => fake()->unique()->words(2, true),
            'slug' => fake()->unique()->slug(2),
            'type' => MenuType::MENU,
            'route' => null,
            'icon' => null,
            'sort_order' => 0,
            'permission_id' => null,
            'is_active' => true,
        ];
    }

    public function section(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => MenuType::SECTION,
            'parent_id' => null,
            'route' => null,
            'icon' => null,
            'permission_id' => null,
        ]);
    }

    public function group(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => MenuType::GROUP,
            'parent_id' => null,
            'route' => null,
            'permission_id' => null,
        ]);
    }

    public function route(string $route): static
    {
        return $this->state(fn (array $attributes) => [
            'route' => $route,
        ]);
    }
}
