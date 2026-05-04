/**
 * CUSTOM HOOK: useHeartbeat
 * 
 * Purpose: Manage work session tracking via Web Worker with a safe main-thread fallback
 * 
 * Features:
 * - Initialize and manage heartbeat worker from /public folder
 * - Safe fallback to main thread if worker fails
 * - Handle tracking enabled/disabled state
 * - Clean up on unmount
 * - Expose status and control methods
 * - Handle errors gracefully (401, 403)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface HeartbeatStatus {
  isRunning: boolean;
  isTrackingEnabled: boolean;
  lastPing: Date | null;
  isMasterTab: boolean;
  error: string | null;
}

interface UseHeartbeatOptions {
  isTrackingEnabled: boolean;
  apiUrl?: string;
  token?: string;
}

export const useHeartbeat = (options: UseHeartbeatOptions) => {
  const { isTrackingEnabled, apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1', token = '' } = options;

  const workerRef = useRef<Worker | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  const [status, setStatus] = useState<HeartbeatStatus>({
    isRunning: false,
    isTrackingEnabled,
    lastPing: null,
    isMasterTab: false,
    error: null,
  });

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current || fallbackActive) {
      return;
    }

    try {
      // Use public folder path (production safe)
      workerRef.current = new Worker('/heartbeatWorker.js');

      // Listen for worker messages
      workerRef.current.onmessage = (event) => {
        const { type, isRunning, isTrackingEnabled: tracking, isMasterTab, error } = event.data;

        switch (type) {
          case 'READY':
            console.log('[Heartbeat Worker] Ready');
            setStatus((prev) => ({ ...prev, error: null }));
            break;

          case 'HEARTBEAT_STARTED':
            console.log('[Heartbeat Worker] Started with interval:', event.data.interval);
            setStatus((prev) => ({ ...prev, isRunning: true, error: null }));
            break;

          case 'HEARTBEAT_STOPPED':
            console.log('[Heartbeat Worker] Stopped:', event.data.reason);
            setStatus((prev) => ({ ...prev, isRunning: false }));
            break;

          case 'HEARTBEAT_SENT':
            console.log('[Heartbeat Worker] Ping sent, status:', event.data.status);
            setStatus((prev) => ({
              ...prev,
              lastPing: new Date(),
              isMasterTab: true,
            }));
            break;

          case 'HEARTBEAT_ERROR':
            console.error('[Heartbeat Worker] Error:', error);
            setStatus((prev) => ({ ...prev, error }));
            break;

          case 'TOKEN_EXPIRED':
            console.error('[Heartbeat Worker] Token Expired');
            setStatus((prev) => ({ ...prev, error: 'TOKEN_EXPIRED' }));
            // Implement logout or refresh logic here if needed globally
            break;

          case 'TRACKING_DISABLED':
            console.warn('[Heartbeat Worker] Tracking disabled by server');
            setStatus((prev) => ({ ...prev, error: 'TRACKING_DISABLED', isTrackingEnabled: false }));
            break;

          case 'STATUS_RESPONSE':
            setStatus((prev) => ({
              ...prev,
              isRunning,
              isTrackingEnabled: tracking,
              isMasterTab,
            }));
            break;

          default:
            console.warn('[Heartbeat Worker] Unknown message type:', type);
        }
      };

      // Handle worker fatal errors -> Trigger fallback
      workerRef.current.onerror = (error) => {
        console.error('[Heartbeat Worker] Fatal error:', error);
        workerRef.current?.terminate();
        workerRef.current = null;
        setFallbackActive(true);
        setStatus((prev) => ({ ...prev, error: 'Worker crashed. Fallback active.' }));
      };

      // Initialize worker with config
      workerRef.current.postMessage({
        type: 'INIT',
        payload: {
          apiUrl,
          token,
          isTrackingEnabled,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create worker';
      console.error('[Heartbeat Worker] Initialization failed:', errorMessage);
      setFallbackActive(true);
      setStatus((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [apiUrl, token, isTrackingEnabled, fallbackActive]);

  // Main Thread Fallback Ping
  const fallbackPing = useCallback(async () => {
    if (!isTrackingEnabled || !token || !apiUrl) return;

    try {
      const response = await fetch(`${apiUrl}/tracking/heartbeat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          missed_heartbeats: [],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) setStatus((prev) => ({ ...prev, error: 'TOKEN_EXPIRED' }));
        if (response.status === 403) setStatus((prev) => ({ ...prev, error: 'TRACKING_DISABLED', isTrackingEnabled: false }));
        throw new Error(`Server error: ${response.status}`);
      }

      console.log('[Heartbeat Fallback] Ping sent successfully');
      setStatus((prev) => ({ ...prev, lastPing: new Date(), isMasterTab: true, error: null }));
    } catch (error) {
      console.error('[Heartbeat Fallback] Ping failed:', error);
    }
  }, [isTrackingEnabled, token, apiUrl]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (fallbackActive) {
      if (!fallbackIntervalRef.current) {
        console.log('[Heartbeat Fallback] Starting interval');
        fallbackPing(); // Send immediately
        fallbackIntervalRef.current = setInterval(fallbackPing, 60000);
        setStatus((prev) => ({ ...prev, isRunning: true }));
      }
      return;
    }

    if (!workerRef.current) {
      initializeWorker();
    }

    workerRef.current?.postMessage({
      type: 'START',
      payload: { isTrackingEnabled },
    });
  }, [isTrackingEnabled, initializeWorker, fallbackActive, fallbackPing]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (fallbackActive && fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
      setStatus((prev) => ({ ...prev, isRunning: false }));
      return;
    }
    workerRef.current?.postMessage({ type: 'STOP' });
  }, [fallbackActive]);

  // Enable tracking
  const enableTracking = useCallback(() => {
    setStatus((prev) => ({ ...prev, isTrackingEnabled: true }));
    if (fallbackActive) {
      startHeartbeat();
    } else {
      workerRef.current?.postMessage({ type: 'TRACKING_ENABLED' });
      startHeartbeat();
    }
  }, [startHeartbeat, fallbackActive]);

  // Disable tracking
  const disableTracking = useCallback(() => {
    setStatus((prev) => ({ ...prev, isTrackingEnabled: false }));
    if (fallbackActive) {
      stopHeartbeat();
    } else {
      workerRef.current?.postMessage({ type: 'TRACKING_DISABLED' });
      stopHeartbeat();
    }
  }, [stopHeartbeat, fallbackActive]);

  // Get worker status
  const getStatus = useCallback(() => {
    if (fallbackActive) return;
    workerRef.current?.postMessage({ type: 'STATUS' });
  }, [fallbackActive]);

  // Keep worker token synced when it refreshes
  useEffect(() => {
    if (workerRef.current && token && !fallbackActive) {
      workerRef.current.postMessage({
        type: 'UPDATE_TOKEN',
        payload: { token },
      });
    }
  }, [token, fallbackActive]);

  // Handle tracking state changes
  useEffect(() => {
    if (!fallbackActive && !workerRef.current) {
      initializeWorker();
    }

    if (isTrackingEnabled && status.isTrackingEnabled !== isTrackingEnabled) {
      enableTracking();
    } else if (!isTrackingEnabled && status.isTrackingEnabled) {
      disableTracking();
    }
  }, [isTrackingEnabled, status.isTrackingEnabled, enableTracking, disableTracking, initializeWorker, fallbackActive]);

  // Handle Fallback activation dynamically
  useEffect(() => {
    if (fallbackActive && isTrackingEnabled && !status.isRunning) {
      startHeartbeat();
    }
  }, [fallbackActive, isTrackingEnabled, status.isRunning, startHeartbeat]);

  // Page Visibility API to ensure background pinging
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Heartbeat] Tab moved to background.');
      } else {
        console.log('[Heartbeat] Tab active. Forcing immediate ping to sync.');
        if (fallbackActive) {
          fallbackPing();
        } else {
          workerRef.current?.postMessage({ type: 'FORCE_PING' });
        }
        getStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getStatus, fallbackActive, fallbackPing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        stopHeartbeat();
        // Do NOT terminate worker to allow background tracking to continue across re-renders
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [stopHeartbeat]);

  return {
    status,
    startHeartbeat,
    stopHeartbeat,
    enableTracking,
    disableTracking,
    getStatus,
  };
};

export default useHeartbeat;
