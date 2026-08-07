<?php

namespace App\Services\Notification;

use App\Models\AppNotification;
use App\Models\User;
use App\Services\Mail\MailService;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class NotificationService
{
    public function __construct(
        private readonly WhatsAppManager $whatsapp,
        private readonly MailService $mail,
    ) {}

    public function isSmtpConfigured(): bool
    {
        return $this->mail->isConfigured();
    }

    public function notify(
        User $user,
        string $title,
        string $message,
        string $category = 'sistema',
        string $type = 'info',
        string $channel = 'email',
        ?string $link = null,
    ): AppNotification {
        $notification = AppNotification::query()->create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'category' => $category,
            'type' => $type,
            'channel' => $channel,
            'link' => $link,
            'read' => false,
            'sent_at' => now(),
        ]);

        match ($channel) {
            'email' => $this->sendEmail($user, $title, $message, $link),
            'whatsapp' => $this->sendWhatsApp($user, $title, $message),
            default => null,
        };

        return $notification;
    }

    /**
     * @param  list<string>  $channels
     * @return list<AppNotification>
     */
    public function notifyChannels(
        User $user,
        string $title,
        string $message,
        array $channels = ['email'],
        string $category = 'sistema',
        string $type = 'info',
        ?string $link = null,
    ): array {
        $created = [];

        foreach ($channels as $channel) {
            $created[] = $this->notify($user, $title, $message, $category, $type, $channel, $link);
        }

        return $created;
    }

    public function sendEmail(User $user, string $title, string $message, ?string $link = null): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return $this->mail->sendNotification($user, $title, $message, $link);
    }

    /** Welcome + verification link after self-registration. */
    public function sendRegistrationEmail(User $user): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return $this->mail->sendRegistration($user, $this->verificationUrl($user));
    }

    /** Company invited a client: confirm email first (no password yet). */
    public function sendClientInviteEmail(User $user, string $companyName): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return $this->mail->sendClientInvite($user, $companyName, $this->verificationUrl($user));
    }

    /** Credentials after invite email was confirmed. */
    public function sendInviteCredentialsEmail(User $user, string $temporaryPassword, ?string $companyName = null): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $loginUrl = rtrim((string) config('kinito.frontend_url'), '/').'/login';

        return $this->mail->sendInviteCredentials($user, $temporaryPassword, $loginUrl, $companyName);
    }

    public function sendEmailVerification(User $user): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return $this->mail->sendVerification($user, $this->verificationUrl($user));
    }

    public function sendPasswordResetEmail(User $user, string $token): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $frontend = rtrim((string) config('kinito.frontend_url'), '/');
        $url = $frontend.'/reset-password?token='.$token.'&email='.urlencode($user->email);

        return $this->mail->sendPasswordReset($user, $url);
    }

    public function sendWhatsApp(User $user, string $title, string $message): bool
    {
        $body = filled($title) ? "*{$title}*\n\n{$message}" : $message;

        $meta = [];
        $companyId = $user->primaryCompany()?->id
            ?? $user->client?->preferences?->default_company_id
            ?? $user->client?->companies()->value('companies.id');

        if ($companyId) {
            $meta['company_id'] = $companyId;
        }

        $result = $this->whatsapp->sendToUser($user, $body, $meta);

        if (! $result->success) {
            Log::warning('WhatsApp não enviado.', [
                'user_id' => $user->id,
                'driver' => $result->driver,
                'error' => $result->error,
            ]);
        }

        return $result->success;
    }

    /** Signed API verify URL rewritten to the frontend page. */
    public function verificationUrl(User $user): string
    {
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $query = [];
        $parts = parse_url($apiUrl);
        if (! empty($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        $frontend = rtrim((string) config('kinito.frontend_url'), '/');

        return $frontend.'/verificar-email?'.http_build_query([
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
            'expires' => $query['expires'] ?? '',
            'signature' => $query['signature'] ?? '',
        ]);
    }
}
