//Upravljanje uporabniškega profila: pridobivanje, prikaz in urejanje
let isEditing = false;

function getLocalProfile() {
    try {
        return JSON.parse(localStorage.getItem('localProfile') || '{}');
    } catch (e) {
        return {};
    }
}

function saveLocalProfile(profile) {
    localStorage.setItem('localProfile', JSON.stringify(profile));
}

function applyProfileToUI(profile) {
    const username = profile.username || '';
    const email = profile.email || '';
    const dob = profile.dob || '-';

    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('profileDob').textContent = dob;
    document.getElementById('profileUsernameInput').value = username;
    document.getElementById('profileEmailInput').value = email;

    if (profile.pfp) {
        updateGlobalProfilePics(profile.pfp);
        sessionStorage.setItem('userPfp', profile.pfp);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const userId = getUserId();
    if (!user || !userId) return;

    fetchUserProfile(userId);
    setupProfileListeners();
});

function setupProfileListeners() {
    const editBtn = document.getElementById('editAccountBtn');
    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }

    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }
}

async function fetchUserProfile(userId) {
    try {
        //Poskusi nekaj pogostih različic GET endpointa za profil
        const token = getUserToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const tryUrls = [
            `${API_ENDPOINTS.profile}/${userId}`,
            `${API_ENDPOINTS.profile}?id=${encodeURIComponent(userId)}`,
            `${API_ENDPOINTS.profile}`
        ];

        let response;
        let result;
        for (const url of tryUrls) {
            try {
                response = await fetch(url, { headers });
                if (!response.ok) continue;
                try {
                    result = await response.json();
                } catch (e) {
                    result = await response.text().catch(() => null);
                }
                break;
            } catch (e) {
                console.warn('Profile fetch attempt failed for', url, e);
                continue;
            }
        }

        const localProfile = getLocalProfile();

        if (typeof result === 'undefined' || result === null) {
            if (localProfile && (localProfile.username || localProfile.email || localProfile.pfp)) {
                result = localProfile;
            } else {
                throw new Error('Failed to fetch user profile from any endpoint');
            }
        }

        //Če API vrne seznam (pogosto v Oracle ORDS), vzemi prvi element
        let userData = Array.isArray(result) ? result[0] : (result.items ? result.items[0] : (result.data || result));
        
        console.log("Extracted User Object:");
        console.table(userData); 

        if (!userData) throw new Error("User data not found in response");
        
        //Robustno preslikavanje polj za Oracle/REST različice
        const username = userData.username || userData.USERNAME || userData.USER_NAME || userData.USER_ID || userData.ID || '';
        const email = userData.email || userData.EMAIL || userData.user_email || userData.USER_EMAIL || userData.MAIL || userData.E_MAIL || userData.POSTA || '';
        const dobRaw = userData.dob || userData.DOB || userData.birthDate || userData.BIRTHDATE || userData.birth_date || userData.BIRTH_DATE || userData.DATUM_ROJSTVA || userData.BIRTH_DAY || '';
        const pfp = userData.profile_pic || userData.PROFILE_PIC || '';
        const fetchedProfile = {
            userId,
            username,
            email,
            dob: dobRaw,
            pfp,
            updatedAt: Date.now()
        };

        //Varno obravnava formatiranja datuma
        let formattedDob = '-';
        if (dobRaw) {
            const dateObj = new Date(dobRaw);
            formattedDob = isNaN(dateObj.getTime()) ? dobRaw : dateObj.toLocaleDateString();
        }

        if (localProfile && localProfile.updatedAt && localProfile.updatedAt > (fetchedProfile.updatedAt || 0)) {
            applyProfileToUI(localProfile);
            return;
        }

        fetchedProfile.dob = formattedDob;
        applyProfileToUI(fetchedProfile);
        saveLocalProfile({
            userId,
            username,
            email,
            dob: formattedDob,
            pfp,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error('Error fetching profile:', error);

        const localProfile = getLocalProfile();
        if (localProfile && (localProfile.username || localProfile.email)) {
            applyProfileToUI(localProfile);
        }
    }
}

async function toggleEditMode() {
    const editBtn = document.getElementById('editAccountBtn');
    const inputs = document.querySelectorAll('.profile-input');
    const displays = [
        document.getElementById('profileUsername'),
        document.getElementById('profileEmail'),
        document.getElementById('profilePasswordMask')
    ];

    if (!isEditing) {
        //Vstopi v način urejanja
        isEditing = true;
        editBtn.textContent = 'Save Changes';
        inputs.forEach(el => el.classList.remove('hidden-input'));
        displays.forEach(el => el.classList.add('hidden-input'));
    } else {
        //Shrani spremembe
        await saveProfileChanges();
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    //Predogled slike lokalno za takojšen odziv
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('profileAvatar').src = e.target.result;
        document.getElementById('headerProfilePic').src = e.target.result;
    };
    reader.readAsDataURL(file);

    //Pripravi podatke za nalaganje
    const formData = new FormData();
    formData.append('profile_pic', file);

    const userId = getUserId();
    try {
        const token = getUserToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const avatarUrls = [
            `${API_ENDPOINTS.profile}/${userId}/avatar`,
            `${API_ENDPOINTS.profile}/avatar/${userId}`,
            `${API_ENDPOINTS.profile}/avatar`,
            `${API_BASE_URL}/users/${userId}/avatar`
        ];

        for (const url of avatarUrls) {
            try {
                console.log('Attempting avatar upload to', url);
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: formData
                });
                if (!response) continue;
                const text = await response.text().catch(() => '');
                let parsed = null;
                try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
                console.log('Avatar upload response from', url, response.status, parsed);
                if (response.ok) {
                    const result = parsed;
                    const userData = Array.isArray(result) ? result[0] : (result && result.items ? result.items[0] : (result && result.data ? result.data : result));
                    const newPfp = userData && (userData.profile_pic || userData.PROFILE_PIC);
                    if (newPfp) {
                        sessionStorage.setItem('userPfp', newPfp);
                        updateGlobalProfilePics(newPfp);
                    }
                    break;
                } else if (response.status === 404) {
                    continue;
                }
            } catch (err) {
                console.warn('Avatar upload attempt failed for', url, err);
                continue;
            }
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
    }
}

async function saveProfileChanges() {
    const userId = getUserId();
    const newUsername = document.getElementById('profileUsernameInput').value;
    const updatedData = {
        USER_ID: userId,
        USERNAME: newUsername,
        EMAIL: document.getElementById('profileEmailInput').value,
        username: newUsername,
        email: document.getElementById('profileEmailInput').value,
        id: userId
    };

    //Pošlji geslo le, če je uporabnik vnesel novo
    const newPassword = document.getElementById('profilePasswordInput').value;
    if (newPassword) {
        updatedData.password = newPassword;
        updatedData.PASSWORD = newPassword;
    }

    try {
        const token = getUserToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const candidateUrls = [
            `${API_ENDPOINTS.profile}/${userId}`,
            `${API_ENDPOINTS.profile}/update/${userId}`,
            `${API_ENDPOINTS.profile}/update`,
            `${API_ENDPOINTS.profile}`,
            `${API_BASE_URL}/users/${userId}`,
            `${API_BASE_URL}/users/update/${userId}`,
            `${API_BASE_URL}/users/update`,
            `${API_BASE_URL}/users`
        ];

        const methods = ['PUT', 'PATCH', 'POST'];
        let lastErr = null;

        for (const url of candidateUrls) {
            for (const method of methods) {
                try {
                    console.log('Attempting profile save', method, url);
                    const response = await fetch(url, {
                        method,
                        headers,
                        body: JSON.stringify(updatedData)
                    });

                    const text = await response.text().catch(() => '');
                    let parsed = null;
                    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
                    console.log('Profile update response from', url, response.status, parsed);

                    if (response.ok) {
                        const localProfile = {
                            userId,
                            username: newUsername,
                            email: document.getElementById('profileEmailInput').value,
                            dob: getLocalProfile().dob || '',
                            pfp: sessionStorage.getItem('userPfp') || getLocalProfile().pfp || '',
                            updatedAt: Date.now()
                        };
                        saveLocalProfile(localProfile);
                        applyProfileToUI(localProfile);
                        sessionStorage.setItem('currentUser', newUsername);
                        isEditing = false;
                        document.getElementById('editAccountBtn').textContent = 'Change Account Info';
                        document.querySelectorAll('.profile-input').forEach(el => el.classList.add('hidden-input'));
                        document.querySelectorAll('#profileUsername, #profileEmail, #profilePasswordMask').forEach(el => el.classList.remove('hidden-input'));
                        document.getElementById('profilePasswordInput').value = '';
                        fetchUserProfile(userId);
                        return;
                    } else if (response.status === 404) {
                        lastErr = `404 at ${url}`;
                        continue;
                    } else {
                        lastErr = `Status ${response.status} at ${url}`;
                        continue;
                    }
                } catch (err) {
                    console.warn('Attempt to save profile failed for', url, err);
                    lastErr = err;
                    continue;
                }
            }
        }

        const localProfile = {
            userId,
            username: newUsername,
            email: document.getElementById('profileEmailInput').value,
            dob: getLocalProfile().dob || '',
            pfp: sessionStorage.getItem('userPfp') || getLocalProfile().pfp || '',
            updatedAt: Date.now()
        };
        saveLocalProfile(localProfile);
        sessionStorage.setItem('currentUser', newUsername);
        applyProfileToUI(localProfile);

        console.warn('Profile update saved locally because server returned 404. Last error:', lastErr);
        //Prikaži kratko, vidno sporočilo uporabniku, da ve, da je strežnik zavrnil posodobitve
        try {
            let notice = document.getElementById('profileSaveError');
            if (!notice) {
                notice = document.createElement('div');
                notice.id = 'profileSaveError';
                notice.style.cssText = 'color:#a00;margin-top:10px;font-weight:600;';
                const container = document.querySelector('.profile-actions') || document.querySelector('.profile-info-section') || document.body;
                container.appendChild(notice);
            }
            notice.textContent = 'Profile update saved locally. Server update is not available.';
        } catch (e) {
            //Ignoriraj DOM napake
        }
        isEditing = false;
        document.getElementById('editAccountBtn').textContent = 'Change Account Info';
        document.querySelectorAll('.profile-input').forEach(el => el.classList.add('hidden-input'));
        document.querySelectorAll('#profileUsername, #profileEmail, #profilePasswordMask').forEach(el => el.classList.remove('hidden-input'));
        document.getElementById('profilePasswordInput').value = '';
        return;
    } catch (error) {
        console.error('Error saving profile:', error);
    }
}