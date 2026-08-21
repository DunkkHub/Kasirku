<?php

use App\Services\MidtransService;
use Midtrans\Config;

test('midtrans custom curl options keep a non-empty header list and bounded timeouts', function () {
    app(MidtransService::class);

    expect(Config::$curlOptions)->toHaveKeys([
        CURLOPT_HTTPHEADER,
        CURLOPT_CONNECTTIMEOUT,
        CURLOPT_TIMEOUT,
    ])->and(Config::$curlOptions[CURLOPT_HTTPHEADER])->not->toBeEmpty()
        ->and(Config::$curlOptions[CURLOPT_HTTPHEADER])->toContain('User-Agent: Teisseire-Pizza-POS/1.0')
        ->and(Config::$curlOptions[CURLOPT_CONNECTTIMEOUT])->toBe(5)
        ->and(Config::$curlOptions[CURLOPT_TIMEOUT])->toBe(15);
});
