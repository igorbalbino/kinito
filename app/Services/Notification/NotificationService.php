<?php

namespace App\Services\Notification;

use App\Models\AppNotification;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppManager;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NotificationService
{
    public function __construct(
        private readonly WhatsAppManager $whatsapp,
    ) {}

    public function isSmtpConfigured(): bool
    {
        $host = config('mail.mailers.smtp.host');
        $from = config('mail.from.address');

        return filled($host)
            && $host !== '127.0.0.1'
            && filled($from);
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
     * Envia nos canais informados (ex.: email + whatsapp).
     *
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

        if (! $this->isSmtpConfigured()) {
            Log::warning('SMTP não configurado — e-mail não enviado.', [
                'to' => $user->email,
                'subject' => $title,
            ]);

            return false;
        }

        try {
            Mail::raw($message, function ($mail) use ($user, $title) {
                $mail->to($user->email)->subject('[Kinito] '.$title);
            });

            return true;
        } catch (Throwable $e) {
            Log::error('Falha ao enviar e-mail.', [
                'to' => $user->email,
                'subject' => $title,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
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
}
