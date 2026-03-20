import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';


const BASE_URL = 'https://honorifically-uncitied-aron.ngrok-free.dev';

export function useDeviceSocket(onDeviceUpdate, testId = null, onTestResult = null) {
    const deviceCallbackRef = useRef(onDeviceUpdate);
    const testCallbackRef = useRef(onTestResult);
    const testIdRef = useRef(testId);        // always current testId
    const testSubRef = useRef(null);
    const clientRef = useRef(null);

    // Keep all refs current without reconnecting
    useEffect(() => { deviceCallbackRef.current = onDeviceUpdate; }, [onDeviceUpdate]);
    useEffect(() => { testCallbackRef.current = onTestResult; }, [onTestResult]);
    useEffect(() => { testIdRef.current = testId; }, [testId]);

    // ── Subscribe to test topic ────────────────────────────────────────────────
    const subscribeToTest = (client, id) => {
        // Unsubscribe from previous if any
        if (testSubRef.current) {
            testSubRef.current.unsubscribe();
            testSubRef.current = null;
            console.log('[WS] Unsubscribed from previous test topic');
        }

        if (!id) return;

        const topic = `/topic/test/${id}`;
        testSubRef.current = client.subscribe(topic, (message) => {
            try {
                const result = JSON.parse(message.body);
                console.log('[WS] 🎯 Test result received:', result);
                testCallbackRef.current?.(result);
            } catch (e) {
                console.error('[WS] Test result parse error:', e);
            }
        });
        console.log('[WS] Subscribed to test topic:', topic);
    };

    // ── Main WebSocket connection — runs once ──────────────────────────────────
    useEffect(() => {
        const wsUrl = BASE_URL
            .replace(/^http:\/\//, 'ws://')
            .replace(/^https:\/\//, 'wss://');

        console.log('[WS] Connecting to:', `${wsUrl}/ws/websocket`);

        const client = new Client({
            brokerURL: `${wsUrl}/ws/websocket`,
            connectHeaders: { 'ngrok-skip-browser-warning': 'true' },
            reconnectDelay: 5000,

            onConnect: (frame) => {
                console.log('[WS] ✅ Connected!');

                // Subscribe to device status
                client.subscribe('/topic/devices', (message) => {
                    try {
                        const update = JSON.parse(message.body);
                        console.log('[WS] Device update:', update);
                        deviceCallbackRef.current?.(update);
                    } catch (e) {
                        console.error('[WS] Device parse error:', e);
                    }
                });
                console.log('[WS] Subscribed to /topic/devices');

                // If a test is already in progress when connection (re)establishes
                // re-subscribe to its topic so we don't miss the result
                if (testIdRef.current) {
                    console.log('[WS] Re-subscribing to test topic after connect:', testIdRef.current);
                    subscribeToTest(client, testIdRef.current);
                }
            },

            onDisconnect: () => console.log('[WS] Disconnected'),
            onStompError: (f) => console.error('[WS] STOMP error:', f.headers['message']),
            onWebSocketError: (e) => console.error('[WS] WebSocket error:', e),
            onWebSocketClose: (e) => console.log('[WS] WebSocket closed:', e.code, e.reason),
        });

        client.activate();
        clientRef.current = client;

        return () => client.deactivate();
    }, []);

    // ── React to testId changes ────────────────────────────────────────────────
    // When testId is set → subscribe to /topic/test/{testId}
    // When testId is null → unsubscribe
    useEffect(() => {
        const client = clientRef.current;
        if (!client) return;

        if (!testId) {
            // Test done — unsubscribe
            if (testSubRef.current) {
                testSubRef.current.unsubscribe();
                testSubRef.current = null;
                console.log('[WS] Unsubscribed — test done');
            }
            return;
        }

        // If client is connected right now — subscribe immediately
        if (client.connected) {
            subscribeToTest(client, testId);
        } else {
            // Client reconnecting — subscribeToTest will be called from onConnect
            console.log('[WS] Client not connected yet — will subscribe on reconnect for testId:', testId);
        }
    }, [testId]);
}