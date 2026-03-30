// API configuration
export const API_BASE_URL = 'http://localhost:5050/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // User endpoints
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
  UPLOAD_AVATAR: `${API_BASE_URL}/users/upload-avatar`,
  
  // Health check
  HEALTH: 'http://localhost:5050/health'
};