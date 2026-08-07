<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Client\ClientOnboardingService;
use App\Services\Driver\DriverApprovalService;
use App\Services\Notification\NotificationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly ClientOnboardingService $clients,
        private readonly DriverApprovalService $drivers,
        private readonly NotificationService $notifications,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $data['role'] === UserRole::Motorista->value
            ? $this->drivers->selfRegister($data)
            : $this->clients->selfRegister($data);

        return response()->json([
            'message' => 'Cadastro realizado. Confirme seu e-mail para acessar o painel.',
            'email_verification_required' => true,
            'email' => $result['user']->email,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->string('login')->toString();
        $user = User::findForLogin($login);

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Credenciais inválidas.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Conta desativada.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
                'errors' => [
                    'login' => ['Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'],
                ],
                'email_unverified' => true,
                'email' => $user->email,
            ], 422);
        }

        $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load(['roles', 'driver.documents', 'driver.primaryCompany', 'driver.previousPrimaryCompany', 'client.preferences', 'client.companies', 'companies', 'ownedCompanies'])),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Senha atual incorreta.'],
            ]);
        }

        $user->forceFill([
            'password' => $data['password'],
            'must_change_password' => false,
            'remember_token' => Str::random(60),
        ])->save();

        return response()->json([
            'message' => 'Senha atualizada com sucesso.',
            'user' => new UserResource($user->fresh()->load(['roles', 'driver', 'client', 'companies', 'ownedCompanies'])),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout realizado.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource(
            $request->user()->load(['roles', 'driver.documents', 'driver.primaryCompany', 'driver.previousPrimaryCompany', 'client.preferences', 'client.companies', 'companies', 'ownedCompanies'])
        );
    }

    public function updateMe(Request $request): UserResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'avatar' => ['nullable', 'string', 'max:500'],
        ]);

        $request->user()->update($data);

        return new UserResource($request->user()->fresh()->load(['roles', 'driver', 'client', 'companies', 'ownedCompanies']));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => __($status)]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => __($status)]);
    }

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Link inválido.'], 403);
        }

        $alreadyVerified = $user->hasVerifiedEmail();
        $isInvitePendingCredentials = ! $alreadyVerified && $user->must_change_password;
        $credentialsSent = false;

        if (! $alreadyVerified) {
            $user->markEmailAsVerified();
            event(new Verified($user));

            if ($isInvitePendingCredentials) {
                $tempPassword = Str::password(10);
                $user->forceFill([
                    'password' => $tempPassword,
                    'must_change_password' => true,
                ])->save();

                $companyName = $user->client?->companies()->orderByDesc('client_company.created_at')->value('companies.name')
                    ?? $user->driver?->companies()->orderByDesc('driver_company.created_at')->value('companies.name');
                $this->notifications->sendInviteCredentialsEmail($user->fresh(), $tempPassword, $companyName);
                $credentialsSent = true;
            }
        }

        return response()->json([
            'message' => $credentialsSent
                ? 'E-mail confirmado. Enviamos sua senha temporária por e-mail.'
                : 'E-mail verificado com sucesso.',
            'credentials_sent' => $credentialsSent,
            'already_verified' => $alreadyVerified,
        ]);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email já verificado.']);
        }

        $this->notifications->sendEmailVerification($request->user());

        return response()->json(['message' => 'Link de verificação enviado.']);
    }

    /** Public resend for the “check your inbox” page (no auth). */
    public function resendVerificationPublic(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            $this->notifications->sendEmailVerification($user);
        }

        return response()->json([
            'message' => 'Se o e-mail existir e ainda não estiver confirmado, enviamos um novo link.',
        ]);
    }
}
