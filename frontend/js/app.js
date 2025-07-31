// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initAuth();
    initFriends();
    initChat();
    
    // Try restoring session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showApp();
            authenticateSocket();
        } catch (e) {
            console.error('Failed to parse saved user:', e);
            localStorage.removeItem('currentUser');
            showAuth();
        }
    } else {
        showAuth();
    }
});