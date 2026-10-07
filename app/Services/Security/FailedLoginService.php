<?php

namespace App\Services\Security;

use App\Models\Security\FailedLoginAttempt;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class FailedLoginService
{
    public function __construct(
        private readonly UserAgentParser $userAgentParser,
    ) {}

    /**
     * Registra un intento de inicio de sesión fallido.
     */
    public function recordAttempt(
        string $email,
        string $ip,
        ?string $userAgent = null,
        string $reason = 'Credenciales inválidas'
    ): FailedLoginAttempt {
        $email = trim(strtolower($email));
        $user = User::where('email', $email)->first();

        return FailedLoginAttempt::create([
            'user_id' => $user?->id,
            'email' => $email,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'reason' => $reason,
            'created_at' => Carbon::now(),
        ]);
    }

    /**
     * Clave del limitador de tasa coherente con LoginRequest.
     */
    public function throttleKey(string $email, string $ip): string
    {
        return Str::transliterate(Str::lower($email).'|'.$ip);
    }

    /**
     * Determina si la combinación de email e IP está actualmente bloqueada.
     */
    public function isLocked(string $email, string $ip, int $maxAttempts = 5): bool
    {
        return RateLimiter::tooManyAttempts($this->throttleKey($email, $ip), $maxAttempts);
    }

    /**
     * Segundos restantes del bloqueo activo.
     */
    public function getAvailableIn(string $email, string $ip): int
    {
        return RateLimiter::availableIn($this->throttleKey($email, $ip));
    }

    /**
     * Obtiene el listado paginado de intentos fallidos con filtros.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAttempts(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = FailedLoginAttempt::query()
            ->with(['user' => fn ($q) => $q->select('id', 'name', 'email', 'avatar')])
            ->latest('id');

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['email'])) {
            $query->where('email', 'like', '%'.trim((string) $filters['email']).'%');
        }

        if (! empty($filters['ip'])) {
            $query->where('ip_address', trim((string) $filters['ip']));
        }

        if (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        return $query->paginate($perPage)->through(function (FailedLoginAttempt $attempt) {
            $agentInfo = $this->userAgentParser->parse($attempt->user_agent);
            $isLocked = $this->isLocked($attempt->email, $attempt->ip_address);
            $lockoutRemaining = $isLocked ? $this->getAvailableIn($attempt->email, $attempt->ip_address) : 0;

            return [
                'id' => $attempt->id,
                'email' => $attempt->email,
                'ip_address' => $attempt->ip_address,
                'reason' => $attempt->reason,
                'created_at' => $attempt->created_at->toIso8601String(),
                'created_at_human' => $attempt->created_at->diffForHumans(),
                'user' => $attempt->user ? [
                    'id' => $attempt->user->id,
                    'name' => $attempt->user->name,
                    'email' => $attempt->user->email,
                    'avatar' => $attempt->user->avatar,
                ] : null,
                'agent' => $agentInfo,
                'is_locked' => $isLocked,
                'lockout_remaining' => $lockoutRemaining,
            ];
        });
    }

    /**
     * Retorna métricas globales para el panel de intentos fallidos.
     *
     * @return array<string, mixed>
     */
    public function getMetrics(): array
    {
        $since24h = Carbon::now()->subHours(24);

        $total24h = FailedLoginAttempt::where('created_at', '>=', $since24h)->count();
        $uniqueEmails24h = FailedLoginAttempt::where('created_at', '>=', $since24h)->distinct('email')->count('email');
        $uniqueIps24h = FailedLoginAttempt::where('created_at', '>=', $since24h)->distinct('ip_address')->count('ip_address');

        $topIp = FailedLoginAttempt::select('ip_address', DB::raw('count(*) as total'))
            ->where('created_at', '>=', $since24h)
            ->groupBy('ip_address')
            ->orderByDesc('total')
            ->first();

        $topEmail = FailedLoginAttempt::select('email', DB::raw('count(*) as total'))
            ->where('created_at', '>=', $since24h)
            ->groupBy('email')
            ->orderByDesc('total')
            ->first();

        return [
            'total_24h' => $total24h,
            'unique_emails_24h' => $uniqueEmails24h,
            'unique_ips_24h' => $uniqueIps24h,
            'top_ip' => $topIp ? [
                'ip' => $topIp->ip_address,
                'count' => (int) $topIp->total,
            ] : null,
            'top_email' => $topEmail ? [
                'email' => $topEmail->email,
                'count' => (int) $topEmail->total,
            ] : null,
        ];
    }

    /**
     * Limpia registros de intentos fallidos.
     */
    public function clearHistory(?int $olderThanDays = null): int
    {
        $query = FailedLoginAttempt::query();

        if ($olderThanDays !== null && $olderThanDays > 0) {
            $query->where('created_at', '<', Carbon::now()->subDays($olderThanDays));
        }

        return $query->delete();
    }

    /**
     * Desbloquea una combinación de email e IP limpiando el RateLimiter.
     */
    public function unlock(string $email, string $ip): void
    {
        RateLimiter::clear($this->throttleKey($email, $ip));
    }

    /**
     * Obtiene el estado de bloqueo de un email, agrupado por IP.
     *
     * @return array<string, mixed>
     */
    public function getLockStatusByEmail(string $email, int $maxAttempts = 5): array
    {
        $email = trim(strtolower($email));

        $rows = FailedLoginAttempt::query()
            ->select('ip_address', DB::raw('count(*) as total'), DB::raw('max(created_at) as last_attempt_at'))
            ->where('email', $email)
            ->groupBy('ip_address')
            ->orderByDesc('last_attempt_at')
            ->get();

        $ips = $rows->map(function ($row) use ($email, $maxAttempts) {
            $key = $this->throttleKey($email, $row->ip_address);
            $rateLimiterAttempts = RateLimiter::attempts($key);
            $isLocked = RateLimiter::tooManyAttempts($key, $maxAttempts);
            $availableIn = $isLocked ? RateLimiter::availableIn($key) : 0;

            return [
                'ip' => $row->ip_address,
                'attempts' => (int) $row->total,
                'max_attempts' => $maxAttempts,
                'is_locked' => $isLocked,
                'available_in' => $availableIn,
                'human_remaining' => $isLocked ? now()->addSeconds($availableIn)->diffForHumans() : null,
                'last_attempt_at' => $row->last_attempt_at
                    ? Carbon::parse($row->last_attempt_at)->toIso8601String()
                    : null,
            ];
        })->values()->all();

        return [
            'email' => $email,
            'total_attempts' => array_sum(array_column($ips, 'attempts')),
            'locked_count' => count(array_filter($ips, fn (array $ip) => $ip['is_locked'])),
            'ips' => $ips,
        ];
    }
}
