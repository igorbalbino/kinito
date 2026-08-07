<?php

namespace App\Services\Mail;

use App\Models\User;
use App\Support\EmailTemplates;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Single entry point for all emails. Builds HTML via {@see EmailTemplates}
 * and sends through {@see SmtpMailService} (PHPMailer / SMTP_*).
 */
class MailService
{
    public function __construct(
        private readonly SmtpMailService $smtp,
    ) {}

    public function isConfigured(): bool
    {
        return $this->smtp->isConfigured();
    }

    /**
     * @param  array{user_id?:int|null, subject?:string}  $context
     */
    public function send(
        string $to,
        string $subject,
        string $html,
        ?string $type = null,
        array $context = [],
    ): bool {
        if (empty($to) || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $status = 'sent';
        $error = null;

        try {
            $ok = $this->smtp->send($to, $subject, $html, true);
            if (! $ok) {
                $status = 'failed';
                $error = 'SMTP rejeitou o envio (veja log "Falha ao enviar e-mail (SMTP)" — costuma ser autenticação)';
            }
        } catch (Throwable $e) {
            $status = 'failed';
            $error = $e->getMessage();
            Log::error('Falha ao enviar e-mail.', [
                'email_type' => $type,
                'recipient' => $to,
                'error' => $error,
            ]);
        }

        if ($type !== null) {
            Log::info('E-mail processado.', [
                'email_type' => $type,
                'recipient' => $to,
                'subject' => $context['subject'] ?? $subject,
                'user_id' => $context['user_id'] ?? null,
                'status' => $status,
                'error' => $error,
            ]);
        }

        return $status === 'sent';
    }

    public function sendVerification(User $user, string $verificationUrl): bool
    {
        return $this->send(
            $user->email,
            'Confirme seu e-mail - Kinito',
            EmailTemplates::verify($verificationUrl, (string) $user->name),
            'verification',
            ['user_id' => $user->id, 'subject' => 'Confirme seu e-mail - Kinito'],
        );
    }

    public function sendRegistration(User $user, string $verificationUrl): bool
    {
        return $this->send(
            $user->email,
            'Bem-vindo ao Kinito — confirme seu e-mail',
            EmailTemplates::verify($verificationUrl, (string) $user->name),
            'registration',
            ['user_id' => $user->id, 'subject' => 'Bem-vindo ao Kinito — confirme seu e-mail'],
        );
    }

    public function sendClientInvite(User $user, string $companyName, string $verificationUrl): bool
    {
        return $this->send(
            $user->email,
            'Confirme seu e-mail para ativar o acesso - Kinito',
            EmailTemplates::clientInvite((string) $user->name, $companyName, $verificationUrl),
            'client_invite',
            ['user_id' => $user->id, 'subject' => 'Confirme seu e-mail para ativar o acesso - Kinito'],
        );
    }

    public function sendDriverInvite(User $user, string $companyName, string $verificationUrl): bool
    {
        return $this->send(
            $user->email,
            'Confirme seu e-mail — motorista - Kinito',
            EmailTemplates::driverInvite((string) $user->name, $companyName, $verificationUrl),
            'driver_invite',
            ['user_id' => $user->id, 'subject' => 'Confirme seu e-mail — motorista - Kinito'],
        );
    }

    public function sendInviteCredentials(
        User $user,
        string $temporaryPassword,
        string $loginUrl,
        ?string $companyName = null,
    ): bool {
        $login = $user->email ?: (string) $user->phone;

        return $this->send(
            $user->email,
            'Seu acesso — senha temporária - Kinito',
            EmailTemplates::inviteCredentials(
                (string) $user->name,
                $login,
                $temporaryPassword,
                $loginUrl,
                $companyName,
            ),
            'invite_credentials',
            ['user_id' => $user->id, 'subject' => 'Seu acesso — senha temporária - Kinito'],
        );
    }

    public function sendPasswordReset(User $user, string $resetUrl): bool
    {
        return $this->send(
            $user->email,
            'Redefinir senha - Kinito',
            EmailTemplates::passwordReset((string) $user->name, $resetUrl),
            'password_reset',
            ['user_id' => $user->id, 'subject' => 'Redefinir senha - Kinito'],
        );
    }

    public function sendNotification(User $user, string $title, string $message, ?string $link = null): bool
    {
        return $this->send(
            $user->email,
            '[Kinito] '.$title,
            EmailTemplates::notification($title, $message, $link),
            'notification',
            ['user_id' => $user->id, 'subject' => '[Kinito] '.$title],
        );
    }

    public function sendProviderSelectedByClient(User $recipient, string $clientName, string $companyName): bool
    {
        return $this->send(
            $recipient->email,
            'Cliente selecionou seu fornecedor - Kinito',
            EmailTemplates::providerSelectedByClient($clientName, $companyName),
            'provider_selected_client',
            ['user_id' => $recipient->id, 'subject' => 'Cliente selecionou seu fornecedor - Kinito'],
        );
    }

    public function sendProviderSelectedByDriver(User $recipient, string $driverName, string $companyName): bool
    {
        return $this->send(
            $recipient->email,
            'Motorista selecionou sua empresa - Kinito',
            EmailTemplates::providerSelectedByDriver($driverName, $companyName),
            'provider_selected_driver',
            ['user_id' => $recipient->id, 'subject' => 'Motorista selecionou sua empresa - Kinito'],
        );
    }
}
