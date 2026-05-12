const errorBox = document.getElementById('signupError');
const signUpForm = document.getElementById('signupForm');
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confPassword = document.getElementById('confirm-password').value;

    // Validate passwords match
    if (password !== confPassword) {
        showSignupError("Passwords do not match.");
        return;
    }

    const data = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: password,
        birthDate: document.getElementById('dob').value 
    };

    try {
        const response = await fetch(API_ENDPOINTS.signup, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.status === 201) {
            // 1. Show the success message using your function
            showSignupMessage("Account created successfully! Redirecting...", true);

            // 2. Wait 1200ms then switch window
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);

        } else if (response.status === 409) {
            showSignupError("Username or Email already exists.");
        } else {
            const errorText = await response.text();
            showSignupError(errorText || "An error occurred during signup.");
        }
    } catch (err) {
        showSignupError("Cannot connect to server. Is the API running?");
    }
});

function showSignupError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.style.color = '#ff5c5c';
    errorBox.style.backgroundColor = 'rgba(255, 92, 92, 0.12)';
    errorBox.style.borderColor = '#ff5c5c';
}

function showSignupMessage(message, success = false) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    if (success) {
        errorBox.style.color = '#4CAF50';
        errorBox.style.backgroundColor = 'rgba(76, 175, 80, 0.12)';
        errorBox.style.borderColor = '#4CAF50';
    } else {
        errorBox.style.color = '#ff5c5c';
        errorBox.style.backgroundColor = 'rgba(255, 92, 92, 0.12)';
        errorBox.style.borderColor = '#ff5c5c';
    }
}

function clearSignupError() {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
}
