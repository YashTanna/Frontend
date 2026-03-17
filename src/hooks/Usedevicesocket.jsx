import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const BASE_URL = 'https://honorifically-uncitied-aron.ngrok-free.dev';

export function useDeviceSocket(onDeviceUpdate) {
    const callbackRef = useRef(onDeviceUpdate);
    useEffect(() => { callbackRef.current = onDeviceUpdate; }, [onDeviceUpdate]);

    useEffect(() => {
        const wsUrl = BASE_URL
            .replace(/^http:\/\//, 'ws://')
            .replace(/^https:\/\//, 'wss://');

        const brokerURL = `${wsUrl}/ws/websocket`;
        console.log('[WS] Attempting connection to:', brokerURL);

        const client = new Client({
            brokerURL,
            connectHeaders: { 'ngrok-skip-browser-warning': 'true' },
            reconnectDelay: 5000,

            onConnect: (frame) => {
                console.log('[WS] ✅ Connected!', frame);

                const sub = client.subscribe('/topic/devices', (message) => {
                    console.log('[WS] 📨 Message received:', message.body);
                    try {
                        const update = JSON.parse(message.body);
                        console.log('[WS] Parsed update:', update);
                        callbackRef.current?.(update);
                    } catch (e) {
                        console.error('[WS] Parse error:', e);
                    }
                });
                console.log('[WS] Subscribed to /topic/devices, id:', sub.id);
            },

            onDisconnect: () => {
                console.log('[WS] ❌ Disconnected');
            },

            onStompError: (frame) => {
                console.error('[WS] STOMP error:', frame.headers['message'], frame);
            },

            onWebSocketError: (e) => {
                console.error('[WS] WebSocket error:', e);
            },

            onWebSocketClose: (e) => {
                console.log('[WS] WebSocket closed:', e.code, e.reason);
            },
        });

        client.activate();
        console.log('[WS] Client activated');

        return () => {
            console.log('[WS] Deactivating client');
            client.deactivate();
        };
    }, []);

}