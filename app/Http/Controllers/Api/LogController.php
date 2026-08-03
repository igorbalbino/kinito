<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\RideDetailLog;
use App\Models\RideLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function rideLogs(Request $request): JsonResponse
    {
        $query = RideLog::query()->latest();

        if ($request->filled('ride_id')) {
            $query->where('ride_id', $request->integer('ride_id'));
        }

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }

    public function rideDetailLogs(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['ADMIN', 'EMPRESA']), 403);

        $query = RideDetailLog::query()->latest();

        if ($request->filled('ride_id')) {
            $query->where('ride_id', $request->integer('ride_id'));
        }

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }

    public function audits(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['ADMIN', 'EMPRESA']), 403);

        $query = AuditLog::query()->with('user')->latest();

        if ($action = $request->string('action')->toString()) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        return response()->json($query->paginate($request->integer('per_page', 30)));
    }
}
