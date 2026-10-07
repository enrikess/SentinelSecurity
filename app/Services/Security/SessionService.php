<?php

namespace App\Services\Security;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SessionService
{
    public function __construct(
        private readonly UserAgentParser $userAgentParser
    ) {}

    /**
     * Sesiones del usuario autenticado.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function forUser(User $user, Request $request): Collection
    {
        $currentSessionId = $request->session()->getId();

        $rows = DB::table('sessions')
            ->where('user_id', $user->getAuthIdentifier())
            ->orderByDesc('last_activity')
            ->get()
            ->keyBy('id');

        $rows->forget($currentSessionId);

        $userPayload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];

        return collect()
            ->push($this->buildItem(
                $currentSessionId,
                $user->getAuthIdentifier(),
                $userPayload,
                $request->ip(),
                $request->userAgent(),
                now()->getTimestamp(),
                true
            ))
            ->merge($rows->map(
                fn ($row) => $this->buildItem(
                    $row->id,
                    $user->getAuthIdentifier(),
                    $userPayload,
                    $row->ip_address,
                    $row->user_agent,
                    $row->last_activity,
                    false
                )
            ))
            ->values();
    }

    /**
     * Todas las sesiones activas en el sistema (monitor administrativo).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function allSessions(Request $request): Collection
    {
        $currentSessionId = $request->session()->getId();
        $currentUser = $request->user();

        $rows = DB::table('sessions')
            ->leftJoin('users', 'users.id', '=', 'sessions.user_id')
            ->whereNotNull('sessions.user_id')
            ->select(
                'sessions.id',
                'sessions.user_id',
                'sessions.ip_address',
                'sessions.user_agent',
                'sessions.last_activity',
                'users.name as user_name',
                'users.email as user_email'
            )
            ->orderByDesc('sessions.last_activity')
            ->get()
            ->keyBy('id');

        $rows->forget($currentSessionId);

        $items = collect();

        if ($currentUser) {
            $items->push($this->buildItem(
                $currentSessionId,
                $currentUser->getAuthIdentifier(),
                [
                    'id' => $currentUser->id,
                    'name' => $currentUser->name,
                    'email' => $currentUser->email,
                ],
                $request->ip(),
                $request->userAgent(),
                now()->getTimestamp(),
                true
            ));
        }

        return $items->merge($rows->map(
            fn ($row) => $this->buildItem(
                $row->id,
                $row->user_id,
                $row->user_id ? [
                    'id' => $row->user_id,
                    'name' => $row->user_name ?? ('Usuario #'.$row->user_id),
                    'email' => $row->user_email ?? '',
                ] : null,
                $row->ip_address,
                $row->user_agent,
                $row->last_activity,
                $row->id === $currentSessionId
            )
        ))->values();
    }

    /**
     * @param  array{id: int, name: string, email: string}|null  $user
     * @return array{id: string, user_id: int|string|null, user: array{id: int, name: string, email: string}|null, ip_address: string|null, browser: string, platform: string, device: string, user_agent: string|null, is_current: bool, last_activity: string}
     */
    private function buildItem(
        string $id,
        int|string|null $userId,
        ?array $user,
        ?string $ipAddress,
        ?string $userAgent,
        int $lastActivity,
        bool $isCurrent
    ): array {
        $parsed = $this->userAgentParser->parse($userAgent);

        return [
            'id' => $id,
            'user_id' => $userId,
            'user' => $user,
            'ip_address' => $ipAddress,
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'device' => $parsed['device'],
            'user_agent' => $userAgent !== null
                ? mb_substr($userAgent, 0, 250)
                : null,
            'is_current' => $isCurrent,
            'last_activity' => Carbon::createFromTimestamp($lastActivity)
                ->toIso8601String(),
        ];
    }
}
