// Authentication functionality
function initAuth() {
    // DOM Elements
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Authentication Tab Switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.dataset.tab === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
            clearMessages();
        });
    });

    // Login Form Handler
    document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            setLoading('loginButton', true);
            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                currentUser = { ...data.user, token: data.token };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                showApp();
                authenticateSocket();
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('Login failed. Please try again.');
        } finally {
            setLoading('loginButton', false);
        }
    });

    // Register Form Handler
    document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            setLoading('registerButton', true);
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentUser = { ...data.user, token: data.token };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                showApp();
                authenticateSocket();
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('Registration failed. Please try again.');
        } finally {
            setLoading('registerButton', false);
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        socket.disconnect();
        localStorage.removeItem('currentUser');
        showAuth();
        currentUser = null;
        currentChatUser = null;
        friends = [];
        messages = [];
        document.getElementById('messagesContainer').innerHTML = '';
        document.getElementById('noChatSelected').style.display = 'flex';
        document.getElementById('chatInterface').style.display = 'none';
    });
}