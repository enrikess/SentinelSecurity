<?php

use App\Services\Security\UserAgentParser;

test('extrae navegador, plataforma y dispositivo del user-agent', function (
    ?string $userAgent,
    string $browser,
    string $platform,
    string $device
) {
    $parsed = (new UserAgentParser)->parse($userAgent);

    expect($parsed)->toMatchArray([
        'browser' => $browser,
        'platform' => $platform,
        'device' => $device,
    ]);
})->with([
    'chrome en windows' => [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Google Chrome',
        'Windows',
        'Escritorio',
    ],
    'firefox en linux' => [
        'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0',
        'Mozilla Firefox',
        'Linux',
        'Escritorio',
    ],
    'safari en mac' => [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Safari',
        'macOS',
        'Escritorio',
    ],
    'edge en windows' => [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'Microsoft Edge',
        'Windows',
        'Escritorio',
    ],
    'opera en windows' => [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 OPR/95.0.0.0',
        'Opera',
        'Windows',
        'Escritorio',
    ],
    'chrome en android' => [
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Google Chrome',
        'Android',
        'Móvil',
    ],
    'safari en iphone' => [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        'Safari',
        'iOS',
        'Móvil',
    ],
    'safari en ipad' => [
        'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        'Safari',
        'iOS',
        'Tablet',
    ],
    'user-agent vacío' => [
        null,
        'Desconocido',
        'Desconocido',
        'Escritorio',
    ],
]);
