// Utility Functions
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    toastMessage.textContent = message;
    toastIcon.innerHTML = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    if (now.toDateString() === date.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const buttonText = button.querySelector('.button-text');
    const buttonIcon = button.querySelector('.button-icon');
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        buttonText.textContent = 'Please wait...';
        buttonIcon.className = 'fas fa-spinner fa-spin button-icon';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (buttonId === 'loginButton') {
            buttonText.textContent = 'Sign In';
            buttonIcon.className = 'fas fa-arrow-right button-icon';
        } else {
            buttonText.textContent = 'Create Account';
            buttonIcon.className = 'fas fa-user-plus button-icon';
        }
    }
}

function showError(msg) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    errorMessage.style.display = 'block';
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    successMessage.style.display = 'none';
}

function showSuccess(msg) {
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    successMessage.style.display = 'block';
    successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    errorMessage.style.display = 'none';
}

function clearMessages() {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    errorMessage.style.display = 'none';
    errorMessage.innerHTML = '';
    successMessage.style.display = 'none';
    successMessage.innerHTML = '';
}

function showAuth() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
    setTimeout(() => authContainer.classList.add('show'), 10);
}

function showApp() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const userAvatar = document.getElementById('userAvatar');
    const username = document.getElementById('username');
    const noChatSelected = document.getElementById('noChatSelected');
    const chatInterface = document.getElementById('chatInterface');
    const messagesContainer = document.getElementById('messagesContainer');
    
    authContainer.classList.remove('show');
    setTimeout(() => {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        setTimeout(() => appContainer.classList.add('show'), 10);
    }, 300);

    userAvatar.src = currentUser.avatar;
    username.textContent = currentUser.username;

    // Reset chat interface
    noChatSelected.style.display = 'flex';
    chatInterface.style.display = 'none';
    currentChatUser = null;
    messagesContainer.innerHTML = '';

    // Load initial data
    loadFriends();
    loadFriendRequests();
}

// Make functions globally available for onclick handlers
window.togglePassword = togglePassword;