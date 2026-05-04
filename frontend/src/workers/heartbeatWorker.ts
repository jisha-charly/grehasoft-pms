/**
 * HEARTBEAT WEB WORKER
 * 
 * Purpose: Handle heartbeat pings in a background worker thread
 * 
 * Features:
 * - Runs in background even when tab is minimized
 * - Respects tracking enabled/disabled state
 * - Handles multi-tab synchronization via BroadcastChannel
 * - Automatic cleanup on message
 */

// Configuration
const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const CHANNEL_NAME = 'tracking_heartbeat';
const MESSAGE_TYPES = {
  START: 'START',
  STOP: 'STOP',
  PING: 'PING',
  STATUS: 'STATUS',
  TRACKING_ENABLED: 'TRACKING_ENABLED',
  TRACKING_DISABLED: 'TRACKING_DISABLED',
};

// State
let isRunning = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let isTrackingEnabled = false;
let apiToken: string | null = null;
let apiUrl: string | null = null;
let isMasterTab = false;

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
      // Another tab stopped
      if (!isRunning && data?.isExplicit) {
        // Only stop if explicitly stopped
      }
      break;

    case MESSAGE_TYPES.TRACKING_DISABLED:
      // Tracking disabled globally
      if (isRunning) {
        stopHeartbeat('Tracking disabled');
      }
      break;

    case MESSAGE_TYPES.TRACKING_ENABLED:
      // Tracking enabled globally
      updateTrackingState(true);
      if (!isRunning) {
        startHeartbeat();
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

// Send heartbeat ping to server
async function sendHeartbeat() {
  if (!isTrackingEnabled || !apiToken || !apiUrl) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/tracking/heartbeat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        // Tracking disabled on server
        updateTrackingState(false);
        stopHeartbeat('Tracking disabled on server');
        broadcastMessage(MESSAGE_TYPES.TRACKING_DISABLED);
      } else {
        console.warn('Heartbeat failed:', response.statusText);
      }
      return;
    }

    const data = await response.json();

    self.postMessage({
      type: 'HEARTBEAT_SENT',
      success: data.success,
      status: data.status,
      sessionId: data.session_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    self.postMessage({
      type: 'HEARTBEAT_ERROR',
      error: error instanceof Error ? error.message : String(error),
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

    case 'START':
      isTrackingEnabled = payload.isTrackingEnabled || isTrackingEnabled;
      startHeartbeat();
      break;

    case 'STOP':
      stopHeartbeat();
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
