<?php

namespace Database\Seeders;

use App\Models\Security\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SecuritySeeder::class,
            MenuSeeder::class,
        ]);

        $users = [
            [
                'name' => 'Administrador',
                'email' => 'admin@example.com',
                'password' => 'password',
                'role' => 'Administrador',
            ],
            [
                'name' => 'Supervisor',
                'email' => 'supervisor@example.com',
                'password' => 'password',
                'role' => 'Supervisor',
            ],
            [
                'name' => 'Vendedor',
                'email' => 'vendedor@example.com',
                'password' => 'password',
                'role' => 'Vendedor',
            ],
            [
                'name' => 'Almacenero',
                'email' => 'almacenero@example.com',
                'password' => 'password',
                'role' => 'Almacenero',
            ],
        ];

        foreach ($users as $data) {
            $user = User::updateOrCreate(
                [
                    'email' => $data['email'],
                ],
                [
                    'name' => $data['name'],
                    'password' => Hash::make($data['password']),
                ]
            );

            $role = Role::where('name', $data['role'])
                ->where('guard_name', 'web')
                ->firstOrFail();

            $user->syncRoles([$role]);
        }
    }
}
