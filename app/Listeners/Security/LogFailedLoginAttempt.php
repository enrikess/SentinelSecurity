<?php

namespace App\Listeners\Security;

use App\Services\Security\FailedLoginService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;

class LogFailedLoginAttempt
{
    public function __construct(
        private readonly FailedLoginService $failedLoginService,
        private readonly Request $request,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Failed $event): void
    {
        $email = $event->credentials['email'] ?? $this->request->input('email');

        if (empty($email)) {
            return;
        }

        $ip = $this->request->ip() ?? '127.0.0.1';
        $userAgent = $this->request->userAgent();

        $this->failedLoginService->recordAttempt(
            email: (string) $email,
            ip: $ip,
            userAgent: $userAgent,
            reason: 'Credenciales inválidas'
        );
    }
}
