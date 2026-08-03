<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppNotificationResource;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest();

        if ($request->boolean('unread_only')) {
            $query->where('read', false);
        }

        return AppNotificationResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function markRead(Request $request, AppNotification $notification): AppNotificationResource
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['read' => true]);

        return new AppNotificationResource($notification);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['message' => 'Notificações marcadas como lidas.']);
    }
}
