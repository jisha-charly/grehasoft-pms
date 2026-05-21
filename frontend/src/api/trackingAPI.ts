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
  full_name?: string;
  email: string;
  employee_code?: string;
  is_tracking_enabled: boolean;
  status: 'Active' | 'Idle' | 'Offline';
  login_time: string | null;
  first_login_time?: string | null;
  last_ping: string | null;
  total_work_time: string; // HH:MM:SS
  session_id: number | null;
  idle_time?: string;
  idleTime?: string;
  activity_percentage?: number;
  productive_time?: string;
  productiveTime?: string;
  non_productive_time?: string;
  total_tracked_time?: string;
  current_app?: string | null;
  current_window?: string | null;
  app_activities?: any[];
  timeline_data?: any[];
  mouse_moves?: number;
  mouseMoves?: number;
  key_presses?: number;
  keyPresses?: number;
  clicks?: number;
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

  /**
   * Get daily reports for all users
   */
  async getDailyReport(params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    department_id?: string;
    search?: string;
  }): Promise<any[]> {
    try {
      const response = await this.api.get<any[]>('/tracking/reports/daily/', { params });
      return response.data;
    } catch (error) {
      console.error('Daily report API error:', error);
      throw error;
    }
  }

  /**
   * Get weekly reports & trends
   */
  async getWeeklyReport(params?: {
    start_date?: string;
    end_date?: string;
    department_id?: string;
  }): Promise<any> {
    try {
      const response = await this.api.get<any>('/tracking/reports/weekly/', { params });
      return response.data;
    } catch (error) {
      console.error('Weekly report API error:', error);
      throw error;
    }
  }

  /**
   * Get monthly reports & rankings
   */
  async getMonthlyReport(params?: {
    year?: number;
    month?: number;
    department_id?: string;
  }): Promise<any> {
    try {
      const response = await this.api.get<any>('/tracking/reports/monthly/', { params });
      return response.data;
    } catch (error) {
      console.error('Monthly report API error:', error);
      throw error;
    }
  }

  /**
   * Get detailed employee analytics
   */
  async getEmployeeAnalytics(params: {
    user_id: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const response = await this.api.get<any>('/tracking/reports/employee-analytics/', { params });
      return response.data;
    } catch (error) {
      console.error('Employee analytics API error:', error);
      throw error;
    }
  }

  /**
   * Export reports as CSV, Excel or PDF with Auth Header
   */
  async exportReport(params: {
    type: 'daily' | 'weekly' | 'monthly' | 'employee';
    format: 'csv' | 'excel' | 'pdf';
    [key: string]: any;
  }): Promise<Blob> {
    try {
      const response = await this.api.get<Blob>('/tracking/reports/export/', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Export report API error:', error);
      throw error;
    }
  }
}

export default TrackingAPI;
