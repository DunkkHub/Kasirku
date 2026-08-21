<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');
        Config::$curlOptions = [
            // Midtrans' Snap requestor expects this option to be non-empty
            // whenever custom cURL options are supplied. Keeping a harmless
            // header here preserves its Authorization/Content-Type headers.
            CURLOPT_HTTPHEADER => ['User-Agent: Teisseire-Pizza-POS/1.0'],
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
        ];
    }

    /**
     * Request a Snap token from Midtrans for the given transaction params.
     */
    public function createSnapToken(array $params): string
    {
        return Snap::getSnapToken($params);
    }
}
