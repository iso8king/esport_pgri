// src/lib/api.js
import { push } from 'svelte-spa-router';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:9999';

async function apiFetch(endpoint, options = {}) {
  // Default options
  const defaultOptions = {
    credentials: 'include', // Selalu kirim cookie
    headers: {}
  };
  
  // Jika bukan FormData, set Content-Type ke application/json
  if (!(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }
  
  // Merge options
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Jika unauthorized (401) atau forbidden karena token expired (403)
    if (response.status === 401 || response.status === 403) {
      // Clear local storage
      localStorage.clear();
      
      // Tampilkan notifikasi
      await Swal.fire({
        icon: 'warning',
        title: 'Sesi Berakhir',
        text: 'Silakan login kembali',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0a2e52'
      });
      
      // Redirect ke halaman login
      push('/SignIn');
      
      throw new Error('Unauthorized');
    }
    
    return response;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

// Helper function untuk GET request
async function get(endpoint) {
  return apiFetch(endpoint, {
    method: 'GET'
  });
}

// Helper function untuk POST request (JSON)
async function post(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Helper function untuk POST request (FormData)
async function postForm(endpoint, formData) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: formData
  });
}

// Helper function untuk PUT request
async function patch(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

// Helper function untuk DELETE request
async function del(endpoint) {
  return apiFetch(endpoint, {
    method: 'DELETE'
  });
}

export { apiFetch, get, post, postForm, put, del };