<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use App\Services\Subscription\SubscriptionLifecycleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProviderController extends Controller
{
    public function __construct(private readonly SubscriptionLifecycleService $lifecycle) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $companies = Company::query()
            ->with(['settings', 'activeSubscription.plan'])
            ->where('is_active', true)
            ->where('is_provider', true)
            ->orderBy('name')
            ->get()
            ->filter(fn (Company $c) => $this->lifecycle->companyHasAccess($c))
            ->values();

        return CompanyResource::collection($companies);
    }
}
