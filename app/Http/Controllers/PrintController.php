<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;
use Throwable;

class PrintController extends Controller
{
    public function printOrder(Request $request, Order $order): JsonResponse
    {
        abort_unless((bool) $request->user()?->is_admin, 403);

        $device = (string) config('pos.printer_device');
        if (! preg_match('#^(?:/dev/usb/lp[0-9]{1,2}|COM[1-9][0-9]?)$#i', $device)) {
            return response()->json([
                'message' => 'Aucune imprimante autorisée n’est configurée.',
            ], 503);
        }

        $order->load(['orderItems', 'payment']);
        $printer = null;

        try {
            $printer = new Printer(new FilePrintConnector($device));
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH | Printer::MODE_EMPHASIZED);
            $printer->text("TEISSEIRE PIZZA\n");
            $printer->selectPrintMode();
            $printer->text("Commande {$this->safe($order->reference)}\n");
            $printer->text($order->created_at->format('d/m/Y H:i')."\n");
            $printer->text(str_repeat('-', 32)."\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);

            foreach ($order->orderItems as $item) {
                $name = $this->safe($item->product_name);
                $printer->text("{$item->quantity}x {$name}\n");
                if ($item->notes) {
                    $printer->text('  '.$this->safe($item->notes)."\n");
                }
                $printer->text('  '.$this->money($item->subtotal)."\n");
            }

            $printer->text(str_repeat('-', 32)."\n");
            $printer->text('Sous-total: '.$this->money($order->subtotal_amount)."\n");
            if ((float) $order->tax_amount > 0) {
                $printer->text('Taxe: '.$this->money($order->tax_amount)."\n");
            }
            if ((float) $order->delivery_fee > 0) {
                $printer->text('Livraison: '.$this->money($order->delivery_fee)."\n");
            }
            $printer->setEmphasis(true);
            $printer->text('TOTAL: '.$this->money($order->total_amount)."\n");
            $printer->setEmphasis(false);
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Merci et bon appétit !\n\n");
            $printer->cut();

            return response()->json(['message' => 'Impression lancée.']);
        } catch (Throwable $exception) {
            $errorId = (string) str()->uuid();
            Log::error('Receipt print failed', [
                'error_id' => $errorId,
                'order_id' => $order->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'L’impression a échoué.',
                'error_id' => $errorId,
            ], 500);
        } finally {
            try {
                $printer?->close();
            } catch (Throwable) {
                // The original error is already returned/logged.
            }
        }
    }

    private function safe(string $value): string
    {
        $withoutControls = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';

        return str($withoutControls)->squish()->limit(48)->toString();
    }

    private function money(int|float|string $amount): string
    {
        return number_format((float) $amount, (int) config('pos.currency_precision'), ',', ' ')
            .' '.config('pos.currency');
    }
}
