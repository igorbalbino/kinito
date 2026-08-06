<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Log;
use PHPMailer\PHPMailer\Exception as PhpMailerException;
use PHPMailer\PHPMailer\PHPMailer;
use Throwable;

/**
 * Envio SMTP direto (PHPMailer), independente de MAIL_MAILER do Laravel.
 * Usa SMTP_* (com fallback MAIL_*) — mesmo padrão Odara/Medflow.
 */
class SmtpMailService
{
    public function isConfigured(): bool
    {
        $host = $this->host();

        return filled($host)
            && $host !== '127.0.0.1'
            && filled($this->fromAddress());
    }

    public function send(string $to, string $subject, string $body, bool $isHtml = false): bool
    {
        if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Log::warning('E-mail inválido — envio ignorado.', ['to' => $to, 'subject' => $subject]);

            return false;
        }

        if (! $this->isConfigured()) {
            Log::warning('SMTP não configurado — e-mail não enviado.', [
                'to' => $to,
                'subject' => $subject,
                'host' => $this->host(),
            ]);

            return false;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $this->host();
            $mail->Port = $this->port();
            $mail->SMTPAuth = filled($this->username());
            $mail->Username = (string) $this->username();
            $mail->Password = (string) $this->password();
            $mail->CharSet = 'UTF-8';
            $mail->Timeout = 20;

            $crypto = strtolower($this->crypto());
            if (in_array($crypto, ['ssl', 'smtps'], true)) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif (in_array($crypto, ['tls', 'starttls'], true) || $this->port() === 587) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            }

            $mail->setFrom($this->fromAddress(), $this->fromName());
            $mail->addAddress($to);
            $mail->Subject = $subject;

            if ($isHtml) {
                $mail->isHTML(true);
                $mail->Body = $body;
                $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));
            } else {
                $mail->isHTML(false);
                $mail->Body = $body;
            }

            $mail->send();

            Log::info('E-mail enviado via SMTP.', ['to' => $to, 'subject' => $subject]);

            return true;
        } catch (PhpMailerException|Throwable $e) {
            Log::error('Falha ao enviar e-mail (SMTP).', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function host(): ?string
    {
        $host = env('SMTP_HOST', env('MAIL_HOST'));

        return filled($host) ? (string) $host : null;
    }

    private function port(): int
    {
        return (int) env('SMTP_PORT', env('MAIL_PORT', 587));
    }

    private function username(): ?string
    {
        $user = env('SMTP_USER', env('MAIL_USERNAME'));

        return filled($user) ? (string) $user : null;
    }

    private function password(): ?string
    {
        $pass = env('SMTP_PASS', env('MAIL_PASSWORD'));

        return filled($pass) ? (string) $pass : null;
    }

    private function crypto(): string
    {
        return (string) env('SMTP_CRYPTO', env('MAIL_SCHEME', 'tls'));
    }

    private function fromAddress(): string
    {
        return (string) env('MAIL_FROM', env('MAIL_FROM_ADDRESS', config('mail.from.address')));
    }

    private function fromName(): string
    {
        return (string) env('MAIL_FROM_NAME', config('mail.from.name', 'Kinito'));
    }
}
