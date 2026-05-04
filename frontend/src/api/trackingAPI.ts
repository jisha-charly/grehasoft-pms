/**
 * TRACKING API UTILITIES
 * 
 * Purpose: API integration for work tracking system
 */

import axios, { AxiosInstance } from 'axios';

export interface EmployeeStatus {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_tracking_enabled: boolean;
  status: 'Active' | 'Idle' | 'Offline';
  login_time: string | null;
  first_login_time?: string | null;
  last_ping: string | null;
  total_work_time: string; // HH:MM:SS
  session_id: number | null;
}

export interface UserTrackingProfile {
  id: number;
  user_id: number;
  is_tracking_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  session_id: number | null;
  status: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  session_id: number;
}

class TrackingAPI {
  private api: AxiosInstance;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Send heartbeat to server
   */
  async sendHeartbeat(): Promise<HeartbeatResponse> {
    try {
      const response = await this.api.post<HeartbeatResponse>('/tracking/heartbeat/');
      return response.data;
    } catch (error) {
      console.error('Heartbeat error:', error);
      throw error;
    }
  }

  /**
   * Close current session and logout
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await this.api.post<LogoutResponse>('/tracking/logout/');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get tracking status for current user
   */
  async getCurrentUserStatus(): Promise<UserTrackingProfile> {
    try {
      const response = await this.api.get<UserTrackingProfile>('/tracking/user-status/');
      return response.data;
    } catch (error) {
      console.error('User status error:', error);
      throw error;
    }
  }

  /**
   * Get employee status (all or specific)
   */
  async getEmployeeStatus(userId?: number): Promise<EmployeeStatus | EmployeeStatus[]> {
    try {
      const url = userId
        ? `/tracking/employee-status/${userId}/`
        : '/tracking/employee-status/';
      const response = await this.api.get<EmployeeStatus | EmployeeStatus[]>(url);
      return response.data;
    } catch (error) {
      console.error('Employee status error:', error);
      throw error;
    }
  }

  /**
   * Toggle tracking for a user (admin)
   */
  async toggleTracking(userId: number, enabled?: boolean): Promise<UserTrackingProfile> {
    try {
      const response = await this.api.post<{
        success: boolean;
        message: string;
        data: UserTrackingProfile;
      }>(`/tracking/toggle-tracking/${userId}/`, {
        enabled,
      });
      return response.data.data;
    } catch (error) {
      console.error('Toggle tracking error:', error);
      throw error;
    }
  }

  /**
   * Enable/disable tracking for current user
   */
  async setTrackingEnabled(enabled: boolean): Promise<UserTrackingProfile> {
    try {
      const response = await this.api.post<{
        success: boolean;
        message: string;
        data: UserTrackingProfile;
      }>('/tracking/set-track-enable/', {
        enabled,
      });
      return response.data.data;
    } catch (error) {
      console.error('Set tracking enabled error:', error);
      throw error;
    }
  }

  /**
   * Get user sessions (today or all)
   */
  async getUserSessions(filter?: 'today' | 'active'): Promise<any[]> {
    try {
      const url = filter ? `/tracking/sessions/${filter}/` : '/tracking/sessions/';
      const response = await this.api.get<any[]>(url);
      return response.data;
    } catch (error) {
      console.error('User sessions error:', error);
      throw error;
    }
  }
}

export default TrackingAPI;
