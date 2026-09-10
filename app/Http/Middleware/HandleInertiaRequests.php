<?php

namespace App\Http\Middleware;

use App\Services\Security\MenuService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            'name' => config('app.name'),

            'quote' => [
                'message' => trim($message),
                'author' => trim($author),
            ],

            'auth' => [
                'user' => $request->user(),
            ],

            'security' => [
                'menus' => $request->user()
                    ? app(MenuService::class)->getTreeForUser($request->user())
                    : [],
                'permissions' => $request->user()
                    ? $request->user()->getAllPermissions()->pluck('name')->values()->all()
                    : [],
            ],
        ]);
    }
}
