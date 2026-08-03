<?php

namespace App\Services\Notification;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
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

        if ($channel === 'email') {
            // Log mailer in local; ready for real SMTP.
            Mail::raw($message, function ($mail) use ($user, $title) {
                $mail->to($user->email)->subject('[KINITO] '.$title);
            });
        }

        // WhatsApp / Push: stubs for future providers.
        return $notification;
    }
}
