<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Services\Security\SessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function __construct(
        private readonly SessionService $sessionService
    ) {}

    /**
     * Sesiones activas del sistema y del usuario autenticado.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canManageAll = $user->can('sesiones.administrar') || $user->hasRole('Administrador');

        return Inertia::render('security/sesiones/index', [
            'mySessions' => $this->sessionService->forUser($user, $request),
            'allSessions' => $canManageAll
                ? $this->sessionService->allSessions($request)
                : [],
            'canManageAll' => $canManageAll,
        ]);
    }

    /**
     * Cerrar una única sesión desde la tabla de sesiones.
     */
    public function revoke(Request $request, string $session): RedirectResponse
    {
        $user = $request->user();

        if ($session === $request->session()->getId()) {
            return back()->withErrors([
                'revoke' => 'No puedes cerrar tu propia sesión actual desde esta página.',
            ]);
        }

        $query = DB::table('sessions')->where('id', $session);

        $canManageAll = $user->can('sesiones.administrar') || $user->hasRole('Administrador');
        if (! $canManageAll) {
            $query->where('user_id', $user->getAuthIdentifier());
        }

        $deleted = $query->delete();

        if ($deleted === 0) {
            return back()->withErrors([
                'revoke' => 'No se encontró la sesión solicitada o no tienes permisos para revocarla.',
            ]);
        }

        return to_route('sesiones.index')
            ->with('success', 'Sesión cerrada correctamente.');
    }

    /**
     * Cerrar todas las demás sesiones del usuario.
     */
    public function revokeAll(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logoutOtherDevices($validated['current_password']);

        DB::table('sessions')
            ->where('user_id', $user->getAuthIdentifier())
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        return to_route('sesiones.index')
            ->with('success', 'Se cerraron todas tus demás sesiones.');
    }
}
