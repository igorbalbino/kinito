<?php

namespace App\Support;

/**
 * HTML e-mail templates for Kinito (MedFlow-style layout).
 */
class EmailTemplates
{
    public static function verify(string $verificationUrl, string $name = ''): string
    {
        $greeting = $name !== '' ? 'Olá, '.e($name).'!' : 'Olá!';

        return self::layout(
            'Confirme seu e-mail',
            $greeting
            .'<p style="margin:16px 0;line-height:1.55;color:#334155;">'
            .'Seu cadastro no <strong>Kinito</strong> foi realizado. Confirme seu e-mail para ativar o acesso ao painel.'
            .'</p>'
            .self::button($verificationUrl, 'Confirmar e-mail')
            .'<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#64748b;">'
            .'O link é válido por 60 minutos. Se você não fez este cadastro, ignore esta mensagem.'
            .'</p>'
            .self::fallbackLink($verificationUrl)
        );
    }

    public static function clientInvite(string $name, string $companyName, string $verificationUrl): string
    {
        return self::layout(
            'Confirme seu e-mail',
            'Olá, '.e($name).'!'
            .'<p style="margin:16px 0;line-height:1.55;color:#334155;">'
            .'A empresa <strong>'.e($companyName).'</strong> cadastrou você no <strong>Kinito</strong>.'
            .'</p>'
            .'<p style="margin:0 0 16px;line-height:1.55;color:#334155;">'
            .'Confirme seu e-mail para receber a senha temporária e fazer o primeiro acesso.'
            .'</p>'
            .self::button($verificationUrl, 'Confirmar e-mail')
            .'<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#64748b;">'
            .'O link é válido por 60 minutos. Se você não esperava este convite, ignore esta mensagem.'
            .'</p>'
            .self::fallbackLink($verificationUrl)
        );
    }

    public static function inviteCredentials(
        string $name,
        string $login,
        string $temporaryPassword,
        string $loginUrl,
        ?string $companyName = null,
    ): string {
        $intro = $companyName
            ? 'Seu e-mail foi confirmado. A empresa <strong>'.e($companyName).'</strong> liberou seu acesso ao Kinito.'
            : 'Seu e-mail foi confirmado. Seu acesso ao Kinito está liberado.';

        return self::layout(
            'Seu acesso ao Kinito',
            'Olá, '.e($name).'!'
            .'<p style="margin:16px 0;line-height:1.55;color:#334155;">'.$intro.'</p>'
            .'<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 20px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">'
            .'<tr><td style="padding:14px 16px;font-size:14px;color:#334155;line-height:1.6;">'
            .'<div><span style="color:#64748b;">Login:</span> <strong>'.e($login).'</strong></div>'
            .'<div style="margin-top:6px;"><span style="color:#64748b;">Senha temporária:</span> <strong style="font-family:ui-monospace,monospace;">'.e($temporaryPassword).'</strong></div>'
            .'</td></tr></table>'
            .self::button($loginUrl, 'Entrar no painel')
            .'<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#64748b;">'
            .'No primeiro acesso você deverá trocar a senha.'
            .'</p>'
            .self::fallbackLink($loginUrl)
        );
    }

    public static function passwordReset(string $name, string $resetUrl): string
    {
        return self::layout(
            'Redefinir senha',
            'Olá, '.e($name).'!'
            .'<p style="margin:16px 0;line-height:1.55;color:#334155;">'
            .'Recebemos um pedido para redefinir sua senha no <strong>Kinito</strong>.'
            .'</p>'
            .self::button($resetUrl, 'Redefinir senha')
            .'<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#64748b;">'
            .'Se você não pediu isso, ignore esta mensagem.'
            .'</p>'
            .self::fallbackLink($resetUrl)
        );
    }

    public static function notification(string $title, string $message, ?string $link = null): string
    {
        $body = '<p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">'.e($title).'</p>'
            .'<p style="margin:12px 0;line-height:1.55;color:#334155;white-space:pre-wrap;">'.nl2br(e($message)).'</p>';

        if (filled($link)) {
            $body .= self::button((string) $link, 'Abrir no Kinito')
                .self::fallbackLink((string) $link);
        }

        return self::layout($title, $body);
    }

    public static function layout(string $preheader, string $innerHtml): string
    {
        $year = date('Y');
        $brand = e((string) config('app.name', 'Kinito'));
        $safePreheader = e($preheader);

        return <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$brand}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{$safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#0f172a;padding:22px 28px;">
              <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">{$brand}</div>
              <div style="margin-top:4px;font-size:12px;color:#94a3b8;">Mobilidade corporativa</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;color:#0f172a;">
              {$innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#94a3b8;">
              © {$year} {$brand}. Esta é uma mensagem automática — não responda este e-mail.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    private static function button(string $url, string $label): string
    {
        $safeUrl = e($url);
        $safeLabel = e($label);

        return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">'
            .'<tr><td style="border-radius:10px;background:#0f172a;">'
            .'<a href="'.$safeUrl.'" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">'
            .$safeLabel
            .'</a></td></tr></table>';
    }

    private static function fallbackLink(string $url): string
    {
        $safeUrl = e($url);

        return '<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">'
            .'Se o botão não funcionar, copie e cole este link no navegador:<br>'
            .'<a href="'.$safeUrl.'" style="color:#334155;">'.$safeUrl.'</a>'
            .'</p>';
    }
}
