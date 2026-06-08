//Shrani podatke trenutnega uporabnika v sessionStorage
function setCurrentUser(username, token, userId, profilePic) {
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('userToken', token);
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userPfp', profilePic || '');
}

//Prikaže napako pri prijavi uporabniku
function showLoginError(message) {
    const errorBox = document.getElementById('loginError');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

//Počisti prikaz napake pri prijavi
function clearLoginError() {
    const errorBox = document.getElementById('loginError');
    errorBox.style.display = 'none';
    errorBox.textContent = '';
}

//Obdelava obrazca za prijavo: pošlji podatke na API in obdelaj odgovor
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    clearLoginError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showLoginError('Please enter username and password.');
        return;
    }

    try {
        //Pokliče API za prijavo
        const response = await fetch(API_ENDPOINTS.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.status === 200) {
            const result = await response.json();
            
            const userData = Array.isArray(result) ? result[0] : (result.items ? result.items[0] : (result.data || result.user || result));
            console.log("Login success. Extracted user data:", userData);
            
            const userId = userData.id || userData.user_id || userData.USER_ID || userData.ID || userData.PK_USER_ID || userData.USERID || '';
            const profilePic = userData.profile_pic || userData.PROFILE_PIC || '';

            if (!userId) {
                console.error("Critical Error: No User ID found in login response. Keys present:", Object.keys(userData));
            }

            //Prijava uspešna, shrani podatke uporabnika v sejo
            setCurrentUser(
                userData.username || username,
                userData.token || '',
                userId,
                profilePic
            );
            window.location.href = 'mainpage.html';
        } else if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.errorCode === 1) {
                showLoginError('User does not exist. Please sign up first.');
            } else if (errorData.errorCode === 2) {
                showLoginError('Incorrect password. Please try again.');
            } else {
                showLoginError(errorData.message || 'Invalid login credentials.');
            }
        } else {
            const errorText = await response.text().catch(() => '');
            let errorMessage = 'An error occurred during login.';
            if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (parseErr) {
                    errorMessage = errorText;
                }
            }
            showLoginError(errorMessage);
        }
    } catch (err) {
        showLoginError('Cannot connect to server. Is the API running?');
        console.error('Login error:', err);
    }
});
