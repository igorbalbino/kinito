<?php

namespace App\Services\WhatsApp;

use App\Models\Company;
use App\Models\CompanySetting;

/**
 * Orquestra conexão WhatsApp por empresa (sessionId = company.id).
 */
class CompanyWhatsAppService
{
    public function __construct(
        private readonly WhatsAppGatewayClient $client,
    ) {}

    public function settingsFor(Company $company): CompanySetting
    {
        return $company->settings()->firstOrCreate(
            ['company_id' => $company->id],
            [
                'modelo_corridas' => 'AMBOS',
                'accept_instant_rides' => true,
                'allow_scheduling' => true,
            ]
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function status(Company $company): array
    {
        $settings = $this->settingsFor($company);

        if (! $this->client->isConfigured()) {
            return $this->offlineStatus($settings, 'gateway_not_configured');
        }

        $result = $this->client->status($company->id);
        if (! $result['ok']) {
            return $this->offlineStatus($settings, 'gateway_error');
        }

        $this->syncStatus($settings, $result['data']);

        return $this->enrich($settings->fresh(), array_merge($result['data'], [
            'gateway_available' => true,
            'provider' => 'baileys',
            'session_id' => (string) $company->id,
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    public function connect(Company $company): array
    {
        $settings = $this->settingsFor($company);

        if (! $this->client->isConfigured()) {
            return $this->offlineStatus($settings, 'gateway_not_configured');
        }

        $secret = bin2hex(random_bytes(32));
        $settings->update([
            'whatsapp_webhook_secret' => $secret,
            'whatsapp_enabled' => true,
        ]);

        $result = $this->client->connect($company->id, $secret);
        if (! $result['ok']) {
            return $this->offlineStatus($settings->fresh(), 'gateway_error');
        }

        $this->syncStatus($settings, $result['data']);

        return $this->enrich($settings->fresh(), array_merge($result['data'], [
            'gateway_available' => true,
            'provider' => 'baileys',
            'session_id' => (string) $company->id,
        ]));
    }

    /**
     * @return array<string, mixed>
     */
    public function disconnect(Company $company): array
    {
        if ($this->client->isConfigured()) {
            $this->client->disconnect($company->id);
        }

        $settings = $this->settingsFor($company);
        $settings->update([
            'whatsapp_connected' => false,
            'whatsapp_phone' => null,
            'whatsapp_webhook_secret' => null,
            'whatsapp_enabled' => false,
        ]);

        return $this->enrich($settings->fresh(), [
            'status' => 'disconnected',
            'connected' => false,
            'qr' => null,
            'phone' => null,
            'gateway_available' => $this->client->isConfigured(),
            'provider' => 'baileys',
            'session_id' => (string) $company->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncStatus(CompanySetting $settings, array $data): void
    {
        $connected = (bool) ($data['connected'] ?? false);

        $settings->update([
            'whatsapp_connected' => $connected,
            'whatsapp_phone' => $connected ? ($data['phone'] ?? null) : $settings->whatsapp_phone,
            'whatsapp_enabled' => $connected ? true : $settings->whatsapp_enabled,
        ]);
    }

    /**
     * @param  array<string, mixed>  $status
     * @return array<string, mixed>
     */
    private function enrich(CompanySetting $settings, array $status): array
    {
        return array_merge($status, [
            'whatsapp_enabled' => (bool) $settings->whatsapp_enabled,
            'stored_connected' => (bool) $settings->whatsapp_connected,
            'stored_phone' => $settings->whatsapp_phone,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function offlineStatus(CompanySetting $settings, string $reason): array
    {
        return $this->enrich($settings, [
            'status' => $settings->whatsapp_connected ? 'connected' : 'disconnected',
            'connected' => (bool) $settings->whatsapp_connected,
            'qr' => null,
            'phone' => $settings->whatsapp_phone,
            'gateway_available' => false,
            'error' => $reason,
            'provider' => config('kinito.whatsapp.provider'),
            'session_id' => (string) $settings->company_id,
        ]);
    }
}
