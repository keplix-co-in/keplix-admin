/**
 * Vendors API Service
 * Handles all vendor-related API calls for Admin
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get vendor metrics (counts by status)
 */
export const getVendorMetrics = async () => {
  try {
    const token = localStorage.getItem('adminToken');

    const response = await fetch(`${API_URL}/admin/vendors/metrics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vendor metrics: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor metrics:', error);
    throw error;
  }
};

/**
 * Get vendors with filters and pagination
 * @param {string} type - Filter type: all, active, pending, suspended, uninstalled
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getVendors = async (type = 'all', page = 1, limit = 10) => {
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

    const url = `${API_URL}/admin/vendors?${queryParams}`;
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
    console.error('❌ Error fetching vendors:', error);
    return [];
  }
};

export default {
  getVendorMetrics,
  getVendors
};
