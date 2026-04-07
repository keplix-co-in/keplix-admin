/**
 * Authentication API Service
 * Handles admin login and authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Login admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 */
export const adminLogin = async (email, password) => {
  try {
    console.log(`📡 Admin Login Request: ${API_URL}/admin/auth/login`);

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

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `Login failed: ${response.status}`;
      console.error(`❌ Login Error:`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`✅ Login successful:`, data);

    // Store tokens and user data
    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      console.log('✅ Admin token saved to localStorage');
    }

    if (data.refresh) {
      localStorage.setItem('adminRefreshToken', data.refresh);
    }

    if (data.user) {
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('❌ Error during login:', error);
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
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = () => {
  return !!getAdminToken();
};

export default {
  adminLogin,
  adminLogout,
  getAdminToken,
  getAdminUser,
  isAdminAuthenticated
};
