<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Services\Security\FailedLoginService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FailedAttemptController extends Controller
{
    public function __construct(
        private readonly FailedLoginService $failedLoginService,
    ) {}

    /**
     * Muestra el panel y registro de intentos fallidos de inicio de sesión.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'email', 'ip', 'date_from', 'date_to']);

        return Inertia::render('security/intentos-fallidos/index', [
            'attempts' => $this->failedLoginService->getAttempts($filters, 15),
            'metrics' => $this->failedLoginService->getMetrics(),
            'filters' => $filters,
        ]);
    }

    /**
     * Devuelve el estado actual del bloqueo de una combinación email e IP.
     */
    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        return response()->json(
            $this->failedLoginService->getLockStatusByEmail($validated['email'])
        );
    }

    /**
     * Desbloquea de forma inmediata una combinación de email e IP.
     */
    public function unlock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string'],
            'ip' => ['required', 'string'],
        ]);

        $this->failedLoginService->unlock(
            email: $validated['email'],
            ip: $validated['ip']
        );

        return back()->with('success', "Bloqueo liberado exitosamente para {$validated['email']} ({$validated['ip']}).");
    }

    /**
     * Limpia el historial de intentos fallidos.
     */
    public function clearHistory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'days' => ['nullable', 'integer', 'min:0'],
        ]);

        $days = isset($validated['days']) && $validated['days'] > 0 ? (int) $validated['days'] : null;
        $deleted = $this->failedLoginService->clearHistory($days);

        $message = $days
            ? "Se eliminaron {$deleted} registros anteriores a {$days} días."
            : "Se eliminó todo el historial de intentos fallidos ({$deleted} registros).";

        return back()->with('success', $message);
    }
}
