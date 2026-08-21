<?php

$currency = strtoupper((string) env('POS_CURRENCY', 'EUR'));

if (! preg_match('/^[A-Z]{3}$/', $currency)) {
    $currency = 'EUR';
}

return [

    /*
    |--------------------------------------------------------------------------
    | Tax Rate
    |--------------------------------------------------------------------------
    |
    | The tax rate applied to order subtotals, expressed as a decimal
    | (e.g. 0.1 = 10%). Used by checkout, admin order creation, and
    | receipt printing so the rate only needs to change in one place.
    |
    */

    'tax_rate' => max(0, min(1, (float) env('POS_TAX_RATE', 0))),

    'delivery_fee' => max(0, (float) env('POS_DELIVERY_FEE', 3.00)),

    'currency' => $currency,

    // Monetary database columns store two decimal places at most.
    'currency_precision' => max(0, min(2, (int) env('POS_CURRENCY_PRECISION', 2))),

    'locale' => env('POS_LOCALE', 'fr-FR'),

    // Only /dev/usb/lpN and COMN connector names are accepted by PrintController.
    'printer_device' => env('POS_PRINTER_DEVICE'),

];
