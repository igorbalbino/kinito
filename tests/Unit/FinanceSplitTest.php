<?php

namespace Tests\Unit;

use App\Services\Finance\FinanceService;
use Tests\TestCase;

class FinanceSplitTest extends TestCase
{
    public function test_manual_provider_zeros_platform_and_stripe_fees(): void
    {
        config([
            'kinito.payment_provider' => 'manual',
            'kinito.stripe.secret' => null,
            'kinito.commissions.company_percent' => 10,
            'kinito.commissions.platform_percent' => 15,
        ]);

        $split = app(FinanceService::class)->calculateSplit(100, 10, 'pix');

        $this->assertSame(0.0, $split['stripe_fee']);
        $this->assertSame(0.0, $split['platform_commission']);
        $this->assertSame(10.0, $split['company_cut']);
        $this->assertSame(90.0, $split['driver_net']);
    }

    public function test_stripe_active_applies_different_fees_by_payment_method(): void
    {
        config([
            'kinito.payment_provider' => 'stripe',
            'kinito.stripe.secret' => 'sk_test_dummy',
            'kinito.commissions.platform_percent' => 15,
            'kinito.commissions.company_percent' => 10,
            'kinito.stripe.fees_by_method' => [
                'credit_card' => ['percent' => 3.99, 'fixed' => 0.39],
                'pix' => ['percent' => 1.19, 'fixed' => 0],
                'default' => ['percent' => 3.9, 'fixed' => 0.50],
            ],
        ]);

        $finance = app(FinanceService::class);
        $pix = $finance->calculateSplit(100, 10, 'pix');
        $card = $finance->calculateSplit(100, 10, 'credit_card');

        $this->assertSame(1.19, $pix['stripe_fee']);
        $this->assertSame(4.38, $card['stripe_fee']);
        $this->assertGreaterThan(0, $pix['platform_commission']);
        $this->assertGreaterThan(0, $card['platform_commission']);
        $this->assertNotEquals($pix['stripe_fee'], $card['stripe_fee']);
    }

    public function test_dinheiro_has_zero_stripe_fee_but_platform_when_stripe_active(): void
    {
        config([
            'kinito.payment_provider' => 'stripe',
            'kinito.stripe.secret' => 'sk_test_dummy',
            'kinito.commissions.platform_percent' => 15,
            'kinito.commissions.company_percent' => 10,
        ]);

        $split = app(FinanceService::class)->calculateSplit(100, 10, 'dinheiro');

        $this->assertSame(0.0, $split['stripe_fee']);
        $this->assertSame(15.0, $split['platform_commission']);
        $this->assertSame(10.0, $split['company_cut']);
        $this->assertSame(75.0, $split['driver_net']);
    }

    public function test_stripe_provider_without_secret_is_inactive(): void
    {
        config([
            'kinito.payment_provider' => 'stripe',
            'kinito.stripe.secret' => '',
            'kinito.commissions.company_percent' => 10,
        ]);

        $split = app(FinanceService::class)->calculateSplit(100, 10, 'credit_card');

        $this->assertFalse(app(FinanceService::class)->isStripeActive());
        $this->assertSame(0.0, $split['stripe_fee']);
        $this->assertSame(0.0, $split['platform_commission']);
    }
}
