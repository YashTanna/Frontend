import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const BASE_URL = 'https://honorifically-uncitied-aron.ngrok-free.dev';

/**
 * useNewDeviceSocket
 *
 * Listens on /topic/device/new
 * Called when backend registers a brand new ESP32 device.
 * onNewDevice({ deviceId, status }) → add new card to Dashboard.
 *
 * Separate from useDeviceSocket so the concern is clear:
 *   /topic/devices     → existing device status changed
 *   /topic/device/new  → brand new device just registered
 */
export function useNewDeviceSocket(onNewDevice) {
    const callbackRef = useRef(onNewDevice);

    useEffect(() => { callbackRef.current = onNewDevice; }, [onNewDevice]);

    useEffect(() => {
        const wsUrl = BASE_URL
            .replace(/^http:\/\//, 'ws://')
            .replace(/^https:\/\//, 'wss://');

        const client = new Client({
            brokerURL: `${wsUrl}/ws/websocket`,
            connectHeaders: { 'ngrok-skip-browser-warning': 'true' },
            reconnectDelay: 5000,

            onConnect: () => {
                console.log('[WS-NewDevice] Connected — subscribing to /topic/device/new');
                client.subscribe('/topic/device/new', (message) => {
                    try {
                        const device = JSON.parse(message.body);
                        console.log('[WS-NewDevice] New device registered:', device);
                        callbackRef.current?.(device);
                    } catch (e) {
                        console.error('[WS-NewDevice] Parse error:', e);
                    }
                });
            },

            onDisconnect: () => console.log('[WS-NewDevice] Disconnected'),
            onStompError: (f) => console.error('[WS-NewDevice] STOMP error:', f.headers['message']),
            onWebSocketError: (e) => console.error('[WS-NewDevice] WebSocket error:', e),
        });

        client.activate();
        return () => client.deactivate();
    }, []);
}