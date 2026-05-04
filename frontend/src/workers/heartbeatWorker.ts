/**
 * HEARTBEAT WEB WORKER
 * 
 * Purpose: Handle heartbeat pings in a background worker thread
 * 
 * Features:
 * - Runs in background even when tab is minimized
 * - Uses native Fetch API (no bundler dependencies)
 * - Exponential backoff retry logic for failed pings
 * - Offline queueing for missed heartbeats
 * - Handles multi-tab synchronization via BroadcastChannel
 * - Automatic cleanup on message
 */

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
let intervalId: any = null;
let isTrackingEnabled = false;
let apiToken: string | null = null;
let apiUrl: string | null = null;
let isMasterTab = false;

// Offline queueing
let missedHeartbeats: string[] = [];

// BroadcastChannel for multi-tab synchronization
let channel: BroadcastChannel | null = null;

// Initialize BroadcastChannel
function initChannel() {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = handleChannelMessage;
  } catch (error) {
    console.warn('[Worker] BroadcastChannel not supported, multi-tab sync disabled:', error);
  }
}

// Handle messages from other tabs
function handleChannelMessage(event: MessageEvent) {
  const { type, data } = event.data;

  switch (type) {
    case MESSAGE_TYPES.START:
      if (isRunning && !isMasterTab) {
        stopHeartbeat('Another tab started');
      }
      break;

    case MESSAGE_TYPES.STOP:
      if (!isRunning && data && data.isExplicit) {
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
      console.warn('[Worker] Failed to broadcast message:', error);
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
function stopHeartbeat(reason: string = 'User request') {
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

// Fetch with Exponential Backoff
async function fetchWithRetry(url: string, options: any, retries: number = 0): Promise<any> {
  try {
    // Add timeout logic for fetch (Render cold starts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Don't retry on 401/403 auth errors
      if (response.status === 401 || response.status === 403) {
        const error: any = new Error(`Auth Error: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err: any) {
    // Check auth explicitly
    if (err.status === 401 || err.status === 403) {
      throw err;
    }

    if (retries >= MAX_RETRIES) {
      throw err;
    }

    const delay = RETRY_DELAYS[retries] || 30000;
    console.warn(`[Worker] Request failed. Retrying in ${delay / 1000}s...`);
    
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries + 1);
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
      missed_heartbeats: missedHeartbeats,
    };

    const data = await fetchWithRetry(`${apiUrl}/tracking/heartbeat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    // Success! Clear the offline queue
    missedHeartbeats = [];

    self.postMessage({
      type: 'HEARTBEAT_SENT',
      success: data.success,
      status: data.status,
      sessionId: data.session_id,
      timestamp: currentPingTime,
    });
  } catch (err: any) {
    console.error('[Worker] Heartbeat error after retries:', err);

    if (err.status === 401 || err.status === 403) {
      updateTrackingState(false);
      stopHeartbeat(err.status === 401 ? 'Token expired' : 'Tracking disabled on server');
      broadcastMessage(MESSAGE_TYPES.TRACKING_DISABLED);
      
      self.postMessage({
        type: err.status === 401 ? 'TOKEN_EXPIRED' : 'TRACKING_DISABLED',
        error: err.message,
      });
    } else {
      // Network or timeout error: Queue this heartbeat for later recovery
      console.warn('[Worker] Queuing failed heartbeat for later recovery');
      missedHeartbeats.push(currentPingTime);
    }

    self.postMessage({
      type: 'HEARTBEAT_ERROR',
      error: err.message || String(err),
      queuedCount: missedHeartbeats.length,
    });
  }
}

// Main message handler
self.onmessage = (event: MessageEvent) => {
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
      console.warn('[Worker] Unknown message type:', type);
  }
};

// Handle worker closure
self.onclose = () => {
  stopHeartbeat('Worker closed');
  if (channel) {
    channel.close();
  }
};
