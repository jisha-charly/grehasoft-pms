/**
 * HOME/LOGIN PAGE INTEGRATION
 * 
 * Purpose: Example of how to integrate useHeartbeat in your main app
 * 
 * Add this to your main App.tsx or login-related component
 */

import React, { useEffect, useState } from 'react';
import useHeartbeat from '../hooks/useHeartbeat';
import TrackingAPI from '../api/trackingAPI';

interface AppProps {
  // Your existing props
}

/**
 * EXAMPLE: Add this to your App.tsx after login
 */
export const AppWithTracking: React.FC<AppProps> = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const trackingAPI = new TrackingAPI();

  // Initialize heartbeat hook
  const heartbeat = useHeartbeat({
    isTrackingEnabled,
    token: token || '',
  });

  // On login
  const handleLogin = async (credentials: any) => {
    try {
      // Your login logic here
      // const response = await loginAPI(credentials);
      // const { token } = response;
      // setToken(token);
      // localStorage.setItem('access', token);

      // Check if tracking is enabled for user
      const userProfile = await trackingAPI.getCurrentUserStatus();
      setIsTrackingEnabled(userProfile.is_tracking_enabled);
      setIsLoggedIn(true);

      // Start heartbeat if tracking enabled
      if (userProfile.is_tracking_enabled) {
        heartbeat.startHeartbeat();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // On logout
  const handleLogout = async () => {
    try {
      // Send logout to server
      await trackingAPI.logout();
      // Stop heartbeat
      heartbeat.stopHeartbeat();
      // Clear state
      setIsLoggedIn(false);
      setIsTrackingEnabled(false);
      setToken(null);
      localStorage.removeItem('access');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Toggle tracking
  const handleToggleTracking = async () => {
    try {
      const newState = !isTrackingEnabled;
      await trackingAPI.setTrackingEnabled(newState);
      setIsTrackingEnabled(newState);

      if (newState) {
        heartbeat.enableTracking();
      } else {
        heartbeat.disableTracking();
      }
    } catch (error) {
      console.error('Toggle tracking error:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLoggedIn) {
        heartbeat.stopHeartbeat();
      }
    };
  }, [isLoggedIn, heartbeat]);

  return (
    <div>
      {/* Your app content */}

      {isLoggedIn && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                heartbeat.status.isRunning ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-700">
              {heartbeat.status.isRunning ? 'Tracking Active' : 'Tracking Inactive'}
            </span>
            <button
              onClick={handleToggleTracking}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isTrackingEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isTrackingEnabled ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppWithTracking;
