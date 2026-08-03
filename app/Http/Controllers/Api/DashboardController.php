<?php

namespace App\Http\Controllers\Api;

use App\Enums\RideStatus;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Driver;
use App\Models\Ride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasRole('ADMIN')) {
            return response()->json([
                'role' => 'ADMIN',
                'metrics' => [
                    'grossRevenue' => (float) Ride::query()->where('status', RideStatus::Finalizada)->sum('gross_value'),
                    'platformCommission' => (float) Ride::query()->where('status', RideStatus::Finalizada)->sum('platform_commission'),
                    'ridesCount' => Ride::query()->count(),
                    'activeDrivers' => Driver::query()->where('status', 'ATIVO')->count(),
                    'clientsCount' => Client::query()->count(),
                ],
                'recentRides' => Ride::query()->with(['client.user', 'driver.user', 'company'])->latest()->limit(10)->get(),
            ]);
        }

        if ($user->hasRole('EMPRESA')) {
            $ids = $user->ownedCompanies()->pluck('id')->merge($user->companies()->pluck('companies.id'));
            $rides = Ride::query()->whereIn('company_id', $ids);

            return response()->json([
                'role' => 'EMPRESA',
                'metrics' => [
                    'monthlyRevenue' => (float) (clone $rides)->where('status', RideStatus::Finalizada)->sum('company_cut'),
                    'ridesCount' => (clone $rides)->count(),
                    'activeDrivers' => Driver::query()->whereHas('companies', fn ($q) => $q->whereIn('companies.id', $ids))->where('status', 'ATIVO')->count(),
                ],
                'recentRides' => (clone $rides)->with(['client.user', 'driver.user', 'company'])->latest()->limit(10)->get(),
            ]);
        }

        if ($user->hasRole('MOTORISTA')) {
            $driver = $user->driver;

            return response()->json([
                'role' => 'MOTORISTA',
                'metrics' => [
                    'totalEarnings' => (float) ($driver?->total_earnings ?? 0),
                    'pendingBalance' => (float) ($driver?->pending_balance ?? 0),
                    'totalRides' => $driver?->total_rides ?? 0,
                    'rating' => (float) ($driver?->rating ?? 0),
                ],
                'recentRides' => Ride::query()->where('driver_id', $driver?->id)->with(['client.user', 'company'])->latest()->limit(10)->get(),
            ]);
        }

        $client = $user->client;

        return response()->json([
            'role' => 'CLIENTE',
            'metrics' => [
                'totalRides' => $client?->total_rides ?? 0,
                'totalSpent' => (float) ($client?->total_spent ?? 0),
                'rating' => (float) ($client?->rating ?? 0),
            ],
            'recentRides' => Ride::query()->where('client_id', $client?->id)->with(['driver.user', 'company'])->latest()->limit(10)->get(),
        ]);
    }
}
