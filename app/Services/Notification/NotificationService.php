<?php

namespace App\Services\Notification;

use App\Models\AppNotification;
use App\Models\User;
use App\Services\Mail\SmtpMailService;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class NotificationService
{
    public function __construct(
        private readonly WhatsAppManager $whatsapp,
        private readonly SmtpMailService $smtp,
    ) {}

    public function isSmtpConfigured(): bool
    {
        return $this->smtp->isConfigured();
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
            'email' => $this->sendEmail($user, $title, $message),
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

    public function sendEmail(User $user, string $title, string $message): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        return $this->smtp->send(
            $user->email,
            '[Kinito] '.$title,
            $message,
        );
    }

    /** Welcome + verification link after self-registration. */
    public function sendRegistrationEmail(User $user): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $loginUrl = rtrim((string) config('kinito.frontend_url'), '/').'/login';
        $verifyUrl = $this->verificationUrl($user);

        $body = "Olá, {$user->name}!\n\n"
            ."Seu cadastro no Kinito foi realizado com sucesso.\n\n"
            ."Confirme seu e-mail neste link (válido por 60 minutos):\n{$verifyUrl}\n\n"
            ."Acesse o painel: {$loginUrl}\n\n"
            .'Se você não fez este cadastro, ignore esta mensagem.';

        return $this->smtp->send($user->email, '[Kinito] Bem-vindo — confirme seu e-mail', $body);
    }

    public function sendEmailVerification(User $user): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $verifyUrl = $this->verificationUrl($user);
        $body = "Olá, {$user->name}!\n\n"
            ."Confirme seu e-mail no Kinito clicando no link abaixo (válido por 60 minutos):\n\n"
            ."{$verifyUrl}\n\n"
            .'Se você não solicitou isto, ignore esta mensagem.';

        return $this->smtp->send($user->email, '[Kinito] Confirme seu e-mail', $body);
    }

    public function sendPasswordResetEmail(User $user, string $token): bool
    {
        if (! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $frontend = rtrim((string) config('kinito.frontend_url'), '/');
        $url = $frontend.'/reset-password?token='.$token.'&email='.urlencode($user->email);

        $body = "Olá, {$user->name}!\n\n"
            ."Recebemos um pedido para redefinir sua senha no Kinito.\n\n"
            ."Use o link abaixo:\n{$url}\n\n"
            .'Se você não pediu isso, ignore esta mensagem.';

        return $this->smtp->send($user->email, '[Kinito] Redefinir senha', $body);
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

    private function verificationUrl(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );
    }
}
