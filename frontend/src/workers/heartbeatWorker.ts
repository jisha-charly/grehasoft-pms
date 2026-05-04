/**
 * HEARTBEAT WEB WORKER
 * 
 * Purpose: Handle heartbeat pings in a background worker thread
 * 
 * Features:
 * - Runs in background even when tab is minimized
 * - Uses Axios for consistent API requests
 * - Exponential backoff retry logic for failed pings
 * - Offline queueing for missed heartbeats
 * - Handles multi-tab synchronization via BroadcastChannel
 * - Automatic cleanup on message
 */

import axios from 'axios';

// Configuration
const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 10000, 20000]; // 5s, 10s, 20s
const CHANNEL_NAME = 'tracking_heartbeat';

const MESSAGE_TYPES = {
  START: 'START',
  STOP: 'STOP',
  PING: 'PING',
  STATUS: 'STATUS',
  TRACKING_ENABLED: 'TRACKING_ENABLED',
  TRACKING_DISABLED: 'TRACKING_DISABLED',
  FORCE_PING: 'FORCE_PING',
};

// State
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let isTrackingEnabled = false;
let apiToken: string | null = null;
let apiUrl: string | null = null;
let isMasterTab = false;

// Offline queueing
let missedHeartbeats: string[] = [];

// Worker Axios Instance
const workerAxios = axios.create({
  timeout: 30000, // 30s timeout handles Render cold starts
});

// BroadcastChannel for multi-tab synchronization
let channel: BroadcastChannel | null = null;

// Initialize BroadcastChannel
function initChannel() {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleChannelMessage;
  } catch (error) {
    console.warn('BroadcastChannel not supported, multi-tab sync disabled:', error);
  }
}

// Handle messages from other tabs
function handleChannelMessage(event: MessageEvent) {
  const { type, data } = event.data;

  switch (type) {
    case MESSAGE_TYPES.START:
      // Another tab started, stop this one
      if (isRunning && !isMasterTab) {
        stopHeartbeat('Another tab started');
      }
      break;

    case MESSAGE_TYPES.STOP:
      if (!isRunning && data?.isExplicit) {
        // Only stop if explicitly stopped
      }
      break;

    case MESSAGE_TYPES.TRACKING_DISABLED:
      if (isRunning) {
        stopHeartbeat('Tracking disabled');
      }
      break;

    case MESSAGE_TYPES.TRACKING_ENABLED:
      updateTrackingState(true);
      if (!isRunning) {
        startHeartbeat();
      }
      break;

    case MESSAGE_TYPES.FORCE_PING:
      if (isRunning && isMasterTab) {
        sendHeartbeat();
      }
      break;

    case MESSAGE_TYPES.STATUS:
      self.postMessage({
        type: 'STATUS_RESPONSE',
        isRunning,
        isTrackingEnabled,
        isMasterTab,
      });
      break;
  }
}

// Broadcast message to other tabs
function broadcastMessage(type: string, data: any = {}) {
  if (channel) {
    try {
      channel.postMessage({ type, data });
    } catch (error) {
      console.warn('Failed to broadcast message:', error);
    }
  }
}

// Update tracking state
function updateTrackingState(enabled: boolean) {
  isTrackingEnabled = enabled;
}

// Start heartbeat
function startHeartbeat() {
  if (isRunning || !isTrackingEnabled || !apiToken || !apiUrl) {
    return;
  }

  isRunning = true;
  isMasterTab = true;
  broadcastMessage(MESSAGE_TYPES.START);

  // Send first ping immediately
  sendHeartbeat();

  // Schedule subsequent pings
  intervalId = setInterval(() => {
    if (isTrackingEnabled && isRunning) {
      sendHeartbeat();
    }
  }, HEARTBEAT_INTERVAL);

  self.postMessage({
    type: 'HEARTBEAT_STARTED',
    interval: HEARTBEAT_INTERVAL,
  });
}

