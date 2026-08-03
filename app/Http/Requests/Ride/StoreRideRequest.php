<?php

namespace App\Http\Requests\Ride;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'exists:clients,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'partner_company_id' => ['nullable', 'exists:companies,id'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
            'origin' => ['required', 'array'],
            'origin.address' => ['required', 'string'],
            'origin.lat' => ['nullable', 'numeric'],
            'origin.lng' => ['nullable', 'numeric'],
            'origin.city' => ['nullable', 'string'],
            'origin.neighborhood' => ['nullable', 'string'],
            'destination' => ['required', 'array'],
            'destination.address' => ['required', 'string'],
            'destination.lat' => ['nullable', 'numeric'],
            'destination.lng' => ['nullable', 'numeric'],
            'destination.city' => ['nullable', 'string'],
            'destination.neighborhood' => ['nullable', 'string'],
            'scheduled_date' => ['nullable', 'date'],
            'scheduled_time' => ['nullable', 'date_format:H:i'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'duration_min' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', Rule::in(['credit_card', 'pix', 'faturado', 'dinheiro'])],
            'gross_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
