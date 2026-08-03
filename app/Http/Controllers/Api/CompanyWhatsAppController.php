<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\WhatsApp\CompanyWhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyWhatsAppController extends Controller
{
    public function __construct(
        private readonly CompanyWhatsAppService $whatsapp,
    ) {}

    public function status(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        return response()->json(['whatsapp' => $this->whatsapp->status($company)]);
    }

    public function connect(Request $request, Company $company): JsonResponse
    {
        $this->authorize('manage', $company);

        return response()->json([
            'message' => 'Escaneie o QR Code no WhatsApp do celular.',
            'whatsapp' => $this->whatsapp->connect($company),
        ]);
    }

    public function disconnect(Request $request, Company $company): JsonResponse
    {
        $this->authorize('manage', $company);

        return response()->json([
            'message' => 'WhatsApp desconectado.',
            'whatsapp' => $this->whatsapp->disconnect($company),
        ]);
    }
}
