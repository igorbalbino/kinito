<?php

namespace App\Support;

use App\Models\Plan;

final class PlanTier
{
    /** @return array<string, int> */
    public static function tiers(): array
    {
        return config('kinito.referral.plan_tiers', [
            'starter' => 1,
            'pro' => 2,
            'enterprise' => 3,
        ]);
    }

    public static function rank(Plan|string $plan): int
    {
        $slug = $plan instanceof Plan ? $plan->slug : $plan;

        return (int) (self::tiers()[$slug] ?? 0);
    }

    /**
     * @return list<string>
     */
    public static function allowedSlugsForRank(int $referrerRank): array
    {
        if ($referrerRank <= 0) {
            return [];
        }

        $slugs = [];
        foreach (self::tiers() as $slug => $rank) {
            if ($rank <= $referrerRank) {
                $slugs[] = $slug;
            }
        }

        usort($slugs, fn (string $a, string $b) => self::rank($b) <=> self::rank($a));

        return $slugs;
    }

    public static function canRefer(Plan $referrerPlan, Plan $targetPlan): bool
    {
        $referrerRank = self::rank($referrerPlan);
        $targetRank = self::rank($targetPlan);

        return $referrerRank > 0 && $targetRank > 0 && $targetRank <= $referrerRank;
    }
}
