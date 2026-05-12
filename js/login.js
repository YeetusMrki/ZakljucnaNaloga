function setCurrentUser(username, token, userId) {
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('userToken', token);
    sessionStorage.setItem('userId', userId);
}

function showLoginError(message) {
    const errorBox = document.getElementById('loginError');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

function clearLoginError() {
    const errorBox = document.getElementById('loginError');
    errorBox.style.display = 'none';
    errorBox.textContent = '';
}

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
        // Call API to validate login credentials
        const response = await fetch(API_ENDPOINTS.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.status === 200) {
            const userData = await response.json();
            // Successful login - store user in session
            setCurrentUser(
                userData.username || username,
                userData.token || '',
                userData.id || userData.user_id || ''
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
