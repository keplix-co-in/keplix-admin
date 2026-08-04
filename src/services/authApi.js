/**
 * Authentication API Service
 * Handles admin login and authentication
 */

import { API_URL } from './apiConfig.js';

/**
 * Login admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 */
export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `Login failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Do not log `data` here — it contains the admin's bearer/refresh tokens
    // in plaintext, which would otherwise land in the browser console.

    // Store tokens and user data
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
    }

    if (data.refresh) {
      localStorage.setItem('adminRefreshToken', data.refresh);
    }

    if (data.user) {
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Error during login:', error.message);
    throw error;
  }
};

/**
 * Logout admin user
 */
export const adminLogout = () => {
  try {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    console.log('✅ Admin logged out');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/**
 * Get stored admin token
 */
export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

/**
 * Get stored admin user data
 */
export const getAdminUser = () => {
  const user = localStorage.getItem('adminUser');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if admin is authenticated. Verifies the stored token is a
 * well-formed JWT and not expired — presence alone is not enough, since a
 * stale or hand-edited localStorage value would otherwise render the app
 * as "logged in" until an API call eventually 401s.
 */
export const isAdminAuthenticated = () => {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true; // no expiry claim — treat presence as valid
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default {
  adminLogin,
  adminLogout,
  getAdminToken,
  getAdminUser,
  isAdminAuthenticated
};