// Stop heartbeat
function stopHeartbeat(reason = 'User request') {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  isMasterTab = false;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  broadcastMessage(MESSAGE_TYPES.STOP, { isExplicit: true });

  self.postMessage({
    type: 'HEARTBEAT_STOPPED',
    reason,
  });
}

// Axios Request with Exponential Backoff
async function axiosWithRetry(config: any, retries = 0): Promise<any> {
  try {
    return await workerAxios(config);
  } catch (error: any) {
    // Abort retry if unauthorized (tracking disabled or token invalid)
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw error;
    }

    if (retries >= MAX_RETRIES) {
      throw error;
    }

    const delay = RETRY_DELAYS[retries] || 30000;
    console.warn(`[Worker] Heartbeat failed. Retrying in ${delay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    
    return axiosWithRetry(config, retries + 1);
  }
}

// Send heartbeat ping to server
async function sendHeartbeat() {
  if (!isTrackingEnabled || !apiToken || !apiUrl) {
    return;
  }

  const currentPingTime = new Date().toISOString();

  try {
    const payload = {
      timestamp: currentPingTime,
      missed_heartbeats: missedHeartbeats, // Send any queued offline pings
    };

    const response = await axiosWithRetry({
      url: `${apiUrl}/tracking/heartbeat/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      data: payload,
    });

    // Success! Clear the offline queue
    missedHeartbeats = [];

    self.postMessage({
      type: 'HEARTBEAT_SENT',
      success: response.data.success,
      status: response.data.status,
      sessionId: response.data.session_id,
      timestamp: currentPingTime,
    });
  } catch (error: any) {
    console.error('[Worker] Heartbeat error after retries:', error);

    if (error.response?.status === 403 || error.response?.status === 401) {
      updateTrackingState(false);
      stopHeartbeat(error.response.status === 401 ? 'Token expired' : 'Tracking disabled on server');
      broadcastMessage(MESSAGE_TYPES.TRACKING_DISABLED);
      
      self.postMessage({
        type: error.response.status === 401 ? 'TOKEN_EXPIRED' : 'TRACKING_DISABLED',
        error: error.message,
      });
    } else {
      // Network or 5xx error: Queue this heartbeat for later recovery
      console.warn('[Worker] Queuing failed heartbeat for later recovery');
      missedHeartbeats.push(currentPingTime);
    }

    self.postMessage({
      type: 'HEARTBEAT_ERROR',
      error: error instanceof Error ? error.message : String(error),
      queuedCount: missedHeartbeats.length,
    });
  }
}

// Main message handler
self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      apiUrl = payload.apiUrl;
      apiToken = payload.token;
      isTrackingEnabled = payload.isTrackingEnabled;
      initChannel();
      self.postMessage({ type: 'READY' });
      break;

    case 'UPDATE_TOKEN':
      apiToken = payload.token;
      break;

    case 'START':
      isTrackingEnabled = payload.isTrackingEnabled || isTrackingEnabled;
      startHeartbeat();
      break;

    case 'STOP':
      stopHeartbeat();
      break;

    case 'FORCE_PING':
      // Trigger immediate ping if active (used for Page Visibility API)
      if (isRunning && isMasterTab) {
        sendHeartbeat();
        broadcastMessage(MESSAGE_TYPES.FORCE_PING);
      }
      break;

    case 'TRACKING_ENABLED':
      updateTrackingState(true);
      if (!isRunning) {
        startHeartbeat();
      }
      broadcastMessage(MESSAGE_TYPES.TRACKING_ENABLED);
      break;

    case 'TRACKING_DISABLED':
      if (isRunning) {
        stopHeartbeat('Tracking disabled');
      }
      updateTrackingState(false);
      broadcastMessage(MESSAGE_TYPES.TRACKING_DISABLED);
      break;

    case 'STATUS':
      self.postMessage({
        type: 'STATUS_RESPONSE',
        isRunning,
        isTrackingEnabled,
        isMasterTab,
      });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

// Handle worker closure
self.onclose = () => {
  stopHeartbeat('Worker closed');
  if (channel) {
    channel.close();
  }
};
