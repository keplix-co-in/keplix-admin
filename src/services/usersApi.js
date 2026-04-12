/**
 * Users API Service
 * Handles all user-related API calls for Admin
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get user metrics (counts by status)
 */
export const getUserMetrics = async () => {
  try {
    const token = localStorage.getItem('adminToken');

    const response = await fetch(`${API_URL}/admin/users/metrics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user metrics: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    throw error;
  }
};

/**
 * Get users with filters and pagination
 * @param {string} type - Filter type: all, active, inactive, uninstalled
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getUsers = async (type = 'all', page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      console.warn('⚠️ No admin token found in localStorage');
      return [];
    }

    const filterType = type || 'all';
    const queryParams = new URLSearchParams({
      type: filterType,
      page: String(page),
      limit: String(limit)
    });

    const url = `${API_URL}/admin/users?${queryParams}`;
    console.log(`📡 API Request: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`, errorText);

      // Return empty array instead of throwing
      if (response.status === 401) {
        return [];
      }

      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

/**
 * Delete user
 * @param {string|number} id - User ID
 */
export const deleteUser = async (id) => {
  try {
    const token = localStorage.getItem('adminToken');

    const response = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export default {
  getUserMetrics,
  getUsers,
  deleteUser
};
