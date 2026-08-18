<?php

return [

    'payment_provider' => env('PAYMENT_PROVIDER', 'manual'),

    /*
    | Billing SaaS (assinatura de planos) — separado do split de corridas.
    | BILLING_DRIVER=auto|mock|stripe  (auto: stripe se STRIPE_SECRET, senão mock)
    */
    'billing' => [
        'driver' => env('BILLING_DRIVER', 'auto'),
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'key' => env('STRIPE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'fee_percent' => (float) env('STRIPE_FEE_PERCENT', 3.9),
        'fee_fixed' => (float) env('STRIPE_FEE_FIXED', 0.50),
        'prices' => [
            'starter' => env('STRIPE_PRICE_STARTER'),
            'pro' => env('STRIPE_PRICE_PRO'),
            'enterprise' => env('STRIPE_PRICE_ENTERPRISE'),
        ],
    ],

    'trial_days' => (int) env('KINITO_TRIAL_DAYS', 14),

    'commissions' => [
        'platform_percent' => (float) env('PLATFORM_COMMISSION_PERCENT', 15),
        'company_percent' => (float) env('COMPANY_COMMISSION_PERCENT', 10),
    ],

    'ride_detail_log_retention_days' => (int) env('RIDE_DETAIL_LOG_RETENTION_DAYS', 90),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    'default_plan' => env('KINITO_DEFAULT_PLAN', 'starter'),

    /*
    | WhatsApp — troque o provider sem mudar o código de negócio.
    | WHATSAPP_PROVIDER=log|baileys|meta
    | Sidecar Baileys: pasta whatsapp-gateway/ (WHATSAPP_GATEWAY_*)
    */
    'whatsapp' => [
        'enabled' => (bool) env('WHATSAPP_ENABLED', false),
        'provider' => env('WHATSAPP_PROVIDER', 'log'),

        'gateway' => [
            'url' => env('WHATSAPP_GATEWAY_URL', env('WHATSAPP_BAILEYS_URL')),
            'api_key' => env('WHATSAPP_GATEWAY_API_KEY', env('WHATSAPP_BAILEYS_TOKEN', 'kinito-gateway-dev')),
            'timeout' => (int) env('WHATSAPP_GATEWAY_TIMEOUT', 20),
        ],

        'meta' => [
            'token' => env('WHATSAPP_META_TOKEN'),
            'phone_number_id' => env('WHATSAPP_META_PHONE_NUMBER_ID'),
            'graph_version' => env('WHATSAPP_META_GRAPH_VERSION', 'v21.0'),
            'timeout' => (int) env('WHATSAPP_META_TIMEOUT', 15),
        ],
    ],

];
