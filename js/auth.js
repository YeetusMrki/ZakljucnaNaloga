// Authentication utilities
// Manages user authentication state and session

/**
 * Get current logged-in user from session
 * @returns {string|null} Current username or null
 */
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}



/**
 * Get user authentication token
 * @returns {string|null} User token or null
 */
function getUserToken() {
    return sessionStorage.getItem('userToken');
}

/**
 * Set current user in sessionStorage
 * @param {string} username - Username to store
 * @param {string} token - Authentication token
 * @param {string} userId - User ID
 */
function setCurrentUser(username, token, userId) {
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('userToken', token);
    sessionStorage.setItem('userId', userId);
}

/**
 * Get current logged-in user ID from sessionStorage
 * @returns {string|null} User ID or null
 */
function getUserId() {
    return sessionStorage.getItem('userId');
}

/**
 * Clear current user session (logout)
 */
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userId');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

/**
 * Fetch user profile from API
 * @param {string} username - Username to fetch
 * @returns {Promise<object>} User profile data
 */
async function fetchUserProfile(username) {
    const token = getUserToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_ENDPOINTS.profile}/${username}`, {
        method: 'GET',
        headers: headers
    });

    if (response.status === 200) {
        return await response.json();
    }
    throw new Error('Failed to fetch user profile');
}

/**
 * Update user profile on API
 * @param {string} username - Username to update
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user profile
 */
async function updateUserProfile(username, updates) {
    const token = getUserToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_ENDPOINTS.profile}/${username}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updates)
    });

    if (response.status === 200) {
        return await response.json();
    }
    throw new Error('Failed to update user profile');
}
