<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MidtransNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'string', 'max:255'],
            'status_code' => ['required', 'string', 'max:3'],
            'gross_amount' => ['required', 'numeric', 'min:0'],
            'signature_key' => ['required', 'string', 'size:128', 'regex:/^[a-f0-9]{128}$/i'],
            'transaction_status' => [
                'required',
                Rule::in(['capture', 'settlement', 'pending', 'deny', 'expire', 'cancel']),
            ],
            'payment_type' => ['nullable', 'string', 'max:80'],
            'fraud_status' => ['nullable', Rule::in(['accept', 'challenge', 'deny'])],
            'transaction_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
