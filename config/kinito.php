<?php

return [

    'payment_provider' => env('PAYMENT_PROVIDER', 'manual'),

    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'key' => env('STRIPE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'fee_percent' => (float) env('STRIPE_FEE_PERCENT', 3.9),
        'fee_fixed' => (float) env('STRIPE_FEE_FIXED', 0.50),
    ],

    'commissions' => [
        'platform_percent' => (float) env('PLATFORM_COMMISSION_PERCENT', 15),
        'company_percent' => (float) env('COMPANY_COMMISSION_PERCENT', 10),
    ],

    'ride_detail_log_retention_days' => (int) env('RIDE_DETAIL_LOG_RETENTION_DAYS', 90),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    'default_plan' => env('KINITO_DEFAULT_PLAN', 'starter'),

];
