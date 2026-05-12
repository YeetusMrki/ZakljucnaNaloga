// Get current logged in user from sessionStorage
let currentUser = getCurrentUser();
let currentUserData = null;

// Require authentication - redirect to login if not logged in
requireAuth();

function setProfileInfo(user) {
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileDob').textContent = user.dob || user.birthDate || '-';
    document.getElementById('profileUsernameInput').value = user.username;
    document.getElementById('profileEmailInput').value = user.email;
    document.getElementById('profilePasswordInput').value = '';

    if (user.avatar) {
        document.getElementById('profileAvatar').src = user.avatar;
    }
}

function toggleAccountEdit() {
    const editButton = document.getElementById('editAccountBtn');
    const isEditing = editButton.dataset.editing === 'true';
    const usernameInput = document.getElementById('profileUsernameInput');
    const emailInput = document.getElementById('profileEmailInput');
    const passwordInput = document.getElementById('profilePasswordInput');
    const usernameSpan = document.getElementById('profileUsername');
    const emailSpan = document.getElementById('profileEmail');
    const passwordMask = document.getElementById('profilePasswordMask');

    if (!isEditing) {
        editButton.textContent = 'Save Account Info';
        editButton.dataset.editing = 'true';
        usernameSpan.style.display = 'none';
        emailSpan.style.display = 'none';
        passwordMask.style.display = 'none';
        usernameInput.classList.remove('hidden-input');
        emailInput.classList.remove('hidden-input');
        passwordInput.classList.remove('hidden-input');
        passwordInput.value = '';
        usernameInput.focus();
    } else {
        const newUsername = usernameInput.value.trim();
        const newEmail = emailInput.value.trim();
        const newPassword = passwordInput.value;

        if (!newUsername) {
            alert('Username cannot be empty.');
            usernameInput.focus();
            return;
        }

        if (!newEmail) {
            alert('Email cannot be empty.');
            emailInput.focus();
            return;
        }

        // Call API to update profile
        updateProfileViaAPI(newUsername, newEmail, newPassword);
    }
}

async function updateProfileViaAPI(newUsername, newEmail, newPassword) {
    try {
        const updates = {
            username: newUsername,
            email: newEmail
        };

        if (newPassword) {
            updates.password = newPassword;
        }

        const response = await fetch(`${API_ENDPOINTS.profile}/${currentUser}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getUserToken()}`
            },
            body: JSON.stringify(updates)
        });

        if (response.status === 200) {
            const updatedUser = await response.json();
            currentUser = newUsername;
            currentUserData = updatedUser;
            setCurrentUser(newUsername, getUserToken());
            setProfileInfo(updatedUser);

            const editButton = document.getElementById('editAccountBtn');
            editButton.textContent = 'Change Account Info';
            editButton.dataset.editing = 'false';
            document.getElementById('profileUsername').style.display = 'block';
            document.getElementById('profileEmail').style.display = 'block';
            document.getElementById('profilePasswordMask').style.display = 'block';
            document.getElementById('profileUsernameInput').classList.add('hidden-input');
            document.getElementById('profileEmailInput').classList.add('hidden-input');
            document.getElementById('profilePasswordInput').classList.add('hidden-input');

            alert('Profile updated successfully!');
        } else if (response.status === 409) {
            alert('Username or email already taken. Please choose another.');
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData.message || 'Failed to update profile.');
        }
    } catch (err) {
        console.error('Profile update error:', err);
        alert('Cannot connect to server. Is the API running?');
    }
}

// Load user profile on page init
if (!currentUser) {
    window.location.href = 'index.html';
} else {
    // Try to fetch from API first, fallback to sessionStorage
    try {
        fetchUserProfile(currentUser).then(user => {
            currentUserData = user;
            setProfileInfo(user);
        }).catch(err => {
            console.warn('Could not fetch from API, using session data:', err);
            // Fallback: Create basic user object from session data
            currentUserData = {
                username: currentUser,
                email: 'user@example.com',
                dob: '-'
            };
            setProfileInfo(currentUserData);
        });
    } catch (err) {
        console.error('Error loading profile:', err);
    }
}

// Handle avatar upload
document.getElementById('avatarUpload').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const avatarData = e.target.result;
            
            try {
                // Upload avatar to API
                const response = await fetch(`${API_ENDPOINTS.profile}/${currentUser}/avatar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserToken()}`
                    },
                    body: JSON.stringify({ avatar: avatarData })
                });

                if (response.status === 200) {
                    const updatedUser = await response.json();
                    currentUserData = updatedUser;
                    document.getElementById('profileAvatar').src = avatarData;
                } else {
                    // Fallback: store locally
                    if (currentUserData) {
                        currentUserData.avatar = avatarData;
                    }
                    document.getElementById('profileAvatar').src = avatarData;
                }
            } catch (err) {
                console.warn('Could not upload to API, storing locally:', err);
                if (currentUserData) {
                    currentUserData.avatar = avatarData;
                }
                document.getElementById('profileAvatar').src = avatarData;
            }
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('editAccountBtn').addEventListener('click', toggleAccountEdit);
