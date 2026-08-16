/**
 * Walk-In Jobs API Service
 * Admin read access to garage walk-in jobs and their health sheets.
 */

import { API_URL } from './apiConfig.js';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

export const getWalkInJobs = async ({ status = '', vendorId = '', page = 1, limit = 20 } = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    if (vendorId) params.vendorId = vendorId;
    const qs = new URLSearchParams(params);

    const response = await fetch(`${API_URL}/admin/walk-in-jobs?${qs}`, {
      method: 'GET',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.error(`Walk-in jobs API error: ${response.status}`);
      return { data: [], total: 0 };
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch walk-in jobs:', error);
    return { data: [], total: 0 };
  }
};

export const getWalkInJob = async (id) => {
  const response = await fetch(`${API_URL}/admin/walk-in-jobs/${id}`, {
    method: 'GET',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch walk-in job: ${response.status}`);
  return response.json();
};

export const getWalkInAdoption = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/walk-in-jobs/adoption`, {
      method: 'GET',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    });
    if (!response.ok) return { data: [] };
    return response.json();
  } catch (error) {
    console.error('Failed to fetch walk-in adoption:', error);
    return { data: [] };
  }
};
