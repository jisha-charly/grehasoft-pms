/**
 * CUSTOM HOOK: useHeartbeat
 * 
 * Purpose: Manage work session tracking via Web Worker
 * 
 * Features:
 * - Initialize and manage heartbeat worker
 * - Handle tracking enabled/disabled state
 * - Clean up on unmount
 * - Expose status and control methods
 * - Handle errors gracefully
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
  const [status, setStatus] = useState<HeartbeatStatus>({
    isRunning: false,
    isTrackingEnabled,
    lastPing: null,
    isMasterTab: false,
    error: null,
  });

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
      return;
    }

    try {
      // Create worker from imported script
      const workerScript = new URL('../workers/heartbeatWorker.ts', import.meta.url);
      workerRef.current = new Worker(workerScript, { type: 'module' });

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

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        console.error('[Heartbeat Worker] Fatal error:', error);
        setStatus((prev) => ({ ...prev, error: error.message }));
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
      console.error('[Heartbeat] Worker initialization failed:', errorMessage);
      setStatus((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [apiUrl, token, isTrackingEnabled]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (!workerRef.current) {
      initializeWorker();
    }

    workerRef.current?.postMessage({
      type: 'START',
      payload: {
        isTrackingEnabled,
      },
    });
  }, [isTrackingEnabled, initializeWorker]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP' });
  }, []);

  // Enable tracking
  const enableTracking = useCallback(() => {
    setStatus((prev) => ({ ...prev, isTrackingEnabled: true }));
    workerRef.current?.postMessage({ type: 'TRACKING_ENABLED' });
    startHeartbeat();
  }, [startHeartbeat]);

  // Disable tracking
  const disableTracking = useCallback(() => {
    setStatus((prev) => ({ ...prev, isTrackingEnabled: false }));
    workerRef.current?.postMessage({ type: 'TRACKING_DISABLED' });
    stopHeartbeat();
  }, [stopHeartbeat]);

  // Get worker status
  const getStatus = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STATUS' });
  }, []);

  // Handle tracking state changes
  useEffect(() => {
    if (!workerRef.current) {
      initializeWorker();
    }

    if (isTrackingEnabled && status.isTrackingEnabled !== isTrackingEnabled) {
      enableTracking();
    } else if (!isTrackingEnabled && status.isTrackingEnabled) {
      disableTracking();
    }
  }, [isTrackingEnabled, status.isTrackingEnabled, enableTracking, disableTracking, initializeWorker]);

  // Page Visibility API to ensure background pinging
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Heartbeat] Tab moved to background. Web worker will continue pinging.');
      } else {
        console.log('[Heartbeat] Tab active. Web worker pinging normally.');
        // Optionally get latest status or sync when returning to foreground
        getStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        stopHeartbeat();
        // Don't terminate worker, let it persist across re-renders
        // workerRef.current.terminate();
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
