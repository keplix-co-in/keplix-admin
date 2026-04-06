/**
 * Bookings API Service
 * Handles all booking-related API calls
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get booking metrics (counts by status)
 */
export const getBookingMetrics = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_URL}/admin/bookings/counts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch booking metrics: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching booking metrics:', error);
    throw error;
  }
};

/**
 * Get bookings with filters and pagination
 * @param {string} type - Filter type: all, completed, inprogress, confirmed, cancelled, requested
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getBookings = async (type = 'all', page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      console.warn('⚠️ No admin token found in localStorage');
      // Return mock data for testing
      return [
        {
          id: 'TEST-001',
          customer: 'Test Customer',
          phone: '+919999999999',
          vendor: 'Test Vendor',
          service: 'Test Service',
          slot: '2024-04-06 10:00 AM',
          amount: 500,
          fee: 50,
          status: 'confirmed'
        }
      ];
    }

    const filterType = type || 'all';
    const queryParams = new URLSearchParams({
      type: filterType,
      page: String(page),
      limit: String(limit)
    });

    const url = `${API_URL}/admin/bookings?${queryParams}`;
    console.log(`📡 API Request: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`, errorText);
      
      // Return empty array instead of throwing
      if (response.status === 401) {
        console.log('🔑 Authentication failed - returning empty array');
        return [];
      }
      
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Bookings loaded (${data?.length || 0} items):`, data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    // Return empty array on error instead of throwing
    return [];
  }
};

/**
 * Get single booking by ID
 * @param {string} bookingId - Booking ID
 */
export const getBookingById = async (bookingId) => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_URL}/admin/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch booking: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_URL}/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update booking: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 */
export const cancelBooking = async (bookingId, reason = '') => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_URL}/admin/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel booking: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export default {
  getBookingMetrics,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};
