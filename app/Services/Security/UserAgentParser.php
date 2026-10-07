<?php

namespace App\Services\Security;

/**
 * Parser ligero de user-agent.
 *
 * Extrae únicamente navegador, plataforma y tipo de dispositivo a partir
 * de los agentes más comunes. El objetivo es alimentar la página de
 * sesiones sin depender de paquetes externos.
 */
class UserAgentParser
{
    /**
     * @return array{browser: string, platform: string, device: string}
     */
    public function parse(?string $userAgent): array
    {
        $agent = strtolower(trim((string) $userAgent));

        return [
            'browser' => $this->detectBrowser($agent),
            'platform' => $this->detectPlatform($agent),
            'device' => $this->detectDevice($agent),
        ];
    }

    private function detectBrowser(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'edg/') => 'Microsoft Edge',
            str_contains($agent, 'opr/') => 'Opera',
            str_contains($agent, 'chrome/') => 'Google Chrome',
            str_contains($agent, 'firefox/') => 'Mozilla Firefox',
            str_contains($agent, 'safari/') => 'Safari',
            default => 'Desconocido',
        };
    }

    private function detectPlatform(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'windows nt') => 'Windows',
            str_contains($agent, 'android') => 'Android',
            str_contains($agent, 'iphone'), str_contains($agent, 'ipad'), str_contains($agent, 'ipod') => 'iOS',
            str_contains($agent, 'mac os x'), str_contains($agent, 'macintosh') => 'macOS',
            str_contains($agent, 'linux') => 'Linux',
            default => 'Desconocido',
        };
    }

    private function detectDevice(string $agent): string
    {
        return match (true) {
            str_contains($agent, 'ipad'), str_contains($agent, 'tablet') => 'Tablet',
            str_contains($agent, 'mobile'), str_contains($agent, 'iphone'),
            str_contains($agent, 'ipod'), str_contains($agent, 'android') => 'Móvil',
            default => 'Escritorio',
        };
    }
}
