// Chat functionality
function initChat() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Message Input Handler
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        } else {
            handleTyping();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
    });

    sendButton.addEventListener('click', sendMessage);
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    if (!content || !currentChatUser) return;

    socket.emit('send-message', {
        receiverId: currentChatUser.id,
        content
    });

    messageInput.value = '';
    messageInput.style.height = 'auto';
    stopTyping();
}

function handleTyping() {
    if (!currentChatUser) return;
    
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', {
            receiverId: currentChatUser.id,
            isTyping: true
        });
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        stopTyping();
    }, 1000);
}

function stopTyping() {
    if (isTyping && currentChatUser) {
        isTyping = false;
        socket.emit('typing', {
            receiverId: currentChatUser.id,
            isTyping: false
        });
    }
}

async function selectFriend(friend) {
    currentChatUser = friend;
    
    // Update UI
    const noChatSelected = document.getElementById('noChatSelected');
    const chatInterface = document.getElementById('chatInterface');
    const chatUserAvatar = document.getElementById('chatUserAvatar');
    const chatUsername = document.getElementById('chatUsername');
    const chatUserStatus = document.getElementById('chatUserStatus');
    const chatStatusIndicator = document.getElementById('chatStatusIndicator');
    
    noChatSelected.style.display = 'none';
    chatInterface.style.display = 'flex';
    
    chatUserAvatar.src = friend.avatar;
    chatUsername.textContent = friend.username;
    chatUserStatus.textContent = friend.status === 'online' ? 'Online' : 
        `Last seen ${formatTime(friend.lastSeen)}`;
    chatStatusIndicator.className = `status-indicator ${friend.status}`;
    
    // Update active friend in sidebar
    updateFriendsList();
    
    // Load messages
    await loadMessages(friend.id);
    
    // Mark messages as read
    socket.emit('mark-messages-read', { senderId: friend.id });
}

async function loadMessages(friendId) {
    try {
        const response = await fetch(`${apiUrl}/messages/${friendId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const loadedMessages = await response.json();
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = '';
            loadedMessages.forEach(message => {
                displayMessage(message);
            });
            scrollToBottom();
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

function displayMessage(message, isOwn = null) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    const isOwnMessage = isOwn !== null ? isOwn : 
        (message.sender._id || message.sender) === currentUser.id;
    
    messageDiv.className = `message ${isOwnMessage ? 'own' : ''}`;
    
    const timestamp = new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${escapeHtml(message.content)}</div>
            <div class="message-footer">
                <span class="message-time">${timestamp}</span>
                ${isOwnMessage ? '<i class="message-status fas fa-check"></i>' : ''}
            </div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!document.getElementById('typingIndicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="typing-bubble">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Make functions globally available
window.selectFriend = selectFriend;