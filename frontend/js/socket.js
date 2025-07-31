// Socket.IO Event Handlers
function authenticateSocket() {
    if (currentUser && currentUser.token) {
        socket.emit('authenticate', currentUser.token);
    }
}

// Socket event listeners
socket.on('authenticated', async () => {
    console.log('Socket authenticated');
    await loadFriends();
});

socket.on('authentication-error', () => {
    showError('Authentication failed. Please login again.');
    showAuth();
});

socket.on('new-message', (message) => {
    if (currentChatUser && 
        (message.sender._id === currentChatUser.id || message.receiver === currentChatUser.id)) {
        displayMessage(message);
        scrollToBottom();
        
        // Mark as read if from current chat user
        if (message.sender._id === currentChatUser.id) {
            socket.emit('mark-messages-read', { senderId: currentChatUser.id });
        }
    }
    
    // Update friend list to show unread indicator
    updateFriendsList();
});

socket.on('message-sent', (message) => {
    if (currentChatUser && message.receiver === currentChatUser.id) {
        displayMessage(message, true);
        scrollToBottom();
    }
});

socket.on('user-typing', (data) => {
    if (currentChatUser && data.userId === currentChatUser.id) {
        if (data.isTyping) {
            showTypingIndicator();
        } else {
            hideTypingIndicator();
        }
    }
});

socket.on('friend-online', (data) => {
    const friend = friends.find(f => f.id === data.userId);
    if (friend) {
        friend.status = 'online';
        updateFriendsList();
        
        if (currentChatUser && currentChatUser.id === data.userId) {
            const chatUserStatus = document.getElementById('chatUserStatus');
            const chatStatusIndicator = document.getElementById('chatStatusIndicator');
            chatUserStatus.textContent = 'Online';
            chatStatusIndicator.className = 'status-indicator online';
        }
    }
});

socket.on('friend-offline', (data) => {
    const friend = friends.find(f => f.id === data.userId);
    if (friend) {
        friend.status = 'offline';
        friend.lastSeen = data.lastSeen;
        updateFriendsList();
        
        if (currentChatUser && currentChatUser.id === data.userId) {
            const chatUserStatus = document.getElementById('chatUserStatus');
            const chatStatusIndicator = document.getElementById('chatStatusIndicator');
            chatUserStatus.textContent = 'Last seen ' + formatTime(data.lastSeen);
            chatStatusIndicator.className = 'status-indicator offline';
        }
    }
});

socket.on('friend-request', (data) => {
    showToast(`${data.from.username} sent you a friend request!`, 'success');
    loadFriendRequests(); // Update badge
});

socket.on('friend-accepted', (data) => {
    showToast(`${data.user.username} accepted your friend request!`, 'success');
    friends.push(data.user);
    updateFriendsList();
    updateFriendsCount();
});