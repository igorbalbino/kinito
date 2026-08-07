<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Confirme seu e-mail antes de continuar.',
                'code' => 'email_unverified',
            ], 403);
        }

        return $next($request);
    }
}
