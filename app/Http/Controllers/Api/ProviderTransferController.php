<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderTransferRequestResource;
use App\Models\ProviderTransferRequest;
use App\Services\Provider\ProviderTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderTransferController extends Controller
{
    public function __construct(
        private readonly ProviderTransferService $transfers,
    ) {}

    public function accept(Request $request, ProviderTransferRequest $transfer): JsonResponse
    {
        $updated = $this->transfers->accept($transfer, $request->user());

        return response()->json([
            'message' => 'Vínculo aceito.',
            'transfer' => new ProviderTransferRequestResource($updated),
        ]);
    }

    public function reject(Request $request, ProviderTransferRequest $transfer): JsonResponse
    {
        $updated = $this->transfers->reject($transfer, $request->user());

        return response()->json([
            'message' => 'Vínculo recusado. Você permanece no fornecedor atual.',
            'transfer' => new ProviderTransferRequestResource($updated),
        ]);
    }
}
