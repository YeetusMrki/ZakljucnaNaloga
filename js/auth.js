//Vrne trenutno prijavljeno uporabniško ime iz sessionStorage
//Funkcije za upravljanje avtentikacije in seje
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

//Vrne ID uporabnika iz sessionStorage
function getUserId() {
    return sessionStorage.getItem('userId');
}

//Vrne žeton (token) uporabnika iz sessionStorage
function getUserToken() {
    return sessionStorage.getItem('userToken');
}

//Počisti podatke trenutne seje (odjava)
//Odjavi uporabnika in očisti podatke iz seje
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userPfp');
}

//Preveri ali je uporabnik prijavljen; če ne, preusmeri na prijavo
function requireAuth() {
    if (!getCurrentUser() || !getUserId()) {
        console.warn("Session incomplete (missing User ID). Redirecting to login...");
        window.location.href = 'index.html';
    }
}

//Posodobi vse profile pike (avatarje) na strani z novo sliko
//Posodobi vse avatarje na strani z novo sliko
function updateGlobalProfilePics(url) {
    const pics = document.querySelectorAll('.profile-pic, .profile-avatar-rect');
    pics.forEach(pic => {
        pic.src = url || CONFIG.DEFAULT_PFP;
    });
}

//Ob nalaganju strani posodobi avatar ali preusmeri neprijavljene uporabnike
//Ob nalaganju strani preveri sejo in posodobi avatar
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const pfp = sessionStorage.getItem('userPfp');
    
    if (pfp) {
        updateGlobalProfilePics(pfp);
    } else if (!user && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('signup.html')) {
        window.location.href = 'index.html';
    }
});