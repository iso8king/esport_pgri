// src/lib/auth.js
import { push } from 'svelte-spa-router';
import Swal from 'sweetalert2';

// ============================================
// VARIABLES & STATE
// ============================================
let sessionCheckInterval = null;
let logoutWarningTimer = null;
let isLoggingOut = false;
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; 
const SESSION_WARNING_TIME = 30 * 1000;
const SESSION_DURATION = 60 * 60 * 1000; 

// ============================================
// AUTO LOGOUT HANDLER
// ============================================
export async function handleAutoLogout(message = 'Sesi Anda telah berakhir. Silakan login kembali.') {
  // Cegah multiple logout
  if (isLoggingOut) return;
  isLoggingOut = true;
  
  // Bersihkan semua storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Hentikan semua timer
  stopSessionCheck();
  clearWarningTimer();
  
  // Tampilkan notifikasi
  await Swal.fire({
    icon: 'info',
    title: 'Sesi Berakhir',
    text: message,
    confirmButtonColor: '#0b5ba2',
    confirmButtonText: 'Login Kembali',
    allowOutsideClick: false,
    allowEscapeKey: false
  });
  
  // Reset flag
  isLoggingOut = false;
  
  // Redirect ke login
  push('/signin');
}

// ============================================
// TIMER HELPERS
// ============================================
function clearWarningTimer() {
  if (logoutWarningTimer) {
    clearTimeout(logoutWarningTimer);
    logoutWarningTimer = null;
  }
}

// ============================================
// SESSION WARNING
// ============================================
async function showSessionWarning() {
  // Cek apakah user masih login
  const role = localStorage.getItem('role');
  if (!role) return;
  
  const result = await Swal.fire({
    icon: 'warning',
    title: '⚠️ Sesi Akan Berakhir',
    text: 'Sesi Anda akan berakhir dalam 30 detik. Silakan lanjutkan sesi Anda.',
    confirmButtonColor: '#0b5ba2',
    confirmButtonText: '🔄 Lanjutkan Sesi',
    showCancelButton: true,
    cancelButtonColor: '#ef4444',
    cancelButtonText: '🚪 Logout',
    timer: 30000,
    timerProgressBar: true,
    allowOutsideClick: false,
    allowEscapeKey: false
  });
  
  if (result.isConfirmed) {
    // User memilih lanjutkan session
    await refreshSession();
  } else if (result.dismiss === Swal.DismissReason.timer) {
    // Timer habis, auto logout
    await handleAutoLogout('Sesi Anda telah berakhir karena tidak ada aktivitas.');
  } else {
    // User memilih logout
    await handleAutoLogout('Anda telah logout.');
  }
}

// // ============================================
// // REFRESH SESSION
// // ============================================
// async function refreshSession() {
//   try {
//     const response = await fetch('/api/auth/refresh', {
//       method: 'POST',
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (response.ok) {
//       await Swal.fire({
//         icon: 'success',
//         title: '✅ Sesi Diperpanjang',
//         text: 'Sesi Anda berhasil diperpanjang.',
//         timer: 1500,
//         showConfirmButton: false
//       });
      
//       // Reset timer
//       startSessionCheck();
//     } else {
//       const data = await response.json().catch(() => ({}));
//       await handleAutoLogout(data.errors || 'Gagal memperpanjang sesi. Silakan login kembali.');
//     }
//   } catch (error) {
//     console.error('Error refreshing session:', error);
//     await handleAutoLogout('Terjadi kesalahan. Silakan login kembali.');
//   }
// }

// ============================================
// FETCH WITH AUTH (Untuk endpoint yang butuh login)
// ============================================
export async function fetchWithAuth(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Handle 403 - JWT not valid
    if (response.status === 403) {
      let errorMessage = '';
      try {
        const data = await response.clone().json();
        errorMessage = data.errors || data.message || '';
      } catch (e) {
        errorMessage = await response.text() || '';
      }
      
      if (errorMessage.includes('JWT not valid') || 
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('session') ||
          errorMessage.includes('token')) {
        await handleAutoLogout('Sesi Anda telah berakhir. Silakan login kembali.');
        throw new Error('Session expired');
      }
    }
    
    // Handle 401 - Unauthorized
    if (response.status === 401) {
      await handleAutoLogout('Sesi Anda tidak valid. Silakan login kembali.');
      throw new Error('Session expired');
    }
    
    return response;
    
  } catch (error) {
    if (error.message === 'Session expired') {
      throw error;
    }
    console.error('Fetch error:', error);
    throw error;
  }
}

// ============================================
// FETCH PUBLIC (Untuk endpoint publik/tanpa auth)
// ============================================
export async function fetchPublic(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response;
  } catch (error) {
    console.error('Public fetch error:', error);
    throw error;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================
export function startSessionCheck() {
  // Hentikan semua timer yang sedang berjalan
  stopSessionCheck();
  clearWarningTimer();
  
  // Cek apakah user sudah login
  const role = localStorage.getItem('role');
  if (!role) return;
  
  // Interval untuk cek session
  sessionCheckInterval = setInterval(async () => {
    try {
      // Gunakan HEAD request ke endpoint yang ringan
      const response = await fetch('/api/users/current', {
        method: 'HEAD',
        credentials: 'include'
      });
      
      // Jika response 403 atau 401, handle manual
      if (response.status === 403 || response.status === 401) {
        let errorMessage = '';
        try {
          const data = await response.clone().json().catch(() => ({}));
          errorMessage = data.errors || data.message || '';
        } catch (e) {
          errorMessage = await response.text() || '';
        }
        
        if (errorMessage.includes('JWT not valid') || 
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('session')) {
          await handleAutoLogout('Sesi Anda telah berakhir. Silakan login kembali.');
          return;
        }
      }
      
      // Jika response OK, reset warning timer
      if (response.ok) {
        clearWarningTimer();
        logoutWarningTimer = setTimeout(() => {
          showSessionWarning();
        }, SESSION_DURATION - SESSION_WARNING_TIME);
      }
      
    } catch (error) {
      if (error.message === 'Session expired') {
        stopSessionCheck();
        clearWarningTimer();
      }
      console.error('Session check error:', error);
    }
  }, SESSION_CHECK_INTERVAL);
  
  // Set warning timer awal
  clearWarningTimer();
  logoutWarningTimer = setTimeout(() => {
    showSessionWarning();
  }, SESSION_DURATION - SESSION_WARNING_TIME);
}

export function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
}

export function initSession() {
  stopSessionCheck();
  clearWarningTimer();
  startSessionCheck();
}

// ============================================
// LOGOUT
// ============================================
export async function manualLogout() {
    localStorage.clear();
    sessionStorage.clear();
    stopSessionCheck();
    clearWarningTimer();
    push('/signin');
}

// ============================================
// HELPER FUNCTIONS
// ============================================
export function isAuthenticated() {
  const role = localStorage.getItem('role');
  return !!role;
}

export function getUserInfo() {
  return {
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('role'),
    email: localStorage.getItem('email'),
    userId: localStorage.getItem('user_id'),
    team: localStorage.getItem('tim')
  };
}

export function getUserRole() {
  return localStorage.getItem('role') || null;
}

export function getToken() {
  return localStorage.getItem('token') || null;
}