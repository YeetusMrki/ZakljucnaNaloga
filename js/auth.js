function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

function getUserId() {
    return sessionStorage.getItem('userId');
}

function getUserToken() {
    return sessionStorage.getItem('userToken');
}

function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userPfp');
}

function requireAuth() {
    if (!getCurrentUser() || !getUserId()) {
        console.warn("Session incomplete (missing User ID). Redirecting to login...");
        window.location.href = 'index.html';
    }
}

function updateGlobalProfilePics(url) {
    const pics = document.querySelectorAll('.profile-pic, .profile-avatar-rect');
    pics.forEach(pic => {
        pic.src = url || CONFIG.DEFAULT_PFP;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const pfp = sessionStorage.getItem('userPfp');
    
    if (pfp) {
        updateGlobalProfilePics(pfp);
    } else if (!user && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('signup.html')) {
        window.location.href = 'index.html';
    }
});