/**
 * SSO Helper Library for Berkomunitas
 * Universal Google Login for all DRW platforms
 */

const SSO_API_URL = process.env.NEXT_PUBLIC_SSO_API_URL || '/api/sso';

/**
 * Login dengan Google token
 * @param {string} googleToken - ID token dari Google OAuth
 * @param {string} platform - Nama platform (default: 'Berkomunitas')
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
 */
export async function loginWithGoogle(googleToken, platform = 'Berkomunitas') {
  const response = await fetch(`${SSO_API_URL}/google-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleToken,
      platform,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'SSO login failed');
  }

  const data = await response.json();
  
  // Store tokens in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
}

/**
 * Verify JWT token
 * @param {string} token - JWT access token
 * @returns {Promise<{user: object}>}
 */
export async function verifyToken(token) {
  const response = await fetch(`${SSO_API_URL}/verify-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{accessToken: string}>}
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch(`${SSO_API_URL}/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  
  // Update access token
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.accessToken);
  }
  
  return data;
}

/**
 * Track user activity (for point system)
 * @param {string} activityType - Type of activity (login, purchase, comment, etc.)
 * @param {string} platform - Platform name
 * @param {object} metadata - Additional metadata
 */
export async function trackActivity(activityType, platform = 'Berkomunitas', metadata = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  if (!token) {
    console.warn('No access token found for tracking activity');
    return;
  }
  
  try {
    await fetch(`${SSO_API_URL}/track-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        activityType,
        platform,
        metadata,
      }),
    });
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
}

/**
 * Get current user from localStorage
 * @returns {object|null}
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
}

/**
 * Get access token
 * @returns {string|null}
 */
export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getAccessToken();
}

/**
 * Logout user
 */
export function logout() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Get user with token verification
 * @returns {Promise<object|null>}
 */
export async function getVerifiedUser() {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    const user = await verifyToken(token);
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  } catch (error) {
    // Try refresh token
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refreshToken) {
      try {
        await refreshAccessToken(refreshToken);
        return await getVerifiedUser();
      } catch (refreshError) {
        logout();
        return null;
      }
    }
    logout();
    return null;
  }
}

/**
 * Point values for activities
 */
export const ACTIVITY_POINTS = {
  login: 1,
  purchase: 10,
  review: 5,
  referral: 20,
  post_comment: 3,
  share: 2,
  course_complete: 15,
  appointment_book: 5,
  task_complete: 10,
  daily_check_in: 2,
};
